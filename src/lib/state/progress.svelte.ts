import { courseById } from '$content/courses';
import type {
	ChallengeId,
	ChallengeResult,
	ChapterEntry,
	ChapterId,
	CourseId
} from '$content/types';
import { persisted } from './persisted.svelte';

/** El nombre del hueco donde se guarda. El contenido lleva su propia `version`. */
export const STORAGE_KEY = 'cachocursos.progress.v2';
export const LEGACY_STORAGE_KEY = 'cachocursos.progress.v1';
const LEGACY_COURSE = 'llm';
export const SCHEMA_VERSION = 3;

/**
 * Los minijuegos guardaban el detalle de cada resultado con claves en español.
 * Al pasarlas a inglés, los resultados ya guardados se quedaron sin leer y la
 * prosa mostraba huecos vacíos. Esto los renombra al recuperarlos.
 */
const RENAMED_DETAIL_KEYS: Record<string, string> = {
	aciertos: 'hits',
	rondas: 'rounds',
	precision: 'accuracy',
	bloques: 'blocks',
	calidad: 'quality',
	coincidencias: 'matches',
	ediciones: 'edits',
	falsosPositivos: 'falsePositives',
	intentos: 'attempts',
	parametros: 'parameters',
	parecido: 'similarity',
	pasos: 'steps',
	tareas: 'tasks',
	temperatura: 'temperature',
	tokensPorParametro: 'tokensPerParameter',
	umbral: 'threshold',
	zInicial: 'initialZ',
	rasgoDominante: 'dominantTrait'
};

function renameDetailKeys(solved: Record<string, SolveRecord>): Record<string, SolveRecord> {
	const renamed: Record<string, SolveRecord> = {};
	for (const [id, record] of Object.entries(solved)) {
		if (record.detail === undefined) {
			renamed[id] = record;
			continue;
		}
		const detail: NonNullable<ChallengeResult['detail']> = {};
		for (const [key, value] of Object.entries(record.detail)) {
			detail[RENAMED_DETAIL_KEYS[key] ?? key] = value;
		}
		renamed[id] = { ...record, detail };
	}
	return renamed;
}

function renameCourseDetails(
	courses: Partial<Record<CourseId, CourseProgress>>
): Partial<Record<CourseId, CourseProgress>> {
	const migrated: Partial<Record<CourseId, CourseProgress>> = {};
	for (const [courseId, course] of Object.entries(courses)) {
		if (course === undefined) continue;
		migrated[courseId] = { ...course, solved: renameDetailKeys(course.solved) };
	}
	return migrated;
}
const FIRST_CHAPTER_ORDER = 1;
const PERCENT_SCALE = 100;

interface SolveRecord extends ChallengeResult {
	at: number;
}

interface CourseProgress {
	solved: Record<string, SolveRecord>;
	step: Record<string, number>;
}

export interface ProgressSnapshot {
	version: number;
	courses: Partial<Record<CourseId, CourseProgress>>;
	settings: { skipGates: boolean };
}

function emptyCourse(): CourseProgress {
	return { solved: {}, step: {} };
}

function createEmpty(): ProgressSnapshot {
	return { version: SCHEMA_VERSION, courses: {}, settings: { skipGates: false } };
}

interface LegacySnapshot {
	version: number;
	solved?: Record<string, SolveRecord>;
	step?: Record<string, number>;
	settings?: { skipGates?: boolean };
}

export function migrateProgress(raw: unknown): ProgressSnapshot | null {
	if (raw === null || typeof raw !== 'object') return null;
	const candidate = raw as Partial<ProgressSnapshot> & LegacySnapshot;

	if (candidate.version === 1) {
		return {
			version: SCHEMA_VERSION,
			courses: {
				[LEGACY_COURSE]: {
					solved: renameDetailKeys(candidate.solved ?? {}),
					step: candidate.step ?? {}
				}
			},
			settings: { skipGates: candidate.settings?.skipGates ?? false }
		};
	}

	if (candidate.version === 2) {
		return {
			version: SCHEMA_VERSION,
			courses: renameCourseDetails(candidate.courses ?? {}),
			settings: { skipGates: candidate.settings?.skipGates ?? false }
		};
	}

	if (candidate.version !== SCHEMA_VERSION) return null;

	return {
		version: SCHEMA_VERSION,
		courses: candidate.courses ?? {},
		settings: { skipGates: candidate.settings?.skipGates ?? false }
	};
}

