<script lang="ts">
	import { SPANISH as DATA } from '../../data/es';
	import Step from '$ui/Step.svelte';
	import Prose from '$ui/Prose.svelte';
	import Callout from '$ui/Callout.svelte';
	import Challenge from '$ui/Challenge.svelte';
	import Figure from '$ui/Figure.svelte';
	import Generator from './Generator.svelte';
	import SchemeExplainer from './SchemeExplainer.svelte';
	import DetectorNeeds from './DetectorNeeds.svelte';
	import Detector from './Detector.svelte';
	import Attacker from './Attacker.svelte';

	const TARGET_Z = 5;
	const REQUIRED_CORRECT = 5;
</script>

<Step title="Firmar el azar">
	<Prose lead>
		<p>
			Queremos que un texto generado lleve una marca invisible: algo que no cambie cómo se lee, pero
			que permita demostrar después que salió de una máquina.
		</p>
	</Prose>

	<Prose>
		<p>
			La idea que funciona aprovecha justo el sitio por donde pasamos en el capítulo 5: el hueco
			entre los logits y el token elegido. Ahí hay libertad, porque casi siempre hay varias
			continuaciones aceptables, y elegir una u otra no estropea el texto.
		</p>
		<p>
			El esquema, propuesto por Kirchenbauer y sus colegas en 2023, tiene tres piezas. Aparecen dos
			letras griegas que son, simplemente, dos mandos: <strong>γ</strong> (gamma) decide qué
			<em>proporción</em> del vocabulario entra en la lista verde, y <strong>δ</strong> (delta)
			decide
			<em>cuánto</em> se favorece a esa lista. Nada más. Recórrelo paso a paso:
		</p>
	</Prose>

	<Figure wide caption="Los tres pasos, calculados sobre un vocabulario de diez tokens">
		<SchemeExplainer example={DATA.schemeExample} />
	</Figure>

	<Callout kind="key" title="Y así se detecta">
		Quien tenga la clave puede recorrer el texto, recalcular la lista verde en cada posición y
		contar cuántos tokens cayeron en verde. Sin marca, deberían ser una fracción γ. Con marca, son
		bastantes más. La estadística que mide esa diferencia es
		<code>z = (verdes − γT) / √(T·γ·(1−γ))</code>, y un valor por encima de 4 es prácticamente
		imposible por azar.
	</Callout>
</Step>

