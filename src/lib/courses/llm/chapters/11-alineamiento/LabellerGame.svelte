<script lang="ts">
	import { untrack } from 'svelte';
	import {
		fitRewardModel,
		dominantTraits,
		pairwiseAccuracy,
		bestResponseUnder,
		type Comparison,
		type Response
	} from '../../models/reward';
	import { mulberry32 } from '$utils/rng';
	import type { ChallengeResult } from '$content/types';
	import type { ResponsePair } from '../../data/types';
	import Button from '$ui/Button.svelte';
	import ScorePill from '$ui/ScorePill.svelte';
	import { createCourseTranslator } from '../../i18n';

	interface LabellerGameProps {
		pairs: readonly ResponsePair[];
		traitLabels: Record<string, string>;
		onsolve?: (result: ChallengeResult) => void;
	}

	let { pairs, traitLabels, onsolve }: LabellerGameProps = $props();

	const t = createCourseTranslator();

	const PERCENT = 100;
	const SIDE_SEED = 818181;

	const allResponses = untrack((): Response[] => pairs.flatMap((pair) => [pair.left, pair.right]));

	let pairIndex = $state(0);
	let comparisons = $state<Comparison[]>([]);
	let announced = $state(false);

	const pair = $derived(pairs[Math.min(pairIndex, pairs.length - 1)]);
	const swapped = $derived(mulberry32(SIDE_SEED + pairIndex)() < 0.5);
	const first = $derived(swapped ? pair.right : pair.left);
	const second = $derived(swapped ? pair.left : pair.right);
	const finished = $derived(pairIndex >= pairs.length);

	const model = $derived(finished ? fitRewardModel(allResponses, comparisons, { seed: 3 }) : null);
	const traits = $derived(model === null ? [] : dominantTraits(model));
	const accuracy = $derived(
		model === null ? 0 : pairwiseAccuracy(model, allResponses, comparisons)
	);
	const overOptimized = $derived(model === null ? null : bestResponseUnder(model, allResponses));

	const topTrait = $derived(traits[0] ?? null);
	const topTraitLabel = $derived(topTrait === null ? '' : (traitLabels[topTrait.trait] ?? ''));
	const rewardsUsefulness = $derived(
		model === null ? false : (traits.find((entry) => entry.trait === 'usefulness')?.weight ?? 0) > 0
	);

	function choose(chosen: Response, rejected: Response): void {
		if (finished) return;
		comparisons = [...comparisons, { chosen: chosen.id, rejected: rejected.id }];
		pairIndex += 1;
	}

	function restart(): void {
		pairIndex = 0;
		comparisons = [];
		announced = false;
	}

	$effect(() => {
		if (!finished || announced || model === null) return;
		announced = true;
		onsolve?.({
			score: Math.round(accuracy * PERCENT),
			detail: {
				comparisons: comparisons.length,
				dominantTrait: topTraitLabel,
				accuracy: `${Math.round(accuracy * PERCENT)}%`
			}
		});
	});
</script>

