<script lang="ts">
	import { untrack } from 'svelte';
	import {
		outcomesFor,
		cheapestSufficient,
		strategyCost,
		REQUIRED_ACCURACY,
		PER_STEP_RELIABILITY,
		type OnePassTask,
		type Strategy,
		type StrategyOutcome
	} from '../../models/onepass';
	import type { StrategyLabel } from '../../data/types';
	import type { ChallengeResult } from '$content/types';
	import Button from '$ui/Button.svelte';
	import ScorePill from '$ui/ScorePill.svelte';
	import { createCourseTranslator } from '../../i18n';

	interface StrategyWorkshopProps {
		tasks: readonly OnePassTask[];
		strategyLabels: Record<Strategy, StrategyLabel>;
		onsolve?: (result: ChallengeResult) => void;
	}

	let { tasks, strategyLabels, onsolve }: StrategyWorkshopProps = $props();

	const t = createCourseTranslator();

	const REASON_KEYS = {
		tool: 'REASON_TOOL',
		'chain-wasteful': 'REASON_CHAIN_WASTEFUL',
		'chain-steps': 'REASON_CHAIN_STEPS',
		'retokenize-fits': 'REASON_RETOKENIZE_FITS',
		'retokenize-steps': 'REASON_RETOKENIZE_STEPS',
		'direct-hidden': 'REASON_DIRECT_HIDDEN',
		'direct-fits': 'REASON_DIRECT_FITS',
		'direct-steps': 'REASON_DIRECT_STEPS'
	} as const;

	function reasonText(outcome: StrategyOutcome): string {
		return t(REASON_KEYS[outcome.reason], {
			steps: task.serialSteps,
			reliability: (PER_STEP_RELIABILITY * PERCENT).toFixed(0)
		});
	}

	const PERCENT = 100;

	let taskIndex = $state(0);
	let choice = $state<Strategy | null>(null);
	let correct = $state(0);
	let announced = $state(false);

	const task = $derived(tasks[Math.min(taskIndex, tasks.length - 1)]);
	const finished = $derived(taskIndex >= tasks.length);
	const outcomes = $derived(outcomesFor(task));
	const answer = $derived(cheapestSufficient(task));
	const answered = $derived(choice !== null);
	const gotIt = $derived(choice === answer);
	const required = untrack(() => tasks.length - 1);

	function pick(strategy: Strategy): void {
		if (answered || finished) return;
		choice = strategy;
		if (strategy === answer) correct += 1;
	}

	function advance(): void {
		choice = null;
		taskIndex += 1;
	}

	function restart(): void {
		taskIndex = 0;
		choice = null;
		correct = 0;
		announced = false;
	}

	$effect(() => {
		if (!finished || announced) return;
		announced = true;
		if (correct >= required) {
			onsolve?.({
				score: correct,
				detail: { hits: correct, tasks: tasks.length }
			});
		}
	});
</script>

