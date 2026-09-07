import type { Locale } from '$i18n/locale';
import type { CourseData } from './types';
import { SPANISH } from './es';
import { ENGLISH } from './en';

/**
 * Los datos del curso por idioma. Los capítulos importan su idioma directamente;
 * esto es para los tests, que recorren los dos y comprueban que las propiedades
 * que hacen jugables los minijuegos se cumplen en ambos.
 */
export const DATA_BY_LOCALE: Record<Locale, CourseData> = { es: SPANISH, en: ENGLISH };
