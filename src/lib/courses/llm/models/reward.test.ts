import { describe, it, expect } from 'vitest';
import {
	fitRewardModel,
	pairwiseAccuracy,
	dominantTraits,
	reward,
	bestResponseUnder,
	traitNamesOf,
	type Comparison,
	type Response
} from './reward';

const RESPONSES: Response[] = [
	{ id: 'a', text: 'corta y util', traits: { longitud: 0.1, utilidad: 1, adulacion: 0 } },
	{ id: 'b', text: 'larga y util', traits: { longitud: 1, utilidad: 1, adulacion: 0 } },
	{ id: 'c', text: 'corta e inutil', traits: { longitud: 0.1, utilidad: 0, adulacion: 0 } },
	{ id: 'd', text: 'larga e inutil', traits: { longitud: 1, utilidad: 0, adulacion: 0 } },
	{ id: 'e', text: 'larga y aduladora', traits: { longitud: 1, utilidad: 0, adulacion: 1 } }
];

const PREFERS_USEFUL: Comparison[] = [
	{ chosen: 'a', rejected: 'c' },
	{ chosen: 'b', rejected: 'd' },
	{ chosen: 'a', rejected: 'd' },
	{ chosen: 'b', rejected: 'c' }
];

const PREFERS_LONG: Comparison[] = [
	{ chosen: 'b', rejected: 'a' },
	{ chosen: 'd', rejected: 'c' },
	{ chosen: 'e', rejected: 'a' },
	{ chosen: 'd', rejected: 'a' }
];

describe('reward helpers', () => {
	describe('WHEN I collect the trait names', () => {
		it('should return them sorted and deduplicated', () => {
			expect(traitNamesOf(RESPONSES)).toEqual(['adulacion', 'longitud', 'utilidad']);
		});
	});

	describe('WHEN the rankings are separable', () => {
		it('should reach full accuracy on the comparisons it was fitted on', () => {
			const model = fitRewardModel(RESPONSES, PREFERS_USEFUL);

			expect(pairwiseAccuracy(model, RESPONSES, PREFERS_USEFUL)).toBe(1);
		});

		it('should drive the loss down', () => {
			const model = fitRewardModel(RESPONSES, PREFERS_USEFUL);

			const first = model.lossTrace[0];
			const last = model.lossTrace[model.lossTrace.length - 1];
			expect(last).toBeLessThan(first);
		});
	});

	describe('WHEN the labeller consistently prefers longer answers', () => {
		it('should learn length as the dominant trait', () => {
			const model = fitRewardModel(RESPONSES, PREFERS_LONG);

			expect(dominantTraits(model)[0].trait).toBe('longitud');
		});

		it('should reward a long useless answer over a short useful one', () => {
			const model = fitRewardModel(RESPONSES, PREFERS_LONG);

			const longUseless = reward(model.weights, RESPONSES[3], model.traitNames);
			const shortUseful = reward(model.weights, RESPONSES[0], model.traitNames);

			expect(longUseless).toBeGreaterThan(shortUseful);
		});

		it('should pick a long answer when over-optimised', () => {
			const model = fitRewardModel(RESPONSES, PREFERS_LONG);

			expect(bestResponseUnder(model, RESPONSES)?.traits.longitud).toBe(1);
		});
	});

	describe('WHEN there are no comparisons', () => {
		it('should return a model without crashing', () => {
			const model = fitRewardModel(RESPONSES, []);

			expect(model.lossTrace).toHaveLength(0);
			expect(pairwiseAccuracy(model, RESPONSES, [])).toBe(0);
		});
	});
});
