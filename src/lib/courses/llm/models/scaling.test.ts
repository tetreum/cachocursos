import { describe, it, expect } from 'vitest';
import {
	chinchillaLoss,
	computeFlops,
	optimalAllocation,
	lossForBudget,
	allocationRegret,
	tokensForBudget,
	formatParameters,
	formatTokens
} from './scaling';

const BUDGET = 1e21;

describe('scaling helpers', () => {
	describe('WHEN I evaluate the scaling law', () => {
		it('should decrease as parameters grow at fixed data', () => {
			const small = chinchillaLoss(1e8, 1e10);
			const large = chinchillaLoss(1e10, 1e10);

			expect(large).toBeLessThan(small);
		});

		it('should decrease as data grows at fixed parameters', () => {
			const little = chinchillaLoss(1e9, 1e9);
			const lots = chinchillaLoss(1e9, 1e12);

			expect(lots).toBeLessThan(little);
		});

		it('should never fall below the irreducible loss', () => {
			expect(chinchillaLoss(1e15, 1e15)).toBeGreaterThan(1.69);
		});
	});

	describe('WHEN I convert between compute, parameters and tokens', () => {
		it('should satisfy the six N D relation', () => {
			expect(computeFlops(1e9, 2e10)).toBeCloseTo(6 * 1e9 * 2e10, 0);
		});

		it('should invert the relation when solving for tokens', () => {
			const parameters = 1e9;

			const tokens = tokensForBudget(BUDGET, parameters);

			expect(computeFlops(parameters, tokens)).toBeCloseTo(BUDGET, -10);
		});
	});

	describe('WHEN I find the optimal allocation for a budget', () => {
		it('should spend the whole budget', () => {
			const best = optimalAllocation(BUDGET);

			expect(computeFlops(best.parameters, best.tokens) / BUDGET).toBeCloseTo(1, 6);
		});

		it('should beat allocations that are twenty percent off in either direction', () => {
			const best = optimalAllocation(BUDGET);

			expect(best.loss).toBeLessThanOrEqual(lossForBudget(BUDGET, best.parameters * 1.2));
			expect(best.loss).toBeLessThanOrEqual(lossForBudget(BUDGET, best.parameters * 0.8));
		});

		it('should spend more on data than on parameters', () => {
			const best = optimalAllocation(BUDGET);

			expect(best.tokensPerParameter).toBeGreaterThan(10);
			expect(best.tokensPerParameter).toBeLessThan(200);
		});

		it('should raise the tokens-per-parameter ratio as the budget grows', () => {
			const small = optimalAllocation(1e21);
			const large = optimalAllocation(1e24);

			expect(large.tokensPerParameter).toBeGreaterThan(small.tokensPerParameter);
		});

		it('should report zero regret at the optimum', () => {
			const best = optimalAllocation(BUDGET);

			expect(allocationRegret(BUDGET, best.parameters)).toBeCloseTo(0, 6);
		});

		it('should report positive regret away from the optimum', () => {
			const best = optimalAllocation(BUDGET);

			expect(allocationRegret(BUDGET, best.parameters * 100)).toBeGreaterThan(0);
		});
	});

	describe('scaling formatters', () => {
		it.each`
			value   | expected
			${5e9}  | ${'5.0 B'}
			${7e6}  | ${'7 M'}
			${1200} | ${'1200'}
		`('should format $value parameters as $expected', ({ value, expected }) => {
			expect(formatParameters(value as number)).toBe(expected);
		});

		it.each`
			value   | expected
			${2e12} | ${'2.00 T'}
			${3e9}  | ${'3 B'}
			${4e6}  | ${'4 M'}
		`('should format $value tokens as $expected', ({ value, expected }) => {
			expect(formatTokens(value as number)).toBe(expected);
		});
	});
});
