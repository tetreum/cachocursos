export interface EmbeddingTable {
	readonly words: readonly string[];
	readonly axes: readonly string[];
	readonly clusters: readonly string[];
	readonly dimension: number;
	readonly data: Float32Array;
	readonly index: ReadonlyMap<string, number>;
	readonly projection: Float32Array;
}

export interface Neighbour {
	word: string;
	index: number;
	score: number;
}

export interface WordDefinition {
	word: string;
	cluster: string;
	axes: Record<string, number>;
}

const POWER_ITERATIONS = 60;
const EPSILON = 1e-9;

export function cosine(left: ArrayLike<number>, right: ArrayLike<number>): number {
	let dot = 0;
	let leftNorm = 0;
	let rightNorm = 0;
	for (let index = 0; index < left.length; index += 1) {
		dot += left[index] * right[index];
		leftNorm += left[index] * left[index];
		rightNorm += right[index] * right[index];
	}
	const denominator = Math.sqrt(leftNorm) * Math.sqrt(rightNorm);
	return denominator < EPSILON ? 0 : dot / denominator;
}

export function euclidean(left: ArrayLike<number>, right: ArrayLike<number>): number {
	let total = 0;
	for (let index = 0; index < left.length; index += 1) {
		const difference = left[index] - right[index];
		total += difference * difference;
	}
	return Math.sqrt(total);
}

export function add(left: ArrayLike<number>, right: ArrayLike<number>): Float32Array {
	const result = new Float32Array(left.length);
	for (let index = 0; index < left.length; index += 1) result[index] = left[index] + right[index];
	return result;
}

export function subtract(left: ArrayLike<number>, right: ArrayLike<number>): Float32Array {
	const result = new Float32Array(left.length);
	for (let index = 0; index < left.length; index += 1) result[index] = left[index] - right[index];
	return result;
}

function principalComponents(data: Float32Array, rows: number, dimension: number): Float32Array {
	const centred = new Float32Array(data.length);
	const means = new Float64Array(dimension);
	for (let row = 0; row < rows; row += 1) {
		for (let axis = 0; axis < dimension; axis += 1) means[axis] += data[row * dimension + axis];
	}
	for (let axis = 0; axis < dimension; axis += 1) means[axis] /= rows;
	for (let row = 0; row < rows; row += 1) {
		for (let axis = 0; axis < dimension; axis += 1) {
			centred[row * dimension + axis] = data[row * dimension + axis] - means[axis];
		}
	}

	const covariance = new Float64Array(dimension * dimension);
	for (let row = 0; row < rows; row += 1) {
		for (let first = 0; first < dimension; first += 1) {
			const value = centred[row * dimension + first];
			for (let second = 0; second < dimension; second += 1) {
				covariance[first * dimension + second] += value * centred[row * dimension + second];
			}
		}
	}

	const components: Float64Array[] = [];
	for (let component = 0; component < 2; component += 1) {
		let vector = new Float64Array(dimension);
		for (let axis = 0; axis < dimension; axis += 1) vector[axis] = Math.sin(axis + component + 1);

		for (let iteration = 0; iteration < POWER_ITERATIONS; iteration += 1) {
			const next = new Float64Array(dimension);
			for (let first = 0; first < dimension; first += 1) {
				let total = 0;
				for (let second = 0; second < dimension; second += 1) {
					total += covariance[first * dimension + second] * vector[second];
				}
				next[first] = total;
			}
			for (const previous of components) {
				let dot = 0;
				for (let axis = 0; axis < dimension; axis += 1) dot += next[axis] * previous[axis];
				for (let axis = 0; axis < dimension; axis += 1) next[axis] -= dot * previous[axis];
			}
			let norm = 0;
			for (let axis = 0; axis < dimension; axis += 1) norm += next[axis] * next[axis];
			norm = Math.sqrt(norm);
			if (norm < EPSILON) break;
			for (let axis = 0; axis < dimension; axis += 1) next[axis] /= norm;
			vector = next;
		}
		components.push(vector);
	}

	const projection = new Float32Array(rows * 2);
	for (let row = 0; row < rows; row += 1) {
		for (let component = 0; component < 2; component += 1) {
			let total = 0;
			for (let axis = 0; axis < dimension; axis += 1) {
				total += centred[row * dimension + axis] * components[component][axis];
			}
			projection[row * 2 + component] = total;
		}
	}

	let largest = EPSILON;
	for (let index = 0; index < projection.length; index += 1) {
		largest = Math.max(largest, Math.abs(projection[index]));
	}
	for (let index = 0; index < projection.length; index += 1) projection[index] /= largest;

	return projection;
}

