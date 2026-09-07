import { describe, it, expect } from 'vitest';
import {
	detect,
	greenMask,
	generateWatermarked,
	DEFAULT_WATERMARK,
	DETECTION_THRESHOLD
} from './watermark';
import { mulberry32 } from '$utils/rng';

const VOCAB_SIZE = 128;
const LENGTH = 200;
const flatLogits = (): Float64Array => new Float64Array(VOCAB_SIZE);

const marked = (key: number): number[] =>
	generateWatermarked({
		vocabSize: VOCAB_SIZE,
		logitsAt: flatLogits,
		seedContext: [0],
		length: LENGTH,
		config: { ...DEFAULT_WATERMARK, key },
		sampling: { temperature: 1 },
		random: mulberry32(3)
	}).ids;

describe('what detection actually requires', () => {
	describe('WHEN the green list is built', () => {
		it('should depend only on the previous token and the key, never on the logits', () => {
			const fromCalm = greenMask(42, VOCAB_SIZE, DEFAULT_WATERMARK);
			const fromSame = greenMask(42, VOCAB_SIZE, DEFAULT_WATERMARK);

			expect(Array.from(fromCalm)).toEqual(Array.from(fromSame));
		});
	});

	describe('WHEN one vendor inspects another vendor text', () => {
		it('should find nothing, because the key differs', () => {
			const vendorA = marked(15485863);

			const byVendorB = detect(vendorA, VOCAB_SIZE, { ...DEFAULT_WATERMARK, key: 90238859 });

			expect(Math.abs(byVendorB.z)).toBeLessThan(DETECTION_THRESHOLD);
		});

		it('should find it clearly with the right key', () => {
			const vendorA = marked(15485863);

			const byVendorA = detect(vendorA, VOCAB_SIZE, DEFAULT_WATERMARK);

			expect(byVendorA.z).toBeGreaterThan(DETECTION_THRESHOLD);
		});

		it('should stay near zero on average across many wrong keys', () => {
			const vendorA = marked(15485863);
			const keys = [7, 101, 3571, 90238859, 15485867, 122713, 555557];

			const scores = keys.map(
				(key) => detect(vendorA, VOCAB_SIZE, { ...DEFAULT_WATERMARK, key }).z
			);
			const mean = scores.reduce((total, value) => total + value, 0) / scores.length;

			expect(Math.abs(mean)).toBeLessThan(1);
			for (const score of scores) expect(score).toBeLessThan(DETECTION_THRESHOLD);
		});
	});
});
