export interface ScalingCoefficients {
	irreducible: number;
	parameterScale: number;
	dataScale: number;
	parameterExponent: number;
	dataExponent: number;
}

export interface Allocation {
	parameters: number;
	tokens: number;
	loss: number;
	tokensPerParameter: number;
}

export const CHINCHILLA: ScalingCoefficients = {
	irreducible: 1.69,
	parameterScale: 406.4,
	dataScale: 410.7,
	parameterExponent: 0.34,
	dataExponent: 0.28
};

const FLOPS_PER_PARAMETER_TOKEN = 6;
const SEARCH_SAMPLES = 400;
const MINIMUM_PARAMETERS = 1e6;

export function chinchillaLoss(
	parameters: number,
	tokens: number,
	coefficients: ScalingCoefficients = CHINCHILLA
): number {
	if (parameters <= 0 || tokens <= 0) return Infinity;
	return (
		coefficients.irreducible +
		coefficients.parameterScale / Math.pow(parameters, coefficients.parameterExponent) +
		coefficients.dataScale / Math.pow(tokens, coefficients.dataExponent)
	);
}

export function computeFlops(parameters: number, tokens: number): number {
	return FLOPS_PER_PARAMETER_TOKEN * parameters * tokens;
}

export function tokensForBudget(budget: number, parameters: number): number {
	return budget / (FLOPS_PER_PARAMETER_TOKEN * parameters);
}

export function lossForBudget(
	budget: number,
	parameters: number,
	coefficients: ScalingCoefficients = CHINCHILLA
): number {
	return chinchillaLoss(parameters, tokensForBudget(budget, parameters), coefficients);
}

export function budgetCurve(
	budget: number,
	samples = SEARCH_SAMPLES,
	coefficients: ScalingCoefficients = CHINCHILLA
): Allocation[] {
	const maximumParameters = budget / (FLOPS_PER_PARAMETER_TOKEN * 1);
	const lowerBound = Math.log10(MINIMUM_PARAMETERS);
	const upperBound = Math.log10(Math.max(MINIMUM_PARAMETERS * 10, maximumParameters / 1e3));
	const points: Allocation[] = [];

	for (let sample = 0; sample < samples; sample += 1) {
		const exponent = lowerBound + ((upperBound - lowerBound) * sample) / (samples - 1);
		const parameters = Math.pow(10, exponent);
		const tokens = tokensForBudget(budget, parameters);
		points.push({
			parameters,
			tokens,
			loss: chinchillaLoss(parameters, tokens, coefficients),
			tokensPerParameter: tokens / parameters
		});
	}

	return points;
}

export function optimalAllocation(
	budget: number,
	coefficients: ScalingCoefficients = CHINCHILLA
): Allocation {
	const curve = budgetCurve(budget, SEARCH_SAMPLES, coefficients);
	let best = curve[0];
	for (const point of curve) {
		if (point.loss < best.loss) best = point;
	}
	return best;
}

export function allocationRegret(
	budget: number,
	parameters: number,
	coefficients: ScalingCoefficients = CHINCHILLA
): number {
	return (
		lossForBudget(budget, parameters, coefficients) - optimalAllocation(budget, coefficients).loss
	);
}

export function formatParameters(parameters: number): string {
	const BILLION = 1e9;
	const MILLION = 1e6;
	if (parameters >= BILLION) return `${(parameters / BILLION).toFixed(1)} B`;
	if (parameters >= MILLION) return `${(parameters / MILLION).toFixed(0)} M`;
	return parameters.toFixed(0);
}

export function formatTokens(tokens: number): string {
	const TRILLION = 1e12;
	const BILLION = 1e9;
	const MILLION = 1e6;
	if (tokens >= TRILLION) return `${(tokens / TRILLION).toFixed(2)} T`;
	if (tokens >= BILLION) return `${(tokens / BILLION).toFixed(0)} B`;
	if (tokens >= MILLION) return `${(tokens / MILLION).toFixed(0)} M`;
	return tokens.toFixed(0);
}
