<script lang="ts">
	import type { Snippet } from 'svelte';

	interface CalloutProps {
		kind?: 'note' | 'warn' | 'key';
		title?: string;
		children: Snippet;
	}

	let { kind = 'note', title, children }: CalloutProps = $props();
</script>

<aside class="e-callout e-callout--{kind}">
	{#if title}
		<p class="e-callout__title">{title}</p>
	{/if}
	<div class="e-callout__body">{@render children()}</div>
</aside>

<style lang="scss">
	.e-callout {
		@include measure;

		padding: var(--e-space-md) var(--e-space-lg);
		font-size: var(--e-text-md);
		color: var(--e-fg-muted);
		border-left: 3px solid var(--e-border-strong);
		border-radius: var(--e-radius-sm);

		&__title {
			margin-bottom: var(--e-space-2xs);
			font-size: var(--e-text-xs);
			font-weight: var(--e-weight-bold);
			letter-spacing: var(--e-tracking-wide);
			text-transform: uppercase;
		}

		&--note {
			background: var(--e-surface);
		}

		&--warn {
			background: var(--e-warn-soft);
			border-left-color: var(--e-warn);

			.e-callout__title {
				color: var(--e-warn);
			}
		}

		&--key {
			background: var(--e-accent-soft);
			border-left-color: var(--e-accent);

			.e-callout__title {
				color: var(--e-accent);
			}
		}
	}
</style>
