import { describe, it, expect } from 'vitest';
import { greenMask, biasLogits, DEFAULT_WATERMARK } from './watermark';
import { softmax } from './sampling';
import { LOCALES } from '$i18n/locale';
import { DATA_BY_LOCALE } from '../data';

const CONFIG = { ...DEFAULT_WATERMARK, gamma: 0.3, delta: 2.5 };

const argmax = (values: Float64Array | readonly number[]): number => {
	let best = 0;
	for (let index = 1; index < values.length; index += 1) {
		if (values[index] > values[best]) best = index;
	}
	return best;
};

/**
 * El recorrido del capítulo 14 sólo enseña algo si el sesgo verde le da la vuelta
 * al resultado y si el reparto cambia en la posición siguiente. Eso es lo que se
 * comprueba aquí, en cada idioma, porque cada uno tiene su vocabulario.
 */
describe.each(LOCALES)('watermark scheme walkthrough (%s)', (locale) => {
	const { vocabulary, logits, previousIndex } = DATA_BY_LOCALE[locale].schemeExample;
	const firstMask = greenMask(previousIndex, vocabulary.length, CONFIG);
	const chosenIndex = argmax(softmax(biasLogits(logits, firstMask, CONFIG.delta)));
	const unbiasedIndex = argmax(logits);
	const greenCount = Math.floor(CONFIG.gamma * vocabulary.length);

	describe('WHEN the example is defined', () => {
		it('should give every token a logit', () => {
			expect(logits).toHaveLength(vocabulary.length);
		});

		it('should start from a token that exists', () => {
			expect(vocabulary[previousIndex]).toBeTruthy();
		});
	});

	describe('WHEN the bias is applied progressively', () => {
		it.each([0, 0.25, 0.5, 1])('should raise the chosen token by δ×%s', (progress) => {
			const partial = biasLogits(logits, firstMask, CONFIG.delta * progress);

			expect(firstMask[chosenIndex]).toBe(1);
			expect(partial[chosenIndex]).toBeCloseTo(logits[chosenIndex] + CONFIG.delta * progress, 6);
		});

		it('should leave red tokens untouched at every point of the animation', () => {
			const redIndex = firstMask.findIndex((flag) => flag !== 1);

			for (const progress of [0, 0.3, 0.7, 1]) {
				const partial = biasLogits(logits, firstMask, CONFIG.delta * progress);

				expect(partial[redIndex]).toBeCloseTo(logits[redIndex], 10);
			}
		});
	});

	describe('WHEN the green bias is applied', () => {
		it('should flip the winner, so the walkthrough actually shows something', () => {
			expect(chosenIndex).not.toBe(unbiasedIndex);
		});

		it('should not pick an absurd word: the winner is near the top without the bias', () => {
			const ranked = logits
				.map((value, index) => ({ value, index }))
				.sort((left, right) => right.value - left.value);
			const rank = ranked.findIndex((entry) => entry.index === chosenIndex);

			expect(rank).toBeLessThanOrEqual(2);
		});
	});

	describe('WHEN the previous token changes', () => {
		const nextMask = greenMask(chosenIndex, vocabulary.length, CONFIG);

		it('should reshuffle the green list', () => {
			expect(Array.from(nextMask)).not.toEqual(Array.from(firstMask));
		});

		it('should keep the same number of tokens green on each side', () => {
			for (const mask of [firstMask, nextMask]) {
				expect(mask.reduce((total, flag) => total + flag, 0)).toBe(greenCount);
			}
		});

		it('should turn some tokens green and some red, or the last slide says nothing', () => {
			const greened = vocabulary.filter(
				(_, index) => nextMask[index] === 1 && firstMask[index] !== 1
			);
			const reddened = vocabulary.filter(
				(_, index) => nextMask[index] !== 1 && firstMask[index] === 1
			);

			expect(greened.length).toBeGreaterThan(0);
			expect(reddened.length).toBeGreaterThan(0);
		});
	});
});
