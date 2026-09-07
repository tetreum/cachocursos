import { describe, it, expect } from 'vitest';
import { LOCALES, type Locale } from '$i18n/locale';
import { LLM_CHAPTERS } from './course';

const SOURCES = import.meta.glob('./chapters/**/*.svelte', {
	query: '?raw',
	import: 'default',
	eager: true
}) as Record<string, string>;

const GATE_PATTERN = /\bgate="([^"]+)"/g;
const CHALLENGE_PATTERN = /<Challenge[^>]*?\sid="([^"]+)"/gs;
const CHAPTER_FILE = /\/Chapter\.([a-z]{2})\.svelte$/;

function idsIn(pattern: RegExp, source: string): string[] {
	return Array.from(source.matchAll(pattern), (match) => match[1]);
}

/** La prosa de los otros idiomas no cuenta; los componentes compartidos sí. */
function sourcesFor(locale: Locale): [string, string][] {
	return Object.entries(SOURCES).filter(([path]) => {
		const match = CHAPTER_FILE.exec(path);
		return match === null || match[1] === locale;
	});
}

const declared = new Set(LLM_CHAPTERS.flatMap((chapter) => chapter.gates as readonly string[]));

const gatesByLocale = new Map<Locale, Map<string, string>>();

describe.each(LOCALES)('llm gate wiring (%s)', (locale) => {
	const usedGates = new Map<string, string>();
	const usedChallenges = new Map<string, string>();
	for (const [path, source] of sourcesFor(locale)) {
		for (const id of idsIn(GATE_PATTERN, source)) usedGates.set(id, path);
		for (const id of idsIn(CHALLENGE_PATTERN, source)) usedChallenges.set(id, path);
	}
	gatesByLocale.set(locale, usedGates);

	describe('WHEN a chapter declares a Step gate', () => {
		it('should point at a gate declared in the registry', () => {
			for (const [id, path] of usedGates) {
				expect(declared, `gate "${id}" used in ${path} is not declared`).toContain(id);
			}
		});

		it('should sit in the chapter that owns it', () => {
			for (const [id, path] of usedGates) {
				const chapterId = id.split(':')[0];
				expect(path, `gate "${id}" rendered outside its chapter`).toContain(`/${chapterId}/`);
			}
		});
	});

	describe('WHEN a chapter renders a Challenge', () => {
		it('should use an id declared in the registry', () => {
			for (const [id, path] of usedChallenges) {
				expect(declared, `Challenge id "${id}" in ${path} is not declared`).toContain(id);
			}
		});

		it('should be matched by a Step gate, or the chapter cannot be completed', () => {
			for (const [id] of usedChallenges) {
				expect(usedGates.has(id), `Challenge "${id}" has no Step gate`).toBe(true);
			}
		});
	});

	describe('WHEN the registry declares a gate', () => {
		it('should be rendered by some Challenge, or the chapter is unfinishable', () => {
			for (const gate of declared) {
				expect(usedChallenges.has(gate), `declared gate "${gate}" is never rendered`).toBe(true);
			}
		});
	});

	describe('WHEN the chapter sources are scanned', () => {
		it('should find prose for every chapter', () => {
			for (const chapter of LLM_CHAPTERS) {
				const found = sourcesFor(locale).some(([path]) =>
					path.endsWith(`/${chapter.id}/Chapter.${locale}.svelte`)
				);
				expect(found, `no ${locale} prose for ${chapter.id}`).toBe(true);
			}
		});

		it('should find at least as many gates as chapters', () => {
			expect(usedGates.size).toBeGreaterThanOrEqual(LLM_CHAPTERS.length);
		});
	});
});

describe('llm gate wiring across languages', () => {
	describe('WHEN the same chapter is read in another language', () => {
		it('should gate it on exactly the same challenges', () => {
			const [first, ...rest] = LOCALES;
			const reference = Array.from(gatesByLocale.get(first)?.keys() ?? []).sort();

			for (const locale of rest) {
				const other = Array.from(gatesByLocale.get(locale)?.keys() ?? []).sort();

				expect(other, `${locale} gates differ from ${first}`).toEqual(reference);
			}
		});
	});
});
