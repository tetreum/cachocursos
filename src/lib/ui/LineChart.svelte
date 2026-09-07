<script lang="ts" module>
	export interface ChartSeries {
		id: string;
		points: readonly (readonly [number, number])[];
		tone?: 'accent' | 'model' | 'you' | 'success' | 'danger' | 'muted';
		dashed?: boolean;
		label?: string;
	}

	export interface ChartMarker {
		axis: 'x' | 'y';
		value: number;
		label?: string;
	}
</script>

<script lang="ts">
	import { createTranslator } from '$i18n/locale';
	import { linearScale, logScale, niceTicks, extent, linePath } from '$lib/viz/scale';

	const t = createTranslator();

	interface LineChartProps {
		series: readonly ChartSeries[];
		xLabel?: string;
		yLabel?: string;
		xScale?: 'linear' | 'log';
		yScale?: 'linear' | 'log';
		xDomain?: readonly [number, number];
		yDomain?: readonly [number, number];
		markers?: readonly ChartMarker[];
		height?: number;
		formatX?: (value: number) => string;
		formatY?: (value: number) => string;
	}

	let {
		series,
		xLabel,
		yLabel,
		xScale = 'linear',
		yScale = 'linear',
		xDomain,
		yDomain,
		markers = [],
		height = 220,
		formatX,
		formatY
	}: LineChartProps = $props();

	const WIDTH = 640;
	const MARGIN = { top: 12, right: 16, bottom: 34, left: 52 };
	const TICK_COUNT = 5;

	const allPoints = $derived(series.flatMap((entry) => entry.points));
	const xValues = $derived(allPoints.map((point) => point[0]));
	const yValues = $derived(allPoints.map((point) => point[1]));

	const resolvedXDomain = $derived(xDomain ?? extent(xValues));
	const resolvedYDomain = $derived(yDomain ?? extent(yValues));

	const innerWidth = WIDTH - MARGIN.left - MARGIN.right;
	const innerHeight = $derived(height - MARGIN.top - MARGIN.bottom);

	const toX = $derived(
		(xScale === 'log' ? logScale : linearScale)(resolvedXDomain as [number, number], [
			MARGIN.left,
			MARGIN.left + innerWidth
		])
	);
	const toY = $derived(
		(yScale === 'log' ? logScale : linearScale)(resolvedYDomain as [number, number], [
			MARGIN.top + innerHeight,
			MARGIN.top
		])
	);

	const xTicks = $derived(
		xScale === 'log'
			? decadeTicks(resolvedXDomain as [number, number])
			: niceTicks(resolvedXDomain[0], resolvedXDomain[1], TICK_COUNT)
	);
	const yTicks = $derived(
		yScale === 'log'
			? decadeTicks(resolvedYDomain as [number, number])
			: niceTicks(resolvedYDomain[0], resolvedYDomain[1], TICK_COUNT)
	);

	const MAXIMUM_DECADE_TICKS = 7;

	function decadeTicks(domain: readonly [number, number]): number[] {
		const start = Math.ceil(Math.log10(domain[0]));
		const end = Math.floor(Math.log10(domain[1]));
		const exponents: number[] = [];
		for (let exponent = start; exponent <= end; exponent += 1) exponents.push(exponent);

		const stride = Math.ceil(exponents.length / MAXIMUM_DECADE_TICKS);
		return exponents
			.filter((_, index) => index % stride === 0)
			.map((exponent) => Math.pow(10, exponent));
	}

	function pathFor(entry: ChartSeries): string {
		return linePath(entry.points.map(([x, y]) => [toX(x), toY(y)] as const));
	}

	const defaultFormat = (value: number): string =>
		Math.abs(value) >= 1000 || (Math.abs(value) < 0.01 && value !== 0)
			? value.toExponential(0)
			: String(Number(value.toFixed(2)));
</script>

