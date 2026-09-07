<script lang="ts">
	import {
		initBpe,
		applyMerge,
		rankedPairs,
		trainBpe,
		tokenCount,
		compressionRatio,
		mergeQuality,
		type BpeState,
		type Pair,
		type RankedPair
	} from '../../models/bpe';
	import { untrack } from 'svelte';
	import { mulberry32, shuffled } from '$utils/rng';
	import type { ChallengeResult } from '$content/types';
	import TokenStrip from '../../ui/TokenStrip.svelte';
	import { formatSymbol, BOUNDARY_GLYPH } from '../../ui/tokenFormat';
	import ScorePill from '$ui/ScorePill.svelte';
	import Button from '$ui/Button.svelte';
	import { createCourseTranslator } from '../../i18n';

	interface BpeGameProps {
		corpus: string;
		targetMerges: number;
		targetRatio: number;
		onsolve?: (result: ChallengeResult) => void;
		onprogress?: (result: ChallengeResult) => void;
	}

	let { corpus, targetMerges, targetRatio, onsolve, onprogress }: BpeGameProps = $props();

	const t = createCourseTranslator();

	const CANDIDATE_COUNT = 6;
	const PREVIEW_WORDS = 10;
	const SHUFFLE_SEED = 20260907;
	const PERFECT_QUALITY = 0.999;
	const SCORE_SCALE = 1000;

	const initial = untrack(() => initBpe(corpus));
	const greedyBest = untrack(() => compressionRatio(trainBpe(initial, targetMerges)));

	let bpeState = $state.raw<BpeState>(initial);
	let optimalPicks = $state(0);
	let announced = $state(false);

	const mergesUsed = $derived(bpeState.merges.length);
	const mergesLeft = $derived(targetMerges - mergesUsed);
	const ratio = $derived(compressionRatio(bpeState));
	const tokens = $derived(tokenCount(bpeState));
	const reached = $derived(ratio >= targetRatio);
	const exhausted = $derived(mergesLeft <= 0 && !reached);
	const finished = $derived(reached || exhausted);

	const candidates = $derived.by((): RankedPair[] => {
		if (finished) return [];
		const top = rankedPairs(bpeState, CANDIDATE_COUNT);
		return shuffled(top, mulberry32(SHUFFLE_SEED + mergesUsed));
	});

	const previewWords = $derived(bpeState.words.slice(0, PREVIEW_WORDS));

	function choose(pair: Pair): void {
		if (finished) return;
		if (mergeQuality(bpeState, pair) >= PERFECT_QUALITY) optimalPicks += 1;
		bpeState = applyMerge(bpeState, pair);
	}

	function restart(): void {
		bpeState = initial;
		optimalPicks = 0;
		announced = false;
	}

	$effect(() => {
		const result: ChallengeResult = {
			score: Math.round(ratio * SCORE_SCALE),
			detail: {
				ratio: ratio.toFixed(2),
				merges: mergesUsed,
				optimalPicks,
				tokens
			}
		};
		if (reached && !announced) {
			announced = true;
			onsolve?.(result);
			return;
		}
		if (!reached) onprogress?.(result);
	});
</script>

