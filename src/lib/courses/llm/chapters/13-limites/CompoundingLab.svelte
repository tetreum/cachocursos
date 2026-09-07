<script lang="ts">
	import {
		compoundedAccuracy,
		stepsUntilUnreliable,
		REQUIRED_ACCURACY
	} from '../../models/onepass';
	import Slider from '$ui/Slider.svelte';
	import ScorePill from '$ui/ScorePill.svelte';
	import LineChart, { type ChartSeries } from '$ui/LineChart.svelte';
	import { createCourseTranslator } from '../../i18n';

	const t = createCourseTranslator();

	const MAX_STEPS = 40;
	const PERCENT = 100;
	const REPORTED_STEPS = 20;

	let reliability = $state(0.97);

	const series = $derived.by((): ChartSeries[] => {
		const points: [number, number][] = [];
		for (let steps = 1; steps <= MAX_STEPS; steps += 1) {
			points.push([steps, compoundedAccuracy(steps, reliability)]);
		}
		return [{ id: 'cadena', points, tone: 'accent' }];
	});

	const limit = $derived(stepsUntilUnreliable(reliability, REQUIRED_ACCURACY));
	const atTwenty = $derived(compoundedAccuracy(REPORTED_STEPS, reliability));
</script>

<div class="e-compound">
	<Slider
		bind:value={reliability}
		min={0.8}
		max={0.999}
		step={0.001}
		label={t('COMPOUND_RELIABILITY')}
		format={(value) => `${(value * PERCENT).toFixed(1)}%`}
		hint={t('COMPOUND_RELIABILITY_HINT')}
	/>

	<div class="e-compound__scores">
		<ScorePill label={t('COMPOUND_STEPS')} value={String(limit)} tone="accent" />
		<ScorePill
			label={t('COMPOUND_AT_TWENTY', { steps: REPORTED_STEPS })}
			value="{(atTwenty * PERCENT).toFixed(0)}%"
			tone={atTwenty < REQUIRED_ACCURACY ? 'danger' : 'success'}
		/>
	</div>

	<LineChart
		{series}
		xLabel={t('COMPOUND_X_LABEL')}
		yLabel={t('COMPOUND_Y_LABEL')}
		yDomain={[0, 1]}
		xDomain={[1, MAX_STEPS]}
		markers={[{ axis: 'y', value: REQUIRED_ACCURACY, label: t('COMPOUND_THRESHOLD') }]}
		formatY={(value) => `${(value * PERCENT).toFixed(0)}%`}
		formatX={(value) => String(Math.round(value))}
		height={200}
	/>

	<p class="e-compound__reading">
		{t('COMPOUND_READING_HEAD', { reliability: (reliability * PERCENT).toFixed(1) })}
		<strong>{t('COMPOUND_READING_STRONG', { steps: limit })}</strong>
		{t('COMPOUND_READING_TAIL', { threshold: (REQUIRED_ACCURACY * PERCENT).toFixed(0) })}
	</p>
</div>

<style lang="scss">
	.e-compound {
		display: flex;
		flex-direction: column;
		gap: var(--e-space-md);
		padding: var(--e-space-md);
		background: var(--e-bg-subtle);
		border: var(--e-border-width) solid var(--e-border);
		border-radius: var(--e-radius-md);

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
	}
</style>
