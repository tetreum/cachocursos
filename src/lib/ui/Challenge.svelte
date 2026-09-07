<script lang="ts" module>
	import type { ChallengeResult } from '$content/types';

	export interface ChallengeApi {
		solve: (result?: ChallengeResult) => void;
		report: (partial: ChallengeResult) => void;
		fail: (message?: string) => void;
		reset: () => void;
		readonly solved: boolean;
		readonly attempts: number;
		readonly best: ChallengeResult | null;
	}
</script>

<script lang="ts">
	import { createTranslator } from '$i18n/locale';
	import type { Snippet } from 'svelte';
	import type { ChallengeId } from '$content/types';
	import { progress } from '$state/progress.svelte';
	import { getCourseId } from './lesson.svelte';
	import Button from './Button.svelte';

	const t = createTranslator();

	interface ChallengeProps {
		id: ChallengeId;
		title: string;
		objective: string;
		hints?: readonly string[];
		children: Snippet<[ChallengeApi]>;
		success?: Snippet<[ChallengeResult]>;
	}

	let { id, title, objective, hints = [], children, success }: ChallengeProps = $props();

	let attempts = $state(0);
	let live = $state<ChallengeResult | null>(null);
	let errorMessage = $state<string | null>(null);
	let hintsShown = $state(0);
	let nonce = $state(0);

	const courseId = getCourseId();

	const solved = $derived(progress.isSolved(courseId, id));
	const best = $derived(progress.resultOf(courseId, id));

	const api: ChallengeApi = {
		solve(result: ChallengeResult = {}) {
			attempts += 1;
			errorMessage = null;
			live = result;
			progress.solve(courseId, id, result);
		},
		report(partial: ChallengeResult) {
			live = partial;
		},
		fail(message?: string) {
			attempts += 1;
			errorMessage = message ?? t('CHALLENGE_RETRY');
		},
		reset() {
			errorMessage = null;
			live = null;
			nonce += 1;
		},
		get solved() {
			return solved;
		},
		get attempts() {
			return attempts;
		},
		get best() {
			return best;
		}
	};

	function revealHint(): void {
		hintsShown += 1;
	}
</script>

<div class="e-challenge" class:e-challenge--solved={solved} data-challenge={id}>
	<header class="e-challenge__header">
		<span class="e-challenge__badge"
			>{solved ? t('CHALLENGE_BADGE_SOLVED') : t('CHALLENGE_BADGE_PENDING')}</span
		>
		<h3 class="e-challenge__title">{title}</h3>
	</header>

	<p class="e-challenge__objective">{objective}</p>

	{#key nonce}
		<div class="e-challenge__stage">{@render children(api)}</div>
	{/key}

	{#if errorMessage}
		<p class="e-challenge__error" role="status">{errorMessage}</p>
	{/if}

	{#if hintsShown > 0}
		<ul class="e-challenge__hints">
			{#each hints.slice(0, hintsShown) as hint (hint)}
				<li class="e-challenge__hint">{hint}</li>
			{/each}
		</ul>
	{/if}

	{#if solved && success}
		<div class="e-challenge__success" role="status">{@render success(live ?? best ?? {})}</div>
	{/if}

	<footer class="e-challenge__footer">
		{#if hints.length > 0}
			<Button variant="ghost" disabled={hintsShown >= hints.length} onclick={revealHint}>
				{t('CHALLENGE_HINT', { shown: hintsShown, total: hints.length })}
			</Button>
		{/if}
		<Button variant="ghost" onclick={api.reset}>{t('CHALLENGE_RESET')}</Button>
	</footer>
</div>

<style lang="scss">
	.e-challenge {
		@include card;
		@include measure(var(--e-measure-wide));

		display: flex;
		flex-direction: column;
		gap: var(--e-space-md);
		width: 100%;
		padding: var(--e-space-lg);
		transition: border-color var(--e-dur-base) var(--e-ease-out);

		&--solved {
			border-color: var(--e-success);
		}

		&__header {
			display: flex;
			gap: var(--e-space-sm);
			align-items: baseline;
		}

		&__badge {
			padding: var(--e-space-3xs) var(--e-space-xs);
			font-size: var(--e-text-2xs);
			font-weight: var(--e-weight-bold);
			color: var(--e-accent);
			letter-spacing: var(--e-tracking-wide);
			text-transform: uppercase;
			background: var(--e-accent-soft);
			border-radius: var(--e-radius-pill);
		}

		&--solved &__badge {
			color: var(--e-success);
			background: var(--e-success-soft);
		}

		&__title {
			font-size: var(--e-text-xl);
			color: var(--e-fg);
		}

		&__objective {
			font-size: var(--e-text-md);
			color: var(--e-fg-muted);
		}

		&__stage {
			display: flex;
			flex-direction: column;
			gap: var(--e-space-md);
		}

		&__error {
			padding: var(--e-space-xs) var(--e-space-md);
			font-size: var(--e-text-sm);
			color: var(--e-danger);
			background: var(--e-danger-soft);
			border-radius: var(--e-radius-sm);
		}

		&__hints {
			display: flex;
			flex-direction: column;
			gap: var(--e-space-xs);
			padding-left: var(--e-space-lg);
			list-style: disc;
		}

		&__hint {
			font-size: var(--e-text-sm);
			color: var(--e-fg-dim);
		}

		&__success {
			padding: var(--e-space-sm) var(--e-space-md);
			font-size: var(--e-text-md);
			color: var(--e-fg);
			background: var(--e-success-soft);
			border-radius: var(--e-radius-sm);
		}

		&__footer {
			display: flex;
			gap: var(--e-space-xs);
			justify-content: flex-end;
			padding-top: var(--e-space-xs);
			border-top: var(--e-border-width) solid var(--e-border);
		}
	}
</style>
