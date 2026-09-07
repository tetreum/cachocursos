import type { ChapterEntry, Course } from '$content/types';

export const LLM_CHAPTER_IDS = [
	'01-prediccion',
	'02-tokens',
	'03-embeddings',
	'04-ngramas',
	'05-muestreo',
	'06-atencion',
	'07-transformer',
	'08-entrenamiento',
	'09-escala',
	'10-expertos',
	'11-alineamiento',
	'12-prompting',
	'13-limites',
	'14-watermark'
] as const;

export type LlmChapterId = (typeof LLM_CHAPTER_IDS)[number];

export const LLM_CHAPTERS = [
	{
		id: '01-prediccion',
		courseId: 'llm',
		order: 1,
		title: { es: '¿Qué es un modelo de lenguaje?', en: 'What is a language model?' },
		hook: {
			es: 'Una máquina que solo sabe adivinar lo que viene después.',
			en: 'A machine whose only skill is guessing what comes next.'
		},
		minutes: 8,
		gates: ['01-prediccion:adivina'],
		load: {
			es: () => import('./chapters/01-prediccion/Chapter.es.svelte'),
			en: () => import('./chapters/01-prediccion/Chapter.en.svelte')
		}
	},
	{
		id: '02-tokens',
		courseId: 'llm',
		order: 2,
		title: { es: 'Tokens: el texto como números', en: 'Tokens: text as numbers' },
		hook: {
			es: 'El modelo nunca ve palabras. Ve trozos.',
			en: 'The model never sees words. It sees chunks.'
		},
		minutes: 12,
		gates: ['02-tokens:fusiones'],
		load: {
			es: () => import('./chapters/02-tokens/Chapter.es.svelte'),
			en: () => import('./chapters/02-tokens/Chapter.en.svelte')
		}
	},
	{
		id: '03-embeddings',
		courseId: 'llm',
		order: 3,
		title: {
			es: 'Embeddings: el significado como dirección',
			en: 'Embeddings: meaning as direction'
		},
		hook: {
			es: 'Si el significado es geometría, se puede sumar y restar.',
			en: 'If meaning is geometry, you can add and subtract it.'
		},
		minutes: 12,
		gates: ['03-embeddings:mapa'],
		load: {
			es: () => import('./chapters/03-embeddings/Chapter.es.svelte'),
			en: () => import('./chapters/03-embeddings/Chapter.en.svelte')
		}
	},
	{
		id: '04-ngramas',
		courseId: 'llm',
		order: 4,
		title: { es: 'Predecir contando: los n-gramas', en: 'Predicting by counting: n-grams' },
		hook: {
			es: 'El modelo de lenguaje más simple que existe, y por qué no basta.',
			en: "The simplest language model there is, and why it isn't enough."
		},
		minutes: 11,
		gates: ['04-ngramas:duelo'],
		load: {
			es: () => import('./chapters/04-ngramas/Chapter.es.svelte'),
			en: () => import('./chapters/04-ngramas/Chapter.en.svelte')
		}
	},
	{
		id: '05-muestreo',
		courseId: 'llm',
		order: 5,
		title: {
			es: 'Muestreo: temperatura, top-k y top-p',
			en: 'Sampling: temperature, top-k and top-p'
		},
		hook: {
			es: 'La distribución no es la respuesta. Hay que elegir.',
			en: "The distribution isn't the answer. Something has to choose."
		},
		minutes: 12,
		gates: ['05-muestreo:mesa'],
		load: {
			es: () => import('./chapters/05-muestreo/Chapter.es.svelte'),
			en: () => import('./chapters/05-muestreo/Chapter.en.svelte')
		}
	},
	{
		id: '06-atencion',
		courseId: 'llm',
		order: 6,
		title: { es: 'Atención: qué palabras importan', en: 'Attention: which words matter' },
		hook: {
			es: 'El mecanismo que hizo posible todo lo demás.',
			en: 'The mechanism that made everything else possible.'
		},
		minutes: 14,
		gates: ['06-atencion:reparto'],
		load: {
			es: () => import('./chapters/06-atencion/Chapter.es.svelte'),
			en: () => import('./chapters/06-atencion/Chapter.en.svelte')
		}
	},
	{
		id: '07-transformer',
		courseId: 'llm',
		order: 7,
		title: { es: 'El bloque Transformer', en: 'The Transformer block' },
		hook: { es: 'Ocho piezas en el orden correcto.', en: 'Eight pieces in the right order.' },
		minutes: 13,
		gates: ['07-transformer:bloque'],
		load: {
			es: () => import('./chapters/07-transformer/Chapter.es.svelte'),
			en: () => import('./chapters/07-transformer/Chapter.en.svelte')
		}
	},
	{
		id: '08-entrenamiento',
		courseId: 'llm',
		order: 8,
		title: { es: 'Entrenamiento: bajar la loss', en: 'Training: bringing the loss down' },
		hook: {
			es: 'Aprender es equivocarse con método.',
			en: 'Learning is being wrong, methodically.'
		},
		minutes: 12,
		gates: ['08-entrenamiento:loss'],
		load: {
			es: () => import('./chapters/08-entrenamiento/Chapter.es.svelte'),
			en: () => import('./chapters/08-entrenamiento/Chapter.en.svelte')
		}
	},
	{
		id: '09-escala',
		courseId: 'llm',
		order: 9,
		title: { es: 'Escala y ventana de contexto', en: 'Scale and the context window' },
		hook: {
			es: '¿Modelo más grande o más datos? No puedes tener las dos cosas.',
			en: "Bigger model or more data? You can't have both."
		},
		minutes: 12,
		gates: ['09-escala:presupuesto'],
		load: {
			es: () => import('./chapters/09-escala/Chapter.es.svelte'),
			en: () => import('./chapters/09-escala/Chapter.en.svelte')
		}
	},
	{
		id: '10-expertos',
		courseId: 'llm',
		order: 10,
		title: { es: 'Mezcla de expertos', en: 'Mixture of experts' },
		hook: {
			es: 'Muchos parámetros, poco cómputo: cómo se rompe la ecuación del capítulo anterior.',
			en: "Many parameters, little compute: how the previous chapter's equation breaks."
		},
		minutes: 12,
		gates: ['10-expertos:enrutado'],
		load: {
			es: () => import('./chapters/10-expertos/Chapter.es.svelte'),
			en: () => import('./chapters/10-expertos/Chapter.en.svelte')
		}
	},
	{
		id: '11-alineamiento',
		courseId: 'llm',
		order: 11,
		title: { es: 'De modelo base a asistente', en: 'From base model to assistant' },
		hook: {
			es: 'Enseñarle a un modelo qué respuestas preferimos, y lo que sale mal.',
			en: 'Teaching a model which answers we prefer, and what goes wrong.'
		},
		minutes: 13,
		gates: ['11-alineamiento:etiquetador'],
		load: {
			es: () => import('./chapters/11-alineamiento/Chapter.es.svelte'),
			en: () => import('./chapters/11-alineamiento/Chapter.en.svelte')
		}
	},
	{
		id: '12-prompting',
		courseId: 'llm',
		order: 12,
		title: { es: 'Prompting e in-context learning', en: 'Prompting and in-context learning' },
		hook: {
			es: 'Aprender sin cambiar ni un solo peso.',
			en: 'Learning without changing a single weight.'
		},
		minutes: 11,
		gates: ['12-prompting:taller'],
		load: {
			es: () => import('./chapters/12-prompting/Chapter.es.svelte'),
			en: () => import('./chapters/12-prompting/Chapter.en.svelte')
		}
	},
	{
		id: '13-limites',
		courseId: 'llm',
		order: 13,
		title: { es: 'Lo que no cabe en una pasada', en: "What doesn't fit in one pass" },
		hook: {
			es: 'Por qué no sabe contar letras ni sumar, y qué se hace al respecto.',
			en: "Why it can't count letters or add up, and what's done about it."
		},
		minutes: 14,
		gates: ['13-limites:estrategias'],
		load: {
			es: () => import('./chapters/13-limites/Chapter.es.svelte'),
			en: () => import('./chapters/13-limites/Chapter.en.svelte')
		}
	},
	{
		id: '14-watermark',
		courseId: 'llm',
		order: 14,
		title: { es: 'Marcas de agua en el texto', en: 'Watermarking text' },
		hook: {
			es: 'Firmar un texto generado sin que se note. Y romper la firma.',
			en: 'Signing generated text invisibly. And breaking the signature.'
		},
		minutes: 18,
		gates: ['14-watermark:generador', '14-watermark:detector', '14-watermark:atacante'],
		load: {
			es: () => import('./chapters/14-watermark/Chapter.es.svelte'),
			en: () => import('./chapters/14-watermark/Chapter.en.svelte')
		}
	}
] as const satisfies readonly ChapterEntry<LlmChapterId>[];

export const LLM_COURSE: Course = {
	id: 'llm',
	title: { es: 'LLMs', en: 'LLMs' },
	hook: {
		es: 'De los tokens a las marcas de agua, jugando con cada pieza.',
		en: 'From tokens to watermarks, playing with every piece.'
	},
	summary: {
		es: 'Catorce capítulos con catorce minijuegos. Empiezas adivinando la siguiente palabra y terminas poniéndole una marca de agua invisible a un texto generado. Todo el cálculo ocurre de verdad en tu navegador.',
		en: 'Fourteen chapters, fourteen minigames. You start by guessing the next word and end up putting an invisible watermark on generated text. Every computation really runs in your browser.'
	},
	status: 'ready',
	chapters: LLM_CHAPTERS
};
