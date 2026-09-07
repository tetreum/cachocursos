<script lang="ts">
	interface ScorePillProps {
		label: string;
		value: string;
		tone?: 'neutral' | 'success' | 'warn' | 'danger' | 'accent';
	}

	let { label, value, tone = 'neutral' }: ScorePillProps = $props();
</script>

<div class="e-score-pill e-score-pill--{tone}">
	<span class="e-score-pill__label">{label}</span>
	<span class="e-score-pill__value">{value}</span>
</div>

<style lang="scss">
	.e-score-pill {
		display: inline-flex;
		flex-direction: column;
		gap: var(--e-space-3xs);
		padding: var(--e-space-xs) var(--e-space-md);
		background: var(--e-surface-2);
		border: var(--e-border-width) solid var(--e-border);
		border-radius: var(--e-radius-md);

		&__label {
			font-size: var(--e-text-2xs);
			font-weight: var(--e-weight-semibold);
			color: var(--e-fg-dim);
			letter-spacing: var(--e-tracking-wide);
			text-transform: uppercase;
		}

		&__value {
			@include mono;

			font-size: var(--e-text-xl);
			font-weight: var(--e-weight-semibold);
			line-height: 1;
			color: var(--e-fg);
		}

		&--success .e-score-pill__value {
			color: var(--e-success);
		}

		&--warn .e-score-pill__value {
			color: var(--e-warn);
		}

		&--danger .e-score-pill__value {
			color: var(--e-danger);
		}

		&--accent .e-score-pill__value {
			color: var(--e-accent);
		}
	}
</style>
