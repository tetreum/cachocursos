<script lang="ts">
	import { untrack } from 'svelte';
	import type { ChallengeResult } from '$content/types';
	import Slider from '$ui/Slider.svelte';
	import ScorePill from '$ui/ScorePill.svelte';
	import Button from '$ui/Button.svelte';
	import { createEngine, buildDetectorPassages, zScoreOf, DETECTION_THRESHOLD } from './engine';
	import { normalCdf } from '../../models/watermark';
	import { getLocale } from '$i18n/locale';
	import { createCourseTranslator } from '../../i18n';

	interface DetectorProps {
		corpus: string;
		seedWord: string;
		requiredCorrect: number;
		onsolve?: (result: ChallengeResult) => void;
	}

	let { corpus, seedWord, requiredCorrect, onsolve }: DetectorProps = $props();

	const t = createCourseTranslator();
	const locale = getLocale();

	/** Un umbral tentadoramente bajo, para poder comparar el coste de bajarlo. */
	const LOW_THRESHOLD = 3;
	const PER_MILLION = 1_000_000;

	/** Cuántos textos humanos de cada millón cruzarían ese umbral por puro azar. */
	function falsePositivesPerMillion(threshold: number): string {
		return Math.round((1 - normalCdf(threshold)) * PER_MILLION).toLocaleString(locale);
	}

	const engine = untrack(() => createEngine({ corpus, seedWord }));
	const passages = untrack(() => buildDetectorPassages(engine));
	const scored = untrack(() =>
		passages.map((passage) => ({
			...passage,
			text: engine.words(passage.ids).join(' '),
			z: zScoreOf(engine, passage.ids)
		}))
	);

	let threshold = $state(DETECTION_THRESHOLD);
	let verdicts = $state<Record<string, boolean | undefined>>({});
	let checked = $state(false);
	let announced = $state(false);

	const answered = $derived(Object.values(verdicts).filter((value) => value !== undefined).length);
	const allAnswered = $derived(answered === scored.length);

	const correctCount = $derived(
		scored.filter((passage) => verdicts[passage.id] === passage.isWatermarked).length
	);

	const falsePositives = $derived(
		scored.filter((passage) => verdicts[passage.id] === true && !passage.isWatermarked).length
	);
	const falseNegatives = $derived(
		scored.filter((passage) => verdicts[passage.id] === false && passage.isWatermarked).length
	);

	function mark(id: string, isWatermarked: boolean): void {
		if (checked) return;
		verdicts = { ...verdicts, [id]: isWatermarked };
	}

	function check(): void {
		if (!allAnswered) return;
		checked = true;
	}

	function restart(): void {
		verdicts = {};
		checked = false;
		announced = false;
	}

	$effect(() => {
		if (!checked || announced) return;
		announced = true;
		if (correctCount >= requiredCorrect) {
			onsolve?.({
				score: correctCount,
				detail: {
					hits: correctCount,
					total: scored.length,
					falsePositives: falsePositives,
					threshold: threshold.toFixed(1)
				}
			});
		}
	});
</script>

