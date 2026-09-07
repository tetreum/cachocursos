import { getContext, setContext } from 'svelte';
import type { ChallengeId, ChapterId, CourseId } from '$content/types';
import { progress } from '$state/progress.svelte';

const LESSON_CONTEXT_KEY = Symbol('lesson');
const COURSE_CONTEXT_KEY = Symbol('course');

export class LessonState {
	readonly #courseId: CourseId;
	readonly chapterId: ChapterId;

	#gates: (ChallengeId | null)[] = [];
	#claimed = 0;
	#restored = false;

	total = $state(0);
	cursor = $state(0);

	constructor(courseId: CourseId, chapterId: ChapterId) {
		this.#courseId = courseId;
		this.chapterId = chapterId;
	}

	get courseId(): CourseId {
		return this.#courseId;
	}

	claimIndex(gate: ChallengeId | null): number {
		const index = this.#claimed;
		this.#gates[index] = gate;
		this.#claimed += 1;
		return index;
	}

	settle(): void {
		this.total = this.#claimed;
	}

	restoreCursor(): void {
		if (this.#restored || !progress.hydrated) return;
		this.#restored = true;
		const saved = progress.stepOf(this.courseId, this.chapterId);
		if (saved > this.cursor) this.cursor = Math.min(saved, Math.max(this.#claimed - 1, 0));
	}

	gateAt(index: number): ChallengeId | null {
		return this.#gates[index] ?? null;
	}

	isVisible(index: number): boolean {
		return index <= this.cursor;
	}

	readonly currentGate = $derived(this.gateAt(this.cursor));

	readonly canAdvance = $derived(
		this.currentGate === null || progress.isSolved(this.courseId, this.currentGate)
	);

	readonly isLastStep = $derived(this.total > 0 && this.cursor >= this.total - 1);

	readonly isFinished = $derived(this.isLastStep && this.canAdvance);

	readonly percent = $derived(
		this.total === 0 ? 0 : Math.round(((this.cursor + 1) / this.total) * 100)
	);

	advance(): void {
		if (!this.canAdvance || this.cursor >= this.total - 1) return;
		this.cursor += 1;
		progress.setStep(this.courseId, this.chapterId, this.cursor);
	}

	jumpTo(index: number): void {
		if (index >= 0 && index <= this.cursor) this.cursor = index;
	}
}

export function setCourseId(courseId: CourseId): CourseId {
	return setContext(COURSE_CONTEXT_KEY, courseId);
}

export function getCourseId(): CourseId {
	return getContext<CourseId>(COURSE_CONTEXT_KEY);
}

export function setLesson(courseId: CourseId, chapterId: ChapterId): LessonState {
	setCourseId(courseId);
	return setContext(LESSON_CONTEXT_KEY, new LessonState(courseId, chapterId));
}

export function getLesson(): LessonState {
	return getContext<LessonState>(LESSON_CONTEXT_KEY);
}
