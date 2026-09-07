<script lang="ts" module>
	interface SchemeStage {
		id: string;
		title: string;
		body: string;
	}
</script>

<script lang="ts">
	import { untrack } from 'svelte';
	import { Tween, prefersReducedMotion } from 'svelte/motion';
	import { cubicOut } from 'svelte/easing';
	import { hash32 } from '$utils/rng';
	import { softmax } from '../../models/sampling';
	import { greenMask, biasLogits, DEFAULT_WATERMARK } from '../../models/watermark';
	import Button from '$ui/Button.svelte';
	import type { SchemeExampleData } from '../../data/types';
	import { createCourseTranslator } from '../../i18n';

	interface SchemeExplainerProps {
		example: SchemeExampleData;
	}

	let { example }: SchemeExplainerProps = $props();

	const t = createCourseTranslator();

	/** El recorrido se calcula una vez: el ejemplo no cambia mientras el capítulo está abierto. */
	const VOCABULARY = untrack(() => example.vocabulary);
	const LOGITS = untrack(() => example.logits);
	/** El id de un token es su posición en este vocabulario de juguete. */
	const FIRST_PREVIOUS = untrack(() => ({
		word: example.vocabulary[example.previousIndex],
		id: example.previousIndex
	}));
	const GAMMA = 0.3;
	const DELTA = 2.5;
	const CONFIG = { ...DEFAULT_WATERMARK, gamma: GAMMA, delta: DELTA };
	const PERCENT = 100;
	const BAR_UNIT = 26;
	const BAR_OFFSET = 1.4;
	const BIAS_DURATION = 900;
	const LAST_STAGE = 4;

	const firstMask = untrack(() => greenMask(FIRST_PREVIOUS.id, VOCABULARY.length, CONFIG));

	/** El token que gana con el sesgo puesto, que es el que se acaba escribiendo. */
	const chosenIndex = untrack(() =>
		argmax(Array.from(softmax(biasLogits(LOGITS, firstMask, DELTA))))
	);
	/** El que habría ganado sin el sesgo: el que δ le ha quitado el sitio. */
	const loserIndex = untrack(() => argmax(LOGITS));

	let stage = $state(0);

	const previous = $derived(
		stage >= LAST_STAGE ? { word: VOCABULARY[chosenIndex], id: chosenIndex } : FIRST_PREVIOUS
	);
	const seed = $derived(hash32(previous.id, CONFIG.key));
	const mask = $derived(greenMask(previous.id, VOCABULARY.length, CONFIG));
	const showLists = $derived(stage >= 1);
	const showBias = $derived(stage >= 2);

	const biasProgress = new Tween(0, { duration: BIAS_DURATION, easing: cubicOut });

	$effect(() => {
		biasProgress.set(showBias ? 1 : 0, {
			duration: prefersReducedMotion.current ? 0 : BIAS_DURATION
		});
	});

	const appliedDelta = $derived(DELTA * biasProgress.current);
	const biased = $derived(biasLogits(LOGITS, mask, appliedDelta));
	const probabilities = $derived(softmax(biased));
	const greenCount = $derived(mask.reduce((total, flag) => total + flag, 0));

	const nextMask = $derived(greenMask(chosenIndex, VOCABULARY.length, CONFIG));
	const greened = $derived(wordsWhere((index) => nextMask[index] === 1 && firstMask[index] !== 1));
	const reddened = $derived(wordsWhere((index) => nextMask[index] !== 1 && firstMask[index] === 1));

	function argmax(values: readonly number[]): number {
		let best = 0;
		for (let index = 1; index < values.length; index += 1) {
			if (values[index] > values[best]) best = index;
		}
		return best;
	}

	/** Las palabras que cumplen algo, ya entrecomilladas y unidas: «faro» y «noche». */
	function wordsWhere(predicate: (index: number) => boolean): string {
		return VOCABULARY.map((word, index) => ({ word, index }))
			.filter((entry) => predicate(entry.index))
			.map((entry) => t('SCHEME_WORD_QUOTED', { word: entry.word }))
			.join(t('SCHEME_WORD_LIST_JOIN'));
	}

	const STAGES: readonly SchemeStage[] = $derived([
		{ id: 'semilla', title: t('SCHEME_STAGE_1_TITLE'), body: t('SCHEME_STAGE_1_BODY') },
		{ id: 'listas', title: t('SCHEME_STAGE_2_TITLE'), body: t('SCHEME_STAGE_2_BODY') },
		{ id: 'sesgo', title: t('SCHEME_STAGE_3_TITLE'), body: t('SCHEME_STAGE_3_BODY') },
		{
			id: 'muestreo',
			title: t('SCHEME_STAGE_4_TITLE'),
			body: t('SCHEME_STAGE_4_BODY', { loser: VOCABULARY[loserIndex] })
		},
		{
			id: 'siguiente',
			title: t('SCHEME_STAGE_5_TITLE'),
			body: t('SCHEME_STAGE_5_BODY', {
				chosen: VOCABULARY[chosenIndex],
				greened,
				reddened
			})
		}
	]);

	function barWidth(value: number): number {
		return Math.max(2, (value + BAR_OFFSET) * BAR_UNIT);
	}

	const canGoBack = $derived(stage > 0);
	const canGoOn = $derived(stage < STAGES.length - 1);
