import type { TransformerFlowData } from '../types';
import type { AttentionPuzzle } from '../../models/attention';

export const ATTENTION_PUZZLES: readonly AttentionPuzzle[] = [
	{
		id: 'trofeo',
		sentence: 'El trofeo no cabía en la maleta porque era demasiado grande.',
		tokens: [
			'El',
			'trofeo',
			'no',
			'cabía',
			'en',
			'la',
			'maleta',
			'porque',
			'era',
			'demasiado',
			'grande'
		],
		queryIndex: 8,
		gold: [0, 0.55, 0, 0.08, 0, 0, 0.15, 0.05, 0, 0.02, 0.15],
		answerIndex: 1,
		distractorIndex: 6,
		explanation:
			'«Era» se refiere al trofeo: si la maleta fuera demasiado grande, el trofeo cabría de sobra. Para resolverlo hay que mirar sobre todo a «trofeo», y algo a «grande», que es lo que desambigua.'
	},
	{
		id: 'llave',
		sentence: 'Dejé la llave sobre la mesa y luego la perdí.',
		tokens: ['Dejé', 'la', 'llave', 'sobre', 'la', 'mesa', 'y', 'luego', 'la', 'perdí'],
		queryIndex: 8,
		gold: [0.03, 0, 0.6, 0, 0, 0.12, 0, 0, 0, 0.25],
		answerIndex: 2,
		distractorIndex: 5,
		explanation:
			'El pronombre «la» apunta a «llave», no a «mesa». Nadie pierde una mesa: el verbo «perdí» es la pista decisiva, así que también merece atención.'
	},
	{
		id: 'banco',
		sentence: 'Fui al banco a sacar dinero antes de que cerrara.',
		tokens: ['Fui', 'al', 'banco', 'a', 'sacar', 'dinero', 'antes', 'de', 'que', 'cerrara'],
		queryIndex: 2,
		gold: [0.02, 0, 0, 0, 0.3, 0.45, 0, 0, 0, 0.23],
		answerIndex: 5,
		distractorIndex: 0,
		explanation:
			'Para saber qué «banco» es este, la palabra clave es «dinero», ayudada por «sacar» y «cerrara». Sin ellas, «banco» podría ser un asiento.'
	}
];

export const TRANSFORMER_FLOW: TransformerFlowData = {
	sentence: 'el faro miraba al mar',
	tokens: ['el', 'faro', 'miraba', 'al', 'mar'],
	queryIndex: 2,
	attention: [0.06, 0.42, 0, 0.07, 0.45],
	candidates: [
		{ word: 'toda', probability: 0.34 },
		{ word: 'desde', probability: 0.22 },
		{ word: 'en', probability: 0.16 },
		{ word: 'y', probability: 0.09 }
	]
};
