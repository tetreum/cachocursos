<script lang="ts" module>
	interface Requirement {
		id: string;
		what: string;
		generating: boolean;
		detecting: boolean;
		note: string;
	}
</script>

<script lang="ts">
	import { createCourseTranslator } from '../../i18n';

	const t = createCourseTranslator();

	const REQUIREMENTS: readonly Requirement[] = [
		{
			id: 'texto',
			what: t('NEEDS_TEXT'),
			generating: false,
			detecting: true,
			note: t('NEEDS_TEXT_NOTE')
		},
		{
			id: 'tokenizador',
			what: t('NEEDS_TOKENIZER'),
			generating: true,
			detecting: true,
			note: t('NEEDS_TOKENIZER_NOTE')
		},
		{
			id: 'clave',
			what: t('NEEDS_KEY'),
			generating: true,
			detecting: true,
			note: t('NEEDS_KEY_NOTE')
		},
		{
			id: 'gamma',
			what: t('NEEDS_GAMMA'),
			generating: true,
			detecting: true,
			note: t('NEEDS_GAMMA_NOTE')
		},
		{
			id: 'delta',
			what: t('NEEDS_DELTA'),
			generating: true,
			detecting: false,
			note: t('NEEDS_DELTA_NOTE')
		},
		{
			id: 'modelo',
			what: t('NEEDS_MODEL'),
			generating: true,
			detecting: false,
			note: t('NEEDS_MODEL_NOTE')
		}
	];
</script>

<div class="e-needs">
	<div class="e-needs__head">
		<span class="e-needs__what">{t('NEEDS_WHAT')}</span>
		<span class="e-needs__column">{t('NEEDS_TO_GENERATE')}</span>
		<span class="e-needs__column">{t('NEEDS_TO_DETECT')}</span>
	</div>

	<ul class="e-needs__rows">
		{#each REQUIREMENTS as item (item.id)}
			<li class="e-needs__row" class:e-needs__row--punchline={item.id === 'modelo'}>
				<span class="e-needs__what">{item.what}</span>
				<span class="e-needs__cell" class:e-needs__cell--yes={item.generating}>
					{item.generating ? t('NEEDS_YES') : t('NEEDS_NO')}
				</span>
				<span class="e-needs__cell" class:e-needs__cell--yes={item.detecting}>
					{item.detecting ? t('NEEDS_YES') : t('NEEDS_NO')}
				</span>
				<span class="e-needs__note">{item.note}</span>
			</li>
		{/each}
	</ul>
</div>

<style lang="scss">
	.e-needs {
		display: flex;
		flex-direction: column;
		gap: var(--e-space-2xs);
		padding: var(--e-space-md);
		background: var(--e-bg-subtle);
		border: var(--e-border-width) solid var(--e-border);
		border-radius: var(--e-radius-md);

		&__head,
		&__row {
			display: grid;
			grid-template-columns: minmax(8rem, 1.1fr) 5.5rem 5.5rem;
			gap: var(--e-space-sm);
			align-items: center;
		}

		&__head {
			padding-bottom: var(--e-space-2xs);
			border-bottom: var(--e-border-width) solid var(--e-border);
		}

		&__column,
		&__what {
			font-size: var(--e-text-2xs);
			font-weight: var(--e-weight-bold);
			color: var(--e-fg-dim);
			letter-spacing: var(--e-tracking-wide);
			text-transform: uppercase;
			text-align: center;
		}

		&__head &__what {
			text-align: left;
		}

		&__rows {
			display: flex;
			flex-direction: column;
			gap: var(--e-space-2xs);
			padding: 0;
			margin: 0;
			list-style: none;
		}

		&__row {
			padding: var(--e-space-2xs) 0;
			border-bottom: var(--e-border-width) solid var(--e-border);

			.e-needs__what {
				font-size: var(--e-text-sm);
				font-weight: var(--e-weight-regular);
				color: var(--e-fg);
				letter-spacing: normal;
				text-align: left;
				text-transform: none;
			}

			&--punchline {
				padding: var(--e-space-xs);
				background: var(--e-success-soft);
				border: var(--e-border-width) solid var(--e-success);
				border-radius: var(--e-radius-sm);

				.e-needs__what {
					font-weight: var(--e-weight-semibold);
				}
			}
		}

		&__cell {
			@include mono;

			padding: var(--e-space-3xs) 0;
			font-size: var(--e-text-xs);
			font-weight: var(--e-weight-bold);
			color: var(--e-fg-dim);
			text-align: center;
			background: var(--e-surface-2);
			border-radius: var(--e-radius-xs);

			&--yes {
				color: var(--e-accent);
				background: var(--e-accent-soft);
			}
		}

		&__note {
			grid-column: 1 / -1;
			font-size: var(--e-text-2xs);
			color: var(--e-fg-muted);
		}
	}
</style>
