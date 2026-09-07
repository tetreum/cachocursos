<script lang="ts">
	import {
		routerScores,
		topExperts,
		type Expert,
		type RoutableToken,
		type RouterMatrix
	} from '../../models/moe';
	import { softmax } from '../../models/sampling';
	import Button from '$ui/Button.svelte';
	import { ACTIVE_EXPERTS_PER_TOKEN } from '../../config';
	import { createCourseTranslator } from '../../i18n';

	const t = createCourseTranslator();

	interface RouterMechanismProps {
		experts: readonly Expert[];
		tokens: readonly RoutableToken[];
		featureNames: readonly string[];
		trainedRouter: RouterMatrix;
		untrainedRouter: RouterMatrix;
	}

	let { experts, tokens, featureNames, trainedRouter, untrainedRouter }: RouterMechanismProps =
		$props();

	const PERCENT = 100;

	let tokenIndex = $state(0);
	let trained = $state(true);

	/** Un token por familia: así el escaparate no depende del vocabulario del idioma. */
	const showcase = $derived(
		tokens.filter(
			(token, index) => tokens.findIndex((other) => other.kind === token.kind) === index
		)
	);
	const token = $derived(showcase[tokenIndex]);
	const matrix = $derived<RouterMatrix>(trained ? trainedRouter : untrainedRouter);
	const scores = $derived(routerScores(token.features, matrix));
	const probabilities = $derived(softmax(scores));
	const winners = $derived(topExperts(scores, ACTIVE_EXPERTS_PER_TOKEN));
	const confidence = $derived(Math.max(...probabilities));
</script>

