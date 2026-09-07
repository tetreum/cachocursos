<script lang="ts">
	import { untrack } from 'svelte';
	import {
		tokenizeWords,
		trainNgram,
		nextProbabilities,
		type NgramModel
	} from '../../models/ngram';
	import { traceSampling } from '../../models/sampling';
	import { mulberry32, sampleIndex } from '$utils/rng';
	import type { ChallengeResult } from '$content/types';
	import Slider from '$ui/Slider.svelte';
	import ProbabilityBars, { type ProbabilityItem } from '$ui/ProbabilityBars.svelte';
	import ScorePill from '$ui/ScorePill.svelte';
	import { createCourseTranslator } from '../../i18n';

	interface SamplingDeskProps {
		corpus: string;
		seedWord: string;
		length?: number;
		onsolve?: (result: ChallengeResult) => void;
	}

	let { corpus, seedWord, length = 40, onsolve }: SamplingDeskProps = $props();

	const t = createCourseTranslator();

	const SAMPLE_SEED = 90210;
	const TARGET_DIVERSITY_LOW = 0.62;
	const TARGET_DIVERSITY_HIGH = 0.76;
	const TARGET_COHERENCE_LOW = 0.16;
	const PLOT_SIZE = 200;
	const BAR_COUNT = 8;

	const model: NgramModel = untrack(() => trainNgram(tokenizeWords(corpus), 2, 0.02));
	const seedId = untrack(() => model.index.get(seedWord) ?? 0);

	let temperature = $state(1);
	let topK = $state(model.vocabulary.length);
	let topP = $state(1);
	let announced = $state(false);

	const generation = $derived.by(() => {
		const random = mulberry32(SAMPLE_SEED);
		const ids: number[] = [];
		let currentId = seedId;
		let coherenceTotal = 0;

		for (let step = 0; step < length; step += 1) {
			const base = nextProbabilities(model, [model.vocabulary[currentId]]);
			const logits = new Float64Array(base.length);
			for (let id = 0; id < base.length; id += 1) logits[id] = Math.log(base[id]);

			const trace = traceSampling(logits, {
				temperature,
				topK: Math.round(topK),
				topP
			});
			const chosen = sampleIndex(trace.final, random);
			coherenceTotal += base[chosen];
			ids.push(chosen);
			currentId = chosen;
		}

		const unique = new Set(ids).size;
		return {
			ids,
			words: ids.map((id) => model.vocabulary[id]),
			diversity: unique / ids.length,
			coherence: coherenceTotal / ids.length
		};
	});

	const currentTrace = $derived.by(() => {
		const base = nextProbabilities(model, [seedWord]);
		const logits = new Float64Array(base.length);
		for (let id = 0; id < base.length; id += 1) logits[id] = Math.log(base[id]);
		return traceSampling(logits, { temperature, topK: Math.round(topK), topP });
	});

	const bars = $derived.by((): ProbabilityItem[] => {
		const order = Array.from(currentTrace.tempered.keys()).sort(
			(left, right) => currentTrace.tempered[right] - currentTrace.tempered[left]
		);
		return order.slice(0, BAR_COUNT).map((id) => ({
			label: model.vocabulary[id],
			probability: currentTrace.tempered[id],
			tone: currentTrace.keptByTopP[id] === 1 ? ('model' as const) : ('muted' as const),
			note: currentTrace.keptByTopP[id] === 1 ? undefined : t('DESK_FILTERED_OUT')
		}));
	});

	const inTarget = $derived(
		generation.diversity >= TARGET_DIVERSITY_LOW &&
			generation.diversity <= TARGET_DIVERSITY_HIGH &&
			generation.coherence >= TARGET_COHERENCE_LOW
	);

	const dotX = $derived(generation.diversity * PLOT_SIZE);
	const dotY = $derived(PLOT_SIZE - Math.min(1, generation.coherence * 2) * PLOT_SIZE);

	$effect(() => {
		if (!inTarget || announced) return;
		announced = true;
		onsolve?.({
			score: Math.round(generation.coherence * 1000),
			detail: {
				temperature: temperature.toFixed(2),
				topK: Math.round(topK),
				topP: topP.toFixed(2),
				diversidad: generation.diversity.toFixed(2)
			}
		});
	});
</script>

