<script lang="ts">
	import { ENGLISH as DATA } from '../../data/en';
	import Step from '$ui/Step.svelte';
	import Prose from '$ui/Prose.svelte';
	import Callout from '$ui/Callout.svelte';
	import Challenge from '$ui/Challenge.svelte';
	import SamplingDesk from './SamplingDesk.svelte';
</script>

<Step title="The distribution is not the answer">
	<Prose lead>
		<p>
			The model hands you a score for each of its hundred thousand tokens. But you wanted a word.
			Somebody has to choose, and that choice is not made by the model: it is made by the program
			wrapped around it.
		</p>
	</Prose>

	<Prose>
		<p>
			It is worth being precise about what comes out of a model, because so far we have said
			“probabilities” for simplicity. What the last layer actually produces is one loose number per
			token in the vocabulary: a <strong>logit</strong>. These are raw, unnormalised scores. They
			can be negative, they can be enormous, and they certainly do not add up to one. All they say
			is “this token fits me better than that one”.
		</p>
		<p>
			To turn them into real probabilities you apply the <strong>softmax</strong>: exponentiate each
			logit and divide by the sum of them all. That does two things at once —it makes every value
			positive and forces them to add up to exactly one— and it also exaggerates the differences,
			because the exponential grows very fast. A logit slightly above another ends up with quite a
			lot more probability.
		</p>
		<p>
			This distinction matters for what follows: two of the three dials act on the probabilities
			once computed, but the first acts <em>before</em>, on the raw logits.
		</p>
		<p>
			With the distribution in hand, the obvious option is to always take the most likely token. It
			is called <em>greedy</em> and it has a well known problem: it produces flat text and, above all,
			it gets trapped in loops. If “of” is the most likely continuation of “the”, and “the” is the most
			likely continuation of “of”, the model will write “of the of the of the” until the end of time.
		</p>
		<p>
			The other option is to sample: roll a die loaded with those probabilities. More varied, but
			every so often an absurd token comes up and derails the whole sentence.
		</p>
		<p>Between those two extremes live three dials.</p>
	</Prose>

	<Callout title="The three dials">
		<strong>Temperature</strong> divides each logit before the softmax is applied. Dividing by a
		number smaller than 1 widens the distances between logits and the softmax turns them into a very
		sharp peak: the model becomes conservative. Dividing by a number larger than 1 shrinks them, the
		distribution flattens and everything gets more chaotic.<br />
		<strong>Top-k</strong> works on the probabilities already: it keeps the k most likely tokens and
		throws the rest away.<br />
		<strong>Top-p</strong> does the same but by probability mass: it takes as many tokens as it needs
		to add up to p, be that two or two hundred.
	</Callout>
</Step>

<Step gate="05-muestreo:mesa" title="The mixing desk">
	<Prose>
		<p>
			Below is the bigram from the previous chapter wired up to the three dials. Everything is
			recomputed as you drag: the distribution, the tokens that survive the filters and the
			generated text.
		</p>
		<p>
			Your goal is to get the dot into the green zone: text that is
			<strong>varied but coherent</strong>. Too far left and the model repeats itself; too far down
			and it talks nonsense.
		</p>
	</Prose>

	<Challenge
		id="05-muestreo:mesa"
		title="Find the sweet spot"
		objective="Adjust the three dials until the orange dot falls inside the green rectangle."
		hints={[
			'Start with temperature. At very low values you will see the repetition loop immediately.',
			'Top-p is usually a better dial than top-k: it adapts at each step to how confident the model is.',
			'A combination that often works is temperature near 1 with top-p between 0.85 and 0.95.'
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
				You did it with temperature <strong>{result.detail?.temperature}</strong>, top-k
				{result.detail?.topK} and top-p {result.detail?.topP}.
			</p>
		{/snippet}
	</Challenge>
</Step>

<Step title="A dial that is not in the box">
	<Prose>
		<p>
			These three dials explain a good part of a model's character. A low temperature gives you a
			boring, reliable assistant; a high one gives you an imaginative, unreliable one. There is no
			“correct” setting: there are settings suited to writing poetry and settings suited to
			generating code.
		</p>
		<p>
			And now the important part: <strong>none of this touches the model</strong>. The logits were
			already there; all we did was decide how to read them. Hold on to that idea, because in the
			last chapter we are going to do something far bolder with them: add a secret bias to sign the
			text without anyone noticing.
		</p>
		<p>
			First we have to answer the question we have been putting off since chapter 4: where do those
			logits come from, if counting does not work?
		</p>
	</Prose>
</Step>
