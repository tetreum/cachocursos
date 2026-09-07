import { mulberry32 } from '$utils/rng';

export interface Response {
	id: string;
	text: string;
	traits: Record<string, number>;
}

export interface Comparison {
	chosen: string;
	rejected: string;
}

export interface RewardModel {
	weights: Float64Array;
	traitNames: readonly string[];
	lossTrace: number[];
}

const DEFAULT_LEARNING_RATE = 0.35;
const DEFAULT_EPOCHS = 400;
const DEFAULT_REGULARIZATION = 0.01;
const EPSILON = 1e-9;

function sigmoid(value: number): number {
	return 1 / (1 + Math.exp(-value));
}

export function traitNamesOf(responses: readonly Response[]): string[] {
	const names = new Set<string>();
	for (const response of responses) {
		for (const name of Object.keys(response.traits)) names.add(name);
	}
	return Array.from(names).sort();
}

export function featuresOf(response: Response, traitNames: readonly string[]): Float64Array {
	const features = new Float64Array(traitNames.length);
	traitNames.forEach((name, index) => {
		features[index] = response.traits[name] ?? 0;
	});
	return features;
}

export function reward(
	weights: Float64Array,
	response: Response,
	traitNames: readonly string[]
): number {
	const features = featuresOf(response, traitNames);
	let total = 0;
	for (let index = 0; index < weights.length; index += 1) total += weights[index] * features[index];
	return total;
}

export function fitRewardModel(
	responses: readonly Response[],
	comparisons: readonly Comparison[],
	options: {
		learningRate?: number;
		epochs?: number;
		regularization?: number;
		seed?: number;
	} = {}
): RewardModel {
	const learningRate = options.learningRate ?? DEFAULT_LEARNING_RATE;
	const epochs = options.epochs ?? DEFAULT_EPOCHS;
	const regularization = options.regularization ?? DEFAULT_REGULARIZATION;
	const random = mulberry32(options.seed ?? 1);

	const traitNames = traitNamesOf(responses);
	const byId = new Map(responses.map((response) => [response.id, response]));
	const weights = new Float64Array(traitNames.length);
	for (let index = 0; index < weights.length; index += 1) weights[index] = (random() - 0.5) * 0.01;

	const lossTrace: number[] = [];
	if (comparisons.length === 0) return { weights, traitNames, lossTrace };

	for (let epoch = 0; epoch < epochs; epoch += 1) {
		const gradient = new Float64Array(traitNames.length);
		let loss = 0;

		for (const comparison of comparisons) {
			const chosen = byId.get(comparison.chosen);
			const rejected = byId.get(comparison.rejected);
			if (chosen === undefined || rejected === undefined) continue;

			const chosenFeatures = featuresOf(chosen, traitNames);
			const rejectedFeatures = featuresOf(rejected, traitNames);

			let margin = 0;
			for (let index = 0; index < weights.length; index += 1) {
				margin += weights[index] * (chosenFeatures[index] - rejectedFeatures[index]);
			}

			const probability = sigmoid(margin);
			loss -= Math.log(Math.max(probability, EPSILON));

			for (let index = 0; index < gradient.length; index += 1) {
				gradient[index] -= (1 - probability) * (chosenFeatures[index] - rejectedFeatures[index]);
			}
		}

		for (let index = 0; index < weights.length; index += 1) {
			const step = gradient[index] / comparisons.length + regularization * weights[index];
			weights[index] -= learningRate * step;
		}

		lossTrace.push(loss / comparisons.length);
	}

	return { weights, traitNames, lossTrace };
}

export function pairwiseAccuracy(
	model: RewardModel,
	responses: readonly Response[],
	comparisons: readonly Comparison[]
): number {
	if (comparisons.length === 0) return 0;
	const byId = new Map(responses.map((response) => [response.id, response]));
	let correct = 0;

	for (const comparison of comparisons) {
		const chosen = byId.get(comparison.chosen);
		const rejected = byId.get(comparison.rejected);
		if (chosen === undefined || rejected === undefined) continue;
		if (
			reward(model.weights, chosen, model.traitNames) >
			reward(model.weights, rejected, model.traitNames)
		) {
			correct += 1;
		}
	}

	return correct / comparisons.length;
}

export function dominantTraits(model: RewardModel): { trait: string; weight: number }[] {
	return model.traitNames
		.map((trait, index) => ({ trait, weight: model.weights[index] }))
		.sort((left, right) => Math.abs(right.weight) - Math.abs(left.weight));
}

export function bestResponseUnder(
	model: RewardModel,
	responses: readonly Response[]
): Response | null {
	let best: Response | null = null;
	let bestScore = -Infinity;
	for (const response of responses) {
		const score = reward(model.weights, response, model.traitNames);
		if (score > bestScore) {
			bestScore = score;
			best = response;
		}
	}
	return best;
}
