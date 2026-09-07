<script lang="ts">
	import { SPANISH as DATA } from '../../data/es';
	import Step from '$ui/Step.svelte';
	import Prose from '$ui/Prose.svelte';
	import Callout from '$ui/Callout.svelte';
	import Challenge from '$ui/Challenge.svelte';
	import Figure from '$ui/Figure.svelte';
	import BpeGame from './BpeGame.svelte';
	import TokenizerDemo from './TokenizerDemo.svelte';

	const TARGET_MERGES = 10;
	const TARGET_RATIO = 1.5;
	const DEMO_MERGES = 12;
</script>

<Step title="El modelo nunca ve palabras">
	<Prose lead>
		<p>
			Un modelo de lenguaje no lee. Multiplica números. Antes de que pueda hacer nada con una frase,
			alguien tiene que convertir ese texto en una lista de enteros.
		</p>
	</Prose>

	<Prose>
		<p>
			La idea obvia sería dar un número a cada palabra. Y funciona, hasta que te topas con la
			realidad: el español tiene cientos de miles de formas distintas. <code>caminar</code>,
			<code>camino</code>, <code>caminaba</code>, <code>caminaríamos</code>… cada una necesitaría su
			propio número, y el modelo no tendría forma de saber que están emparentadas.
		</p>
		<p>
			Peor todavía: en cuanto aparece una palabra que no estaba en la lista —un nombre propio, un
			tecnicismo, una errata— el modelo se queda sin número que asignarle. Es lo que se llama estar
			<em>fuera de vocabulario</em>, y es un callejón sin salida.
		</p>
		<p>
			La idea contraria, dar un número a cada letra, resuelve eso pero crea otro problema: las
			secuencias se vuelven larguísimas y el modelo tiene que aprender desde cero que
			<code>c</code>, <code>a</code>, <code>s</code>, <code>a</code> significan algo juntas.
		</p>
	</Prose>

	<Callout kind="key" title="La solución">
		Trocear el texto en unidades intermedias: más grandes que una letra, más pequeñas que una
		palabra. Los trozos frecuentes se quedan enteros, los raros se parten. A esos trozos los
		llamamos <strong>tokens</strong>.
	</Callout>
</Step>

<Step gate="02-tokens:fusiones" title="Constrúyete un vocabulario">
	<Prose>
		<p>
			¿Y quién decide cuáles son esos trozos? Nadie: se aprenden del texto. El algoritmo se llama
			<strong>Byte-Pair Encoding</strong> y es asombrosamente simple.
		</p>
		<p>
			Empiezas con el texto partido en letras sueltas, más una marca especial —la escribimos
			<code>·</code>— que señala dónde acaba cada palabra. Esa marca es importante: sin ella el
			modelo no distinguiría <code>casa</code> al final de una palabra de <code>casa</code> dentro
			de <code>casamiento</code>.
		</p>
		<p>
			Después cuentas qué par de símbolos adyacentes aparece más veces, los fusionas en un símbolo
			nuevo, y repites. Eso es todo.
		</p>
		<p>
			Cada fusión acorta el corpus, así que la <em>compresión</em> —cuántos tokens te ahorras— mide directamente
			lo buenas que han sido tus decisiones. Ahora te toca a ti.
		</p>
	</Prose>

	<Challenge
		id="02-tokens:fusiones"
		title="Comprime el corpus"
		objective="Alcanza una compresión de {TARGET_RATIO.toFixed(
			2
		)}x o mejor en {TARGET_MERGES} fusiones."
		hints={[
			'La estrategia ganadora es siempre la misma: elige el par con el número más alto.',
			'Los símbolos que fusionas se pueden volver a fusionar. Así se construyen trozos largos a partir de trozos cortos.',
			'Fíjate en las terminaciones: en español, -ción y -ando aparecen por todas partes.'
		]}
	>
		{#snippet children(api)}
			<BpeGame
				corpus={DATA.corpusBpe}
				targetMerges={TARGET_MERGES}
				targetRatio={TARGET_RATIO}
				onsolve={(result) => api.solve(result)}
				onprogress={(result) => api.report(result)}
			/>
		{/snippet}
		{#snippet success(result)}
			<p>
				Compresión <strong>{result.detail?.ratio}x</strong> en {result.detail?.merges} fusiones. Acabas
				de entrenar un tokenizador.
			</p>
		{/snippet}
	</Challenge>

	<Callout title="Lo que acaba de pasar">
		Nadie le dijo al algoritmo qué es un sufijo. Aun así descubrió <code>-ción</code> y
		<code>-ando</code> solo, porque son los trozos que más se repiten. Un tokenizador real hace exactamente
		esto sobre miles de millones de palabras, hasta llegar a un vocabulario de unos 100.000 tokens.
	</Callout>
</Step>

<Step title="La factura oculta">
	<Prose>
		<p>
			Esta forma de trocear tiene consecuencias que arrastramos hasta el último capítulo del curso.
			Prueba tú mismo con el vocabulario que acabamos de aprender:
		</p>
	</Prose>

	<Figure caption="El mismo texto, visto por el modelo">
		<TokenizerDemo demo={DATA.tokenizer} corpus={DATA.corpusBpe} merges={DEMO_MERGES} />
	</Figure>

	<Prose>
		<p>
			Fíjate en lo que ocurre con las letras repetidas. Cuando le preguntas a un modelo cuántas
			erres tiene <code>ferrocarril</code>, muchas veces falla. No es que sea tonto: es que
			<strong>literalmente no ve las letras</strong>. Ve un puñado de tokens, y algunos llevan
			varias erres dentro sin ninguna marca que las distinga.
		</p>
		<p>
			Es también la razón de que los modelos sean peores en idiomas poco representados en su corpus
			de entrenamiento: si el tokenizador nunca vio ese idioma, lo parte en trozos diminutos, y todo
			cuesta más tokens, más dinero y más contexto.
		</p>
	</Prose>

	<Callout kind="key" title="Recuerda esto">
		A partir de aquí, cuando digamos «token», nos referimos a un número entero: la posición de ese
		trozo en el vocabulario. Un texto es una lista de enteros. Y ahora mismo esos enteros no
		significan nada — el token 4.812 no está «más cerca» del 4.813 que del 90.001. Arreglar eso es
		el capítulo siguiente. Y lo de las erres tiene arreglo también, pero necesitas saber unas
		cuantas cosas más antes: volveremos a ello en el capítulo 13.
	</Callout>
</Step>
