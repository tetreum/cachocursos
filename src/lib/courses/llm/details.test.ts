import { describe, it, expect } from 'vitest';

const SOURCES = import.meta.glob('./chapters/**/*.svelte', {
	query: '?raw',
	import: 'default',
	eager: true
}) as Record<string, string>;

const READ_PATTERN = /detail\?\.(\w+)/g;
const OPENING_PATTERN = /detail:\s*\{/g;
const FIELD_PATTERN = /(?:^|[,{])\s*(\w+)\s*:/gm;

function readsIn(source: string): string[] {
	return Array.from(source.matchAll(READ_PATTERN), (match) => match[1]);
}

/** El cuerpo del objeto, contando llaves: dentro hay plantillas con `${...}`. */
function bodyAt(source: string, start: number): string {
	let depth = 0;
	for (let index = start; index < source.length; index += 1) {
		if (source[index] === '{') depth += 1;
		if (source[index] === '}') {
			depth -= 1;
			if (depth === 0) return source.slice(start + 1, index);
		}
	}
	return '';
}

function writesIn(source: string): string[] {
	return Array.from(source.matchAll(OPENING_PATTERN)).flatMap((match) => {
		const body = bodyAt(source, match.index + match[0].length - 1);
		return Array.from(body.matchAll(FIELD_PATTERN), (field) => field[1]);
	});
}

const written = new Set<string>();
const read = new Map<string, string>();
for (const [path, source] of Object.entries(SOURCES)) {
	for (const field of writesIn(source)) written.add(field);
	for (const field of readsIn(source)) read.set(field, path);
}

/**
 * La prosa de los capítulos lee campos del resultado que guardan los minijuegos.
 * Si alguien renombra un campo en un lado y no en el otro, el texto sale con
 * huecos vacíos y nada falla: sólo se ve mal. Esto lo convierte en un error.
 */
describe('challenge result details', () => {
	describe('WHEN a chapter reads a field from a challenge result', () => {
		it('should read a field that some minigame actually writes', () => {
			for (const [field, path] of read) {
				expect(written, `«${field}», leído en ${path}, no lo escribe ningún minijuego`).toContain(
					field
				);
			}
		});
	});

	describe('WHEN the sources are scanned', () => {
		it('should find fields on both sides, or the scan is broken', () => {
			expect(written.size).toBeGreaterThan(5);
			expect(read.size).toBeGreaterThan(5);
		});
	});
});
