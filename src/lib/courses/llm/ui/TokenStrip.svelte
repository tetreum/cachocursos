<script lang="ts">
	import TokenChip from './TokenChip.svelte';

	interface TokenStripProps {
		tokens: readonly string[];
		weights?: readonly number[] | null;
		hues?: readonly number[] | null;
		subs?: readonly string[] | null;
		tones?: readonly ('neutral' | 'accent' | 'green' | 'red' | 'you' | 'model')[] | null;
		selectedIndex?: number | null;
		label?: string;
		onselect?: (index: number) => void;
	}

	let {
		tokens,
		weights = null,
		hues = null,
		subs = null,
		tones = null,
		selectedIndex = null,
		label,
		onselect
	}: TokenStripProps = $props();
</script>

<div class="e-token-strip" aria-label={label}>
	{#each tokens as token, index (index)}
		<TokenChip
			text={token}
			tone={tones?.[index] ?? 'neutral'}
			hue={hues?.[index] ?? null}
			weight={weights?.[index] ?? null}
			sub={subs?.[index]}
			selected={selectedIndex === index}
			onclick={onselect === undefined ? undefined : () => onselect(index)}
		/>
	{/each}
</div>

<style lang="scss">
	.e-token-strip {
		display: flex;
		flex-wrap: wrap;
		gap: var(--e-space-2xs);
		align-items: flex-start;
	}
</style>
