<script lang="ts">
	import Step from '$ui/Step.svelte';
	import Prose from '$ui/Prose.svelte';
	import Callout from '$ui/Callout.svelte';
	import Challenge from '$ui/Challenge.svelte';
	import PromptWorkshop, { type PromptBlock } from './PromptWorkshop.svelte';

	const TARGET_QUALITY = 0.8;

	const TASK =
		'Extrae los datos de este correo:\n\n«Hola, soy Marta Ruiz. Os escribo desde Zaragoza. Mi pedido 88213 llegó roto el martes y quiero devolverlo.»';

	const BLOCKS: readonly PromptBlock[] = [
		{
			id: 'rol',
			label: 'Dar un rol al modelo',
			snippet: 'Actúa como un sistema de extracción de datos para atención al cliente.',
			quality: 0.15,
			explanation: 'Sitúa al modelo en la parte del espacio de textos donde vive ese tipo de tarea.'
		},
		{
			id: 'formato',
			label: 'Especificar el formato de salida',
			snippet:
				'Devuelve únicamente un objeto JSON con las claves: nombre, ciudad, pedido, incidencia.',
			quality: 0.35,
			explanation: 'Lo más rentable de todo. Sin esto, el modelo elige el formato por ti.'
		},
		{
			id: 'ejemplo',
			label: 'Añadir un ejemplo resuelto',
			snippet:
				'Ejemplo:\nEntrada: «Soy Luis Gil, de Vigo. El pedido 40122 nunca llegó.»\nSalida: {"nombre":"Luis Gil","ciudad":"Vigo","pedido":"40122","incidencia":"no entregado"}',
			quality: 0.3,
			explanation: 'In-context learning: un solo ejemplo fija formato, estilo y criterio a la vez.'
		},
		{
			id: 'vacios',
			label: 'Decir qué hacer con lo que falta',
			snippet: 'Si un dato no aparece en el texto, pon null. No lo inventes.',
			quality: 0.2,
			explanation: 'Los huecos son la principal fuente de invenciones en tareas de extracción.'
		},
		{
			id: 'cortesia',
			label: 'Pedirlo por favor',
			snippet: 'Por favor, hazlo lo mejor que puedas. ¡Gracias!',
			quality: 0,
			explanation: 'No hace daño, pero tampoco aporta nada medible. La cortesía no es una técnica.'
		},
		{
			id: 'presion',
			label: 'Amenazar o presionar',
			snippet: 'Es MUY IMPORTANTE que no falles o habrá consecuencias graves.',
			quality: 0,
			explanation: 'Muy popular y muy poco fiable. Añade ruido sin especificar nada.'
		}
	];

	const BAD_OUTPUT =
		'¡Claro! He leído el correo de Marta. Parece que ha tenido un problema con su pedido y entiendo su frustración. Los datos más relevantes serían su nombre, Marta Ruiz, y que escribe desde Zaragoza. ¿Quieres que redacte una respuesta?';

	const GOOD_OUTPUT =
		'{\n  "nombre": "Marta Ruiz",\n  "ciudad": "Zaragoza",\n  "pedido": "88213",\n  "incidencia": "producto roto"\n}';
</script>

<Step title="Aprender sin cambiar ni un peso">
	<Prose lead>
		<p>
			Aquí ocurre algo que no estaba en el plan. Si dentro del prompt le pones al modelo unos
			cuantos ejemplos de la tarea, mejora en esa tarea al instante, sin ningún entrenamiento.
		</p>
	</Prose>

	<Prose>
		<p>
			Se llama <strong>in-context learning</strong> y nadie lo diseñó: apareció solo al escalar. Los pesos
			no cambian; lo único que cambia es lo que hay en la ventana de contexto. El modelo infiere el patrón
			sobre la marcha y lo continúa, porque continuar patrones es exactamente lo único que sabe hacer.
		</p>
		<p>
			Visto así, el prompt no es una orden: es el <em>principio de un documento</em> que el modelo va
			a completar. Escribir buenos prompts consiste en construir un comienzo tal que la continuación más
			probable sea la respuesta que quieres.
		</p>
		<p>
			De ahí sale también el <strong>chain-of-thought</strong>: si le pides que razone paso a paso,
			los pasos intermedios entran en el contexto y cada uno condiciona al siguiente. El modelo
			literalmente <em>usa su propia salida como memoria de trabajo</em>. Por eso funciona en
			problemas de varios pasos.
		</p>
	</Prose>
</Step>

<Step gate="12-prompting:taller" title="Construye un prompt">
	<Prose>
		<p>
			Una tarea de extracción de datos. Ve activando bloques y mira cómo cambia el prompt y la
			respuesta. No todos los bloques ayudan: algunos son supersticiones muy extendidas.
		</p>
	</Prose>

	<Challenge
		id="12-prompting:taller"
		title="Consigue una salida utilizable"
		objective="Combina bloques hasta llegar a una calidad estimada del {Math.round(
			TARGET_QUALITY * 100
		)}%."
		hints={[
			'Pregúntate qué bloque elimina de verdad una ambigüedad, y cuál solo suena bien.',
			'Especificar el formato exacto de salida es casi siempre lo que más aporta.',
			'Un ejemplo resuelto vale más que tres frases explicando lo que quieres.'
		]}
	>
		{#snippet children(api)}
			<PromptWorkshop
				task={TASK}
				blocks={BLOCKS}
				badOutput={BAD_OUTPUT}
				goodOutput={GOOD_OUTPUT}
				targetQuality={TARGET_QUALITY}
				onsolve={(result) => api.solve(result)}
			/>
		{/snippet}
		{#snippet success(result)}
			<p>
				Calidad <strong>{result.detail?.quality}</strong> con {result.detail?.blocks} bloques.
			</p>
		{/snippet}
	</Challenge>

	<Callout kind="warn" title="La confianza no es corrección">
		Una advertencia que conviene llevarse del curso: la seguridad con la que un modelo afirma algo
		no guarda mucha relación con si es cierto. No hay un mecanismo interno que distinga «lo sé» de
		«suena plausible». Cuando no tiene el dato, la continuación más probable sigue siendo una frase
		bien formada y segura de sí misma. Eso son las alucinaciones, y no son un fallo: son el
		funcionamiento normal aplicado a un hueco.
	</Callout>
</Step>

<Step title="Un modelo que escribe como un humano">
	<Prose>
		<p>
			Recapitulemos lo que hemos construido. Un tokenizador que trocea el texto. Embeddings que
			convierten los trozos en geometría. Atención que los contextualiza. Un bloque que se repite
			decenas de veces. Entrenamiento a escala. Alineamiento para que obedezca. Y prompting para
			dirigirlo.
		</p>
		<p>
			El resultado es un sistema capaz de producir texto que, con frecuencia, no se distingue del
			escrito por una persona. Y eso plantea una pregunta muy práctica que ya no es técnica del
			todo: <strong>¿se puede saber si un texto lo escribió una máquina?</strong>
		</p>
		<p>
			Hay una respuesta ingeniosa, y para entenderla hacen falta justo las piezas que llevas: qué es
			un token, de dónde salen los logits, y qué pasa si alguien los toca antes de muestrear.
		</p>
	</Prose>
</Step>
