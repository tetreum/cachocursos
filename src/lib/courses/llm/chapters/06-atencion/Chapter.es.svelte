<script lang="ts">
	import { SPANISH as DATA } from '../../data/es';
	import Step from '$ui/Step.svelte';
	import Prose from '$ui/Prose.svelte';
	import Callout from '$ui/Callout.svelte';
	import Challenge from '$ui/Challenge.svelte';
	import AttentionGame from './AttentionGame.svelte';

	const PASSING_SCORE = 0.7;
</script>

<Step title="Mirar hacia atrás, pero no a todo">
	<Prose lead>
		<p>«El trofeo no cabía en la maleta porque era demasiado grande.» ¿Qué era demasiado grande?</p>
	</Prose>

	<Prose>
		<p>
			Lo has resuelto sin pensarlo: el trofeo. Y para hacerlo has mirado hacia atrás en la frase,
			pero no a todas las palabras por igual. «Porque» te ha dado igual. «Trofeo» y «maleta» han
			sido decisivas. Has repartido tu atención de forma desigual, y ese reparto es lo que resuelve
			la ambigüedad.
		</p>
		<p>
			Eso es, casi literalmente, el mecanismo de <strong>atención</strong>. Para cada palabra que
			está procesando, el modelo calcula cuánto debe fijarse en cada una de las demás, y luego
			construye una nueva representación de esa palabra mezclando las otras según esos pesos.
		</p>
		<p>
			Así es como «banco» deja de tener un vector fijo: si en la frase hay «dinero», el vector de
			«banco» absorbe algo de «dinero»; si hay «parque», absorbe otra cosa. El significado deja de
			estar en la palabra y pasa a estar en la palabra <em>más su contexto</em>.
		</p>
	</Prose>

	<Callout title="Query, Key, Value">
		El cálculo tiene tres piezas. Cada token emite una <strong>query</strong>: «esto es lo que
		busco». Cada token ofrece una <strong>key</strong>: «esto es lo que soy». Se comparan todas las
		queries con todas las keys mediante un producto escalar, se pasa el resultado por un softmax
		—sí, el mismo del capítulo 5— y salen los pesos. Con esos pesos se promedian los
		<strong>values</strong>, que es la información que cada token aporta.
	</Callout>
</Step>

<Step gate="06-atencion:reparto" title="Reparte tú la atención">
	<Prose>
		<p>
			Tres frases ambiguas. En cada una hay una palabra marcada como <em>query</em>: es la que hay
			que resolver. Reparte 100 puntos entre las demás según cuánto crees que hay que mirarlas.
		</p>
		<p>
			El sistema resolverá la referencia usando <strong>tu</strong> reparto, y después te enseñará el
			de un modelo entrenado para que compares.
		</p>
	</Prose>

	<Challenge
		id="06-atencion:reparto"
		title="Resuelve la ambigüedad"
		objective="Tu reparto debe parecerse al del modelo en al menos un {Math.round(
			PASSING_SCORE * 100
		)}% de media."
		hints={[
			'No repartas a partes iguales: la atención útil es concentrada, no democrática.',
			'Además del candidato correcto, suele haber una palabra que es la que desambigua (un adjetivo, un verbo). Dale su parte.',
			'Las palabras funcionales —artículos, preposiciones— casi nunca merecen atención en estos casos.'
		]}
	>
		{#snippet children(api)}
			<AttentionGame
				puzzles={DATA.attentionPuzzles}
				passingScore={PASSING_SCORE}
				onsolve={(result) => api.solve(result)}
			/>
		{/snippet}
		{#snippet success(result)}
			<p>
				Tu reparto se pareció al del modelo en un <strong>{result.detail?.similarity}</strong>.
			</p>
		{/snippet}
	</Challenge>

	<Callout kind="key" title="Por qué esto lo cambió todo">
		Un n-grama mira una ventana fija hacia atrás. La atención mira <strong>toda</strong> la
		secuencia y decide, para cada palabra y en cada capa, qué es relevante. Además se calcula para
		todas las posiciones <em>en paralelo</em>, lo que permitió entrenar sobre cantidades de texto
		que antes eran impensables. Ese es el título del artículo de 2017 que lo introdujo: «Attention
		Is All You Need».
	</Callout>
</Step>

<Step title="Una cabeza no basta">
	<Prose>
		<p>
			Acabas de hacer un reparto, uno solo. Pero en una frase pasan muchas cosas a la vez: hay
			concordancia de género, hay dependencias sintácticas, hay referencias a larga distancia, hay
			relaciones semánticas.
		</p>
		<p>
			Por eso los <strong>transformers</strong> —así se llama la arquitectura construida alrededor
			de este mecanismo, y la veremos entera en el capítulo siguiente— no calculan una atención,
			sino varias en paralelo. Cada una se llama una <strong>cabeza</strong>, y cada una acaba
			especializándose por su cuenta durante el entrenamiento: hay cabezas que siguen la
			concordancia de género, otras que enlazan verbos con sus sujetos, otras que atienden a la
			palabra inmediatamente anterior y poco más.
		</p>
		<p>
			Nadie las programa para eso. Emergen. Y varias cabezas, más unas cuantas piezas de fontanería
			que veremos ahora, forman el bloque que se repite decenas de veces dentro de un modelo.
		</p>
	</Prose>
</Step>
