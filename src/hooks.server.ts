import { DEFAULT_LOCALE, isLocale } from '$i18n/locale';
import type { Handle } from '@sveltejs/kit';

/**
 * El idioma va en el primer segmento de la ruta. Como el sitio es estático, esto
 * corre en tiempo de prerender y queda horneado en cada HTML.
 */
export const handle: Handle = async ({ event, resolve }) => {
	const segment = event.url.pathname.split('/')[1] ?? '';
	const lang = isLocale(segment) ? segment : DEFAULT_LOCALE;

	return resolve(event, {
		transformPageChunk: ({ html }) => html.replace('%lang%', lang)
	});
};
