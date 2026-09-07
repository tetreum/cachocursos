<script lang="ts">
	import { SPANISH as DATA } from '../../data/es';
	import { EXPERT_CAPACITY, ROUTING_TARGET } from '../../config';
	import Step from '$ui/Step.svelte';
	import Prose from '$ui/Prose.svelte';
	import Callout from '$ui/Callout.svelte';
	import Challenge from '$ui/Challenge.svelte';
	import Figure from '$ui/Figure.svelte';
	import RouterGame from './RouterGame.svelte';
	import RouterMechanism from './RouterMechanism.svelte';
	import SparsityLab from './SparsityLab.svelte';
</script>

<Step title="Todos los tokens pagan por todo">
	<Prose lead>
		<p>
			En el capítulo anterior el coste era <code>6·N·D</code>: cada parámetro se paga en cada token.
			Esa ecuación tiene una grieta, y explotarla es lo que hacen casi todos los modelos grandes de
			hoy.
		</p>
	</Prose>

	<Prose>
		<p>
			Volvamos al bloque que montaste en el capítulo 7: La <strong>red feed-forward</strong> era la
			pieza donde vivían la mayoría de los parámetros, y procesaba cada token por separado. Fíjate
			en lo que eso implica: cuando el modelo procesa la palabra <code>de</code>, atraviesa
			exactamente los mismos miles de millones de parámetros que cuando procesa
			<code>acantilado</code>
			o el símbolo <code>==</code>.
		</p>
		<p>
			¿Y si no hiciera falta? Un token de código y un token de poesía probablemente quieran
			transformaciones distintas. La idea de la <strong>mezcla de expertos</strong> (MoE) es
			sustituir esa única red feed-forward por <em>muchas</em> —los expertos— y hacer que cada token pase
			solo por unas pocas.
		</p>
		<p>
			Quien decide cuáles es el <strong>router</strong>: una capa minúscula que mira el token y
			reparte. Es el trabajo que vas a hacer tú ahora a mano.
		</p>
	</Prose>

	<Callout kind="warn" title="Lo que MoE no arregla">
		Que quede claro, porque se confunde a menudo: MoE es una técnica de <strong>eficiencia</strong>.
		No hace al modelo más listo por sí sola, y desde luego no arregla la ceguera del tokenizador del
		capítulo 2 (el modelo no sabe contar cuántas "L" tiene una palabra porque ve vectores, no
		palabras) — un MoE sigue sin ver las letras, porque el troceado ocurre mucho antes. Lo que sí lo
		arregla lo veremos en el capítulo 13.
	</Callout>
</Step>

<Step title="¿Y cómo sabe el router quién es experto en qué?">
	<Prose lead>
		<p>
			Aquí hay una pregunta con trampa. Si nadie le asigna un tema a cada experto, y el router tiene
			que decidir a quién mandar cada token… ¿de dónde saca esa información?
		</p>
	</Prose>

	<Prose>
		<p>
			La respuesta corta es que <strong>no la saca de ningún sitio: la construye a la vez</strong>.
			Y la respuesta larga empieza por quitarle misterio al router. No es un programa que razone
			sobre tokens: es una <strong>matriz</strong>, una fila por experto. Multiplicas el vector del
			token por esa matriz, obtienes una puntuación por experto, aplicas softmax y te quedas con las
			más altas. Eso es todo.
		</p>
	</Prose>

	<Figure wide caption="El router por dentro: un producto escalar y poco más">
		<RouterMechanism
			experts={DATA.experts}
			tokens={DATA.routableTokens}
			featureNames={DATA.featureNames}
			trainedRouter={DATA.trainedRouter}
			untrainedRouter={DATA.untrainedRouter}
		/>
	</Figure>

	<Prose>
		<p>
			Prueba el botón de «router recién inicializado». Al principio del entrenamiento esa matriz
			está llena de números aleatorios: el reparto es prácticamente una moneda al aire y todos los
			expertos son igual de inútiles. No hay ninguna especialización que descubrir todavía.
		</p>
		<p>Lo que pasa a partir de ahí es un bucle que se retroalimenta:</p>
		<ul>
			<li>Por puro azar, un experto recibe algún token numérico de más.</li>
			<li>Al entrenarse con ellos, mejora <em>un poquito</em> con los números.</li>
			<li>
				Como ahora la loss baja más cuando los números van allí, el gradiente empuja al router a
				mandarle más números.
			</li>
			<li>Con más números, se especializa más. Y vuelta a empezar.</li>
		</ul>
		<p>
			El router y los expertos se entrenan <strong>a la vez</strong>, con el mismo gradiente. La
			especialización no es un requisito previo del reparto: es su <em>consecuencia</em>. Una
			asimetría minúscula al principio se amplifica hasta convertirse en una división del trabajo.
		</p>
	</Prose>

	<Callout kind="key" title="Los nombres los ponemos nosotros">
		El router no «sabe» que el experto B es el del código, igual que no hay ninguna etiqueta escrita
		en ningún sitio. Solo hay una fila de números que da un valor alto cuando el token trae ciertos
		rasgos. Que luego nosotros miremos qué le llega y digamos «ah, este es el de código» es
		interpretación nuestra, a posteriori. Es exactamente lo mismo que pasaba con las cabezas de
		atención del capítulo 6: nadie las programa, emergen, y les ponemos nombre después.
	</Callout>

	<Callout kind="warn" title="Y por eso puede salir mal">
		Ese bucle de «el que va ganando gana más» no tiene por qué repartirse bien. Si un experto coge
		ventaja demasiado pronto, puede acabar llevándose casi todo mientras los demás se quedan sin
		entrenar. Guarda esta idea: la vas a ver ocurrir en el marcador del reto siguiente.
	</Callout>
