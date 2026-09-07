<script lang="ts">
	import { untrack } from 'svelte';
	import { mulberry32 } from '$utils/rng';
	import type { ChallengeResult } from '$content/types';
	import Slider from '$ui/Slider.svelte';
	import ScorePill from '$ui/ScorePill.svelte';
	import TokenChip from '../../ui/TokenChip.svelte';
	import { createEngine, generate, detect, meanBaseProbability, DEFAULT_WATERMARK } from './engine';
	import { createCourseTranslator } from '../../i18n';

	interface GeneratorProps {
		corpus: string;
		seedWord: string;
		targetZ: number;
		onsolve?: (result: ChallengeResult) => void;
	}

	let { corpus, seedWord, targetZ, onsolve }: GeneratorProps = $props();

	const t = createCourseTranslator();

	const LENGTH = 60;
	const PERCENT = 100;
	const RARE_P_VALUE = 1e-6;
	const SEED = 4242;

	const engine = untrack(() => createEngine({ corpus, seedWord }));

	let delta = $state(0);
	let gamma = $state(DEFAULT_WATERMARK.gamma);
	let announced = $state(false);

	const config = $derived({ ...DEFAULT_WATERMARK, delta, gamma });
	const ids = $derived(generate(engine, config, LENGTH, mulberry32(SEED)));
	const result = $derived(detect(ids, engine.vocabSize, config));
	const words = $derived(engine.words(ids));
	const quality = $derived(meanBaseProbability(engine, ids));
	const detected = $derived(result.z >= targetZ);

	$effect(() => {
		if (!detected || announced) return;
		announced = true;
		onsolve?.({
			score: Math.round(result.z * 10),
			detail: { z: result.z.toFixed(2), delta: delta.toFixed(2), gamma: gamma.toFixed(2) }
		});
	});
</script>

<div class="e-generator">
	<div class="e-generator__controls">
		<Slider
			bind:value={delta}
			min={0}
			max={6}
			step={0.1}
			label={t('GENERATOR_DELTA')}
			hint={t('GENERATOR_DELTA_HINT')}
		/>
		<Slider
			bind:value={gamma}
			min={0.1}
			max={0.75}
			step={0.05}
			label={t('GENERATOR_GAMMA')}
			hint={t('GENERATOR_GAMMA_HINT')}
		/>
	</div>

	<div class="e-generator__scores">
		<ScorePill
			label={t('GENERATOR_Z')}
			value={result.z.toFixed(2)}
			tone={detected ? 'success' : 'accent'}
		/>
		<ScorePill label={t('GENERATOR_GREEN')} value="{result.greenCount} / {result.total}" />
		<ScorePill label={t('GENERATOR_EXPECTED')} value={result.expected.toFixed(1)} />
		<ScorePill
			label={t('GENERATOR_QUALITY')}
			value={quality.toFixed(3)}
			tone={quality < 0.08 ? 'danger' : 'neutral'}
		/>
	</div>

	<div class="e-generator__text">
		{#each words as word, index (index)}
			<TokenChip text={word} tone={result.perToken[index] === 1 ? 'green' : 'red'} />
		{/each}
	</div>

	<p class="e-generator__reading">
		{#if delta === 0}
			{t('GENERATOR_NO_BIAS', { gamma: Math.round(gamma * PERCENT) })}
		{:else if detected}
			{t('GENERATOR_DETECTED', {
				delta: delta.toFixed(1),
				probability:
					result.pValue < RARE_P_VALUE
						? t('GENERATOR_ONE_IN_A_MILLION')
						: result.pValue.toExponential(1)
			})}
		{:else}
			{t('GENERATOR_WEAK', { target: targetZ })}
		{/if}
	</p>
</div>

<style lang="scss">
	.e-generator {
		display: flex;
		flex-direction: column;
		gap: var(--e-space-md);

		&__controls {
			display: grid;
			grid-template-columns: repeat(auto-fit, minmax(13rem, 1fr));
			gap: var(--e-space-md);
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

		&__text {
			display: flex;
			flex-wrap: wrap;
			gap: var(--e-space-3xs);
			padding: var(--e-space-md);
			background: var(--e-bg-subtle);
			border: var(--e-border-width) solid var(--e-border);
			border-radius: var(--e-radius-md);
		}

		&__reading {
			font-size: var(--e-text-sm);
			color: var(--e-fg-muted);
		}
	}
</style>
