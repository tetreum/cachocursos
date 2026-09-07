import { interpolate, localeSource, translatorFor, type Locale, type Values } from '$i18n/locale';
import es from './locales/es.json';
import en from './locales/en.json';

export type CourseMessageKey = keyof typeof es;

/** Mismo seguro que en el catálogo del framework: al inglés no le puede faltar una clave. */
const CATALOGS = { es, en } satisfies Record<Locale, Record<CourseMessageKey, string>>;

export type CourseTranslator = (key: CourseMessageKey, values?: Values) => string;

export function courseTranslate(locale: Locale, key: CourseMessageKey, values?: Values): string {
	return interpolate(CATALOGS[locale][key], values);
}

/**
 * Traductor del curso atado en la inicialización del componente, para que los
 * minijuegos puedan pedir texto también desde un manejador o un efecto.
 */
export function createCourseTranslator(): CourseTranslator {
	const source = localeSource();
	return (key, values) => courseTranslate(source.current, key, values);
}

export { translatorFor };
