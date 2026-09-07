<script lang="ts" module>
	export interface GuessRound {
		prefix: string;
		options: readonly string[];
		answer: string;
		note: string;
	}
</script>

<script lang="ts">
	import { mulberry32, shuffled } from '$utils/rng';
	import type { ChallengeResult } from '$content/types';
	import Button from '$ui/Button.svelte';
	import ScorePill from '$ui/ScorePill.svelte';
	import { createCourseTranslator } from '../../i18n';

	interface GuessGameProps {
		rounds: readonly GuessRound[];
		onsolve?: (result: ChallengeResult) => void;
	}

	let { rounds, onsolve }: GuessGameProps = $props();

	const t = createCourseTranslator();

	const PERCENT = 100;
	const SHUFFLE_SEED = 515151;

	let roundIndex = $state(0);
	let choice = $state<string | null>(null);
	let hits = $state(0);
	let announced = $state(false);

	const round = $derived(rounds[Math.min(roundIndex, rounds.length - 1)]);
	const options = $derived(shuffled(round.options, mulberry32(SHUFFLE_SEED + roundIndex)));
	const answered = $derived(choice !== null);
	const correct = $derived(choice === round.answer);
	const finished = $derived(roundIndex >= rounds.length);
	const accuracy = $derived(rounds.length === 0 ? 0 : Math.round((hits / rounds.length) * PERCENT));

	function pick(option: string): void {
		if (answered || finished) return;
		choice = option;
		if (option === round.answer) hits += 1;
	}

	function advance(): void {
		choice = null;
		roundIndex += 1;
	}

	function restart(): void {
		roundIndex = 0;
		choice = null;
		hits = 0;
		announced = false;
	}

	$effect(() => {
		if (!finished || announced) return;
		announced = true;
		onsolve?.({
			score: accuracy,
			detail: { hits: hits, rounds: rounds.length, accuracy: `${accuracy}%` }
		});
	});
</script>

<div class="e-guess">
	{#if finished}
		<div class="e-guess__result">
			<ScorePill label={t('GUESS_ACCURACY')} value="{accuracy}%" tone="accent" />
			<p class="e-guess__result-body">
				{t('GUESS_RESULT_BODY', { hits, total: rounds.length })}
			</p>
			<Button onclick={restart}>{t('GUESS_PLAY_AGAIN')}</Button>
		</div>
	{:else}
		<div class="e-guess__stage">
			<div class="e-guess__counter">
				{t('GUESS_COUNTER', { round: roundIndex + 1, total: rounds.length, hits })}
			</div>

			<p class="e-guess__prefix">
				{round.prefix}
				<span class="e-guess__blank" class:e-guess__blank--filled={answered}>
					{answered ? choice : '?'}
				</span>
			</p>

			<div class="e-guess__options">
				{#each options as option (option)}
					<button
						class="e-guess__option"
						class:e-guess__option--right={answered && option === round.answer}
						class:e-guess__option--wrong={answered && option === choice && !correct}
						type="button"
						disabled={answered}
						onclick={() => pick(option)}
					>
						{option}
					</button>
				{/each}
			</div>

			{#if answered}
				<div class="e-guess__feedback" class:e-guess__feedback--right={correct}>
					<p class="e-guess__verdict">{correct ? t('GUESS_RIGHT') : t('GUESS_WRONG')}</p>
					<p class="e-guess__note">{round.note}</p>
					<Button variant="primary" onclick={advance}>
						{roundIndex === rounds.length - 1 ? t('GUESS_SEE_RESULT') : t('COMMON_NEXT')}
					</Button>
				</div>
			{/if}
		</div>
	{/if}
</div>

<style lang="scss">
	.e-guess {
		display: flex;
		flex-direction: column;
		gap: var(--e-space-md);

		&__stage,
		&__result {
			display: flex;
			flex-direction: column;
			gap: var(--e-space-md);
			align-items: flex-start;
			padding: var(--e-space-md);
			background: var(--e-bg-subtle);
			border: var(--e-border-width) solid var(--e-border);
			border-radius: var(--e-radius-md);
		}

		&__counter {
			@include mono;

			font-size: var(--e-text-2xs);
			color: var(--e-fg-dim);
			letter-spacing: var(--e-tracking-wide);
			text-transform: uppercase;
		}

		&__prefix {
			font-size: var(--e-text-xl);
			line-height: var(--e-leading-snug);
			color: var(--e-fg);
		}

		&__blank {
			@include mono;

			display: inline-block;
			min-width: 4ch;
			padding: 0 var(--e-space-2xs);
			color: var(--e-accent);
			text-align: center;
			background: var(--e-accent-soft);
			border-bottom: 2px solid var(--e-accent);
			border-radius: var(--e-radius-xs);

			&--filled {
				color: var(--e-fg);
			}
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

			&:disabled {
				cursor: default;
			}

			&--right {
				color: var(--e-success);
				background: var(--e-success-soft);
				border-color: var(--e-success);
			}

			&--wrong {
				color: var(--e-danger);
				background: var(--e-danger-soft);
				border-color: var(--e-danger);
			}
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

		&__verdict {
			font-size: var(--e-text-sm);
			font-weight: var(--e-weight-bold);
			color: var(--e-danger);
			letter-spacing: var(--e-tracking-wide);
			text-transform: uppercase;
		}

		&__feedback--right &__verdict {
			color: var(--e-success);
		}

		&__note {
			font-size: var(--e-text-sm);
			color: var(--e-fg-muted);
		}

		&__result-body {
			font-size: var(--e-text-md);
			color: var(--e-fg-muted);
		}
	}
</style>
