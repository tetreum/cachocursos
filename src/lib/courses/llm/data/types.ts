import type { AttentionPuzzle } from '../models/attention';
import type { CuratedAnalogy, OddOneOutPuzzle, WordDefinition } from '../models/embeddings';
import type { Expert, RoutableToken, RouterMatrix } from '../models/moe';
import type { OnePassTask, Strategy } from '../models/onepass';
import type { Response } from '../models/reward';
import type { PassageSlot } from '../models/passage';

export interface ResponsePair {
	question: string;
	left: Response;
	right: Response;
}

export interface TokenizerDemoData {
	/** Palabras largas cuya tokenización esconde letras. */
	suggestions: readonly string[];
	defaultWord: string;
	/** La letra que el lector va a intentar contar. */
	letter: string;
	/** Cómo se llama esa letra en singular y en plural: «erre»/«erres», «r»/«r's». */
	letterOne: string;
	letterMany: string;
}

export interface FlowCandidate {
	word: string;
	probability: number;
}

/** La frase que recorre la infografía animada del capítulo 7. */
export interface TransformerFlowData {
	sentence: string;
	tokens: readonly string[];
	/** Qué token mira a los demás cuando se enciende la atención. */
	queryIndex: number;
	attention: readonly number[];
	candidates: readonly FlowCandidate[];
}

/** El vocabulario de juguete con el que el capítulo 14 explica el esquema paso a paso. */
export interface SchemeExampleData {
	vocabulary: readonly string[];
	logits: readonly number[];
	/** Qué token hace de «token anterior» al empezar el recorrido. */
	previousIndex: number;
}

export interface StrategyLabel {
	name: string;
	blurb: string;
}

/**
 * Todo lo que un idioma tiene que aportar para que el curso funcione.
 *
 * Cada idioma exporta un objeto que cumple esta forma, así que si al inglés le
 * falta una pieza —o le sobra— es un error de compilación, no un capítulo roto
 * en producción.
 */
export interface CourseData {
	/** Cap. 2 — corpus elegido para que las fusiones de BPE revelen morfología del idioma. */
	corpusBpe: string;
	corpusBpeTitle: string;
	tokenizer: TokenizerDemoData;

	/** Cap. 4, 5, 8, 14 — texto repetitivo y de vocabulario corto sobre el que se entrena todo. */
	corpus: string;
	corpusTitle: string;
	corpusNote: string;
	/** Palabra semilla para generar; tiene que existir en el corpus. */
	seedWord: string;
	/** Contextos con datos suficientes, y contextos que el modelo no ha visto nunca. */
	seenContexts: readonly string[];
	unseenContexts: readonly string[];

	/** Cap. 3 — ejes semánticos, vocabulario y puzles. */
	axes: readonly string[];
	axisLabels: Record<string, string>;
	words: readonly WordDefinition[];
	analogies: readonly CuratedAnalogy[];
	oddOneOuts: readonly OddOneOutPuzzle[];

	/** Cap. 6 — frases ambiguas con su reparto de atención de referencia. */
	attentionPuzzles: readonly AttentionPuzzle[];

	/** Cap. 7 — la frase de la infografía animada. */
	flow: TransformerFlowData;

	/** Cap. 10 — expertos, tokens a enrutar y matrices del router. */
	experts: readonly Expert[];
	routableTokens: readonly RoutableToken[];
	featureNames: readonly string[];
	trainedRouter: RouterMatrix;
	untrainedRouter: RouterMatrix;

	/** Cap. 11 — pares de respuestas para el reward model. */
	responsePairs: readonly ResponsePair[];
	traitLabels: Record<string, string>;

	/** Cap. 13 — tareas de una pasada y corpus con números. */
	tasks: readonly OnePassTask[];
	strategyLabels: Record<Strategy, StrategyLabel>;
	corpusNumbers: string;
	/** Abreviaturas del valor de posición, de las unidades hacia arriba. */
	placeValues: readonly string[];
	numberMerges: number;

	/** Cap. 14 — el recorrido del esquema y el pasaje del atacante. */
	schemeExample: SchemeExampleData;
	attackPassage: readonly PassageSlot[];
}
