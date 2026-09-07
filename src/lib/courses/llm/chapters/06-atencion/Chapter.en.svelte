<script lang="ts">
	import { ENGLISH as DATA } from '../../data/en';
	import Step from '$ui/Step.svelte';
	import Prose from '$ui/Prose.svelte';
	import Callout from '$ui/Callout.svelte';
	import Challenge from '$ui/Challenge.svelte';
	import AttentionGame from './AttentionGame.svelte';

	const PASSING_SCORE = 0.7;
</script>

<Step title="Look back, but not at everything">
	<Prose lead>
		<p>“The trophy did not fit in the suitcase because it was too big.” What was too big?</p>
	</Prose>

	<Prose>
		<p>
			You solved it without thinking: the trophy. And to do it you looked back through the sentence,
			but not at every word equally. “Because” did nothing for you. “Trophy” and “suitcase” were
			decisive. You shared your attention out unevenly, and that sharing out is what resolves the
			ambiguity.
		</p>
		<p>
			That is, almost literally, the <strong>attention</strong> mechanism. For every word it is processing,
			the model computes how much it should look at each of the others, and then builds a new representation
			of that word by mixing the others according to those weights.
		</p>
		<p>
			This is how “bank” stops having a fixed vector: if the sentence contains “money”, the vector
			for “bank” absorbs some of “money”; if it contains “river”, it absorbs something else. Meaning
			stops living in the word and moves into the word <em>plus its context</em>.
		</p>
	</Prose>

	<Callout title="Query, Key, Value">
		The computation has three pieces. Each token emits a <strong>query</strong>: “this is what I am
		looking for”. Each token offers a <strong>key</strong>: “this is what I am”. Every query is
		compared with every key through a dot product, the result goes through a softmax —yes, the same
		one from chapter 5— and out come the weights. Those weights average the
		<strong>values</strong>, which is the information each token contributes.
	</Callout>
</Step>

<Step gate="06-atencion:reparto" title="Share the attention out yourself">
	<Prose>
		<p>
			Three ambiguous sentences. In each one a word is marked as the <em>query</em>: that is the one
			to resolve. Share 100 points among the others according to how much you think they should be
			looked at.
		</p>
		<p>
			The system will resolve the reference using <strong>your</strong> allocation, and then show you
			a trained model's so you can compare.
		</p>
	</Prose>

	<Challenge
		id="06-atencion:reparto"
		title="Resolve the ambiguity"
		objective="Your allocation has to match the model's by at least {Math.round(
			PASSING_SCORE * 100
		)}% on average."
		hints={[
			'Do not split it evenly: useful attention is concentrated, not democratic.',
			'Besides the right candidate there is usually one word that does the disambiguating (an adjective, a verb). Give it its share.',
			'Function words —articles, prepositions— almost never deserve attention in these cases.'
		]}
	>
		{#snippet children(api)}
			<AttentionGame
				puzzles={DATA.attentionPuzzles}
				passingScore={PASSING_SCORE}
				onsolve={(result) => api.solve(result)}
			/>
		{/snippet}
		{#snippet success(result)}
			<p>
				Your allocation matched the model's by <strong>{result.detail?.similarity}</strong>.
			</p>
		{/snippet}
	</Challenge>

	<Callout kind="key" title="Why this changed everything">
		An n-gram looks at a fixed window backwards. Attention looks at <strong>the whole</strong>
		sequence and decides, for every word and in every layer, what is relevant. It is also computed for
		every position <em>in parallel</em>, which made it possible to train on amounts of text that
		were previously unthinkable. That is the title of the 2017 paper that introduced it: “Attention
		Is All You Need”.
	</Callout>
</Step>

<Step title="One head is not enough">
	<Prose>
		<p>
			You have just made one allocation, a single one. But many things happen at once in a sentence:
			there is agreement, there are syntactic dependencies, there are long-range references, there
			are semantic relations.
		</p>
		<p>
			That is why <strong>transformers</strong> —the name of the architecture built around this
			mechanism, which we will see whole in the next chapter— do not compute one attention but
			several in parallel. Each one is called a <strong>head</strong>, and each ends up specialising
			on its own during training: there are heads that track agreement, others that link verbs to
			their subjects, others that attend to the immediately preceding word and little else.
		</p>
		<p>
			Nobody programs them to do that. It emerges. And several heads, plus a few pieces of plumbing
			we will see next, make up the block that repeats dozens of times inside a model.
		</p>
	</Prose>
</Step>
