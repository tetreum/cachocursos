import { describe, it, expect } from 'vitest';
import {
	evaluateStrategy,
	cheapestSufficient,
	outcomesFor,
	compoundedAccuracy,
	stepsUntilUnreliable,
	strategyCost,
	STRATEGY_ORDER,
	FREE_SERIAL_STEPS,
	REQUIRED_ACCURACY,
	PER_STEP_RELIABILITY
} from './onepass';
import { SPANISH } from '../data/es';

const ONE_PASS_TASKS = SPANISH.tasks;

const taskById = (id: string) => ONE_PASS_TASKS.find((task) => task.id === id)!;

describe('one-pass helpers', () => {
	describe('WHEN the task needs no sub-token access and no chaining', () => {
		it('should be answerable in a single pass', () => {
			const outcome = evaluateStrategy(taskById('capital'), 'direct');

			expect(outcome.feasible).toBe(true);
			expect(outcome.accuracy).toBe(1);
		});
	});

	describe('WHEN letters or digits are hidden inside tokens', () => {
		it('should fail when answered directly', () => {
			expect(evaluateStrategy(taskById('erres'), 'direct').feasible).toBe(false);
		});

		it('should be fixed by splitting into units when nothing is chained', () => {
			expect(evaluateStrategy(taskById('erres'), 'retokenize').feasible).toBe(true);
			expect(evaluateStrategy(taskById('invertir'), 'retokenize').feasible).toBe(true);
		});

		it('should not be fixed by splitting when steps are chained', () => {
			expect(evaluateStrategy(taskById('suma-corta'), 'retokenize').feasible).toBe(false);
		});
	});

	describe('WHEN the task needs more serial steps than the depth allows', () => {
		it('should need the steps written out', () => {
			expect(cheapestSufficient(taskById('suma-corta'))).toBe('chain');
		});

		it('should compound the error until the chain stops being reliable', () => {
			const short = evaluateStrategy(taskById('suma-corta'), 'chain');
			const long = evaluateStrategy(taskById('suma-larga'), 'chain');

			expect(short.feasible).toBe(true);
			expect(long.feasible).toBe(false);
			expect(long.accuracy).toBeLessThan(short.accuracy);
		});

		it('should fall back to a tool once the chain is too long', () => {
			expect(cheapestSufficient(taskById('suma-larga'))).toBe('tool');
			expect(cheapestSufficient(taskById('producto'))).toBe('tool');
		});
	});

	describe('WHEN a tool is available', () => {
		it('should always work, whatever the task', () => {
			for (const task of ONE_PASS_TASKS) {
				const outcome = evaluateStrategy(task, 'tool');
				expect(outcome.feasible).toBe(true);
				expect(outcome.accuracy).toBe(1);
			}
		});
	});

	describe('WHEN I look for the cheapest sufficient strategy', () => {
		it.each`
			id              | expected
			${'capital'}    | ${'direct'}
			${'erres'}      | ${'retokenize'}
			${'invertir'}   | ${'retokenize'}
			${'suma-corta'} | ${'chain'}
			${'suma-larga'} | ${'tool'}
			${'producto'}   | ${'tool'}
		`('should pick $expected for $id', ({ id, expected }) => {
			expect(cheapestSufficient(taskById(id as string))).toBe(expected);
		});

		it('should exercise every strategy across the task set', () => {
			const used = new Set(ONE_PASS_TASKS.map((task) => cheapestSufficient(task)));

			expect(used).toEqual(new Set(STRATEGY_ORDER));
		});

		it('should never pick something cheaper that also works', () => {
			for (const task of ONE_PASS_TASKS) {
				const answer = cheapestSufficient(task);
				for (const strategy of STRATEGY_ORDER) {
					if (strategyCost(strategy) < strategyCost(answer)) {
						expect(evaluateStrategy(task, strategy).feasible).toBe(false);
					}
				}
			}
		});
	});

	describe('WHEN I report every option for a task', () => {
		it('should return one outcome per strategy', () => {
			expect(outcomesFor(taskById('producto'))).toHaveLength(STRATEGY_ORDER.length);
		});
	});

	describe('WHEN errors compound across steps', () => {
		it.each`
			steps | expected
			${1}  | ${0.97}
			${3}  | ${0.9127}
			${8}  | ${0.7837}
			${20} | ${0.5438}
		`('should give about $expected after $steps steps', ({ steps, expected }) => {
			expect(compoundedAccuracy(steps as number)).toBeCloseTo(expected as number, 3);
		});

		it('should stop being reliable past a handful of steps', () => {
			const limit = stepsUntilUnreliable();

			expect(compoundedAccuracy(limit)).toBeGreaterThanOrEqual(REQUIRED_ACCURACY);
			expect(compoundedAccuracy(limit + 1)).toBeLessThan(REQUIRED_ACCURACY);
			expect(limit).toBeGreaterThan(FREE_SERIAL_STEPS);
		});

		it('should degrade faster when each step is less reliable', () => {
			expect(stepsUntilUnreliable(0.8)).toBeLessThan(stepsUntilUnreliable(PER_STEP_RELIABILITY));
		});
	});
});
