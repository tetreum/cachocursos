<script lang="ts">
	import { untrack } from 'svelte';
	import type { ChallengeResult } from '$content/types';
	import ScorePill from '$ui/ScorePill.svelte';
	import Button from '$ui/Button.svelte';
	import type { PassageSlot } from '../../models/passage';
	import {
		detect,
		createAttack,
		ATTACK_MAX_EDITS,
		DEFAULT_WATERMARK,
		DETECTION_THRESHOLD
	} from './engine';
	import { createCourseTranslator } from '../../i18n';

	interface AttackerProps {
		passage: readonly PassageSlot[];
		onsolve?: (result: ChallengeResult) => void;
	}

	let { passage, onsolve }: AttackerProps = $props();

	const t = createCourseTranslator();

	const deck = untrack(() => createAttack(passage));
	const ATTACK_TOKENS = deck.tokens;
	const ATTACK_VOCAB_SIZE = deck.vocabSize;
	const attackWord = deck.word;

	const PUNCTUATION = /^[.,]$/;
	const SPACE = ' ';

	const original = untrack(() => deck.markedPassage(DEFAULT_WATERMARK));
	const originalResult = untrack(() => detect(original, ATTACK_VOCAB_SIZE, DEFAULT_WATERMARK));

	let ids = $state<number[]>([...original]);
	let selected = $state<number | null>(null);
	let announced = $state(false);

	const result = $derived(detect(ids, ATTACK_VOCAB_SIZE, DEFAULT_WATERMARK));
	const editCount = $derived(ids.filter((id, index) => id !== original[index]).length);
	const budgetLeft = $derived(ATTACK_MAX_EDITS - editCount);
	const evaded = $derived(result.z < DETECTION_THRESHOLD);
	const failed = $derived(budgetLeft <= 0 && !evaded);
	const finished = $derived(evaded || failed);

	const options = $derived(selected === null ? [] : ATTACK_TOKENS[selected].options);

	function isSwappable(index: number): boolean {
		return ATTACK_TOKENS[index].options.length > 1;
	}

	function select(index: number): void {
		if (finished || !isSwappable(index)) return;
		selected = selected === index ? null : index;
	}

	function replace(newId: number): void {
		if (selected === null || finished) return;
		const wasEdited = ids[selected] !== original[selected];
		const returningToOriginal = newId === original[selected];
		if (!wasEdited && !returningToOriginal && budgetLeft <= 0) return;
		const next = ids.slice();
		next[selected] = newId;
		ids = next;
		selected = null;
	}

	function restart(): void {
		ids = [...original];
		selected = null;
		announced = false;
	}

	$effect(() => {
		if (!evaded || announced) return;
		announced = true;
		onsolve?.({
			score: Math.max(1, ATTACK_MAX_EDITS - editCount + 1),
			detail: {
				z: result.z.toFixed(2),
				edits: editCount,
				initialZ: originalResult.z.toFixed(2)
			}
		});
	});
</script>

