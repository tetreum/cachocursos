/**
 * Un pasaje con huecos: cada posición es o una palabra fija o una elección
 * entre sinónimos intercambiables. El atacante del capítulo 14 sólo puede
 * moverse dentro de esas elecciones, así que el texto siempre significa lo mismo.
 */
export interface PassageSlot {
	readonly options: readonly string[];
	readonly glue?: boolean;
}

export const fixed = (word: string): PassageSlot => ({ options: [word], glue: true });

export const choice = (...options: string[]): PassageSlot => ({ options });

export function passageVocabulary(passage: readonly PassageSlot[]): string[] {
	return Array.from(new Set(passage.flatMap((slot) => slot.options)));
}
