const WORD_PATTERN = /[\p{L}\p{N}]+|[.,;:!?¡¿]/gu;
const BITS_PER_NAT = Math.LOG2E;

export interface Tokenized {
	readonly tokens: readonly string[];
	readonly vocabulary: readonly string[];
	readonly index: ReadonlyMap<string, number>;
	readonly ids: Int32Array;
}

export interface NgramModel {
	readonly order: number;
	readonly vocabulary: readonly string[];
	readonly index: ReadonlyMap<string, number>;
	readonly counts: ReadonlyMap<string, Map<number, number>>;
	readonly contextTotals: ReadonlyMap<string, number>;
	readonly unigram: Float64Array;
	readonly alpha: number;
}

export interface NextToken {
	token: string;
	id: number;
	probability: number;
	count: number;
}

export function tokenizeWords(text: string): Tokenized {
	const tokens = (text.toLowerCase().match(WORD_PATTERN) ?? []) as string[];
	const index = new Map<string, number>();
	const vocabulary: string[] = [];
	const ids = new Int32Array(tokens.length);

	for (let position = 0; position < tokens.length; position += 1) {
		const token = tokens[position];
		let id = index.get(token);
		if (id === undefined) {
			id = vocabulary.length;
			vocabulary.push(token);
			index.set(token, id);
		}
		ids[position] = id;
	}

	return { tokens, vocabulary, index, ids };
}

export function contextKey(context: readonly string[]): string {
	return context.join('');
}

export function trainNgram(source: Tokenized, order: number, alpha = 0.1): NgramModel {
	const counts = new Map<string, Map<number, number>>();
	const contextTotals = new Map<string, number>();
	const unigram = new Float64Array(source.vocabulary.length);

	for (let position = 0; position < source.ids.length; position += 1) {
		unigram[source.ids[position]] += 1;
	}

	const historyLength = order - 1;
	for (let position = historyLength; position < source.tokens.length; position += 1) {
		const key = contextKey(source.tokens.slice(position - historyLength, position));
		const nextId = source.ids[position];
		let bucket = counts.get(key);
		if (bucket === undefined) {
			bucket = new Map<number, number>();
			counts.set(key, bucket);
		}
		bucket.set(nextId, (bucket.get(nextId) ?? 0) + 1);
		contextTotals.set(key, (contextTotals.get(key) ?? 0) + 1);
	}

	let unigramTotal = 0;
	for (let id = 0; id < unigram.length; id += 1) unigramTotal += unigram[id];
	for (let id = 0; id < unigram.length; id += 1) unigram[id] /= unigramTotal;

	return {
		order,
		vocabulary: source.vocabulary,
		index: source.index,
		counts,
		contextTotals,
		unigram,
		alpha
	};
}

function historyOf(model: NgramModel, context: readonly string[]): string[] {
	const historyLength = model.order - 1;
	return context
		.slice(Math.max(0, context.length - historyLength))
		.map((token) => token.toLowerCase());
}

export function hasSeenContext(model: NgramModel, context: readonly string[]): boolean {
	return model.counts.has(contextKey(historyOf(model, context)));
}

export function observedCount(model: NgramModel, context: readonly string[]): number {
	return model.contextTotals.get(contextKey(historyOf(model, context))) ?? 0;
}

export function nextLogits(model: NgramModel, context: readonly string[]): Float64Array {
	const size = model.vocabulary.length;
	const probabilities = new Float64Array(size);
	const key = contextKey(historyOf(model, context));
	const bucket = model.counts.get(key);
	const total = model.contextTotals.get(key) ?? 0;
	const denominator = total + model.alpha * size;

	for (let id = 0; id < size; id += 1) {
		const observed = bucket?.get(id) ?? 0;
		probabilities[id] = (observed + model.alpha) / denominator;
	}

	const logits = new Float64Array(size);
	for (let id = 0; id < size; id += 1) logits[id] = Math.log(probabilities[id]);
	return logits;
}

export function nextProbabilities(model: NgramModel, context: readonly string[]): Float64Array {
	const size = model.vocabulary.length;
	const probabilities = new Float64Array(size);
	const key = contextKey(historyOf(model, context));
	const bucket = model.counts.get(key);
	const total = model.contextTotals.get(key) ?? 0;
	const denominator = total + model.alpha * size;

	for (let id = 0; id < size; id += 1) {
		probabilities[id] = ((bucket?.get(id) ?? 0) + model.alpha) / denominator;
	}
	return probabilities;
}

export function nextDistribution(
	model: NgramModel,
	context: readonly string[],
	limit?: number
): NextToken[] {
	const probabilities = nextProbabilities(model, context);
	const bucket = model.counts.get(contextKey(historyOf(model, context)));

	const entries: NextToken[] = [];
	for (let id = 0; id < probabilities.length; id += 1) {
		entries.push({
			token: model.vocabulary[id],
			id,
			probability: probabilities[id],
			count: bucket?.get(id) ?? 0
		});
	}

	entries.sort((left, right) => {
		const difference = right.probability - left.probability;
		return difference !== 0 ? difference : left.token.localeCompare(right.token);
	});

	return limit === undefined ? entries : entries.slice(0, limit);
}

export function probabilityOf(
	model: NgramModel,
	context: readonly string[],
	token: string
): number {
	const id = model.index.get(token.toLowerCase());
	if (id === undefined) return 0;
	return nextProbabilities(model, context)[id];
}

export function surprisal(model: NgramModel, context: readonly string[], token: string): number {
	const probability = probabilityOf(model, context, token);
	if (probability <= 0) return Infinity;
	return -Math.log(probability) * BITS_PER_NAT;
}

export function generate(
	model: NgramModel,
	seed: readonly string[],
	length: number,
	pick: (probabilities: Float64Array) => number
): string[] {
	const produced: string[] = [...seed];
	for (let step = 0; step < length; step += 1) {
		const id = pick(nextProbabilities(model, produced));
		produced.push(model.vocabulary[id]);
	}
	return produced.slice(seed.length);
}

export function perplexity(model: NgramModel, source: Tokenized): number {
	const historyLength = model.order - 1;
	let totalLogProbability = 0;
	let counted = 0;

	for (let position = historyLength; position < source.tokens.length; position += 1) {
		const context = source.tokens.slice(position - historyLength, position);
		const probability = probabilityOf(model, context, source.tokens[position]);
		if (probability <= 0) continue;
		totalLogProbability += Math.log(probability);
		counted += 1;
	}

	return counted === 0 ? Infinity : Math.exp(-totalLogProbability / counted);
}
