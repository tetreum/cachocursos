import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { progress } from '$state/progress.svelte';
import AttentionGame from './chapters/06-atencion/AttentionGame.svelte';
import { SPANISH } from './data/es';

describe('<AttentionGame />', () => {
	beforeEach(() => {
		progress.reset();
	});

	describe('WHEN I click the same token several times', () => {
		it('should accumulate ten points per click on that token', async () => {
			const user = userEvent.setup();
			render(AttentionGame, { puzzles: SPANISH.attentionPuzzles, passingScore: 0.7 });
			const trofeo = screen.getByRole('button', { name: /trofeo/i });

			await user.click(trofeo);
			expect(trofeo).toHaveTextContent('10');

			await user.click(trofeo);
			expect(trofeo).toHaveTextContent('20');

			await user.click(trofeo);
			expect(trofeo).toHaveTextContent('30');
		});

		it('should keep the free budget in step with the points spent', async () => {
			const user = userEvent.setup();
			render(AttentionGame, { puzzles: SPANISH.attentionPuzzles, passingScore: 0.7 });
			const trofeo = screen.getByRole('button', { name: /trofeo/i });

			await user.click(trofeo);
			await user.click(trofeo);

			expect(screen.getByText('80')).toBeInTheDocument();
		});
	});
});
