import { describe, it, expect } from 'vitest';
import { probeGradientFlow, relativeSignal } from './residual';

describe('residual helpers', () => {
	describe('WHEN there is no residual connection', () => {
		it('should let the gradient vanish as depth grows', () => {
			const shallow = probeGradientFlow({ depth: 4, residual: false });
			const deep = probeGradientFlow({ depth: 48, residual: false });

			expect(deep.firstLayerNorm).toBeLessThan(shallow.firstLayerNorm);
		});

		it('should reach the first layer with a tiny fraction of the signal', () => {
			const probe = probeGradientFlow({ depth: 48, residual: false });

			expect(relativeSignal(probe)[0]).toBeLessThan(0.01);
		});
	});

	describe('WHEN the residual connection is present', () => {
		it('should keep the signal reaching the first layer usable', () => {
			const probe = probeGradientFlow({ depth: 48, residual: true });

			expect(relativeSignal(probe)[0]).toBeGreaterThan(0.1);
		});

		it('should beat the plain stack at every depth', () => {
			for (const depth of [8, 24, 48, 64]) {
				const plain = probeGradientFlow({ depth, residual: false });
				const withResidual = probeGradientFlow({ depth, residual: true });

				expect(withResidual.firstLayerNorm).toBeGreaterThan(plain.firstLayerNorm);
			}
		});
	});

	describe('WHEN I probe the same configuration twice', () => {
		it('should give identical results', () => {
			const first = probeGradientFlow({ depth: 16, residual: true, seed: 9 });
			const second = probeGradientFlow({ depth: 16, residual: true, seed: 9 });

			expect(Array.from(first.normPerLayer)).toEqual(Array.from(second.normPerLayer));
		});
	});

	describe('WHEN I read the per-layer norms', () => {
		it('should report one value per layer boundary', () => {
			const probe = probeGradientFlow({ depth: 12, residual: false });

			expect(probe.normPerLayer).toHaveLength(13);
		});

		it('should normalise the output layer to one', () => {
			const probe = probeGradientFlow({ depth: 12, residual: false });

			expect(relativeSignal(probe)[12]).toBeCloseTo(1, 12);
		});
	});
});
