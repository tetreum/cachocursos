import { LLM_COURSE } from '$courses/llm/course';
import type { ChapterEntry, Course, CourseId } from './types';

/**
 * El único punto donde el framework conoce a los cursos.
 * Añadir un curso: una línea aquí. Quitarlo: borrar esa línea y su carpeta.
 */
export const COURSES: readonly Course[] = [LLM_COURSE];

export const COURSE_BY_ID: ReadonlyMap<CourseId, Course> = new Map(
	COURSES.map((course) => [course.id, course])
);

export function courseById(id: CourseId): Course | undefined {
	return COURSE_BY_ID.get(id);
}

export function isCourseId(value: string): boolean {
	return COURSE_BY_ID.has(value);
}

export function chapterOf(courseId: CourseId, chapterId: string): ChapterEntry | undefined {
	return courseById(courseId)?.chapters.find((chapter) => chapter.id === chapterId);
}

export function courseMinutes(course: Course): number {
	return course.chapters.reduce((total, chapter) => total + chapter.minutes, 0);
}

function neighbour(
	courseId: CourseId,
	chapterId: string,
	offset: number
): ChapterEntry | undefined {
	const chapters = courseById(courseId)?.chapters;
	if (chapters === undefined) return undefined;
	const index = chapters.findIndex((chapter) => chapter.id === chapterId);
	if (index < 0) return undefined;
	return chapters[index + offset];
}

export function nextChapter(courseId: CourseId, chapterId: string): ChapterEntry | undefined {
	return neighbour(courseId, chapterId, 1);
}

export function previousChapter(courseId: CourseId, chapterId: string): ChapterEntry | undefined {
	return neighbour(courseId, chapterId, -1);
}
