<script lang="ts">
	import type { Snippet } from 'svelte';

	interface ProseProps {
		lead?: boolean;
		children: Snippet;
	}

	let { lead = false, children }: ProseProps = $props();
</script>

<div class="e-prose" class:e-prose--lead={lead}>
	{@render children()}
</div>

<style lang="scss">
	.e-prose {
		@include measure;

		display: flex;
		flex-direction: column;
		gap: var(--e-space-md);
		font-size: var(--e-text-lg);
		line-height: var(--e-leading-body);
		color: var(--e-fg-muted);

		&--lead {
			font-size: var(--e-text-xl);
			line-height: var(--e-leading-snug);
			color: var(--e-fg);
		}

		:global(strong) {
			font-weight: var(--e-weight-semibold);
			color: var(--e-fg);
		}

		:global(em) {
			font-style: normal;
			color: var(--e-accent-2);
		}

		:global(code) {
			padding: 0.1em 0.35em;
			background: var(--e-surface-2);
			border-radius: var(--e-radius-xs);
		}

		:global(ul) {
			display: flex;
			flex-direction: column;
			gap: var(--e-space-xs);
			padding-left: var(--e-space-lg);
			margin: 0;
		}
	}
</style>
