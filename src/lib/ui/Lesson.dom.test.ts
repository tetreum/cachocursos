import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { progress } from '$state/progress.svelte';
import LessonHarness from '../../tests/fixtures/LessonHarness.svelte';

describe('<Lesson />', () => {
	beforeEach(() => {
		progress.reset();
	});

	describe('WHEN the lesson first renders', () => {
		it('should show only the first step', () => {
			render(LessonHarness);

			expect(screen.getByTestId('step-1')).toBeInTheDocument();
			expect(screen.queryByTestId('win')).not.toBeInTheDocument();
			expect(screen.queryByTestId('step-3')).not.toBeInTheDocument();
		});
	});

	describe('WHEN I advance to a gated step without solving it', () => {
		it('should keep the following step out of the document', async () => {
			const user = userEvent.setup();
			render(LessonHarness);

			await user.click(screen.getByRole('button', { name: 'Continuar' }));

			expect(screen.getByTestId('win')).toBeInTheDocument();
			expect(screen.queryByTestId('step-3')).not.toBeInTheDocument();
		});

		it('should disable the continue button of the gated step', async () => {
			const user = userEvent.setup();
			render(LessonHarness);

			await user.click(screen.getByRole('button', { name: 'Continuar' }));

			const remaining = screen.getAllByRole('button', { name: 'Continuar' });
			expect(remaining[remaining.length - 1]).toBeDisabled();
		});
	});

	describe('WHEN I solve the gate', () => {
		it('should let me reach the final step', async () => {
			const user = userEvent.setup();
			render(LessonHarness);

			await user.click(screen.getByRole('button', { name: 'Continuar' }));
			await user.click(screen.getByTestId('win'));
			const buttons = screen.getAllByRole('button', { name: 'Continuar' });
			await user.click(buttons[buttons.length - 1]);

			expect(await screen.findByTestId('step-3')).toBeInTheDocument();
		});
	});
});
