import type { CuratedAnalogy, OddOneOutPuzzle, WordDefinition } from '../../models/embeddings';

export const AXES = [
	'animado',
	'humano',
	'genero',
	'plural',
	'poder',
	'tamano',
	'lugar',
	'capital',
	'comestible',
	'natural',
	'movimiento',
	'tiempo',
	'abstracto',
	'valencia',
	'oficio',
	'domestico',
	'identidadX',
	'identidadY'
] as const;

export const AXIS_LABELS: Record<string, string> = {
	animado: 'ser vivo',
	humano: 'humano',
	genero: 'género (masculino → femenino)',
	plural: 'número (singular → plural)',
	poder: 'poder / realeza',
	tamano: 'tamaño',
	lugar: 'es un lugar',
	capital: 'ciudad frente a país',
	comestible: 'comestible',
	natural: 'natural frente a artificial',
	movimiento: 'movimiento',
	tiempo: 'tiempo verbal (pasado → futuro)',
	abstracto: 'abstracto',
	valencia: 'connotación',
	oficio: 'oficio',
	domestico: 'doméstico',
	identidadX: 'identidad geográfica (eje 1)',
	identidadY: 'identidad geográfica (eje 2)'
};

const definition = (
	word: string,
	cluster: string,
	axes: Partial<Record<(typeof AXES)[number], number>>
): WordDefinition => ({ word, cluster, axes: axes as Record<string, number> });