</Step>

<Step gate="10-expertos:enrutado" title="Sé el router">
	<Prose>
		<p>
			Ahora te toca a ti hacer de matriz. Doce tokens y cuatro expertos ya entrenados: cada uno se
			especializó por su cuenta siguiendo el bucle que acabas de ver, y procesa mejor unos tokens
			que otros.
		</p>
		<p>
			El detalle que lo complica: cada experto tiene una <strong>capacidad</strong> limitada. Si le mandas
			más tokens de los que puede procesar, los que sobran se descartan y se saltan la capa entera. Repartir
			bien no es solo acertar con el tema; es también no saturar a nadie.
		</p>
	</Prose>

	<Challenge
		id="10-expertos:enrutado"
		title="Reparte los tokens entre los expertos"
		objective="Coloca los doce tokens y alcanza una calidad del {Math.round(
			ROUTING_TARGET * 100
		)}%."
		hints={[
			'Agrupa por tipo: los números con los números, el código con el código. Los expertos se especializan justo así.',
			'Hay doce tokens, cuatro expertos y capacidad para cuatro cada uno. Las cuentas salen exactas: tres por experto.',
			'Si no ves por qué falla, activa «Ver afinidades» y compara lo que has puesto con lo que cada experto prefiere.'
		]}
	>
		{#snippet children(api)}
			<RouterGame
				experts={DATA.experts}
				tokens={DATA.routableTokens}
				capacity={EXPERT_CAPACITY}
				target={ROUTING_TARGET}
				onsolve={(result) => api.solve(result)}
			/>
		{/snippet}
		{#snippet success(result)}
			<p>
				Calidad <strong>{result.detail?.quality}</strong> sin descartar ningún token.
			</p>
		{/snippet}
	</Challenge>
</Step>

<Step title="Parámetros que no se pagan">
	<Prose>
		<p>
			Ahora la consecuencia contable, que es lo que ha hecho famosa a esta idea. Los parámetros de
			los expertos que <em>no</em> se activan siguen existiendo —hay que guardarlos en memoria— pero no
			cuestan cómputo en ese token.
		</p>
	</Prose>

	<Figure wide caption="Capacidad frente a cómputo en una capa de expertos">
		<SparsityLab />
	</Figure>

	<Prose>
		<p>
			Por eso verás modelos anunciados con dos cifras: «tantos parámetros totales, tantos activos».
			Un modelo puede tener cientos de miles de millones de parámetros y activar solo unas decenas
			de miles de millones por token. En la ley de escalado del capítulo anterior, es como si
			pudieras subir <strong>N</strong> sin pagar el <code>6·N·D</code> entero.
		</p>
		<p>
			La factura se traslada a otro sitio: <strong>la memoria</strong>. Hay que tener todos los
			expertos cargados por si acaso, aunque en cada token uses dos. Un MoE es barato de ejecutar y
			caro de alojar.
		</p>
	</Prose>

	<Callout kind="key" title="Y el problema que crea">
		Nada garantiza que el router reparta bien. Si aprende que un experto es un poco mejor que los
		demás, empezará a mandarle todo, ese experto se saturará y el resto quedará sin entrenar: es el
		<strong>colapso del router</strong>, y lo has visto en el marcador del reto. Por eso el
		entrenamiento de un MoE lleva un término extra en la loss cuyo único trabajo es
		<em>obligar</em> a que la carga se reparta.
	</Callout>
</Step>
