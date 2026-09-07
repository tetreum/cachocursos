<script lang="ts" module>
	interface FlowStage {
		id: string;
		title: string;
		body: string;
	}
</script>

<script lang="ts">
	import { prefersReducedMotion } from 'svelte/motion';
	import { mulberry32 } from '$utils/rng';
	import Button from '$ui/Button.svelte';
	import type { TransformerFlowData } from '../../data/types';
	import { createCourseTranslator } from '../../i18n';

	interface TransformerFlowProps {
		flow: TransformerFlowData;
	}

	let { flow }: TransformerFlowProps = $props();

	const t = createCourseTranslator();

	const SENTENCE = $derived(flow.sentence);
	const TOKENS = $derived(flow.tokens);
	const QUERY_INDEX = $derived(flow.queryIndex);
	const ATTENTION = $derived(flow.attention);
	const CANDIDATES = $derived(flow.candidates);

	const VECTOR_ROWS = 4;
	const STEP_MILLISECONDS = 2400;
	const VIEW_WIDTH = 640;
	const VIEW_HEIGHT = 300;
	const COLUMN_WIDTH = 96;
	const COLUMN_GAP = 22;
	const TOKEN_Y = 74;
	const TOKEN_HEIGHT = 30;
	const CELL_Y = 116;
	const CELL_HEIGHT = 15;
	const CELL_GAP = 3;

	const STAGES: readonly FlowStage[] = [
		{ id: 'texto', title: t('FLOW_TEXT_TITLE'), body: t('FLOW_TEXT_BODY') },
		{ id: 'tokens', title: t('FLOW_TOKENS_TITLE'), body: t('FLOW_TOKENS_BODY') },
		{ id: 'embedding', title: t('FLOW_EMBEDDING_TITLE'), body: t('FLOW_EMBEDDING_BODY') },
		{ id: 'posicion', title: t('FLOW_POSITION_TITLE'), body: t('FLOW_POSITION_BODY') },
		{ id: 'atencion', title: t('FLOW_ATTENTION_TITLE'), body: t('FLOW_ATTENTION_BODY') },
		{ id: 'ffn', title: t('FLOW_FFN_TITLE'), body: t('FLOW_FFN_BODY') },
		{ id: 'logits', title: t('FLOW_LOGITS_TITLE'), body: t('FLOW_LOGITS_BODY') }
	];

	let stage = $state(0);
	let playing = $state(true);

	const reducedMotion = $derived(prefersReducedMotion.current);

	const current = $derived(STAGES[stage]);
	const totalWidth = $derived(TOKENS.length * COLUMN_WIDTH + (TOKENS.length - 1) * COLUMN_GAP);
	const originX = $derived((VIEW_WIDTH - totalWidth) / 2);

	function columnX(index: number): number {
		return originX + index * (COLUMN_WIDTH + COLUMN_GAP);
	}

	function cellShade(token: number, row: number, transformed: boolean): number {
		const random = mulberry32((token + 1) * 97 + row * 13 + (transformed ? 5000 : 0));
		return 0.25 + random() * 0.7;
	}

	function arcPath(from: number, to: number): string {
		const startX = columnX(from) + COLUMN_WIDTH / 2;
		const endX = columnX(to) + COLUMN_WIDTH / 2;
		const lift = Math.min(46, 18 + Math.abs(endX - startX) * 0.18);
		return `M${startX},${TOKEN_Y} Q${(startX + endX) / 2},${TOKEN_Y - lift} ${endX},${TOKEN_Y}`;
	}

	$effect(() => {
		if (!playing || reducedMotion) return;
		const timer = setInterval(() => {
			stage = (stage + 1) % STAGES.length;
		}, STEP_MILLISECONDS);
		return () => clearInterval(timer);
	});

	function goTo(index: number): void {
		playing = false;
		stage = index;
	}
</script>

