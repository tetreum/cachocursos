<script lang="ts">
	import { ENGLISH as DATA } from '../../data/en';
	import Step from '$ui/Step.svelte';
	import Prose from '$ui/Prose.svelte';
	import Callout from '$ui/Callout.svelte';
	import Challenge from '$ui/Challenge.svelte';
	import EmbeddingMap from './EmbeddingMap.svelte';

	const REQUIRED_HITS = 4;
</script>

<Step title="The problem with token 4,812">
	<Prose lead>
		<p>
			By the end of the last chapter the text was already a list of integers. The problem is that
			those integers mean nothing.
		</p>
	</Prose>

	<Prose>
		<p>
			If “cat” is token 4,812 and “dog” is 9,001, the model has no way of knowing they are alike. To
			it, 4,812 is as far from 9,001 as it is from 4,813, which might be “umbrella”. The numbers are
			labels, not measurements.
		</p>
		<p>
			The fix is to stop representing each token with one number and represent it with a
			<strong>list of numbers</strong> instead: a vector of several hundred dimensions. And the
			important part is that those numbers <em>are not chosen by hand</em>: they are learned during
			training, pushed by a single pressure —that words appearing in similar contexts end up with
			similar vectors.
		</p>
		<p>
			The result is that meaning turns into <strong>geometry</strong>. And with geometry you can do
			arithmetic.
		</p>
	</Prose>

	<Callout kind="warn" title="An honest warning">
		The embeddings in this chapter are <strong>simplified on purpose</strong>. Instead of hundreds
		of opaque dimensions, we have built 19 named axes —gender, power, size, tense, comparative
		degree, geographic identity…— so you can see <em>why</em> the arithmetic works. A real model learns
		its own axes, nobody dictates them, and almost none of them has a human name. But the geometry behaves
		the same way.
	</Callout>
</Step>

<Step gate="03-embeddings:mapa" title="Arithmetic with words">
	<Prose>
		<p>
			Below are the {`${''}`}words of the vocabulary projected onto a plane. Each dot is a word and
			the colour marks its family. The projection squashes 19 dimensions into 2, so information is
			lost, but the neighbourhoods still show.
		</p>
		<p>
			In the analogy rounds we draw an arrow between two words. That arrow <em>is</em> a concept: the
			direction from “man” to “king” is literally power. Apply it to another word and see where you land.
		</p>
	</Prose>

	<Challenge
		id="03-embeddings:mapa"
		title="Navigate the semantic space"
		objective="Six rounds of analogies and odd ones out. You need {REQUIRED_HITS} right."
		hints={[
			'In an analogy, the blue arrow tells you which transformation to apply. Look for it leaving the third word.',
			'For the odd one out, think about which axis three of the four words share.',
			'The right answer is genuinely computed with cosine similarity, not written by hand.'
		]}
	>
		{#snippet children(api)}
			<EmbeddingMap
				axes={DATA.axes}
				words={DATA.words}
				analogies={DATA.analogies}
				oddOneOuts={DATA.oddOneOuts}
				requiredHits={REQUIRED_HITS}
				onsolve={(result) => api.solve(result)}
			/>
		{/snippet}
		{#snippet success(result)}
			<p>
				<strong>{result.detail?.hits}</strong> of {result.detail?.rounds}. You have just done
				algebra with meanings.
			</p>
		{/snippet}
	</Challenge>
</Step>

<Step title="What embeddings still do not solve">
	<Prose>
		<p>
			Embeddings solve the problem we opened the chapter with: words stop being labels with no
			relation to each other. A new word can now resemble a known one, and that opens the door to
			<strong>generalising</strong> instead of memorising.
		</p>
		<p>
			But a huge hole is left. The vector for “bank” is <strong>always the same</strong>, whether it
			is in “I sat on the river bank” or “I went to the bank to take out money”. A static embedding
			knows nothing about context: it gives each word a single identity for life.
		</p>
		<p>
			And above all: having good vectors is not yet predicting. We know how to represent words, but
			we still have no method for saying what comes after what. Before building anything
			sophisticated it is worth trying the simplest idea there is, the one that ruled the field for
			decades, to see exactly where it breaks.
		</p>
	</Prose>

	<Callout kind="key" title="Next stop">
		Predicting by <strong>counting</strong>. If you want to know which word follows another, look it
		up in a text and write it down. It works surprisingly well… until it stops working.
	</Callout>
</Step>
