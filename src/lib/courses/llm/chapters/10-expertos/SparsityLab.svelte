<script lang="ts">
	import { parameterBudget } from '../../models/moe';
	import { formatParameters } from '../../models/scaling';
	import Slider from '$ui/Slider.svelte';
	import ScorePill from '$ui/ScorePill.svelte';
	import { createCourseTranslator } from '../../i18n';

	const t = createCourseTranslator();

	const SHARED_PARAMETERS = 2e9;
	const EXPERT_PARAMETERS = 1.5e9;
	const PERCENT = 100;
	const BYTES_PER_PARAMETER = 2;
	const GIGABYTE = 1024 ** 3;

	let expertCount = $state(8);
	let activePerToken = $state(2);

	const budget = $derived(
		parameterBudget({
			expertCount: Math.round(expertCount),
			activePerToken: Math.round(activePerToken),
			expertParameters: EXPERT_PARAMETERS,
			sharedParameters: SHARED_PARAMETERS
		})
	);

	const dense = $derived(
		parameterBudget({
			expertCount: 1,
			activePerToken: 1,
			expertParameters: EXPERT_PARAMETERS,
			sharedParameters: SHARED_PARAMETERS
		})
	);

	const memoryGigabytes = $derived((budget.totalParameters * BYTES_PER_PARAMETER) / GIGABYTE);
	const capacityGain = $derived(budget.totalParameters / dense.totalParameters);
	const computeGain = $derived(budget.activeParameters / dense.activeParameters);
</script>

<div class="e-sparsity">
	<div class="e-sparsity__controls">
		<Slider
			bind:value={expertCount}
			min={1}
			max={128}
			step={1}
			label={t('SPARSITY_EXPERTS')}
			format={(value) => String(Math.round(value))}
			hint={t('SPARSITY_EXPERTS_HINT')}
		/>
		<Slider
			bind:value={activePerToken}
			min={1}
			max={8}
			step={1}
			label={t('SPARSITY_ACTIVE')}
			format={(value) => String(Math.round(value))}
			hint={t('SPARSITY_ACTIVE_HINT')}
		/>
	</div>

	<div class="e-sparsity__scores">
		<ScorePill
			label={t('SPARSITY_TOTAL_PARAMS')}
			value={formatParameters(budget.totalParameters)}
			tone="accent"
		/>
		<ScorePill
			label={t('SPARSITY_ACTIVE_PARAMS')}
			value={formatParameters(budget.activeParameters)}
			tone="success"
		/>
		<ScorePill label={t('SPARSITY_USED')} value="{(budget.sparsity * PERCENT).toFixed(1)}%" />
		<ScorePill
			label={t('SPARSITY_MEMORY')}
			value="{memoryGigabytes.toFixed(0)} GB"
			tone={memoryGigabytes > 400 ? 'danger' : 'neutral'}
		/>
	</div>

	<div class="e-sparsity__bars">
		<div class="e-sparsity__bar-row">
			<span class="e-sparsity__bar-label">{t('SPARSITY_BAR_STORED')}</span>
			<span class="e-sparsity__track">
				<span class="e-sparsity__fill e-sparsity__fill--total" style:width="100%"></span>
			</span>
		</div>
		<div class="e-sparsity__bar-row">
			<span class="e-sparsity__bar-label">{t('SPARSITY_BAR_USED')}</span>
			<span class="e-sparsity__track">
				<span
					class="e-sparsity__fill e-sparsity__fill--active"
					style:width="{Math.max(1.5, budget.sparsity * PERCENT)}%"
				></span>
			</span>
		</div>
	</div>

	<p class="e-sparsity__reading">
		{t('SPARSITY_READING_HEAD')}
		<strong>{t('SPARSITY_READING_CAPACITY', { gain: capacityGain.toFixed(1) })}</strong>
		{t('SPARSITY_READING_MIDDLE')}
		<strong>{t('SPARSITY_READING_COMPUTE', { gain: computeGain.toFixed(1) })}</strong>
		{t('SPARSITY_READING_TAIL')}
	</p>
</div>

<style lang="scss">
	.e-sparsity {
		display: flex;
		flex-direction: column;
		gap: var(--e-space-md);
		padding: var(--e-space-md);
		background: var(--e-bg-subtle);
		border: var(--e-border-width) solid var(--e-border);
		border-radius: var(--e-radius-md);

		&__controls {
			display: grid;
			grid-template-columns: repeat(auto-fit, minmax(13rem, 1fr));
			gap: var(--e-space-md);
		}

		&__scores {
			display: flex;
			flex-wrap: wrap;
			gap: var(--e-space-xs);
		}

		&__bars {
			display: flex;
			flex-direction: column;
			gap: var(--e-space-2xs);
		}

		&__bar-row {
			display: grid;
			grid-template-columns: 11rem 1fr;
			gap: var(--e-space-sm);
			align-items: center;
		}

		&__bar-label {
			font-size: var(--e-text-2xs);
			color: var(--e-fg-dim);
			letter-spacing: var(--e-tracking-wide);
			text-transform: uppercase;
		}

		&__track {
			height: 16px;
			overflow: hidden;
			background: var(--e-surface-2);
			border-radius: var(--e-radius-xs);
		}

		&__fill {
			display: block;
			height: 100%;
			transition: width var(--e-dur-base) var(--e-ease-out);

			&--total {
				background: var(--e-accent);
			}

			&--active {
				background: var(--e-success);
			}
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
