<script lang="ts" module>
	export interface BlockPiece {
		id: string;
		label: string;
		detail: string;
		missingConsequence: string;
	}
</script>

<script lang="ts">
	import { untrack } from 'svelte';
	import { mulberry32, shuffled } from '$utils/rng';
	import type { ChallengeResult } from '$content/types';
	import DraggableList, { type DraggableItem } from '$ui/DraggableList.svelte';
	import Button from '$ui/Button.svelte';
	import { createCourseTranslator } from '../../i18n';

	interface BlockBuilderProps {
		pieces: readonly BlockPiece[];
		/** La frase de ejemplo que entra por arriba. */
		sample: string;
		onsolve?: (result: ChallengeResult) => void;
	}

	let { pieces, sample, onsolve }: BlockBuilderProps = $props();

	const t = createCourseTranslator();

	const SHUFFLE_SEED = 31337;

	const correctOrder = untrack(() => pieces.map((piece) => piece.id));
	const pieceById = untrack(() => new Map(pieces.map((piece) => [piece.id, piece])));

	let items = $state<DraggableItem[]>(
		untrack(() =>
			shuffled(
				pieces.map((piece) => ({ id: piece.id, label: piece.label, detail: piece.detail })),
				mulberry32(SHUFFLE_SEED)
			)
		)
	);
	let checked = $state(false);
	let attempts = $state(0);
	let announced = $state(false);

	const isCorrect = $derived(items.every((item, index) => item.id === correctOrder[index]));

	const firstWrongIndex = $derived(
		items.findIndex((item, index) => item.id !== correctOrder[index])
	);

	const diagnosis = $derived.by((): string | null => {
		if (!checked || isCorrect || firstWrongIndex < 0) return null;
		const expectedId = correctOrder[firstWrongIndex];
		const expected = pieceById.get(expectedId);
		if (expected === undefined) return null;
		return expected.missingConsequence;
	});

	function statusOf(item: DraggableItem, index: number): 'neutral' | 'correct' | 'wrong' {
		if (!checked) return 'neutral';
		return item.id === correctOrder[index] ? 'correct' : 'wrong';
	}

	function check(): void {
		checked = true;
		attempts += 1;
	}

	function keepTrying(): void {
		checked = false;
	}

	$effect(() => {
		if (!checked || !isCorrect || announced) return;
		announced = true;
		onsolve?.({ score: Math.max(1, 100 - (attempts - 1) * 10), detail: { attempts: attempts } });
	});
</script>

<div class="e-block">
	<p class="e-block__instruction">
		{t('BLOCK_INSTRUCTION')}
	</p>

	<div class="e-block__flow">
		<span class="e-block__terminal">
			{t('BLOCK_IN')}
			<strong>{t('BLOCK_IN_STRONG')}</strong>
			<span class="e-block__terminal-note">{sample}</span>
		</span>
		<DraggableList
			bind:items
			statusOf={checked ? statusOf : undefined}
			disabled={checked && isCorrect}
		/>
		<span class="e-block__terminal">
			{t('BLOCK_OUT')}
			<strong>{t('BLOCK_OUT_STRONG')}</strong>
			{t('BLOCK_OUT_TAIL')}
		</span>
	</div>

	{#if checked}
		<div class="e-block__verdict" class:e-block__verdict--right={isCorrect}>
			{#if isCorrect}
				<p class="e-block__verdict-title">{t('BLOCK_RIGHT_TITLE')}</p>
				<p class="e-block__verdict-body">
					{t('BLOCK_RIGHT_BODY_HEAD')}
					<strong>{t('BLOCK_RIGHT_BODY_STRONG')}</strong>
					{t('BLOCK_RIGHT_BODY_TAIL')}
				</p>
			{:else}
				<p class="e-block__verdict-title">{t('BLOCK_WRONG_TITLE')}</p>
				<p class="e-block__verdict-body">{diagnosis}</p>
				<Button onclick={keepTrying}>{t('BLOCK_KEEP_TRYING')}</Button>
			{/if}
		</div>
	{:else}
		<Button variant="primary" onclick={check}>{t('BLOCK_CHECK')}</Button>
	{/if}
</div>

<style lang="scss">
	.e-block {
		display: flex;
		flex-direction: column;
		gap: var(--e-space-md);
		align-items: flex-start;

		&__instruction {
			font-size: var(--e-text-sm);
			color: var(--e-fg-muted);
		}

		&__flow {
			display: flex;
			flex-direction: column;
			gap: var(--e-space-xs);
			width: 100%;
		}

		&__terminal {
			@include mono;

			display: flex;
			flex-direction: column;
			gap: 2px;
			align-self: center;
			padding: var(--e-space-2xs) var(--e-space-md);
			font-size: var(--e-text-2xs);
			color: var(--e-fg-muted);
			text-align: center;
			background: var(--e-surface-2);
			border-radius: var(--e-radius-md);

			strong {
				color: var(--e-fg);
			}
		}

		&__terminal-note {
			font-size: var(--e-text-2xs);
			font-style: italic;
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

			&--right {
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
