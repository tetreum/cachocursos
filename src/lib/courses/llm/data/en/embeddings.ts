import type { CuratedAnalogy, OddOneOutPuzzle, WordDefinition } from '../../models/embeddings';

export const AXES = [
	'animate',
	'human',
	'gender',
	'plural',
	'power',
	'size',
	'place',
	'capital',
	'edible',
	'natural',
	'motion',
	'tense',
	'degree',
	'abstract',
	'valence',
	'job',
	'domestic',
	'identityX',
	'identityY'
] as const;

export const AXIS_LABELS: Record<string, string> = {
	animate: 'living thing',
	human: 'human',
	gender: 'gender (male → female)',
	plural: 'number (singular → plural)',
	power: 'power / royalty',
	size: 'size',
	place: 'is a place',
	capital: 'city versus country',
	edible: 'edible',
	natural: 'natural versus made',
	motion: 'motion',
	tense: 'tense (present → past)',
	degree: 'degree (plain → comparative)',
	abstract: 'abstract',
	valence: 'connotation',
	job: 'occupation',
	domestic: 'household',
	identityX: 'geographic identity (axis 1)',
	identityY: 'geographic identity (axis 2)'
};

const definition = (
	word: string,
	cluster: string,
	axes: Partial<Record<(typeof AXES)[number], number>>
): WordDefinition => ({ word, cluster, axes: axes as Record<string, number> });

