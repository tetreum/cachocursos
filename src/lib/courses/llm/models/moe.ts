export interface Expert {
	id: string;
	name: string;
	/** La letra sola, para las tablas donde no cabe el nombre entero. */
	short: string;
	blurb: string;
}

export interface RoutableToken {
	id: string;
	text: string;
	kind: string;
	affinity: readonly number[];
	features: readonly number[];
}

export type RouterMatrix = readonly (readonly number[])[];

export interface RoutingOutcome {
	loads: number[];
	dropped: boolean[];
	quality: number;
	upperBound: number;
	ratio: number;
	routedCount: number;
	droppedCount: number;
}

export interface ParameterBudget {
	totalParameters: number;
	activeParameters: number;
	sparsity: number;
}

export function upperBoundQuality(tokens: readonly RoutableToken[]): number {
	return tokens.reduce((total, token) => total + Math.max(...token.affinity), 0);
}

export function routeTokens(
	tokens: readonly RoutableToken[],
	assignment: readonly (number | null)[],
	expertCount: number,
	capacity: number
): RoutingOutcome {
	const loads = new Array<number>(expertCount).fill(0);
	const dropped = new Array<boolean>(tokens.length).fill(false);
	let quality = 0;
	let routedCount = 0;

	for (let index = 0; index < tokens.length; index += 1) {
		const expert = assignment[index];
		if (expert === null || expert === undefined) {
			dropped[index] = true;
			continue;
		}
		if (loads[expert] >= capacity) {
			dropped[index] = true;
			continue;
		}
		loads[expert] += 1;
		quality += tokens[index].affinity[expert];
		routedCount += 1;
	}

	const upperBound = upperBoundQuality(tokens);
	return {
		loads,
		dropped,
		quality,
		upperBound,
		ratio: upperBound === 0 ? 0 : quality / upperBound,
		routedCount,
		droppedCount: tokens.length - routedCount
	};
}

export function greedyByAffinity(
	tokens: readonly RoutableToken[],
	expertCount: number,
	capacity: number
): (number | null)[] {
	const loads = new Array<number>(expertCount).fill(0);
	return tokens.map((token) => {
		let best: number | null = null;
		for (let expert = 0; expert < expertCount; expert += 1) {
			if (loads[expert] >= capacity) continue;
			if (best === null || token.affinity[expert] > token.affinity[best]) best = expert;
		}
		if (best !== null) loads[best] += 1;
		return best;
	});
}

export function collapsedRouting(
	tokens: readonly RoutableToken[],
	expertCount: number
): (number | null)[] {
	const totals = new Array<number>(expertCount).fill(0);
	for (const token of tokens) {
		for (let expert = 0; expert < expertCount; expert += 1)
			totals[expert] += token.affinity[expert];
	}
	const favourite = totals.indexOf(Math.max(...totals));
	return tokens.map(() => favourite);
}

export function bestRouting(
	tokens: readonly RoutableToken[],
	expertCount: number,
	capacity: number
): (number | null)[] {
	const assignment = greedyByAffinity(tokens, expertCount, capacity);
	let improved = true;

	const scoreOf = (candidate: readonly (number | null)[]): number =>
		routeTokens(tokens, candidate, expertCount, capacity).quality;

	while (improved) {
		improved = false;
		for (let first = 0; first < tokens.length; first += 1) {
			for (let expert = 0; expert < expertCount; expert += 1) {
				const candidate = assignment.slice();
				candidate[first] = expert;
				if (scoreOf(candidate) > scoreOf(assignment)) {
					assignment[first] = expert;
					improved = true;
				}
			}
			for (let second = first + 1; second < tokens.length; second += 1) {
				const candidate = assignment.slice();
				const held = candidate[first];
				candidate[first] = candidate[second];
				candidate[second] = held;
				if (scoreOf(candidate) > scoreOf(assignment)) {
					assignment[first] = candidate[first];
					assignment[second] = candidate[second];
					improved = true;
				}
			}
		}
	}

	return assignment;
}

export function parameterBudget(options: {
	expertCount: number;
	activePerToken: number;
	expertParameters: number;
	sharedParameters: number;
}): ParameterBudget {
	const { expertCount, activePerToken, expertParameters, sharedParameters } = options;
	const totalParameters = sharedParameters + expertCount * expertParameters;
	const activeParameters =
		sharedParameters + Math.min(activePerToken, expertCount) * expertParameters;
	return {
		totalParameters,
		activeParameters,
		sparsity: totalParameters === 0 ? 0 : activeParameters / totalParameters
	};
}

export function routerScores(features: readonly number[], matrix: RouterMatrix): Float64Array {
	const scores = new Float64Array(matrix.length);
	for (let expert = 0; expert < matrix.length; expert += 1) {
		let total = 0;
		const row = matrix[expert];
		for (let feature = 0; feature < features.length; feature += 1) {
			total += features[feature] * row[feature];
		}
		scores[expert] = total;
	}
	return scores;
}

export function topExperts(scores: ArrayLike<number>, count: number): number[] {
	const order: number[] = [];
	for (let expert = 0; expert < scores.length; expert += 1) order.push(expert);
	order.sort((left, right) => scores[right] - scores[left] || left - right);
	return order.slice(0, count);
}

export function routerConfidence(probabilities: ArrayLike<number>): number {
	let largest = 0;
	for (let index = 0; index < probabilities.length; index += 1) {
		if (probabilities[index] > largest) largest = probabilities[index];
	}
	return largest;
}
