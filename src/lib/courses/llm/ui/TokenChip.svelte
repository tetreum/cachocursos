<script lang="ts">
	import { formatSymbol } from './tokenFormat';

	interface TokenChipProps {
		text: string;
		tone?: 'neutral' | 'accent' | 'green' | 'red' | 'you' | 'model';
		hue?: number | null;
		weight?: number | null;
		selected?: boolean;
		sub?: string;
		title?: string;
		onclick?: (event: MouseEvent) => void;
	}

	let {
		text,
		tone = 'neutral',
		hue = null,
		weight = null,
		selected = false,
		sub,
		title,
		onclick
	}: TokenChipProps = $props();

	const TOKEN_HUE_COUNT = 8;

	const label = $derived(formatSymbol(text));
	const interactive = $derived(onclick !== undefined);
	const hueIndex = $derived(
		hue === null ? null : ((hue % TOKEN_HUE_COUNT) + TOKEN_HUE_COUNT) % TOKEN_HUE_COUNT
	);
</script>

<svelte:element
	this={interactive ? 'button' : 'span'}
	class="e-token e-token--{tone}"
	class:e-token--selected={selected}
	class:e-token--hued={hueIndex !== null}
	class:e-token--weighted={weight !== null}
	style:--e-token-hue={hueIndex === null ? undefined : `var(--e-tok-${hueIndex})`}
	style:--e-token-weight={weight === null ? undefined : String(weight)}
	role={interactive ? 'button' : undefined}
	type={interactive ? 'button' : undefined}
	{title}
	{onclick}
>
	<span class="e-token__text">{label}</span>
	{#if sub}
		<span class="e-token__sub">{sub}</span>
	{/if}
</svelte:element>

<style lang="scss">
	.e-token {
		@include mono;

		display: inline-flex;
		flex-direction: column;
		gap: 1px;
		align-items: center;
		padding: var(--e-space-3xs) var(--e-space-xs);
		font-size: var(--e-text-sm);
		line-height: 1.35;
		color: var(--e-fg);
		text-align: center;
		background: var(--e-surface-2);
		border: var(--e-border-width) solid var(--e-border);
		border-radius: var(--e-radius-sm);
		transition:
			background var(--e-dur-fast) var(--e-ease-out),
			border-color var(--e-dur-fast) var(--e-ease-out);

		@include focus-ring;

		&--hued {
			color: var(--e-token-hue);
			background: color-mix(in oklab, var(--e-token-hue) 16%, var(--e-surface));
			border-color: color-mix(in oklab, var(--e-token-hue) 40%, transparent);
		}

		&--weighted {
			background: color-mix(
				in oklab,
				var(--e-accent-2) calc(var(--e-token-weight) * 70%),
				var(--e-surface-2)
			);
		}

		&--accent {
			color: var(--e-accent);
			background: var(--e-accent-soft);
			border-color: var(--e-accent);
		}

		&--green {
			color: var(--e-green-list);
			background: var(--e-success-soft);
			border-color: color-mix(in oklab, var(--e-green-list) 50%, transparent);
		}

		&--red {
			color: var(--e-red-list);
			background: var(--e-danger-soft);
			border-color: color-mix(in oklab, var(--e-red-list) 50%, transparent);
		}

		&--you {
			color: var(--e-you);
			background: var(--e-warn-soft);
		}

		&--model {
			color: var(--e-model);
			background: var(--e-accent-2-soft);
		}

		&--selected {
			border-color: var(--e-accent);
			box-shadow: 0 0 0 1px var(--e-accent);
		}

		&__sub {
			@include mono;

			font-size: var(--e-text-xs);
			font-weight: var(--e-weight-semibold);
			color: var(--e-fg-muted);
			font-variant-numeric: tabular-nums;
		}

		&--weighted &__sub {
			color: var(--e-fg);
		}
	}

	button.e-token:hover {
		border-color: var(--e-border-strong);
	}
</style>
