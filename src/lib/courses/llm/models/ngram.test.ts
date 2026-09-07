import { describe, it, expect } from 'vitest';
import {
	tokenizeWords,
	trainNgram,
	nextProbabilities,
	nextDistribution,
	probabilityOf,
	surprisal,
	hasSeenContext,
	observedCount,
	perplexity,
	generate
} from './ngram';

const FIXTURE = 'el gato come pescado el gato duerme el perro come pescado';

const sum = (values: ArrayLike<number>): number => {
	let total = 0;
	for (let index = 0; index < values.length; index += 1) total += values[index];
	return total;
};

describe('ngram helpers', () => {
	describe('WHEN I tokenize a text', () => {
		it('should build a vocabulary without duplicates', () => {
			const result = tokenizeWords(FIXTURE);

			expect(result.vocabulary).toEqual(['el', 'gato', 'come', 'pescado', 'duerme', 'perro']);
		});

		it('should map every token to its vocabulary id', () => {
			const result = tokenizeWords(FIXTURE);

			expect(result.ids).toHaveLength(result.tokens.length);
			expect(result.vocabulary[result.ids[0]]).toBe('el');
		});

		it('should keep punctuation as its own token', () => {
			const result = tokenizeWords('hola, mundo.');

			expect(result.tokens).toEqual(['hola', ',', 'mundo', '.']);
		});
	});

	describe('WHEN I train a bigram', () => {
		it('should produce a distribution that sums to one for a seen context', () => {
			const model = trainNgram(tokenizeWords(FIXTURE), 2);

			const probabilities = nextProbabilities(model, ['el']);

			expect(sum(probabilities)).toBeCloseTo(1, 12);
		});

		it('should produce a distribution that sums to one for an unseen context', () => {
			const model = trainNgram(tokenizeWords(FIXTURE), 2);

			const probabilities = nextProbabilities(model, ['pescado']);

			expect(sum(probabilities)).toBeCloseTo(1, 12);
		});

		it('should rank the most frequent continuation first', () => {
			const model = trainNgram(tokenizeWords(FIXTURE), 2);

			const ranked = nextDistribution(model, ['el'], 1);

			expect(ranked[0].token).toBe('gato');
			expect(ranked[0].count).toBe(2);
		});

		it.each`
			context            | seen
			${['el']}          | ${true}
			${['gato']}        | ${true}
			${['pescado']}     | ${true}
			${['helicoptero']} | ${false}
		`('should report seen=$seen for the context $context', ({ context, seen }) => {
			const model = trainNgram(tokenizeWords(FIXTURE), 2);

			const result = hasSeenContext(model, context as string[]);

			expect(result).toBe(seen);
		});

		it('should count how often a context was observed', () => {
			const model = trainNgram(tokenizeWords(FIXTURE), 2);

			expect(observedCount(model, ['el'])).toBe(3);
			expect(observedCount(model, ['pescado'])).toBe(1);
		});
	});

	describe('WHEN smoothing an unseen continuation', () => {
		it('should give it a small but non-zero probability', () => {
			const model = trainNgram(tokenizeWords(FIXTURE), 2);

			const probability = probabilityOf(model, ['gato'], 'perro');

			expect(probability).toBeGreaterThan(0);
			expect(probability).toBeLessThan(probabilityOf(model, ['gato'], 'come'));
		});

		it('should give zero probability to a word outside the vocabulary', () => {
			const model = trainNgram(tokenizeWords(FIXTURE), 2);

			expect(probabilityOf(model, ['gato'], 'helicoptero')).toBe(0);
		});
	});

	describe('WHEN I measure surprisal', () => {
		it('should be lower for the expected continuation', () => {
			const model = trainNgram(tokenizeWords(FIXTURE), 2);

			const expected = surprisal(model, ['el'], 'gato');
			const unexpected = surprisal(model, ['el'], 'pescado');

			expect(expected).toBeGreaterThan(0);
			expect(expected).toBeLessThan(unexpected);
		});

		it('should be infinite for a word outside the vocabulary', () => {
			const model = trainNgram(tokenizeWords(FIXTURE), 2);

			expect(surprisal(model, ['el'], 'helicoptero')).toBe(Infinity);
		});
	});

	describe('WHEN I measure perplexity', () => {
		it('should be lower on the training text than on shuffled text', () => {
			const source = tokenizeWords(FIXTURE);
			const model = trainNgram(source, 2);
			const shuffledText = 'pescado el duerme gato come perro pescado el gato come el';

			const onTraining = perplexity(model, source);
			const onShuffled = perplexity(model, tokenizeWords(shuffledText));

			expect(onTraining).toBeLessThan(onShuffled);
		});
	});

	describe('WHEN I generate from the model', () => {
		it('should return the requested number of tokens', () => {
			const model = trainNgram(tokenizeWords(FIXTURE), 2);
			const pickArgmax = (probabilities: Float64Array): number => {
				let best = 0;
				for (let id = 1; id < probabilities.length; id += 1) {
					if (probabilities[id] > probabilities[best]) best = id;
				}
				return best;
			};

			const produced = generate(model, ['el'], 4, pickArgmax);

			expect(produced).toHaveLength(4);
			expect(produced[0]).toBe('gato');
		});
	});
});