export function buildTable(
	definitions: readonly WordDefinition[],
	axes: readonly string[]
): EmbeddingTable {
	const dimension = axes.length;
	const words = definitions.map((definition) => definition.word);
	const clusters = definitions.map((definition) => definition.cluster);
	const data = new Float32Array(definitions.length * dimension);
	const index = new Map<string, number>();

	definitions.forEach((definition, row) => {
		index.set(definition.word, row);
		axes.forEach((axis, column) => {
			data[row * dimension + column] = definition.axes[axis] ?? 0;
		});
	});

	return {
		words,
		axes,
		clusters,
		dimension,
		data,
		index,
		projection: principalComponents(data, definitions.length, dimension)
	};
}

export function vector(table: EmbeddingTable, word: string): Float32Array | null {
	const row = table.index.get(word);
	if (row === undefined) return null;
	return table.data.subarray(row * table.dimension, (row + 1) * table.dimension);
}

export function coordinates(table: EmbeddingTable, word: string): [number, number] | null {
	const row = table.index.get(word);
	if (row === undefined) return null;
	return [table.projection[row * 2], table.projection[row * 2 + 1]];
}

export function nearest(
	table: EmbeddingTable,
	query: ArrayLike<number>,
	count: number,
	exclude: readonly string[] = []
): Neighbour[] {
	const excluded = new Set(exclude);
	const scored: Neighbour[] = [];

	for (let row = 0; row < table.words.length; row += 1) {
		const word = table.words[row];
		if (excluded.has(word)) continue;
		const candidate = table.data.subarray(row * table.dimension, (row + 1) * table.dimension);
		scored.push({ word, index: row, score: cosine(query, candidate) });
	}

	scored.sort((left, right) => {
		const difference = right.score - left.score;
		return difference !== 0 ? difference : left.word.localeCompare(right.word);
	});

	return scored.slice(0, count);
}

export function analogy(
	table: EmbeddingTable,
	from: string,
	to: string,
	query: string,
	count = 5
): Neighbour[] {
	const fromVector = vector(table, from);
	const toVector = vector(table, to);
	const queryVector = vector(table, query);
	if (fromVector === null || toVector === null || queryVector === null) return [];

	const target = add(subtract(toVector, fromVector), queryVector);
	return nearest(table, target, count, [from, to, query]);
}

export function oddOneOut(table: EmbeddingTable, words: readonly string[]): string | null {
	if (words.length < 3) return null;
	let worstWord: string | null = null;
	let worstScore = Infinity;

	for (const candidate of words) {
		const candidateVector = vector(table, candidate);
		if (candidateVector === null) continue;
		let total = 0;
		let counted = 0;
		for (const other of words) {
			if (other === candidate) continue;
			const otherVector = vector(table, other);
			if (otherVector === null) continue;
			total += cosine(candidateVector, otherVector);
			counted += 1;
		}
		const average = counted === 0 ? 0 : total / counted;
		if (average < worstScore) {
			worstScore = average;
			worstWord = candidate;
		}
	}

	return worstWord;
}

export interface CuratedAnalogy {
	from: string;
	to: string;
	query: string;
	expected: string;
	explanation: string;
}

export interface OddOneOutPuzzle {
	words: readonly string[];
	expected: string;
	explanation: string;
}
