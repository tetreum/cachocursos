export type Strategy = 'direct' | 'retokenize' | 'chain' | 'tool';

export const STRATEGY_ORDER: readonly Strategy[] = ['direct', 'retokenize', 'chain', 'tool'];

export interface OnePassTask {
	id: string;
	prompt: string;
	answer: string;
	needsSubTokenAccess: boolean;
	serialSteps: number;
	note: string;
}

/** Por qué una estrategia sirve o no. El texto lo pone quien renderiza, en su idioma. */
export type OutcomeReason =
	| 'tool'
	| 'chain-wasteful'
	| 'chain-steps'
	| 'retokenize-fits'
	| 'retokenize-steps'
	| 'direct-hidden'
	| 'direct-fits'
	| 'direct-steps';

export interface StrategyOutcome {
	strategy: Strategy;
	feasible: boolean;
	accuracy: number;
	reason: OutcomeReason;
}

export const FREE_SERIAL_STEPS = 2;
export const PER_STEP_RELIABILITY = 0.97;
export const REQUIRED_ACCURACY = 0.9;
export const BLIND_GUESS_ACCURACY = 0.1;

export function strategyCost(strategy: Strategy): number {
	return STRATEGY_ORDER.indexOf(strategy);
}

export function evaluateStrategy(task: OnePassTask, strategy: Strategy): StrategyOutcome {
	const chained = Math.pow(PER_STEP_RELIABILITY, task.serialSteps);

	if (strategy === 'tool') {
		return {
			strategy,
			feasible: true,
			accuracy: 1,
			reason: 'tool'
		};
	}

	if (strategy === 'chain') {
		return {
			strategy,
			feasible: chained >= REQUIRED_ACCURACY,
			accuracy: chained,
			reason: task.serialSteps <= FREE_SERIAL_STEPS ? 'chain-wasteful' : 'chain-steps'
		};
	}

	if (strategy === 'retokenize') {
		const feasible = task.serialSteps <= FREE_SERIAL_STEPS;
		return {
			strategy,
			feasible,
			accuracy: feasible ? 1 : BLIND_GUESS_ACCURACY,
			reason: feasible ? 'retokenize-fits' : 'retokenize-steps'
		};
	}

	const feasible = !task.needsSubTokenAccess && task.serialSteps <= FREE_SERIAL_STEPS;
	return {
		strategy,
		feasible,
		accuracy: feasible ? 1 : BLIND_GUESS_ACCURACY,
		reason: task.needsSubTokenAccess ? 'direct-hidden' : feasible ? 'direct-fits' : 'direct-steps'
	};
}

export function cheapestSufficient(task: OnePassTask): Strategy {
	for (const strategy of STRATEGY_ORDER) {
		if (evaluateStrategy(task, strategy).feasible) return strategy;
	}
	return 'tool';
}

export function outcomesFor(task: OnePassTask): StrategyOutcome[] {
	return STRATEGY_ORDER.map((strategy) => evaluateStrategy(task, strategy));
}

export function compoundedAccuracy(steps: number, reliability = PER_STEP_RELIABILITY): number {
	return Math.pow(reliability, steps);
}

export function stepsUntilUnreliable(
	reliability = PER_STEP_RELIABILITY,
	floor = REQUIRED_ACCURACY
): number {
	let steps = 0;
	while (compoundedAccuracy(steps + 1, reliability) >= floor) steps += 1;
	return steps;
}
