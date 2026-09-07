<script lang="ts">
	import { SPANISH as DATA } from '../../data/es';
	import Step from '$ui/Step.svelte';
	import Prose from '$ui/Prose.svelte';
	import Callout from '$ui/Callout.svelte';
	import Challenge from '$ui/Challenge.svelte';
	import Figure from '$ui/Figure.svelte';
	import BigramDuel from './BigramDuel.svelte';
</script>

<Step title="Contar es predecir">
	<Prose lead>
		<p>
			Ya sabemos que el modelo tiene que producir una probabilidad para cada token. La pregunta es
			de dónde salen esos números. La respuesta más simple posible: <strong>contándolos</strong>.
		</p>
	</Prose>

	<Prose>
		<p>
			Coge un texto. Por cada palabra, anota qué palabra vino después. Cuando quieras predecir, mira
			tu tabla: si «la» fue seguida de «lámpara» 12 veces y de «playa» 3 veces, entonces predices
			«lámpara» con probabilidad 12/15 y «playa» con 3/15.
		</p>
		<p>
			Eso es un <strong>bigrama</strong>: un modelo de lenguaje completo, construido solo con una
			tabla de conteos. Si en vez de una palabra de contexto usas dos, tienes un trigrama, y así
			sucesivamente. Son los n-gramas, y dominaron el procesamiento del lenguaje durante décadas.
		</p>
	</Prose>

	<Figure caption={DATA.corpusNote}>
		<div class="e-corpus">
			<p class="e-corpus__title">{DATA.corpusTitle}</p>
			<pre class="e-corpus__text">{DATA.corpus}</pre>
		</div>
	</Figure>

	<Callout title="Esto no es una simulación">
		El modelo del reto siguiente se entrena de verdad, en tu navegador, sobre ese texto que acabas
		de leer. Todas las probabilidades que veas salen de contar sus palabras.
	</Callout>
</Step>

<Step gate="04-ngramas:duelo" title="Duelo contra el bigrama">
	<Prose>
		<p>
			Ocho rondas. En cada una verás una palabra de contexto y cuatro continuaciones posibles. Elige
			la que creas más probable y compara tu intuición con la tabla de conteos del modelo.
		</p>
	</Prose>

	<Challenge
		id="04-ngramas:duelo"
		title="Predice como un bigrama"
		objective="Completa las ocho rondas y observa dónde se rompe el modelo."
		hints={[
			'El modelo solo mira una palabra hacia atrás. Tú puedes hacer trampa y pensar en la frase entera; él no.',
			'Presta atención al aviso de «contexto nunca visto» en las últimas rondas.'
		]}
	>
		{#snippet children(api)}
			<BigramDuel
				corpus={DATA.corpus}
				seenContexts={DATA.seenContexts}
				unseenContexts={DATA.unseenContexts}
				onsolve={(result) => api.solve(result)}
			/>
		{/snippet}
		{#snippet success(result)}
			<p>
				Coincidiste con el modelo <strong>{result.detail?.matches}</strong> de
				{result.detail?.rounds} veces.
			</p>
		{/snippet}
	</Challenge>
</Step>

<Step title="Por qué contar no basta">
	<Prose>
		<p>Los n-gramas tienen dos problemas, y los dos son fatales.</p>
		<p>
			<strong>El primero es la memoria.</strong> Un bigrama solo ve una palabra hacia atrás. En «el
			barco que había salido del puerto la noche anterior <em>encalló</em>», para acertar el verbo
			hay que recordar «barco», nueve palabras antes. Podrías usar un 10-grama, pero el número de
			contextos posibles crece como el tamaño del vocabulario elevado a diez. No hay texto
			suficiente en el mundo.
		</p>
		<p>
			<strong>El segundo es la dispersión</strong>, y ya lo has visto: en cuanto aparece un contexto
			que no estaba en el corpus, la tabla está vacía. El modelo no puede razonar «bueno,
			“helicóptero” se parece a “barco”, probemos algo parecido», porque para él las palabras son
			identificadores sin relación alguna. Puedes tapar el agujero con suavizado, pero es
			maquillaje: no hay conocimiento debajo.
		</p>
	</Prose>

	<Prose>
		<p>
			Fíjate en que los embeddings del capítulo anterior ya resuelven media papeleta: con vectores,
			«helicóptero» y «barco» <em>sí</em> se parecen. Lo que falta es un modelo que sepa
			aprovecharlo — que en lugar de consultar una tabla de conteos, <strong>aprenda</strong> una función,
			y que además decida por sí mismo qué partes del contexto importan en cada caso.
		</p>
		<p>
			Llegaremos ahí. Pero antes hay una pregunta más inmediata que llevamos esquivando desde el
			primer capítulo, y que el duelo que acabas de jugar deja a la vista: el modelo no te ha dado
			una palabra. Te ha dado una <strong>lista de probabilidades</strong>.
		</p>
	</Prose>

	<Callout kind="key" title="Siguiente parada">
		Alguien tiene que convertir esa lista en una palabra concreta, y cómo se haga cambia por
		completo el carácter del texto que sale. Ese paso tiene sus propias reglas y su propio capítulo.
	</Callout>
</Step>

<style lang="scss">
	.e-corpus {
		display: flex;
		flex-direction: column;
		gap: var(--e-space-xs);
		max-height: 22rem;
		padding: var(--e-space-md);
		overflow-y: auto;
		background: var(--e-bg-subtle);
		border: var(--e-border-width) solid var(--e-border);
		border-radius: var(--e-radius-md);

		&__title {
			font-size: var(--e-text-2xs);
			font-weight: var(--e-weight-bold);
			color: var(--e-fg-dim);
			letter-spacing: var(--e-tracking-wide);
			text-transform: uppercase;
		}

		&__text {
			@include mono;

			margin: 0;
			font-size: var(--e-text-xs);
			line-height: var(--e-leading-snug);
			color: var(--e-fg-muted);
			white-space: pre-wrap;
		}
	}
</style>
