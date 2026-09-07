<script lang="ts">
	import Step from '$ui/Step.svelte';
	import Prose from '$ui/Prose.svelte';
	import Callout from '$ui/Callout.svelte';
	import Challenge from '$ui/Challenge.svelte';
	import ProbabilityBars from '$ui/ProbabilityBars.svelte';
	import Figure from '$ui/Figure.svelte';
	import GuessGame, { type GuessRound } from './GuessGame.svelte';

	const ROUNDS: readonly GuessRound[] = [
		{
			prefix: 'Se me ha hecho tarde, tengo que coger el',
			options: ['tren', 'queso', 'martes', 'verde'],
			answer: 'tren',
			note: 'Casi cualquier hispanohablante diría «tren» o «autobús». Esa expectativa compartida es la que aprende el modelo.'
		},
		{
			prefix: 'Érase una vez una princesa que vivía en un',
			options: ['castillo', 'semáforo', 'porque', 'comió'],
			answer: 'castillo',
			note: 'El género del texto importa: «Érase una vez» ya te ha puesto en modo cuento.'
		},
		{
			prefix: 'Por favor, cierra la puerta al',
			options: ['salir', 'azul', 'nosotros', 'raíz'],
			answer: 'salir',
			note: 'Aquí no decide el significado, decide la gramática: después de «al» viene un infinitivo.'
		},
		{
			prefix: 'El agua hierve a cien grados',
			options: ['centígrados', 'tristes', 'corriendo', 'aunque'],
			answer: 'centígrados',
			note: 'A veces predecir la siguiente palabra exige saber cómo funciona el mundo, no solo el idioma.'
		},
		{
			prefix: 'Le pedí un café y me trajo un café con',
			options: ['leche', 'ventana', 'saltaba', 'quizás'],
			answer: 'leche',
			note: 'Las expresiones hechas son las más fáciles de predecir. Y son enormemente frecuentes.'
		},
		{
			prefix: 'Después del lunes viene el',
			options: ['martes', 'domingo', 'invierno', 'tren'],
			answer: 'martes',
			note: '«Domingo» también es un día, pero solo uno es correcto. Predecir bien exige algo más que la categoría.'
		}
	];

	const EXAMPLE_DISTRIBUTION = [
		{ label: 'tren', probability: 0.41, tone: 'model' as const },
		{ label: 'autobús', probability: 0.22, tone: 'model' as const },
		{ label: 'metro', probability: 0.14, tone: 'model' as const },
		{ label: 'coche', probability: 0.09, tone: 'model' as const },
		{ label: 'avión', probability: 0.05, tone: 'model' as const },
		{ label: 'toro', probability: 0.001, tone: 'muted' as const },
		{ label: 'queso', probability: 0.0002, tone: 'muted' as const }
	];
</script>

<Step title="Una máquina que solo hace una cosa">
	<Prose lead>
		<p>
			Todo lo que hace un modelo de lenguaje —traducir, resumir, programar, conversar— sale de una
			sola habilidad: <strong>adivinar qué viene después</strong>.
		</p>
	</Prose>

	<Prose>
		<p>
			Suena decepcionante. Y aun así, si te obligan a predecir bien la siguiente palabra de
			cualquier texto del mundo, acabas necesitando saber gramática, hechos, lógica, estilo y algo
			parecido al sentido común. No hay atajo: para completar bien «la capital de Francia es…»
			tienes que saber la respuesta.
		</p>
		<p>Antes de explicar cómo lo hace la máquina, hazlo tú.</p>
	</Prose>
</Step>

<Step gate="01-prediccion:adivina" title="Sé el modelo de lenguaje">
	<Challenge
		id="01-prediccion:adivina"
		title="Completa las frases"
		objective="Juega las seis rondas. No hace falta acertarlas todas: lo que importa es que veas qué estás haciendo."
		hints={['Fíjate en si te guía el significado, la gramática o simplemente la costumbre.']}
	>
		{#snippet children(api)}
			<GuessGame rounds={ROUNDS} onsolve={(result) => api.solve(result)} />
		{/snippet}
		{#snippet success(result)}
			<p>
				Acertaste <strong>{result.detail?.hits}</strong> de {result.detail?.rounds}. Guardamos tu
				marca: en el capítulo 4 te enfrentarás a un modelo de verdad.
			</p>
		{/snippet}
	</Challenge>

	<Callout kind="key" title="Lo que acabas de hacer">
		Has recorrido un texto y, en cada hueco, has puesto la palabra que te parecía más probable.
		Entrenar un modelo de lenguaje es exactamente eso, repetido sobre billones de palabras: predice,
		comprueba, y si fallas, corrígete un poco.
	</Callout>
</Step>

<Step title="El modelo no elige: reparte">
	<Prose>
		<p>
			Hay una diferencia importante entre lo que has hecho tú y lo que hace el modelo. Tú has
			elegido <em>una</em> palabra. El modelo no elige: reparte
			<strong>probabilidad entre todas las palabras que conoce</strong>, todas a la vez.
		</p>
	</Prose>

	<Figure caption="Lo que el modelo produce ante «tengo que coger el…»">
		<ProbabilityBars items={EXAMPLE_DISTRIBUTION} limit={7} />
	</Figure>

	<Prose>
		<p>
			Esa lista completa de probabilidades es la salida real de un modelo de lenguaje. Convertirla
			en una palabra concreta es un paso aparte, con sus propias reglas, y le dedicaremos el
			capítulo 5 entero.
		</p>
		<p>
			Fíjate también en que ni siquiera hemos dicho qué es una «palabra». Resulta que el modelo no
			trabaja con palabras, y esa decisión tiene consecuencias que arrastraremos hasta el final del
			curso.
		</p>
	</Prose>
</Step>
