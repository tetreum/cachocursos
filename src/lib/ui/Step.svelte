<script lang="ts">
	import { createTranslator } from '$i18n/locale';
	import { tick, untrack, type Snippet } from 'svelte';
	import type { ChallengeId } from '$content/types';
	import { getLesson } from './lesson.svelte';
	import Button from './Button.svelte';

	const t = createTranslator();

	interface StepProps {
		gate?: ChallengeId;
		title?: string;
		continueLabel?: string;
		children: Snippet;
	}

	let { gate, title, continueLabel, children }: StepProps = $props();

	const lesson = getLesson();
	const index = untrack(() => lesson.claimIndex(gate ?? null));

	let element = $state<HTMLElement | null>(null);

	const visible = $derived(lesson.isVisible(index));
	const isCurrent = $derived(lesson.cursor === index);
	const isLast = $derived(lesson.total > 0 && index === lesson.total - 1);
	const blocked = $derived(isCurrent && !lesson.canAdvance);

	$effect(() => {
		if (!isCurrent || index === 0 || element === null) return;
		const target = element;
		tick().then(() => {
			if (typeof target.scrollIntoView === 'function') {
				target.scrollIntoView({ behavior: 'smooth', block: 'start' });
			}
		});
	});
</script>

{#if visible}
	<section class="e-step" class:e-step--current={isCurrent} bind:this={element}>
		{#if title}
			<h2 class="e-step__title">{title}</h2>
		{/if}

		<div class="e-step__content">{@render children()}</div>

		{#if !isLast}
			<div class="e-step__actions">
				<Button
					variant="primary"
					disabled={!isCurrent || !lesson.canAdvance}
					onclick={() => lesson.advance()}
				>
					{continueLabel ?? t('STEP_CONTINUE')}
				</Button>
				{#if blocked}
					<span class="e-step__hint">{t('STEP_LOCKED_HINT')}</span>
				{/if}
			</div>
		{/if}
	</section>
{/if}

<style lang="scss">
	.e-step {
		display: flex;
		flex-direction: column;
		gap: var(--e-space-lg);
		padding-block: var(--e-space-2xl);
		scroll-margin-top: var(--e-space-lg);
		border-top: var(--e-border-width) solid var(--e-border);

		&:first-of-type {
			border-top: none;
		}

		&__title {
			@include measure;

			width: 100%;
			font-size: var(--e-text-2xl);
			color: var(--e-fg);
		}

		&__content {
			display: flex;
			flex-direction: column;
			gap: var(--e-space-lg);
		}

		&__actions {
			@include measure;

			display: flex;
			gap: var(--e-space-md);
			align-items: center;
			width: 100%;
		}

		&__hint {
			font-size: var(--e-text-sm);
			color: var(--e-fg-dim);
		}
	}
</style>
