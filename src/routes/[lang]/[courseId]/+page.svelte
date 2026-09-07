<script lang="ts">
	import { resolve } from '$app/paths';
	import { progress } from '$state/progress.svelte';
	import { translatorFor } from '$i18n/locale';
	import type { PageData } from './$types';

	interface CoursePageProps {
		data: PageData;
	}

	let { data }: CoursePageProps = $props();

	const locale = $derived(data.locale);
	const t = $derived(translatorFor(locale));
	const course = $derived(data.course);
	const chapters = $derived(course.chapters);
	const total = $derived(chapters.length);
	const completed = $derived(
		chapters.filter((chapter) => progress.isChapterComplete(course.id, chapter.id)).length
	);
	const percent = $derived(total === 0 ? 0 : Math.round((completed / total) * 100));
</script>

<svelte:head>
	<title>{course.title[locale]} · CachoCursos</title>
	<meta name="description" content={course.summary[locale]} />
</svelte:head>

<div class="e-home">
	<header class="e-home__hero">
		<a class="e-home__back" href={resolve('/[lang]', { lang: locale })}
			>{t('COURSE_BACK_TO_INDEX')}</a
		>
		<h1 class="e-home__title">{course.title[locale]}</h1>
		<p class="e-home__lead">{course.summary[locale]}</p>
		<div class="e-home__progress">
			<div class="e-home__progress-track">
				<div class="e-home__progress-fill" style:width="{percent}%"></div>
			</div>
			<span class="e-home__progress-label">{t('COURSE_PROGRESS', { done: completed, total })}</span>
		</div>
	</header>

	<ol class="e-home__grid">
		{#each chapters as chapter (chapter.id)}
			{@const unlocked = progress.isChapterUnlocked(course.id, chapter.id)}
			{@const complete = progress.isChapterComplete(course.id, chapter.id)}
			<li class="e-home__cell">
				<a
					class="e-card"
					class:e-card--locked={!unlocked}
					class:e-card--complete={complete}
					href={unlocked
						? resolve('/[lang]/[courseId]/chapter/[chapterId]', {
								lang: locale,
								courseId: course.id,
								chapterId: chapter.id
							})
						: undefined}
					aria-disabled={!unlocked}
				>
					<div class="e-card__top">
						<span class="e-card__order">{String(chapter.order).padStart(2, '0')}</span>
						{#if complete}
							<span class="e-card__badge e-card__badge--done">{t('COURSE_BADGE_DONE')}</span>
						{:else if !unlocked}
							<span class="e-card__badge">{t('COURSE_BADGE_LOCKED')}</span>
						{/if}
					</div>
					<h2 class="e-card__title">{chapter.title[locale]}</h2>
					<p class="e-card__hook">{chapter.hook[locale]}</p>
					<span class="e-card__minutes">{t('COURSE_MINUTES', { minutes: chapter.minutes })}</span>
				</a>
			</li>
		{/each}
	</ol>
</div>

<style lang="scss">
	.e-home {
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

		&__back {
			@include focus-ring;

			align-self: flex-start;
			font-size: var(--e-text-sm);
			color: var(--e-fg-muted);
			text-decoration: none;

			&:hover {
				color: var(--e-accent);
			}
		}

		&__title {
			font-size: var(--e-text-4xl);
		}

		&__lead {
			font-size: var(--e-text-lg);
			color: var(--e-fg-muted);
		}

		&__progress {
			display: flex;
			gap: var(--e-space-md);
			align-items: center;
			margin-top: var(--e-space-xs);
		}

		&__progress-track {
			flex: 1;
			height: 6px;
			overflow: hidden;
			background: var(--e-surface-2);
			border-radius: var(--e-radius-pill);
		}

		&__progress-fill {
			height: 100%;
			background: var(--e-accent);
			transition: width var(--e-dur-base) var(--e-ease-out);
		}

		&__progress-label {
			@include mono;

			font-size: var(--e-text-xs);
			color: var(--e-fg-dim);
		}

		&__grid {
			@include measure(var(--e-measure-wide));

			display: grid;
			grid-template-columns: repeat(auto-fill, minmax(15rem, 1fr));
			gap: var(--e-space-md);
			width: 100%;
			padding: 0;
			margin-block: 0;
			list-style: none;
		}

		&__cell {
			display: flex;
		}
	}

	.e-card {
		@include card;
		@include focus-ring;

		display: flex;
		flex: 1;
		flex-direction: column;
		gap: var(--e-space-2xs);
		padding: var(--e-space-lg);
		color: inherit;
		text-decoration: none;
		transition:
			border-color var(--e-dur-fast) var(--e-ease-out),
			transform var(--e-dur-fast) var(--e-ease-out);

		&:hover:not(&--locked) {
			border-color: var(--e-accent);
			transform: translateY(-2px);
		}

		&--locked {
			cursor: not-allowed;
			opacity: 0.45;
		}

		&--complete {
			border-color: var(--e-success);
		}

		&__top {
			display: flex;
			align-items: center;
			justify-content: space-between;
		}

		&__order {
			@include mono;

			font-size: var(--e-text-sm);
			font-weight: var(--e-weight-bold);
			color: var(--e-accent);
		}

		&--locked &__order {
			color: var(--e-locked);
		}

		&__badge {
			padding: var(--e-space-3xs) var(--e-space-xs);
			font-size: var(--e-text-2xs);
			font-weight: var(--e-weight-semibold);
			color: var(--e-fg-dim);
			letter-spacing: var(--e-tracking-wide);
			text-transform: uppercase;
			background: var(--e-surface-2);
			border-radius: var(--e-radius-pill);

			&--done {
				color: var(--e-success);
				background: var(--e-success-soft);
			}
		}

		&__title {
			font-size: var(--e-text-lg);
			font-weight: var(--e-weight-semibold);
			line-height: var(--e-leading-snug);
			color: var(--e-fg);
		}

		&__hook {
			flex: 1;
			font-size: var(--e-text-sm);
			color: var(--e-fg-muted);
		}

		&__minutes {
			@include mono;

			font-size: var(--e-text-2xs);
			color: var(--e-fg-dim);
		}
	}
</style>
