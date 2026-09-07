import { describe, it, expect } from 'vitest';
import { formatSymbol, BOUNDARY_GLYPH } from './tokenFormat';
import { END_OF_WORD, initBpe, trainBpe, encodeWord } from '../models/bpe';

describe('tokenFormat helpers', () => {
	describe('WHEN I format a symbol carrying the end-of-word marker', () => {
		it.each`
			symbol                  | expected
			${'a'}                  | ${'a'}
			${END_OF_WORD}          | ${BOUNDARY_GLYPH}
			${'n' + END_OF_WORD}    | ${'n' + BOUNDARY_GLYPH}
			${'ción' + END_OF_WORD} | ${'ción' + BOUNDARY_GLYPH}
		`('should render $symbol as $expected', ({ symbol, expected }) => {
			expect(formatSymbol(symbol as string)).toBe(expected);
		});
	});

	describe('WHEN I format every symbol a learned vocabulary can produce', () => {
		it('should never leak the raw marker', () => {
			const trained = trainBpe(initBpe('la nación canta la canción de la computación'), 12);

			const rendered = [
				...trained.vocabulary,
				...trained.merges.map((merge) => merge.symbol),
				...trained.merges.flatMap((merge) => merge.pair),
				...encodeWord('computación', trained.merges)
			].map(formatSymbol);

			for (const label of rendered) {
				expect(label).not.toContain(END_OF_WORD);
				expect(label).not.toContain('<');
			}
		});
	});
});