<div class="e-detector">
	<div class="e-detector__controls">
		<Slider
			bind:value={threshold}
			min={1}
			max={8}
			step={0.5}
			label={t('DETECTOR_THRESHOLD')}
			hint={t('DETECTOR_THRESHOLD_HINT')}
		/>
		<div class="e-detector__scores">
			<ScorePill label={t('DETECTOR_ANSWERED')} value="{answered} / {scored.length}" />
			{#if checked}
				<ScorePill
					label={t('DETECTOR_HITS')}
					value="{correctCount} / {scored.length}"
					tone={correctCount >= requiredCorrect ? 'success' : 'danger'}
				/>
				<ScorePill
					label={t('DETECTOR_FALSE_POSITIVES')}
					value={String(falsePositives)}
					tone={falsePositives > 0 ? 'danger' : 'success'}
				/>
				<ScorePill
					label={t('DETECTOR_FALSE_NEGATIVES')}
					value={String(falseNegatives)}
					tone={falseNegatives > 0 ? 'warn' : 'success'}
				/>
			{/if}
		</div>
	</div>

	<ul class="e-detector__list">
		{#each scored as passage (passage.id)}
			{@const verdict = verdicts[passage.id]}
			{@const right = checked && verdict === passage.isWatermarked}
			<li
				class="e-detector__item"
				class:e-detector__item--right={checked && right}
				class:e-detector__item--wrong={checked && !right}
			>
				<div class="e-detector__head">
					<span class="e-detector__name">{t('DETECTOR_PASSAGE', { number: passage.number })}</span>
					<span class="e-detector__z" class:e-detector__z--over={passage.z >= threshold}>
						z = {passage.z.toFixed(2)}
					</span>
				</div>

				<p class="e-detector__text">{passage.text}</p>

				<div class="e-detector__actions">
					<button
						class="e-detector__vote"
						class:e-detector__vote--on={verdict === true}
						type="button"
						disabled={checked}
						onclick={() => mark(passage.id, true)}
					>
						{t('DETECTOR_VOTE_MARKED')}
					</button>
					<button
						class="e-detector__vote"
						class:e-detector__vote--on={verdict === false}
						type="button"
						disabled={checked}
						onclick={() => mark(passage.id, false)}
					>
						{t('DETECTOR_VOTE_CLEAN')}
					</button>

					{#if checked}
						<span class="e-detector__truth">
							{#if passage.origin === 'human'}
								{t('DETECTOR_TRUTH_HUMAN')}
							{:else if passage.origin === 'unmarked'}
								{t('DETECTOR_TRUTH_UNMARKED')}
							{:else if passage.origin === 'edited'}
								{t('DETECTOR_TRUTH_EDITED')}
							{:else}
								{t('DETECTOR_TRUTH_MARKED')}
							{/if}
						</span>
					{/if}
				</div>
			</li>
		{/each}
	</ul>

	{#if checked}
		<div class="e-detector__summary">
			<p class="e-detector__summary-title">
				{correctCount >= requiredCorrect ? t('DETECTOR_PASSED') : t('DETECTOR_FAILED')}
			</p>
			<p class="e-detector__summary-body">
				{#if falsePositives > 0}
					{t('DETECTOR_FALSE_POSITIVE_BODY', { count: falsePositives })}
				{:else}
					{t('DETECTOR_CLEAN_BODY', { count: scored.length, low: LOW_THRESHOLD })}
				{/if}
			</p>
			<p class="e-detector__summary-body">
				{t('DETECTOR_SCALE_HEAD', { count: scored.length, low: LOW_THRESHOLD })}
				<strong>
					{t('DETECTOR_SCALE_LOW', { count: falsePositivesPerMillion(LOW_THRESHOLD) })}
				</strong>
				{t('DETECTOR_SCALE_MIDDLE', { high: DETECTION_THRESHOLD })}
				<strong>{falsePositivesPerMillion(DETECTION_THRESHOLD)}</strong>{t('DETECTOR_SCALE_TAIL', {
					high: DETECTION_THRESHOLD
				})}
			</p>
			<Button onclick={restart}>{t('MAP_RETRY')}</Button>
		</div>
	{:else}
		<Button variant="primary" disabled={!allAnswered} onclick={check}>
			{t('DETECTOR_CHECK')}
		</Button>
	{/if}
</div>

<style lang="scss">
	.e-detector {
		display: flex;
		flex-direction: column;
		gap: var(--e-space-md);

		&__controls {
			display: flex;
			flex-direction: column;
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

		&__list {
			display: flex;
			flex-direction: column;
			gap: var(--e-space-sm);
			padding: 0;
			margin: 0;
			list-style: none;
		}

		&__item {
			display: flex;
			flex-direction: column;
			gap: var(--e-space-xs);
			padding: var(--e-space-md);
			background: var(--e-surface);
			border: var(--e-border-width) solid var(--e-border);
			border-radius: var(--e-radius-md);

			&--right {
				border-color: var(--e-success);
			}

			&--wrong {
				border-color: var(--e-danger);
			}
		}

		&__head {
			display: flex;
			align-items: baseline;
			justify-content: space-between;
		}

		&__name {
			font-size: var(--e-text-2xs);
			font-weight: var(--e-weight-bold);
			color: var(--e-fg-dim);
			letter-spacing: var(--e-tracking-wide);
			text-transform: uppercase;
		}

		&__z {
			@include mono;

			font-size: var(--e-text-sm);
			color: var(--e-fg-dim);

			&--over {
				font-weight: var(--e-weight-bold);
				color: var(--e-green-list);
			}
		}

		&__text {
			@include mono;

			font-size: var(--e-text-xs);
			line-height: var(--e-leading-snug);
			color: var(--e-fg-muted);
		}

		&__actions {
			display: flex;
			flex-wrap: wrap;
			gap: var(--e-space-xs);
			align-items: center;
		}

		&__vote {
			@include focus-ring;

			padding: var(--e-space-3xs) var(--e-space-sm);
			font-size: var(--e-text-xs);
			color: var(--e-fg-muted);
			background: var(--e-surface-2);
			border: var(--e-border-width) solid transparent;
			border-radius: var(--e-radius-pill);

			&:hover:not(:disabled) {
				color: var(--e-fg);
			}

			&--on {
				color: var(--e-accent);
				background: var(--e-accent-soft);
				border-color: var(--e-accent);
			}
		}

		&__truth {
			font-size: var(--e-text-2xs);
			color: var(--e-fg-dim);
		}

		&__summary {
			display: flex;
			flex-direction: column;
			gap: var(--e-space-xs);
			align-items: flex-start;
			padding: var(--e-space-md);
			background: var(--e-bg-subtle);
			border: var(--e-border-width) solid var(--e-border);
			border-radius: var(--e-radius-md);
		}

		&__summary-title {
			font-size: var(--e-text-md);
			font-weight: var(--e-weight-semibold);
			color: var(--e-fg);
		}

		&__summary-body {
			font-size: var(--e-text-sm);
			color: var(--e-fg-muted);
		}
	}
</style>