<div class="e-attacker">
	<div class="e-attacker__scores">
		<ScorePill
			label={t('GENERATOR_Z')}
			value={result.z.toFixed(2)}
			tone={evaded ? 'success' : 'danger'}
		/>
		<ScorePill label={t('ATTACKER_THRESHOLD')} value={DETECTION_THRESHOLD.toFixed(1)} />
		<ScorePill
			label={t('ATTACKER_SYNONYMS_USED')}
			value="{editCount} / {ATTACK_MAX_EDITS}"
			tone={failed ? 'danger' : 'neutral'}
		/>
		<ScorePill label={t('GENERATOR_GREEN')} value="{result.greenCount} / {result.total}" />
	</div>

	<p class="e-attacker__instruction">
		{t('ATTACKER_INSTRUCTION_HEAD')}
		<strong>{t('ATTACKER_INSTRUCTION_STRONG')}</strong>{t('ATTACKER_INSTRUCTION_TAIL')}
	</p>

	<p class="e-attacker__text">
		{#each ids as id, index (index)}
			{@const word = attackWord(id)}
			{@const green = result.perToken[index] === 1}
			{@const edited = id !== original[index]}
			{@const swappable = isSwappable(index)}
			{#if !PUNCTUATION.test(word) && index > 0}{SPACE}{/if}<span
				class="e-attacker__slot"
				class:e-attacker__slot--green={green}
				class:e-attacker__slot--red={!green}
				class:e-attacker__slot--swappable={swappable && !finished}
				class:e-attacker__slot--selected={selected === index}
				class:e-attacker__slot--edited={edited}
			>
				{#if swappable && !finished}
					<button type="button" class="e-attacker__swap" onclick={() => select(index)}>
						{word}
					</button>
				{:else}
					{word}
				{/if}
			</span>
		{/each}
	</p>

	{#if selected !== null && !finished}
		{@const activeIndex = selected}
		<div class="e-attacker__picker">
			<p class="e-attacker__picker-title">
				{t('ATTACKER_PICKER_TITLE', { word: attackWord(original[activeIndex]) })}
			</p>
			<div class="e-attacker__options">
				{#each options as optionId (optionId)}
					{@const isCurrent = ids[activeIndex] === optionId}
					<button
						class="e-attacker__option"
						class:e-attacker__option--current={isCurrent}
						type="button"
						disabled={isCurrent}
						onclick={() => replace(optionId)}
					>
						{attackWord(optionId)}
						{#if optionId === original[activeIndex]}
							<span class="e-attacker__option-tag">{t('ATTACKER_ORIGINAL')}</span>
						{/if}
					</button>
				{/each}
			</div>
		</div>
	{/if}

	{#if evaded}
		<div class="e-attacker__verdict e-attacker__verdict--won">
			<p class="e-attacker__verdict-title">{t('ATTACKER_WON_TITLE')}</p>
			<p class="e-attacker__verdict-body">
				{t('ATTACKER_WON_BODY', {
					edits: editCount,
					before: originalResult.z.toFixed(2),
					after: result.z.toFixed(2)
				})}
			</p>
		</div>
	{:else if failed}
		<div class="e-attacker__verdict">
			<p class="e-attacker__verdict-title">{t('ATTACKER_FAILED_TITLE')}</p>
			<p class="e-attacker__verdict-body">
				{t('ATTACKER_FAILED_BODY', { z: result.z.toFixed(2) })}
			</p>
			<Button onclick={restart}>{t('COMMON_RESTART')}</Button>
		</div>
	{:else}
		<Button variant="ghost" onclick={restart}>{t('ATTACKER_RESET')}</Button>
	{/if}
</div>

<style lang="scss">
	.e-attacker {
		display: flex;
		flex-direction: column;
		gap: var(--e-space-md);
		align-items: flex-start;

		&__scores {
			display: flex;
			flex-wrap: wrap;
			gap: var(--e-space-xs);
		}

		&__instruction {
			font-size: var(--e-text-sm);
			color: var(--e-fg-muted);
		}

		&__text {
			width: 100%;
			padding: var(--e-space-md);
			font-size: var(--e-text-lg);
			line-height: 2.1;
			color: var(--e-fg);
			background: var(--e-bg-subtle);
			border: var(--e-border-width) solid var(--e-border);
			border-radius: var(--e-radius-md);
		}

		&__slot {
			padding: 2px 3px;
			border-radius: var(--e-radius-xs);

			&--green {
				background: color-mix(in oklab, var(--e-green-list) 22%, transparent);
			}

			&--red {
				background: color-mix(in oklab, var(--e-red-list) 14%, transparent);
			}

			&--swappable {
				text-decoration: underline;
				text-decoration-style: dotted;
				text-underline-offset: 4px;
			}

			&--selected {
				outline: 2px solid var(--e-accent);
			}

			&--edited {
				font-style: italic;
			}
		}

		&__swap {
			@include focus-ring;

			padding: 0;
			font: inherit;
			color: inherit;
			background: none;
		}

		&__picker {
			display: flex;
			flex-direction: column;
			gap: var(--e-space-xs);
			width: 100%;
			padding: var(--e-space-md);
			background: var(--e-surface);
			border: var(--e-border-width) solid var(--e-accent);
			border-radius: var(--e-radius-md);
		}

		&__picker-title {
			font-size: var(--e-text-sm);
			color: var(--e-fg-muted);
		}

		&__options {
			display: flex;
			flex-wrap: wrap;
			gap: var(--e-space-xs);
		}

		&__option {
			@include focus-ring;

			display: inline-flex;
			gap: var(--e-space-2xs);
			align-items: baseline;
			padding: var(--e-space-3xs) var(--e-space-sm);
			font-size: var(--e-text-md);
			color: var(--e-fg);
			background: var(--e-surface-2);
			border: var(--e-border-width) solid var(--e-border);
			border-radius: var(--e-radius-sm);

			&:hover:not(:disabled) {
				border-color: var(--e-accent);
			}

			&--current {
				color: var(--e-fg-dim);
				border-style: dashed;
			}
		}

		&__option-tag {
			font-size: var(--e-text-2xs);
			color: var(--e-fg-dim);
		}

		&__verdict {
			display: flex;
			flex-direction: column;
			gap: var(--e-space-xs);
			align-items: flex-start;
			width: 100%;
			padding: var(--e-space-md);
			background: var(--e-danger-soft);
			border: var(--e-border-width) solid var(--e-danger);
			border-radius: var(--e-radius-md);

			&--won {
				background: var(--e-success-soft);
				border-color: var(--e-success);
			}
		}

		&__verdict-title {
			font-size: var(--e-text-md);
			font-weight: var(--e-weight-semibold);
			color: var(--e-fg);
		}

		&__verdict-body {
			font-size: var(--e-text-sm);
			color: var(--e-fg-muted);
		}
	}
</style>
