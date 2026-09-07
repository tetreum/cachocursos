<script lang="ts">
	import type { Snippet } from 'svelte';

	interface ButtonProps {
		variant?: 'primary' | 'secondary' | 'ghost';
		type?: 'button' | 'submit';
		disabled?: boolean;
		full?: boolean;
		title?: string;
		onclick?: (event: MouseEvent) => void;
		children: Snippet;
	}

	let {
		variant = 'secondary',
		type = 'button',
		disabled = false,
		full = false,
		title,
		onclick,
		children
	}: ButtonProps = $props();
</script>

<button
	class="e-button e-button--{variant}"
	class:e-button--full={full}
	{type}
	{title}
	{disabled}
	{onclick}
>
	{@render children()}
</button>

<style lang="scss">
	.e-button {
		display: inline-flex;
		gap: var(--e-space-xs);
		align-items: center;
		justify-content: center;
		padding: var(--e-space-xs) var(--e-space-md);
		font-size: var(--e-text-sm);
		font-weight: var(--e-weight-semibold);
		border: var(--e-border-width) solid transparent;
		border-radius: var(--e-radius-pill);
		transition:
			background var(--e-dur-fast) var(--e-ease-out),
			border-color var(--e-dur-fast) var(--e-ease-out),
			color var(--e-dur-fast) var(--e-ease-out);

		@include focus-ring;

		&:disabled {
			cursor: not-allowed;
			opacity: 0.45;
		}

		&--full {
			width: 100%;
		}

		&--primary {
			color: var(--e-accent-fg);
			background: var(--e-accent);

			&:hover:not(:disabled) {
				background: var(--e-accent-hover);
			}
		}

		&--secondary {
			color: var(--e-fg);
			background: var(--e-surface-2);
			border-color: var(--e-border);

			&:hover:not(:disabled) {
				background: var(--e-surface-3);
				border-color: var(--e-border-strong);
			}
		}

		&--ghost {
			color: var(--e-fg-muted);
			background: none;

			&:hover:not(:disabled) {
				color: var(--e-fg);
				background: var(--e-surface-2);
			}
		}
	}
</style>
