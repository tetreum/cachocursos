<script lang="ts" module>
	export interface PromptBlock {
		id: string;
		label: string;
		snippet: string;
		quality: number;
		explanation: string;
	}
</script>

<script lang="ts">
	import type { ChallengeResult } from '$content/types';
	import Button from '$ui/Button.svelte';
	import ScorePill from '$ui/ScorePill.svelte';
	import { createCourseTranslator } from '../../i18n';

	const t = createCourseTranslator();

	interface PromptWorkshopProps {
		task: string;
		blocks: readonly PromptBlock[];
		badOutput: string;
		goodOutput: string;
		targetQuality: number;
		onsolve?: (result: ChallengeResult) => void;
	}

	let { task, blocks, badOutput, goodOutput, targetQuality, onsolve }: PromptWorkshopProps =
		$props();

	const PERCENT = 100;

	let selected = $state<string[]>([]);
	let announced = $state(false);

	const chosenBlocks = $derived(
		selected
			.map((id) => blocks.find((block) => block.id === id))
			.filter((block): block is PromptBlock => block !== undefined)
	);

	const quality = $derived(
		Math.min(
			1,
			chosenBlocks.reduce((total, block) => total + block.quality, 0)
		)
	);
	const solved = $derived(quality >= targetQuality);

	const promptText = $derived([task, ...chosenBlocks.map((block) => block.snippet)].join('\n\n'));

	function toggle(id: string): void {
		selected = selected.includes(id) ? selected.filter((entry) => entry !== id) : [...selected, id];
	}

	function clear(): void {
		selected = [];
		announced = false;
	}

	$effect(() => {
		if (!solved || announced) return;
		announced = true;
		onsolve?.({
			score: Math.round(quality * PERCENT),
			detail: { quality: `${Math.round(quality * PERCENT)}%`, blocks: selected.length }
		});
	});
</script>

<div class="e-workshop">
	<div class="e-workshop__scores">
		<ScorePill
			label={t('WORKSHOP_QUALITY')}
			value="{Math.round(quality * PERCENT)}%"
			tone={solved ? 'success' : 'accent'}
		/>
		<ScorePill label={t('WORKSHOP_TARGET')} value="{Math.round(targetQuality * PERCENT)}%" />
	</div>

	<div class="e-workshop__grid">
		<div class="e-workshop__column">
			<p class="e-workshop__label">{t('WORKSHOP_BLOCKS')}</p>
			<div class="e-workshop__blocks">
				{#each blocks as block (block.id)}
					<button
						class="e-workshop__block"
						class:e-workshop__block--on={selected.includes(block.id)}
						type="button"
						onclick={() => toggle(block.id)}
					>
						<span class="e-workshop__block-label">{block.label}</span>
						{#if selected.includes(block.id)}
							<span class="e-workshop__block-note">{block.explanation}</span>
						{/if}
					</button>
				{/each}
			</div>
			<Button variant="ghost" onclick={clear}>{t('WORKSHOP_CLEAR')}</Button>
		</div>

		<div class="e-workshop__column">
			<p class="e-workshop__label">{t('WORKSHOP_PROMPT')}</p>
			<pre class="e-workshop__prompt">{promptText}</pre>

			<p class="e-workshop__label">{t('WORKSHOP_OUTPUT')}</p>
			<div class="e-workshop__output" class:e-workshop__output--good={solved}>
				{solved ? goodOutput : badOutput}
			</div>
		</div>
	</div>
</div>

<style lang="scss">
	.e-workshop {
		display: flex;
		flex-direction: column;
		gap: var(--e-space-md);

		&__scores {
			display: flex;
			flex-wrap: wrap;
			gap: var(--e-space-xs);
		}

		&__grid {
			display: grid;
			grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr));
			gap: var(--e-space-md);
		}

		&__column {
			display: flex;
			flex-direction: column;
			gap: var(--e-space-xs);
			align-items: flex-start;
		}

		&__label {
			font-size: var(--e-text-2xs);
			font-weight: var(--e-weight-bold);
			color: var(--e-fg-dim);
			letter-spacing: var(--e-tracking-wide);
			text-transform: uppercase;
		}

		&__blocks {
			display: flex;
			flex-direction: column;
			gap: var(--e-space-2xs);
			width: 100%;
		}

		&__block {
			@include focus-ring;

			display: flex;
			flex-direction: column;
			gap: var(--e-space-3xs);
			align-items: flex-start;
			padding: var(--e-space-xs) var(--e-space-sm);
			text-align: left;
			background: var(--e-surface);
			border: var(--e-border-width) solid var(--e-border);
			border-radius: var(--e-radius-sm);

			&:hover {
				border-color: var(--e-border-strong);
			}

			&--on {
				background: var(--e-accent-soft);
				border-color: var(--e-accent);
			}
		}

		&__block-label {
			font-size: var(--e-text-sm);
			font-weight: var(--e-weight-medium);
			color: var(--e-fg);
		}

		&__block-note {
			font-size: var(--e-text-2xs);
			color: var(--e-fg-muted);
		}

		&__prompt {
			@include mono;

			width: 100%;
			max-height: 12rem;
			padding: var(--e-space-sm);
			margin: 0;
			overflow-y: auto;
			font-size: var(--e-text-xs);
			line-height: var(--e-leading-snug);
			color: var(--e-fg-muted);
			white-space: pre-wrap;
			background: var(--e-bg-subtle);
			border: var(--e-border-width) solid var(--e-border);
			border-radius: var(--e-radius-sm);
		}

		&__output {
			width: 100%;
			padding: var(--e-space-sm);
			font-size: var(--e-text-sm);
			color: var(--e-fg);
			white-space: pre-wrap;
			background: var(--e-danger-soft);
			border: var(--e-border-width) solid var(--e-danger);
			border-radius: var(--e-radius-sm);

			&--good {
				background: var(--e-success-soft);
				border-color: var(--e-success);
			}
		}
	}
</style>
