<script lang="ts">
	import { untrack } from 'svelte';
	import { routeTokens, collapsedRouting, type Expert, type RoutableToken } from '../../models/moe';
	import type { ChallengeResult } from '$content/types';
	import Button from '$ui/Button.svelte';
	import ScorePill from '$ui/ScorePill.svelte';
	import { createCourseTranslator } from '../../i18n';

	interface RouterGameProps {
		experts: readonly Expert[];
		tokens: readonly RoutableToken[];
		capacity: number;
		target: number;
		onsolve?: (result: ChallengeResult) => void;
	}

	let { experts, tokens, capacity, target, onsolve }: RouterGameProps = $props();

	const t = createCourseTranslator();

	const PERCENT = 100;

	let assignment = $state<(number | null)[]>(untrack(() => tokens.map(() => null)));
	let selected = $state<number | null>(null);
	let revealed = $state(false);
	let announced = $state(false);

	const outcome = $derived(routeTokens(tokens, assignment, experts.length, capacity));
	const placed = $derived(assignment.filter((value) => value !== null).length);
	const allPlaced = $derived(placed === tokens.length);
	const reached = $derived(allPlaced && outcome.ratio >= target);

	const collapsed = $derived(
		routeTokens(tokens, collapsedRouting(tokens, experts.length), experts.length, capacity)
	);

	function pick(index: number): void {
		if (reached) return;
		selected = selected === index ? null : index;
	}

	function assign(expert: number): void {
		if (selected === null || reached) return;
		const next = assignment.slice();
		next[selected] = expert;
		assignment = next;
		selected = null;
	}

	function unassign(index: number): void {
		if (reached) return;
		const next = assignment.slice();
		next[index] = null;
		assignment = next;
		selected = null;
	}

	function clear(): void {
		assignment = tokens.map(() => null);
		selected = null;
	}

	function tokensIn(expert: number): number[] {
		const found: number[] = [];
		assignment.forEach((value, index) => {
			if (value === expert) found.push(index);
		});
		return found;
	}

	$effect(() => {
		if (!reached || announced) return;
		announced = true;
		onsolve?.({
			score: Math.round(outcome.ratio * PERCENT),
			detail: {
				quality: `${Math.round(outcome.ratio * PERCENT)}%`,
				descartados: outcome.droppedCount
			}
		});
	});
</script>

