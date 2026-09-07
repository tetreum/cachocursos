import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { progress } from '$state/progress.svelte';
import { COURSES } from '$content/courses';
import { translate } from '$i18n/locale';
import ChallengeHarness from '../../tests/fixtures/ChallengeHarness.svelte';

const COURSE_ID = COURSES[0].id;
const CHALLENGE_ID = COURSES[0].chapters[0].gates[0];

describe('<Challenge />', () => {
	beforeEach(() => {
		progress.reset();
	});

	describe('WHEN the wrapped minigame reports a solution', () => {
		it('should mark the challenge as solved in the progress store', async () => {
			const user = userEvent.setup();
			render(ChallengeHarness, { id: CHALLENGE_ID });

			await user.click(screen.getByTestId('win'));

			expect(progress.isSolved(COURSE_ID, CHALLENGE_ID)).toBe(true);
		});

		it('should keep the reported score', async () => {
			const user = userEvent.setup();
			render(ChallengeHarness, { id: CHALLENGE_ID });

			await user.click(screen.getByTestId('win'));

			expect(progress.resultOf(COURSE_ID, CHALLENGE_ID)?.score).toBe(7);
		});

		it('should render the success snippet', async () => {
			const user = userEvent.setup();
			render(ChallengeHarness, { id: CHALLENGE_ID });

			await user.click(screen.getByTestId('win'));

			expect(await screen.findByTestId('success')).toHaveTextContent('Puntuación 7');
		});
	});

	describe('WHEN the wrapped minigame reports a failure', () => {
		it('should translate the retry message from inside the callback', async () => {
			const user = userEvent.setup();
			render(ChallengeHarness, { id: CHALLENGE_ID });

			await user.click(screen.getByTestId('lose'));

			expect(await screen.findByText(translate('es', 'CHALLENGE_RETRY'))).toHaveTextContent(
				translate('es', 'CHALLENGE_RETRY')
			);
		});
	});

	describe('WHEN the challenge has not been solved yet', () => {
		it('should not report it as solved', () => {
			render(ChallengeHarness, { id: CHALLENGE_ID });

			expect(progress.isSolved(COURSE_ID, CHALLENGE_ID)).toBe(false);
		});
	});
});