<div class="e-desk">
	<div class="e-desk__controls">
		<Slider
			bind:value={temperature}
			min={0.1}
			max={2}
			step={0.05}
			label={t('DESK_TEMPERATURE')}
			hint={t('DESK_TEMPERATURE_HINT')}
		/>
		<Slider
			bind:value={topK}
			min={1}
			max={model.vocabulary.length}
			step={1}
			label="Top-k"
			format={(value) => String(Math.round(value))}
			hint={t('DESK_TOP_K_HINT')}
		/>
		<Slider
			bind:value={topP}
			min={0.1}
			max={1}
			step={0.01}
			label="Top-p"
			hint={t('DESK_TOP_P_HINT')}
		/>
	</div>

	<div class="e-desk__grid">
		<div class="e-desk__panel">
			<p class="e-desk__title">{t('DESK_DISTRIBUTION', { word: seedWord })}</p>
			<ProbabilityBars items={bars} limit={BAR_COUNT} />
			<p class="e-desk__hint">
				{t('DESK_ALIVE', {
					alive: currentTrace.nucleusSize,
					total: model.vocabulary.length
				})}
			</p>
		</div>

		<div class="e-desk__panel">
			<p class="e-desk__title">{t('DESK_TRADEOFF')}</p>
			<svg
				class="e-desk__plot"
				viewBox="0 0 {PLOT_SIZE} {PLOT_SIZE}"
				role="img"
				aria-label={t('DESK_TARGET_ALT')}
			>
				<rect
					class="e-desk__target"
					x={TARGET_DIVERSITY_LOW * PLOT_SIZE}
					y={0}
					width={(TARGET_DIVERSITY_HIGH - TARGET_DIVERSITY_LOW) * PLOT_SIZE}
					height={PLOT_SIZE - TARGET_COHERENCE_LOW * 2 * PLOT_SIZE}
				/>
				<circle class="e-desk__dot" class:e-desk__dot--hit={inTarget} cx={dotX} cy={dotY} r="6" />
			</svg>
			<div class="e-desk__axes">
				<span>{t('DESK_AXIS_X')}</span>
				<span>{t('DESK_AXIS_Y')}</span>
			</div>
		</div>
	</div>

	<div class="e-desk__scores">
		<ScorePill
			label={t('DESK_DIVERSITY')}
			value={generation.diversity.toFixed(2)}
			tone={inTarget ? 'success' : 'neutral'}
		/>
		<ScorePill
			label={t('DESK_COHERENCE')}
			value={generation.coherence.toFixed(3)}
			tone={inTarget ? 'success' : 'neutral'}
		/>
	</div>

	<div class="e-desk__output" class:e-desk__output--hit={inTarget}>
		<p class="e-desk__title">{t('DESK_OUTPUT')}</p>
		<p class="e-desk__text">{seedWord} {generation.words.join(' ')}</p>
	</div>
</div>

<style lang="scss">
	.e-desk {
		display: flex;
		flex-direction: column;
		gap: var(--e-space-md);

		&__controls {
			display: grid;
			grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
			gap: var(--e-space-md);
			padding: var(--e-space-md);
			background: var(--e-bg-subtle);
			border: var(--e-border-width) solid var(--e-border);
			border-radius: var(--e-radius-md);
		}

		&__grid {
			display: grid;
			grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr));
			gap: var(--e-space-md);
		}

		&__panel {
			display: flex;
			flex-direction: column;
			gap: var(--e-space-xs);
			padding: var(--e-space-md);
			background: var(--e-surface);
			border: var(--e-border-width) solid var(--e-border);
			border-radius: var(--e-radius-md);
		}

		&__title {
			font-size: var(--e-text-2xs);
			font-weight: var(--e-weight-bold);
			color: var(--e-fg-dim);
			letter-spacing: var(--e-tracking-wide);
			text-transform: uppercase;
		}

		&__hint {
			@include mono;

			font-size: var(--e-text-2xs);
			color: var(--e-fg-dim);
		}

		&__plot {
			width: 100%;
			height: auto;
			background: var(--e-bg-subtle);
			border-radius: var(--e-radius-sm);
		}

		&__target {
			fill: color-mix(in oklab, var(--e-success) 18%, transparent);
			stroke: var(--e-success);
			stroke-dasharray: 4 3;
			stroke-width: 1;
		}

		&__dot {
			fill: var(--e-you);
			transition:
				cx var(--e-dur-base) var(--e-ease-out),
				cy var(--e-dur-base) var(--e-ease-out);

			&--hit {
				fill: var(--e-success);
			}
		}

		&__axes {
			display: flex;
			justify-content: space-between;
			font-size: var(--e-text-2xs);
			color: var(--e-fg-dim);
		}

		&__scores {
			display: flex;
			flex-wrap: wrap;
			gap: var(--e-space-xs);
		}

		&__output {
			display: flex;
			flex-direction: column;
			gap: var(--e-space-xs);
			padding: var(--e-space-md);
			background: var(--e-bg-subtle);
			border: var(--e-border-width) solid var(--e-border);
			border-radius: var(--e-radius-md);

			&--hit {
				border-color: var(--e-success);
			}
		}

		&__text {
			@include mono;

			font-size: var(--e-text-sm);
			line-height: var(--e-leading-snug);
			color: var(--e-fg);
		}
	}
</style>
