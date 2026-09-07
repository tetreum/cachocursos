import { tokenizeWords, trainNgram, nextProbabilities, type NgramModel } from '../../models/ngram';
import { mulberry32, type Rng } from '$utils/rng';
import {
	generateWatermarked,
	detect,
	greenMask,
	DEFAULT_WATERMARK,
	DETECTION_THRESHOLD,
	type WatermarkConfig
} from '../../models/watermark';
import { passageVocabulary, type PassageSlot } from '../../models/passage';

export const SAMPLING_TEMPERATURE = 0.9;
export const ATTACK_MAX_EDITS = 12;
export const ALTERNATIVES_PER_TOKEN = 5;

export interface EngineSource {
	/** Texto sobre el que se entrena el modelo y del que salen los pasajes humanos. */
	corpus: string;
	/** Palabra por la que empieza a generar; tiene que existir en el corpus. */
	seedWord: string;
}

export interface WatermarkEngine {
	model: NgramModel;
	vocabSize: number;
	seedId: number;
	/** Los ids del corpus, ya tokenizados: los pasajes humanos se recortan de aquí. */
	sourceIds: readonly number[];
	logitsAt(context: readonly number[]): Float64Array;
	words(ids: readonly number[]): string[];
}

export function createEngine({ corpus, seedWord }: EngineSource): WatermarkEngine {
	const source = tokenizeWords(corpus);
	const model = trainNgram(source, 2, 0.02);
	const vocabSize = model.vocabulary.length;

	return {
		model,
		vocabSize,
		seedId: model.index.get(seedWord) ?? 0,
		sourceIds: Array.from(source.ids),
		logitsAt(context: readonly number[]): Float64Array {
			const previous = context[context.length - 1] ?? 0;
			const probabilities = nextProbabilities(model, [model.vocabulary[previous]]);
			const logits = new Float64Array(vocabSize);
			for (let id = 0; id < vocabSize; id += 1) logits[id] = Math.log(probabilities[id]);
			return logits;
		},
		words(ids: readonly number[]): string[] {
			return ids.map((id) => model.vocabulary[id]);
		}
	};
}

export function generate(
	engine: WatermarkEngine,
	config: WatermarkConfig,
	length: number,
	random: Rng
): number[] {
	return generateWatermarked({
		vocabSize: engine.vocabSize,
		logitsAt: engine.logitsAt,
		seedContext: [engine.seedId],
		length,
		config,
		sampling: { temperature: SAMPLING_TEMPERATURE },
		random
	}).ids;
}

export function meanBaseProbability(engine: WatermarkEngine, ids: readonly number[]): number {
	if (ids.length === 0) return 0;
	let total = 0;
	let previous = engine.seedId;
	for (const id of ids) {
		total += nextProbabilities(engine.model, [engine.model.vocabulary[previous]])[id];
		previous = id;
	}
	return total / ids.length;
}

export function alternativesFor(
	engine: WatermarkEngine,
	previousId: number,
	currentId: number
): number[] {
	const probabilities = nextProbabilities(engine.model, [engine.model.vocabulary[previousId]]);
	const order: number[] = [];
	for (let id = 0; id < probabilities.length; id += 1) order.push(id);
	order.sort((left, right) => probabilities[right] - probabilities[left]);
	return order.filter((id) => id !== currentId).slice(0, ALTERNATIVES_PER_TOKEN);
}

export type PassageOrigin = 'human' | 'marked' | 'edited' | 'unmarked';

export interface DetectorPassage {
	id: string;
	/** Posición en la lista, para numerarlo en el idioma que toque. */
	number: number;
	ids: number[];
	isWatermarked: boolean;
	origin: PassageOrigin;
}

