<script lang="ts">
	import { ENGLISH as DATA } from '../../data/en';
	import Step from '$ui/Step.svelte';
	import Prose from '$ui/Prose.svelte';
	import Callout from '$ui/Callout.svelte';
	import Challenge from '$ui/Challenge.svelte';
	import Figure from '$ui/Figure.svelte';
	import ResidualLab from './ResidualLab.svelte';
	import TransformerFlow from './TransformerFlow.svelte';
	import BlockBuilder, { type BlockPiece } from './BlockBuilder.svelte';

	const SAMPLE_SENTENCE = '“the lighthouse watched the sea”';

	const PIECES: readonly BlockPiece[] = [
		{
			id: 'tokenizar',
			label: 'Tokenisation',
			detail: 'The text is chopped up and each piece swapped for its vocabulary id',
			missingConsequence:
				'Tokenisation goes here. Everything else works with numbers; while the text is still a string of characters there is nothing to multiply. It is the step you built yourself in chapter 2.'
		},
		{
			id: 'embed',
			label: 'Token embedding',
			detail: 'Each token id is swapped for its learned vector',
			missingConsequence:
				'The embedding goes here. Without it the following layers receive meaningless integer identifiers, and we saw in chapter 3 that token 4,812 tells nobody anything.'
		},
		{
			id: 'posicion',
			label: 'Positional encoding',
			detail: 'Information about each token’s position is added in',
			missingConsequence:
				'The positional encoding goes here. Attention looks at every token at once and has no notion of order: without this piece, “the dog bites the man” and “the man bites the dog” would be identical to the model.'
		},
		{
			id: 'atencion',
			label: 'Multi-head attention',
			detail: 'Each token looks at the others and mixes in their information',
			missingConsequence:
				'Multi-head attention goes here. It is the only piece where tokens talk to each other; without it every token would travel through the block in complete isolation.'
		},
		{
			id: 'residual-1',
			label: 'Residual connection + LayerNorm',
			detail: 'The attention’s input is added to its output and normalised',
			missingConsequence:
				'The first residual connection with its normalisation goes here. During training a correction signal travels backwards through the model telling each layer how to adjust; the residual connection gives it a shortcut. Without it, once you stack dozens of blocks that signal dies out before it reaches the first layers.'
		},
		{
			id: 'ffn',
			label: 'Feed-forward network',
			detail: 'Each token goes, separately, through a big hidden layer',
			missingConsequence:
				'The feed-forward network goes here. Attention only mixes and averages information; this layer is what actually transforms it, and it is where most of the model’s parameters live.'
		},
		{
			id: 'residual-2',
			label: 'Residual connection + LayerNorm',
			detail: 'The feed-forward’s input is added to its output and normalised',
			missingConsequence:
				'The second residual connection goes here. Every sublayer of the block —attention and feed-forward— has one of its own; a single one is not enough.'
		},
		{
			id: 'unembed',
			label: 'Projection to the vocabulary',
			detail: 'The final vector becomes one logit per token',
			missingConsequence:
				'The final projection goes here. Without it you are left with a vector of a few hundred numbers, not one score per token in the vocabulary, which is what the softmax needs.'
		}
	];
</script>

<Step title="Eight pieces, one order">
	<Prose lead>
		<p>
			Attention is the star ingredient, but on its own it does not make a model. It is mounted
			inside a fixed structure —the <strong>Transformer block</strong>— and that block is only one
			part of the full journey a text makes from going in to a prediction coming out.
		</p>
	</Prose>

	<Prose>
		<p>
			The interesting thing is that every piece is there solving a specific problem, and removing
			any one of them breaks something different. It is not an arbitrary recipe.
		</p>
	</Prose>

	<Figure wide caption="A sentence travelling through the model, step by step">
		<TransformerFlow flow={DATA.flow} />
	</Figure>

	<Prose>
		<p>
			Before we go on, a word we are going to use non-stop from here. Almost everything one of these
			pieces does is multiply by a matrix of numbers and add another. Each of those individual
			numbers is a <strong>parameter</strong> —you will also see them called <em>weights</em>, it is
			the same thing— and they are exactly what the model learns: they start out as anything at all
			and training adjusts them. When you hear that a model “has 70 billion parameters”, that is
			literally how many numbers you have to store to have it.
		</p>
		<p>
			Two of the pieces deserve special attention. The <strong>feed-forward network</strong>, which
			processes each token separately, is where most of those parameters live: if attention decides
			<em>which</em> information to mix, the feed-forward decides <em>what to do</em> with it.
		</p>
		<p>
			And the <strong>residual connection</strong>, which consists simply of adding a layer's input
			to its output. It looks so trivial that it is hard to believe it matters. It matters
			enormously, and it can be measured.
		</p>
	</Prose>

	<Prose>
		<p>
			When a model is trained, a signal travels backwards down the stack telling each layer how to
			adjust. That signal has to cross every layer above it, and at each one it is damped a little.
			With few layers it makes no difference. With many, nothing arrives.
		</p>
	</Prose>

	<Figure
		wide
		caption="A real stack of layers: the signal is propagated backwards and its magnitude measured"
	>
		<ResidualLab />
	</Figure>

	<Callout kind="key" title="This is why a hundred blocks can be stacked">
		The residual connection gives that signal a <strong>shortcut</strong>: because the output
		contains the input added in, there is always a direct path down to the lower layers. Without
		that shortcut, depth stops being an advantage and becomes a problem. It was one of the ideas
		that made deep learning as we know it possible.
	</Callout>
</Step>

<Step gate="07-transformer:bloque" title="Assemble the block">
	<Challenge
		id="07-transformer:bloque"
		title="Order the eight pieces"
		objective="Put the pieces in the order a sentence travels through, from the input text to the output logits."
		hints={[
			'What goes in first is raw text. Before anything can be multiplied it has to become numbers.',
			'Start from the end: the last thing has to produce one number per token in the vocabulary.',
			'Positional information has to be injected before the tokens start looking at each other.',
			'Every sublayer —attention and feed-forward— is followed by its own residual connection.'
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
			<p>Block correct in <strong>{result.detail?.attempts}</strong> attempt(s).</p>
		{/snippet}
	</Challenge>
</Step>

<Step title="And now, repeat">
	<Prose>
		<p>
			A real model stacks this block many times: twelve in the small ones, eighty or more in the
			large ones. Each repetition works on the output of the one before, and there are signs that
			the layers divide the work up —the early ones handle more syntactic things, the late ones more
			abstract ones.
		</p>
		<p>
			With this you have the complete architecture. But an architecture is not a model: all those
			parameters —the query, key and value matrices, the feed-forward ones, the embeddings— are
			right now full of <strong>random numbers</strong>. A freshly initialised transformer knows
			absolutely nothing.
		</p>
		<p>What is missing is the part that turns noise into knowledge.</p>
	</Prose>

	<Callout kind="key" title="What comes next">
		Training. And we are not going to explain it with metaphors: in the next chapter you are going
		to train a real model, with real backpropagation, in your browser.
	</Callout>
</Step>
