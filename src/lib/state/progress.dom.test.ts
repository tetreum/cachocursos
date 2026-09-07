import { describe, it, expect, beforeEach } from 'vitest';
import {
	LEGACY_STORAGE_KEY,
	SCHEMA_VERSION,
	STORAGE_KEY,
	migrateProgress,
	progress
} from './progress.svelte';
import { persisted } from './persisted.svelte';
import { COURSES } from '$content/courses';

const COURSE = COURSES[0].id;
const CHAPTERS = COURSES[0].chapters;
const FIRST = CHAPTERS[0];
const SECOND = CHAPTERS[1];

describe('progress store', () => {
	beforeEach(() => {
		progress.reset();
	});

	describe('WHEN nothing has been solved', () => {
		it('should unlock only the first chapter', () => {
			expect(progress.isChapterUnlocked(COURSE, FIRST.id)).toBe(true);
			expect(progress.isChapterUnlocked(COURSE, SECOND.id)).toBe(false);
		});

		it('should report the course as not started', () => {
			expect(progress.hasStarted(COURSE)).toBe(false);
			expect(progress.completedCount(COURSE)).toBe(0);
			expect(progress.coursePercent(COURSE)).toBe(0);
		});
	});

	describe('WHEN a chapter is completed', () => {
		it('should unlock the next one', () => {
			for (const gate of FIRST.gates) progress.solve(COURSE, gate, { score: 1 });

			expect(progress.isChapterComplete(COURSE, FIRST.id)).toBe(true);
			expect(progress.isChapterUnlocked(COURSE, SECOND.id)).toBe(true);
		});

		it('should keep the best score, not the latest', () => {
			const gate = FIRST.gates[0];

			progress.solve(COURSE, gate, { score: 90 });
			progress.solve(COURSE, gate, { score: 40 });

			expect(progress.resultOf(COURSE, gate)?.score).toBe(90);
		});
	});

	describe('WHEN two courses use the same chapter id', () => {
		it('should keep their progress apart', () => {
			const gate = FIRST.gates[0];

			progress.solve(COURSE, gate, { score: 5 });

			expect(progress.isSolved(COURSE, gate)).toBe(true);
			expect(progress.isSolved('otro', gate)).toBe(false);
		});

		it('should keep the step cursor apart', () => {
			progress.setStep(COURSE, FIRST.id, 3);

			expect(progress.stepOf(COURSE, FIRST.id)).toBe(3);
			expect(progress.stepOf('otro', FIRST.id)).toBe(0);
		});

		it('should reset one course without touching the other', () => {
			progress.solve(COURSE, FIRST.gates[0], { score: 1 });
			progress.solve('otro', FIRST.gates[0], { score: 1 });

			progress.resetCourse(COURSE);

			expect(progress.isSolved(COURSE, FIRST.gates[0])).toBe(false);
			expect(progress.isSolved('otro', FIRST.gates[0])).toBe(true);
		});
	});

	describe('WHEN the step cursor moves', () => {
		it('should never go backwards', () => {
			progress.setStep(COURSE, FIRST.id, 4);
			progress.setStep(COURSE, FIRST.id, 2);

			expect(progress.stepOf(COURSE, FIRST.id)).toBe(4);
		});
	});

	describe('WHEN gates are skipped for development', () => {
		it('should unlock everything', () => {
			progress.setSkipGates(true);

			expect(progress.isChapterUnlocked(COURSE, CHAPTERS[CHAPTERS.length - 1].id)).toBe(true);

			progress.setSkipGates(false);
		});
	});

	describe('WHEN an unknown chapter is queried', () => {
		it('should report it as locked rather than throwing', () => {
			expect(progress.isChapterUnlocked(COURSE, 'no-existe' as typeof FIRST.id)).toBe(false);
			expect(progress.isChapterComplete(COURSE, 'no-existe' as typeof FIRST.id)).toBe(false);
		});
	});
});

