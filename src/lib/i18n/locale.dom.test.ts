import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import { translate } from './locale';
import LocaleHarness from '../../tests/fixtures/LocaleHarness.svelte';

/**
 * Cambiar de idioma no cambia de ruta, así que SvelteKit reutiliza los componentes
 * en vez de crearlos de nuevo. Si el traductor guardara el idioma al inicializarse,
 * el texto se quedaría en el idioma anterior hasta recargar la página.
 */
describe('locale context', () => {
	describe('WHEN the language changes under a component that is reused', () => {
		it('should retranslate without recreating it', async () => {
			const { rerender } = render(LocaleHarness, { locale: 'es' });
			expect(screen.getByTestId('translated')).toHaveTextContent(
				translate('es', 'CHALLENGE_RESET')
			);

			await rerender({ locale: 'en' });

			expect(screen.getByTestId('translated')).toHaveTextContent(
				translate('en', 'CHALLENGE_RESET')
			);
		});

		it('should come back when the language changes back', async () => {
			const { rerender } = render(LocaleHarness, { locale: 'en' });

			await rerender({ locale: 'es' });

			expect(screen.getByTestId('translated')).toHaveTextContent(
				translate('es', 'CHALLENGE_RESET')
			);
		});
	});
});
