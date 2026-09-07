import type { TransformerFlowData } from '../types';
import type { AttentionPuzzle } from '../../models/attention';

export const ATTENTION_PUZZLES: readonly AttentionPuzzle[] = [
	{
		id: 'trophy',
		sentence: 'The trophy did not fit in the suitcase because it was too big.',
		tokens: [
			'The',
			'trophy',
			'did',
			'not',
			'fit',
			'in',
			'the',
			'suitcase',
			'because',
			'it',
			'was',
			'too',
			'big'
		],
		queryIndex: 9,
		gold: [0, 0.55, 0, 0, 0.08, 0, 0, 0.15, 0.05, 0, 0, 0.02, 0.15],
		answerIndex: 1,
		distractorIndex: 7,
		explanation:
			'“It” refers to the trophy: if the suitcase were too big, the trophy would fit easily. Solving it means looking mostly at “trophy”, and a little at “big”, which is what disambiguates.'
	},
	{
		id: 'key',
		sentence: 'I left the key on the table and later I lost it.',
		tokens: ['I', 'left', 'the', 'key', 'on', 'the', 'table', 'and', 'later', 'I', 'lost', 'it'],
		queryIndex: 11,
		gold: [0, 0.03, 0, 0.6, 0, 0, 0.12, 0, 0, 0, 0.25, 0],
		answerIndex: 3,
		distractorIndex: 6,
		explanation:
			'The pronoun “it” points at “key”, not at “table”. Nobody loses a table: the verb “lost” is the decisive clue, so it deserves attention too.'
	},
	{
		id: 'bank',
		sentence: 'I went to the bank to take out money before it closed.',
		tokens: [
			'I',
			'went',
			'to',
			'the',
			'bank',
			'to',
			'take',
			'out',
			'money',
			'before',
			'it',
			'closed'
		],
		queryIndex: 4,
		gold: [0, 0.02, 0, 0, 0, 0, 0.15, 0.15, 0.45, 0, 0, 0.23],
		answerIndex: 8,
		distractorIndex: 0,
		explanation:
			'To know which “bank” this is, the key word is “money”, helped by “take out” and “closed”. Without them, a bank could be a riverbank.'
	}
];

export const TRANSFORMER_FLOW: TransformerFlowData = {
	sentence: 'the lighthouse watched the sea',
	tokens: ['the', 'lighthouse', 'watched', 'the', 'sea'],
	queryIndex: 2,
	attention: [0.06, 0.42, 0, 0.07, 0.45],
	candidates: [
		{ word: 'all', probability: 0.34 },
		{ word: 'from', probability: 0.22 },
		{ word: 'in', probability: 0.16 },
		{ word: 'and', probability: 0.09 }
	]
};
