import { describe, it, expect } from 'vitest';
import {
	initBpe,
	pairCounts,
	pairKey,
	rankedPairs,
	bestPair,
	applyMerge,
	trainBpe,
	tokenCount,
	compressionRatio,
	encode,
	decode,
	mergeQuality,
	END_OF_WORD
} from './bpe';

const FIXTURE = 'baja baja bajo bajo bajo caja';

describe('bpe helpers', () => {
	describe('WHEN I initialise from a corpus', () => {
		it('should collapse repeated words into frequencies', () => {
			const state = initBpe(FIXTURE);

			const bajo = state.words.find((word) => word.symbols.join('') === `bajo${END_OF_WORD}`);
			expect(bajo?.frequency).toBe(3);
		});

		it('should start with every word split into characters plus the end marker', () => {
			const state = initBpe('caja');

			expect(state.words[0].symbols).toEqual(['c', 'a', 'j', 'a', END_OF_WORD]);
		});

		it('should record the base token count', () => {
			const state = initBpe(FIXTURE);

			expect(state.baseTokenCount).toBe(tokenCount(state));
			expect(state.baseTokenCount).toBe(30);
		});
	});

	describe('WHEN I count adjacent pairs', () => {
		it('should weight each pair by the frequency of its word', () => {
			const state = initBpe(FIXTURE);

			const counts = pairCounts(state);

			expect(counts.get(pairKey('b', 'a'))).toBe(5);
			expect(counts.get(pairKey('j', 'o'))).toBe(3);
			expect(counts.get(pairKey('c', 'a'))).toBe(1);
		});
	});

	describe('WHEN I rank the pairs', () => {
		it('should order them by descending count', () => {
			const state = initBpe(FIXTURE);

			const ranked = rankedPairs(state);

			for (let index = 1; index < ranked.length; index += 1) {
				expect(ranked[index - 1].count).toBeGreaterThanOrEqual(ranked[index].count);
			}
		});

		it('should break ties deterministically across repeated calls', () => {
			const state = initBpe(FIXTURE);

			const first = rankedPairs(state).map((entry) => entry.pair.join(''));
			const second = rankedPairs(state).map((entry) => entry.pair.join(''));

			expect(first).toEqual(second);
		});

		it('should respect the requested limit', () => {
			const state = initBpe(FIXTURE);

			const ranked = rankedPairs(state, 3);

			expect(ranked).toHaveLength(3);
		});
	});

	describe('WHEN I apply a merge', () => {
		it('should not mutate the previous state', () => {
			const state = initBpe(FIXTURE);
			const before = state.words.map((word) => word.symbols.join('|'));

			applyMerge(state, ['b', 'a']);

			expect(state.words.map((word) => word.symbols.join('|'))).toEqual(before);
			expect(state.merges).toHaveLength(0);
		});

		it('should replace every occurrence of the pair', () => {
			const state = applyMerge(initBpe(FIXTURE), ['b', 'a']);

			const baja = state.words.find((word) => word.symbols.join('') === `baja${END_OF_WORD}`);
			expect(baja?.symbols).toEqual(['ba', 'j', 'a', END_OF_WORD]);
		});

		it('should record the merge with its count and rank', () => {
			const state = applyMerge(initBpe(FIXTURE), ['b', 'a']);

			expect(state.merges).toHaveLength(1);
			expect(state.merges[0]).toMatchObject({ symbol: 'ba', count: 5, rank: 0 });
		});

		it('should preserve the base token count so the ratio stays comparable', () => {
			const initial = initBpe(FIXTURE);

			const merged = applyMerge(initial, ['b', 'a']);

			expect(merged.baseTokenCount).toBe(initial.baseTokenCount);
		});
	});

	describe('WHEN I train greedily', () => {
		it('should pick the most frequent pair at every step', () => {
			const state = initBpe(FIXTURE);

			const trained = trainBpe(state, 3);

			expect(trained.merges[0].symbol).toBe('aj');
			expect(trained.merges.map((merge) => merge.count)).toEqual([6, 5, 3]);
		});

		it('should never increase the token count', () => {
			let state = initBpe(FIXTURE);
			let previous = tokenCount(state);

			for (let step = 0; step < 8; step += 1) {
				const next = bestPair(state);
				if (next === null) break;
				state = applyMerge(state, next);
				const current = tokenCount(state);
				expect(current).toBeLessThanOrEqual(previous);
				previous = current;
			}
		});

		it('should improve the compression ratio above one', () => {
			const trained = trainBpe(initBpe(FIXTURE), 5);

			expect(compressionRatio(trained)).toBeGreaterThan(1);
		});

		it('should stop cleanly when no pairs remain', () => {
			const trained = trainBpe(initBpe('ab'), 50);

			expect(bestPair(trained)).toBeNull();
		});
	});

	describe('WHEN I score a chosen merge', () => {
		it.each`
			pair          | expected
			${['a', 'j']} | ${1}
			${['b', 'a']} | ${5 / 6}
			${['c', 'a']} | ${1 / 6}
			${['z', 'z']} | ${0}
		`('should score the pair $pair as $expected', ({ pair, expected }) => {
			const state = initBpe(FIXTURE);

			const result = mergeQuality(state, pair as [string, string]);

			expect(result).toBeCloseTo(expected as number, 10);
		});
	});

	describe('WHEN I encode and decode with a learned merge list', () => {
		it('should round-trip back to the original words', () => {
			const trained = trainBpe(initBpe(FIXTURE), 6);

			const tokens = encode('baja caja', trained.merges);

			expect(decode(tokens)).toBe('baja caja');
		});

		it('should use fewer tokens than raw characters for a seen word', () => {
			const trained = trainBpe(initBpe(FIXTURE), 6);

			const tokens = encode('bajo', trained.merges);

			expect(tokens.length).toBeLessThan('bajo'.length + 1);
		});

		it('should fall back to characters for an unseen word', () => {
			const trained = trainBpe(initBpe(FIXTURE), 6);

			const tokens = encode('xyz', trained.merges);

			expect(tokens).toEqual(['x', 'y', 'z', END_OF_WORD]);
		});
	});
});
