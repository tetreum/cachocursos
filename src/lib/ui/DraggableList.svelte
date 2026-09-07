<script lang="ts" module>
	export interface DraggableItem {
		id: string;
		label: string;
		detail?: string;
	}

	export function moveItem<Item>(items: readonly Item[], from: number, to: number): Item[] {
		const result = items.slice();
		if (from < 0 || from >= result.length || to < 0 || to >= result.length) return result;
		const [held] = result.splice(from, 1);
		result.splice(to, 0, held);
		return result;
	}
</script>

<script lang="ts">
	interface DraggableListProps {
		items: DraggableItem[];
		statusOf?: (item: DraggableItem, index: number) => 'neutral' | 'correct' | 'wrong';
		disabled?: boolean;
		onreorder?: (items: DraggableItem[]) => void;
	}

	let { items = $bindable(), statusOf, disabled = false, onreorder }: DraggableListProps = $props();

	let grabbedIndex = $state<number | null>(null);

	function apply(from: number, to: number): void {
		if (from === to) return;
		items = moveItem(items, from, to);
		onreorder?.(items);
	}

	function handleKey(event: KeyboardEvent, index: number): void {
		if (disabled) return;
		if (event.key === ' ' || event.key === 'Enter') {
			event.preventDefault();
			grabbedIndex = grabbedIndex === index ? null : index;
			return;
		}
		const direction = event.key === 'ArrowUp' ? -1 : event.key === 'ArrowDown' ? 1 : 0;
		if (direction === 0) return;
		event.preventDefault();
		const target = index + direction;
		if (target < 0 || target >= items.length) return;
		apply(index, target);
		grabbedIndex = target;
		queueMicrotask(() => {
			const next = document.querySelectorAll<HTMLElement>('[data-draggable-row]')[target];
			next?.focus();
		});
	}

	function handleDragStart(event: DragEvent, index: number): void {
		if (disabled) return;
		grabbedIndex = index;
		event.dataTransfer?.setData('text/plain', String(index));
	}

	function handleDrop(event: DragEvent, index: number): void {
		if (disabled || grabbedIndex === null) return;
		event.preventDefault();
		apply(grabbedIndex, index);
		grabbedIndex = null;
	}
</script>

<ol class="e-draggable">
	{#each items as item, index (item.id)}
		{@const status = statusOf?.(item, index) ?? 'neutral'}
		<li
			class="e-draggable__row e-draggable__row--{status}"
			class:e-draggable__row--grabbed={grabbedIndex === index}
			data-draggable-row
			draggable={!disabled}
			tabindex="0"
			role="option"
			aria-selected={grabbedIndex === index}
			ondragstart={(event) => handleDragStart(event, index)}
			ondragover={(event) => event.preventDefault()}
			ondrop={(event) => handleDrop(event, index)}
			onkeydown={(event) => handleKey(event, index)}
		>
			<span class="e-draggable__position">{index + 1}</span>
			<span class="e-draggable__body">
				<span class="e-draggable__label">{item.label}</span>
				{#if item.detail}
					<span class="e-draggable__detail">{item.detail}</span>
				{/if}
			</span>
			<span class="e-draggable__grip" aria-hidden="true">⠿</span>
		</li>
	{/each}
</ol>

<style lang="scss">
	.e-draggable {
		display: flex;
		flex-direction: column;
		gap: var(--e-space-2xs);
		padding: 0;
		margin: 0;
		list-style: none;

		&__row {
			display: grid;
			grid-template-columns: 2rem 1fr 1.5rem;
			gap: var(--e-space-xs);
			align-items: center;
			padding: var(--e-space-xs) var(--e-space-sm);
			cursor: grab;
			background: var(--e-surface);
			border: var(--e-border-width) solid var(--e-border);
			border-radius: var(--e-radius-sm);
			transition: border-color var(--e-dur-fast) var(--e-ease-out);

			@include focus-ring;

			&:hover {
				border-color: var(--e-border-strong);
			}

			&--grabbed {
				cursor: grabbing;
				border-color: var(--e-accent);
			}

			&--correct {
				border-color: var(--e-success);
			}

			&--wrong {
				border-color: var(--e-danger);
			}
		}

		&__position {
			@include mono;

			font-size: var(--e-text-sm);
			color: var(--e-fg-dim);
			text-align: center;
		}

		&__body {
			display: flex;
			flex-direction: column;
		}

		&__label {
			font-size: var(--e-text-sm);
			font-weight: var(--e-weight-medium);
			color: var(--e-fg);
		}

		&__detail {
			font-size: var(--e-text-2xs);
			color: var(--e-fg-dim);
		}

		&__grip {
			color: var(--e-fg-dim);
			text-align: center;
		}
	}
</style>
