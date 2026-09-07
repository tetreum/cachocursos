<script lang="ts">
	import {
		budgetCurve,
		optimalAllocation,
		lossForBudget,
		tokensForBudget,
		allocationRegret,
		formatParameters,
		formatTokens
	} from '../../models/scaling';
	import type { ChallengeResult } from '$content/types';
	import Slider from '$ui/Slider.svelte';
	import ScorePill from '$ui/ScorePill.svelte';
	import LineChart, { type ChartSeries } from '$ui/LineChart.svelte';
	import { createCourseTranslator } from '../../i18n';

	interface BudgetLabProps {
		budget: number;
		tolerance: number;
		onsolve?: (result: ChallengeResult) => void;
	}

	let { budget, tolerance, onsolve }: BudgetLabProps = $props();

	const t = createCourseTranslator();

	const MINIMUM_PARAMETERS = 1e7;
	const MAXIMUM_PARAMETERS = 1e12;

	let parameters = $state(3e8);
	let announced = $state(false);

	const best = $derived(optimalAllocation(budget));
	const tokens = $derived(tokensForBudget(budget, parameters));
	const loss = $derived(lossForBudget(budget, parameters));
	const regret = $derived(allocationRegret(budget, parameters));
	const tokensPerParameter = $derived(tokens / parameters);
	const solved = $derived(regret <= tolerance);

	const series = $derived.by((): ChartSeries[] => {
		const curve = budgetCurve(budget, 120);
		return [
			{
				id: 'frontera',
				points: curve.map((point) => [point.parameters, point.loss] as const),
				tone: 'accent'
			}
		];
	});

	$effect(() => {
		if (!solved || announced) return;
		announced = true;
		onsolve?.({
			score: Math.round((1 - regret) * 1000),
			detail: {
				parameters: formatParameters(parameters),
				tokens: formatTokens(tokens),
				tokensPerParameter: tokensPerParameter.toFixed(1),
				loss: loss.toFixed(3)
			}
		});
	});
</script>

<div class="e-budget">
	<div class="e-budget__controls">
		<Slider
			bind:value={parameters}
			min={MINIMUM_PARAMETERS}
			max={MAXIMUM_PARAMETERS}
			scale="log"
			label={t('BUDGET_PARAMETERS_LABEL')}
			format={formatParameters}
			hint={t('BUDGET_PARAMETERS_HINT')}
		/>
	</div>

	<div class="e-budget__scores">
		<ScorePill label={t('LAB_PARAMETERS')} value={formatParameters(parameters)} tone="accent" />
		<ScorePill label={t('BUDGET_TOKENS')} value={formatTokens(tokens)} tone="accent" />
		<ScorePill
			label={t('BUDGET_RATIO')}
			value={tokensPerParameter.toFixed(1)}
			tone={solved ? 'success' : 'neutral'}
		/>
		<ScorePill
			label={t('BUDGET_LOSS')}
			value={loss.toFixed(3)}
			tone={solved ? 'success' : 'neutral'}
		/>
	</div>

	<LineChart
		{series}
		xScale="log"
		xLabel={t('BUDGET_X_LABEL')}
		yLabel={t('BUDGET_Y_LABEL')}
		markers={[
			{ axis: 'x', value: parameters, label: t('BUDGET_MARKER_YOURS') },
			{ axis: 'y', value: best.loss, label: t('BUDGET_MARKER_BEST') }
		]}
		formatX={formatParameters}
		height={220}
	/>

	<div class="e-budget__verdict" class:e-budget__verdict--solved={solved}>
		{#if solved}
			<p class="e-budget__title">{t('BUDGET_SOLVED_TITLE')}</p>
			<p class="e-budget__body">
				{t('BUDGET_SOLVED_HEAD', {
					parameters: formatParameters(best.parameters),
					tokens: formatTokens(best.tokens)
				})}
				<strong>
					{t('BUDGET_SOLVED_STRONG', { ratio: best.tokensPerParameter.toFixed(0) })}
				</strong>{t('BUDGET_SOLVED_TAIL')}
			</p>
		{:else if tokensPerParameter > best.tokensPerParameter}
			<p class="e-budget__title">{t('BUDGET_SMALL_TITLE')}</p>
			<p class="e-budget__body">{t('BUDGET_SMALL_BODY', { regret: regret.toFixed(3) })}</p>
		{:else}
			<p class="e-budget__title">{t('BUDGET_LARGE_TITLE')}</p>
			<p class="e-budget__body">{t('BUDGET_LARGE_BODY', { regret: regret.toFixed(3) })}</p>
		{/if}
	</div>
</div>

<style lang="scss">
	.e-budget {
		display: flex;
		flex-direction: column;
		gap: var(--e-space-md);

		&__controls {
			padding: var(--e-space-md);
			background: var(--e-bg-subtle);
			border: var(--e-border-width) solid var(--e-border);
			border-radius: var(--e-radius-md);
		}

		&__scores {
			display: flex;
			flex-wrap: wrap;
			gap: var(--e-space-xs);
		}

		&__verdict {
			display: flex;
			flex-direction: column;
			gap: var(--e-space-2xs);
			padding: var(--e-space-md);
			background: var(--e-surface);
			border: var(--e-border-width) solid var(--e-border);
			border-radius: var(--e-radius-md);

			&--solved {
				background: var(--e-success-soft);
				border-color: var(--e-success);
			}
		}

		&__title {
			font-size: var(--e-text-md);
			font-weight: var(--e-weight-semibold);
			color: var(--e-fg);
		}

		&__body {
			font-size: var(--e-text-sm);
			color: var(--e-fg-muted);
		}
	}
</style>
