<script lang="ts">
	import { untrack } from 'svelte';
	import { initBpe, trainBpe, encodeWord, END_OF_WORD } from '../../models/bpe';
	import TokenChip from '../../ui/TokenChip.svelte';
	import { createCourseTranslator } from '../../i18n';

	interface DigitTokensProps {
		corpus: string;
		merges: number;
		placeValues: readonly string[];
	}

	let { corpus, merges, placeValues }: DigitTokensProps = $props();

	const t = createCourseTranslator();

	const PRESETS = ['1200', '1250', '347', '48395716'];

	const trained = untrack(() => trainBpe(initBpe(corpus), merges));

	let value = $state('1200');

	const cleaned = $derived(value.replace(/[^0-9]/g, ''));
	const naive = $derived(
		cleaned.length === 0 ? [] : encodeWord(cleaned, trained.merges).filter((t) => t !== END_OF_WORD)
	);
	const digitwise = $derived(Array.from(cleaned));
	const swallowed = $derived(naive.some((token) => token.length > 1));
</script>

<div class="e-digits">
	<div class="e-digits__controls">
		<label class="e-digits__field">
			<span class="e-digits__label">{t('DIGITS_FIELD_LABEL')}</span>
			<input class="e-digits__input" type="text" bind:value inputmode="numeric" />
		</label>
		<div class="e-digits__presets">
			{#each PRESETS as preset (preset)}
				<button class="e-digits__preset" type="button" onclick={() => (value = preset)}>
					{preset}
				</button>
			{/each}
		</div>
	</div>

	<div class="e-digits__rows">
		<div class="e-digits__row">
			<span class="e-digits__row-label">
				{t('DIGITS_LEARNED')}
				<span class="e-digits__count">
					{naive.length === 1
						? t('DIGITS_COUNT_ONE', { count: naive.length })
						: t('DIGITS_COUNT', { count: naive.length })}
				</span>
			</span>
			<div class="e-digits__strip">
				{#each naive as token, index (index)}
					<TokenChip text={token} tone={token.length > 1 ? 'red' : 'neutral'} />
				{/each}
			</div>
		</div>

		<div class="e-digits__row">
			<span class="e-digits__row-label">
				{t('DIGITS_DIGITWISE')}
				<span class="e-digits__count">{t('DIGITS_COUNT', { count: digitwise.length })}</span>
			</span>
			<div class="e-digits__strip">
				{#each digitwise as digit, index (index)}
					<TokenChip text={digit} tone="green" sub={placeValues[digitwise.length - 1 - index]} />
				{/each}
			</div>
		</div>
	</div>

	<p class="e-digits__reading">
		{#if swallowed}
			{t('DIGITS_SWALLOWED_HEAD')}
			<strong>{t('DIGITS_SWALLOWED_STRONG')}</strong>{t('DIGITS_SWALLOWED_TAIL')}
		{:else}
			{t('DIGITS_SPLIT_HEAD')}
			<strong>{t('DIGITS_SPLIT_STRONG')}</strong>{t('DIGITS_SPLIT_TAIL')}
		{/if}
	</p>

	<p class="e-digits__note">
		{t('DIGITS_NOTE')}
	</p>
</div>

<style lang="scss">
	.e-digits {
		display: flex;
		flex-direction: column;
		gap: var(--e-space-md);
		padding: var(--e-space-md);
		background: var(--e-bg-subtle);
		border: var(--e-border-width) solid var(--e-border);
		border-radius: var(--e-radius-md);

		&__controls {
			display: flex;
			flex-wrap: wrap;
			gap: var(--e-space-md);
			align-items: flex-end;
		}

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

			width: 12rem;
			padding: var(--e-space-2xs) var(--e-space-sm);
			font-size: var(--e-text-lg);
			background: var(--e-surface);
			border: var(--e-border-width) solid var(--e-border);
			border-radius: var(--e-radius-sm);
		}

		&__presets {
			display: flex;
			flex-wrap: wrap;
			gap: var(--e-space-2xs);
		}

		&__preset {
			@include mono;
			@include focus-ring;

			padding: var(--e-space-3xs) var(--e-space-xs);
			font-size: var(--e-text-xs);
			color: var(--e-fg-muted);
			background: var(--e-surface-2);
			border-radius: var(--e-radius-pill);

			&:hover {
				color: var(--e-fg);
			}
		}

		&__rows {
			display: flex;
			flex-direction: column;
			gap: var(--e-space-sm);
		}

		&__row {
			display: flex;
			flex-wrap: wrap;
			gap: var(--e-space-xs);
			align-items: center;
		}

		&__row-label {
			display: flex;
			flex-direction: column;
			min-width: 11rem;
			font-size: var(--e-text-2xs);
			color: var(--e-fg-dim);
			letter-spacing: var(--e-tracking-wide);
			text-transform: uppercase;
		}

		&__count {
			@include mono;

			font-size: var(--e-text-xs);
			color: var(--e-fg-muted);
			letter-spacing: normal;
			text-transform: none;
		}

		&__strip {
			display: flex;
			flex-wrap: wrap;
			gap: var(--e-space-2xs);
		}

		&__reading {
			font-size: var(--e-text-sm);
			color: var(--e-fg-muted);
		}

		&__note {
			font-size: var(--e-text-2xs);
			color: var(--e-fg-dim);
		}
	}
</style>
