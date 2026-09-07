import { describe, it, expect } from 'vitest';
import {
	COURSES,
	courseById,
	courseMinutes,
	isCourseId,
	chapterOf,
	nextChapter,
	previousChapter
} from './courses';

describe('course registry', () => {
	describe('WHEN courses are registered', () => {
		it('should keep course ids unique', () => {
			const ids = COURSES.map((course) => course.id);

			expect(new Set(ids).size).toBe(ids.length);
		});

		it('should keep chapter ids unique inside each course', () => {
			for (const course of COURSES) {
				const ids = course.chapters.map((chapter) => chapter.id);
				expect(new Set(ids).size).toBe(ids.length);
			}
		});

		it('should have every chapter declare the course that holds it', () => {
			for (const course of COURSES) {
				for (const chapter of course.chapters) {
					expect(chapter.courseId).toBe(course.id);
				}
			}
		});

		it('should number each course consecutively from one', () => {
			for (const course of COURSES) {
				course.chapters.forEach((chapter, index) => {
					expect(chapter.order).toBe(index + 1);
				});
			}
		});

		it('should report a duration for every ready course', () => {
			for (const course of COURSES) {
				if (course.status !== 'ready') continue;
				expect(course.chapters.length).toBeGreaterThan(0);
				expect(courseMinutes(course)).toBeGreaterThan(0);
			}
		});
	});

	describe('WHEN a course id arrives from the URL', () => {
		it('should accept a registered course', () => {
			expect(isCourseId(COURSES[0].id)).toBe(true);
		});

		it.each`
			value          | valid
			${'no-existe'} | ${false}
			${''}          | ${false}
		`('should reject "$value"', ({ value, valid }) => {
			expect(isCourseId(value as string)).toBe(valid as boolean);
		});

		it('should return nothing for an unknown course', () => {
			expect(courseById('no-existe')).toBeUndefined();
			expect(chapterOf('no-existe', 'x')).toBeUndefined();
		});
	});

	describe('WHEN walking a course forwards and backwards', () => {
		it('should link each chapter to its neighbour', () => {
			for (const course of COURSES) {
				const chapters = course.chapters;
				for (let index = 0; index + 1 < chapters.length; index += 1) {
					expect(nextChapter(course.id, chapters[index].id)?.id).toBe(chapters[index + 1].id);
					expect(previousChapter(course.id, chapters[index + 1].id)?.id).toBe(chapters[index].id);
				}
			}
		});

		it('should stop at the edges instead of running into another course', () => {
			for (const course of COURSES) {
				const chapters = course.chapters;
				expect(nextChapter(course.id, chapters[chapters.length - 1].id)).toBeUndefined();
				expect(previousChapter(course.id, chapters[0].id)).toBeUndefined();
			}
		});
	});
});
