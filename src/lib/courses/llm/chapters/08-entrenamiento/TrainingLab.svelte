<script lang="ts">
	import { untrack } from 'svelte';
	import { tokenizeWords } from '../../models/ngram';
	import { createTrainer, DEFAULT_TRAINER, type Trainer } from '../../models/trainer';
	import { mulberry32 } from '$utils/rng';
	import type { ChallengeResult } from '$content/types';
	import Slider from '$ui/Slider.svelte';
	import Button from '$ui/Button.svelte';
	import ScorePill from '$ui/ScorePill.svelte';
	import LineChart, { type ChartSeries } from '$ui/LineChart.svelte';
	import { createCourseTranslator } from '../../i18n';

	interface TrainingLabProps {
		corpus: string;
		targetLoss: number;
		stepBudget: number;
		onsolve?: (result: ChallengeResult) => void;
	}

	let { corpus, targetLoss, stepBudget, onsolve }: TrainingLabProps = $props();

	const t = createCourseTranslator();

	const STEPS_PER_FRAME = 6;
	const SAMPLE_LENGTH = 14;
	const SAMPLE_TEMPERATURE = 0.8;
	const TRACE_LIMIT = 400;

	const source = untrack(() => tokenizeWords(corpus));
	const vocabSize = source.vocabulary.length;

	let learningRate = $state(DEFAULT_TRAINER.learningRate);
	let trainer = $state.raw<Trainer>(
		untrack(() => createTrainer(source.ids, vocabSize, DEFAULT_TRAINER))
	);
	let trace = $state<[number, number][]>([]);
	let running = $state(false);
	let stepCount = $state(0);
	let currentLoss = $state(Math.log(vocabSize));
	let sampleText = $state('');
	let announced = $state(false);

	const uniformLoss = Math.log(vocabSize);
	const budgetSpent = $derived(stepCount >= stepBudget);
	const reached = $derived(currentLoss <= targetLoss && stepCount > 0);
	const diverged = $derived(trainer.diverged);

	const series = $derived.by((): ChartSeries[] => [
		{ id: 'loss', points: trace, tone: 'accent', label: 'loss' },
		{
			id: 'objetivo',
			points: [
				[0, targetLoss],
				[Math.max(stepBudget, stepCount), targetLoss]
			],
			tone: 'success',
			dashed: true
		}
	]);

	function refreshSample(): void {
		const seedId = source.ids[0] ?? 0;
		const ids = trainer.sample(
			seedId,
			SAMPLE_LENGTH,
			SAMPLE_TEMPERATURE,
			mulberry32(stepCount + 1)
		);
		sampleText = ids.map((id) => source.vocabulary[id]).join(' ');
	}

	function tick(): void {
		if (!running) return;
		for (let index = 0; index < STEPS_PER_FRAME; index += 1) {
			if (stepCount >= stepBudget || trainer.diverged) {
				running = false;
				break;
			}
			const step = trainer.runStep();
			stepCount = step.step;
			currentLoss = step.loss;
			if (stepCount % 4 === 0) {
				trace = [...trace.slice(-TRACE_LIMIT), [stepCount, Math.min(step.loss, uniformLoss * 3)]];
			}
		}
		refreshSample();
		if (running) requestAnimationFrame(tick);
	}

	function start(): void {
		if (running || budgetSpent || diverged) return;
		running = true;
		requestAnimationFrame(tick);
	}

	function pause(): void {
		running = false;
	}

	function restart(): void {
		running = false;
		trainer.reset({ learningRate });
		trainer = trainer;
		trace = [];
		stepCount = 0;
		currentLoss = uniformLoss;
		sampleText = '';
		announced = false;
	}

	$effect(() => {
		if (!reached || announced) return;
		announced = true;
		running = false;
		onsolve?.({
			score: Math.round((uniformLoss - currentLoss) * 100),
			detail: {
				loss: currentLoss.toFixed(2),
				steps: stepCount,
				learningRate: learningRate.toFixed(3)
			}
		});
	});
</script>