</script>

<div class="e-scheme">
	<div class="e-scheme__seed" class:e-scheme__seed--changed={stage >= 4}>
		<div class="e-scheme__seed-step">
			<span class="e-scheme__seed-label">{t('SCHEME_PREVIOUS_TOKEN')}</span>
			<span class="e-scheme__seed-value">
				{t('SCHEME_PREVIOUS_VALUE', { word: previous.word, id: previous.id })}
			</span>
		</div>
		<span class="e-scheme__seed-arrow" aria-hidden="true">→</span>
		<div class="e-scheme__seed-step">
			<span class="e-scheme__seed-label">{t('SCHEME_HASH')}</span>
			<span class="e-scheme__seed-value">{seed}</span>
		</div>
		<span class="e-scheme__seed-arrow" aria-hidden="true">→</span>
		<div class="e-scheme__seed-step">
			<span class="e-scheme__seed-label">{t('SCHEME_SPLIT')}</span>
			<span class="e-scheme__seed-value">
				{#if showLists}
					{t('SCHEME_SPLIT_VALUE', {
						green: greenCount,
						red: VOCABULARY.length - greenCount
					})}
				{:else}
					{t('SCHEME_SPLIT_PENDING')}
				{/if}
			</span>
		</div>
	</div>

	<ul class="e-scheme__rows">
		{#each VOCABULARY as word, index (word)}
			{@const isGreen = mask[index] === 1}
			<li
				class="e-scheme__row"
				class:e-scheme__row--green={showLists && isGreen}
				class:e-scheme__row--red={showLists && !isGreen}
				class:e-scheme__row--chosen={stage >= 3 && index === chosenIndex}
			>
				<span class="e-scheme__word">{word}</span>

				<span class="e-scheme__track">
					<span class="e-scheme__bar" style:width="{barWidth(LOGITS[index])}px"></span>
					{#if isGreen && appliedDelta > 0.01}
						<span
							class="e-scheme__bonus"
							style:width="{appliedDelta * BAR_UNIT}px"
							title={t('SCHEME_BONUS_TITLE', { delta: DELTA })}
						>
							{#if appliedDelta > DELTA * 0.55}+δ{/if}
						</span>
					{/if}
				</span>

				<span class="e-scheme__number">
					{#if stage >= 3}
						{(probabilities[index] * PERCENT).toFixed(0)}%
					{:else}
						{biased[index].toFixed(1)}
					{/if}
				</span>
			</li>
		{/each}
	</ul>

	<p class="e-scheme__legend">
		{t('SCHEME_LEGEND', { count: VOCABULARY.length, gamma: GAMMA, delta: DELTA })}
	</p>

	<div class="e-scheme__caption">
		{#each STAGES as item, index (item.id)}
			<div
				class="e-scheme__slide"
				class:e-scheme__slide--on={index === stage}
				aria-hidden={index !== stage}
			>
				<p class="e-scheme__title">{item.title}</p>
				<p class="e-scheme__body">{item.body}</p>
			</div>
		{/each}
	</div>

	<div class="e-scheme__controls">
		<Button disabled={!canGoBack} onclick={() => (stage -= 1)}>{t('SCHEME_PREVIOUS')}</Button>
		<Button variant="primary" disabled={!canGoOn} onclick={() => (stage += 1)}>
			{t('COMMON_NEXT')}
		</Button>
		<div class="e-scheme__dots">
			{#each STAGES as item, index (item.id)}
				<button
					class="e-scheme__dot"
					class:e-scheme__dot--on={index === stage}
					type="button"
					aria-label={item.title}
					aria-current={index === stage}
					onclick={() => (stage = index)}
				></button>
			{/each}
		</div>
	</div>
</div>

<style lang="scss">
	.e-scheme {
		display: flex;
		flex-direction: column;
		gap: var(--e-space-md);
		padding: var(--e-space-md);
		background: var(--e-bg-subtle);
		border: var(--e-border-width) solid var(--e-border);
		border-radius: var(--e-radius-md);

		&__seed {
			display: flex;
			flex-wrap: wrap;
			gap: var(--e-space-sm);
			align-items: center;
			padding: var(--e-space-sm) var(--e-space-md);
			background: var(--e-surface);
			border: var(--e-border-width) solid var(--e-border);
			border-radius: var(--e-radius-sm);
			transition: border-color var(--e-dur-base) var(--e-ease-out);

			&--changed {
				border-color: var(--e-warn);
			}
		}

		&__seed-step {
			display: flex;
			flex-direction: column;
			gap: 1px;
		}

		&__seed-label {
			font-size: var(--e-text-2xs);
			color: var(--e-fg-dim);
			letter-spacing: var(--e-tracking-wide);
			text-transform: uppercase;
		}

		&__seed-value {
			@include mono;

			font-size: var(--e-text-sm);
			color: var(--e-fg);
		}

		&__seed-arrow {
			color: var(--e-fg-dim);
		}

		&__rows {
			display: flex;
			flex-direction: column;
			gap: 2px;
			padding: 0;
			margin: 0;
			list-style: none;
		}

		&__row {
			display: grid;
			grid-template-columns: 5rem 1fr 3.5rem;
			gap: var(--e-space-sm);
			align-items: center;
			padding: var(--e-space-3xs) var(--e-space-2xs);
			border: var(--e-border-width) solid transparent;
			border-radius: var(--e-radius-xs);
			transition:
				background var(--e-dur-base) var(--e-ease-out),
				border-color var(--e-dur-base) var(--e-ease-out);

			&--green {
				background: color-mix(in oklab, var(--e-green-list) 12%, transparent);
			}

			&--red {
				background: color-mix(in oklab, var(--e-red-list) 8%, transparent);
			}

			&--chosen {
				border-color: var(--e-accent);
			}
		}

		&__word {
			@include mono;

			font-size: var(--e-text-sm);
			color: var(--e-fg);
		}

		&__track {
			display: flex;
			gap: 2px;
			align-items: center;
			height: 14px;
		}

		&__bar {
			height: 100%;
			background: var(--e-surface-3);
			border-radius: var(--e-radius-xs);
			transition: width var(--e-dur-base) var(--e-ease-out);
		}

		&__row--green &__bar {
			background: color-mix(in oklab, var(--e-green-list) 55%, var(--e-surface-3));
		}

		&__bonus {
			@include mono;

			display: flex;
			align-items: center;
			justify-content: center;
			height: 100%;
			overflow: hidden;
			font-size: var(--e-text-2xs);
			font-weight: var(--e-weight-bold);
			color: var(--e-fg-inverse);
			background: var(--e-green-list);
			border-radius: var(--e-radius-xs);
		}

		&__number {
			@include mono;

			font-size: var(--e-text-xs);
			color: var(--e-fg-muted);
			text-align: right;
			font-variant-numeric: tabular-nums;
		}

		&__legend {
			font-size: var(--e-text-2xs);
			color: var(--e-fg-dim);
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
			font-size: var(--e-text-md);
			font-weight: var(--e-weight-semibold);
			color: var(--e-fg);
		}

		&__body {
			font-size: var(--e-text-sm);
			color: var(--e-fg-muted);
		}

		&__controls {
			display: flex;
			flex-wrap: wrap;
			gap: var(--e-space-sm);
			align-items: center;
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
