<script lang="ts">
	import Step from '$ui/Step.svelte';
	import Prose from '$ui/Prose.svelte';
	import Callout from '$ui/Callout.svelte';
	import Challenge from '$ui/Challenge.svelte';
	import BudgetLab from './BudgetLab.svelte';

	const BUDGET = 1e22;
	const TOLERANCE = 0.005;
</script>

<Step title="Lo que pasa cuando lo haces grande">
	<Prose lead>
		<p>
			En algún momento entre 2020 y 2022 quedó claro algo incómodo para los investigadores: buena
			parte del progreso no venía de ideas nuevas, sino de hacer lo mismo mucho más grande.
		</p>
	</Prose>

	<Prose>
		<p>
			Y lo raro es que se hace de forma predecible. La loss de un modelo sigue una
			<strong>ley de escalado</strong>: una fórmula sencilla que la relaciona con el número de
			parámetros y la cantidad de datos. Baja de forma suave, sin sorpresas, a lo largo de muchos
			órdenes de magnitud. Se puede predecir el rendimiento de un modelo antes de entrenarlo.
		</p>
		<p>
			Lo que <em>no</em> es suave son las capacidades. Habilidades como sumar varios dígitos o
			seguir instrucciones complejas aparecen de golpe al pasar cierto tamaño, aunque la curva de
			loss no haga nada especial en ese punto. A eso se le llamó <strong>emergencia</strong>, y
			sigue siendo objeto de discusión: parte del efecto viene de cómo medimos.
		</p>
	</Prose>

	<Callout title="Recordatorio">
		Un <strong>parámetro</strong> es cada uno de los números que el modelo aprende: las matrices de
		atención, las de la feed-forward, los embeddings. El modelito que entrenaste en el capítulo
		anterior tenía <strong>7.490</strong>. Los modelos de los que habla la prensa tienen entre mil
		millones y varios billones. Y <strong>D</strong>, los tokens de entrenamiento, es cuánto texto
		lee: no cuántas palabras distintas conoce, sino cuántos tokens le pasan por delante en total.
	</Callout>

	<Callout title="La fórmula">
		La ley de Chinchilla dice que la loss vale aproximadamente
		<code>1,69 + 406/N^0,34 + 411/D^0,28</code>, donde N son los parámetros y D los tokens de
		entrenamiento. El primer término es la <em>loss irreducible</em>: el ruido intrínseco del
		lenguaje, que no se elimina por mucho que crezcas. Y entrenar cuesta aproximadamente
		<code>6·N·D</code> operaciones.
	</Callout>
</Step>

<Step gate="09-escala:presupuesto" title="Reparte el presupuesto">
	<Prose>
		<p>
			Aquí está el dilema real de quien entrena modelos. Tienes un presupuesto fijo de cómputo
			—dinero, GPUs, tiempo— y como el coste es <code>6·N·D</code>, cada parámetro que añades te
			quita datos que leer.
		</p>
		<p>
			Un modelo gigante entrenado con poco texto desperdicia capacidad. Un modelo diminuto entrenado
			con muchísimo texto se satura y deja de aprender. En medio hay un óptimo, y durante años la
			industria lo estuvo calculando mal: GPT-3 era demasiado grande para los datos que vio.
		</p>
	</Prose>

	<Challenge
		id="09-escala:presupuesto"
		title="Encuentra el reparto óptimo"
		objective="Ajusta el tamaño del modelo para minimizar la loss prevista con el presupuesto dado."
		hints={[
			'Mueve el mando a los dos extremos primero: verás las dos formas de desperdiciar el presupuesto.',
			'La curva de la gráfica tiene un mínimo. Busca el fondo del valle.',
			'Fíjate en el marcador de «tokens por parámetro»: el óptimo está en unas pocas decenas.'
		]}
	>
		{#snippet children(api)}
			<BudgetLab budget={BUDGET} tolerance={TOLERANCE} onsolve={(result) => api.solve(result)} />
		{/snippet}
		{#snippet success(result)}
			<p>
				<strong>{result.detail?.parameters}</strong> de parámetros con
				{result.detail?.tokens} tokens: {result.detail?.tokensPerParameter} tokens por parámetro.
			</p>
		{/snippet}
	</Challenge>
</Step>

<Step title="El otro límite: la ventana">
	<Prose>
		<p>
			Hay un segundo límite que no tiene nada que ver con el entrenamiento y que notarás a diario:
			la <strong>ventana de contexto</strong>. Un modelo solo puede mirar un número finito de tokens
			a la vez.
		</p>
		<p>
			La culpa la tiene la atención del capítulo 6. Si cada token tiene que compararse con todos los
			demás, el coste crece con el <em>cuadrado</em> de la longitud. Doblar el contexto cuadruplica el
			trabajo. Hay muchas técnicas para mitigarlo, pero el problema de fondo sigue ahí.
		</p>
		<p>
			Y cuando algo se sale de la ventana, no es que el modelo lo recuerde peor: es que
			<strong>deja de existir</strong>. No hay aviso. El modelo responderá con la misma seguridad de
			siempre sobre un documento que ya no puede ver entero.
		</p>
	</Prose>

	<Callout kind="key" title="Y aun así, no es un asistente">
		Con todo esto tienes un modelo enorme, bien entrenado, que predice el siguiente token
		magníficamente. Si le escribes «¿cuál es la capital de Francia?», puede que te conteste… o puede
		que siga con «¿Y la de Italia? ¿Y la de Portugal?», porque en internet las preguntas suelen
		venir en listas. Convertir eso en algo que <em>obedece</em> es otro problema entero.
	</Callout>
</Step>
