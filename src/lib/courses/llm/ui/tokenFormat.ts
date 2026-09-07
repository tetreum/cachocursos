import { END_OF_WORD } from '../models/bpe';

export const BOUNDARY_GLYPH = '\u00b7';

export function formatSymbol(symbol: string): string {
	return symbol.replaceAll(END_OF_WORD, BOUNDARY_GLYPH);
}
