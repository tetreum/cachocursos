<script lang="ts">
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { LOCALES, LOCALE_NAMES, preferredLocale } from '$i18n/locale';

	$effect(() => {
		if (!browser) return;
		const target = preferredLocale(navigator.languages ?? [navigator.language]);
		goto(resolve('/[lang]', { lang: target }), { replaceState: true });
	});
</script>

<svelte:head>
	<title>CachoCursos</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<div class="e-pick">
	<p class="e-pick__label">CachoCursos</p>
	<ul class="e-pick__list">
		{#each LOCALES as locale (locale)}
			<li>
				<a class="e-pick__link" href={resolve('/[lang]', { lang: locale })}>
					{LOCALE_NAMES[locale]}
				</a>
			</li>
		{/each}
	</ul>
</div>

<style lang="scss">
	.e-pick {
		display: flex;
		flex-direction: column;
		gap: var(--e-space-md);
		align-items: center;
		justify-content: center;
		min-height: 100dvh;
		padding: var(--e-space-lg);

		&__label {
			font-size: var(--e-text-sm);
			font-weight: var(--e-weight-bold);
			color: var(--e-fg-dim);
			letter-spacing: var(--e-tracking-wide);
			text-transform: uppercase;
		}

		&__list {
			display: flex;
			gap: var(--e-space-md);
			padding: 0;
			margin: 0;
			list-style: none;
		}

		&__link {
			@include card;
			@include focus-ring;

			display: block;
			padding: var(--e-space-md) var(--e-space-xl);
			font-size: var(--e-text-lg);
			color: var(--e-fg);
			text-decoration: none;

			&:hover {
				border-color: var(--e-accent);
			}
		}
	}
</style>
