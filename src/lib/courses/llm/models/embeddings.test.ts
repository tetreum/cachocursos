import { describe, it, expect } from 'vitest';
import { buildTable, cosine, analogy, nearest, oddOneOut, vector, coordinates } from './embeddings';
import { LOCALES } from '$i18n/locale';
import { DATA_BY_LOCALE } from '../data';

const UNKNOWN_WORD = 'zzzzzz';

describe.each(LOCALES)('embeddings helpers (%s)', (locale) => {
	const { axes, words, analogies, oddOneOuts } = DATA_BY_LOCALE[locale];
	const table = buildTable(words, axes);

	describe('WHEN I build the table', () => {
		it('should index every word exactly once', () => {
			expect(table.index.size).toBe(words.length);
			expect(table.words).toHaveLength(words.length);
		});

		it('should give every word a two dimensional projection inside the unit box', () => {
			for (const word of table.words) {
				const point = coordinates(table, word);
				expect(point).not.toBeNull();
				expect(Math.abs(point![0])).toBeLessThanOrEqual(1);
				expect(Math.abs(point![1])).toBeLessThanOrEqual(1);
			}
		});

		it('should return null for a word outside the table', () => {
			expect(vector(table, UNKNOWN_WORD)).toBeNull();
		});
	});

	describe('WHEN I measure cosine similarity', () => {
		it('should score every word against itself at one', () => {
			for (const word of table.words) {
				expect(cosine(vector(table, word)!, vector(table, word)!)).toBeCloseTo(1, 6);
			}
		});

		it('should rate the family of a puzzle closer to itself than to its intruder', () => {
			for (const puzzle of oddOneOuts) {
				const family = puzzle.words.filter((word) => word !== puzzle.expected);
				const inside = cosine(vector(table, family[0])!, vector(table, family[1])!);
				const outside = cosine(vector(table, family[0])!, vector(table, puzzle.expected)!);

				expect(inside).toBeGreaterThan(outside);
			}
		});
	});

	describe('WHEN I solve the curated analogies', () => {
		it.each(
			analogies.map((entry) => ({
				...entry,
				name: `${entry.to} - ${entry.from} + ${entry.query} = ${entry.expected}`
			}))
		)('should resolve $name at the top', ({ from, to, query, expected }) => {
			const neighbours = analogy(table, from, to, query, 1);

			expect(neighbours[0].word).toBe(expected);
		});
	});

	describe('WHEN I solve the odd one out puzzles', () => {
		it.each(oddOneOuts.map((puzzle) => ({ ...puzzle, name: puzzle.words.join(', ') })))(
			'should pick the intruder among $name',
			({ words: puzzleWords, expected }) => {
				expect(oddOneOut(table, puzzleWords)).toBe(expected);
			}
		);
	});

	describe('WHEN I look for neighbours', () => {
		it('should exclude the requested words', () => {
			const word = table.words[0];
			const neighbours = nearest(table, vector(table, word)!, 3, [word]);

			expect(neighbours.map((entry) => entry.word)).not.toContain(word);
		});

		it('should return the word itself first when nothing is excluded', () => {
			const word = table.words[0];
			const neighbours = nearest(table, vector(table, word)!, 1);

			expect(neighbours[0].word).toBe(word);
		});
	});
});