<div class="e-bpe">
	<div class="e-bpe__scores">
		<ScorePill label={t('BPE_SCORE_TOKENS')} value={String(tokens)} />
		<ScorePill
			label={t('BPE_SCORE_COMPRESSION')}
			value="{ratio.toFixed(2)}x"
			tone={reached ? 'success' : 'accent'}
		/>
		<ScorePill
			label={t('BPE_SCORE_MERGES')}
			value="{mergesUsed} / {targetMerges}"
			tone={exhausted ? 'danger' : 'neutral'}
		/>
		<ScorePill label={t('BPE_SCORE_TARGET')} value="{targetRatio.toFixed(2)}x" />
	</div>

	{#if !finished}
		<div class="e-bpe__panel">
			<p class="e-bpe__prompt">
				{t('BPE_PROMPT')}
				<strong>{t('BPE_PROMPT_STRONG')}</strong>
				{t('BPE_PROMPT_TAIL')}
			</p>
			<p class="e-bpe__legend">
				<span class="e-bpe__symbol">{BOUNDARY_GLYPH}</span>
				{t('BPE_LEGEND')}
			</p>
			<div class="e-bpe__candidates">
				{#each candidates as candidate (candidate.pair.join(' '))}
					<button class="e-bpe__candidate" type="button" onclick={() => choose(candidate.pair)}>
						<span class="e-bpe__candidate-pair">
							<span class="e-bpe__symbol">{formatSymbol(candidate.pair[0])}</span>
							<span class="e-bpe__plus">+</span>
							<span class="e-bpe__symbol">{formatSymbol(candidate.pair[1])}</span>
							<span class="e-bpe__arrow">→</span>
							<span class="e-bpe__symbol e-bpe__symbol--result">
								{formatSymbol(candidate.pair[0] + candidate.pair[1])}
							</span>
						</span>
						<span class="e-bpe__candidate-count">
							{t('BPE_CANDIDATE_COUNT', { count: candidate.count })}
						</span>
					</button>
				{/each}
			</div>
		</div>
	{:else}
		<div class="e-bpe__panel e-bpe__panel--result" class:e-bpe__panel--won={reached}>
			{#if reached}
				<p class="e-bpe__result-title">{t('BPE_WON_TITLE', { ratio: ratio.toFixed(2) })}</p>
				<p class="e-bpe__result-body">
					{t('BPE_WON_BODY', {
						merges: mergesUsed,
						optimal: optimalPicks,
						greedy: greedyBest.toFixed(2),
						target: targetMerges
					})}
				</p>
			{:else}
				<p class="e-bpe__result-title">{t('BPE_LOST_TITLE', { ratio: ratio.toFixed(2) })}</p>
				<p class="e-bpe__result-body">
					{t('BPE_LOST_BODY', {
						merges: targetMerges,
						target: targetRatio.toFixed(2),
						greedy: greedyBest.toFixed(2)
					})}
				</p>
			{/if}
			<Button onclick={restart}>{t('COMMON_RESTART')}</Button>
		</div>
	{/if}

	<div class="e-bpe__corpus">
		<p class="e-bpe__section-title">{t('BPE_CORPUS_TITLE')}</p>
		<ul class="e-bpe__words">
			{#each previewWords as word (word.symbols.join(' '))}
				<li class="e-bpe__word">
					<span class="e-bpe__frequency">x{word.frequency}</span>
					<TokenStrip
						tokens={word.symbols}
						hues={word.symbols.map((symbol) => symbol.length - 1)}
					/>
				</li>
			{/each}
		</ul>
	</div>

	{#if bpeState.merges.length > 0}
		<div class="e-bpe__history">
			<p class="e-bpe__section-title">Vocabulario aprendido</p>
			<TokenStrip
				tokens={bpeState.merges.map((merge) => merge.symbol)}
				subs={bpeState.merges.map((merge) => `x${merge.count}`)}
				hues={bpeState.merges.map((merge) => merge.symbol.length - 1)}
			/>
		</div>
	{/if}
</div>

<style lang="scss">
	.e-bpe {
		display: flex;
		flex-direction: column;
		gap: var(--e-space-lg);

		&__scores {
			display: flex;
			flex-wrap: wrap;
			gap: var(--e-space-xs);
		}

		&__panel {
			display: flex;
			flex-direction: column;
			gap: var(--e-space-md);
			padding: var(--e-space-md);
			background: var(--e-bg-subtle);
			border: var(--e-border-width) solid var(--e-border);
			border-radius: var(--e-radius-md);

			&--result {
				align-items: flex-start;
				border-color: var(--e-danger);
			}

			&--won {
				border-color: var(--e-success);
			}
		}

		&__prompt {
			font-size: var(--e-text-sm);
			color: var(--e-fg-muted);
		}

		&__candidates {
			display: grid;
			grid-template-columns: repeat(auto-fill, minmax(11rem, 1fr));
			gap: var(--e-space-xs);
		}

		&__candidate {
			@include focus-ring;

			display: flex;
			flex-direction: column;
			gap: var(--e-space-2xs);
			align-items: flex-start;
			padding: var(--e-space-sm) var(--e-space-md);
			background: var(--e-surface);
			border: var(--e-border-width) solid var(--e-border);
			border-radius: var(--e-radius-sm);
			transition:
				border-color var(--e-dur-fast) var(--e-ease-out),
				background var(--e-dur-fast) var(--e-ease-out);

			&:hover {
				background: var(--e-surface-2);
				border-color: var(--e-accent);
			}
		}

		&__candidate-pair {
			@include mono;

			display: flex;
			gap: var(--e-space-2xs);
			align-items: center;
			font-size: var(--e-text-md);
		}

		&__symbol {
			padding: 0 var(--e-space-2xs);
			color: var(--e-accent);
			background: var(--e-accent-soft);
			border-radius: var(--e-radius-xs);

			&--result {
				color: var(--e-success);
				background: var(--e-success-soft);
			}
		}

		&__plus,
		&__arrow {
			color: var(--e-fg-dim);
		}

		&__legend {
			display: flex;
			flex-wrap: wrap;
			gap: var(--e-space-2xs);
			align-items: center;
			font-size: var(--e-text-xs);
			color: var(--e-fg-dim);
		}

		&__candidate-count {
			font-size: var(--e-text-xs);
			color: var(--e-fg-dim);
		}

		&__result-title {
			font-size: var(--e-text-xl);
			font-weight: var(--e-weight-semibold);
			color: var(--e-fg);
		}

		&__result-body {
			font-size: var(--e-text-sm);
			color: var(--e-fg-muted);
		}

		&__corpus,
		&__history {
			display: flex;
			flex-direction: column;
			gap: var(--e-space-xs);
		}

		&__section-title {
			font-size: var(--e-text-2xs);
			font-weight: var(--e-weight-bold);
			color: var(--e-fg-dim);
			letter-spacing: var(--e-tracking-wide);
			text-transform: uppercase;
		}

		&__words {
			display: flex;
			flex-direction: column;
			gap: var(--e-space-2xs);
			padding: 0;
			margin: 0;
			list-style: none;
		}

		&__word {
			display: flex;
			gap: var(--e-space-xs);
			align-items: center;
		}

		&__frequency {
			@include mono;

			min-width: 3.5ch;
			font-size: var(--e-text-2xs);
			color: var(--e-fg-dim);
			text-align: right;
		}
	}
</style>