<div class="e-router">
	<div class="e-router__scores">
		<ScorePill
			label={t('ROUTER_QUALITY')}
			value="{Math.round(outcome.ratio * PERCENT)}%"
			tone={reached ? 'success' : 'accent'}
		/>
		<ScorePill label={t('ROUTER_TARGET')} value="{Math.round(target * PERCENT)}%" />
		<ScorePill label={t('ROUTER_PLACED')} value="{placed} / {tokens.length}" />
		<ScorePill
			label={t('ROUTER_DROPPED')}
			value={String(outcome.droppedCount)}
			tone={outcome.droppedCount > 0 ? 'danger' : 'neutral'}
		/>
	</div>

	<p class="e-router__instruction">
		{t('ROUTER_INSTRUCTION_HEAD')}
		<strong>{t('ROUTER_INSTRUCTION_STRONG', { capacity })}</strong>{t('ROUTER_INSTRUCTION_TAIL')}
	</p>

	<div class="e-router__pool">
		{#each tokens as token, index (token.id)}
			{#if assignment[index] === null}
				<button
					class="e-router__token"
					class:e-router__token--selected={selected === index}
					type="button"
					onclick={() => pick(index)}
				>
					{token.text}
					<span class="e-router__kind">{token.kind}</span>
				</button>
			{/if}
		{/each}
		{#if allPlaced}
			<span class="e-router__empty">{t('ROUTER_ALL_PLACED')}</span>
		{/if}
	</div>

	<div class="e-router__experts">
		{#each experts as expert, expertIndex (expert.id)}
			{@const held = tokensIn(expertIndex)}
			{@const overflowing = held.length > capacity}
			<div
				class="e-router__expert"
				class:e-router__expert--full={held.length === capacity}
				class:e-router__expert--over={overflowing}
			>
				<div class="e-router__expert-head">
					<span class="e-router__expert-name">{expert.name}</span>
					<span class="e-router__load">{held.length}/{capacity}</span>
				</div>

				<button
					class="e-router__drop"
					type="button"
					disabled={selected === null || reached}
					onclick={() => assign(expertIndex)}
				>
					{selected === null ? t('ROUTER_PICK_FIRST') : t('ROUTER_SEND_HERE')}
				</button>

				<div class="e-router__held">
					{#each held as tokenIndex, position (tokens[tokenIndex].id)}
						<button
							class="e-router__chip"
							class:e-router__chip--dropped={position >= capacity}
							type="button"
							title={position >= capacity ? t('ROUTER_CHIP_DROPPED') : t('ROUTER_CHIP_REMOVE')}
							onclick={() => unassign(tokenIndex)}
						>
							{tokens[tokenIndex].text}
							{#if revealed}
								<span class="e-router__affinity">
									{tokens[tokenIndex].affinity[expertIndex].toFixed(2)}
								</span>
							{/if}
						</button>
					{/each}
				</div>

				{#if revealed}
					<p class="e-router__blurb">{expert.blurb}</p>
				{/if}
			</div>
		{/each}
	</div>

	<div class="e-router__actions">
		<Button variant="ghost" onclick={clear}>{t('ROUTER_CLEAR')}</Button>
		<Button onclick={() => (revealed = !revealed)}>
			{revealed ? t('ROUTER_HIDE_AFFINITIES') : t('ROUTER_SHOW_AFFINITIES')}
		</Button>
	</div>

	{#if reached}
		<div class="e-router__verdict e-router__verdict--won">
			<p class="e-router__verdict-title">
				{t('ROUTER_WON_TITLE', { quality: Math.round(outcome.ratio * PERCENT) })}
			</p>
			<p class="e-router__verdict-body">
				{t('ROUTER_WON_BODY_HEAD')}
				<em>{t('ROUTER_WON_BODY_EM')}</em>
				{t('ROUTER_WON_BODY_TAIL')}
			</p>
		</div>
	{:else if allPlaced}
		<div class="e-router__verdict">
			<p class="e-router__verdict-title">{t('ROUTER_FAILED_TITLE')}</p>
			<p class="e-router__verdict-body">
				{#if outcome.droppedCount > 0}
					{t('ROUTER_FAILED_DROPPED', { count: outcome.droppedCount })}
				{:else}
					{t('ROUTER_FAILED_MISMATCH')}
				{/if}
			</p>
		</div>
	{/if}

	<p class="e-router__aside">
		{t('ROUTER_ASIDE_HEAD', { total: tokens.length })}
		<strong>{Math.round(collapsed.ratio * PERCENT)}%</strong>
		{t('ROUTER_ASIDE_MIDDLE', { dropped: collapsed.droppedCount })}
		<em>{t('ROUTER_ASIDE_EM')}</em>{t('ROUTER_ASIDE_TAIL')}
	</p>
</div>

<style lang="scss">
	.e-router {
		display: flex;
		flex-direction: column;
		gap: var(--e-space-md);

		&__scores {
			display: flex;
			flex-wrap: wrap;
			gap: var(--e-space-xs);
		}

		&__instruction {
			font-size: var(--e-text-sm);
			color: var(--e-fg-muted);
		}

		&__pool {
			display: flex;
			flex-wrap: wrap;
			gap: var(--e-space-xs);
			align-items: center;
			min-height: 3.5rem;
			padding: var(--e-space-sm);
			background: var(--e-bg-subtle);
			border: var(--e-border-width) dashed var(--e-border-strong);
			border-radius: var(--e-radius-md);
		}

		&__token {
			@include mono;
			@include focus-ring;

			display: inline-flex;
			flex-direction: column;
			gap: 1px;
			align-items: center;
			padding: var(--e-space-2xs) var(--e-space-sm);
			font-size: var(--e-text-sm);
			color: var(--e-fg);
			background: var(--e-surface);
			border: var(--e-border-width) solid var(--e-border);
			border-radius: var(--e-radius-sm);

			&:hover {
				border-color: var(--e-accent);
			}

			&--selected {
				background: var(--e-accent-soft);
				border-color: var(--e-accent);
			}
		}

		&__kind {
			font-size: var(--e-text-2xs);
			color: var(--e-fg-dim);
		}

		&__empty {
			font-size: var(--e-text-sm);
			color: var(--e-fg-dim);
		}

		&__experts {
			display: grid;
			grid-template-columns: repeat(auto-fit, minmax(11rem, 1fr));
			gap: var(--e-space-sm);
		}

		&__expert {
			display: flex;
			flex-direction: column;
			gap: var(--e-space-xs);
			padding: var(--e-space-sm);
			background: var(--e-surface);
			border: var(--e-border-width) solid var(--e-border);
			border-radius: var(--e-radius-md);

			&--full {
				border-color: var(--e-accent-2);
			}

			&--over {
				border-color: var(--e-danger);
			}
		}

		&__expert-head {
			display: flex;
			align-items: baseline;
			justify-content: space-between;
		}

		&__expert-name {
			font-size: var(--e-text-sm);
			font-weight: var(--e-weight-semibold);
			color: var(--e-fg);
		}

		&__load {
			@include mono;

			font-size: var(--e-text-2xs);
			color: var(--e-fg-dim);
		}

		&__drop {
			@include focus-ring;

			padding: var(--e-space-3xs) var(--e-space-xs);
			font-size: var(--e-text-2xs);
			color: var(--e-fg-muted);
			letter-spacing: var(--e-tracking-wide);
			text-transform: uppercase;
			background: var(--e-surface-2);
			border-radius: var(--e-radius-sm);

			&:disabled {
				opacity: 0.4;
			}

			&:hover:not(:disabled) {
				color: var(--e-accent);
			}
		}

		&__held {
			display: flex;
			flex-wrap: wrap;
			gap: var(--e-space-3xs);
			min-height: 1.5rem;
		}

		&__chip {
			@include mono;
			@include focus-ring;

			display: inline-flex;
			gap: var(--e-space-3xs);
			align-items: baseline;
			padding: 1px var(--e-space-2xs);
			font-size: var(--e-text-xs);
			color: var(--e-fg);
			background: var(--e-surface-2);
			border-radius: var(--e-radius-xs);

			&--dropped {
				color: var(--e-danger);
				text-decoration: line-through;
				background: var(--e-danger-soft);
			}
		}

		&__affinity {
			font-size: var(--e-text-2xs);
			color: var(--e-fg-dim);
		}

		&__blurb {
			font-size: var(--e-text-2xs);
			color: var(--e-accent-2);
		}

		&__actions {
			display: flex;
			flex-wrap: wrap;
			gap: var(--e-space-xs);
		}

		&__verdict {
			display: flex;
			flex-direction: column;
			gap: var(--e-space-2xs);
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

		&__aside {
			font-size: var(--e-text-2xs);
			color: var(--e-fg-dim);
		}
	}
</style>