export const WORDS: readonly WordDefinition[] = [
	definition('rey', 'realeza', { animado: 1, humano: 1, genero: -1, poder: 1, oficio: 0.6 }),
	definition('reina', 'realeza', { animado: 1, humano: 1, genero: 1, poder: 1, oficio: 0.6 }),
	definition('príncipe', 'realeza', { animado: 1, humano: 1, genero: -1, poder: 0.6, oficio: 0.5 }),
	definition('princesa', 'realeza', { animado: 1, humano: 1, genero: 1, poder: 0.6, oficio: 0.5 }),
	definition('emperador', 'realeza', {
		animado: 1,
		humano: 1,
		genero: -1,
		poder: 1.3,
		oficio: 0.6
	}),
	definition('emperatriz', 'realeza', {
		animado: 1,
		humano: 1,
		genero: 1,
		poder: 1.3,
		oficio: 0.6
	}),
	definition('hombre', 'personas', { animado: 1, humano: 1, genero: -1 }),
	definition('mujer', 'personas', { animado: 1, humano: 1, genero: 1 }),
	definition('niño', 'personas', { animado: 1, humano: 1, genero: -1, tamano: -0.6 }),
	definition('niña', 'personas', { animado: 1, humano: 1, genero: 1, tamano: -0.6 }),
	definition('padre', 'personas', { animado: 1, humano: 1, genero: -1, poder: 0.3 }),
	definition('madre', 'personas', { animado: 1, humano: 1, genero: 1, poder: 0.3 }),
	definition('hermano', 'personas', { animado: 1, humano: 1, genero: -1, tamano: -0.2 }),
	definition('hermana', 'personas', { animado: 1, humano: 1, genero: 1, tamano: -0.2 }),
	definition('abuelo', 'personas', {
		animado: 1,
		humano: 1,
		genero: -1,
		poder: 0.35,
		tiempo: -0.6
	}),
	definition('abuela', 'personas', { animado: 1, humano: 1, genero: 1, poder: 0.35, tiempo: -0.6 }),

	definition('médico', 'oficios', { animado: 1, humano: 1, genero: -1, oficio: 1, valencia: 0.5 }),
	definition('médica', 'oficios', { animado: 1, humano: 1, genero: 1, oficio: 1, valencia: 0.5 }),
	definition('maestro', 'oficios', { animado: 1, humano: 1, genero: -1, oficio: 1, valencia: 0.4 }),
	definition('maestra', 'oficios', { animado: 1, humano: 1, genero: 1, oficio: 1, valencia: 0.4 }),
	definition('panadero', 'oficios', {
		animado: 1,
		humano: 1,
		genero: -1,
		oficio: 1,
		comestible: 0.4
	}),
	definition('panadera', 'oficios', {
		animado: 1,
		humano: 1,
		genero: 1,
		oficio: 1,
		comestible: 0.4
	}),
	definition('marinero', 'oficios', {
		animado: 1,
		humano: 1,
		genero: -1,
		oficio: 1,
		movimiento: 0.5
	}),
	definition('marinera', 'oficios', {
		animado: 1,
		humano: 1,
		genero: 1,
		oficio: 1,
		movimiento: 0.5
	}),

	definition('perro', 'animales', { animado: 1, genero: -1, domestico: 1, tamano: 0.1 }),
	definition('perra', 'animales', { animado: 1, genero: 1, domestico: 1, tamano: 0.1 }),
	definition('gato', 'animales', { animado: 1, genero: -1, domestico: 1, tamano: -0.2 }),
	definition('gata', 'animales', { animado: 1, genero: 1, domestico: 1, tamano: -0.2 }),
	definition('caballo', 'animales', {
		animado: 1,
		genero: -1,
		domestico: 0.7,
		tamano: 0.8,
		movimiento: 0.7
	}),
	definition('yegua', 'animales', {
		animado: 1,
		genero: 1,
		domestico: 0.7,
		tamano: 0.8,
		movimiento: 0.7
	}),
	definition('gallo', 'animales', {
		animado: 1,
		genero: -1,
		domestico: 0.8,
		tamano: -0.3,
		comestible: 0.5
	}),
	definition('gallina', 'animales', {
		animado: 1,
		genero: 1,
		domestico: 0.8,
		tamano: -0.3,
		comestible: 0.5
	}),
	definition('león', 'animales', { animado: 1, genero: -1, natural: 1, tamano: 0.8, poder: 0.5 }),
	definition('leona', 'animales', { animado: 1, genero: 1, natural: 1, tamano: 0.8, poder: 0.5 }),
	definition('lobo', 'animales', {
		animado: 1,
		genero: -1,
		natural: 1,
		tamano: 0.4,
		valencia: -0.3
	}),
	definition('loba', 'animales', {
		animado: 1,
		genero: 1,
		natural: 1,
		tamano: 0.4,
		valencia: -0.3
	}),
	definition('ratón', 'animales', { animado: 1, genero: -1, tamano: -0.9 }),
	definition('elefante', 'animales', { animado: 1, genero: -1, natural: 1, tamano: 1.3 }),
	definition('pájaro', 'animales', {
		animado: 1,
		genero: -1,
		natural: 1,
		tamano: -0.7,
		movimiento: 0.9
	}),
	definition('pez', 'animales', {
		animado: 1,
		genero: -1,
		natural: 1,
		tamano: -0.5,
		comestible: 0.7
	}),

	definition('españa', 'geografia', {
		lugar: 1,
		capital: -1,
		tamano: 1,
		identidadX: 0.8,
		identidadY: 0.0
	}),
	definition('madrid', 'geografia', {
		lugar: 1,
		capital: 1,
		tamano: 0.5,
		identidadX: 0.8,
		identidadY: 0.0
	}),
	definition('francia', 'geografia', {
		lugar: 1,
		capital: -1,
		tamano: 1,
		identidadX: 0.4,
		identidadY: 0.693
	}),
	definition('parís', 'geografia', {
		lugar: 1,
		capital: 1,
		tamano: 0.5,
		identidadX: 0.4,
		identidadY: 0.693
	}),
	definition('italia', 'geografia', {
		lugar: 1,
		capital: -1,
		tamano: 1,
		identidadX: -0.4,
		identidadY: 0.693
	}),
	definition('roma', 'geografia', {
		lugar: 1,
		capital: 1,
		tamano: 0.5,
		identidadX: -0.4,
		identidadY: 0.693
	}),
	definition('japón', 'geografia', {
		lugar: 1,
		capital: -1,
		tamano: 1,
		identidadX: -0.8,
		identidadY: 0.0
	}),
	definition('tokio', 'geografia', {
		lugar: 1,
		capital: 1,
		tamano: 0.5,
		identidadX: -0.8,
		identidadY: 0.0
	}),
	definition('portugal', 'geografia', {
		lugar: 1,
		capital: -1,
		tamano: 1,
		identidadX: -0.4,
		identidadY: -0.693
	}),
	definition('lisboa', 'geografia', {
		lugar: 1,
		capital: 1,
		tamano: 0.5,
		identidadX: -0.4,
		identidadY: -0.693
	}),
	definition('méxico', 'geografia', {
		lugar: 1,
		capital: -1,
		tamano: 1,
		identidadX: 0.4,
		identidadY: -0.693
	}),

	definition('montaña', 'naturaleza', { lugar: 0.8, natural: 1, tamano: 1.2 }),
	definition('río', 'naturaleza', { lugar: 0.8, natural: 1, movimiento: 0.6 }),
	definition('mar', 'naturaleza', { lugar: 0.8, natural: 1, tamano: 1.2, movimiento: 0.4 }),
	definition('bosque', 'naturaleza', { lugar: 0.8, natural: 1, tamano: 0.9 }),
	definition('playa', 'naturaleza', { lugar: 0.9, natural: 1, tamano: 0.4 }),
	definition('isla', 'naturaleza', { lugar: 0.9, natural: 1, tamano: 0.5 }),
	definition('lluvia', 'naturaleza', { natural: 1, movimiento: 0.6, abstracto: 0.3 }),
	definition('viento', 'naturaleza', { natural: 1, movimiento: 0.9, abstracto: 0.4 }),
	definition('sol', 'naturaleza', { natural: 1, tamano: 1.1, valencia: 0.6 }),
	definition('luna', 'naturaleza', { natural: 1, tamano: 0.8, valencia: 0.4 }),

	definition('pan', 'comida', { comestible: 1, tamano: -0.3 }),
	definition('queso', 'comida', { comestible: 1, tamano: -0.4 }),
	definition('manzana', 'comida', { comestible: 1, natural: 0.8, tamano: -0.5 }),
	definition('naranja', 'comida', { comestible: 1, natural: 0.8, tamano: -0.5 }),
	definition('pescado', 'comida', { comestible: 1, natural: 0.7, tamano: -0.3 }),
	definition('carne', 'comida', { comestible: 1, natural: 0.6 }),
	definition('vino', 'comida', { comestible: 0.9, valencia: 0.4 }),
	definition('agua', 'comida', { comestible: 0.8, natural: 1 }),
	definition('sal', 'comida', { comestible: 0.8, natural: 0.6, tamano: -0.9 }),
	definition('azúcar', 'comida', { comestible: 0.9, tamano: -0.9, valencia: 0.4 }),

	definition('casa', 'objetos', { lugar: 0.7, natural: -1, tamano: 0.7, domestico: 0.8 }),
	definition('puerta', 'objetos', { natural: -1, tamano: 0.2, domestico: 0.6 }),
	definition('ventana', 'objetos', { natural: -1, tamano: 0.1, domestico: 0.6 }),
	definition('silla', 'objetos', { natural: -1, tamano: -0.2, domestico: 0.7 }),
	definition('mesa', 'objetos', { natural: -1, tamano: 0.1, domestico: 0.7 }),
	definition('libro', 'objetos', { natural: -1, tamano: -0.4, abstracto: 0.5 }),
	definition('barco', 'objetos', { natural: -1, tamano: 0.9, movimiento: 0.8 }),
	definition('coche', 'objetos', { natural: -1, tamano: 0.5, movimiento: 1 }),
	definition('faro', 'objetos', { natural: -1, lugar: 0.5, tamano: 0.8 }),
	definition('lámpara', 'objetos', { natural: -1, tamano: -0.3, domestico: 0.6 }),

	definition('caminar', 'verbos', { abstracto: 0.8, movimiento: 0.9, tiempo: 0 }),
	definition('caminé', 'verbos', { abstracto: 0.8, movimiento: 0.9, tiempo: -1 }),
	definition('caminaré', 'verbos', { abstracto: 0.8, movimiento: 0.9, tiempo: 1 }),
	definition('comer', 'verbos', { abstracto: 0.8, comestible: 0.5, tiempo: 0 }),
	definition('comí', 'verbos', { abstracto: 0.8, comestible: 0.5, tiempo: -1 }),
	definition('comeré', 'verbos', { abstracto: 0.8, comestible: 0.5, tiempo: 1 }),
	definition('hablar', 'verbos', { abstracto: 0.9, humano: 0.5, tiempo: 0 }),
	definition('hablé', 'verbos', { abstracto: 0.9, humano: 0.5, tiempo: -1 }),
	definition('hablaré', 'verbos', { abstracto: 0.9, humano: 0.5, tiempo: 1 }),
	definition('correr', 'verbos', { abstracto: 0.8, movimiento: 1.2, tiempo: 0 }),
	definition('corrí', 'verbos', { abstracto: 0.8, movimiento: 1.2, tiempo: -1 }),
	definition('correré', 'verbos', { abstracto: 0.8, movimiento: 1.2, tiempo: 1 }),

	definition('alegría', 'emociones', { abstracto: 1.2, valencia: 1 }),
	definition('tristeza', 'emociones', { abstracto: 1.2, valencia: -1 }),
	definition('miedo', 'emociones', { abstracto: 1.2, valencia: -0.9 }),
	definition('amor', 'emociones', { abstracto: 1.2, valencia: 1.1 }),
	definition('rabia', 'emociones', { abstracto: 1.2, valencia: -1 }),
	definition('calma', 'emociones', { abstracto: 1.2, valencia: 0.7, movimiento: -0.5 }),
	definition('libertad', 'emociones', { abstracto: 1.3, valencia: 1, poder: 0.4 }),
	definition('justicia', 'emociones', { abstracto: 1.3, valencia: 0.8, poder: 0.5 })
];

