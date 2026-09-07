<script lang="ts">
	import { untrack } from 'svelte';
	import {
		tokenizeWords,
		trainNgram,
		nextDistribution,
		observedCount,
		type NgramModel
	} from '../../models/ngram';
	import { mulberry32, shuffled } from '$utils/rng';
	import type { ChallengeResult } from '$content/types';
	import ProbabilityBars, { type ProbabilityItem } from '$ui/ProbabilityBars.svelte';
	import ScorePill from '$ui/ScorePill.svelte';
	import { createCourseTranslator } from '../../i18n';
	import Button from '$ui/Button.svelte';

	interface BigramDuelProps {
		corpus: string;
		seenContexts: readonly string[];
		unseenContexts: readonly string[];
		onsolve?: (result: ChallengeResult) => void;
	}

	let { corpus, seenContexts, unseenContexts, onsolve }: BigramDuelProps = $props();

	const t = createCourseTranslator();

	const OPTION_COUNT = 4;
	const SHUFFLE_SEED = 424242;
	const PERCENT = 100;

	const model: NgramModel = untrack(() => trainNgram(tokenizeWords(corpus), 2, 0.05));
	const contexts = untrack(() => [...seenContexts, ...unseenContexts]);

	let roundIndex = $state(0);
	let choice = $state<string | null>(null);
	let humanHits = $state(0);
	let modelHits = $state(0);
	let announced = $state(false);

	const finished = $derived(roundIndex >= contexts.length);
	const context = $derived(contexts[Math.min(roundIndex, contexts.length - 1)]);
	const isUnseen = $derived(roundIndex >= seenContexts.length);

	const ranked = $derived(nextDistribution(model, [context], 8));
	const support = $derived(observedCount(model, [context]));
	const modelPick = $derived(ranked[0]?.token ?? '');

	const options = $derived.by((): string[] => {
		const top = ranked.slice(0, OPTION_COUNT).map((entry) => entry.token);
		return shuffled(top, mulberry32(SHUFFLE_SEED + roundIndex));
	});

	const bars = $derived.by((): ProbabilityItem[] =>
		ranked.slice(0, 6).map((entry) => ({
			label: entry.token,
			probability: entry.probability,
			tone: entry.token === choice ? ('you' as const) : ('model' as const),
			note: entry.count === 0 ? 'nunca visto tras este contexto' : `visto ${entry.count} veces`
		}))
	);

	const answered = $derived(choice !== null);

	function pick(option: string): void {
		if (answered || finished) return;
		choice = option;
		if (option === modelPick) humanHits += 1;
		if (support > 0) modelHits += 1;
	}

	function advance(): void {
		choice = null;
		roundIndex += 1;
	}

	function restart(): void {
		roundIndex = 0;
		choice = null;
		humanHits = 0;
		modelHits = 0;
		announced = false;
	}

	$effect(() => {
		if (!finished || announced) return;
		announced = true;
		onsolve?.({
			score: Math.round((humanHits / contexts.length) * PERCENT),
			detail: {
				matches: humanHits,
				rounds: contexts.length,
				contextosConDatos: modelHits
			}
		});
	});
</script>

