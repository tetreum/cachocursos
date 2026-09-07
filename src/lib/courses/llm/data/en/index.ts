/**
 * Los datos del curso en inglés. No son una traducción del español: el corpus de
 * BPE está escrito para que emerjan «-tion» y «-ing», los embeddings cambian los
 * pares de género y las conjugaciones por plurales y comparativos, y las frases
 * de atención están reindexadas token a token.
 */
import type { CourseData } from '../types';
import { CORPUS_BPE, CORPUS_BPE_TITLE, TOKENIZER_DEMO } from './corpus-bpe';
import { CORPUS, CORPUS_TITLE, CORPUS_NOTE } from './corpus';
import { CORPUS_NUMBERS, NUMBER_MERGES, PLACE_VALUES } from './corpus-numbers';
import { AXES, AXIS_LABELS, WORDS, CURATED_ANALOGIES, ODD_ONE_OUT_PUZZLES } from './embeddings';
import { ATTENTION_PUZZLES, TRANSFORMER_FLOW } from './attention';
import {
	EXPERTS,
	ROUTABLE_TOKENS,
	FEATURE_NAMES,
	TRAINED_ROUTER,
	UNTRAINED_ROUTER
} from './experts';
import { RLHF_PAIRS, TRAIT_LABELS } from './rlhf';
import { ONE_PASS_TASKS, STRATEGY_LABELS } from './tasks';
import { ATTACK_PASSAGE, SCHEME_EXAMPLE } from './attack';

export const ENGLISH: CourseData = {
	corpusBpe: CORPUS_BPE,
	corpusBpeTitle: CORPUS_BPE_TITLE,
	tokenizer: TOKENIZER_DEMO,

	corpus: CORPUS,
	corpusTitle: CORPUS_TITLE,
	corpusNote: CORPUS_NOTE,
	seedWord: 'the',
	seenContexts: ['the', 'sea', 'lamp', 'wind', 'keeper', 'light'],
	unseenContexts: ['helicopter', 'computer'],

	axes: AXES,
	axisLabels: AXIS_LABELS,
	words: WORDS,
	analogies: CURATED_ANALOGIES,
	oddOneOuts: ODD_ONE_OUT_PUZZLES,

	attentionPuzzles: ATTENTION_PUZZLES,
	flow: TRANSFORMER_FLOW,

	experts: EXPERTS,
	routableTokens: ROUTABLE_TOKENS,
	featureNames: FEATURE_NAMES,
	trainedRouter: TRAINED_ROUTER,
	untrainedRouter: UNTRAINED_ROUTER,

	responsePairs: RLHF_PAIRS,
	traitLabels: TRAIT_LABELS,

	tasks: ONE_PASS_TASKS,
	strategyLabels: STRATEGY_LABELS,
	corpusNumbers: CORPUS_NUMBERS,
	placeValues: PLACE_VALUES,
	numberMerges: NUMBER_MERGES,

	attackPassage: ATTACK_PASSAGE,
	schemeExample: SCHEME_EXAMPLE
};
