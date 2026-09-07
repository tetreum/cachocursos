import { sampleIndex, type Rng } from '$utils/rng';

export interface SamplingParams {
	temperature: number;
	topK?: number;
	topP?: number;
}

export interface SamplingTrace {
	base: Float64Array;
	tempered: Float64Array;
	final: Float64Array;
	keptByTopK: Uint8Array;
	keptByTopP: Uint8Array;
	nucleusSize: number;
	entropy: number;
}

const MINIMUM_TEMPERATURE = 1e-6;

export function softmax(logits: ArrayLike<number>, temperature = 1): Float64Array {
	const result = new Float64Array(logits.length);
	if (logits.length === 0) return result;

	if (temperature <= MINIMUM_TEMPERATURE) {
		let bestIndex = 0;
		for (let index = 1; index < logits.length; index += 1) {
			if (logits[index] > logits[bestIndex]) bestIndex = index;
		}
		result[bestIndex] = 1;
		return result;
	}

	let largest = -Infinity;
	for (let index = 0; index < logits.length; index += 1) {
		const scaled = logits[index] / temperature;
		if (scaled > largest) largest = scaled;
	}

	let total = 0;
	for (let index = 0; index < logits.length; index += 1) {
		const exponentiated = Math.exp(logits[index] / temperature - largest);
		result[index] = exponentiated;
		total += exponentiated;
	}
	for (let index = 0; index < result.length; index += 1) result[index] /= total;
	return result;
}

export function entropy(probabilities: ArrayLike<number>): number {
	let total = 0;
	for (let index = 0; index < probabilities.length; index += 1) {
		const probability = probabilities[index];
		if (probability > 0) total -= probability * Math.log(probability);
	}
	return total;
}

function renormalized(values: Float64Array): Float64Array {
	let total = 0;
	for (let index = 0; index < values.length; index += 1) total += values[index];
	if (total === 0) return values;
	for (let index = 0; index < values.length; index += 1) values[index] /= total;
	return values;
}

function indicesByDescendingProbability(probabilities: ArrayLike<number>): number[] {
	const order: number[] = [];
	for (let index = 0; index < probabilities.length; index += 1) order.push(index);
	order.sort((left, right) => {
		const difference = probabilities[right] - probabilities[left];
		return difference !== 0 ? difference : left - right;
	});
	return order;
}

export function topK(probabilities: ArrayLike<number>, limit: number): Float64Array {
	const result = new Float64Array(probabilities.length);
	if (limit >= probabilities.length) {
		for (let index = 0; index < probabilities.length; index += 1)
			result[index] = probabilities[index];
		return renormalized(result);
	}
	const kept = Math.max(1, Math.floor(limit));
	const order = indicesByDescendingProbability(probabilities);
	for (let rank = 0; rank < kept; rank += 1) {
		const index = order[rank];
		result[index] = probabilities[index];
	}
	return renormalized(result);
}

export function topP(probabilities: ArrayLike<number>, mass: number): Float64Array {
	const result = new Float64Array(probabilities.length);
	if (mass >= 1) {
		for (let index = 0; index < probabilities.length; index += 1)
			result[index] = probabilities[index];
		return renormalized(result);
	}
	const order = indicesByDescendingProbability(probabilities);
	let cumulative = 0;
	for (let rank = 0; rank < order.length; rank += 1) {
		const index = order[rank];
		result[index] = probabilities[index];
		cumulative += probabilities[index];
		if (cumulative >= mass) break;
	}
	return renormalized(result);
}

export function distribution(logits: ArrayLike<number>, params: SamplingParams): Float64Array {
	let current = softmax(logits, params.temperature);
	if (params.topK !== undefined && params.topK > 0) current = topK(current, params.topK);
	if (params.topP !== undefined && params.topP < 1) current = topP(current, params.topP);
	return current;
}

export function sampleToken(
	logits: ArrayLike<number>,
	params: SamplingParams,
	random: Rng
): number {
	return sampleIndex(distribution(logits, params), random);
}

export function traceSampling(logits: ArrayLike<number>, params: SamplingParams): SamplingTrace {
	const base = softmax(logits, 1);
	const tempered = softmax(logits, params.temperature);

	const afterTopK =
		params.topK !== undefined && params.topK > 0 ? topK(tempered, params.topK) : tempered;
	const afterTopP =
		params.topP !== undefined && params.topP < 1 ? topP(afterTopK, params.topP) : afterTopK;

	const keptByTopK = new Uint8Array(tempered.length);
	const keptByTopP = new Uint8Array(tempered.length);
	let nucleusSize = 0;
	for (let index = 0; index < tempered.length; index += 1) {
		keptByTopK[index] = afterTopK[index] > 0 ? 1 : 0;
		keptByTopP[index] = afterTopP[index] > 0 ? 1 : 0;
		if (keptByTopP[index] === 1) nucleusSize += 1;
	}

	return {
		base,
		tempered,
		final: afterTopP,
		keptByTopK,
		keptByTopP,
		nucleusSize,
		entropy: entropy(afterTopP)
	};
}