class ProgressStore {
	#stored = persisted<ProgressSnapshot>(
		STORAGE_KEY,
		createEmpty,
		migrateProgress,
		LEGACY_STORAGE_KEY
	);

	hydrate(): void {
		this.#stored.hydrate();
	}

	get hydrated(): boolean {
		return this.#stored.hydrated;
	}

	get skipGates(): boolean {
		return this.#stored.value.settings.skipGates;
	}

	setSkipGates(enabled: boolean): void {
		this.#stored.update((draft) => {
			draft.settings.skipGates = enabled;
		});
	}

	#courseOf(courseId: CourseId): CourseProgress {
		return this.#stored.value.courses[courseId] ?? emptyCourse();
	}

	#mutateCourse(courseId: CourseId, mutate: (draft: CourseProgress) => void): void {
		this.#stored.update((draft) => {
			let course = draft.courses[courseId];
			if (course === undefined) {
				course = emptyCourse();
				draft.courses[courseId] = course;
			}
			mutate(course);
		});
	}

	isSolved(courseId: CourseId, id: ChallengeId): boolean {
		return this.#courseOf(courseId).solved[id] !== undefined;
	}

	resultOf(courseId: CourseId, id: ChallengeId): ChallengeResult | null {
		return this.#courseOf(courseId).solved[id] ?? null;
	}

	solve(courseId: CourseId, id: ChallengeId, result: ChallengeResult = {}): void {
		const previous = this.#courseOf(courseId).solved[id];
		if (previous !== undefined && (previous.score ?? 0) >= (result.score ?? 0)) return;
		this.#mutateCourse(courseId, (draft) => {
			draft.solved[id] = { ...result, at: Date.now() };
		});
	}

	stepOf(courseId: CourseId, chapterId: ChapterId): number {
		return this.#courseOf(courseId).step[chapterId] ?? 0;
	}

	setStep(courseId: CourseId, chapterId: ChapterId, index: number): void {
		if (index <= this.stepOf(courseId, chapterId)) return;
		this.#mutateCourse(courseId, (draft) => {
			draft.step[chapterId] = index;
		});
	}

	#chapters(courseId: CourseId): readonly ChapterEntry[] {
		return courseById(courseId)?.chapters ?? [];
	}

	#chapter(courseId: CourseId, chapterId: ChapterId): ChapterEntry | undefined {
		return this.#chapters(courseId).find((chapter) => chapter.id === chapterId);
	}

	isChapterComplete(courseId: CourseId, chapterId: ChapterId): boolean {
		const chapter = this.#chapter(courseId, chapterId);
		if (chapter === undefined) return false;
		return chapter.gates.every((gate) => this.isSolved(courseId, gate));
	}

	isChapterUnlocked(courseId: CourseId, chapterId: ChapterId): boolean {
		if (this.skipGates) return true;
		const chapters = this.#chapters(courseId);
		const chapter = this.#chapter(courseId, chapterId);
		if (chapter === undefined) return false;
		if (chapter.order === FIRST_CHAPTER_ORDER) return true;
		const previous = chapters[chapter.order - 2];
		return previous === undefined ? false : this.isChapterComplete(courseId, previous.id);
	}

	completedCount(courseId: CourseId): number {
		return this.#chapters(courseId).filter((chapter) =>
			this.isChapterComplete(courseId, chapter.id)
		).length;
	}

	coursePercent(courseId: CourseId): number {
		const total = this.#chapters(courseId).length;
		if (total === 0) return 0;
		return Math.round((this.completedCount(courseId) / total) * PERCENT_SCALE);
	}

	hasStarted(courseId: CourseId): boolean {
		const course = this.#courseOf(courseId);
		return Object.keys(course.solved).length > 0 || Object.keys(course.step).length > 0;
	}

	resetCourse(courseId: CourseId): void {
		this.#mutateCourse(courseId, (draft) => {
			draft.solved = {};
			draft.step = {};
		});
	}

	reset(): void {
		this.#stored.replace(createEmpty());
	}
}

export const progress = new ProgressStore();
