<script lang="ts">
	import { SPANISH as DATA } from '../../data/es';
	import Step from '$ui/Step.svelte';
	import Prose from '$ui/Prose.svelte';
	import Callout from '$ui/Callout.svelte';
	import Challenge from '$ui/Challenge.svelte';
	import TrainingLab from './TrainingLab.svelte';

	const TARGET_LOSS = 3;
	const STEP_BUDGET = 600;
</script>

<Step title="Aprender es equivocarse con método">
	<Prose lead>
		<p>
			Un modelo recién creado tiene los pesos llenos de números aleatorios. Entrenarlo consiste en
			repetir un ciclo de cuatro pasos, millones de veces.
		</p>
	</Prose>

	<Prose>
		<p>
			<strong>Uno:</strong> le enseñas un trozo de texto y le pides que prediga el siguiente token.
			<strong>Dos:</strong> comparas su distribución con la respuesta real y calculas la
			<em>loss</em>, un número que mide lo equivocado que estaba. <strong>Tres:</strong> calculas,
			para cada uno de los miles de millones de pesos, en qué dirección habría que moverlo para que
			la loss bajara un poco; eso es la retropropagación. <strong>Cuatro:</strong> mueves todos los pesos
			un pasito en esa dirección.
		</p>
		<p>
			El tamaño de ese pasito se llama <strong>learning rate</strong>, y es probablemente el ajuste
			más delicado de todo el aprendizaje automático. Demasiado pequeño y el modelo tarda una
			eternidad. Demasiado grande y los pesos salen disparados: la loss explota y el modelo queda
			peor que al empezar.
		</p>
	</Prose>

	<Callout title="La loss, en concreto">
		Usamos <em>cross-entropy</em>: el logaritmo negativo de la probabilidad que el modelo le dio al
		token correcto. Si le dio el 100%, la loss es 0. Si le dio una probabilidad ínfima, la loss se
		dispara. Un modelo que responde completamente al azar sobre un vocabulario de N tokens tiene una
		loss de ln(N).
	</Callout>
</Step>

<Step gate="08-entrenamiento:loss" title="Entrena un modelo de verdad">
	<Prose>
		<p>
			Abajo hay una red neuronal pequeña —embedding, capa oculta con tanh, y proyección al
			vocabulario— conectada al mismo texto del farero. No es una animación: se entrena de verdad,
			con retropropagación escrita a mano, en tu navegador.
		</p>
		<p>
			Tienes {STEP_BUDGET} pasos y un solo mando. Encuentra un learning rate que baje la loss hasta
			{TARGET_LOSS} dentro del presupuesto.
		</p>
	</Prose>

	<Challenge
		id="08-entrenamiento:loss"
		title="Baja la loss"
		objective="Alcanza una loss de {TARGET_LOSS} o menos en menos de {STEP_BUDGET} pasos."
		hints={[
			'Prueba primero con valores muy pequeños y muy grandes para ver los dos fallos: el que va lentísimo y el que explota.',
			'El punto dulce de este modelo está entre 1 y 5. No es una regla general: depende del modelo.',
			'Vigila el texto generado, no solo la curva. La loss es un número; el texto es lo que de verdad quieres.'
		]}
	>
		{#snippet children(api)}
			<TrainingLab
				corpus={DATA.corpus}
				targetLoss={TARGET_LOSS}
				stepBudget={STEP_BUDGET}
				onsolve={(result) => api.solve(result)}
			/>
		{/snippet}
		{#snippet success(result)}
			<p>
				Loss <strong>{result.detail?.loss}</strong> en {result.detail?.steps} pasos con learning rate
				{result.detail?.learningRate}.
			</p>
		{/snippet}
	</Challenge>
</Step>

<Step title="De este juguete a un modelo real">
	<Prose>
		<p>
			Lo que acabas de entrenar tiene unos pocos miles de parámetros y ha visto unas setecientas
			palabras. Un modelo grande tiene cientos de miles de millones de parámetros y ha visto
			billones de tokens. El bucle es idéntico. Lo que cambia es la escala, y las cosas raras que
			pasan cuando escalas.
		</p>
		<p>
			También habrás notado algo incómodo: aunque bajes mucho la loss, el texto que sale sigue sin
			ser bueno. Es que el modelo se ha aprendido <em>ese</em> texto, no el español. Con un modelo tan
			pequeño y un corpus tan pequeño, el sobreajuste es inevitable.
		</p>
		<p>
			Lo cual plantea la pregunta del siguiente capítulo, que es la pregunta de mil millones de
			euros: si tienes un presupuesto de cómputo dado, ¿lo gastas en un modelo más grande o en más
			datos?
		</p>
	</Prose>
</Step>
