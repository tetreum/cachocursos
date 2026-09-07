import { mulberry32, sampleIndex, type Rng } from '$utils/rng';
import { softmax } from './sampling';

export interface TrainerConfig {
	learningRate: number;
	embeddingSize: number;
	hiddenSize: number;
	batchSize: number;
	seed: number;
}

export interface TrainStep {
	step: number;
	loss: number;
	gradientNorm: number;
	diverged: boolean;
}

export const DEFAULT_TRAINER: TrainerConfig = {
	learningRate: 0.5,
	embeddingSize: 12,
	hiddenSize: 24,
	batchSize: 32,
	seed: 7
};

const DIVERGENCE_MULTIPLE = 2.5;
const INITIAL_SCALE = 0.4;

export interface Trainer {
	readonly config: TrainerConfig;
	readonly parameterCount: number;
	readonly step: number;
	readonly diverged: boolean;
	readonly uniformLoss: number;
	runStep(): TrainStep;
	run(steps: number): TrainStep[];
	logitsFor(tokenId: number): Float64Array;
	sample(seedId: number, length: number, temperature: number, random: Rng): number[];
	evaluate(): number;
	reset(overrides?: Partial<TrainerConfig>): void;
}

export function createTrainer(
	inputIds: Int32Array,
	vocabSize: number,
	config: TrainerConfig = DEFAULT_TRAINER
): Trainer {
	let current = { ...config };

	let embedding = new Float64Array(0);
	let hiddenWeights = new Float64Array(0);
	let hiddenBias = new Float64Array(0);
	let outputWeights = new Float64Array(0);
	let outputBias = new Float64Array(0);
	let random: Rng = mulberry32(current.seed);
	let stepCount = 0;
	let hasDiverged = false;

	const uniformLoss = Math.log(vocabSize);
	const divergenceLimit = DIVERGENCE_MULTIPLE * uniformLoss;

	function initialise(): void {
		random = mulberry32(current.seed);
		const { embeddingSize, hiddenSize } = current;
		embedding = new Float64Array(vocabSize * embeddingSize);
		hiddenWeights = new Float64Array(embeddingSize * hiddenSize);
		hiddenBias = new Float64Array(hiddenSize);
		outputWeights = new Float64Array(hiddenSize * vocabSize);
		outputBias = new Float64Array(vocabSize);

		for (let index = 0; index < embedding.length; index += 1) {
			embedding[index] = (random() - 0.5) * INITIAL_SCALE;
		}
		for (let index = 0; index < hiddenWeights.length; index += 1) {
			hiddenWeights[index] = (random() - 0.5) * INITIAL_SCALE;
		}
		for (let index = 0; index < outputWeights.length; index += 1) {
			outputWeights[index] = (random() - 0.5) * INITIAL_SCALE;
		}
		stepCount = 0;
		hasDiverged = false;
	}

	function forward(tokenId: number): {
		hidden: Float64Array;
		logits: Float64Array;
	} {
		const { embeddingSize, hiddenSize } = current;
		const hidden = new Float64Array(hiddenSize);

		for (let unit = 0; unit < hiddenSize; unit += 1) {
			let total = hiddenBias[unit];
			for (let axis = 0; axis < embeddingSize; axis += 1) {
				total +=
					embedding[tokenId * embeddingSize + axis] * hiddenWeights[axis * hiddenSize + unit];
			}
			hidden[unit] = Math.tanh(total);
		}

		const logits = new Float64Array(vocabSize);
		for (let target = 0; target < vocabSize; target += 1) {
			let total = outputBias[target];
			for (let unit = 0; unit < hiddenSize; unit += 1) {
				total += hidden[unit] * outputWeights[unit * vocabSize + target];
			}
			logits[target] = total;
		}

		return { hidden, logits };
	}

	function runStep(): TrainStep {
		const { embeddingSize, hiddenSize, batchSize, learningRate } = current;
		const pairs = inputIds.length - 1;

		const embeddingGradient = new Float64Array(embedding.length);
		const hiddenWeightGradient = new Float64Array(hiddenWeights.length);
		const hiddenBiasGradient = new Float64Array(hiddenBias.length);
		const outputWeightGradient = new Float64Array(outputWeights.length);
		const outputBiasGradient = new Float64Array(outputBias.length);

		let totalLoss = 0;

		for (let item = 0; item < batchSize; item += 1) {
			const position = Math.floor(random() * pairs);
			const inputId = inputIds[position];
			const targetId = inputIds[position + 1];

			const { hidden, logits } = forward(inputId);
			const probabilities = softmax(logits);
			totalLoss -= Math.log(Math.max(probabilities[targetId], 1e-12));

			const logitGradient = new Float64Array(vocabSize);
			for (let target = 0; target < vocabSize; target += 1) {
				logitGradient[target] = probabilities[target] - (target === targetId ? 1 : 0);
			}

			const hiddenGradient = new Float64Array(hiddenSize);
			for (let unit = 0; unit < hiddenSize; unit += 1) {
				let accumulated = 0;
				for (let target = 0; target < vocabSize; target += 1) {
					const gradient = logitGradient[target];
					outputWeightGradient[unit * vocabSize + target] += hidden[unit] * gradient;
					accumulated += outputWeights[unit * vocabSize + target] * gradient;
				}
				hiddenGradient[unit] = accumulated * (1 - hidden[unit] * hidden[unit]);
			}
			for (let target = 0; target < vocabSize; target += 1) {
				outputBiasGradient[target] += logitGradient[target];
			}

			for (let unit = 0; unit < hiddenSize; unit += 1) {
				hiddenBiasGradient[unit] += hiddenGradient[unit];
				for (let axis = 0; axis < embeddingSize; axis += 1) {
					hiddenWeightGradient[axis * hiddenSize + unit] +=
						embedding[inputId * embeddingSize + axis] * hiddenGradient[unit];
					embeddingGradient[inputId * embeddingSize + axis] +=
						hiddenWeights[axis * hiddenSize + unit] * hiddenGradient[unit];
				}
			}
		}

		let gradientNorm = 0;
		const applyGradient = (target: Float64Array, gradient: Float64Array): void => {
			for (let index = 0; index < target.length; index += 1) {
				const value = gradient[index] / batchSize;
				gradientNorm += value * value;
				target[index] -= learningRate * value;
			}
		};

		applyGradient(embedding, embeddingGradient);
		applyGradient(hiddenWeights, hiddenWeightGradient);
		applyGradient(hiddenBias, hiddenBiasGradient);
		applyGradient(outputWeights, outputWeightGradient);
		applyGradient(outputBias, outputBiasGradient);

		stepCount += 1;
		const loss = totalLoss / batchSize;
		if (!Number.isFinite(loss) || loss > divergenceLimit) hasDiverged = true;

		return {
			step: stepCount,
			loss,
			gradientNorm: Math.sqrt(gradientNorm),
			diverged: hasDiverged
		};
	}

	initialise();

	return {
		get config() {
			return current;
		},
		get parameterCount() {
			return (
				embedding.length +
				hiddenWeights.length +
				hiddenBias.length +
				outputWeights.length +
				outputBias.length
			);
		},
		get step() {
			return stepCount;
		},
		get diverged() {
			return hasDiverged;
		},
		get uniformLoss() {
			return uniformLoss;
		},
		runStep,
		run(steps: number): TrainStep[] {
			const trace: TrainStep[] = [];
			for (let index = 0; index < steps; index += 1) {
				trace.push(runStep());
				if (hasDiverged) break;
			}
			return trace;
		},
		logitsFor(tokenId: number): Float64Array {
			return forward(tokenId).logits;
		},
		sample(seedId: number, length: number, temperature: number, sampler: Rng): number[] {
			const produced: number[] = [];
			let currentId = seedId;
			for (let index = 0; index < length; index += 1) {
				if (hasDiverged) break;
				const probabilities = softmax(forward(currentId).logits, temperature);
				currentId = sampleIndex(probabilities, sampler);
				produced.push(currentId);
			}
			return produced;
		},
		evaluate(): number {
			const pairs = inputIds.length - 1;
			let totalLoss = 0;
			for (let position = 0; position < pairs; position += 1) {
				const probabilities = softmax(forward(inputIds[position]).logits);
				totalLoss -= Math.log(Math.max(probabilities[inputIds[position + 1]], 1e-12));
			}
			return totalLoss / pairs;
		},
		reset(overrides: Partial<TrainerConfig> = {}): void {
			current = { ...current, ...overrides };
			initialise();
		}
	};
}
