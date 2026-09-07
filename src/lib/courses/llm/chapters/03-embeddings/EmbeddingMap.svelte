<script lang="ts">
	import { untrack } from 'svelte';
	import {
		buildTable,
		analogy,
		oddOneOut,
		coordinates,
		nearest,
		vector,
		add,
		subtract,
		type WordDefinition,
		type CuratedAnalogy,
		type OddOneOutPuzzle
	} from '../../models/embeddings';
	import { mulberry32, shuffled } from '$utils/rng';
	import type { ChallengeResult } from '$content/types';
	import Button from '$ui/Button.svelte';
	import ScorePill from '$ui/ScorePill.svelte';
	import { createCourseTranslator } from '../../i18n';

	interface EmbeddingMapProps {
		axes: readonly string[];
		words: readonly WordDefinition[];
		analogies: readonly CuratedAnalogy[];
		oddOneOuts: readonly OddOneOutPuzzle[];
		requiredHits: number;
		onsolve?: (result: ChallengeResult) => void;
	}

	let { axes, words, analogies, oddOneOuts, requiredHits, onsolve }: EmbeddingMapProps = $props();

	const t = createCourseTranslator();

	const VIEW = 640;
	const INTRUDER_SEED = 606060;
	const ANALOGY_SEED = 707070;
	const PADDING = 28;
	const DOT_RADIUS = 3.5;
	const HUE_COUNT = 8;

	/** Un tono por familia, por orden de aparición: sirva el vocabulario que sirva. */
	const clusterHues = untrack(() => {
		const hues: Record<string, number> = {};
		let next = 0;
		for (const word of words) {
			if (word.cluster in hues) continue;
			hues[word.cluster] = next % HUE_COUNT;
			next += 1;
		}
		return hues;
	});

	const table = untrack(() => buildTable(words, axes));

	type RoundKind = 'analogia' | 'intruso';
	interface Round {
		kind: RoundKind;
		prompt: string;
		highlight: readonly string[];
		options: readonly string[];
		answer: string;
		explanation: string;
	}

	const rounds = untrack((): Round[] => {
		const analogyRounds: Round[] = analogies.slice(0, 4).map((entry, index) => {
			const neighbours = analogy(table, entry.from, entry.to, entry.query, 4);
			const options = neighbours.map((neighbour) => neighbour.word);
			if (!options.includes(entry.expected)) options[options.length - 1] = entry.expected;
			return {
				kind: 'analogia',
				prompt: `${entry.to} − ${entry.from} + ${entry.query} = ?`,
				highlight: [entry.from, entry.to, entry.query],
				options: shuffled(options, mulberry32(ANALOGY_SEED + index)),
				answer: entry.expected,
				explanation: entry.explanation
			};
		});

		const intruderRounds: Round[] = oddOneOuts.slice(0, 2).map((puzzle, index) => {
			const scrambled: string[] = shuffled([...puzzle.words], mulberry32(INTRUDER_SEED + index));
			return {
				kind: 'intruso',
				prompt: t('MAP_INTRUDER_PROMPT'),
				highlight: scrambled,
				options: scrambled,
				answer: oddOneOut(table, puzzle.words) ?? puzzle.expected,
				explanation: puzzle.explanation
			};
		});

		return [...analogyRounds, ...intruderRounds];
	});

	let roundIndex = $state(0);
	let choice = $state<string | null>(null);
	let hits = $state(0);
	let announced = $state(false);
	let hovered = $state<string | null>(null);

	const round = $derived(rounds[Math.min(roundIndex, rounds.length - 1)]);
	const finished = $derived(roundIndex >= rounds.length);
	const answered = $derived(choice !== null);
	const correct = $derived(choice === round.answer);

	function toScreen(point: readonly [number, number]): [number, number] {
		const usable = VIEW - PADDING * 2;
		return [PADDING + ((point[0] + 1) / 2) * usable, PADDING + ((1 - point[1]) / 2) * usable];
	}

	const dots = $derived(
		table.words.map((word, index) => {
			const point = toScreen([table.projection[index * 2], table.projection[index * 2 + 1]]);
			return { word, cluster: table.clusters[index], x: point[0], y: point[1] };
		})
	);

	const highlighted = $derived(new Set(round.highlight));

	const arrow = $derived.by(() => {
		if (round.kind !== 'analogia') return null;
		const [from, to, query] = round.highlight;
		const fromPoint = coordinates(table, from);
		const toPoint = coordinates(table, to);
		const queryPoint = coordinates(table, query);
		if (!fromPoint || !toPoint || !queryPoint) return null;

		const fromVector = vector(table, from);
		const toVector = vector(table, to);
		const queryVector = vector(table, query);
		if (!fromVector || !toVector || !queryVector) return null;

		const targetWord = nearest(table, add(subtract(toVector, fromVector), queryVector), 1, [
			from,
			to,
			query
		])[0];
		const targetPoint = coordinates(table, targetWord.word);

		return {
			base: [toScreen(fromPoint), toScreen(toPoint)] as const,
			ghost: [
				toScreen(queryPoint),
				targetPoint ? toScreen(targetPoint) : toScreen(queryPoint)
			] as const
		};
	});

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
		if (hits >= requiredHits) {
			onsolve?.({ score: hits, detail: { hits: hits, rounds: rounds.length } });
		}
	});
</script>

