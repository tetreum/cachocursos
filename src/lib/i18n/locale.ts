import { getContext, setContext } from 'svelte';
import es from '../../locales/es.json';
import en from '../../locales/en.json';

export const LOCALES = ['es', 'en'] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'es';

export type MessageKey = keyof typeof es;

/**
 * El `satisfies` es la red de seguridad: si a en.json le falta una clave que
 * es.json tiene, esto es un error de compilación, no un texto ausente en producción.
 */
const CATALOGS = { es, en } satisfies Record<Locale, Record<MessageKey, string>>;

export const LOCALE_NAMES: Record<Locale, string> = {
	es: 'Español',
	en: 'English'
};

export type Values = Record<string, string | number>;

export function isLocale(value: string): value is Locale {
	return (LOCALES as readonly string[]).includes(value);
}

export function interpolate(template: string, values?: Values): string {
	if (values === undefined) return template;
	return template.replace(/\{(\w+)\}/g, (whole, key: string) =>
		key in values ? String(values[key]) : whole
	);
}

export function translate(locale: Locale, key: MessageKey, values?: Values): string {
	return interpolate(CATALOGS[locale][key], values);
}

export type Translator = (key: MessageKey, values?: Values) => string;

export function translatorFor(locale: Locale): Translator {
	return (key, values) => translate(locale, key, values);
}

const LOCALE_CONTEXT_KEY = Symbol('locale');

/**
 * El idioma vivo, no una copia. Al cambiar de idioma la ruta es la misma, así que
 * SvelteKit reutiliza los componentes: si el contexto guardara el valor, todo lo
 * que lo leyó al inicializarse se quedaría en el idioma anterior.
 */
export interface LocaleSource {
	readonly current: Locale;
}

export function setLocale(locale: Locale | (() => Locale)): LocaleSource {
	const source: LocaleSource =
		typeof locale === 'function'
			? {
					get current() {
						return locale();
					}
				}
			: { current: locale };
	return setContext(LOCALE_CONTEXT_KEY, source);
}

/** Hay que llamarlo durante la inicialización del componente; leerlo, no. */
export function localeSource(): LocaleSource {
	return getContext<LocaleSource>(LOCALE_CONTEXT_KEY) ?? { current: DEFAULT_LOCALE };
}

export function getLocale(): Locale {
	return localeSource().current;
}

export function t(key: MessageKey, values?: Values): string {
	return translate(getLocale(), key, values);
}

/**
 * Traductor tomado en la inicialización del componente. `t()` lee el contexto en
 * cada llamada, y el contexto sólo existe mientras el componente se inicializa:
 * desde un manejador de eventos o un efecto reventaría. Esto coge el contexto una
 * vez, pero el idioma lo lee en cada traducción, así que sigue al idioma actual.
 */
export function createTranslator(): Translator {
	const source = localeSource();
	return (key, values) => translate(source.current, key, values);
}

/** Elige el mejor idioma disponible a partir de las preferencias del navegador. */
export function preferredLocale(languages: readonly string[]): Locale {
	for (const language of languages) {
		const base = language.toLowerCase().split('-')[0];
		if (isLocale(base)) return base;
	}
	return DEFAULT_LOCALE;
}
