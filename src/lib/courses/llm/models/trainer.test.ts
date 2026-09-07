import { describe, it, expect } from 'vitest';
import { createTrainer, DEFAULT_TRAINER } from './trainer';
import { tokenizeWords } from './ngram';
import { mulberry32 } from '$utils/rng';
import { LOCALES } from '$i18n/locale';
import { DATA_BY_LOCALE } from '../data';

describe.each(LOCALES)('trainer helpers (%s)', (locale) => {
	const source = tokenizeWords(DATA_BY_LOCALE[locale].corpus);
	const VOCAB_SIZE = source.vocabulary.length;

	describe('WHEN I train with a sane learning rate', () => {
		it('should reduce the loss over time', () => {
			const trainer = createTrainer(source.ids, VOCAB_SIZE, DEFAULT_TRAINER);

			const trace = trainer.run(300);

			const early = trace.slice(0, 20).reduce((total, step) => total + step.loss, 0) / 20;
			const late = trace.slice(-20).reduce((total, step) => total + step.loss, 0) / 20;
			expect(late).toBeLessThan(early);
		});

		it('should beat the uniform baseline after training', () => {
			const trainer = createTrainer(source.ids, VOCAB_SIZE, DEFAULT_TRAINER);

			trainer.run(400);

			expect(trainer.evaluate()).toBeLessThan(Math.log(VOCAB_SIZE));
		});

		it('should not report divergence', () => {
			const trainer = createTrainer(source.ids, VOCAB_SIZE, DEFAULT_TRAINER);

			trainer.run(200);

			expect(trainer.diverged).toBe(false);
		});
	});

	describe('WHEN the learning rate is far too high', () => {
		it.each`
			learningRate | diverged
			${0.5}       | ${false}
			${2}         | ${false}
			${50}        | ${true}
			${500}       | ${true}
		`(
			'should report diverged=$diverged for a rate of $learningRate',
			({ learningRate, diverged }) => {
				const trainer = createTrainer(source.ids, VOCAB_SIZE, {
					...DEFAULT_TRAINER,
					learningRate: learningRate as number
				});

				trainer.run(400);

				expect(trainer.diverged).toBe(diverged);
			}
		);
	});

	describe('WHEN I reuse the same seed', () => {
		it('should reproduce the same loss trace', () => {
			const first = createTrainer(source.ids, VOCAB_SIZE, DEFAULT_TRAINER).run(40);
			const second = createTrainer(source.ids, VOCAB_SIZE, DEFAULT_TRAINER).run(40);

			expect(first.map((step) => step.loss)).toEqual(second.map((step) => step.loss));
		});
	});

	describe('WHEN I inspect the model', () => {
		it('should report a parameter count in the low thousands', () => {
			const trainer = createTrainer(source.ids, VOCAB_SIZE, DEFAULT_TRAINER);

			expect(trainer.parameterCount).toBeGreaterThan(1000);
			expect(trainer.parameterCount).toBeLessThan(50000);
		});

		it('should produce logits for every token in the vocabulary', () => {
			const trainer = createTrainer(source.ids, VOCAB_SIZE, DEFAULT_TRAINER);

			expect(trainer.logitsFor(0)).toHaveLength(VOCAB_SIZE);
		});

		it('should sample the requested number of tokens', () => {
			const trainer = createTrainer(source.ids, VOCAB_SIZE, DEFAULT_TRAINER);
			trainer.run(100);

			const produced = trainer.sample(0, 12, 0.9, mulberry32(3));

			expect(produced).toHaveLength(12);
		});
	});

	describe('WHEN I reset the trainer', () => {
		it('should go back to step zero with the new configuration', () => {
			const trainer = createTrainer(source.ids, VOCAB_SIZE, DEFAULT_TRAINER);
			trainer.run(50);

			trainer.reset({ learningRate: 0.1 });

			expect(trainer.step).toBe(0);
			expect(trainer.config.learningRate).toBe(0.1);
		});
	});
});
