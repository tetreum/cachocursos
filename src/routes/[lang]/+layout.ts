import { error } from '@sveltejs/kit';
import { isLocale } from '$i18n/locale';
import type { LayoutLoad } from './$types';

export const prerender = true;

export const load: LayoutLoad = ({ params }) => {
	if (!isLocale(params.lang)) error(404, 'Unknown language');
	return { locale: params.lang };
};
