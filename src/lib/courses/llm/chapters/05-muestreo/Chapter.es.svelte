<script lang="ts">
	import { SPANISH as DATA } from '../../data/es';
	import Step from '$ui/Step.svelte';
	import Prose from '$ui/Prose.svelte';
	import Callout from '$ui/Callout.svelte';
	import Challenge from '$ui/Challenge.svelte';
	import SamplingDesk from './SamplingDesk.svelte';
</script>

<Step title="La distribución no es la respuesta">
	<Prose lead>
		<p>
			El modelo te entrega una puntuación para cada uno de sus cien mil tokens. Pero tú querías una
			palabra. Alguien tiene que elegir, y esa elección no la hace el modelo: la hace el programa
			que lo envuelve.
		</p>
	</Prose>

	<Prose>
		<p>
			Conviene precisar qué sale de un modelo, porque hasta ahora hemos dicho «probabilidades» por
			simplificar. Lo que la última capa produce en realidad es un número suelto por cada token del
			vocabulario: un <strong>logit</strong>. Son puntuaciones en bruto, sin normalizar. Pueden ser
			negativas, pueden ser enormes, y desde luego no suman uno. Solo dicen «este token me encaja
			más que aquel».
		</p>
		<p>
			Para convertirlas en probabilidades de verdad se aplica el <strong>softmax</strong>: se
			exponencia cada logit y se divide por la suma de todos. Eso hace dos cosas a la vez —deja
			todos los valores positivos y fuerza que sumen exactamente uno— y además exagera las
			diferencias, porque la exponencial crece muy deprisa. Un logit un poco mayor que otro acaba
			con bastante más probabilidad.
		</p>
		<p>
			Esta distinción importa para lo que viene: dos de los tres mandos actúan sobre las
			probabilidades ya calculadas, pero el primero actúa <em>antes</em>, sobre los logits en bruto.
		</p>
		<p>
			Con la distribución ya en la mano, la opción evidente es coger siempre el token más probable.
			Se llama <em>greedy</em> y tiene un problema conocido: produce texto plano y, sobre todo, se queda
			atrapado en bucles. Si «de» es la continuación más probable de «la», y «la» lo es de «de», el modelo
			escribirá «de la de la de la» hasta el fin de los tiempos.
		</p>
		<p>
			La otra opción es muestrear: tirar un dado cargado con esas probabilidades. Más variado, pero
			de vez en cuando saldrá un token absurdo que descarrila la frase entera.
		</p>
		<p>Entre esos dos extremos viven tres mandos.</p>
	</Prose>

	<Callout title="Los tres mandos">
		<strong>Temperatura</strong> divide cada logit antes de aplicar el softmax. Dividir por un
		número menor que 1 agranda las distancias entre logits y el softmax las convierte en un pico muy
		marcado: el modelo se vuelve conservador. Dividir por un número mayor que 1 las encoge, la
		distribución se aplana y todo se vuelve más caótico.<br />
		<strong>Top-k</strong> ya trabaja sobre las probabilidades: se queda con los k tokens más
		probables y tira el resto.<br />
		<strong>Top-p</strong> hace lo mismo pero por masa de probabilidad: coge los tokens necesarios para
		sumar p, sean dos o sean doscientos.
	</Callout>
</Step>

<Step gate="05-muestreo:mesa" title="La mesa de mezclas">
	<Prose>
		<p>
			Abajo tienes el bigrama del capítulo anterior conectado a los tres mandos. Todo se recalcula
			mientras arrastras: la distribución, los tokens que sobreviven a los filtros y el texto
			generado.
		</p>
		<p>
			Tu objetivo es meter el punto en la zona verde: texto <strong>variado pero coherente</strong>.
			Demasiado a la izquierda y el modelo se repite; demasiado abajo y dice tonterías.
		</p>
	</Prose>

	<Challenge
		id="05-muestreo:mesa"
		title="Encuentra el punto dulce"
		objective="Ajusta los tres mandos hasta que el punto naranja caiga dentro del rectángulo verde."
		hints={[
			'Empieza por la temperatura. Con valores muy bajos verás el bucle de repetición al instante.',
			'Top-p suele ser mejor mando que top-k: se adapta a cada paso según lo seguro que esté el modelo.',
			'Una combinación que suele funcionar es temperatura cerca de 1 con top-p entre 0,85 y 0,95.'
		]}
	>
		{#snippet children(api)}
			<SamplingDesk
				corpus={DATA.corpus}
				seedWord={DATA.seedWord}
				onsolve={(result) => api.solve(result)}
			/>
		{/snippet}
		{#snippet success(result)}
			<p>
				Lo conseguiste con temperatura <strong>{result.detail?.temperature}</strong>, top-k
				{result.detail?.topK} y top-p {result.detail?.topP}.
			</p>
		{/snippet}
	</Challenge>
</Step>

<Step title="Un mando que no está en la caja">
	<Prose>
		<p>
			Estos tres mandos explican buena parte del carácter de un modelo. Una temperatura baja te da
			un asistente aburrido y fiable; una alta, uno imaginativo y poco de fiar. No hay ajuste
			«correcto»: hay ajustes adecuados para escribir poesía y ajustes adecuados para generar
			código.
		</p>
		<p>
			Y ahora la parte importante: <strong>nada de esto toca el modelo</strong>. Los logits ya
			estaban ahí; nosotros solo hemos decidido cómo leerlos. Guarda esa idea, porque en el último
			capítulo vamos a hacer algo mucho más atrevido con ellos: sumarles un sesgo secreto para
			firmar el texto sin que se note.
		</p>
		<p>
			Antes tenemos que responder a la pregunta que llevamos aplazando desde el capítulo 4: ¿de
			dónde salen esos logits, si contar no funciona?
		</p>
	</Prose>
</Step>
