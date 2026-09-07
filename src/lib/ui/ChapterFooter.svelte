<script lang="ts">
	import { resolve } from '$app/paths';
	import type { ChapterEntry } from '$content/types';
	import { createTranslator, getLocale } from '$i18n/locale';
	import { nextChapter } from '$content/courses';

	const t = createTranslator();

	interface ChapterFooterProps {
		entry: ChapterEntry;
		finished: boolean;
	}

	let { entry, finished }: ChapterFooterProps = $props();

	const locale = getLocale();
	const upcoming = $derived(nextChapter(entry.courseId, entry.id));
</script>

{#if finished}
	<footer class="e-chapter-footer">
		{#if upcoming}
			<p class="e-chapter-footer__eyebrow">{t('CHAPTER_NEXT')}</p>
			<a
				class="e-chapter-footer__link"
				href={resolve('/[lang]/[courseId]/chapter/[chapterId]', {
					lang: locale,
					courseId: entry.courseId,
					chapterId: upcoming.id
				})}
			>
				<span class="e-chapter-footer__title">{upcoming.title[locale]}</span>
				<span class="e-chapter-footer__hook">{upcoming.hook[locale]}</span>
			</a>
		{:else}
			<p class="e-chapter-footer__eyebrow">{t('CHAPTER_COURSE_END')}</p>
			<a
				class="e-chapter-footer__link"
				href={resolve('/[lang]/[courseId]', { lang: locale, courseId: entry.courseId })}
			>
				<span class="e-chapter-footer__title">{t('CHAPTER_COURSE_END_TITLE')}</span>
				<span class="e-chapter-footer__hook">{t('CHAPTER_BACK_TO_COURSE')}</span>
			</a>
		{/if}
	</footer>
{/if}

<style lang="scss">
	.e-chapter-footer {
		@include measure;

		width: 100%;
		padding-top: var(--e-space-xl);
		border-top: var(--e-border-width) solid var(--e-border);

		&__eyebrow {
			margin-bottom: var(--e-space-sm);
			font-size: var(--e-text-xs);
			font-weight: var(--e-weight-bold);
			color: var(--e-fg-dim);
			letter-spacing: var(--e-tracking-wide);
			text-transform: uppercase;
		}

		&__link {
			@include card;
			@include focus-ring;

			display: flex;
			flex-direction: column;
			gap: var(--e-space-2xs);
			padding: var(--e-space-lg);
			color: inherit;
			text-decoration: none;
			transition: border-color var(--e-dur-fast) var(--e-ease-out);

			&:hover {
				border-color: var(--e-accent);
			}
		}

		&__title {
			font-size: var(--e-text-xl);
			font-weight: var(--e-weight-semibold);
			color: var(--e-fg);
		}

		&__hook {
			font-size: var(--e-text-sm);
			color: var(--e-fg-muted);
		}
	}
</style>
