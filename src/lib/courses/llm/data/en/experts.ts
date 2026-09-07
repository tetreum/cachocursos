import type { Expert, RoutableToken } from '../../models/moe';

export const EXPERTS: readonly Expert[] = [
	{
		id: 'numeros',
		name: 'Expert A',
		short: 'A',
		blurb: 'Ended up specialising in figures and quantities'
	},
	{
		id: 'codigo',
		name: 'Expert B',
		short: 'B',
		blurb: 'Ended up specialising in code and symbols'
	},
	{
		id: 'funcion',
		name: 'Expert C',
		short: 'C',
		blurb: 'Ended up specialising in function words'
	},
	{
		id: 'concretos',
		name: 'Expert D',
		short: 'D',
		blurb: 'Ended up specialising in concrete nouns'
	}
];

const token = (
	id: string,
	text: string,
	kind: string,
	digits: number,
	code: number,
	grammar: number,
	concrete: number,
	features: readonly number[]
): RoutableToken => ({
	id,
	text,
	kind,
	affinity: [digits, code, grammar, concrete],
	features
});

export const ROUTABLE_TOKENS: readonly RoutableToken[] = [
	token('t1', '42', 'number', 0.95, 0.35, 0.05, 0.1, [0.95, 0.25, 0.05, 0.05]),
	token('t2', '0.75', 'number', 0.94, 0.4, 0.05, 0.08, [0.92, 0.35, 0.05, 0.05]),
	token('t3', '1998', 'number', 0.92, 0.2, 0.06, 0.12, [0.94, 0.1, 0.05, 0.1]),
	token('t4', 'def', 'code', 0.25, 0.95, 0.15, 0.08, [0.1, 0.9, 0.3, 0.05]),
	token('t5', '==', 'code', 0.3, 0.93, 0.1, 0.05, [0.15, 0.95, 0.05, 0.02]),
	token('t6', 'return', 'code', 0.2, 0.9, 0.2, 0.1, [0.05, 0.88, 0.25, 0.08]),
	token('t7', 'the', 'function word', 0.04, 0.08, 0.95, 0.15, [0.02, 0.05, 0.95, 0.1]),
	token('t8', 'of', 'function word', 0.05, 0.1, 0.94, 0.12, [0.02, 0.08, 0.93, 0.08]),
	token('t9', 'because', 'function word', 0.03, 0.06, 0.88, 0.18, [0.02, 0.04, 0.9, 0.12]),
	token('t10', 'lighthouse', 'noun', 0.06, 0.05, 0.15, 0.94, [0.03, 0.03, 0.1, 0.94]),
	token('t11', 'lamp', 'noun', 0.05, 0.06, 0.14, 0.92, [0.03, 0.04, 0.1, 0.92]),
	token('t12', 'cliff', 'noun', 0.04, 0.05, 0.12, 0.9, [0.02, 0.03, 0.08, 0.91])
];

export const FEATURE_NAMES: readonly string[] = ['digit', 'symbol', 'grammatical', 'concrete'];

export const TRAINED_ROUTER: readonly (readonly number[])[] = [
	[1.2, 0.15, -0.3, -0.2],
	[0.1, 1.25, -0.25, -0.3],
	[-0.35, -0.2, 1.3, 0.05],
	[-0.25, -0.3, 0.0, 1.25]
];

export const UNTRAINED_ROUTER: readonly (readonly number[])[] = [
	[0.07, -0.04, 0.05, -0.02],
	[-0.03, 0.06, -0.05, 0.04],
	[0.05, 0.03, -0.02, -0.06],
	[-0.06, -0.05, 0.04, 0.03]
];