<div class="e-workshop">
	{#if finished}
		<div class="e-workshop__panel">
			<p class="e-workshop__title">
				{correct >= required ? t('STRATEGY_WON') : t('STRATEGY_FAILED')}
			</p>
			<p class="e-workshop__body">
				{t('STRATEGY_RESULT_BODY', { correct, total: tasks.length })}
				{#if correct < required}
					{t('STRATEGY_RESULT_NEEDED', { required })}
				{/if}
			</p>
			<Button onclick={restart}>{t('MAP_RETRY')}</Button>
		</div>
	{:else}
		<div class="e-workshop__scores">
			<ScorePill label={t('STRATEGY_TASK')} value="{taskIndex + 1} / {tasks.length}" />
			<ScorePill
				label={t('STRATEGY_HITS')}
				value="{correct} / {required}"
				tone={correct >= required ? 'success' : 'accent'}
			/>
		</div>

		<div class="e-workshop__panel">
			<p class="e-workshop__prompt">{task.prompt}</p>
			<p class="e-workshop__question">
				{t('STRATEGY_QUESTION_HEAD')}
				<strong>{t('STRATEGY_QUESTION_STRONG')}</strong>
				{t('STRATEGY_QUESTION_TAIL')}
			</p>

			<div class="e-workshop__options">
				{#each outcomes as outcome (outcome.strategy)}
					{@const label = strategyLabels[outcome.strategy]}
					<button
						class="e-workshop__option"
						class:e-workshop__option--right={answered && outcome.strategy === answer}
						class:e-workshop__option--wrong={answered && outcome.strategy === choice && !gotIt}
						type="button"
						disabled={answered}
						onclick={() => pick(outcome.strategy)}
					>
						<span class="e-workshop__option-head">
							<span class="e-workshop__option-name">{label.name}</span>
							<span class="e-workshop__cost">
								{'·'.repeat(strategyCost(outcome.strategy) + 1)}
							</span>
						</span>
						<span class="e-workshop__option-blurb">{label.blurb}</span>
						{#if answered}
							<span class="e-workshop__verdict" class:e-workshop__verdict--ok={outcome.feasible}>
								{outcome.feasible ? t('STRATEGY_WORKS') : t('STRATEGY_NOT_ENOUGH')} ·
								{(outcome.accuracy * PERCENT).toFixed(0)}%
							</span>
							<span class="e-workshop__reason">{reasonText(outcome)}</span>
						{/if}
					</button>
				{/each}
			</div>

			{#if answered}
				<div class="e-workshop__feedback" class:e-workshop__feedback--right={gotIt}>
					<p class="e-workshop__feedback-title">
						{gotIt
							? t('GUESS_RIGHT')
							: t('STRATEGY_ANSWER_WAS', { name: strategyLabels[answer].name })}
					</p>
					<p class="e-workshop__body">
						{task.note}
						{t('STRATEGY_NOTE_TAIL', { threshold: (REQUIRED_ACCURACY * PERCENT).toFixed(0) })}
					</p>
					<Button variant="primary" onclick={advance}>
						{taskIndex === tasks.length - 1 ? t('GUESS_SEE_RESULT') : t('STRATEGY_NEXT_TASK')}
					</Button>
				</div>
			{/if}
		</div>
	{/if}
</div>

<style lang="scss">
	.e-workshop {
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
			@include mono;

			font-size: var(--e-text-xl);
			color: var(--e-fg);
		}

		&__question {
			font-size: var(--e-text-sm);
			color: var(--e-fg-muted);
		}

		&__options {
			display: grid;
			grid-template-columns: repeat(auto-fit, minmax(15rem, 1fr));
			gap: var(--e-space-xs);
			width: 100%;
		}

		&__option {
			@include focus-ring;

			display: flex;
			flex-direction: column;
			gap: var(--e-space-3xs);
			align-items: flex-start;
			padding: var(--e-space-sm) var(--e-space-md);
			text-align: left;
			background: var(--e-surface);
			border: var(--e-border-width) solid var(--e-border);
			border-radius: var(--e-radius-sm);

			&:hover:not(:disabled) {
				border-color: var(--e-accent);
			}

			&--right {
				background: var(--e-success-soft);
				border-color: var(--e-success);
			}

			&--wrong {
				background: var(--e-danger-soft);
				border-color: var(--e-danger);
			}
		}

		&__option-head {
			display: flex;
			gap: var(--e-space-xs);
			align-items: baseline;
			justify-content: space-between;
			width: 100%;
		}

		&__option-name {
			font-size: var(--e-text-sm);
			font-weight: var(--e-weight-semibold);
			color: var(--e-fg);
		}

		&__cost {
			@include mono;

			font-size: var(--e-text-md);
			color: var(--e-warn);
			letter-spacing: 2px;
		}

		&__option-blurb {
			font-size: var(--e-text-2xs);
			color: var(--e-fg-muted);
		}

		&__verdict {
			@include mono;

			margin-top: var(--e-space-2xs);
			font-size: var(--e-text-2xs);
			font-weight: var(--e-weight-bold);
			color: var(--e-danger);

			&--ok {
				color: var(--e-success);
			}
		}

		&__reason {
			font-size: var(--e-text-2xs);
			color: var(--e-fg-dim);
		}

		&__feedback {
			display: flex;
			flex-direction: column;
			gap: var(--e-space-xs);
			align-items: flex-start;
			width: 100%;
			padding-top: var(--e-space-sm);
			border-top: var(--e-border-width) solid var(--e-border);
		}

		&__feedback-title {
			font-size: var(--e-text-md);
			font-weight: var(--e-weight-semibold);
			color: var(--e-danger);
		}

		&__feedback--right &__feedback-title {
			color: var(--e-success);
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
