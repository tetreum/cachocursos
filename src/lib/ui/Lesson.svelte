<script lang="ts">
	import { untrack, type Snippet } from 'svelte';
	import type { ChapterEntry } from '$content/types';
	import { progress } from '$state/progress.svelte';
	import { createTranslator, getLocale } from '$i18n/locale';
	import { setLesson } from './lesson.svelte';
	import ProgressRail from './ProgressRail.svelte';
	import ChapterFooter from './ChapterFooter.svelte';

	const t = createTranslator();

	interface LessonProps {
		entry: ChapterEntry;
		children: Snippet;
	}

	let { entry, children }: LessonProps = $props();

	const locale = getLocale();
	const lesson = untrack(() => setLesson(entry.courseId, entry.id));

	$effect(() => {
		lesson.settle();
		if (progress.hydrated) lesson.restoreCursor();
	});
</script>

<article class="e-lesson">
	<header class="e-lesson__header">
		<p class="e-lesson__eyebrow">{t('CHAPTER_EYEBROW', { order: entry.order })}</p>
		<h1 class="e-lesson__title">{entry.title[locale]}</h1>
		<p class="e-lesson__hook">{entry.hook[locale]}</p>
	</header>

	<div class="e-lesson__rail">
		<ProgressRail percent={lesson.percent} cursor={lesson.cursor} total={lesson.total} />
	</div>

	<div class="e-lesson__body">{@render children()}</div>

	<ChapterFooter {entry} finished={lesson.isFinished} />
</article>

<style lang="scss">
	.e-lesson {
		display: flex;
		flex-direction: column;
		padding-inline: var(--e-space-lg);
		padding-bottom: var(--e-space-4xl);

		&__header {
			@include measure;

			display: flex;
			flex-direction: column;
			gap: var(--e-space-xs);
			width: 100%;
			padding-top: var(--e-space-3xl);
		}

		&__eyebrow {
			font-size: var(--e-text-xs);
			font-weight: var(--e-weight-bold);
			color: var(--e-accent);
			letter-spacing: var(--e-tracking-wide);
			text-transform: uppercase;
		}

		&__title {
			font-size: var(--e-text-3xl);
		}

		&__hook {
			font-size: var(--e-text-lg);
			color: var(--e-fg-muted);
			text-wrap: balance;
		}

		&__rail {
			@include measure;

			width: 100%;
			padding-top: var(--e-space-lg);
		}

		&__body {
			display: flex;
			flex-direction: column;
		}
	}
</style>