<div class="e-map">
	<div class="e-map__scores">
		<ScorePill label={t('MAP_SCORE_WORDS')} value={String(table.words.length)} />
		<ScorePill label={t('MAP_SCORE_DIMENSIONS')} value={String(table.dimension)} />
		<ScorePill
			label={t('MAP_SCORE_HITS')}
			value="{hits} / {requiredHits}"
			tone={hits >= requiredHits ? 'success' : 'accent'}
		/>
	</div>

	<svg class="e-map__plot" viewBox="0 0 {VIEW} {VIEW}" role="img" aria-label={t('MAP_ALT')}>
		{#if arrow}
			<defs>
				<marker id="e-map-head" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
					<path class="e-map__head" d="M0,0 L6,3 L0,6 z" />
				</marker>
			</defs>
			<line
				class="e-map__arrow"
				x1={arrow.base[0][0]}
				y1={arrow.base[0][1]}
				x2={arrow.base[1][0]}
				y2={arrow.base[1][1]}
				marker-end="url(#e-map-head)"
			/>
			{#if answered}
				<line
					class="e-map__arrow e-map__arrow--ghost"
					x1={arrow.ghost[0][0]}
					y1={arrow.ghost[0][1]}
					x2={arrow.ghost[1][0]}
					y2={arrow.ghost[1][1]}
					marker-end="url(#e-map-head)"
				/>
			{/if}
		{/if}

		{#each dots as dot (dot.word)}
			{@const isKey = highlighted.has(dot.word)}
			{@const isAnswer = answered && dot.word === round.answer}
			<g
				class="e-map__node"
				class:e-map__node--key={isKey}
				class:e-map__node--answer={isAnswer}
				role="listitem"
				onmouseenter={() => (hovered = dot.word)}
				onmouseleave={() => (hovered = null)}
			>
				<circle
					cx={dot.x}
					cy={dot.y}
					r={isKey || isAnswer ? DOT_RADIUS * 1.8 : DOT_RADIUS}
					style:fill="var(--e-tok-{clusterHues[dot.cluster] ?? 0})"
				/>
				{#if isKey || isAnswer || hovered === dot.word}
					<text class="e-map__label" x={dot.x + 7} y={dot.y + 3}>{dot.word}</text>
				{/if}
			</g>
		{/each}
	</svg>

	{#if finished}
		<div class="e-map__panel">
			<p class="e-map__title">
				{hits >= requiredHits ? t('MAP_WON') : t('MAP_ALMOST')}
			</p>
			<p class="e-map__body">
				{t('MAP_RESULT_BODY', { hits, total: rounds.length })}
				{#if hits < requiredHits}
					{t('MAP_RESULT_NEEDED', { required: requiredHits })}
				{/if}
			</p>
			<Button onclick={restart}>{t('MAP_RETRY')}</Button>
		</div>
	{:else}
		<div class="e-map__panel">
			<p class="e-map__kind">
				{round.kind === 'analogia' ? t('MAP_KIND_ANALOGY') : t('MAP_KIND_INTRUDER')}
			</p>
			<p class="e-map__prompt">{round.prompt}</p>

			<div class="e-map__options">
				{#each round.options as option (option)}
					<button
						class="e-map__option"
						class:e-map__option--right={answered && option === round.answer}
						class:e-map__option--wrong={answered && option === choice && !correct}
						type="button"
						disabled={answered}
						onclick={() => pick(option)}
					>
						{option}
					</button>
				{/each}
			</div>

			{#if answered}
				<div class="e-map__feedback">
					<p class="e-map__verdict" class:e-map__verdict--right={correct}>
						{correct ? t('GUESS_RIGHT') : t('MAP_ANSWER_WAS', { answer: round.answer })}
					</p>
					<p class="e-map__body">{round.explanation}</p>
					<Button variant="primary" onclick={advance}>
						{roundIndex === rounds.length - 1 ? t('GUESS_SEE_RESULT') : t('COMMON_NEXT')}
					</Button>
				</div>
			{/if}
		</div>
	{/if}
</div>

<style lang="scss">
	.e-map {
		display: flex;
		flex-direction: column;
		gap: var(--e-space-md);

		&__scores {
			display: flex;
			flex-wrap: wrap;
			gap: var(--e-space-xs);
		}

		&__plot {
			width: 100%;
			height: auto;
			background: var(--e-bg-subtle);
			border: var(--e-border-width) solid var(--e-border);
			border-radius: var(--e-radius-md);
		}

		&__node {
			circle {
				opacity: 0.35;
				transition: opacity var(--e-dur-fast) var(--e-ease-out);
			}

			&--key circle,
			&--answer circle {
				opacity: 1;
			}

			&:hover circle {
				opacity: 1;
			}
		}

		&__label {
			font-family: var(--e-font-mono);
			font-size: 11px;
			fill: var(--e-fg);
		}

		&__arrow {
			stroke: var(--e-accent);
			stroke-width: 2;

			&--ghost {
				stroke: var(--e-success);
				stroke-dasharray: 5 4;
			}
		}

		&__head {
			fill: var(--e-accent);
		}

		&__panel {
			display: flex;
			flex-direction: column;
			gap: var(--e-space-sm);
			align-items: flex-start;
			padding: var(--e-space-md);
			background: var(--e-bg-subtle);
			border: var(--e-border-width) solid var(--e-border);
			border-radius: var(--e-radius-md);
		}

		&__kind {
			font-size: var(--e-text-2xs);
			font-weight: var(--e-weight-bold);
			color: var(--e-accent);
			letter-spacing: var(--e-tracking-wide);
			text-transform: uppercase;
		}

		&__prompt {
			@include mono;

			font-size: var(--e-text-xl);
			color: var(--e-fg);
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

			&--right {
				color: var(--e-success);
			}
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
