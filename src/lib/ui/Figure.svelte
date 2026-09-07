<script lang="ts">
	import type { Snippet } from 'svelte';

	interface FigureProps {
		caption?: string;
		wide?: boolean;
		children: Snippet;
	}

	let { caption, wide = false, children }: FigureProps = $props();
</script>

<figure class="e-figure" class:e-figure--wide={wide}>
	<div class="e-figure__body">{@render children()}</div>
	{#if caption}
		<figcaption class="e-figure__caption">{caption}</figcaption>
	{/if}
</figure>

<style lang="scss">
	.e-figure {
		@include measure;

		display: flex;
		flex-direction: column;
		gap: var(--e-space-xs);

		&--wide {
			max-width: var(--e-measure-wide);
		}

		&__caption {
			font-size: var(--e-text-sm);
			color: var(--e-fg-dim);
			text-align: center;
			text-wrap: balance;
		}
	}
</style>
