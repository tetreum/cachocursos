<script lang="ts">
	import { SPANISH as DATA } from '../../data/es';
	import Step from '$ui/Step.svelte';
	import Prose from '$ui/Prose.svelte';
	import Callout from '$ui/Callout.svelte';
	import Challenge from '$ui/Challenge.svelte';
	import EmbeddingMap from './EmbeddingMap.svelte';

	const REQUIRED_HITS = 4;
</script>

<Step title="El problema del token 4.812">
	<Prose lead>
		<p>
			Al final del capítulo anterior el texto ya era una lista de enteros. El problema es que esos
			enteros no significan nada.
		</p>
	</Prose>

	<Prose>
		<p>
			Si «gato» es el token 4.812 y «perro» el 9.001, el modelo no tiene forma de saber que se
			parecen. Para él, 4.812 está tan lejos de 9.001 como de 4.813, que podría ser «paraguas». Los
			números son etiquetas, no medidas.
		</p>
		<p>
			La solución es dejar de representar cada token con un número y pasar a representarlo con una
			<strong>lista de números</strong>: un vector de varios cientos de dimensiones. Y lo importante
			es que esos números <em>no se eligen a mano</em>: se aprenden durante el entrenamiento,
			empujados por una única presión —que palabras que aparecen en contextos parecidos acaben con
			vectores parecidos.
		</p>
		<p>
			El resultado es que el significado se convierte en <strong>geometría</strong>. Y con la
			geometría se puede hacer aritmética.
		</p>
	</Prose>

	<Callout kind="warn" title="Un aviso honesto">
		Los embeddings de este capítulo están <strong>simplificados a propósito</strong>. En vez de
		cientos de dimensiones opacas, hemos construido 18 ejes con nombre —género, poder, tamaño,
		tiempo verbal, identidad geográfica…— para que puedas ver <em>por qué</em> funciona la aritmética.
		Un modelo real aprende sus propios ejes, nadie se los dicta, y casi ninguno tiene un nombre humano.
		Pero la geometría se comporta igual.
	</Callout>
</Step>

<Step gate="03-embeddings:mapa" title="Aritmética con palabras">
	<Prose>
		<p>
			Abajo tienes las {`${''}`}palabras del vocabulario proyectadas sobre un plano. Cada punto es
			una palabra y el color indica su familia. La proyección aplasta 18 dimensiones en 2, así que
			se pierde información, pero las vecindades se siguen viendo.
		</p>
		<p>
			En las rondas de analogía dibujamos una flecha entre dos palabras. Esa flecha <em>es</em> un concepto:
			la dirección que va de «hombre» a «rey» es literalmente el poder. Aplícala a otra palabra y mira
			dónde caes.
		</p>
	</Prose>

	<Challenge
		id="03-embeddings:mapa"
		title="Navega el espacio semántico"
		objective="Seis rondas entre analogías e intrusos. Necesitas {REQUIRED_HITS} aciertos."
		hints={[
			'En una analogía, la flecha azul te dice qué transformación aplicar. Búscala saliendo de la tercera palabra.',
			'Para el intruso, piensa en qué eje comparten tres de las cuatro palabras.',
			'La respuesta correcta se calcula de verdad con similitud coseno, no está escrita a mano.'
		]}
	>
		{#snippet children(api)}
			<EmbeddingMap
				axes={DATA.axes}
				words={DATA.words}
				analogies={DATA.analogies}
				oddOneOuts={DATA.oddOneOuts}
				requiredHits={REQUIRED_HITS}
				onsolve={(result) => api.solve(result)}
			/>
		{/snippet}
		{#snippet success(result)}
			<p>
				<strong>{result.detail?.hits}</strong> de {result.detail?.rounds}. Acabas de hacer álgebra
				con significados.
			</p>
		{/snippet}
	</Challenge>
</Step>

<Step title="Lo que los embeddings todavía no resuelven">
	<Prose>
		<p>
			Los embeddings resuelven el problema con el que abrimos el capítulo: las palabras dejan de ser
			etiquetas sin relación entre sí. Ahora una palabra nueva puede parecerse a otra conocida, y
			eso abre la puerta a <strong>generalizar</strong> en vez de memorizar.
		</p>
		<p>
			Pero queda un agujero enorme. El vector de «banco» es <strong>siempre el mismo</strong>, esté
			en «me senté en el banco» o en «fui al banco a sacar dinero». Un embedding estático no sabe
			nada del contexto: le da a cada palabra una única identidad para toda la vida.
		</p>
		<p>
			Y sobre todo: tener buenos vectores no es todavía predecir. Sabemos representar palabras, pero
			seguimos sin un método para decir qué viene después de qué. Antes de construir nada
			sofisticado conviene probar la idea más simple que existe, la que dominó el campo durante
			décadas, para ver exactamente dónde se rompe.
		</p>
	</Prose>

	<Callout kind="key" title="Siguiente parada">
		Predecir <strong>contando</strong>. Si quieres saber qué palabra sigue a otra, míralo en un
		texto y anótalo. Funciona sorprendentemente bien… hasta que deja de funcionar.
	</Callout>
</Step>
