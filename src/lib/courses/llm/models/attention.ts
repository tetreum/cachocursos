import { softmax } from './sampling';

export interface AttentionResult {
	weights: Float64Array;
	output: Float64Array;
}

const LN_TWO = Math.LN2;
const EPSILON = 1e-12;

export function causalMask(length: number, position: number): boolean[] {
	const mask: boolean[] = [];
	for (let index = 0; index < length; index += 1) mask.push(index <= position);
	return mask;
}

export function scaledDotAttention(
	query: ArrayLike<number>,
	keys: readonly ArrayLike<number>[],
	values: readonly ArrayLike<number>[],
	mask?: readonly boolean[]
): AttentionResult {
	const scale = Math.sqrt(query.length);
	const scores = new Float64Array(keys.length);

	for (let index = 0; index < keys.length; index += 1) {
		if (mask !== undefined && !mask[index]) {
			scores[index] = -Infinity;
			continue;
		}
		let dot = 0;
		for (let axis = 0; axis < query.length; axis += 1) dot += query[axis] * keys[index][axis];
		scores[index] = dot / scale;
	}

	const weights = softmax(scores);
	const valueLength = values.length > 0 ? values[0].length : 0;
	const output = new Float64Array(valueLength);

	for (let index = 0; index < values.length; index += 1) {
		for (let axis = 0; axis < valueLength; axis += 1) {
			output[axis] += weights[index] * values[index][axis];
		}
	}

	return { weights, output };
}

export function normalizeAllocation(raw: readonly number[]): Float64Array {
	const result = new Float64Array(raw.length);
	let total = 0;
	for (let index = 0; index < raw.length; index += 1) {
		const value = Math.max(0, raw[index]);
		result[index] = value;
		total += value;
	}
	if (total <= 0) {
		result.fill(1 / Math.max(1, raw.length));
		return result;
	}
	for (let index = 0; index < result.length; index += 1) result[index] /= total;
	return result;
}

export function klDivergence(left: ArrayLike<number>, right: ArrayLike<number>): number {
	let total = 0;
	for (let index = 0; index < left.length; index += 1) {
		if (left[index] <= EPSILON) continue;
		total += left[index] * Math.log(left[index] / Math.max(right[index], EPSILON));
	}
	return total;
}

export function jsDivergence(left: ArrayLike<number>, right: ArrayLike<number>): number {
	const mixture = new Float64Array(left.length);
	for (let index = 0; index < left.length; index += 1) {
		mixture[index] = 0.5 * (left[index] + right[index]);
	}
	return 0.5 * klDivergence(left, mixture) + 0.5 * klDivergence(right, mixture);
}

export function allocationScore(allocation: readonly number[], gold: readonly number[]): number {
	const normalized = normalizeAllocation(allocation);
	const divergence = jsDivergence(normalized, gold) / LN_TWO;
	return Math.max(0, 1 - divergence);
}

export interface AttentionPuzzle {
	id: string;
	sentence: string;
	tokens: readonly string[];
	queryIndex: number;
	gold: readonly number[];
	answerIndex: number;
	distractorIndex: number;
	explanation: string;
}

export function resolveReference(puzzle: AttentionPuzzle, allocation: readonly number[]): number {
	const normalized = normalizeAllocation(allocation);
	let best = 0;
	for (let index = 1; index < normalized.length; index += 1) {
		if (index === puzzle.queryIndex) continue;
		if (normalized[index] > normalized[best] || best === puzzle.queryIndex) best = index;
	}
	return best;
}
