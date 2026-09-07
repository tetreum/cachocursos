import { describe, it, expect } from 'vitest';
import { linearScale, logScale, niceTicks, extent, linePath } from './scale';

describe('scale helpers', () => {
	describe('WHEN I build a linear scale', () => {
		it('should map the domain onto the range', () => {
			const scale = linearScale([0, 10], [0, 100]);

			expect(scale(0)).toBe(0);
			expect(scale(5)).toBe(50);
			expect(scale(10)).toBe(100);
		});

		it('should invert back to the original value', () => {
			const scale = linearScale([2, 8], [0, 300]);

			expect(scale.invert(scale(5))).toBeCloseTo(5, 10);
		});

		it('should support an inverted range for screen coordinates', () => {
			const scale = linearScale([0, 1], [200, 0]);

			expect(scale(0)).toBe(200);
			expect(scale(1)).toBe(0);
		});
	});

	describe('WHEN I build a logarithmic scale', () => {
		it('should place decades evenly', () => {
			const scale = logScale([1, 1000], [0, 300]);

			expect(scale(1)).toBeCloseTo(0, 6);
			expect(scale(10)).toBeCloseTo(100, 6);
			expect(scale(1000)).toBeCloseTo(300, 6);
		});

		it('should invert back to the original value', () => {
			const scale = logScale([1, 1e6], [0, 500]);

			expect(scale.invert(scale(1234))).toBeCloseTo(1234, 3);
		});
	});

	describe('WHEN I compute ticks', () => {
		it('should stay inside the requested interval', () => {
			const ticks = niceTicks(0, 10, 5);

			expect(ticks[0]).toBeGreaterThanOrEqual(0);
			expect(ticks[ticks.length - 1]).toBeLessThanOrEqual(10.001);
		});

		it('should return a single tick for a degenerate interval', () => {
			expect(niceTicks(3, 3)).toEqual([3]);
		});
	});

	describe('WHEN I compute an extent', () => {
		it('should return the smallest and largest values', () => {
			expect(extent([3, 1, 4, 1, 5])).toEqual([1, 5]);
		});

		it('should widen a degenerate extent', () => {
			expect(extent([7, 7, 7])).toEqual([6, 8]);
		});

		it('should fall back to a unit extent when empty', () => {
			expect(extent([])).toEqual([0, 1]);
		});
	});

	describe('WHEN I build a line path', () => {
		it('should start with a move and continue with lines', () => {
			expect(
				linePath([
					[0, 0],
					[1, 2]
				])
			).toBe('M0.00,0.00 L1.00,2.00');
		});

		it('should return an empty string with no points', () => {
			expect(linePath([])).toBe('');
		});
	});
});
