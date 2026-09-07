import type { TokenizerDemoData } from '../types';

export const CORPUS_BPE = `Computation transforms information.
Automation transforms imagination.
Counting and computing, the computation keeps running.
It was counting, it was computing, it was running.
Quickly, clearly, slowly, finally.
The invention of printing changed education.
Nation, invention, education, automation, computation.
Running, counting, computing, printing, painting.`;

export const CORPUS_BPE_TITLE = 'A tiny corpus in English';

export const TOKENIZER_DEMO: TokenizerDemoData = {
	suggestions: ['computation', 'imagination', 'refrigerator', 'strawberry'],
	defaultWord: 'computation',
	letter: 'r',
	letterOne: 'r',
	letterMany: "r's"
};