describe('progress migration', () => {
	const gate = FIRST.gates[0];

	describe('WHEN a v1 payload is migrated', () => {
		it('should move everything under the llm course', () => {
			const result = migrateProgress({
				version: 1,
				solved: { [gate]: { score: 7, at: 1 } },
				step: { [FIRST.id]: 2 },
				settings: { skipGates: false }
			});

			expect(result?.version).toBe(SCHEMA_VERSION);
			expect(result?.courses.llm?.solved[gate]?.score).toBe(7);
			expect(result?.courses.llm?.step[FIRST.id]).toBe(2);
		});

		it('should carry the settings across', () => {
			const result = migrateProgress({
				version: 1,
				solved: {},
				step: {},
				settings: { skipGates: true }
			});

			expect(result?.settings.skipGates).toBe(true);
		});

		it('should cope with a v1 payload missing fields', () => {
			const result = migrateProgress({ version: 1 });

			expect(result?.courses.llm).toEqual({ solved: {}, step: {} });
		});
	});

	describe('WHEN a v2 payload is read back', () => {
		it('should keep every course separate', () => {
			const result = migrateProgress({
				version: 2,
				courses: {
					llm: { solved: { [gate]: { score: 1, at: 0 } }, step: {} },
					otro: { solved: {}, step: { intro: 4 } }
				},
				settings: { skipGates: false }
			});

			expect(Object.keys(result?.courses ?? {})).toEqual([COURSE, 'otro']);
			expect(result?.courses.llm?.solved[gate]).toBeTruthy();
		});
	});

	describe('WHEN the payload is unusable', () => {
		it.each`
			label                 | raw
			${'null'}             | ${null}
			${'a string'}         | ${'nope'}
			${'a future version'} | ${{ version: 99 }}
		`('should refuse $label', ({ raw }) => {
			expect(migrateProgress(raw)).toBeNull();
		});
	});
});

describe('persisted storage', () => {
	beforeEach(() => {
		localStorage.clear();
	});

	describe('WHEN only a legacy key is present', () => {
		it('should read it and rewrite under the current key', () => {
			localStorage.setItem(
				LEGACY_STORAGE_KEY,
				JSON.stringify({ version: 1, solved: {}, step: {} })
			);

			const store = persisted(
				STORAGE_KEY,
				() => ({ version: SCHEMA_VERSION, courses: {}, settings: { skipGates: false } }),
				migrateProgress,
				LEGACY_STORAGE_KEY
			);
			store.hydrate();

			expect(store.value.version).toBe(SCHEMA_VERSION);
			expect(JSON.parse(localStorage.getItem(STORAGE_KEY) as string).version).toBe(SCHEMA_VERSION);
		});
	});

	describe('WHEN the current key holds corrupt data', () => {
		it('should keep the defaults instead of throwing', () => {
			localStorage.setItem(STORAGE_KEY, '{{{not json');

			const store = persisted(
				STORAGE_KEY,
				() => ({ version: SCHEMA_VERSION, courses: {}, settings: { skipGates: false } }),
				migrateProgress
			);

			expect(() => store.hydrate()).not.toThrow();
			expect(store.value.courses).toEqual({});
		});
	});
});

describe('progress detail key migration', () => {
	describe('WHEN a result was saved with the old Spanish detail keys', () => {
		it('should rename them so the chapter prose can still read the result', () => {
			const stored = {
				version: 2,
				courses: {
					llm: {
						solved: {
							'01-prediccion:adivina': {
								at: 1,
								score: 67,
								detail: { aciertos: 4, rondas: 6, precision: '67%' }
							}
						},
						step: {}
					}
				},
				settings: { skipGates: false }
			};

			const migrated = migrateProgress(stored);

			expect(migrated?.courses.llm?.solved['01-prediccion:adivina'].detail).toEqual({
				hits: 4,
				rounds: 6,
				accuracy: '67%'
			});
		});

		it('should keep the score and the timestamp untouched', () => {
			const stored = {
				version: 2,
				courses: {
					llm: {
						solved: { 'x:y': { at: 42, score: 7, detail: { parecido: '80%' } } },
						step: {}
					}
				},
				settings: { skipGates: false }
			};

			const migrated = migrateProgress(stored);
			const record = migrated?.courses.llm?.solved['x:y'];

			expect(record?.at).toBe(42);
			expect(record?.score).toBe(7);
			expect(record?.detail).toEqual({ similarity: '80%' });
		});

		it('should leave a result with no detail alone', () => {
			const stored = {
				version: 2,
				courses: { llm: { solved: { 'x:y': { at: 1 } }, step: {} } },
				settings: { skipGates: false }
			};

			const migrated = migrateProgress(stored);

			expect(migrated?.courses.llm?.solved['x:y']).toEqual({ at: 1 });
		});
	});
});
