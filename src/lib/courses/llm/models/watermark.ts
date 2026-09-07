import { hash32, mulberry32, shuffledIndices, sampleIndex, type Rng } from '$utils/rng';
import { distribution, type SamplingParams } from './sampling';

export interface WatermarkConfig {
	gamma: number;
	delta: number;
	key: number;
}

export interface DetectionResult {
	total: number;
	greenCount: number;
	expected: number;
	z: number;
	pValue: number;
	perToken: Uint8Array;
}

export const DEFAULT_WATERMARK: WatermarkConfig = { gamma: 0.25, delta: 2, key: 15485863 };

export const DETECTION_THRESHOLD = 4;

const ERF_A1 = 0.254829592;
const ERF_A2 = -0.284496736;
const ERF_A3 = 1.421413741;
const ERF_A4 = -1.453152027;
const ERF_A5 = 1.061405429;
const ERF_P = 0.3275911;
const SQRT_TWO = Math.SQRT2;

function erf(value: number): number {
	const sign = value < 0 ? -1 : 1;
	const absolute = Math.abs(value);
	const t = 1 / (1 + ERF_P * absolute);
	const polynomial = ((((ERF_A5 * t + ERF_A4) * t + ERF_A3) * t + ERF_A2) * t + ERF_A1) * t;
	return sign * (1 - polynomial * Math.exp(-absolute * absolute));
}

export function normalCdf(z: number): number {
	return 0.5 * (1 + erf(z / SQRT_TWO));
}

export function greenSize(vocabSize: number, gamma: number): number {
	return Math.max(1, Math.floor(gamma * vocabSize));
}

export function greenMask(
	previousToken: number,
	vocabSize: number,
	config: WatermarkConfig
): Uint8Array {
	const mask = new Uint8Array(vocabSize);
	const random: Rng = mulberry32(hash32(previousToken, config.key));
	const order = shuffledIndices(vocabSize, random);
	const size = greenSize(vocabSize, config.gamma);
	for (let rank = 0; rank < size; rank += 1) mask[order[rank]] = 1;
	return mask;
}

export function isGreen(
	previousToken: number,
	token: number,
	vocabSize: number,
	config: WatermarkConfig
): boolean {
	return greenMask(previousToken, vocabSize, config)[token] === 1;
}

export function biasLogits(
	logits: ArrayLike<number>,
	mask: Uint8Array,
	delta: number
): Float64Array {
	const biased = new Float64Array(logits.length);
	for (let id = 0; id < logits.length; id += 1) {
		biased[id] = logits[id] + (mask[id] === 1 ? delta : 0);
	}
	return biased;
}

export interface WatermarkedGeneration {
	ids: number[];
	greenFlags: Uint8Array;
}

export function generateWatermarked(options: {
	vocabSize: number;
	logitsAt: (context: readonly number[]) => Float64Array;
	seedContext: readonly number[];
	length: number;
	config: WatermarkConfig;
	sampling: SamplingParams;
	random: Rng;
}): WatermarkedGeneration {
	const { vocabSize, logitsAt, seedContext, length, config, sampling, random } = options;
	const produced: number[] = [];
	const greenFlags = new Uint8Array(length);
	const context = [...seedContext];

	for (let step = 0; step < length; step += 1) {
		const previousToken = context[context.length - 1] ?? 0;
		const mask = greenMask(previousToken, vocabSize, config);
		const biased = biasLogits(logitsAt(context), mask, config.delta);
		const chosen = sampleIndex(distribution(biased, sampling), random);
		greenFlags[step] = mask[chosen];
		produced.push(chosen);
		context.push(chosen);
	}

	return { ids: produced, greenFlags };
}

export function detect(
	ids: readonly number[],
	vocabSize: number,
	config: WatermarkConfig
): DetectionResult {
	const scored = Math.max(0, ids.length - 1);
	const perToken = new Uint8Array(ids.length);
	let greenCount = 0;

	for (let position = 1; position < ids.length; position += 1) {
		const mask = greenMask(ids[position - 1], vocabSize, config);
		const green = mask[ids[position]] === 1 ? 1 : 0;
		perToken[position] = green;
		greenCount += green;
	}

	const expected = config.gamma * scored;
	const variance = scored * config.gamma * (1 - config.gamma);
	const z = variance <= 0 ? 0 : (greenCount - expected) / Math.sqrt(variance);

	return {
		total: scored,
		greenCount,
		expected,
		z,
		pValue: 1 - normalCdf(z),
		perToken
	};
}

export function isDetected(result: DetectionResult, threshold = DETECTION_THRESHOLD): boolean {
	return result.z >= threshold;
}

export interface AttackComparison {
	before: DetectionResult;
	after: DetectionResult;
	edited: number;
	evaded: boolean;
}

export function compareAttack(
	original: readonly number[],
	edited: readonly number[],
	vocabSize: number,
	config: WatermarkConfig,
	threshold = DETECTION_THRESHOLD
): AttackComparison {
	const before = detect(original, vocabSize, config);
	const after = detect(edited, vocabSize, config);

	let changed = 0;
	const shortest = Math.min(original.length, edited.length);
	for (let position = 0; position < shortest; position += 1) {
		if (original[position] !== edited[position]) changed += 1;
	}
	changed += Math.abs(original.length - edited.length);

	return { before, after, edited: changed, evaded: after.z < threshold };
}
