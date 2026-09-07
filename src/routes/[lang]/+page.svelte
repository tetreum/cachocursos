<script lang="ts">
	import { resolve } from '$app/paths';
	import { COURSES, courseMinutes } from '$content/courses';
	import type { ChapterEntry, CourseId } from '$content/types';
	import { progress } from '$state/progress.svelte';
	import { translatorFor } from '$i18n/locale';
	import type { PageData } from './$types';

	interface IndexPageProps {
		data: PageData;
	}

	let { data }: IndexPageProps = $props();

	const locale = $derived(data.locale);
	const t = $derived(translatorFor(locale));

	const PERCENT = 100;
	const MINUTES_PER_HOUR = 60;

	function completedIn(courseId: CourseId, chapters: readonly ChapterEntry[]): number {
		return chapters.filter((chapter) => progress.isChapterComplete(courseId, chapter.id)).length;
	}
</script>

<svelte:head>
	<title>{t('INDEX_TITLE')}</title>
	<meta name="description" content={t('INDEX_DESCRIPTION')} />
</svelte:head>

<div class="e-index">
	<header class="e-index__hero">
		<h1 class="e-index__title">{t('INDEX_HERO_TITLE')}</h1>
		<p class="e-index__lead">{t('INDEX_DESCRIPTION')}</p>
	</header>

	<ul class="e-index__list">
		{#each COURSES as course (course.id)}
			{@const total = course.chapters.length}
			{@const done = completedIn(course.id, course.chapters)}
			{@const percent = total === 0 ? 0 : Math.round((done / total) * PERCENT)}
			{@const ready = course.status === 'ready'}
			<li>
				<a
					class="e-course"
					class:e-course--soon={!ready}
					href={ready
						? resolve('/[lang]/[courseId]', { lang: locale, courseId: course.id })
						: undefined}
					aria-disabled={!ready}
				>
					<div class="e-course__head">
						<h2 class="e-course__name">{course.title[locale]}</h2>
						{#if ready}
							{#if done === total && total > 0}
								<span class="e-course__badge e-course__badge--done">{t('INDEX_BADGE_DONE')}</span>
							{:else if done > 0}
								<span class="e-course__badge e-course__badge--started"
									>{t('INDEX_BADGE_STARTED')}</span
								>
							{/if}
						{:else}
							<span class="e-course__badge">{t('INDEX_BADGE_SOON')}</span>
						{/if}
					</div>

					<p class="e-course__hook">{course.hook[locale]}</p>

					<div class="e-course__meta">
						<span>{t('INDEX_CHAPTER_COUNT', { count: total })}</span>
						<span>·</span>
						<span
							>{t('INDEX_HOURS', {
								hours: Math.round(courseMinutes(course) / MINUTES_PER_HOUR)
							})}</span
						>
					</div>

					{#if ready && done > 0}
						<div class="e-course__progress">
							<span class="e-course__track">
								<span class="e-course__fill" style:width="{percent}%"></span>
							</span>
							<span class="e-course__percent">{done}/{total}</span>
						</div>
					{/if}
				</a>
			</li>
		{/each}
	</ul>
</div>

<style lang="scss">
	.e-index {
		display: flex;
		flex-direction: column;
		gap: var(--e-space-3xl);
		padding: var(--e-space-4xl) var(--e-space-lg);

		&__hero {
			@include measure;

			display: flex;
			flex-direction: column;
			gap: var(--e-space-md);
			width: 100%;
		}

		&__title {
			font-size: var(--e-text-4xl);
		}

		&__lead {
			font-size: var(--e-text-lg);
			color: var(--e-fg-muted);
		}

		&__list {
			@include measure(var(--e-measure-wide));

			display: grid;
			grid-template-columns: repeat(auto-fill, minmax(19rem, 1fr));
			gap: var(--e-space-md);
			width: 100%;
			padding: 0;
			margin-block: 0;
			list-style: none;
		}
	}

	.e-course {
		@include card;
		@include focus-ring;

		display: flex;
		flex-direction: column;
		gap: var(--e-space-xs);
		height: 100%;
		padding: var(--e-space-xl);
		color: inherit;
		text-decoration: none;
		transition:
			border-color var(--e-dur-fast) var(--e-ease-out),
			transform var(--e-dur-fast) var(--e-ease-out);

		&:hover:not(&--soon) {
			border-color: var(--e-accent);
			transform: translateY(-2px);
		}

		&--soon {
			cursor: not-allowed;
			opacity: 0.5;
		}

		&__head {
			display: flex;
			gap: var(--e-space-sm);
			align-items: baseline;
			justify-content: space-between;
		}

		&__name {
			font-size: var(--e-text-2xl);
			color: var(--e-fg);
		}

		&__badge {
			padding: var(--e-space-3xs) var(--e-space-xs);
			font-size: var(--e-text-2xs);
			font-weight: var(--e-weight-semibold);
			color: var(--e-fg-dim);
			letter-spacing: var(--e-tracking-wide);
			text-transform: uppercase;
			white-space: nowrap;
			background: var(--e-surface-2);
			border-radius: var(--e-radius-pill);

			&--done {
				color: var(--e-success);
				background: var(--e-success-soft);
			}

			&--started {
				color: var(--e-accent);
				background: var(--e-accent-soft);
			}
		}

		&__hook {
			flex: 1;
			font-size: var(--e-text-md);
			color: var(--e-fg-muted);
		}

		&__meta {
			@include mono;

			display: flex;
			gap: var(--e-space-2xs);
			font-size: var(--e-text-2xs);
			color: var(--e-fg-dim);
		}

		&__progress {
			display: flex;
			gap: var(--e-space-xs);
			align-items: center;
			margin-top: var(--e-space-2xs);
		}

		&__track {
			flex: 1;
			height: 4px;
			overflow: hidden;
			background: var(--e-surface-2);
			border-radius: var(--e-radius-pill);
		}

		&__fill {
			display: block;
			height: 100%;
			background: var(--e-accent);
		}

		&__percent {
			@include mono;

			font-size: var(--e-text-2xs);
			color: var(--e-fg-dim);
		}
	}
</style>