<div class="e-flow">
	<svg
		class="e-flow__canvas"
		viewBox="0 0 {VIEW_WIDTH} {VIEW_HEIGHT}"
		role="img"
		aria-label={t('FLOW_ALT', { stage: current.title })}
	>
		<g class="e-flow__layer" class:e-flow__layer--on={stage === 0}>
			<rect
				class="e-flow__sentence"
				x={originX}
				y={TOKEN_Y}
				width={totalWidth}
				height={TOKEN_HEIGHT}
				rx="6"
			/>
			<text class="e-flow__sentence-text" x={VIEW_WIDTH / 2} y={TOKEN_Y + 20}>{SENTENCE}</text>
		</g>

		<g class="e-flow__layer" class:e-flow__layer--on={stage >= 1}>
			{#each TOKENS as token, index (token + index)}
				<rect
					class="e-flow__token"
					class:e-flow__token--query={stage === 4 && index === QUERY_INDEX}
					x={columnX(index)}
					y={TOKEN_Y}
					width={COLUMN_WIDTH}
					height={TOKEN_HEIGHT}
					rx="6"
				/>
				<text class="e-flow__token-text" x={columnX(index) + COLUMN_WIDTH / 2} y={TOKEN_Y + 20}>
					{token}
				</text>
				<text class="e-flow__id" x={columnX(index) + COLUMN_WIDTH / 2} y={TOKEN_Y - 10}>
					#{1204 + index * 37}
				</text>
			{/each}
		</g>

		<g class="e-flow__layer" class:e-flow__layer--on={stage >= 2}>
			{#each TOKENS as token, index (token + index)}
				{#each Array(VECTOR_ROWS), row (row)}
					<rect
						class="e-flow__cell"
						x={columnX(index)}
						y={CELL_Y + row * (CELL_HEIGHT + CELL_GAP)}
						width={COLUMN_WIDTH}
						height={CELL_HEIGHT}
						rx="3"
						style:fill="var(--e-tok-{index % 8})"
						style:fill-opacity={cellShade(index, row, stage >= 5)}
					/>
				{/each}
			{/each}
		</g>

		<g class="e-flow__layer" class:e-flow__layer--on={stage >= 3}>
			{#each TOKENS as token, index (token + index)}
				<rect
					class="e-flow__position"
					x={columnX(index) + COLUMN_WIDTH - 22}
					y={CELL_Y - 12}
					width="22"
					height="12"
					rx="6"
				/>
				<text class="e-flow__position-text" x={columnX(index) + COLUMN_WIDTH - 11} y={CELL_Y - 3}>
					{index}
				</text>
			{/each}
		</g>

		<g class="e-flow__layer" class:e-flow__layer--on={stage === 4}>
			{#each ATTENTION as weight, index (index)}
				{#if weight > 0}
					<path
						class="e-flow__arc"
						d={arcPath(QUERY_INDEX, index)}
						style:stroke-width={1 + weight * 9}
						style:opacity={0.25 + weight}
					/>
				{/if}
			{/each}
		</g>

		<g class="e-flow__layer" class:e-flow__layer--on={stage === 5}>
			{#each TOKENS as token, index (token + index)}
				<rect
					class="e-flow__ffn"
					x={columnX(index) - 4}
					y={CELL_Y - 6}
					width={COLUMN_WIDTH + 8}
					height={VECTOR_ROWS * (CELL_HEIGHT + CELL_GAP) + 8}
					rx="6"
				/>
			{/each}
		</g>

		<g class="e-flow__layer" class:e-flow__layer--on={stage === 6}>
			<rect
				class="e-flow__spotlight"
				x={columnX(TOKENS.length - 1) - 6}
				y={TOKEN_Y - 6}
				width={COLUMN_WIDTH + 12}
				height={TOKEN_HEIGHT + 12}
				rx="8"
			/>
			{#each CANDIDATES as candidate, index (candidate.word)}
				<text class="e-flow__candidate" x={originX} y={CELL_Y + 12 + index * 22}>
					{candidate.word}
				</text>
				<rect
					class="e-flow__bar"
					x={originX + 56}
					y={CELL_Y + 2 + index * 22}
					width={candidate.probability * 380}
					height="12"
					rx="3"
				/>
			{/each}
		</g>
	</svg>

	<div class="e-flow__caption">
		{#each STAGES as item, index (item.id)}
			<div
				class="e-flow__slide"
				class:e-flow__slide--on={index === stage}
				aria-hidden={index !== stage}
			>
				<p class="e-flow__title">
					<span class="e-flow__index">{index + 1}/{STAGES.length}</span>
					{item.title}
				</p>
				<p class="e-flow__body">{item.body}</p>
			</div>
		{/each}
	</div>

	<div class="e-flow__controls">
		<span class="e-flow__toggle">
			<Button full onclick={() => (playing = !playing)}>
				{playing ? t('FLOW_PAUSE') : reducedMotion ? t('FLOW_PLAY') : t('FLOW_RESUME')}
			</Button>
		</span>
		<div class="e-flow__dots">
			{#each STAGES as item, index (item.id)}
				<button
					class="e-flow__dot"
					class:e-flow__dot--on={index === stage}
					type="button"
					aria-label={item.title}
					aria-current={index === stage}
					onclick={() => goTo(index)}
				></button>
			{/each}
		</div>
	</div>
</div>

<style lang="scss">
	.e-flow {
		display: flex;
		flex-direction: column;
		gap: var(--e-space-sm);
		padding: var(--e-space-md);
		background: var(--e-bg-subtle);
		border: var(--e-border-width) solid var(--e-border);
		border-radius: var(--e-radius-md);

		&__canvas {
			width: 100%;
			height: auto;
		}

		&__layer {
			opacity: 0;
			transition: opacity var(--e-dur-slow) var(--e-ease-out);
			pointer-events: none;

			&--on {
				opacity: 1;
			}
		}

		&__sentence {
			fill: var(--e-surface-2);
			stroke: var(--e-border-strong);
		}

		&__sentence-text,
		&__token-text {
			font-family: var(--e-font-mono);
			font-size: 14px;
			fill: var(--e-fg);
			text-anchor: middle;
		}

		&__token {
			fill: var(--e-surface-2);
			stroke: var(--e-border);
			transition:
				fill var(--e-dur-base) var(--e-ease-out),
				stroke var(--e-dur-base) var(--e-ease-out);

			&--query {
				fill: var(--e-accent-soft);
				stroke: var(--e-accent);
			}
		}

		&__id {
			font-family: var(--e-font-mono);
			font-size: 9px;
			fill: var(--e-fg-dim);
			text-anchor: middle;
		}

		&__cell {
			transition: fill-opacity var(--e-dur-slow) var(--e-ease-out);
		}

		&__position {
			fill: var(--e-warn-soft);
			stroke: var(--e-warn);
		}

		&__position-text {
			font-family: var(--e-font-mono);
			font-size: 9px;
			fill: var(--e-warn);
			text-anchor: middle;
		}

		&__arc {
			fill: none;
			stroke: var(--e-accent);
			stroke-linecap: round;
		}

		&__ffn {
			fill: none;
			stroke: var(--e-accent-2);
			stroke-dasharray: 5 4;
		}

		&__spotlight {
			fill: none;
			stroke: var(--e-success);
			stroke-width: 2;
		}

		&__candidate {
			font-family: var(--e-font-mono);
			font-size: 11px;
			fill: var(--e-fg-muted);
		}

		&__bar {
			fill: var(--e-success);
		}

		&__caption {
			display: grid;
		}

		&__slide {
			display: flex;
			grid-area: 1 / 1;
			flex-direction: column;
			gap: var(--e-space-3xs);
			opacity: 0;
			transition: opacity var(--e-dur-base) var(--e-ease-out);
			pointer-events: none;

			&--on {
				opacity: 1;
			}
		}

		&__title {
			display: flex;
			gap: var(--e-space-xs);
			align-items: baseline;
			font-size: var(--e-text-md);
			font-weight: var(--e-weight-semibold);
			color: var(--e-fg);
		}

		&__index {
			@include mono;

			font-size: var(--e-text-2xs);
			color: var(--e-accent);
		}

		&__body {
			font-size: var(--e-text-sm);
			color: var(--e-fg-muted);
		}

		&__controls {
			display: flex;
			flex-wrap: wrap;
			gap: var(--e-space-md);
			align-items: center;
		}

		&__toggle {
			display: inline-flex;
			min-width: 8.5rem;
		}

		&__dots {
			display: flex;
			gap: var(--e-space-2xs);
		}

		&__dot {
			@include focus-ring;

			width: 10px;
			height: 10px;
			background: var(--e-surface-3);
			border-radius: var(--e-radius-pill);
			transition: background var(--e-dur-fast) var(--e-ease-out);

			&:hover {
				background: var(--e-border-strong);
			}

			&--on {
				background: var(--e-accent);
			}
		}
	}
</style>
