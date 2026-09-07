<script lang="ts">
	import { ENGLISH as DATA } from '../../data/en';
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

<Step title="Signing the randomness">
	<Prose lead>
		<p>
			We want a generated text to carry an invisible mark: something that does not change how it
			reads, but that lets you prove afterwards that it came out of a machine.
		</p>
	</Prose>

	<Prose>
		<p>
			The idea that works exploits exactly the place we passed through in chapter 5: the gap between
			the logits and the chosen token. There is freedom there, because there are almost always
			several acceptable continuations, and picking one or another does not spoil the text.
		</p>
		<p>
			The scheme, proposed by Kirchenbauer and colleagues in 2023, has three pieces. Two Greek
			letters appear, and they are simply two dials: <strong>γ</strong> (gamma) decides what
			<em>proportion</em> of the vocabulary goes on the green list, and <strong>δ</strong> (delta)
			decides <em>how much</em> that list is favoured. Nothing more. Walk through it step by step:
		</p>
	</Prose>

	<Figure wide caption="The three steps, computed over a vocabulary of ten tokens">
		<SchemeExplainer example={DATA.schemeExample} />
	</Figure>

	<Callout kind="key" title="And this is how it is detected">
		Anyone with the key can walk through the text, recompute the green list at each position and
		count how many tokens landed on green. Without a mark, they should be a fraction γ. With a mark,
		there are quite a few more. The statistic measuring that difference is
		<code>z = (green − γT) / √(T·γ·(1−γ))</code>, and a value above 4 is practically impossible by
		chance.
	</Callout>
</Step>

