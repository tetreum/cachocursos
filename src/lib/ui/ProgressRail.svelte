<script lang="ts">
	import { createTranslator } from '$i18n/locale';

	const t = createTranslator();
	interface ProgressRailProps {
		percent: number;
		cursor: number;
		total: number;
	}

	let { percent, cursor, total }: ProgressRailProps = $props();
</script>

<div
	class="e-rail"
	role="progressbar"
	aria-valuenow={percent}
	aria-valuemin={0}
	aria-valuemax={100}
>
	<div class="e-rail__track">
		<div class="e-rail__fill" style:width="{percent}%"></div>
	</div>
	<p class="e-rail__label">
		{#if total > 0}
			{t('CHAPTER_STEP_OF', { current: cursor + 1, total })}
		{/if}
	</p>
</div>

<style lang="scss">
	.e-rail {
		display: flex;
		gap: var(--e-space-md);
		align-items: center;

		&__track {
			flex: 1;
			height: 4px;
			overflow: hidden;
			background: var(--e-surface-2);
			border-radius: var(--e-radius-pill);
		}

		&__fill {
			height: 100%;
			background: var(--e-accent);
			border-radius: inherit;
			transition: width var(--e-dur-base) var(--e-ease-out);
		}

		&__label {
			@include mono;

			min-width: 9ch;
			font-size: var(--e-text-xs);
			color: var(--e-fg-dim);
			text-align: right;
		}
	}
</style>
