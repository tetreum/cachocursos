<script lang="ts">
	import { probeGradientFlow, relativeSignal } from '../../models/residual';
	import Slider from '$ui/Slider.svelte';
	import ScorePill from '$ui/ScorePill.svelte';
	import LineChart, { type ChartSeries } from '$ui/LineChart.svelte';
	import { createCourseTranslator } from '../../i18n';

	const t = createCourseTranslator();

	const MINIMUM_DEPTH = 2;
	const MAXIMUM_DEPTH = 48;
	const SIGNAL_FLOOR = 1e-12;
	const SIGNAL_CEILING = 1e2;
	const USABLE_SIGNAL = 0.01;

	let depth = $state(24);

	const plain = $derived(probeGradientFlow({ depth: Math.round(depth), residual: false }));
	const withResidual = $derived(probeGradientFlow({ depth: Math.round(depth), residual: true }));

	const plainSignal = $derived(relativeSignal(plain));
	const residualSignal = $derived(relativeSignal(withResidual));

	function toPoints(signal: Float64Array): [number, number][] {
		const points: [number, number][] = [];
		for (let layer = 0; layer < signal.length; layer += 1) {
			points.push([layer, Math.max(SIGNAL_FLOOR, Math.min(SIGNAL_CEILING, signal[layer]))]);
		}
		return points;
	}

	const series = $derived.by((): ChartSeries[] => [
		{ id: 'sin', points: toPoints(plainSignal), tone: 'danger', label: 'sin residual' },
		{ id: 'con', points: toPoints(residualSignal), tone: 'success', label: 'con residual' }
	]);

	function formatSignal(value: number): string {
		if (value >= 0.01) return value.toFixed(2);
		return value.toExponential(1);
	}

	const plainReachesFirst = $derived(plainSignal[0]);
	const residualReachesFirst = $derived(residualSignal[0]);
	const plainIsDead = $derived(plainReachesFirst < USABLE_SIGNAL);
</script>

<div class="e-residual">
	<div class="e-residual__controls">
		<Slider
			bind:value={depth}
			min={MINIMUM_DEPTH}
			max={MAXIMUM_DEPTH}
			step={1}
			label={t('RESIDUAL_DEPTH')}
			format={(value) => String(Math.round(value))}
			hint={t('RESIDUAL_DEPTH_HINT')}
		/>
	</div>

	<div class="e-residual__scores">
		<ScorePill
			label={t('RESIDUAL_WITHOUT')}
			value={formatSignal(plainReachesFirst)}
			tone={plainIsDead ? 'danger' : 'neutral'}
		/>
		<ScorePill
			label={t('RESIDUAL_WITH')}
			value={formatSignal(residualReachesFirst)}
			tone="success"
		/>
	</div>

	<LineChart
		{series}
		yScale="log"
		xLabel={t('RESIDUAL_X_LABEL')}
		yLabel={t('RESIDUAL_Y_LABEL')}
		yDomain={[SIGNAL_FLOOR, SIGNAL_CEILING]}
		formatX={(value) => String(Math.round(value))}
		height={220}
	/>

	<p class="e-residual__reading">
		{#if plainIsDead}
			{t('RESIDUAL_DEAD_HEAD', { depth: Math.round(depth) })}
			<strong>{formatSignal(plainReachesFirst)}</strong>{t('RESIDUAL_DEAD_MIDDLE')}
			<strong>{formatSignal(residualReachesFirst)}</strong>{t('RESIDUAL_DEAD_TAIL')}
		{:else}
			{t('RESIDUAL_ALIVE')}
		{/if}
	</p>

	<p class="e-residual__note">
		{t('RESIDUAL_NOTE_HEAD', { depth: Math.round(depth) })}
		<em>{t('RESIDUAL_NOTE_EM')}</em>
		{t('RESIDUAL_NOTE_TAIL')}
	</p>
</div>

<style lang="scss">
	.e-residual {
		display: flex;
		flex-direction: column;
		gap: var(--e-space-md);
		padding: var(--e-space-md);
		background: var(--e-bg-subtle);
		border: var(--e-border-width) solid var(--e-border);
		border-radius: var(--e-radius-md);

		&__controls {
			display: grid;
			grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr));
			gap: var(--e-space-md);
		}

		&__scores {
			display: flex;
			flex-wrap: wrap;
			gap: var(--e-space-xs);
		}

		&__reading {
			font-size: var(--e-text-sm);
			color: var(--e-fg-muted);

			strong {
				@include mono;

				color: var(--e-fg);
			}
		}

		&__note {
			font-size: var(--e-text-2xs);
			color: var(--e-fg-dim);
		}
	}
</style>
