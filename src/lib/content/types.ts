import type { Component } from 'svelte';
import type { Locale } from '$i18n/locale';

/** Un texto que existe en cada idioma. */
export type Localized<Value = string> = Record<Locale, Value>;

export type CourseId = string;

export type ChapterId = string;

export type ChallengeId = string;

export type CourseStatus = 'ready' | 'coming-soon';

export interface ChallengeResult {
	score?: number;
	detail?: Record<string, number | string | boolean>;
}

export interface ChapterEntry<Id extends string = string> {
	readonly id: Id;
	readonly courseId: CourseId;
	readonly order: number;
	readonly title: Localized;
	readonly hook: Localized;
	readonly minutes: number;
	readonly gates: readonly `${Id}:${string}`[];
	readonly load: Localized<() => Promise<{ default: Component<Record<string, never>> }>>;
}

export interface Course {
	readonly id: CourseId;
	readonly title: Localized;
	readonly hook: Localized;
	readonly summary: Localized;
	readonly status: CourseStatus;
	readonly chapters: readonly ChapterEntry[];
}
