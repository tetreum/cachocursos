<script lang="ts">
	import { ENGLISH as DATA } from '../../data/en';
	import Step from '$ui/Step.svelte';
	import Prose from '$ui/Prose.svelte';
	import Callout from '$ui/Callout.svelte';
	import Challenge from '$ui/Challenge.svelte';
	import Figure from '$ui/Figure.svelte';
	import BigramDuel from './BigramDuel.svelte';
</script>

<Step title="Counting is predicting">
	<Prose lead>
		<p>
			We know the model has to produce a probability for every token. The question is where those
			numbers come from. The simplest possible answer: <strong>by counting them</strong>.
		</p>
	</Prose>

	<Prose>
		<p>
			Take a text. For every word, write down which word came next. When you want to predict, look
			at your table: if “the” was followed by “lamp” 12 times and by “beach” 3 times, then you
			predict “lamp” with probability 12/15 and “beach” with 3/15.
		</p>
		<p>
			That is a <strong>bigram</strong>: a complete language model, built out of nothing but a table
			of counts. If you use two words of context instead of one you have a trigram, and so on. These
			are the n-grams, and they ruled language processing for decades.
		</p>
	</Prose>

	<Figure caption={DATA.corpusNote}>
		<div class="e-corpus">
			<p class="e-corpus__title">{DATA.corpusTitle}</p>
			<pre class="e-corpus__text">{DATA.corpus}</pre>
		</div>
	</Figure>

	<Callout title="This is not a simulation">
		The model in the next challenge is genuinely trained, in your browser, on the text you have just
		read. Every probability you see comes from counting its words.
	</Callout>
</Step>

<Step gate="04-ngramas:duelo" title="Duel against the bigram">
	<Prose>
		<p>
			Eight rounds. In each one you will see a context word and four possible continuations. Pick
			the one you think most likely and compare your intuition with the model's table of counts.
		</p>
	</Prose>

	<Challenge
		id="04-ngramas:duelo"
		title="Predict like a bigram"
		objective="Play the eight rounds and watch where the model breaks."
		hints={[
			'The model only looks one word back. You can cheat and think about the whole sentence; it cannot.',
			'Keep an eye on the “context never seen” warning in the last rounds.'
		]}
	>
		{#snippet children(api)}
			<BigramDuel
				corpus={DATA.corpus}
				seenContexts={DATA.seenContexts}
				unseenContexts={DATA.unseenContexts}
				onsolve={(result) => api.solve(result)}
			/>
		{/snippet}
		{#snippet success(result)}
			<p>
				You agreed with the model <strong>{result.detail?.matches}</strong> times out of
				{result.detail?.rounds}.
			</p>
		{/snippet}
	</Challenge>
</Step>

<Step title="Why counting is not enough">
	<Prose>
		<p>N-grams have two problems, and both are fatal.</p>
		<p>
			<strong>The first is memory.</strong> A bigram only sees one word back. In “the ship that had
			left the harbour the night before <em>ran aground</em>”, getting the verb right takes
			remembering “ship”, nine words earlier. You could use a 10-gram, but the number of possible
			contexts grows like the vocabulary size raised to the tenth power. There is not enough text in
			the world.
		</p>
		<p>
			<strong>The second is sparsity</strong>, and you have already seen it: the moment a context
			turns up that was not in the corpus, the table is empty. The model cannot reason “well,
			‘helicopter’ is a bit like ‘ship’, let us try something similar”, because to it words are
			identifiers with no relation at all. You can paper over the hole with smoothing, but it is
			make-up: there is no knowledge underneath.
		</p>
	</Prose>

	<Prose>
		<p>
			Notice that the embeddings from the previous chapter already solve half the problem: with
			vectors, “helicopter” and “ship” <em>are</em> alike. What is missing is a model that can use
			that — one that instead of consulting a table of counts <strong>learns</strong> a function, and
			that also decides for itself which parts of the context matter in each case.
		</p>
		<p>
			We will get there. But first there is a more immediate question we have been dodging since the
			first chapter, and the duel you just played puts it on show: the model did not give you a
			word. It gave you a <strong>list of probabilities</strong>.
		</p>
	</Prose>

	<Callout kind="key" title="Next stop">
		Somebody has to turn that list into a concrete word, and how it is done changes the character of
		the resulting text completely. That step has rules of its own, and a chapter of its own.
	</Callout>
</Step>

<style lang="scss">
	.e-corpus {
		display: flex;
		flex-direction: column;
		gap: var(--e-space-xs);
		max-height: 22rem;
		padding: var(--e-space-md);
		overflow-y: auto;
		background: var(--e-bg-subtle);
		border: var(--e-border-width) solid var(--e-border);
		border-radius: var(--e-radius-md);

		&__title {
			font-size: var(--e-text-2xs);
			font-weight: var(--e-weight-bold);
			color: var(--e-fg-dim);
			letter-spacing: var(--e-tracking-wide);
			text-transform: uppercase;
		}

		&__text {
			@include mono;

			margin: 0;
			font-size: var(--e-text-xs);
			line-height: var(--e-leading-snug);
			color: var(--e-fg-muted);
			white-space: pre-wrap;
		}
	}
</style>
