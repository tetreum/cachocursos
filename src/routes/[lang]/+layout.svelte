<script lang="ts">
	import type { Snippet } from 'svelte';
	import { untrack } from 'svelte';
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { progress } from '$state/progress.svelte';
	import {
		DEFAULT_LOCALE,
		LOCALES,
		LOCALE_NAMES,
		setLocale,
		translatorFor,
		type Locale
	} from '$i18n/locale';
	import type { LayoutData } from './$types';

	interface LayoutProps {
		data: LayoutData;
		children: Snippet;
	}

	let { data, children }: LayoutProps = $props();

	const locale = $derived(data.locale);
	const t = $derived(translatorFor(locale));

	untrack(() => setLocale(() => data.locale));

	/**
	 * Mismo sitio, otro idioma. Devuelve los argumentos de `resolve` en vez de la
	 * ruta ya montada para que la llamada quede a la vista en el propio enlace.
	 */
	type RouteArgs =
		| ['/[lang]', { lang: Locale }]
		| ['/[lang]/[courseId]', { lang: Locale; courseId: string }]
		| [
				'/[lang]/[courseId]/chapter/[chapterId]',
				{ lang: Locale; courseId: string; chapterId: string }
		  ];

	function sameRouteIn(target: Locale): RouteArgs {
		const { courseId, chapterId } = page.params;
		if (courseId !== undefined && chapterId !== undefined) {
			return ['/[lang]/[courseId]/chapter/[chapterId]', { lang: target, courseId, chapterId }];
		}
		if (courseId !== undefined) return ['/[lang]/[courseId]', { lang: target, courseId }];
		return ['/[lang]', { lang: target }];
	}

	$effect(() => {
		progress.hydrate();
	});
</script>

<svelte:head>
	{#each LOCALES as option (option)}
		<link rel="alternate" hreflang={option} href={resolve(...sameRouteIn(option))} />
	{/each}
	<link rel="alternate" hreflang="x-default" href={resolve(...sameRouteIn(DEFAULT_LOCALE))} />
</svelte:head>

<div class="e-shell">
	<nav class="e-shell__nav">
		<a class="e-shell__brand" href={resolve('/[lang]', { lang: locale })}>
			<span class="e-shell__brand-mark">{t('BRAND_FIRST')}</span><span>{t('BRAND_SECOND')}</span>
		</a>
		<span class="e-shell__tagline">{t('BRAND_TAGLINE')}</span>

		<div class="e-shell__locales" role="group" aria-label={t('COMMON_LANGUAGE')}>
			{#each LOCALES as option (option)}
				<a
					class="e-shell__locale"
					class:e-shell__locale--on={option === locale}
					href={resolve(...sameRouteIn(option))}
					hreflang={option}
					aria-current={option === locale ? 'true' : undefined}
				>
					{option.toUpperCase()}
					<span class="e-shell__locale-full">{LOCALE_NAMES[option]}</span>
				</a>
			{/each}
		</div>
	</nav>

	<main class="e-shell__main">
		{@render children()}
	</main>
</div>

<style lang="scss">
	.e-shell {
		display: flex;
		flex-direction: column;
		min-height: 100dvh;

		&__nav {
			position: sticky;
			top: 0;
			z-index: var(--e-z-sticky);
			display: flex;
			flex-wrap: wrap;
			gap: var(--e-space-md);
			align-items: baseline;
			padding: var(--e-space-md) var(--e-space-lg);
			background: color-mix(in oklab, var(--e-bg) 88%, transparent);
			backdrop-filter: blur(12px);
			border-bottom: var(--e-border-width) solid var(--e-border);
		}

		&__brand {
			@include focus-ring;

			font-size: var(--e-text-md);
			font-weight: var(--e-weight-bold);
			color: var(--e-fg);
			text-decoration: none;
			letter-spacing: var(--e-tracking-tight);
		}

		&__brand-mark {
			color: var(--e-accent);
		}

		&__tagline {
			flex: 1;
			font-size: var(--e-text-xs);
			color: var(--e-fg-dim);
		}

		&__locales {
			display: flex;
			gap: var(--e-space-3xs);
		}

		&__locale {
			@include mono;
			@include focus-ring;

			padding: var(--e-space-3xs) var(--e-space-xs);
			font-size: var(--e-text-2xs);
			font-weight: var(--e-weight-bold);
			color: var(--e-fg-dim);
			text-decoration: none;
			letter-spacing: var(--e-tracking-wide);
			background: var(--e-surface-2);
			border-radius: var(--e-radius-pill);

			&:hover {
				color: var(--e-fg);
				background: var(--e-surface-3);
			}

			&--on {
				color: var(--e-accent-fg);
				background: var(--e-accent);
			}
		}

		&__locale-full {
			@include visually-hidden;
		}

		&__main {
			flex: 1;
		}
	}
</style>
