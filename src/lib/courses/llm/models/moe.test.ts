import { describe, it, expect } from 'vitest';
import {
	routeTokens,
	routerScores,
	topExperts,
	routerConfidence,
	greedyByAffinity,
	collapsedRouting,
	bestRouting,
	upperBoundQuality,
	parameterBudget
} from './moe';
import { SPANISH } from '../data/es';
import { EXPERT_CAPACITY, ROUTING_TARGET, ACTIVE_EXPERTS_PER_TOKEN } from '../config';

const EXPERTS = SPANISH.experts;
const ROUTABLE_TOKENS = SPANISH.routableTokens;
const TRAINED_ROUTER = SPANISH.trainedRouter;
const UNTRAINED_ROUTER = SPANISH.untrainedRouter;
import { softmax } from './sampling';

const EXPERT_COUNT = EXPERTS.length;

describe('moe helpers', () => {
	describe('WHEN every token goes to its favourite expert', () => {
		it('should overflow that expert and drop most of the batch', () => {
			const assignment = collapsedRouting(ROUTABLE_TOKENS, EXPERT_COUNT);

			const outcome = routeTokens(ROUTABLE_TOKENS, assignment, EXPERT_COUNT, EXPERT_CAPACITY);

			expect(outcome.droppedCount).toBe(ROUTABLE_TOKENS.length - EXPERT_CAPACITY);
			expect(outcome.ratio).toBeLessThan(0.5);
		});
	});

	describe('WHEN routing respects capacity', () => {
		it('should never load an expert beyond its capacity', () => {
			const assignment = bestRouting(ROUTABLE_TOKENS, EXPERT_COUNT, EXPERT_CAPACITY);

			const outcome = routeTokens(ROUTABLE_TOKENS, assignment, EXPERT_COUNT, EXPERT_CAPACITY);

			for (const load of outcome.loads) expect(load).toBeLessThanOrEqual(EXPERT_CAPACITY);
		});

		it('should be able to reach the target the game asks for', () => {
			const assignment = bestRouting(ROUTABLE_TOKENS, EXPERT_COUNT, EXPERT_CAPACITY);

			const outcome = routeTokens(ROUTABLE_TOKENS, assignment, EXPERT_COUNT, EXPERT_CAPACITY);

			expect(outcome.ratio).toBeGreaterThanOrEqual(ROUTING_TARGET);
		});

		it('should route every token when capacity allows', () => {
			const assignment = bestRouting(ROUTABLE_TOKENS, EXPERT_COUNT, EXPERT_CAPACITY);

			const outcome = routeTokens(ROUTABLE_TOKENS, assignment, EXPERT_COUNT, EXPERT_CAPACITY);

			expect(outcome.droppedCount).toBe(0);
		});
	});

	describe('WHEN a token is left unrouted', () => {
		it('should count as dropped and contribute nothing', () => {
			const assignment = ROUTABLE_TOKENS.map(() => null);

			const outcome = routeTokens(ROUTABLE_TOKENS, assignment, EXPERT_COUNT, EXPERT_CAPACITY);

			expect(outcome.quality).toBe(0);
			expect(outcome.droppedCount).toBe(ROUTABLE_TOKENS.length);
		});
	});

	describe('WHEN I compare routing strategies', () => {
		it('should rank collapse below greedy below the best found', () => {
			const score = (assignment: (number | null)[]): number =>
				routeTokens(ROUTABLE_TOKENS, assignment, EXPERT_COUNT, EXPERT_CAPACITY).quality;

			const collapsed = score(collapsedRouting(ROUTABLE_TOKENS, EXPERT_COUNT));
			const greedy = score(greedyByAffinity(ROUTABLE_TOKENS, EXPERT_COUNT, EXPERT_CAPACITY));
			const best = score(bestRouting(ROUTABLE_TOKENS, EXPERT_COUNT, EXPERT_CAPACITY));

			expect(collapsed).toBeLessThan(greedy);
			expect(greedy).toBeLessThanOrEqual(best);
		});

		it('should never beat the unconstrained upper bound', () => {
			const best = routeTokens(
				ROUTABLE_TOKENS,
				bestRouting(ROUTABLE_TOKENS, EXPERT_COUNT, EXPERT_CAPACITY),
				EXPERT_COUNT,
				EXPERT_CAPACITY
			);

			expect(best.quality).toBeLessThanOrEqual(upperBoundQuality(ROUTABLE_TOKENS) + 1e-9);
		});
	});

	describe('WHEN I size a sparse layer', () => {
		it.each`
			expertCount | activePerToken | total    | active
			${8}        | ${2}           | ${8100}  | ${2100}
			${64}       | ${2}           | ${64100} | ${2100}
			${1}        | ${1}           | ${1100}  | ${1100}
		`(
			'should report $total total and $active active for $expertCount experts',
			({ expertCount, activePerToken, total, active }) => {
				const budget = parameterBudget({
					expertCount: expertCount as number,
					activePerToken: activePerToken as number,
					expertParameters: 1000,
					sharedParameters: 100
				});

				expect(budget.totalParameters).toBe(total as number);
				expect(budget.activeParameters).toBe(active as number);
			}
		);

		it('should let parameters grow while active compute stays flat', () => {
			const small = parameterBudget({
				expertCount: 8,
				activePerToken: 2,
				expertParameters: 1000,
				sharedParameters: 100
			});
			const large = parameterBudget({
				expertCount: 128,
				activePerToken: 2,
				expertParameters: 1000,
				sharedParameters: 100
			});

			expect(large.totalParameters).toBeGreaterThan(small.totalParameters * 10);
			expect(large.activeParameters).toBe(small.activeParameters);
			expect(large.sparsity).toBeLessThan(small.sparsity);
		});

		it('should never activate more experts than exist', () => {
			const budget = parameterBudget({
				expertCount: 2,
				activePerToken: 8,
				expertParameters: 1000,
				sharedParameters: 100
			});

			expect(budget.activeParameters).toBe(2100);
		});
	});

	describe('WHEN the router is a learned matrix', () => {
		const KIND_TO_EXPERT: Record<string, number> = {
			número: 0,
			código: 1,
			función: 2,
			sustantivo: 3
		};

		const winnerFor = (features: readonly number[], matrix: typeof TRAINED_ROUTER): number =>
			topExperts(routerScores(features, matrix), 1)[0];

		it('should send every token to the expert matching its kind once trained', () => {
			for (const token of ROUTABLE_TOKENS) {
				expect(winnerFor(token.features, TRAINED_ROUTER)).toBe(KIND_TO_EXPERT[token.kind]);
			}
		});

		it('should route almost at random before training', () => {
			const correct = ROUTABLE_TOKENS.filter(
				(token) => winnerFor(token.features, UNTRAINED_ROUTER) === KIND_TO_EXPERT[token.kind]
			).length;

			expect(correct).toBeLessThan(ROUTABLE_TOKENS.length / 2);
		});

		it('should be far more confident once trained than at initialisation', () => {
			const confidenceOf = (matrix: typeof TRAINED_ROUTER): number => {
				const total = ROUTABLE_TOKENS.reduce(
					(sum, token) => sum + routerConfidence(softmax(routerScores(token.features, matrix))),
					0
				);
				return total / ROUTABLE_TOKENS.length;
			};

			const untrained = confidenceOf(UNTRAINED_ROUTER);
			const trained = confidenceOf(TRAINED_ROUTER);

			expect(untrained).toBeCloseTo(1 / EXPERTS.length, 1);
			expect(trained).toBeGreaterThan(untrained * 1.7);
		});

		it('should activate exactly the requested number of experts', () => {
			const scores = routerScores(ROUTABLE_TOKENS[0].features, TRAINED_ROUTER);

			expect(topExperts(scores, ACTIVE_EXPERTS_PER_TOKEN)).toHaveLength(ACTIVE_EXPERTS_PER_TOKEN);
		});

		it('should rank experts consistently with their raw scores', () => {
			const scores = routerScores(ROUTABLE_TOKENS[3].features, TRAINED_ROUTER);
			const ranked = topExperts(scores, EXPERTS.length);

			for (let index = 1; index < ranked.length; index += 1) {
				expect(scores[ranked[index - 1]]).toBeGreaterThanOrEqual(scores[ranked[index]]);
			}
		});
	});
});
