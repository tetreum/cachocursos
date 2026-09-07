export type Rng = () => number;

const HASH_PRIME_A = 0x85ebca6b;
const HASH_PRIME_B = 0xc2b2ae35;
const HASH_PRIME_C = 0x27d4eb2f;
const MULBERRY_INCREMENT = 0x6d2b79f5;
const UINT32_RANGE = 4294967296;

export function hash32(value: number, key: number): number {
	let mixed = (value ^ Math.imul(key, HASH_PRIME_C)) >>> 0;
	mixed ^= mixed >>> 16;
	mixed = Math.imul(mixed, HASH_PRIME_A) >>> 0;
	mixed ^= mixed >>> 13;
	mixed = Math.imul(mixed, HASH_PRIME_B) >>> 0;
	mixed ^= mixed >>> 16;
	return mixed >>> 0;
}

export function mulberry32(seed: number): Rng {
	let state = seed >>> 0;
	return function next(): number {
		state = (state + MULBERRY_INCREMENT) >>> 0;
		let scrambled = state;
		scrambled = Math.imul(scrambled ^ (scrambled >>> 15), scrambled | 1);
		scrambled ^= scrambled + Math.imul(scrambled ^ (scrambled >>> 7), scrambled | 61);
		return ((scrambled ^ (scrambled >>> 14)) >>> 0) / UINT32_RANGE;
	};
}

export function shuffled<Item>(items: readonly Item[], random: Rng): Item[] {
	const result = items.slice();
	for (let index = result.length - 1; index > 0; index -= 1) {
		const target = Math.floor(random() * (index + 1));
		[result[index], result[target]] = [result[target], result[index]];
	}
	return result;
}

export function shuffledIndices(length: number, random: Rng): Int32Array {
	const result = new Int32Array(length);
	for (let index = 0; index < length; index += 1) result[index] = index;
	for (let index = length - 1; index > 0; index -= 1) {
		const target = Math.floor(random() * (index + 1));
		const held = result[index];
		result[index] = result[target];
		result[target] = held;
	}
	return result;
}

export function sampleIndex(probabilities: ArrayLike<number>, random: Rng): number {
	const threshold = random();
	let cumulative = 0;
	for (let index = 0; index < probabilities.length; index += 1) {
		cumulative += probabilities[index];
		if (threshold < cumulative) return index;
	}
	return probabilities.length - 1;
}
