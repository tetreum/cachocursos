/**
 * Constantes de calibración de los minijuegos. No son contenido: no dependen del
 * idioma, aunque sí haya que revisarlas cuando cambian los datos de un idioma.
 */
export const BPE_TARGET_MERGES = 10;
export const BPE_TARGET_RATIO = 1.5;
export const BPE_DEMO_MERGES = 12;

export const EMBEDDINGS_REQUIRED_HITS = 4;

export const ATTENTION_PASSING_SCORE = 0.7;

export const TRAINING_TARGET_LOSS = 3;
export const TRAINING_STEP_BUDGET = 600;

export const SCALING_BUDGET = 1e22;
export const SCALING_TOLERANCE = 0.005;

export const EXPERT_CAPACITY = 4;
export const ROUTING_TARGET = 0.9;
export const ACTIVE_EXPERTS_PER_TOKEN = 2;

export const PROMPT_TARGET_QUALITY = 0.8;

export const WATERMARK_TARGET_Z = 5;
export const WATERMARK_REQUIRED_CORRECT = 5;