export const WORDS: readonly WordDefinition[] = [
	definition('king', 'royalty', { animate: 1, human: 1, gender: -1, power: 1, job: 0.6 }),
	definition('queen', 'royalty', { animate: 1, human: 1, gender: 1, power: 1, job: 0.6 }),
	definition('prince', 'royalty', { animate: 1, human: 1, gender: -1, power: 0.6, job: 0.5 }),
	definition('princess', 'royalty', { animate: 1, human: 1, gender: 1, power: 0.6, job: 0.5 }),
	definition('emperor', 'royalty', { animate: 1, human: 1, gender: -1, power: 1.3, job: 0.6 }),
	definition('empress', 'royalty', { animate: 1, human: 1, gender: 1, power: 1.3, job: 0.6 }),

	definition('man', 'people', { animate: 1, human: 1, gender: -1 }),
	definition('woman', 'people', { animate: 1, human: 1, gender: 1 }),
	definition('boy', 'people', { animate: 1, human: 1, gender: -1, size: -0.6 }),
	definition('girl', 'people', { animate: 1, human: 1, gender: 1, size: -0.6 }),
	definition('father', 'people', { animate: 1, human: 1, gender: -1, power: 0.3 }),
	definition('mother', 'people', { animate: 1, human: 1, gender: 1, power: 0.3 }),
	definition('brother', 'people', { animate: 1, human: 1, gender: -1, size: -0.2 }),
	definition('sister', 'people', { animate: 1, human: 1, gender: 1, size: -0.2 }),
	definition('grandfather', 'people', { animate: 1, human: 1, gender: -1, size: 0.2 }),
	definition('grandmother', 'people', { animate: 1, human: 1, gender: 1, size: 0.2 }),

	definition('doctor', 'jobs', { animate: 1, human: 1, job: 1 }),
	definition('teacher', 'jobs', { animate: 1, human: 1, job: 1, size: -0.1 }),
	definition('baker', 'jobs', { animate: 1, human: 1, job: 1, edible: 0.4 }),
	definition('sailor', 'jobs', { animate: 1, human: 1, job: 1, motion: 0.5 }),
	definition('actor', 'jobs', { animate: 1, human: 1, gender: -1, job: 0.9 }),
	definition('actress', 'jobs', { animate: 1, human: 1, gender: 1, job: 0.9 }),
	definition('waiter', 'jobs', { animate: 1, human: 1, gender: -1, job: 0.8, edible: 0.3 }),
	definition('waitress', 'jobs', { animate: 1, human: 1, gender: 1, job: 0.8, edible: 0.3 }),

	definition('dog', 'animals', { animate: 1, domestic: 0.8, size: -0.2 }),
	definition('dogs', 'animals', { animate: 1, domestic: 0.8, size: -0.2, plural: 1 }),
	definition('cat', 'animals', { animate: 1, domestic: 0.9, size: -0.4 }),
	definition('cats', 'animals', { animate: 1, domestic: 0.9, size: -0.4, plural: 1 }),
	definition('bird', 'animals', { animate: 1, motion: 0.8, size: -0.7 }),
	definition('birds', 'animals', { animate: 1, motion: 0.8, size: -0.7, plural: 1 }),
	definition('horse', 'animals', { animate: 1, gender: -1, size: 0.8, motion: 0.7 }),
	definition('mare', 'animals', { animate: 1, gender: 1, size: 0.8, motion: 0.7 }),
	definition('rooster', 'animals', { animate: 1, gender: -1, domestic: 0.6, size: -0.4 }),
	definition('hen', 'animals', { animate: 1, gender: 1, domestic: 0.6, size: -0.4 }),
	definition('lion', 'animals', { animate: 1, gender: -1, size: 0.7, power: 0.5 }),
	definition('lioness', 'animals', { animate: 1, gender: 1, size: 0.7, power: 0.5 }),
	definition('bull', 'animals', { animate: 1, gender: -1, size: 0.9, domestic: 0.4 }),
	definition('cow', 'animals', { animate: 1, gender: 1, size: 0.9, domestic: 0.4 }),
	definition('mouse', 'animals', { animate: 1, size: -1 }),
	definition('elephant', 'animals', { animate: 1, size: 1.3 }),
	definition('fish', 'animals', { animate: 1, size: -0.6, edible: 0.5 }),

	definition('spain', 'geography', {
		place: 1,
		capital: -1,
		size: 1,
		identityX: 0.8,
		identityY: 0
	}),
	definition('madrid', 'geography', {
		place: 1,
		capital: 1,
		size: 0.5,
		identityX: 0.8,
		identityY: 0
	}),
	definition('france', 'geography', {
		place: 1,
		capital: -1,
		size: 1,
		identityX: 0.4,
		identityY: 0.693
	}),
	definition('paris', 'geography', {
		place: 1,
		capital: 1,
		size: 0.5,
		identityX: 0.4,
		identityY: 0.693
	}),
	definition('italy', 'geography', {
		place: 1,
		capital: -1,
		size: 1,
		identityX: -0.4,
		identityY: 0.693
	}),
	definition('rome', 'geography', {
		place: 1,
		capital: 1,
		size: 0.5,
		identityX: -0.4,
		identityY: 0.693
	}),
	definition('japan', 'geography', {
		place: 1,
		capital: -1,
		size: 1,
		identityX: -0.8,
		identityY: 0
	}),
	definition('tokyo', 'geography', {
		place: 1,
		capital: 1,
		size: 0.5,
		identityX: -0.8,
		identityY: 0
	}),
	definition('portugal', 'geography', {
		place: 1,
		capital: -1,
		size: 1,
		identityX: -0.4,
		identityY: -0.693
	}),
	definition('lisbon', 'geography', {
		place: 1,
		capital: 1,
		size: 0.5,
		identityX: -0.4,
		identityY: -0.693
	}),
	definition('mexico', 'geography', {
		place: 1,
		capital: -1,
		size: 1,
		identityX: 0.4,
		identityY: -0.693
	}),

	definition('mountain', 'nature', { place: 0.8, natural: 1, size: 1.2 }),
	definition('river', 'nature', { place: 0.8, natural: 1, motion: 0.6 }),
	definition('sea', 'nature', { place: 0.8, natural: 1, size: 1.2, motion: 0.4 }),
	definition('forest', 'nature', { place: 0.8, natural: 1, size: 0.9 }),
	definition('beach', 'nature', { place: 0.9, natural: 1, size: 0.4 }),
	definition('island', 'nature', { place: 0.9, natural: 1, size: 0.5 }),
	definition('rain', 'nature', { natural: 1, motion: 0.6, abstract: 0.3 }),
	definition('wind', 'nature', { natural: 1, motion: 0.9, abstract: 0.4 }),
	definition('sun', 'nature', { natural: 1, size: 1.1, valence: 0.6 }),
	definition('moon', 'nature', { natural: 1, size: 0.8, valence: 0.4 }),

	definition('bread', 'food', { edible: 1, size: -0.3 }),
	definition('cheese', 'food', { edible: 1, size: -0.4 }),
	definition('apple', 'food', { edible: 1, natural: 0.8, size: -0.5 }),
	definition('orange', 'food', { edible: 1, natural: 0.8, size: -0.5 }),
	definition('meat', 'food', { edible: 1, natural: 0.6 }),
	definition('wine', 'food', { edible: 0.9, valence: 0.4 }),
	definition('water', 'food', { edible: 0.8, natural: 1 }),
	definition('salt', 'food', { edible: 0.8, natural: 0.6, size: -0.9 }),
	definition('sugar', 'food', { edible: 0.9, size: -0.9, valence: 0.4 }),

	definition('house', 'objects', { place: 0.7, natural: -1, size: 0.7, domestic: 0.8 }),
	definition('door', 'objects', { natural: -1, size: 0.2, domestic: 0.6 }),
	definition('window', 'objects', { natural: -1, size: 0.1, domestic: 0.6 }),
	definition('chair', 'objects', { natural: -1, size: -0.2, domestic: 0.7 }),
	definition('table', 'objects', { natural: -1, size: 0.1, domestic: 0.7 }),
	definition('book', 'objects', { natural: -1, size: -0.4, abstract: 0.5 }),
	definition('ship', 'objects', { natural: -1, size: 0.9, motion: 0.8 }),
	definition('car', 'objects', { natural: -1, size: 0.5, motion: 1 }),
	definition('lighthouse', 'objects', { natural: -1, place: 0.5, size: 0.8 }),
	definition('lamp', 'objects', { natural: -1, size: -0.3, domestic: 0.6 }),

	definition('walk', 'verbs', { abstract: 0.8, motion: 0.9, tense: 0 }),
	definition('walked', 'verbs', { abstract: 0.8, motion: 0.9, tense: 1 }),
	definition('eat', 'verbs', { abstract: 0.8, edible: 0.5, tense: 0 }),
	definition('ate', 'verbs', { abstract: 0.8, edible: 0.5, tense: 1 }),
	definition('speak', 'verbs', { abstract: 0.9, human: 0.5, tense: 0 }),
	definition('spoke', 'verbs', { abstract: 0.9, human: 0.5, tense: 1 }),
	definition('run', 'verbs', { abstract: 0.8, motion: 1.2, tense: 0 }),
	definition('ran', 'verbs', { abstract: 0.8, motion: 1.2, tense: 1 }),

	definition('big', 'adjectives', { abstract: 0.7, size: 1, degree: 0 }),
	definition('bigger', 'adjectives', { abstract: 0.7, size: 1, degree: 1 }),
	definition('small', 'adjectives', { abstract: 0.7, size: -1, degree: 0 }),
	definition('smaller', 'adjectives', { abstract: 0.7, size: -1, degree: 1 }),
	definition('fast', 'adjectives', { abstract: 0.7, motion: 1, degree: 0 }),
	definition('faster', 'adjectives', { abstract: 0.7, motion: 1, degree: 1 }),
	definition('slow', 'adjectives', { abstract: 0.7, motion: -1, degree: 0 }),
	definition('slower', 'adjectives', { abstract: 0.7, motion: -1, degree: 1 }),

	definition('joy', 'emotions', { abstract: 1.2, valence: 1 }),
	definition('sadness', 'emotions', { abstract: 1.2, valence: -1 }),
	definition('fear', 'emotions', { abstract: 1.2, valence: -0.9 }),
	definition('love', 'emotions', { abstract: 1.2, valence: 1.1 }),
	definition('anger', 'emotions', { abstract: 1.2, valence: -1 }),
	definition('calm', 'emotions', { abstract: 1.2, valence: 0.7, motion: -0.5 }),
	definition('freedom', 'emotions', { abstract: 1.3, valence: 1, power: 0.4 }),
	definition('justice', 'emotions', { abstract: 1.3, valence: 0.8, power: 0.5 })
];