<div class="e-labeller">
	{#if !finished}
		<div class="e-labeller__scores">
			<ScorePill label={t('LABELLER_COMPARISON')} value="{pairIndex + 1} / {pairs.length}" />
		</div>

		<p class="e-labeller__question">{pair.question}</p>
		<p class="e-labeller__instruction">{t('LABELLER_INSTRUCTION')}</p>

		<div class="e-labeller__options">
			<button class="e-labeller__card" type="button" onclick={() => choose(first, second)}>
				<span class="e-labeller__badge">A</span>
				<span class="e-labeller__text">{first.text}</span>
			</button>
			<button class="e-labeller__card" type="button" onclick={() => choose(second, first)}>
				<span class="e-labeller__badge">B</span>
				<span class="e-labeller__text">{second.text}</span>
			</button>
		</div>
	{:else if model !== null}
		<div class="e-labeller__report">
			<p class="e-labeller__title">{t('LABELLER_REPORT_TITLE')}</p>
			<p class="e-labeller__body">
				{t('LABELLER_REPORT_BODY', {
					count: comparisons.length,
					accuracy: Math.round(accuracy * PERCENT)
				})}
			</p>

			<ul class="e-labeller__traits">
				{#each traits as entry (entry.trait)}
					<li class="e-labeller__trait">
						<span class="e-labeller__trait-name">{traitLabels[entry.trait] ?? entry.trait}</span>
						<span class="e-labeller__trait-track">
							<span
								class="e-labeller__trait-fill"
								class:e-labeller__trait-fill--negative={entry.weight < 0}
								style:width="{Math.min(100, Math.abs(entry.weight) * 40)}%"
							></span>
						</span>
						<span class="e-labeller__trait-value">
							{entry.weight >= 0 ? '+' : ''}{entry.weight.toFixed(2)}
						</span>
					</li>
				{/each}
			</ul>

			<div class="e-labeller__hack" class:e-labeller__hack--clean={rewardsUsefulness}>
				<p class="e-labeller__hack-title">
					{rewardsUsefulness ? t('LABELLER_HACK_CLEAN') : t('LABELLER_HACK_TITLE')}
				</p>
				<p class="e-labeller__body">
					{t('LABELLER_HACK_BODY_HEAD')}
					<em>{t('LABELLER_HACK_BODY_EM')}</em>
					{t('LABELLER_HACK_BODY_TAIL')}
				</p>
				{#if overOptimized}
					<blockquote class="e-labeller__quote">{overOptimized.text}</blockquote>
				{/if}
				<p class="e-labeller__body">
					{#if rewardsUsefulness}
						{t('LABELLER_CLEAN_VERDICT', { trait: topTraitLabel })}
					{:else}
						{t('LABELLER_HACKED_VERDICT', { trait: topTraitLabel })}
					{/if}
				</p>
			</div>

			<Button onclick={restart}>{t('LABELLER_RESTART')}</Button>
		</div>
	{/if}
</div>

<style lang="scss">
	.e-labeller {
		display: flex;
		flex-direction: column;
		gap: var(--e-space-md);

		&__scores {
			display: flex;
			gap: var(--e-space-xs);
		}

		&__question {
			font-size: var(--e-text-xl);
			font-weight: var(--e-weight-semibold);
			color: var(--e-fg);
		}

		&__instruction {
			font-size: var(--e-text-sm);
			color: var(--e-fg-muted);
		}

		&__options {
			display: grid;
			grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr));
			gap: var(--e-space-md);
		}

		&__card {
			@include focus-ring;

			display: flex;
			flex-direction: column;
			gap: var(--e-space-xs);
			align-items: flex-start;
			padding: var(--e-space-md);
			text-align: left;
			background: var(--e-surface);
			border: var(--e-border-width) solid var(--e-border);
			border-radius: var(--e-radius-md);
			transition: border-color var(--e-dur-fast) var(--e-ease-out);

			&:hover {
				border-color: var(--e-accent);
			}
		}

		&__badge {
			@include mono;

			padding: var(--e-space-3xs) var(--e-space-xs);
			font-size: var(--e-text-2xs);
			font-weight: var(--e-weight-bold);
			color: var(--e-accent);
			background: var(--e-accent-soft);
			border-radius: var(--e-radius-pill);
		}

		&__text {
			font-size: var(--e-text-sm);
			line-height: var(--e-leading-body);
			color: var(--e-fg-muted);
		}

		&__report {
			display: flex;
			flex-direction: column;
			gap: var(--e-space-md);
			align-items: flex-start;
			padding: var(--e-space-md);
			background: var(--e-bg-subtle);
			border: var(--e-border-width) solid var(--e-border);
			border-radius: var(--e-radius-md);
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

		&__traits {
			display: flex;
			flex-direction: column;
			gap: var(--e-space-2xs);
			width: 100%;
			padding: 0;
			margin: 0;
			list-style: none;
		}

		&__trait {
			display: grid;
			grid-template-columns: 10rem 1fr 3.5rem;
			gap: var(--e-space-xs);
			align-items: center;
		}

		&__trait-name {
			font-size: var(--e-text-sm);
			color: var(--e-fg);
		}

		&__trait-track {
			height: 12px;
			overflow: hidden;
			background: var(--e-surface-2);
			border-radius: var(--e-radius-xs);
		}

		&__trait-fill {
			display: block;
			height: 100%;
			background: var(--e-success);

			&--negative {
				background: var(--e-danger);
			}
		}

		&__trait-value {
			@include mono;

			font-size: var(--e-text-xs);
			color: var(--e-fg-dim);
			text-align: right;
		}

		&__hack {
			display: flex;
			flex-direction: column;
			gap: var(--e-space-xs);
			width: 100%;
			padding: var(--e-space-md);
			background: var(--e-danger-soft);
			border: var(--e-border-width) solid var(--e-danger);
			border-radius: var(--e-radius-md);

			&--clean {
				background: var(--e-warn-soft);
				border-color: var(--e-warn);
			}
		}

		&__hack-title {
			font-size: var(--e-text-md);
			font-weight: var(--e-weight-semibold);
			color: var(--e-fg);
		}

		&__quote {
			padding-left: var(--e-space-md);
			margin: 0;
			font-size: var(--e-text-sm);
			font-style: italic;
			color: var(--e-fg);
			border-left: 3px solid var(--e-border-strong);
		}
	}
</style>
