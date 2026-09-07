import { mulberry32 } from '$utils/rng';

export interface GradientProbe {
	depth: number;
	residual: boolean;
	normPerLayer: Float64Array;
	firstLayerNorm: number;
	outputNorm: number;
}

export interface ProbeOptions {
	depth: number;
	width?: number;
	residual: boolean;
	seed?: number;
}

const DEFAULT_WIDTH = 16;
const DEFAULT_SEED = 5;

function norm(values: Float64Array): number {
	let total = 0;
	for (let index = 0; index < values.length; index += 1) total += values[index] * values[index];
	return Math.sqrt(total);
}

export function probeGradientFlow(options: ProbeOptions): GradientProbe {
	const { depth, residual } = options;
	const width = options.width ?? DEFAULT_WIDTH;
	const random = mulberry32(options.seed ?? DEFAULT_SEED);
	const scale = 1 / Math.sqrt(width);

	const layers: Float64Array[] = [];
	for (let layer = 0; layer < depth; layer += 1) {
		const weights = new Float64Array(width * width);
		for (let index = 0; index < weights.length; index += 1) {
			weights[index] = (random() * 2 - 1) * scale;
		}
		layers.push(weights);
	}

	let activation = new Float64Array(width);
	for (let unit = 0; unit < width; unit += 1) activation[unit] = random() * 2 - 1;

	const activations: Float64Array[] = [activation];
	const preActivations: Float64Array[] = [];

	for (let layer = 0; layer < depth; layer += 1) {
		const weights = layers[layer];
		const preActivation = new Float64Array(width);
		for (let row = 0; row < width; row += 1) {
			let total = 0;
			for (let column = 0; column < width; column += 1) {
				total += weights[row * width + column] * activation[column];
			}
			preActivation[row] = total;
		}

		const next = new Float64Array(width);
		for (let unit = 0; unit < width; unit += 1) {
			const transformed = Math.tanh(preActivation[unit]);
			next[unit] = residual ? activation[unit] + transformed : transformed;
		}

		preActivations.push(preActivation);
		activations.push(next);
		activation = next;
	}

	let gradient = new Float64Array(width);
	for (let unit = 0; unit < width; unit += 1) gradient[unit] = 1;

	const normPerLayer = new Float64Array(depth + 1);
	normPerLayer[depth] = norm(gradient);

	for (let layer = depth - 1; layer >= 0; layer -= 1) {
		const weights = layers[layer];
		const preActivation = preActivations[layer];

		const throughTanh = new Float64Array(width);
		for (let unit = 0; unit < width; unit += 1) {
			const tanhValue = Math.tanh(preActivation[unit]);
			throughTanh[unit] = gradient[unit] * (1 - tanhValue * tanhValue);
		}

		const next = new Float64Array(width);
		for (let column = 0; column < width; column += 1) {
			let total = 0;
			for (let row = 0; row < width; row += 1) {
				total += weights[row * width + column] * throughTanh[row];
			}
			next[column] = residual ? total + gradient[column] : total;
		}

		gradient = next;
		normPerLayer[layer] = norm(gradient);
	}

	return {
		depth,
		residual,
		normPerLayer,
		firstLayerNorm: normPerLayer[0],
		outputNorm: normPerLayer[depth]
	};
}

export function relativeSignal(probe: GradientProbe): Float64Array {
	const reference = probe.outputNorm === 0 ? 1 : probe.outputNorm;
	const relative = new Float64Array(probe.normPerLayer.length);
	for (let index = 0; index < relative.length; index += 1) {
		relative[index] = probe.normPerLayer[index] / reference;
	}
	return relative;
}