export const CURATED_ANALOGIES: readonly CuratedAnalogy[] = [
	{
		from: 'hombre',
		to: 'rey',
		query: 'mujer',
		expected: 'reina',
		explanation: 'La dirección que va de «hombre» a «rey» es el poder. Aplícala a «mujer».'
	},
	{
		from: 'españa',
		to: 'madrid',
		query: 'japón',
		expected: 'tokio',
		explanation: 'La dirección país → capital es la misma para todos los países.'
	},
	{
		from: 'perro',
		to: 'perra',
		query: 'gato',
		expected: 'gata',
		explanation: 'El género es una dirección constante en el espacio.'
	},
	{
		from: 'caminar',
		to: 'caminé',
		query: 'comer',
		expected: 'comí',
		explanation: 'El tiempo verbal también es una dirección: presente → pasado.'
	},
	{
		from: 'hablar',
		to: 'hablaré',
		query: 'correr',
		expected: 'correré',
		explanation: 'La misma dirección, pero hacia el futuro.'
	},
	{
		from: 'francia',
		to: 'parís',
		query: 'italia',
		expected: 'roma',
		explanation: 'Otro par país → capital, la misma flecha.'
	}
];

export const ODD_ONE_OUT_PUZZLES: readonly OddOneOutPuzzle[] = [
	{
		words: ['perro', 'gato', 'caballo', 'silla'],
		expected: 'silla',
		explanation: 'Tres animales y un mueble.'
	},
	{
		words: ['madrid', 'parís', 'roma', 'japón'],
		expected: 'japón',
		explanation: 'Tres capitales y un país.'
	},
	{
		words: ['pan', 'queso', 'manzana', 'libro'],
		expected: 'libro',
		explanation: 'Tres comidas y un objeto.'
	},
	{
		words: ['alegría', 'amor', 'calma', 'ratón'],
		expected: 'ratón',
		explanation: 'Tres emociones y un animal.'
	}
];
