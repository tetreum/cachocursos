import { describe, it, expect } from 'vitest';
import { LOCALES } from '$i18n/locale';
import { DATA_BY_LOCALE } from '../data';
import { ATTENTION_PASSING_SCORE } from '../config';
import {
	scaledDotAttention,
	causalMask,
	normalizeAllocation,
	klDivergence,
	jsDivergence,
	allocationScore,
	resolveReference
} from './attention';

const sum = (values: ArrayLike<number>): number => {
	let total = 0;
	for (let index = 0; index < values.length; index += 1) total += values[index];
	return total;
};

describe('attention helpers', () => {
	describe('WHEN I run scaled dot product attention', () => {
		it('should produce weights that sum to one', () => {
			const query = [1, 0];
			const keys = [
				[1, 0],
				[0, 1],
				[0.5, 0.5]
			];
			const values = keys;

			const result = scaledDotAttention(query, keys, values);

			expect(sum(result.weights)).toBeCloseTo(1, 12);
		});

		it('should put the most weight on the most similar key', () => {
			const query = [1, 0];
			const keys = [
				[1, 0],
				[0, 1],
				[-1, 0]
			];

			const result = scaledDotAttention(query, keys, keys);

			expect(result.weights[0]).toBeGreaterThan(result.weights[1]);
			expect(result.weights[1]).toBeGreaterThan(result.weights[2]);
		});

		it('should return an output that is a convex mix of the values', () => {
			const query = [1, 0];
			const keys = [
				[1, 0],
				[0, 1]
			];
			const values = [
				[10, 0],
				[0, 10]
			];

			const result = scaledDotAttention(query, keys, values);

			expect(result.output[0]).toBeGreaterThan(0);
			expect(result.output[0]).toBeLessThan(10);
		});
	});

	describe('WHEN a causal mask is applied', () => {
		it('should zero every position after the query', () => {
			const query = [1, 0];
			const keys = [
				[1, 0],
				[1, 0],
				[1, 0]
			];

			const result = scaledDotAttention(query, keys, keys, causalMask(3, 1));

			expect(result.weights[2]).toBe(0);
			expect(sum(result.weights)).toBeCloseTo(1, 12);
		});

		it.each`
			position | visible
			${0}     | ${1}
			${1}     | ${2}
			${2}     | ${3}
		`('should let position $position see $visible tokens', ({ position, visible }) => {
			const mask = causalMask(3, position as number);

			expect(mask.filter(Boolean)).toHaveLength(visible as number);
		});
	});

	describe('WHEN I normalise an allocation', () => {
		it('should turn raw points into a distribution', () => {
			const result = normalizeAllocation([50, 30, 20]);

			expect(Array.from(result)).toEqual([0.5, 0.3, 0.2]);
		});

		it('should fall back to a uniform distribution when everything is zero', () => {
			const result = normalizeAllocation([0, 0, 0, 0]);

			expect(Array.from(result)).toEqual([0.25, 0.25, 0.25, 0.25]);
		});

		it('should clamp negative points to zero', () => {
			const result = normalizeAllocation([-10, 5, 5]);

			expect(result[0]).toBe(0);
			expect(sum(result)).toBeCloseTo(1, 12);
		});
	});

	describe('WHEN I compare two distributions', () => {
		it('should report zero divergence for identical distributions', () => {
			const distribution = [0.5, 0.25, 0.25];

			expect(klDivergence(distribution, distribution)).toBeCloseTo(0, 12);
			expect(jsDivergence(distribution, distribution)).toBeCloseTo(0, 12);
		});

		it('should keep the Jensen-Shannon divergence symmetric', () => {
			const left = [0.7, 0.2, 0.1];
			const right = [0.1, 0.2, 0.7];

			expect(jsDivergence(left, right)).toBeCloseTo(jsDivergence(right, left), 12);
		});

		it('should bound the Jensen-Shannon divergence by ln 2', () => {
			const left = [1, 0];
			const right = [0, 1];

			expect(jsDivergence(left, right)).toBeLessThanOrEqual(Math.LN2 + 1e-9);
		});
	});

	describe('WHEN I score an attention allocation', () => {
		it('should give a perfect score for the reference distribution', () => {
			const gold = [0.6, 0.3, 0.1];

			expect(allocationScore([60, 30, 10], gold)).toBeCloseTo(1, 10);
		});

		it('should give a lower score the further the allocation drifts', () => {
			const gold = [0.8, 0.1, 0.1];

			const close = allocationScore([70, 20, 10], gold);
			const far = allocationScore([10, 10, 80], gold);

			expect(close).toBeGreaterThan(far);
			expect(far).toBeGreaterThanOrEqual(0);
		});
	});
});

/**
 * La calibración del capítulo 6: un reparto pensado tiene que superar el umbral
 * y uno uniforme tiene que quedarse corto, en todos los idiomas. Si un idioma
 * añade una frase mal indexada, esto se cae.
 */
describe.each(LOCALES)('attention puzzles (%s)', (locale) => {
	const puzzles = DATA_BY_LOCALE[locale].attentionPuzzles;
	const BUDGET = 100;

	describe('WHEN a puzzle is declared', () => {
		it('should give every token a share of the gold allocation', () => {
			for (const puzzle of puzzles) {
				expect(puzzle.gold, puzzle.id).toHaveLength(puzzle.tokens.length);
			}
		});

		it('should spread exactly one unit of attention', () => {
			for (const puzzle of puzzles) {
				const total = puzzle.gold.reduce((sum, value) => sum + value, 0);

				expect(total, puzzle.id).toBeCloseTo(1, 6);
			}
		});

		it('should point the answer and the distractor at real tokens', () => {
			for (const puzzle of puzzles) {
				expect(puzzle.tokens[puzzle.answerIndex], puzzle.id).toBeTruthy();
				expect(puzzle.tokens[puzzle.distractorIndex], puzzle.id).toBeTruthy();
				expect(puzzle.answerIndex).not.toBe(puzzle.distractorIndex);
			}
		});
	});

	describe('WHEN the reader allocates attention', () => {
		it('should pass with a thoughtful allocation', () => {
			for (const puzzle of puzzles) {
				const thoughtful = puzzle.gold.map((value) => Math.round(value * BUDGET));

				expect(allocationScore(thoughtful, puzzle.gold), puzzle.id).toBeGreaterThanOrEqual(
					ATTENTION_PASSING_SCORE
				);
			}
		});

		it('should fail with a uniform allocation, or the game is free', () => {
			for (const puzzle of puzzles) {
				const uniform = puzzle.tokens.map(() => Math.round(BUDGET / puzzle.tokens.length));

				expect(allocationScore(uniform, puzzle.gold), puzzle.id).toBeLessThan(
					ATTENTION_PASSING_SCORE
				);
			}
		});

		it('should resolve the reference the explanation promises', () => {
			for (const puzzle of puzzles) {
				const thoughtful = puzzle.gold.map((value) => Math.round(value * BUDGET));

				expect(resolveReference(puzzle, thoughtful), puzzle.id).toBe(puzzle.answerIndex);
			}
		});
	});
});