<figure class="e-chart">
	<svg viewBox="0 0 {WIDTH} {height}" role="img" aria-label={yLabel ?? t('COMMON_CHART')}>
		{#each yTicks as tick (tick)}
			<line
				class="e-chart__grid"
				x1={MARGIN.left}
				x2={MARGIN.left + innerWidth}
				y1={toY(tick)}
				y2={toY(tick)}
			/>
			<text class="e-chart__tick e-chart__tick--y" x={MARGIN.left - 8} y={toY(tick)}>
				{(formatY ?? defaultFormat)(tick)}
			</text>
		{/each}

		{#each xTicks as tick (tick)}
			<text class="e-chart__tick e-chart__tick--x" x={toX(tick)} y={MARGIN.top + innerHeight + 20}>
				{(formatX ?? defaultFormat)(tick)}
			</text>
		{/each}

		{#each markers as marker (marker.axis + marker.value)}
			{#if marker.axis === 'x'}
				<line
					class="e-chart__marker"
					x1={toX(marker.value)}
					x2={toX(marker.value)}
					y1={MARGIN.top}
					y2={MARGIN.top + innerHeight}
				/>
				{#if marker.label}
					<text class="e-chart__marker-label" x={toX(marker.value) + 5} y={MARGIN.top + 12}>
						{marker.label}
					</text>
				{/if}
			{:else}
				<line
					class="e-chart__marker"
					x1={MARGIN.left}
					x2={MARGIN.left + innerWidth}
					y1={toY(marker.value)}
					y2={toY(marker.value)}
				/>
				{#if marker.label}
					<text class="e-chart__marker-label" x={MARGIN.left + 5} y={toY(marker.value) - 5}>
						{marker.label}
					</text>
				{/if}
			{/if}
		{/each}

		{#each series as entry (entry.id)}
			<path
				class="e-chart__line e-chart__line--{entry.tone ?? 'accent'}"
				class:e-chart__line--dashed={entry.dashed}
				d={pathFor(entry)}
			/>
		{/each}

		<line
			class="e-chart__axis"
			x1={MARGIN.left}
			x2={MARGIN.left + innerWidth}
			y1={MARGIN.top + innerHeight}
			y2={MARGIN.top + innerHeight}
		/>
	</svg>

	{#if xLabel || yLabel}
		<figcaption class="e-chart__caption">
			{#if yLabel}<span class="e-chart__axis-label">{yLabel}</span>{/if}
			{#if xLabel}<span class="e-chart__axis-label">{xLabel}</span>{/if}
		</figcaption>
	{/if}
</figure>

<style lang="scss">
	.e-chart {
		margin: 0;

		svg {
			width: 100%;
			height: auto;
			overflow: visible;
		}

		&__grid {
			stroke: var(--e-border);
			stroke-width: 1;
		}

		&__axis {
			stroke: var(--e-border-strong);
			stroke-width: 1;
		}

		&__tick {
			font-family: var(--e-font-mono);
			font-size: 10px;
			fill: var(--e-fg-dim);

			&--y {
				text-anchor: end;
				dominant-baseline: middle;
			}

			&--x {
				text-anchor: middle;
			}
		}

		&__marker {
			stroke: var(--e-warn);
			stroke-dasharray: 4 3;
			stroke-width: 1;
		}

		&__marker-label {
			font-family: var(--e-font-mono);
			font-size: 10px;
			fill: var(--e-warn);
		}

		&__line {
			fill: none;
			stroke-width: 2;
			stroke-linecap: round;
			stroke-linejoin: round;

			&--dashed {
				stroke-dasharray: 5 4;
			}

			&--accent {
				stroke: var(--e-accent);
			}

			&--model {
				stroke: var(--e-model);
			}

			&--you {
				stroke: var(--e-you);
			}

			&--success {
				stroke: var(--e-success);
			}

			&--danger {
				stroke: var(--e-danger);
			}

			&--muted {
				stroke: var(--e-fg-dim);
			}
		}

		&__caption {
			display: flex;
			justify-content: space-between;
			margin-top: var(--e-space-2xs);
		}

		&__axis-label {
			font-size: var(--e-text-2xs);
			color: var(--e-fg-dim);
			letter-spacing: var(--e-tracking-wide);
			text-transform: uppercase;
		}
	}
</style>