export function buildDetectorPassages(engine: WatermarkEngine): DetectorPassage[] {
	const humanIds = engine.sourceIds;
	const config = DEFAULT_WATERMARK;

	function humanSlice(start: number, length: number): number[] {
		return humanIds.slice(start, start + length);
	}

	function edited(ids: number[], fraction: number, seed: number): number[] {
		const random = mulberry32(seed);
		const result = ids.slice();
		const count = Math.round(ids.length * fraction);
		for (let index = 0; index < count; index += 1) {
			const position = 1 + Math.floor(random() * (result.length - 1));
			const alternatives = alternativesFor(engine, result[position - 1], result[position]);
			const mask = greenMask(result[position - 1], engine.vocabSize, config);
			const red = alternatives.find((id) => mask[id] !== 1);
			if (red !== undefined) result[position] = red;
		}
		return result;
	}

	const strong = generate(engine, config, 60, mulberry32(11));
	const weak = generate(engine, { ...config, delta: 0.8 }, 60, mulberry32(23));
	const unmarked = generate(engine, { ...config, delta: 0 }, 60, mulberry32(31));

	return [
		{ id: 'p1', number: 1, ids: humanSlice(460, 60), isWatermarked: false, origin: 'human' },
		{ id: 'p2', number: 2, ids: strong, isWatermarked: true, origin: 'marked' },
		{ id: 'p3', number: 3, ids: unmarked, isWatermarked: false, origin: 'unmarked' },
		{ id: 'p4', number: 4, ids: edited(strong, 0.15, 77), isWatermarked: true, origin: 'edited' },
		{ id: 'p5', number: 5, ids: humanSlice(390, 60), isWatermarked: false, origin: 'human' },
		{ id: 'p6', number: 6, ids: weak, isWatermarked: true, origin: 'marked' }
	];
}

export function zScoreOf(engine: WatermarkEngine, ids: readonly number[]): number {
	return detect(ids, engine.vocabSize, DEFAULT_WATERMARK).z;
}

export { DEFAULT_WATERMARK, DETECTION_THRESHOLD, detect, greenMask };

export interface AttackToken {
	options: readonly number[];
	glue: boolean;
}

export interface AttackDeck {
	vocabulary: readonly string[];
	vocabSize: number;
	tokens: readonly AttackToken[];
	word(id: number): string;
	text(ids: readonly number[]): string;
	/** El pasaje más verde que se puede escribir sin cambiar lo que dice. */
	markedPassage(config: WatermarkConfig): number[];
}

/**
 * Todo lo que el atacante necesita, derivado del pasaje del idioma en curso:
 * el vocabulario sale de los propios sinónimos, así que su tamaño —y con él la
 * z alcanzable— depende del pasaje que se le pase.
 */
export function createAttack(passage: readonly PassageSlot[]): AttackDeck {
	const vocabulary = passageVocabulary(passage);
	const index = new Map(vocabulary.map((word, position) => [word, position]));
	const vocabSize = vocabulary.length;

	const tokens: readonly AttackToken[] = passage.map((slot) => ({
		options: slot.options.map((word) => index.get(word) as number),
		glue: slot.glue === true
	}));

	return {
		vocabulary,
		vocabSize,
		tokens,
		word: (id) => vocabulary[id],
		text: (ids) =>
			ids
				.map((id, position) => {
					const word = vocabulary[id];
					const separator = position === 0 || /^[.,]$/.test(word) ? '' : ' ';
					return separator + word;
				})
				.join(''),
		markedPassage: (config) => buildMarkedPassage(tokens, vocabSize, config)
	};
}

function buildMarkedPassage(
	slots: readonly AttackToken[],
	size: number,
	config: WatermarkConfig
): number[] {
	const masks = new Map<number, Uint8Array>();
	const maskFor = (token: number): Uint8Array => {
		let mask = masks.get(token);
		if (mask === undefined) {
			mask = greenMask(token, size, config);
			masks.set(token, mask);
		}
		return mask;
	};

	const bestScore: number[][] = slots.map((slot) => slot.options.map(() => -Infinity));
	const cameFrom: number[][] = slots.map((slot) => slot.options.map(() => -1));
	slots[0].options.forEach((_, option) => {
		bestScore[0][option] = 0;
	});

	for (let position = 0; position + 1 < slots.length; position += 1) {
		slots[position].options.forEach((token, option) => {
			if (bestScore[position][option] === -Infinity) return;
			const mask = maskFor(token);
			slots[position + 1].options.forEach((next, nextOption) => {
				const score = bestScore[position][option] + (mask[next] === 1 ? 1 : 0);
				if (score > bestScore[position + 1][nextOption]) {
					bestScore[position + 1][nextOption] = score;
					cameFrom[position + 1][nextOption] = option;
				}
			});
		});
	}

	const last = slots.length - 1;
	let option = bestScore[last].indexOf(Math.max(...bestScore[last]));
	const chosen: number[] = [];
	for (let position = last; position >= 0; position -= 1) {
		chosen.unshift(slots[position].options[option]);
		option = cameFrom[position][option] >= 0 ? cameFrom[position][option] : 0;
	}
	return chosen;
}
