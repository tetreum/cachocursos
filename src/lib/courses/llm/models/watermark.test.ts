import { describe, it, expect } from 'vitest';
import {
	greenMask,
	greenSize,
	biasLogits,
	detect,
	normalCdf,
	generateWatermarked,
	compareAttack,
	isDetected,
	DEFAULT_WATERMARK,
	DETECTION_THRESHOLD,
	type WatermarkConfig
} from './watermark';
import { mulberry32 } from '$utils/rng';

const VOCAB_SIZE = 64;
const SEQUENCE_LENGTH = 200;

const flatLogits = (): Float64Array => new Float64Array(VOCAB_SIZE);

function randomSequence(length: number, seed: number): number[] {
	const random = mulberry32(seed);
	const ids: number[] = [];
	for (let position = 0; position < length; position += 1) {
		ids.push(Math.floor(random() * VOCAB_SIZE));
	}
	return ids;
}

function watermarkedSequence(config: WatermarkConfig, seed: number): number[] {
	return generateWatermarked({
		vocabSize: VOCAB_SIZE,
		logitsAt: flatLogits,
		seedContext: [0],
		length: SEQUENCE_LENGTH,
		config,
		sampling: { temperature: 1 },
		random: mulberry32(seed)
	}).ids;
}

describe('watermark helpers', () => {
	describe('WHEN I build a green list', () => {
		it('should mark exactly floor(gamma * vocabSize) tokens as green', () => {
			const mask = greenMask(7, VOCAB_SIZE, DEFAULT_WATERMARK);

			const greens = mask.reduce((total, flag) => total + flag, 0);
			expect(greens).toBe(greenSize(VOCAB_SIZE, DEFAULT_WATERMARK.gamma));
			expect(greens).toBe(16);
		});

		it('should be deterministic for the same previous token and key', () => {
			const first = greenMask(7, VOCAB_SIZE, DEFAULT_WATERMARK);
			const second = greenMask(7, VOCAB_SIZE, DEFAULT_WATERMARK);

			expect(Array.from(first)).toEqual(Array.from(second));
		});

		it('should differ for a different previous token', () => {
			const first = greenMask(7, VOCAB_SIZE, DEFAULT_WATERMARK);
			const second = greenMask(8, VOCAB_SIZE, DEFAULT_WATERMARK);

			expect(Array.from(first)).not.toEqual(Array.from(second));
		});

		it('should differ for a different secret key', () => {
			const first = greenMask(7, VOCAB_SIZE, DEFAULT_WATERMARK);
			const second = greenMask(7, VOCAB_SIZE, { ...DEFAULT_WATERMARK, key: 999983 });

			expect(Array.from(first)).not.toEqual(Array.from(second));
		});

		it.each`
			gamma   | expected
			${0.25} | ${16}
			${0.5}  | ${32}
			${0.75} | ${48}
		`('should mark $expected tokens green for gamma $gamma', ({ gamma, expected }) => {
			const mask = greenMask(3, VOCAB_SIZE, { ...DEFAULT_WATERMARK, gamma: gamma as number });

			expect(mask.reduce((total, flag) => total + flag, 0)).toBe(expected);
		});
	});

	describe('WHEN I bias the logits', () => {
		it('should add delta only to green tokens', () => {
			const mask = new Uint8Array([1, 0, 1, 0]);
			const logits = [0, 0, 0, 0];

			const biased = biasLogits(logits, mask, 2);

			expect(Array.from(biased)).toEqual([2, 0, 2, 0]);
		});
	});

	describe('WHEN I detect on text without a watermark', () => {
		it('should produce a z-score near zero on average', () => {
			const samples = 40;
			let totalZ = 0;

			for (let seed = 0; seed < samples; seed += 1) {
				totalZ += detect(
					randomSequence(SEQUENCE_LENGTH, seed + 1),
					VOCAB_SIZE,
					DEFAULT_WATERMARK
				).z;
			}

			expect(Math.abs(totalZ / samples)).toBeLessThan(0.5);
		});

		it('should stay below the detection threshold', () => {
			const result = detect(randomSequence(SEQUENCE_LENGTH, 42), VOCAB_SIZE, DEFAULT_WATERMARK);

			expect(isDetected(result)).toBe(false);
		});
	});

	describe('WHEN I detect on watermarked text', () => {
		it('should exceed the detection threshold with the default delta', () => {
			const ids = watermarkedSequence(DEFAULT_WATERMARK, 7);

			const result = detect(ids, VOCAB_SIZE, DEFAULT_WATERMARK);

			expect(result.z).toBeGreaterThan(DETECTION_THRESHOLD);
		});

		it('should not be detectable when delta is zero', () => {
			const ids = watermarkedSequence({ ...DEFAULT_WATERMARK, delta: 0 }, 7);

			const result = detect(ids, VOCAB_SIZE, DEFAULT_WATERMARK);

			expect(result.z).toBeLessThan(DETECTION_THRESHOLD);
		});

		it('should not be detectable with the wrong key', () => {
			const ids = watermarkedSequence(DEFAULT_WATERMARK, 7);

			const result = detect(ids, VOCAB_SIZE, { ...DEFAULT_WATERMARK, key: 7919 });

			expect(result.z).toBeLessThan(DETECTION_THRESHOLD);
		});

		it('should grow more confident as delta increases', () => {
			const weak = detect(
				watermarkedSequence({ ...DEFAULT_WATERMARK, delta: 1 }, 3),
				VOCAB_SIZE,
				DEFAULT_WATERMARK
			);
			const strong = detect(
				watermarkedSequence({ ...DEFAULT_WATERMARK, delta: 5 }, 3),
				VOCAB_SIZE,
				DEFAULT_WATERMARK
			);

			expect(strong.z).toBeGreaterThan(weak.z);
		});
	});

	describe('WHEN I compute the z-score by hand', () => {
		it('should match the closed form for an all-green sequence', () => {
			const config = DEFAULT_WATERMARK;
			const ids = [0];
			for (let position = 0; position < 20; position += 1) {
				const mask = greenMask(ids[ids.length - 1], VOCAB_SIZE, config);
				ids.push(mask.findIndex((flag) => flag === 1));
			}

			const result = detect(ids, VOCAB_SIZE, config);

			const total = ids.length - 1;
			const expectedZ =
				(total - config.gamma * total) / Math.sqrt(total * config.gamma * (1 - config.gamma));
			expect(result.greenCount).toBe(total);
			expect(result.z).toBeCloseTo(expectedZ, 10);
		});

		it('should report a vanishing p-value for a strong detection', () => {
			const result = detect(
				watermarkedSequence(DEFAULT_WATERMARK, 11),
				VOCAB_SIZE,
				DEFAULT_WATERMARK
			);

			expect(result.pValue).toBeLessThan(0.001);
		});
	});

	describe('WHEN the normal CDF is evaluated', () => {
		it.each`
			z       | expected
			${0}    | ${0.5}
			${1}    | ${0.8413}
			${-1}   | ${0.1587}
			${1.96} | ${0.975}
		`('should return about $expected at z=$z', ({ z, expected }) => {
			expect(normalCdf(z as number)).toBeCloseTo(expected as number, 3);
		});
	});

	describe('WHEN an attacker edits the watermarked text', () => {
		it('should lower the z-score as more tokens are replaced', () => {
			const original = watermarkedSequence(DEFAULT_WATERMARK, 5);
			const random = mulberry32(99);
			const lightlyEdited = original.slice();
			const heavilyEdited = original.slice();

			for (let position = 0; position < original.length; position += 5) {
				lightlyEdited[position] = Math.floor(random() * VOCAB_SIZE);
			}
			for (let position = 0; position < original.length; position += 2) {
				heavilyEdited[position] = Math.floor(random() * VOCAB_SIZE);
			}

			const light = compareAttack(original, lightlyEdited, VOCAB_SIZE, DEFAULT_WATERMARK);
			const heavy = compareAttack(original, heavilyEdited, VOCAB_SIZE, DEFAULT_WATERMARK);

			expect(light.after.z).toBeLessThan(light.before.z);
			expect(heavy.after.z).toBeLessThan(light.after.z);
		});

		it('should count how many tokens were changed', () => {
			const original = [1, 2, 3, 4, 5];
			const edited = [1, 9, 3, 9, 5];

			const comparison = compareAttack(original, edited, VOCAB_SIZE, DEFAULT_WATERMARK);

			expect(comparison.edited).toBe(2);
		});
	});
});
