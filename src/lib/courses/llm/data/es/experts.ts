import type { Expert, RoutableToken } from '../../models/moe';

export const EXPERTS: readonly Expert[] = [
	{
		id: 'numeros',
		name: 'Experto A',
		short: 'A',
		blurb: 'Acabó especializándose en cifras y cantidades'
	},
	{
		id: 'codigo',
		name: 'Experto B',
		short: 'B',
		blurb: 'Acabó especializándose en código y símbolos'
	},
	{
		id: 'funcion',
		name: 'Experto C',
		short: 'C',
		blurb: 'Acabó especializándose en palabras funcionales'
	},
	{
		id: 'concretos',
		name: 'Experto D',
		short: 'D',
		blurb: 'Acabó especializándose en sustantivos concretos'
	}
];

const token = (
	id: string,
	text: string,
	kind: string,
	numeros: number,
	codigo: number,
	funcion: number,
	concretos: number,
	features: readonly number[]
): RoutableToken => ({
	id,
	text,
	kind,
	affinity: [numeros, codigo, funcion, concretos],
	features
});

export const ROUTABLE_TOKENS: readonly RoutableToken[] = [
	token('t1', '42', 'número', 0.95, 0.35, 0.05, 0.1, [0.95, 0.25, 0.05, 0.05]),
	token('t2', '0.75', 'número', 0.94, 0.4, 0.05, 0.08, [0.92, 0.35, 0.05, 0.05]),
	token('t3', '1998', 'número', 0.92, 0.2, 0.06, 0.12, [0.94, 0.1, 0.05, 0.1]),
	token('t4', 'def', 'código', 0.25, 0.95, 0.15, 0.08, [0.1, 0.9, 0.3, 0.05]),
	token('t5', '==', 'código', 0.3, 0.93, 0.1, 0.05, [0.15, 0.95, 0.05, 0.02]),
	token('t6', 'return', 'código', 0.2, 0.9, 0.2, 0.1, [0.05, 0.88, 0.25, 0.08]),
	token('t7', 'el', 'función', 0.04, 0.08, 0.95, 0.15, [0.02, 0.05, 0.95, 0.1]),
	token('t8', 'de', 'función', 0.05, 0.1, 0.94, 0.12, [0.02, 0.08, 0.93, 0.08]),
	token('t9', 'porque', 'función', 0.03, 0.06, 0.88, 0.18, [0.02, 0.04, 0.9, 0.12]),
	token('t10', 'faro', 'sustantivo', 0.06, 0.05, 0.15, 0.94, [0.03, 0.03, 0.1, 0.94]),
	token('t11', 'lámpara', 'sustantivo', 0.05, 0.06, 0.14, 0.92, [0.03, 0.04, 0.1, 0.92]),
	token('t12', 'acantilado', 'sustantivo', 0.04, 0.05, 0.12, 0.9, [0.02, 0.03, 0.08, 0.91])
];

export const FEATURE_NAMES: readonly string[] = ['dígito', 'símbolo', 'gramatical', 'concreto'];

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