<Step gate="14-watermark:generador" title="Act I · The generator">
	<Prose>
		<p>
			Here is the bigram from chapter 4, generating with a watermark. Green tokens are highlighted
			in green; red ones in red. Start with δ = 0 and raise it slowly.
		</p>
		<p>Watch both figures at once: the z goes up, but the quality of the text goes down.</p>
	</Prose>

	<Challenge
		id="14-watermark:generador"
		title="Sign the text"
		objective="Raise the bias δ until the z score passes {TARGET_Z}."
		hints={[
			'At δ = 0 the proportion of greens is exactly γ and the z hovers near zero: that is unsigned text.',
			'Watch what happens to quality once δ goes past 4. The text starts choosing odd words just for being green.',
			'With a small γ the mark is easier to detect, but also easier to destroy.'
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
				z = <strong>{result.detail?.z}</strong> with δ = {result.detail?.delta} and γ =
				{result.detail?.gamma}.
			</p>
		{/snippet}
	</Challenge>

	<Callout kind="warn" title="The central trade-off">
		Small δ: text intact, mark fragile. Large δ: mark solid, text impoverished. There is no setting
		that gives you both, and that tension is the underlying problem of all watermarking.
	</Callout>
</Step>

<Step gate="14-watermark:detector" title="Act II · The detector">
	<Prose>
		<p>
			Before playing it is worth clearing up the obvious question: <strong
				>how do you detect the mark without knowing what the model would have said?</strong
			>
			It looks as though you would have to run the model over the text, word by word, to reconstruct which
			green lists there were. And no: <strong>the model is not needed at all</strong>.
		</p>
		<p>
			Go back to step 1 of the scheme. The green list came out of
			<code>hash(previous token, key)</code>
			— and out of that alone. It did not depend on the logits, or the probabilities, or anything the
			model computed. So the detector, with the text in front of it, can walk through it looking at each
			pair of consecutive tokens, redo the hash and check whether the token that came out was green. These
			are hashes, not neural networks: it runs on a laptop, with no GPU.
		</p>
	</Prose>

	<Figure wide caption="What each side needs">
		<DetectorNeeds />
	</Figure>

	<Callout kind="warn" title="The uncomfortable consequence">
		If the key is the only thing that opens the door, then <strong
			>only whoever holds the key can detect</strong
		>. A company cannot tell whether a text carries somebody else's mark: it would try its own key,
		get a different green/red split and read a z of zero. A detector does not answer “did an AI
		write this?”, but <strong>“does this carry my mark?”</strong>, which is a far smaller question.
		And it explains why tools claiming to “detect AI” without holding any key are doing something
		else entirely —measuring style— and get it wrong so often.
	</Callout>

	<Prose>
		<p>
			Now you change sides. Six passages arrive and you have to decide which ones carry the mark.
			You can compute the z of all of them because you have the key, but the z does not give you an
			answer: it gives you a number. The decision —where to put the threshold— is yours.
		</p>
		<p>
			And it is not an innocent decision. A low threshold catches more generated texts, but sooner
			or later it points at a human one. In a classroom, that means accusing a student of cheating.
		</p>
	</Prose>

	<Challenge
		id="14-watermark:detector"
		title="Classify the six passages"
		objective="Get at least {REQUIRED_CORRECT} of 6 right, and pay attention to the false positives."
		hints={[
			'A threshold of 4 is the standard: it lets some weak marks through, but it almost never accuses an innocent.',
			'One passage is marked with a very low δ. That is the hard case, and it is the one that forces you to choose.',
			'Another passage was marked and then edited: the mark weakens a great deal under editing.',
			'And there is a machine-generated passage that never had the mark switched on. That one is undetectable, and it is not a failure of the detector.'
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
				<strong>{result.detail?.hits}</strong> of {result.detail?.total} at threshold
				{result.detail?.threshold} with {result.detail?.falsePositives} false positives.
			</p>
		{/snippet}
	</Challenge>
</Step>

<Step gate="14-watermark:atacante" title="Act III · The attacker">
	<Prose>
		<p>
			One last change of sides. You have a marked text and you want to publish it without anyone
			noticing. You cannot rewrite it entirely —then it would not be the same text— so you have a
			limited budget of changes.
		</p>
		<p>
			You can only do one thing: swap words for <strong>synonyms</strong>. The text will still mean
			exactly the same thing —that is the point of the attack— but the tokens will be different, and
			with them the green/red split changes.
		</p>
		<p>
			There is a detail that makes it more interesting than it looks: because each position's green
			list depends on the <strong>previous token</strong>, changing one word does not only change
			its own colour, it also reshuffles the list for the next one. Every change has a double
			effect.
		</p>
	</Prose>

	<Challenge
		id="14-watermark:atacante"
		title="Break the mark"
		objective="Bring the z below 4 by swapping at most 12 words for synonyms."
		hints={[
			'Focus on the green words: they are the ones adding to the z. Swapping a red one for another red one barely helps.',
			'Look for runs of consecutive greens. Change the first and the next one gets a different list, often turning red by itself.',
			'Every substitute is a genuine synonym: the text does not lose its meaning however much you change.'
		]}
	>
		{#snippet children(api)}
			<Attacker passage={DATA.attackPassage} onsolve={(result) => api.solve(result)} />
		{/snippet}
		{#snippet success(result)}
			<p>
				z = <strong>{result.detail?.z}</strong> (it started at {result.detail?.initialZ}) by
				swapping just {result.detail?.edits} words for synonyms.
			</p>
		{/snippet}
	</Challenge>
</Step>

<Step title="What this means">
	<Prose>
		<p>
			You have seen the scheme from all three sides, so you can judge it yourself. Text watermarking
			works: it is an elegant idea, cheap to apply and statistically sound. But it has limits that
			are not an implementation defect, they are structural.
		</p>
		<p>
			<strong>It only works if whoever generates cooperates.</strong> An open-weights model you run on
			your own computer is not going to mark anything for you.
		</p>
		<p>
			<strong>It is fragile under rewriting.</strong> You have just broken it by hand in a handful of
			edits. Running the text through another model to paraphrase it destroys it almost completely.
		</p>
		<p>
			<strong>It needs long texts.</strong> The z grows with the square root of the number of tokens;
			in a short paragraph there is not enough signal to claim anything.
		</p>
		<p>
			<strong>And false positives are asymmetric.</strong> Missing a generated text is an annoyance. Accusing
			a person of not having written what they wrote is real harm. That is why thresholds are conservative,
			and why it is worth distrusting any tool claiming to detect AI with no access to any key: those
			do not measure marks, they measure style, and they get it wrong a lot.
		</p>
	</Prose>

	<Callout kind="key" title="End of the course">
		You have walked the whole road: from chopping text into tokens to signing it cryptographically,
		by way of embeddings, attention, transformers, training, scale and alignment. And at every step
		the computation genuinely ran in your browser. None of these concepts is magic; they are
		engineering parts you now know from the inside.
	</Callout>
</Step>
