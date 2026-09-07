import { describe, it, expect } from 'vitest';
import { LOCALES, type Locale } from '$i18n/locale';
import { DATA_BY_LOCALE } from './data';
import { tokenizeWords } from './models/ngram';
import { createTrainer, DEFAULT_TRAINER } from './models/trainer';

const SOURCES = import.meta.glob('./chapters/**/Chapter.*.svelte', {
	query: '?raw',
	import: 'default',
	eager: true
}) as Record<string, string>;

function proseOf(chapterId: string, locale: Locale): string {
	const path = `./chapters/${chapterId}/Chapter.${locale}.svelte`;
	const source = SOURCES[path];
	if (source === undefined) throw new Error(`no hay prosa para ${chapterId} en ${locale}`);
	return source;
}

/** El número tal y como se escribe en prosa, con o sin separador de miles. */
function quotedIn(prose: string, value: number): boolean {
	const digits = String(value).split('');
	const loose = digits.join('[.,\\s]?');
	return new RegExp(`(?<![0-9])${loose}(?![0-9])`).test(prose);
}

/**
 * La prosa cita cifras que salen de los datos, y los datos cambian por idioma.
 * Este test las recalcula y comprueba que el texto no miente en ninguno de los dos.
 */
describe.each(LOCALES)('numbers quoted in the prose (%s)', (locale) => {
	const data = DATA_BY_LOCALE[locale];

	describe('WHEN chapter 9 says how big the chapter 8 model is', () => {
		it('should quote the parameter count the trainer actually builds', () => {
			const source = tokenizeWords(data.corpus);
			const trainer = createTrainer(source.ids, source.vocabulary.length, DEFAULT_TRAINER);

			const prose = proseOf('09-escala', locale);

			expect(quotedIn(prose, trainer.parameterCount), `no cita ${trainer.parameterCount}`).toBe(
				true
			);
		});
	});

	describe('WHEN chapter 3 says how many axes the space has', () => {
		it('should quote the number of axes the data declares', () => {
			const prose = proseOf('03-embeddings', locale);
			const quoted = Array.from(prose.matchAll(/(\d+)\s+(?:ejes|axes|dimensiones|dimensions)/g));

			expect(quoted.length, 'la prosa no cita ningún número de ejes').toBeGreaterThan(0);
			for (const match of quoted) {
				expect(Number(match[1])).toBe(data.axes.length);
			}
		});
	});

	describe('WHEN a chapter names a word that has to exist in the data', () => {
		it('should use a seed word that is really in the corpus', () => {
			const source = tokenizeWords(data.corpus);

			expect(source.vocabulary).toContain(data.seedWord);
		});

		it('should offer seen contexts that the corpus really contains', () => {
			const source = tokenizeWords(data.corpus);

			for (const context of data.seenContexts) {
				expect(source.vocabulary, `«${context}» no está en el corpus`).toContain(context);
			}
		});

		it('should offer unseen contexts that the corpus really lacks', () => {
			const source = tokenizeWords(data.corpus);

			for (const context of data.unseenContexts) {
				expect(source.vocabulary, `«${context}» sí está en el corpus`).not.toContain(context);
			}
		});
	});

	describe('WHEN the tokeniser demo promises hidden letters', () => {
		it('should include words that really contain the counted letter', () => {
			const carrying = data.tokenizer.suggestions.filter((suggestion) =>
				suggestion.toLowerCase().includes(data.tokenizer.letter)
			);

			expect(carrying.length, 'ninguna sugerencia lleva la letra que se cuenta').toBeGreaterThan(0);
		});

		it('should default to one of its own suggestions', () => {
			expect(data.tokenizer.suggestions).toContain(data.tokenizer.defaultWord);
		});
	});
});
