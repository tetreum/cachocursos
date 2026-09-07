import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import { progress } from '$state/progress.svelte';
import NavHarness from '../../tests/fixtures/NavHarness.svelte';

describe('<Lesson /> across chapter navigation', () => {
	beforeEach(() => {
		progress.reset();
	});

	describe('WHEN the route swaps the chapter content', () => {
		it('should render the first step of the new chapter', async () => {
			const { rerender } = render(NavHarness, { which: 'a' });
			expect(screen.getByTestId('a-first')).toBeInTheDocument();

			await rerender({ which: 'b' });

			expect(screen.getByTestId('b-first')).toBeInTheDocument();
		});

		it('should leave the previous chapter content behind', async () => {
			const { rerender } = render(NavHarness, { which: 'a' });

			await rerender({ which: 'b' });

			expect(screen.queryByTestId('a-first')).not.toBeInTheDocument();
		});
	});

	describe('WHEN the lesson subtree is reused instead of keyed', () => {
		it('should render nothing, which is the regression the key prevents', async () => {
			const { rerender } = render(NavHarness, { which: 'a', keyed: false });

			await rerender({ which: 'b', keyed: false });

			expect(screen.queryByTestId('b-first')).not.toBeInTheDocument();
		});
	});
	describe('WHEN the route swaps the language of the same chapter', () => {
		it('should render the prose of the new language', async () => {
			const { rerender } = render(NavHarness, { which: 'a', locale: 'es' });
			expect(screen.getByTestId('a-first')).toBeInTheDocument();

			await rerender({ which: 'a', locale: 'en' });

			expect(screen.getByTestId('b-first')).toBeInTheDocument();
		});

		it('should leave the previous language behind', async () => {
			const { rerender } = render(NavHarness, { which: 'a', locale: 'es' });

			await rerender({ which: 'a', locale: 'en' });

			expect(screen.queryByTestId('a-first')).not.toBeInTheDocument();
		});
	});
});
