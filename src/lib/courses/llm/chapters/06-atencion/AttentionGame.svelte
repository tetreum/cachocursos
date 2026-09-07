<script lang="ts">
	import { untrack } from 'svelte';
	import {
		normalizeAllocation,
		allocationScore,
		type AttentionPuzzle
	} from '../../models/attention';
	import type { ChallengeResult } from '$content/types';
	import TokenChip from '../../ui/TokenChip.svelte';
	import Button from '$ui/Button.svelte';
	import ScorePill from '$ui/ScorePill.svelte';
	import { createCourseTranslator } from '../../i18n';

	interface AttentionGameProps {
		puzzles: readonly AttentionPuzzle[];
		passingScore: number;
		onsolve?: (result: ChallengeResult) => void;
	}

	let { puzzles, passingScore, onsolve }: AttentionGameProps = $props();

	const t = createCourseTranslator();

	const BUDGET = 100;
	const CLICK_STEP = 10;
	const PERCENT = 100;

	let puzzleIndex = $state(0);
	let points = $state<number[]>(untrack(() => puzzles[0].tokens.map(() => 0)));
	let revealed = $state(false);
	let scores = $state<number[]>([]);
	let announced = $state(false);

	const puzzle = $derived(puzzles[Math.min(puzzleIndex, puzzles.length - 1)]);
	const finished = $derived(puzzleIndex >= puzzles.length);
	const spent = $derived(points.reduce((total, value) => total + value, 0));
	const remaining = $derived(BUDGET - spent);
	const allocation = $derived(normalizeAllocation(points));
	const currentScore = $derived(allocationScore(points, puzzle.gold));

	const resolvedIndex = $derived.by(() => {
		let best = -1;
		for (let index = 0; index < allocation.length; index += 1) {
			if (index === puzzle.queryIndex) continue;
			if (best === -1 || allocation[index] > allocation[best]) best = index;
		}
		return best;
	});

	const resolvedCorrectly = $derived(resolvedIndex === puzzle.answerIndex);
	const averageScore = $derived(
		scores.length === 0 ? 0 : scores.reduce((total, value) => total + value, 0) / scores.length
	);

	function addPoints(index: number): void {
		if (revealed || index === puzzle.queryIndex) return;
		if (remaining <= 0) return;
		const next = points.slice();
		next[index] += Math.min(CLICK_STEP, remaining);
		points = next;
	}

	function removePoints(index: number): void {
		if (revealed || points[index] === 0) return;
		const next = points.slice();
		next[index] = Math.max(0, next[index] - CLICK_STEP);
		points = next;
	}

	function clear(): void {
		if (revealed) return;
		points = puzzle.tokens.map(() => 0);
	}

	function reveal(): void {
		if (spent === 0) return;
		revealed = true;
		scores = [...scores, currentScore];
	}

	function advance(): void {
		revealed = false;
		puzzleIndex += 1;
		if (puzzleIndex < puzzles.length) points = puzzles[puzzleIndex].tokens.map(() => 0);
	}

	function restart(): void {
		puzzleIndex = 0;
		points = puzzles[0].tokens.map(() => 0);
		revealed = false;
		scores = [];
		announced = false;
	}

	$effect(() => {
		if (!finished || announced) return;
		announced = true;
		if (averageScore >= passingScore) {
			onsolve?.({
				score: Math.round(averageScore * PERCENT),
				detail: { similarity: `${Math.round(averageScore * PERCENT)}%`, frases: puzzles.length }
			});
		}
	});
</script>

