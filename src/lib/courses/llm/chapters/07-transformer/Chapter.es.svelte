<script lang="ts">
	import { SPANISH as DATA } from '../../data/es';
	import Step from '$ui/Step.svelte';
	import Prose from '$ui/Prose.svelte';
	import Callout from '$ui/Callout.svelte';
	import Challenge from '$ui/Challenge.svelte';
	import Figure from '$ui/Figure.svelte';
	import ResidualLab from './ResidualLab.svelte';
	import TransformerFlow from './TransformerFlow.svelte';
	import BlockBuilder, { type BlockPiece } from './BlockBuilder.svelte';

	const SAMPLE_SENTENCE = '«el faro miraba al mar»';

	const PIECES: readonly BlockPiece[] = [
		{
			id: 'tokenizar',
			label: 'Tokenización',
			detail: 'El texto se trocea y cada trozo se cambia por su id de vocabulario',
			missingConsequence:
				'Aquí va la tokenización. Todo lo demás trabaja con números; mientras el texto siga siendo una cadena de caracteres no hay nada que multiplicar. Es el paso que construiste tú mismo en el capítulo 2.'
		},
		{
			id: 'embed',
			label: 'Embedding de tokens',
			detail: 'Cada id de token se cambia por su vector aprendido',
			missingConsequence:
				'Aquí va el embedding. Sin él, las capas siguientes reciben identificadores enteros sin significado, y ya vimos en el capítulo 3 que el token 4.812 no le dice nada a nadie.'
		},
		{
			id: 'posicion',
			label: 'Codificación posicional',
			detail: 'Se suma información sobre la posición de cada token',
			missingConsequence:
				'Aquí va la codificación posicional. La atención mira todos los tokens a la vez y no tiene noción de orden: sin esta pieza, «el perro muerde al hombre» y «el hombre muerde al perro» serían idénticos para el modelo.'
		},
		{
			id: 'atencion',
			label: 'Atención multi-cabeza',
			detail: 'Cada token mira a los demás y mezcla su información',
			missingConsequence:
				'Aquí va la atención multi-cabeza. Es la única pieza donde los tokens se comunican entre sí; sin ella cada token viajaría por el bloque completamente aislado.'
		},
		{
			id: 'residual-1',
			label: 'Conexión residual + LayerNorm',
			detail: 'Se suma la entrada de la atención a su salida y se normaliza',
			missingConsequence:
				'Aquí va la primera conexión residual con su normalización. Durante el entrenamiento viaja hacia atrás por el modelo una señal de corrección que le dice a cada capa cómo ajustarse; la conexión residual le da un atajo. Sin ella, al apilar decenas de bloques esa señal se apaga antes de llegar a las primeras capas.'
		},
		{
			id: 'ffn',
			label: 'Red feed-forward',
			detail: 'Cada token pasa, por separado, por una capa oculta grande',
			missingConsequence:
				'Aquí va la red feed-forward. La atención solo mezcla y promedia información; esta capa es la que de verdad la transforma, y es donde vive la mayor parte de los parámetros del modelo.'
		},
		{
			id: 'residual-2',
			label: 'Conexión residual + LayerNorm',
			detail: 'Se suma la entrada de la feed-forward a su salida y se normaliza',
			missingConsequence:
				'Aquí va la segunda conexión residual. Cada subcapa del bloque —atención y feed-forward— tiene la suya propia; no basta con poner una.'
		},
		{
			id: 'unembed',
			label: 'Proyección al vocabulario',
			detail: 'El vector final se convierte en un logit por cada token',
			missingConsequence:
				'Aquí va la proyección final. Sin ella te quedas con un vector de unos cientos de números, no con una puntuación por cada token del vocabulario, que es lo que necesita el softmax.'
		}
	];
</script>