<div class="e-lab">
	<div class="e-lab__controls">
		<Slider
			bind:value={learningRate}
			min={0.005}
			max={50}
			scale="log"
			label="Learning rate"
			format={(value) => (value < 1 ? value.toFixed(3) : value.toFixed(1))}
			hint={t('LAB_LEARNING_RATE_HINT')}
			disabled={running}
		/>
		<div class="e-lab__buttons">
			<Button variant="primary" disabled={running || budgetSpent || diverged} onclick={start}>
				{t('LAB_TRAIN')}
			</Button>
			<Button disabled={!running} onclick={pause}>{t('LAB_PAUSE')}</Button>
			<Button variant="ghost" onclick={restart}>{t('LAB_RESET')}</Button>
		</div>
	</div>

	<div class="e-lab__scores">
		<ScorePill label={t('LAB_PARAMETERS')} value={String(trainer.parameterCount)} />
		<ScorePill label={t('LAB_STEP')} value="{stepCount} / {stepBudget}" />
		<ScorePill
			label="Loss"
			value={diverged ? t('LAB_DIVERGED') : currentLoss.toFixed(2)}
			tone={diverged ? 'danger' : reached ? 'success' : 'accent'}
		/>
		<ScorePill label={t('LAB_TARGET')} value={targetLoss.toFixed(2)} />
	</div>

	<LineChart
		{series}
		xLabel={t('LAB_X_LABEL')}
		yLabel={t('LAB_Y_LABEL')}
		xDomain={[0, stepBudget]}
		yDomain={[0, uniformLoss * 1.4]}
		height={200}
	/>

	{#if diverged}
		<p class="e-lab__alert">
			{t('LAB_DIVERGED_ALERT')}
		</p>
	{:else if budgetSpent && !reached}
		<p class="e-lab__alert e-lab__alert--warn">
			{t('LAB_BUDGET_ALERT', { loss: currentLoss.toFixed(2) })}
		</p>
	{/if}

	<div class="e-lab__sample">
		<p class="e-lab__label">{t('LAB_SAMPLE_LABEL')}</p>
		<p class="e-lab__text">{sampleText || t('LAB_SAMPLE_EMPTY')}</p>
		<p class="e-lab__note">
			{t('LAB_SAMPLE_NOTE')}
		</p>
	</div>
</div>

<style lang="scss">
	.e-lab {
		display: flex;
		flex-direction: column;
		gap: var(--e-space-md);

		&__controls {
			display: grid;
			grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr));
			gap: var(--e-space-md);
			align-items: end;
			padding: var(--e-space-md);
			background: var(--e-bg-subtle);
			border: var(--e-border-width) solid var(--e-border);
			border-radius: var(--e-radius-md);
		}

		&__buttons {
			display: flex;
			flex-wrap: wrap;
			gap: var(--e-space-xs);
		}

		&__scores {
			display: flex;
			flex-wrap: wrap;
			gap: var(--e-space-xs);
		}

		&__alert {
			padding: var(--e-space-sm) var(--e-space-md);
			font-size: var(--e-text-sm);
			color: var(--e-danger);
			background: var(--e-danger-soft);
			border-radius: var(--e-radius-sm);

			&--warn {
				color: var(--e-warn);
				background: var(--e-warn-soft);
			}
		}

		&__sample {
			display: flex;
			flex-direction: column;
			gap: var(--e-space-2xs);
			padding: var(--e-space-md);
			background: var(--e-bg-subtle);
			border: var(--e-border-width) solid var(--e-border);
			border-radius: var(--e-radius-md);
		}

		&__label {
			font-size: var(--e-text-2xs);
			font-weight: var(--e-weight-bold);
			color: var(--e-fg-dim);
			letter-spacing: var(--e-tracking-wide);
			text-transform: uppercase;
		}

		&__text {
			@include mono;

			min-height: 2.5em;
			font-size: var(--e-text-sm);
			color: var(--e-fg);
		}

		&__note {
			font-size: var(--e-text-2xs);
			color: var(--e-fg-dim);
		}
	}
</style>
