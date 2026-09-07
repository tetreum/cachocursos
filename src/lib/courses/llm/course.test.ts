import { describe, it, expect } from 'vitest';
import { LLM_CHAPTERS, LLM_CHAPTER_IDS, LLM_COURSE } from './course';
import { LOCALES } from '$i18n/locale';
import COURSE_SOURCE from './course.ts?raw';

describe('llm course', () => {
	describe('WHEN the course is assembled', () => {
		it('should list every declared chapter id exactly once', () => {
			expect(LLM_CHAPTERS.map((chapter) => chapter.id)).toEqual([...LLM_CHAPTER_IDS]);
		});

		it('should number chapters consecutively from one', () => {
			LLM_CHAPTERS.forEach((chapter, index) => {
				expect(chapter.order).toBe(index + 1);
			});
		});

		it('should keep the id prefix in step with the order', () => {
			for (const chapter of LLM_CHAPTERS) {
				expect(Number(chapter.id.slice(0, 2))).toBe(chapter.order);
			}
		});

		it('should tag every chapter with this course', () => {
			for (const chapter of LLM_CHAPTERS) {
				expect(chapter.courseId).toBe(LLM_COURSE.id);
			}
		});

		it('should give every chapter at least one gate', () => {
			for (const chapter of LLM_CHAPTERS) {
				expect(chapter.gates.length).toBeGreaterThan(0);
			}
		});

		it('should prefix every gate with its own chapter id', () => {
			for (const chapter of LLM_CHAPTERS) {
				for (const gate of chapter.gates) {
					expect(gate.startsWith(`${chapter.id}:`)).toBe(true);
				}
			}
		});

		it('should not reuse a gate id across chapters', () => {
			const gates = LLM_CHAPTERS.flatMap((chapter) => chapter.gates);

			expect(new Set(gates).size).toBe(gates.length);
		});

		it('should load every chapter from inside this course folder, in every language', () => {
			for (const chapter of LLM_CHAPTERS) {
				for (const locale of LOCALES) {
					expect(COURSE_SOURCE).toContain(
						`import('./chapters/${chapter.id}/Chapter.${locale}.svelte')`
					);
				}
			}
		});

		it('should offer every chapter in every language', () => {
			for (const chapter of LLM_CHAPTERS) {
				for (const locale of LOCALES) {
					expect(typeof chapter.load[locale]).toBe('function');
					expect(chapter.title[locale].length).toBeGreaterThan(0);
					expect(chapter.hook[locale].length).toBeGreaterThan(0);
				}
			}
		});

		it('should end with watermarking as the finale', () => {
			expect(LLM_CHAPTERS[LLM_CHAPTERS.length - 1].id).toBe('14-watermark');
		});
	});

	describe('WHEN a chapter component is requested', () => {
		it.each(LOCALES)('should resolve every lazy import in %s', async (locale) => {
			for (const chapter of LLM_CHAPTERS) {
				const module = await chapter.load[locale]();
				expect(module.default).toBeTruthy();
			}
		});
	});
});