<Step title="Ocho piezas, un orden">
	<Prose lead>
		<p>
			La atención es el ingrediente estrella, pero por sí sola no hace un modelo. Va montada dentro
			de una estructura fija —el <strong>bloque Transformer</strong>— y ese bloque es solo una parte
			del recorrido completo que hace un texto desde que entra hasta que sale una predicción.
		</p>
	</Prose>

	<Prose>
		<p>
			Lo interesante es que cada pieza está ahí resolviendo un problema concreto, y quitar
			cualquiera de ellas rompe algo distinto. No es una receta arbitraria.
		</p>
	</Prose>

	<Figure wide caption="Una frase atravesando el modelo, paso a paso">
		<TransformerFlow flow={DATA.flow} />
	</Figure>

	<Prose>
		<p>
			Antes de seguir, una palabra que vamos a usar sin parar a partir de aquí. Casi todo lo que
			hace una de estas piezas es multiplicar por una matriz de números y sumar otra. Cada uno de
			esos números individuales es un <strong>parámetro</strong> —también los verás llamados
			<em>pesos</em>, es lo mismo— y son exactamente lo que el modelo aprende: empiezan valiendo
			cualquier cosa y el entrenamiento los va ajustando. Cuando oyes que un modelo «tiene 70.000
			millones de parámetros», eso es literalmente cuántos números hay que guardar para tenerlo.
		</p>
		<p>
			Dos de las piezas merecen atención especial. La <strong>red feed-forward</strong>, que procesa
			cada token por separado, es donde vive la mayoría de esos parámetros: si la atención decide
			<em>qué</em> información mezclar, la feed-forward decide <em>qué hacer</em> con ella.
		</p>
		<p>
			Y la <strong>conexión residual</strong>, que consiste simplemente en sumar la entrada de una
			capa a su salida. Parece tan trivial que cuesta creer que importe. Importa muchísimo, y se
			puede medir.
		</p>
	</Prose>

	<Prose>
		<p>
			Cuando un modelo se entrena, viaja hacia atrás por la pila una señal que le dice a cada capa
			cómo ajustarse. Esa señal tiene que atravesar todas las capas que hay por encima, y en cada
			una se atenúa un poco. Con pocas capas da igual. Con muchas, no llega nada.
		</p>
	</Prose>

	<Figure wide caption="Pila real de capas: se propaga la señal hacia atrás y se mide su magnitud">
		<ResidualLab />
	</Figure>

	<Callout kind="key" title="Por eso se pueden apilar cien bloques">
		La conexión residual le da a esa señal un <strong>atajo</strong>: como la salida contiene la
		entrada sumada, siempre queda un camino directo hasta las capas de abajo. Sin ese atajo, la
		profundidad deja de ser una ventaja y pasa a ser un problema. Fue una de las ideas que hicieron
		posible el aprendizaje profundo tal y como lo conocemos.
	</Callout>
</Step>

<Step gate="07-transformer:bloque" title="Monta el bloque">
	<Challenge
		id="07-transformer:bloque"
		title="Ordena las siete piezas"
		objective="Coloca las piezas en el orden que recorre una frase, desde el texto de entrada hasta los logits de salida."
		hints={[
			'Lo primero que entra es texto en bruto. Antes de poder multiplicar nada hay que convertirlo en números.',
			'Empieza por el final: lo último tiene que producir un número por cada token del vocabulario.',
			'La información posicional hay que inyectarla antes de que los tokens empiecen a mirarse entre ellos.',
			'Cada subcapa —atención y feed-forward— va seguida de su propia conexión residual.'
		]}
	>
		{#snippet children(api)}
			<BlockBuilder
				pieces={PIECES}
				sample={SAMPLE_SENTENCE}
				onsolve={(result) => api.solve(result)}
			/>
		{/snippet}
		{#snippet success(result)}
			<p>Bloque correcto en <strong>{result.detail?.attempts}</strong> intento(s).</p>
		{/snippet}
	</Challenge>
</Step>

<Step title="Y ahora, repetir">
	<Prose>
		<p>
			Un modelo real apila este bloque muchas veces: doce en los pequeños, ochenta o más en los
			grandes. Cada repetición trabaja sobre la salida de la anterior, y hay indicios de que las
			capas se reparten el trabajo —las primeras se ocupan de cosas más sintácticas, las últimas de
			cosas más abstractas.
		</p>
		<p>
			Con esto ya tienes la arquitectura completa. Pero una arquitectura no es un modelo: todos esos
			parámetros —las matrices de query, key y value, las de la feed-forward, los embeddings— están
			ahora mismo llenos de <strong>números aleatorios</strong>. Un transformer recién inicializado
			no sabe absolutamente nada.
		</p>
		<p>Falta la parte que convierte ruido en conocimiento.</p>
	</Prose>

	<Callout kind="key" title="Lo que viene">
		Entrenar. Y no vamos a explicártelo con metáforas: en el capítulo siguiente vas a entrenar un
		modelo de verdad, con retropropagación real, en tu navegador.
	</Callout>
</Step>
