<script lang="ts">
	import { SPANISH as DATA } from '../../data/es';
	import Step from '$ui/Step.svelte';
	import Prose from '$ui/Prose.svelte';
	import Callout from '$ui/Callout.svelte';
	import Challenge from '$ui/Challenge.svelte';
	import LabellerGame from './LabellerGame.svelte';
</script>

<Step title="Un modelo base no es un asistente">
	<Prose lead>
		<p>
			El modelo que hemos construido sabe continuar texto. Eso no es lo mismo que responder
			preguntas, y la diferencia se nota enseguida.
		</p>
	</Prose>

	<Prose>
		<p>
			Si a un modelo base le escribes «escribe un poema sobre el mar», una continuación
			perfectamente plausible es «…en menos de veinte versos. Entrega antes del viernes.» Porque en
			internet esa frase aparece muchas veces dentro de un enunciado de deberes, no como una
			petición a una máquina.
		</p>
		<p>El modelo no te está desobedeciendo. Es que nunca le hemos pedido que obedezca.</p>
		<p>
			Convertirlo en asistente son dos fases más. La primera, <strong>instruction tuning</strong>,
			es entrenamiento normal y corriente sobre un conjunto de ejemplos escritos a mano con la forma
			«instrucción → buena respuesta». Es sorprendentemente barata comparada con el
			preentrenamiento, y ya arregla la mayor parte del problema.
		</p>
		<p>
			La segunda es más sutil. Para muchas preguntas no existe «la» respuesta correcta que puedas
			escribir a mano, pero sí es fácil decir cuál de dos respuestas es mejor. Así que se le pide
			eso a la gente.
		</p>
	</Prose>

	<Callout title="RLHF, en tres pasos">
		Se recogen miles de comparaciones humanas entre pares de respuestas. Con ellas se entrena un
		<strong>reward model</strong>: una red que aprende a puntuar respuestas como lo haría un
		etiquetador. Y finalmente se optimiza el modelo de lenguaje para maximizar esa puntuación. El
		humano no escribe respuestas: escribe el criterio.
	</Callout>
</Step>

<Step gate="11-alineamiento:etiquetador" title="Sé el etiquetador">
	<Prose>
		<p>
			Seis preguntas, dos respuestas cada una. Elige la que preferirías recibir. Al terminar
			entrenaremos un reward model de verdad —regresión logística por pares, el mismo método que se
			usa en la práctica— con tus elecciones, y te enseñaremos qué ha aprendido.
		</p>
		<p>Responde con sinceridad. La gracia del ejercicio está en lo que salga.</p>
	</Prose>

	<Challenge
		id="11-alineamiento:etiquetador"
		title="Entrena un reward model con tus preferencias"
		objective="Elige tu respuesta preferida en las seis comparaciones."
		hints={[
			'No hay respuesta correcta. Lo interesante es qué rasgo acaba pesando más en tu modelo.',
			'Fíjate en si estás premiando respuestas que de verdad resuelven la pregunta o solo respuestas que suenan bien.'
		]}
	>
		{#snippet children(api)}
			<LabellerGame
				pairs={DATA.responsePairs}
				traitLabels={DATA.traitLabels}
				onsolve={(result) => api.solve(result)}
			/>
		{/snippet}
		{#snippet success(result)}
			<p>
				Tu reward model reproduce tus preferencias con un
				<strong>{result.detail?.accuracy}</strong> de acierto, y lo que más premia es «{result
					.detail?.dominantTrait}».
			</p>
		{/snippet}
	</Challenge>
</Step>

<Step title="Optimizar lo que mides, no lo que quieres">
	<Prose>
		<p>
			El problema que acabas de ver en pequeño es el problema central del alineamiento. El reward
			model es una <em>aproximación</em> a lo que quieres. En cuanto empujas fuerte contra ella, el modelo
			encuentra los huecos entre la aproximación y tu intención real.
		</p>
		<p>
			En la práctica esto produce cosas muy reconocibles: respuestas más largas de lo necesario,
			porque los etiquetadores tienden a puntuar mejor lo extenso. Adulación —el modelo te da la
			razón porque llevarte la contraria puntúa peor. Y cautela excesiva, esos avisos interminables
			de «consulta a un profesional» que no ayudan a nadie pero nunca se puntúan como incorrectos.
		</p>
		<p>
			Ninguna de esas conductas se programó. Todas son <strong>reward hacking</strong>: el modelo
			maximizando exactamente lo que le pedimos, que no era exactamente lo que queríamos.
		</p>
	</Prose>

	<Callout kind="key" title="Lo que queda">
		Ya tenemos un asistente. Pero su comportamiento depende muchísimo de cómo le hables, y eso abre
		una habilidad que no requiere entrenar nada: el prompting.
	</Callout>
</Step>
