import { describe, it, expect } from 'vitest';
import { detect, greenMask, DEFAULT_WATERMARK, DETECTION_THRESHOLD } from './watermark';
import { LOCALES } from '$i18n/locale';
import { DATA_BY_LOCALE } from '../data';
import { createAttack, ATTACK_MAX_EDITS } from '../chapters/14-watermark/engine';

describe.each(LOCALES)('attacker passage (%s)', (locale) => {
	const ATTACK_PASSAGE = DATA_BY_LOCALE[locale].attackPassage;
	const deck = createAttack(ATTACK_PASSAGE);
	const ATTACK_VOCABULARY = deck.vocabulary;
	const ATTACK_VOCAB_SIZE = deck.vocabSize;
	const wordId = (word: string): number => ATTACK_VOCABULARY.indexOf(word);
	const marked = deck.markedPassage(DEFAULT_WATERMARK);

	describe('WHEN the passage is defined', () => {
		it('should give every option in a slot a distinct word', () => {
			for (const slot of ATTACK_PASSAGE) {
				expect(new Set(slot.options).size).toBe(slot.options.length);
			}
		});

		it('should map every word to a vocabulary id', () => {
			for (const slot of ATTACK_PASSAGE) {
				for (const word of slot.options) expect(wordId(word)).toBeGreaterThanOrEqual(0);
			}
		});

		it('should offer enough swappable slots for the edit budget', () => {
			const swappable = ATTACK_PASSAGE.filter((slot) => slot.options.length > 1).length;

			expect(swappable).toBeGreaterThan(ATTACK_MAX_EDITS);
		});
	});

	describe('WHEN the marked passage is built', () => {
		it('should pick exactly one option per slot', () => {
			expect(marked).toHaveLength(ATTACK_PASSAGE.length);
			marked.forEach((id, index) => {
				expect(ATTACK_PASSAGE[index].options).toContain(ATTACK_VOCABULARY[id]);
			});
		});

		it('should leave fixed words untouched', () => {
			ATTACK_PASSAGE.forEach((slot, index) => {
				if (slot.options.length === 1) {
					expect(ATTACK_VOCABULARY[marked[index]]).toBe(slot.options[0]);
				}
			});
		});

		it('should carry a watermark well above the threshold', () => {
			const result = detect(marked, ATTACK_VOCAB_SIZE, DEFAULT_WATERMARK);

			expect(result.z).toBeGreaterThan(DETECTION_THRESHOLD + 1);
		});

		it('should be undetectable with the wrong key', () => {
			const result = detect(marked, ATTACK_VOCAB_SIZE, { ...DEFAULT_WATERMARK, key: 7919 });

			expect(result.z).toBeLessThan(DETECTION_THRESHOLD);
		});
	});

	describe('WHEN an attacker swaps synonyms', () => {
		it('should be able to evade within the edit budget', () => {
			const working = marked.slice();
			let edits = 0;

			while (
				detect(working, ATTACK_VOCAB_SIZE, DEFAULT_WATERMARK).z >= DETECTION_THRESHOLD &&
				edits < ATTACK_MAX_EDITS
			) {
				let bestIndex = -1;
				let bestId = -1;
				let bestZ = Infinity;

				ATTACK_PASSAGE.forEach((slot, index) => {
					if (slot.options.length < 2 || index === 0) return;
					for (const word of slot.options) {
						const candidate = wordId(word);
						if (candidate === working[index]) continue;
						const trial = working.slice();
						trial[index] = candidate;
						const score = detect(trial, ATTACK_VOCAB_SIZE, DEFAULT_WATERMARK).z;
						if (score < bestZ) {
							bestZ = score;
							bestIndex = index;
							bestId = candidate;
						}
					}
				});

				if (bestIndex < 0) break;
				working[bestIndex] = bestId;
				edits += 1;
			}

			expect(detect(working, ATTACK_VOCAB_SIZE, DEFAULT_WATERMARK).z).toBeLessThan(
				DETECTION_THRESHOLD
			);
			expect(edits).toBeLessThanOrEqual(ATTACK_MAX_EDITS);
		});

		it('should not evade with zero edits, or the game would be trivial', () => {
			expect(detect(marked, ATTACK_VOCAB_SIZE, DEFAULT_WATERMARK).z).toBeGreaterThan(
				DETECTION_THRESHOLD
			);
		});
	});

	describe('WHEN a green list is recomputed for the passage vocabulary', () => {
		it('should mark a quarter of it green', () => {
			const mask = greenMask(3, ATTACK_VOCAB_SIZE, DEFAULT_WATERMARK);
			const greens = mask.reduce((total, flag) => total + flag, 0);

			expect(greens).toBe(Math.floor(DEFAULT_WATERMARK.gamma * ATTACK_VOCAB_SIZE));
		});
	});
});
