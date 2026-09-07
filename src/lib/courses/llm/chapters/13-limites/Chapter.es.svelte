<script lang="ts">
	import { SPANISH as DATA } from '../../data/es';
	import Step from '$ui/Step.svelte';
	import Prose from '$ui/Prose.svelte';
	import Callout from '$ui/Callout.svelte';
	import Challenge from '$ui/Challenge.svelte';
	import Figure from '$ui/Figure.svelte';
	import DigitTokens from './DigitTokens.svelte';
	import StrategyWorkshop from './StrategyWorkshop.svelte';
	import CompoundingLab from './CompoundingLab.svelte';
</script>

<Step title="Un transformer no sabe dar vueltas">
	<Prose lead>
		<p>
			En el capítulo 2 vimos que el modelo no puede contar las erres de <code>ferrocarril</code>. Es
			hora de cerrar eso, porque el mismo problema explica por qué falla en aritmética — y porque la
			solución es la misma en los dos casos.
		</p>
	</Prose>

	<Prose>
		<p>
			Hay <strong>dos causas apiladas</strong>, y conviene separarlas.
		</p>
		<p>
			<strong>La primera ya la conoces:</strong> la unidad con la que trabaja el modelo no coincide con
			la unidad de la tarea. Las letras se esconden dentro de los tokens… y los dígitos también.
		</p>
	</Prose>

	<Figure wide caption="El mismo tokenizador del capítulo 2, ahora con números">
		<DigitTokens
			placeValues={DATA.placeValues}
			corpus={DATA.corpusNumbers}
			merges={DATA.numberMerges}
		/>
	</Figure>

	<Prose>
		<p>
			Fíjate en lo que pasa ahí, porque es peor de lo que parece: el troceado de los números
			<strong>no es consistente</strong>. <code>1200</code> aparecía mucho en el corpus y se quedó
			como un único token opaco; <code>347</code> aparecía poco y quedó partido en dígitos. El modelo
			no puede apoyarse en ninguna estructura de valor posicional, porque a veces la tiene y a veces no,
			según la frecuencia con que cada número apareció en internet.
		</p>
		<p>
			De ahí sale el arreglo obvio, y es el que usan hoy casi todos los tokenizadores modernos:
			<strong>partir los números en dígitos</strong> —o en grupos fijos— siempre, sin excepciones. Es
			exactamente la misma intervención que deletrear una palabra, solo que hecha en el entrenamiento
			en vez de en el prompt.
		</p>
	</Prose>

	<Callout kind="key" title="La segunda causa, la de verdad">
		Un transformer hace una cantidad <strong>fija</strong> de trabajo por token: la entrada cruza N
		capas, siempre N, sea la pregunta que sea. Pero sumar dos números de ocho cifras necesita ocho
		acarreos, y cada uno depende del anterior. Contar letras necesita un paso por letra. Son
		algoritmos cuya <em>longitud depende de la entrada</em>, y una pila fija de capas no puede
		expresar «repite hasta terminar». No hay bucle. No lo hay en la arquitectura que montaste en el
		capítulo 7.
	</Callout>

	<Prose>
		<p>
			Y aquí está el truco que lo resuelve, que es el mismo para las letras y para las cuentas:
			<strong>el modelo escribe los pasos y se los vuelve a leer</strong>. Cada token que emite
			recibe una pasada completa por las N capas. Escribiendo <code>f-e-r-r-o-…</code> o
			<code>7+5=12, llevo 1…</code>, el modelo convierte profundidad que no tiene en longitud que sí
			tiene. La ventana de contexto se vuelve su memoria de trabajo.
		</p>
		<p>
			Eso es la <em>cadena de pensamiento</em> del capítulo anterior, vista por dentro. No es que el modelo
			«razone en voz alta» para tu beneficio: es que no le queda otro sitio donde poner los resultados
			intermedios.
		</p>
	</Prose>
</Step>

<Step gate="13-limites:estrategias" title="Elige la herramienta mínima">
	<Prose>
		<p>
			Cuatro estrategias, ordenadas de más barata a más costosa: responder directamente, partir en
			letras o dígitos, escribir los pasos, o llamar a una herramienta que ejecute código de verdad.
		</p>
		<p>
			Seis tareas. Para cada una, elige la <strong>más barata que funcione de forma fiable</strong>.
			Los puntitos naranjas indican el coste. No siempre hace falta la artillería, y no siempre
			basta con lo barato.
		</p>
	</Prose>

	<Challenge
		id="13-limites:estrategias"
		title="La estrategia más barata que funciona"
		objective="Acierta la estrategia mínima en al menos 5 de las 6 tareas."
		hints={[
			'Pregúntate dos cosas por tarea: ¿necesito ver letras o dígitos sueltos? ¿y cuántos pasos dependen del anterior?',
			'Partir en unidades arregla el acceso, pero no añade capacidad de cálculo: si hay muchos pasos encadenados, no basta.',
			'Escribir los pasos sí añade capacidad, pero cada paso multiplica la probabilidad de fallo. Con muchos pasos, la herramienta gana.'
		]}
	>
		{#snippet children(api)}
			<StrategyWorkshop
				tasks={DATA.tasks}
				strategyLabels={DATA.strategyLabels}
				onsolve={(result) => api.solve(result)}
			/>
		{/snippet}
		{#snippet success(result)}
			<p>
				<strong>{result.detail?.hits}</strong> de {result.detail?.tasks}. Ya tienes el criterio.
			</p>
		{/snippet}
	</Challenge>
</Step>

<Step title="Por qué la cadena tiene un techo">
	<Prose>
		<p>
			Queda entender por qué a partir de cierto punto escribir los pasos deja de servir. La razón es
			puramente aritmética: si cada paso sale bien con probabilidad <em>p</em>, la cadena entera
			sale bien con probabilidad <em>p</em> elevado al número de pasos. Multiplicar números menores que
			uno lleva a un solo sitio.
		</p>
	</Prose>

	<Figure wide caption="Fiabilidad de una cadena según su longitud">
		<CompoundingLab />
	</Figure>

	<Prose>
		<p>
			Con un 97% por paso —que ya es optimista para operaciones intermedias— la cadena aguanta unos
			tres pasos antes de caer del 90%. Y aquí está la asimetría entre nuestros dos problemas:
			contar letras necesita <strong>un</strong> paso una vez ves las letras, así que se arregla del todo.
			Multiplicar dos números de tres cifras necesita nueve, y ahí el techo es real.
		</p>
		<p>
			Por eso la respuesta honesta en producción, para las letras y para las cuentas, acaba siendo
			la misma: <strong>llamar a una herramienta</strong>. El modelo escribe
			<code>palabra.count('l')</code> o <code>463*287</code> y otro programa lo ejecuta. No es rendirse:
			es reconocer que una red de profundidad fija no debería estar emulando una CPU.
		</p>
	</Prose>

	<Callout title="Y la vía radical">
		Existe una tercera línea de trabajo: quitar el tokenizador de en medio. Modelos como ByT5 o el
		Byte Latent Transformer trabajan directamente sobre bytes, así que las letras y los dígitos
		nunca se esconden. El precio es que las secuencias se vuelven mucho más largas —y ya sabes del
		capítulo 9 que la atención cuesta el cuadrado de la longitud—, así que por ahora es
		investigación, no práctica habitual.
	</Callout>
</Step>