<div class="e-attention">
	{#if finished}
		<div class="e-attention__panel">
			<p class="e-attention__title">
				{averageScore >= passingScore ? t('MAP_WON') : t('ATTENTION_FAILED')}
			</p>
			<p class="e-attention__body">
				{t('ATTENTION_RESULT_BODY', { score: Math.round(averageScore * PERCENT) })}
				{#if averageScore < passingScore}
					{t('ATTENTION_RESULT_NEEDED', { required: Math.round(passingScore * PERCENT) })}
				{/if}
			</p>
			<Button onclick={restart}>{t('MAP_RETRY')}</Button>
		</div>
	{:else}
		<div class="e-attention__scores">
			<ScorePill
				label={t('ATTENTION_FREE_POINTS')}
				value={String(remaining)}
				tone={remaining === 0 ? 'success' : 'accent'}
			/>
			<ScorePill label={t('ATTENTION_SENTENCE')} value="{puzzleIndex + 1} / {puzzles.length}" />
			{#if revealed}
				<ScorePill
					label={t('ATTENTION_SIMILARITY')}
					value="{Math.round(currentScore * PERCENT)}%"
					tone={currentScore >= passingScore ? 'success' : 'warn'}
				/>
			{/if}
		</div>

		<div class="e-attention__panel">
			<p class="e-attention__instruction">
				{t('ATTENTION_INSTRUCTION')}
			</p>

			<div class="e-attention__sentence">
				{#each puzzle.tokens as token, index (index)}
					{#if index === puzzle.queryIndex}
						<TokenChip text={token} tone="accent" sub="query" title={t('ATTENTION_QUERY_TITLE')} />
					{:else}
						<TokenChip
							text={token}
							weight={points[index] / BUDGET}
							sub={points[index] > 0 ? String(points[index]) : undefined}
							onclick={() => addPoints(index)}
							title={t('ATTENTION_GIVE_TITLE', { word: token })}
						/>
					{/if}
				{/each}
			</div>

			<div class="e-attention__hint-row">
				<span class="e-attention__hint">
					{t('ATTENTION_QUESTION', { word: puzzle.tokens[puzzle.queryIndex] })}
				</span>
			</div>

			{#if revealed}
				<div class="e-attention__reveal">
					<p class="e-attention__verdict" class:e-attention__verdict--right={resolvedCorrectly}>
						{#if resolvedCorrectly}
							{t('ATTENTION_RESOLVED_RIGHT', {
								query: puzzle.tokens[puzzle.queryIndex],
								answer: puzzle.tokens[puzzle.answerIndex]
							})}
						{:else}
							{t('ATTENTION_RESOLVED_WRONG', {
								query: puzzle.tokens[puzzle.queryIndex],
								answer: puzzle.tokens[resolvedIndex]
							})}
						{/if}
					</p>

					<p class="e-attention__label">{t('ATTENTION_GOLD_LABEL')}</p>
					<div class="e-attention__sentence">
						{#each puzzle.tokens as token, index (index)}
							<TokenChip
								text={token}
								tone={index === puzzle.queryIndex ? 'accent' : 'neutral'}
								weight={index === puzzle.queryIndex ? null : puzzle.gold[index]}
								sub={puzzle.gold[index] > 0
									? `${Math.round(puzzle.gold[index] * PERCENT)}`
									: undefined}
							/>
						{/each}
					</div>

					<p class="e-attention__body">{puzzle.explanation}</p>
					<Button variant="primary" onclick={advance}>
						{puzzleIndex === puzzles.length - 1
							? t('GUESS_SEE_RESULT')
							: t('ATTENTION_NEXT_SENTENCE')}
					</Button>
				</div>
			{:else}
				<div class="e-attention__actions">
					<Button variant="primary" disabled={spent === 0} onclick={reveal}
						>{t('ATTENTION_CHECK')}</Button
					>
					<Button variant="ghost" onclick={clear}>{t('ATTENTION_CLEAR')}</Button>
				</div>

				{#if spent > 0}
					<div class="e-attention__spent">
						<p class="e-attention__label">{t('ATTENTION_SPENT_LABEL', { step: CLICK_STEP })}</p>
						<div class="e-attention__spent-list">
							{#each puzzle.tokens as token, index (index)}
								{#if points[index] > 0}
									<button
										class="e-attention__minus"
										type="button"
										onclick={() => removePoints(index)}
										title={t('ATTENTION_MINUS_TITLE', {
											word: token,
											points: points[index],
											step: CLICK_STEP
										})}
									>
										<span class="e-attention__minus-word">{token}</span>
										<span class="e-attention__minus-points">{points[index]}</span>
										<span class="e-attention__minus-action" aria-hidden="true">−{CLICK_STEP}</span>
									</button>
								{/if}
							{/each}
						</div>
					</div>
				{/if}
			{/if}
		</div>
	{/if}
</div>

<style lang="scss">
	.e-attention {
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

		&__instruction {
			font-size: var(--e-text-sm);
			color: var(--e-fg-muted);
		}

		&__sentence {
			display: flex;
			flex-wrap: wrap;
			gap: var(--e-space-2xs);
			align-items: center;
		}

		&__hint-row {
			display: flex;
			gap: var(--e-space-xs);
		}

		&__hint {
			font-size: var(--e-text-md);
			color: var(--e-fg);
		}

		&__actions {
			display: flex;
			flex-wrap: wrap;
			gap: var(--e-space-xs);
			align-items: center;
		}

		&__spent {
			display: flex;
			flex-direction: column;
			gap: var(--e-space-2xs);
			width: 100%;
		}

		&__spent-list {
			display: flex;
			flex-wrap: wrap;
			gap: var(--e-space-2xs);
		}

		&__minus {
			@include focus-ring;

			display: inline-flex;
			gap: var(--e-space-2xs);
			align-items: center;
			padding: var(--e-space-3xs) var(--e-space-xs);
			font-size: var(--e-text-xs);
			background: var(--e-surface-2);
			border: var(--e-border-width) solid var(--e-border);
			border-radius: var(--e-radius-pill);

			&:hover {
				border-color: var(--e-danger);
			}
		}

		&__minus-word {
			@include mono;

			color: var(--e-fg-muted);
		}

		&__minus-points {
			@include mono;

			font-weight: var(--e-weight-bold);
			color: var(--e-accent-2);
			font-variant-numeric: tabular-nums;
		}

		&__minus-action {
			@include mono;

			font-size: var(--e-text-2xs);
			color: var(--e-fg-dim);
		}

		&__minus:hover &__minus-action {
			color: var(--e-danger);
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

		&__verdict {
			font-size: var(--e-text-md);
			color: var(--e-danger);

			&--right {
				color: var(--e-success);
			}
		}

		&__label {
			font-size: var(--e-text-2xs);
			font-weight: var(--e-weight-bold);
			color: var(--e-fg-dim);
			letter-spacing: var(--e-tracking-wide);
			text-transform: uppercase;
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