<div class="e-duel">
	<div class="e-duel__scores">
		<ScorePill label={t('DUEL_SCORE_VOCABULARY')} value={String(model.vocabulary.length)} />
		<ScorePill
			label={t('DUEL_SCORE_ROUND')}
			value="{Math.min(roundIndex + 1, contexts.length)} / {contexts.length}"
		/>
		<ScorePill label={t('DUEL_SCORE_MATCHES')} value={String(humanHits)} tone="accent" />
	</div>

	{#if finished}
		<div class="e-duel__panel">
			<p class="e-duel__title">{t('DUEL_END_TITLE')}</p>
			<p class="e-duel__body">
				{t('DUEL_END_BODY', {
					hits: humanHits,
					total: contexts.length,
					unseen: contexts.length - modelHits
				})}
				<strong>{t('DUEL_END_BODY_STRONG')}</strong>
				{t('DUEL_END_BODY_TAIL')}
			</p>
			<Button onclick={restart}>{t('DUEL_RESTART')}</Button>
		</div>
	{:else}
		<div class="e-duel__panel">
			<p class="e-duel__prompt">
				{t('DUEL_CONTEXT')}
				<span class="e-duel__context">{context}</span>
				<span class="e-duel__support" class:e-duel__support--empty={support === 0}>
					{support === 0 ? t('DUEL_UNSEEN') : t('DUEL_SEEN', { count: support })}
				</span>
			</p>

			<p class="e-duel__question">{t('DUEL_QUESTION')}</p>

			<div class="e-duel__options">
				{#each options as option (option)}
					<button
						class="e-duel__option"
						class:e-duel__option--picked={answered && option === choice}
						class:e-duel__option--model={answered && option === modelPick}
						type="button"
						disabled={answered}
						onclick={() => pick(option)}
					>
						{option}
					</button>
				{/each}
			</div>

			{#if answered}
				<div class="e-duel__reveal">
					<p class="e-duel__reveal-title">
						{#if choice === modelPick}
							{t('DUEL_AGREE', { word: modelPick })}
						{:else}
							{t('DUEL_DISAGREE', { model: modelPick, you: choice ?? '' })}
						{/if}
					</p>
					<ProbabilityBars items={bars} limit={6} />
					{#if isUnseen}
						<p class="e-duel__warning">{t('DUEL_WARNING')}</p>
					{/if}
					<Button variant="primary" onclick={advance}>
						{roundIndex === contexts.length - 1 ? t('GUESS_SEE_RESULT') : t('DUEL_NEXT_ROUND')}
					</Button>
				</div>
			{/if}
		</div>
	{/if}
</div>

<style lang="scss">
	.e-duel {
		display: flex;
		flex-direction: column;
		gap: var(--e-space-md);

		&__scores {
			display: flex;
			flex-wrap: wrap;
			gap: var(--e-space-xs);
		}

		&__panel {
			display: flex;
			flex-direction: column;
			gap: var(--e-space-md);
			align-items: flex-start;
			padding: var(--e-space-md);
			background: var(--e-bg-subtle);
			border: var(--e-border-width) solid var(--e-border);
			border-radius: var(--e-radius-md);
		}

		&__prompt {
			display: flex;
			flex-wrap: wrap;
			gap: var(--e-space-xs);
			align-items: baseline;
			font-size: var(--e-text-sm);
			color: var(--e-fg-muted);
		}

		&__context {
			@include mono;

			padding: var(--e-space-3xs) var(--e-space-xs);
			font-size: var(--e-text-lg);
			color: var(--e-accent);
			background: var(--e-accent-soft);
			border-radius: var(--e-radius-xs);
		}

		&__support {
			font-size: var(--e-text-2xs);
			color: var(--e-fg-dim);

			&--empty {
				color: var(--e-warn);
			}
		}

		&__question {
			font-size: var(--e-text-lg);
			color: var(--e-fg);
		}

		&__options {
			display: flex;
			flex-wrap: wrap;
			gap: var(--e-space-xs);
		}

		&__option {
			@include mono;
			@include focus-ring;

			padding: var(--e-space-xs) var(--e-space-md);
			font-size: var(--e-text-md);
			color: var(--e-fg);
			background: var(--e-surface);
			border: var(--e-border-width) solid var(--e-border);
			border-radius: var(--e-radius-sm);

			&:hover:not(:disabled) {
				border-color: var(--e-accent);
			}

			&--picked {
				border-color: var(--e-you);
				box-shadow: inset 0 -2px 0 var(--e-you);
			}

			&--model {
				color: var(--e-model);
				background: var(--e-accent-2-soft);
			}
		}

		&__reveal {
			display: flex;
			flex-direction: column;
			gap: var(--e-space-sm);
			align-items: flex-start;
			width: 100%;
			padding-top: var(--e-space-sm);
			border-top: var(--e-border-width) solid var(--e-border);
		}

		&__reveal-title {
			font-size: var(--e-text-md);
			color: var(--e-fg);
		}

		&__warning {
			padding: var(--e-space-xs) var(--e-space-sm);
			font-size: var(--e-text-sm);
			color: var(--e-warn);
			background: var(--e-warn-soft);
			border-radius: var(--e-radius-sm);
		}

		&__title {
			font-size: var(--e-text-xl);
			font-weight: var(--e-weight-semibold);
			color: var(--e-fg);
		}

		&__body {
			font-size: var(--e-text-sm);
			color: var(--e-fg-muted);
		}
	}
</style>
