import { LOCALES } from '$i18n/locale';
import type { EntryGenerator } from './$types';

export const prerender = true;

export const entries: EntryGenerator = () => LOCALES.map((lang) => ({ lang }));
