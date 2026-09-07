import type { OnePassTask } from '../../models/onepass';

export const ONE_PASS_TASKS: readonly OnePassTask[] = [
	{
		id: 'capital',
		prompt: '¿Cuál es la capital de Francia?',
		answer: 'París',
		needsSubTokenAccess: false,
		serialSteps: 1,
		note: 'Un hecho memorizado. Está en los pesos y sale de un tirón.'
	},
	{
		id: 'erres',
		prompt: '¿Cuántas erres tiene «ferrocarril»?',
		answer: '3',
		needsSubTokenAccess: true,
		serialSteps: 1,
		note: 'Contar es paralelo: en cuanto se ven las letras, no hay pasos encadenados.'
	},
	{
		id: 'invertir',
		prompt: 'Escribe «murciélago» al revés.',
		answer: 'ogaléicrum',
		needsSubTokenAccess: true,
		serialSteps: 1,
		note: 'Mismo caso: el problema es de acceso a las letras, no de longitud del cálculo.'
	},
	{
		id: 'suma-corta',
		prompt: '347 + 285',
		answer: '632',
		needsSubTokenAccess: true,
		serialSteps: 3,
		note: 'Tres columnas, y cada acarreo depende del anterior. Ya no cabe en una pasada.'
	},
	{
		id: 'suma-larga',
		prompt: '48.395.716 + 27.868.459',
		answer: '76.264.175',
		needsSubTokenAccess: true,
		serialSteps: 8,
		note: 'Ocho acarreos encadenados. Aquí es donde la cadena de pensamiento empieza a romperse.'
	},
	{
		id: 'producto',
		prompt: '463 × 287',
		answer: '132.881',
		needsSubTokenAccess: true,
		serialSteps: 9,
		note: 'Nueve productos parciales más las sumas. Ninguna cadena de texto aguanta esto de forma fiable.'
	}
];

export const STRATEGY_LABELS: Record<string, { name: string; blurb: string }> = {
	direct: {
		name: 'Responder directamente',
		blurb: 'Una sola pasada por las capas. Gratis y rapidísimo.'
	},
	retokenize: {
		name: 'Partir en letras o dígitos',
		blurb: 'Deletrear, o separar los números dígito a dígito, y luego responder.'
	},
	chain: {
		name: 'Escribir los pasos',
		blurb: 'Cadena de pensamiento: usar la propia salida como memoria de trabajo.'
	},
	tool: {
		name: 'Llamar a una herramienta',
		blurb: 'Escribir código o usar una calculadora y ejecutarlo de verdad.'
	}
};