<Step gate="14-watermark:generador" title="Acto I · El generador">
	<Prose>
		<p>
			Aquí está el bigrama del capítulo 4, generando con marca de agua. Los tokens verdes salen
			resaltados en verde; los rojos, en rojo. Empieza con δ = 0 y súbelo poco a poco.
		</p>
		<p>Vigila las dos cifras a la vez: la z sube, pero la calidad del texto baja.</p>
	</Prose>

	<Challenge
		id="14-watermark:generador"
		title="Firma el texto"
		objective="Sube el sesgo δ hasta que la puntuación z supere {TARGET_Z}."
		hints={[
			'Con δ = 0 la proporción de verdes es exactamente γ y la z ronda el cero: eso es texto sin firmar.',
			'Fíjate en qué le pasa a la calidad cuando δ pasa de 4. El texto empieza a elegir palabras raras solo por ser verdes.',
			'Con γ pequeño la marca es más fácil de detectar, pero también más fácil de destruir.'
		]}
	>
		{#snippet children(api)}
			<Generator
				corpus={DATA.corpus}
				seedWord={DATA.seedWord}
				targetZ={TARGET_Z}
				onsolve={(result) => api.solve(result)}
			/>
		{/snippet}
		{#snippet success(result)}
			<p>
				z = <strong>{result.detail?.z}</strong> con δ = {result.detail?.delta} y γ =
				{result.detail?.gamma}.
			</p>
		{/snippet}
	</Challenge>

	<Callout kind="warn" title="El compromiso central">
		δ pequeño: texto intacto, marca frágil. δ grande: marca sólida, texto empobrecido. No existe un
		ajuste que dé las dos cosas, y esa tensión es el problema de fondo de todo el watermarking.
	</Callout>
</Step>

<Step gate="14-watermark:detector" title="Acto II · El detector">
	<Prose>
		<p>
			Antes de jugar conviene despejar la pregunta obvia: <strong
				>¿cómo se detecta la marca sin saber qué habría dicho el modelo?</strong
			>
			Parece que haría falta ejecutar el modelo sobre el texto, palabra por palabra, para reconstruir
			qué listas verdes hubo. Y no: <strong>no hace falta el modelo para nada</strong>.
		</p>
		<p>
			Vuelve al paso 1 del esquema. La lista verde salía de <code>hash(token anterior, clave)</code>
			— y solo de eso. No dependía de los logits, ni de las probabilidades, ni de nada que el modelo calculara.
			Así que el detector, teniendo el texto delante, puede recorrerlo mirando cada par de tokens consecutivos,
			rehacer el hash y comprobar si el token que salió estaba en verde. Son hashes, no redes neuronales:
			se ejecuta en un portátil, sin GPU.
		</p>
	</Prose>

	<Figure wide caption="Lo que necesita cada bando">
		<DetectorNeeds />
	</Figure>

	<Callout kind="warn" title="La consecuencia incómoda">
		Si la clave es lo único que abre la puerta, entonces <strong
			>solo quien tiene la clave puede detectar</strong
		>. Una empresa no puede saber si un texto lleva la marca de otra: probaría con su propia clave,
		obtendría un reparto verde/rojo distinto y le saldría una z de cero. Un detector no responde
		«¿esto lo escribió una IA?», sino <strong>«¿esto lleva mi marca?»</strong>, que es una pregunta
		mucho más pequeña. Y explica por qué las herramientas que dicen «detectar IA» sin tener ninguna
		clave están haciendo otra cosa completamente distinta —medir estilo— y se equivocan tanto.
	</Callout>

	<Prose>
		<p>
			Ahora sí, cambias de bando. Te llegan seis pasajes y tienes que decidir cuáles llevan marca.
			Puedes calcular la z de todos porque tienes la clave, pero la z no te da una respuesta: te da
			un número. La decisión —dónde poner el umbral— es tuya.
		</p>
		<p>
			Y no es una decisión inocente. Un umbral bajo detecta más textos generados, pero tarde o
			temprano señala a un texto humano. En un aula, eso es acusar a un alumno de copiar.
		</p>
	</Prose>

	<Challenge
		id="14-watermark:detector"
		title="Clasifica los seis pasajes"
		objective="Acierta al menos {REQUIRED_CORRECT} de 6, y presta atención a los falsos positivos."
		hints={[
			'Un umbral de 4 es el estándar: deja pasar alguna marca débil, pero casi nunca acusa a un inocente.',
			'Hay un pasaje marcado con un δ muy bajo. Es el caso difícil, y es el que te obliga a elegir.',
			'Otro pasaje fue marcado y después editado: la marca se debilita mucho con las ediciones.',
			'Y hay un pasaje generado por máquina al que nunca se le activó la marca. Ese es indetectable, y no es un fallo del detector.'
		]}
	>
		{#snippet children(api)}
			<Detector
				corpus={DATA.corpus}
				seedWord={DATA.seedWord}
				requiredCorrect={REQUIRED_CORRECT}
				onsolve={(result) => api.solve(result)}
			/>
		{/snippet}
		{#snippet success(result)}
			<p>
				<strong>{result.detail?.hits}</strong> de {result.detail?.total} con umbral
				{result.detail?.threshold} y {result.detail?.falsePositives} falsos positivos.
			</p>
		{/snippet}
	</Challenge>
</Step>

<Step gate="14-watermark:atacante" title="Acto III · El atacante">
	<Prose>
		<p>
			Último cambio de bando. Tienes un texto marcado y quieres publicarlo sin que se note. No
			puedes reescribirlo entero —entonces no sería el mismo texto—, así que tienes un presupuesto
			limitado de cambios.
		</p>
		<p>
			Solo puedes hacer una cosa: cambiar palabras por <strong>sinónimos</strong>. El texto seguirá
			significando exactamente lo mismo —esa es la gracia del ataque— pero los tokens serán otros, y
			con ellos cambia el reparto verde/rojo.
		</p>
		<p>
			Hay un detalle que lo hace más interesante de lo que parece: como la lista verde de cada
			posición depende del <strong>token anterior</strong>, cambiar una palabra no solo cambia su
			propio color, sino que baraja de nuevo la lista de la siguiente. Cada cambio tiene efecto
			doble.
		</p>
	</Prose>

	<Challenge
		id="14-watermark:atacante"
		title="Rompe la marca"
		objective="Baja la z por debajo de 4 cambiando como mucho 12 palabras por sinónimos."
		hints={[
			'Céntrate en las palabras verdes: son las que suman a la z. Cambiar una roja por otra roja casi no sirve.',
			'Busca rachas de verdes seguidos. Al cambiar el primero, el siguiente cambia de lista y a menudo se vuelve rojo solo.',
			'Todos los sustitutos son sinónimos de verdad: el texto no pierde sentido por mucho que cambies.'
		]}
	>
		{#snippet children(api)}
			<Attacker passage={DATA.attackPassage} onsolve={(result) => api.solve(result)} />
		{/snippet}
		{#snippet success(result)}
			<p>
				z = <strong>{result.detail?.z}</strong> (partía de {result.detail?.initialZ}) cambiando solo
				{result.detail?.edits} palabras por sinónimos.
			</p>
		{/snippet}
	</Challenge>
</Step>

<Step title="Lo que esto significa">
	<Prose>
		<p>
			Has visto el esquema desde los tres lados, así que puedes juzgarlo tú mismo. El watermarking
			de texto funciona: es una idea elegante, barata de aplicar y estadísticamente sólida. Pero
			tiene límites que no son un defecto de implementación, sino estructurales.
		</p>
		<p>
			<strong>Solo funciona si quien genera coopera.</strong> Un modelo de pesos abiertos que ejecutas
			en tu ordenador no va a marcarte nada.
		</p>
		<p>
			<strong>Es frágil ante la reescritura.</strong> Acabas de romperlo a mano en unas pocas ediciones.
			Pasar el texto por otro modelo que lo parafrasee lo destruye casi por completo.
		</p>
		<p>
			<strong>Necesita textos largos.</strong> La z crece con la raíz del número de tokens; en un párrafo
			corto no hay suficiente señal para afirmar nada.
		</p>
		<p>
			<strong>Y los falsos positivos son asimétricos.</strong> No detectar un texto generado es un fastidio.
			Acusar a una persona de no haber escrito lo que escribió es un daño real. Por eso los umbrales son
			conservadores, y por eso conviene desconfiar de cualquier herramienta que afirme detectar IA sin
			acceso a ninguna clave: esas no miden marcas, miden estilo, y se equivocan mucho.
		</p>
	</Prose>

	<Callout kind="key" title="Fin del curso">
		Has recorrido el camino entero: de trocear texto en tokens a firmarlo criptográficamente,
		pasando por embeddings, atención, transformers, entrenamiento, escala y alineamiento. Y en cada
		paso el cálculo se ejecutó de verdad en tu navegador. Ninguno de estos conceptos es magia; son
		piezas de ingeniería que ahora conoces por dentro.
	</Callout>
</Step>
