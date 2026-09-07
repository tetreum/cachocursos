import type { TokenizerDemoData } from '../types';
export const CORPUS_BPE = `La computación transforma la información.
La programación transforma la imaginación.
Cantando y contando, la canción va sonando.
Estaba cantando, estaba contando, estaba soñando.
Rápidamente, claramente, lentamente, finalmente.
La invención de la impresión cambió la educación.
Nación, canción, invención, educación, computación.
Caminando, cantando, contando, soñando, sonando.`;

export const CORPUS_BPE_TITLE = 'Un corpus diminuto en español';

export const TOKENIZER_DEMO: TokenizerDemoData = {
	suggestions: ['computación', 'imaginación', 'refrigerador', 'ferrocarril'],
	defaultWord: 'computación',
	letter: 'r',
	letterOne: 'erre',
	letterMany: 'erres'
};
