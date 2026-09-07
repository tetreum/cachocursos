export const END_OF_WORD = '</w>';

export type Pair = readonly [string, string];

export interface WordEntry {
	symbols: readonly string[];
	frequency: number;
}

export interface AppliedMerge {
	pair: Pair;
	count: number;
	symbol: string;
	rank: number;
}

export interface RankedPair {
	pair: Pair;
	count: number;
}

export interface BpeState {
	readonly words: readonly WordEntry[];
	readonly merges: readonly AppliedMerge[];
	readonly vocabulary: readonly string[];
	readonly baseTokenCount: number;
}

const PAIR_SEPARATOR = ' ';
const WORD_PATTERN = /[\p{L}\p{N}]+/gu;

export function pairKey(first: string, second: string): string {
	return `${first}${PAIR_SEPARATOR}${second}`;
}

export function parsePairKey(key: string): Pair {
	const separatorIndex = key.indexOf(PAIR_SEPARATOR);
	return [key.slice(0, separatorIndex), key.slice(separatorIndex + 1)];
}

function splitWords(corpus: string, lowercase: boolean): string[] {
	const source = lowercase ? corpus.toLowerCase() : corpus;
	return source.match(WORD_PATTERN) ?? [];
}

function collectVocabulary(words: readonly WordEntry[]): string[] {
	const seen = new Set<string>();
	for (const word of words) {
		for (const symbol of word.symbols) seen.add(symbol);
	}
	return Array.from(seen).sort();
}

export function tokenCount(state: BpeState): number {
	let total = 0;
	for (const word of state.words) total += word.symbols.length * word.frequency;
	return total;
}

export function initBpe(corpus: string, options: { lowercase?: boolean } = {}): BpeState {
	const lowercase = options.lowercase ?? true;
	const frequencies = new Map<string, number>();
	for (const word of splitWords(corpus, lowercase)) {
		frequencies.set(word, (frequencies.get(word) ?? 0) + 1);
	}

	const words: WordEntry[] = [];
	for (const [word, frequency] of frequencies) {
		words.push({ symbols: [...Array.from(word), END_OF_WORD], frequency });
	}
	words.sort(
		(left, right) => right.frequency - left.frequency || left.symbols.length - right.symbols.length
	);

	const withoutBase: BpeState = {
		words,
		merges: [],
		vocabulary: collectVocabulary(words),
		baseTokenCount: 0
	};

	return { ...withoutBase, baseTokenCount: tokenCount(withoutBase) };
}

export function wordCount(state: BpeState): number {
	let total = 0;
	for (const word of state.words) total += word.frequency;
	return total;
}

export function compressionRatio(state: BpeState): number {
	const current = tokenCount(state);
	return current === 0 ? 1 : state.baseTokenCount / current;
}

export function pairCounts(state: BpeState): Map<string, number> {
	const counts = new Map<string, number>();
	for (const word of state.words) {
		const { symbols, frequency } = word;
		for (let index = 0; index < symbols.length - 1; index += 1) {
			const key = pairKey(symbols[index], symbols[index + 1]);
			counts.set(key, (counts.get(key) ?? 0) + frequency);
		}
	}
	return counts;
}

export function rankedPairs(state: BpeState, limit?: number): RankedPair[] {
	const entries = Array.from(pairCounts(state).entries());
	entries.sort((left, right) => {
		const difference = right[1] - left[1];
		return difference !== 0 ? difference : left[0].localeCompare(right[0]);
	});
	const sliced = limit === undefined ? entries : entries.slice(0, limit);
	return sliced.map(([key, count]) => ({ pair: parsePairKey(key), count }));
}

export function bestPair(state: BpeState): Pair | null {
	const ranked = rankedPairs(state, 1);
	return ranked.length > 0 ? ranked[0].pair : null;
}

function mergeSymbols(symbols: readonly string[], pair: Pair): string[] {
	const merged: string[] = [];
	const [first, second] = pair;
	let index = 0;
	while (index < symbols.length) {
		if (index < symbols.length - 1 && symbols[index] === first && symbols[index + 1] === second) {
			merged.push(first + second);
			index += 2;
		} else {
			merged.push(symbols[index]);
			index += 1;
		}
	}
	return merged;
}

export function applyMerge(state: BpeState, pair: Pair): BpeState {
	const count = pairCounts(state).get(pairKey(pair[0], pair[1])) ?? 0;
	const symbol = pair[0] + pair[1];
	const words = state.words.map((word) => {
		const symbols = mergeSymbols(word.symbols, pair);
		return symbols.length === word.symbols.length ? word : { ...word, symbols };
	});

	return {
		words,
		merges: [...state.merges, { pair, count, symbol, rank: state.merges.length }],
		vocabulary: collectVocabulary(words),
		baseTokenCount: state.baseTokenCount
	};
}

export function trainBpe(state: BpeState, numberOfMerges: number): BpeState {
	let current = state;
	for (let step = 0; step < numberOfMerges; step += 1) {
		const pair = bestPair(current);
		if (pair === null) break;
		current = applyMerge(current, pair);
	}
	return current;
}

export function mergeQuality(state: BpeState, chosen: Pair): number {
	const counts = pairCounts(state);
	const chosenCount = counts.get(pairKey(chosen[0], chosen[1])) ?? 0;
	let largest = 0;
	for (const count of counts.values()) {
		if (count > largest) largest = count;
	}
	return largest === 0 ? 0 : chosenCount / largest;
}

export function encodeWord(word: string, merges: readonly AppliedMerge[]): string[] {
	let symbols = [...Array.from(word), END_OF_WORD];
	for (const merge of merges) {
		symbols = mergeSymbols(symbols, merge.pair);
	}
	return symbols;
}

export function encode(
	text: string,
	merges: readonly AppliedMerge[],
	options: { lowercase?: boolean } = {}
): string[] {
	const lowercase = options.lowercase ?? true;
	const tokens: string[] = [];
	for (const word of splitWords(text, lowercase)) {
		tokens.push(...encodeWord(word, merges));
	}
	return tokens;
}

export function decode(tokens: readonly string[]): string {
	return tokens
		.join('')
		.split(END_OF_WORD)
		.filter((word) => word.length > 0)
		.join(' ');
}
