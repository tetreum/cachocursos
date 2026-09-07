<script lang="ts">
	import { resolve } from '$app/paths';
	import { translatorFor } from '$i18n/locale';
	import Lesson from '$ui/Lesson.svelte';
	import { progress } from '$state/progress.svelte';
	import type { PageData } from './$types';

	interface ChapterPageProps {
		data: PageData;
	}

	let { data }: ChapterPageProps = $props();

	const locale = $derived(data.locale);
	const t = $derived(translatorFor(locale));
	const Content = $derived(data.Content);
	const locked = $derived(
		progress.hydrated && !progress.isChapterUnlocked(data.course.id, data.entry.id)
	);

	function renderLocked() {
		return locked;
	}
</script>

<svelte:head>
	<title>{data.entry.title[locale]} · CachoCursos</title>
	<meta name="description" content={data.entry.hook[locale]} />
</svelte:head>

{#if renderLocked()}
	<div class="e-locked-notice">
		<h1 class="e-locked-notice__title">{t('CHAPTER_LOCKED_TITLE')}</h1>
		<p class="e-locked-notice__body">
			{t('CHAPTER_LOCKED_BODY', { title: data.entry.title[locale] })}
		</p>
		<a
			class="e-locked-notice__link"
			href={resolve('/[lang]/[courseId]', { lang: locale, courseId: data.course.id })}
			>{t('CHAPTER_BACK_TO_COURSE')}</a
		>
	</div>
{:else}
	{#key `${locale}:${data.entry.id}`}
		<Lesson entry={data.entry}>
			<Content />
		</Lesson>
	{/key}
{/if}

<style lang="scss">
	.e-locked-notice {
		@include measure;

		display: flex;
		flex-direction: column;
		gap: var(--e-space-md);
		align-items: flex-start;
		padding: var(--e-space-4xl) var(--e-space-lg);

		&__title {
			font-size: var(--e-text-2xl);
		}

		&__body {
			font-size: var(--e-text-lg);
			color: var(--e-fg-muted);
		}

		&__link {
			@include focus-ring;

			font-weight: var(--e-weight-semibold);
		}
	}
</style>
