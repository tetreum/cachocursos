<script lang="ts" module>
	export interface ProbabilityItem {
		label: string;
		probability: number;
		tone?: 'neutral' | 'you' | 'model' | 'green' | 'red' | 'muted';
		note?: string;
	}
</script>

<script lang="ts">
	interface ProbabilityBarsProps {
		items: readonly ProbabilityItem[];
		limit?: number;
		absolute?: boolean;
		selectable?: boolean;
		selected?: string | null;
		onselect?: (label: string) => void;
	}

	let {
		items,
		limit = 10,
		absolute = false,
		selectable = false,
		selected = null,
		onselect
	}: ProbabilityBarsProps = $props();

	const PERCENT = 100;
	const MINIMUM_VISIBLE_WIDTH = 0.6;

	const shown = $derived(items.slice(0, limit));
	const largest = $derived(
		absolute
			? 1
			: Math.max(MINIMUM_VISIBLE_WIDTH / PERCENT, ...shown.map((item) => item.probability))
	);

	function widthOf(probability: number): number {
		return Math.max(MINIMUM_VISIBLE_WIDTH, (probability / largest) * PERCENT);
	}

	function formatProbability(probability: number): string {
		return `${(probability * PERCENT).toFixed(1)}%`;
	}
</script>

<ul class="e-bars">
	{#each shown as item (item.label)}
		<li class="e-bars__row">
			<svelte:element
				this={selectable ? 'button' : 'div'}
				class="e-bars__hit"
				class:e-bars__hit--selected={selected === item.label}
				class:e-bars__hit--interactive={selectable}
				type={selectable ? 'button' : undefined}
				role={selectable ? 'button' : undefined}
				onclick={selectable && onselect ? () => onselect(item.label) : undefined}
			>
				<span class="e-bars__label">{item.label}</span>
				<span class="e-bars__track">
					<span
						class="e-bars__fill e-bars__fill--{item.tone ?? 'neutral'}"
						style:width="{widthOf(item.probability)}%"
					></span>
				</span>
				<span class="e-bars__value">{formatProbability(item.probability)}</span>
			</svelte:element>
			{#if item.note}
				<span class="e-bars__note">{item.note}</span>
			{/if}
		</li>
	{/each}
</ul>

<style lang="scss">
	.e-bars {
		display: flex;
		flex-direction: column;
		gap: var(--e-space-3xs);
		padding: 0;
		margin: 0;
		list-style: none;

		&__row {
			display: flex;
			flex-direction: column;
			gap: 1px;
		}

		&__hit {
			display: grid;
			grid-template-columns: minmax(5rem, 9rem) 1fr 4.5rem;
			gap: var(--e-space-xs);
			align-items: center;
			width: 100%;
			padding: var(--e-space-3xs) var(--e-space-2xs);
			text-align: left;
			background: none;
			border: var(--e-border-width) solid transparent;
			border-radius: var(--e-radius-sm);

			@include focus-ring;

			&--interactive:hover {
				background: var(--e-surface-2);
			}

			&--selected {
				border-color: var(--e-accent);
			}
		}

		&__label {
			@include mono;

			overflow: hidden;
			font-size: var(--e-text-sm);
			color: var(--e-fg);
			text-overflow: ellipsis;
			white-space: nowrap;
		}

		&__track {
			height: 14px;
			overflow: hidden;
			background: var(--e-surface-2);
			border-radius: var(--e-radius-xs);
		}

		&__fill {
			display: block;
			height: 100%;
			border-radius: inherit;
			transition: width var(--e-dur-base) var(--e-ease-out);

			&--neutral {
				background: var(--e-accent);
			}

			&--you {
				background: var(--e-you);
			}

			&--model {
				background: var(--e-model);
			}

			&--green {
				background: var(--e-green-list);
			}

			&--red {
				background: var(--e-red-list);
			}

			&--muted {
				background: var(--e-surface-3);
			}
		}

		&__value {
			@include mono;

			font-size: var(--e-text-xs);
			color: var(--e-fg-dim);
			text-align: right;
		}

		&__note {
			padding-left: var(--e-space-xs);
			font-size: var(--e-text-2xs);
			color: var(--e-fg-dim);
		}
	}
</style>