export const CURATED_ANALOGIES: readonly CuratedAnalogy[] = [
	{
		from: 'man',
		to: 'king',
		query: 'woman',
		expected: 'queen',
		explanation: 'The direction from “man” to “king” is power. Apply it to “woman”.'
	},
	{
		from: 'spain',
		to: 'madrid',
		query: 'japan',
		expected: 'tokyo',
		explanation: 'The country → capital direction is the same for every country.'
	},
	{
		from: 'dog',
		to: 'dogs',
		query: 'cat',
		expected: 'cats',
		explanation: 'Number is a constant direction in the space.'
	},
	{
		from: 'walk',
		to: 'walked',
		query: 'eat',
		expected: 'ate',
		explanation: 'Tense is a direction too: present → past.'
	},
	{
		from: 'big',
		to: 'bigger',
		query: 'small',
		expected: 'smaller',
		explanation: 'The comparative is another arrow, and it points the same way for every adjective.'
	},
	{
		from: 'france',
		to: 'paris',
		query: 'italy',
		expected: 'rome',
		explanation: 'Another country → capital pair, the very same arrow.'
	}
];

export const ODD_ONE_OUT_PUZZLES: readonly OddOneOutPuzzle[] = [
	{
		words: ['dog', 'cat', 'bird', 'chair'],
		expected: 'chair',
		explanation: 'Three animals and a piece of furniture.'
	},
	{
		words: ['madrid', 'paris', 'rome', 'japan'],
		expected: 'japan',
		explanation: 'Three capitals and a country.'
	},
	{
		words: ['bread', 'cheese', 'apple', 'book'],
		expected: 'book',
		explanation: 'Three foods and an object.'
	},
	{
		words: ['joy', 'love', 'calm', 'mouse'],
		expected: 'mouse',
		explanation: 'Three emotions and an animal.'
	}
];
