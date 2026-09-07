<script lang="ts">
	import { untrack } from 'svelte';
	import { initBpe, trainBpe, encodeWord, END_OF_WORD } from '../../models/bpe';
	import TokenStrip from '../../ui/TokenStrip.svelte';
	import type { TokenizerDemoData } from '../../data/types';
	import { createCourseTranslator } from '../../i18n';

	interface TokenizerDemoProps {
		corpus: string;
		merges: number;
		demo: TokenizerDemoData;
	}

	let { corpus, merges, demo }: TokenizerDemoProps = $props();

	const t = createCourseTranslator();

	const trained = untrack(() => trainBpe(initBpe(corpus), merges));

	let word = $state(untrack(() => demo.defaultWord));

	const cleaned = $derived(word.trim().toLowerCase());
	const tokens = $derived(cleaned.length === 0 ? [] : encodeWord(cleaned, trained.merges));
	const letterCount = $derived(Array.from(cleaned).length);
	const letterTotal = $derived(
		Array.from(cleaned).filter((letter) => letter === demo.letter).length
	);
	const letterName = $derived(letterTotal === 1 ? demo.letterOne : demo.letterMany);
	const tokensHidingLetter = $derived(
		tokens.filter(
			(token) => token.replaceAll(END_OF_WORD, '').length > 1 && token.includes(demo.letter)
		).length
	);
</script>

<div class="e-tokenizer">
	<label class="e-tokenizer__field">
		<span class="e-tokenizer__label">{t('TOKENIZER_FIELD_LABEL')}</span>
		<input class="e-tokenizer__input" type="text" bind:value={word} spellcheck="false" />
	</label>

	<div class="e-tokenizer__suggestions">
		{#each demo.suggestions as suggestion (suggestion)}
			<button class="e-tokenizer__suggestion" type="button" onclick={() => (word = suggestion)}>
				{suggestion}
			</button>
		{/each}
	</div>

	{#if tokens.length > 0}
		<div class="e-tokenizer__output">
			<TokenStrip
				{tokens}
				hues={tokens.map((token) => token.length - 1)}
				subs={tokens.map((_, index) => String(index + 1))}
			/>
			<p class="e-tokenizer__stats">
				{t('TOKENIZER_STATS', { letters: letterCount })}
				<strong>{t('TOKENIZER_STATS_TOKENS', { count: tokens.length })}</strong>.
				{#if letterTotal > 0}
					{t('TOKENIZER_HAS_LETTERS', { count: letterTotal, name: letterName })}
					{#if tokensHidingLetter > 0}
						{t('TOKENIZER_HIDDEN', { count: tokensHidingLetter })}
						<strong>{t('TOKENIZER_HIDDEN_STRONG')}</strong>{t('TOKENIZER_HIDDEN_TAIL')}
					{:else}
						{t('TOKENIZER_VISIBLE')}
					{/if}
				{/if}
			</p>
		</div>
	{/if}
</div>

<style lang="scss">
	.e-tokenizer {
		display: flex;
		flex-direction: column;
		gap: var(--e-space-md);
		padding: var(--e-space-md);
		background: var(--e-bg-subtle);
		border: var(--e-border-width) solid var(--e-border);
		border-radius: var(--e-radius-md);

		&__field {
			display: flex;
			flex-direction: column;
			gap: var(--e-space-2xs);
		}

		&__label {
			font-size: var(--e-text-2xs);
			font-weight: var(--e-weight-bold);
			color: var(--e-fg-dim);
			letter-spacing: var(--e-tracking-wide);
			text-transform: uppercase;
		}

		&__input {
			@include mono;
			@include focus-ring;

			padding: var(--e-space-xs) var(--e-space-sm);
			font-size: var(--e-text-lg);
			background: var(--e-surface);
			border: var(--e-border-width) solid var(--e-border);
			border-radius: var(--e-radius-sm);
		}

		&__suggestions {
			display: flex;
			flex-wrap: wrap;
			gap: var(--e-space-2xs);
		}

		&__suggestion {
			@include focus-ring;

			padding: var(--e-space-3xs) var(--e-space-xs);
			font-size: var(--e-text-xs);
			color: var(--e-fg-muted);
			background: var(--e-surface-2);
			border-radius: var(--e-radius-pill);

			&:hover {
				color: var(--e-fg);
				background: var(--e-surface-3);
			}
		}

		&__output {
			display: flex;
			flex-direction: column;
			gap: var(--e-space-sm);
		}

		&__stats {
			font-size: var(--e-text-sm);
			color: var(--e-fg-muted);

			strong {
				color: var(--e-fg);
			}
		}
	}
</style>
