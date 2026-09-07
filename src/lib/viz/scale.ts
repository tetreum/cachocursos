export interface LinearScale {
	(value: number): number;
	invert(pixel: number): number;
	domain: readonly [number, number];
	range: readonly [number, number];
}

export function linearScale(
	domain: readonly [number, number],
	range: readonly [number, number]
): LinearScale {
	const [domainStart, domainEnd] = domain;
	const [rangeStart, rangeEnd] = range;
	const span = domainEnd - domainStart || 1;

	const scale = ((value: number): number =>
		rangeStart + ((value - domainStart) / span) * (rangeEnd - rangeStart)) as LinearScale;

	scale.invert = (pixel: number): number =>
		domainStart + ((pixel - rangeStart) / (rangeEnd - rangeStart || 1)) * span;
	scale.domain = domain;
	scale.range = range;
	return scale;
}

export function logScale(
	domain: readonly [number, number],
	range: readonly [number, number]
): LinearScale {
	const inner = linearScale([Math.log10(domain[0]), Math.log10(domain[1])], range);
	const scale = ((value: number): number =>
		inner(Math.log10(Math.max(value, Number.MIN_VALUE)))) as LinearScale;
	scale.invert = (pixel: number): number => Math.pow(10, inner.invert(pixel));
	scale.domain = domain;
	scale.range = range;
	return scale;
}

export function niceTicks(start: number, end: number, count = 5): number[] {
	if (!Number.isFinite(start) || !Number.isFinite(end) || start === end) return [start];
	const span = end - start;
	const rawStep = span / count;
	const magnitude = Math.pow(10, Math.floor(Math.log10(Math.abs(rawStep))));
	const normalized = rawStep / magnitude;
	const stepFactor = normalized >= 5 ? 10 : normalized >= 2 ? 5 : normalized >= 1 ? 2 : 1;
	const step = stepFactor * magnitude;

	const ticks: number[] = [];
	for (let value = Math.ceil(start / step) * step; value <= end + step * 0.001; value += step) {
		ticks.push(Number(value.toFixed(10)));
	}
	return ticks;
}

export function extent(values: readonly number[]): [number, number] {
	if (values.length === 0) return [0, 1];
	let smallest = values[0];
	let largest = values[0];
	for (const value of values) {
		if (value < smallest) smallest = value;
		if (value > largest) largest = value;
	}
	return smallest === largest ? [smallest - 1, largest + 1] : [smallest, largest];
}

export function linePath(points: readonly (readonly [number, number])[]): string {
	if (points.length === 0) return '';
	return points
		.map(([x, y], index) => `${index === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`)
		.join(' ');
}
