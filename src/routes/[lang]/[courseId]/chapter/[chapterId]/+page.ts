import { error } from '@sveltejs/kit';
import { COURSES, courseById, isCourseId } from '$content/courses';
import { LOCALES, isLocale, translate } from '$i18n/locale';
import type { EntryGenerator, PageLoad } from './$types';

export const prerender = true;

export const entries: EntryGenerator = () =>
	LOCALES.flatMap((lang) =>
		COURSES.flatMap((course) =>
			course.chapters.map((chapter) => ({ lang, courseId: course.id, chapterId: chapter.id }))
		)
	);

export const load: PageLoad = async ({ params }) => {
	if (!isLocale(params.lang)) error(404, 'Unknown language');
	if (!isCourseId(params.courseId)) error(404, translate(params.lang, 'ERROR_NO_COURSE'));

	const course = courseById(params.courseId);
	const entry = course?.chapters.find((chapter) => chapter.id === params.chapterId);
	if (course === undefined || entry === undefined) {
		error(404, translate(params.lang, 'ERROR_NO_CHAPTER'));
	}

	const module = await entry.load[params.lang]();
	return { course, entry, locale: params.lang, Content: module.default };
};
