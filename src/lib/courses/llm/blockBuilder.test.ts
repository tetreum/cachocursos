import { describe, it, expect } from 'vitest';
import { moveItem } from '$ui/DraggableList.svelte';

const ORDER = [
	'tokenizar',
	'embed',
	'posicion',
	'atencion',
	'residual-1',
	'ffn',
	'residual-2',
	'unembed'
];

describe('transformer pipeline order', () => {
	describe('WHEN I inspect the expected order', () => {
		it('should start at tokenisation, because the input is raw text', () => {
			expect(ORDER[0]).toBe('tokenizar');
		});

		it('should end at the projection back to the vocabulary', () => {
			expect(ORDER[ORDER.length - 1]).toBe('unembed');
		});

		it('should place the positional encoding before any token can look at another', () => {
			expect(ORDER.indexOf('posicion')).toBeLessThan(ORDER.indexOf('atencion'));
		});

		it('should follow each sublayer with its own residual', () => {
			expect(ORDER.indexOf('residual-1')).toBe(ORDER.indexOf('atencion') + 1);
			expect(ORDER.indexOf('residual-2')).toBe(ORDER.indexOf('ffn') + 1);
		});

		it('should keep the four repeating pieces contiguous', () => {
			const block = ['atencion', 'residual-1', 'ffn', 'residual-2'];
			const positions = block.map((id) => ORDER.indexOf(id));

			expect(positions).toEqual([3, 4, 5, 6]);
		});
	});

	describe('WHEN a piece is dragged to another slot', () => {
		it.each`
			from | to   | expectedFirst
			${0} | ${2} | ${'embed'}
			${7} | ${0} | ${'unembed'}
			${3} | ${3} | ${'tokenizar'}
		`('should put $expectedFirst first moving $from to $to', ({ from, to, expectedFirst }) => {
			const result = moveItem(ORDER, from as number, to as number);

			expect(result[0]).toBe(expectedFirst);
			expect(result).toHaveLength(ORDER.length);
			expect(new Set(result).size).toBe(ORDER.length);
		});
	});
});
