import { describe, it, expect } from 'vitest';
import { softmax, topK, topP, entropy, distribution, traceSampling } from './sampling';

const sum = (values: ArrayLike<number>): number => {
	let total = 0;
	for (let index = 0; index < values.length; index += 1) total += values[index];
	return total;
};

describe('sampling helpers', () => {
	describe('WHEN I call softmax with ordinary logits', () => {
		it('should return a distribution that sums to one', () => {
			const logits = [1, 2, 3, 4];

			const result = softmax(logits);

			expect(sum(result)).toBeCloseTo(1, 12);
		});

		it('should rank outputs in the same order as the logits', () => {
			const logits = [1, 3, 2];

			const result = softmax(logits);

			expect(result[1]).toBeGreaterThan(result[2]);
			expect(result[2]).toBeGreaterThan(result[0]);
		});
	});

	describe('WHEN I call softmax with extreme logits', () => {
		it('should stay numerically stable', () => {
			const logits = [10000, 9999, -10000];

			const result = softmax(logits);

			expect(Number.isNaN(sum(result))).toBe(false);
			expect(sum(result)).toBeCloseTo(1, 12);
		});
	});

	describe('WHEN I call softmax with a temperature at or below zero', () => {
		it('should collapse to a one-hot argmax', () => {
			const logits = [1, 5, 2];

			const result = softmax(logits, 0);

			expect(Array.from(result)).toEqual([0, 1, 0]);
		});
	});

	describe('WHEN the temperature rises', () => {
		it('should increase the entropy of the distribution', () => {
			const logits = [4, 2, 1, 0];

			const cold = entropy(softmax(logits, 0.5));
			const warm = entropy(softmax(logits, 2));

			expect(warm).toBeGreaterThan(cold);
		});
	});

	describe('WHEN I call topK', () => {
		it.each`
			limit | expectedNonZero
			${1}  | ${1}
			${2}  | ${2}
			${4}  | ${4}
			${99} | ${4}
		`('should keep $expectedNonZero tokens for a limit of $limit', ({ limit, expectedNonZero }) => {
			const probabilities = [0.4, 0.3, 0.2, 0.1];

			const result = topK(probabilities, limit as number);

			expect(Array.from(result).filter((value) => value > 0)).toHaveLength(
				expectedNonZero as number
			);
			expect(sum(result)).toBeCloseTo(1, 12);
		});

		it('should keep only the largest token when the limit is one', () => {
			const probabilities = [0.1, 0.6, 0.3];

			const result = topK(probabilities, 1);

			expect(Array.from(result)).toEqual([0, 1, 0]);
		});
	});

	describe('WHEN I call topP', () => {
		it('should be the identity for a mass of one', () => {
			const probabilities = [0.5, 0.25, 0.25];

			const result = topP(probabilities, 1);

			expect(Array.from(result)).toEqual(probabilities);
		});

		it('should keep the smallest prefix reaching the requested mass', () => {
			const probabilities = [0.5, 0.3, 0.15, 0.05];

			const result = topP(probabilities, 0.75);

			expect(result[0]).toBeGreaterThan(0);
			expect(result[1]).toBeGreaterThan(0);
			expect(result[2]).toBe(0);
			expect(result[3]).toBe(0);
		});

		it('should always keep at least one token', () => {
			const probabilities = [0.7, 0.2, 0.1];

			const result = topP(probabilities, 0.01);

			expect(Array.from(result).filter((value) => value > 0)).toHaveLength(1);
			expect(sum(result)).toBeCloseTo(1, 12);
		});
	});

	describe('WHEN I combine temperature, topK and topP through distribution', () => {
		it('should return a normalised distribution', () => {
			const logits = [3, 2, 1, 0, -1];

			const result = distribution(logits, { temperature: 0.8, topK: 3, topP: 0.9 });

			expect(sum(result)).toBeCloseTo(1, 12);
		});
	});

	describe('WHEN I call traceSampling', () => {
		it('should report masks that agree with the final distribution', () => {
			const logits = [3, 2, 1, 0, -1];

			const trace = traceSampling(logits, { temperature: 1, topK: 3, topP: 0.95 });

			for (let index = 0; index < logits.length; index += 1) {
				expect(trace.keptByTopP[index] === 1).toBe(trace.final[index] > 0);
			}
			expect(trace.nucleusSize).toBeGreaterThan(0);
			expect(trace.nucleusSize).toBeLessThanOrEqual(3);
		});
	});
});
