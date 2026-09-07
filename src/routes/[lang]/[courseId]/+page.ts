import { error } from '@sveltejs/kit';
import { COURSES, courseById, isCourseId } from '$content/courses';
import { LOCALES, isLocale, translate } from '$i18n/locale';
import type { EntryGenerator, PageLoad } from './$types';

export const prerender = true;

export const entries: EntryGenerator = () =>
	LOCALES.flatMap((lang) => COURSES.map((course) => ({ lang, courseId: course.id })));

export const load: PageLoad = ({ params }) => {
	if (!isLocale(params.lang)) error(404, 'Unknown language');
	if (!isCourseId(params.courseId)) error(404, translate(params.lang, 'ERROR_NO_COURSE'));

	const course = courseById(params.courseId);
	if (course === undefined) error(404, translate(params.lang, 'ERROR_NO_COURSE'));

	return { course, locale: params.lang };
};