<div class="e-mech">
	<div class="e-mech__controls">
		<div class="e-mech__tokens">
			{#each showcase as candidate, index (candidate.id)}
				<button
					class="e-mech__token"
					class:e-mech__token--on={index === tokenIndex}
					type="button"
					onclick={() => (tokenIndex = index)}
				>
					{candidate.text}
				</button>
			{/each}
		</div>
		<Button onclick={() => (trained = !trained)}>
			{trained ? t('MECH_SHOW_UNTRAINED') : t('MECH_SHOW_TRAINED')}
		</Button>
	</div>

	<div class="e-mech__stage">
		<div class="e-mech__panel">
			<p class="e-mech__label">{t('MECH_STEP_ONE')}</p>
			<ul class="e-mech__features">
				{#each token.features as value, index (featureNames[index])}
					<li class="e-mech__feature">
						<span class="e-mech__feature-name">{featureNames[index]}</span>
						<span class="e-mech__track">
							<span class="e-mech__fill" style:width="{value * PERCENT}%"></span>
						</span>
						<span class="e-mech__number">{value.toFixed(2)}</span>
					</li>
				{/each}
			</ul>
			<p class="e-mech__note">
				{t('MECH_STEP_ONE_NOTE')}
			</p>
		</div>

		<div class="e-mech__panel">
			<p class="e-mech__label">
				{t('MECH_STEP_TWO', {
					state: trained ? t('MECH_STATE_TRAINED') : t('MECH_STATE_RANDOM')
				})}
			</p>
			<table class="e-mech__matrix">
				<thead>
					<tr>
						<th></th>
						{#each featureNames as name (name)}
							<th>{name.slice(0, 4)}</th>
						{/each}
					</tr>
				</thead>
				<tbody>
					{#each matrix as row, expert (experts[expert].id)}
						<tr class:e-mech__row--winner={winners.includes(expert)}>
							<th>{experts[expert].short}</th>
							{#each row as weight (weight)}
								<td
									class:e-mech__weight--positive={weight > 0.5}
									class:e-mech__weight--negative={weight < -0.15}
								>
									{weight.toFixed(2)}
								</td>
							{/each}
						</tr>
					{/each}
				</tbody>
			</table>
			<p class="e-mech__note">
				{t('MECH_STEP_TWO_NOTE')}
			</p>
		</div>

		<div class="e-mech__panel">
			<p class="e-mech__label">{t('MECH_STEP_THREE')}</p>
			<ul class="e-mech__scores">
				{#each experts as expert, index (expert.id)}
					<li class="e-mech__score" class:e-mech__score--winner={winners.includes(index)}>
						<span class="e-mech__score-name">{expert.short}</span>
						<span class="e-mech__track">
							<span
								class="e-mech__fill e-mech__fill--score"
								style:width="{probabilities[index] * PERCENT}%"
							></span>
						</span>
						<span class="e-mech__number">{(probabilities[index] * PERCENT).toFixed(0)}%</span>
					</li>
				{/each}
			</ul>
			<p class="e-mech__note">
				{t('MECH_STEP_THREE_NOTE_HEAD')}
				<strong>{ACTIVE_EXPERTS_PER_TOKEN}</strong>
				{t('MECH_STEP_THREE_NOTE_MIDDLE')}
				<strong>{(confidence * PERCENT).toFixed(0)}%</strong>
				{#if !trained}
					{t('MECH_STEP_THREE_NOTE_COIN', { chance: (PERCENT / experts.length).toFixed(0) })}
				{/if}
			</p>
		</div>
	</div>

	<p class="e-mech__verdict" class:e-mech__verdict--trained={trained}>
		{#if trained}
			{t('MECH_VERDICT_TRAINED')}
		{:else}
			{t('MECH_VERDICT_UNTRAINED')}
		{/if}
	</p>
</div>

<style lang="scss">
	.e-mech {
		display: flex;
		flex-direction: column;
		gap: var(--e-space-md);
		padding: var(--e-space-md);
		background: var(--e-bg-subtle);
		border: var(--e-border-width) solid var(--e-border);
		border-radius: var(--e-radius-md);

		&__controls {
			display: flex;
			flex-wrap: wrap;
			gap: var(--e-space-md);
			align-items: center;
			justify-content: space-between;
		}

		&__tokens {
			display: flex;
			flex-wrap: wrap;
			gap: var(--e-space-2xs);
		}

		&__token {
			@include mono;
			@include focus-ring;

			padding: var(--e-space-3xs) var(--e-space-sm);
			font-size: var(--e-text-sm);
			color: var(--e-fg-muted);
			background: var(--e-surface-2);
			border: var(--e-border-width) solid transparent;
			border-radius: var(--e-radius-sm);

			&--on {
				color: var(--e-accent);
				background: var(--e-accent-soft);
				border-color: var(--e-accent);
			}
		}

		&__stage {
			display: grid;
			grid-template-columns: repeat(auto-fit, minmax(15rem, 1fr));
			gap: var(--e-space-md);
		}

		&__panel {
			display: flex;
			flex-direction: column;
			gap: var(--e-space-xs);
			padding: var(--e-space-sm);
			background: var(--e-surface);
			border: var(--e-border-width) solid var(--e-border);
			border-radius: var(--e-radius-sm);
		}

		&__label {
			font-size: var(--e-text-2xs);
			font-weight: var(--e-weight-bold);
			color: var(--e-fg-dim);
			letter-spacing: var(--e-tracking-wide);
			text-transform: uppercase;
		}

		&__features,
		&__scores {
			display: flex;
			flex-direction: column;
			gap: var(--e-space-3xs);
			padding: 0;
			margin: 0;
			list-style: none;
		}

		&__feature,
		&__score {
			display: grid;
			grid-template-columns: 5.5rem 1fr 3rem;
			gap: var(--e-space-2xs);
			align-items: center;
		}

		&__feature-name,
		&__score-name {
			@include mono;

			font-size: var(--e-text-2xs);
			color: var(--e-fg-muted);
		}

		&__score--winner &__score-name {
			font-weight: var(--e-weight-bold);
			color: var(--e-success);
		}

		&__track {
			height: 10px;
			overflow: hidden;
			background: var(--e-surface-2);
			border-radius: var(--e-radius-xs);
		}

		&__fill {
			display: block;
			height: 100%;
			background: var(--e-accent-2);
			transition: width var(--e-dur-base) var(--e-ease-out);

			&--score {
				background: var(--e-accent);
			}
		}

		&__score--winner &__fill {
			background: var(--e-success);
		}

		&__number {
			@include mono;

			font-size: var(--e-text-2xs);
			color: var(--e-fg-dim);
			text-align: right;
			font-variant-numeric: tabular-nums;
		}

		&__matrix {
			@include mono;

			width: 100%;
			font-size: var(--e-text-2xs);
			border-collapse: collapse;

			th {
				font-weight: var(--e-weight-semibold);
				color: var(--e-fg-dim);
			}

			td {
				padding: 2px 0;
				color: var(--e-fg-muted);
				text-align: center;
			}
		}

		&__row--winner th {
			color: var(--e-success);
		}

		&__weight--positive {
			font-weight: var(--e-weight-bold);
			color: var(--e-accent-2) !important;
		}

		&__weight--negative {
			color: var(--e-fg-dim) !important;
			opacity: 0.5;
		}

		&__note {
			font-size: var(--e-text-2xs);
			color: var(--e-fg-dim);
		}

		&__verdict {
			padding: var(--e-space-sm) var(--e-space-md);
			font-size: var(--e-text-sm);
			color: var(--e-fg-muted);
			background: var(--e-warn-soft);
			border-left: 3px solid var(--e-warn);
			border-radius: var(--e-radius-sm);

			&--trained {
				background: var(--e-accent-soft);
				border-left-color: var(--e-accent);
			}
		}
	}
</style>
