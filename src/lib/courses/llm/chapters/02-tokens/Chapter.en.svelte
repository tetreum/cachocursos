<script lang="ts">
	import { ENGLISH as DATA } from '../../data/en';
	import Step from '$ui/Step.svelte';
	import Prose from '$ui/Prose.svelte';
	import Callout from '$ui/Callout.svelte';
	import Challenge from '$ui/Challenge.svelte';
	import Figure from '$ui/Figure.svelte';
	import BpeGame from './BpeGame.svelte';
	import TokenizerDemo from './TokenizerDemo.svelte';

	const TARGET_MERGES = 10;
	const TARGET_RATIO = 1.5;
	const DEMO_MERGES = 12;
</script>

<Step title="The model never sees words">
	<Prose lead>
		<p>
			A language model does not read. It multiplies numbers. Before it can do anything at all with a
			sentence, somebody has to turn that text into a list of integers.
		</p>
	</Prose>

	<Prose>
		<p>
			The obvious idea would be to give every word a number. And it works, until reality shows up:
			English has hundreds of thousands of distinct forms. <code>walk</code>, <code>walks</code>,
			<code>walked</code>, <code>walking</code>… each one would need its own number, and the model
			would have no way of knowing they are related.
		</p>
		<p>
			Worse still: the moment a word turns up that was not on the list —a proper name, a technical
			term, a typo— the model has no number to give it. That is what being
			<em>out of vocabulary</em> means, and it is a dead end.
		</p>
		<p>
			The opposite idea, a number per letter, fixes that but creates another problem: the sequences
			get enormously long and the model has to learn from scratch that
			<code>h</code>, <code>o</code>, <code>u</code>, <code>s</code>, <code>e</code> mean something together.
		</p>
	</Prose>

	<Callout kind="key" title="The solution">
		Chop the text into in-between units: bigger than a letter, smaller than a word. Frequent pieces
		stay whole, rare ones get split. We call those pieces <strong>tokens</strong>.
	</Callout>
</Step>

<Step gate="02-tokens:fusiones" title="Build yourself a vocabulary">
	<Prose>
		<p>
			And who decides what those pieces are? Nobody: they are learned from the text. The algorithm
			is called <strong>Byte-Pair Encoding</strong> and it is astonishingly simple.
		</p>
		<p>
			You start with the text split into single letters, plus a special mark —we write it
			<code>·</code>— that says where each word ends. That mark matters: without it the model could
			not tell <code>ion</code> at the end of a word from <code>ion</code> inside
			<code>ionised</code>.
		</p>
		<p>
			Then you count which pair of adjacent symbols appears most often, merge them into a new
			symbol, and repeat. That is all there is to it.
		</p>
		<p>
			Every merge shortens the corpus, so <em>compression</em> —how many tokens you save— measures directly
			how good your decisions were. Your turn.
		</p>
	</Prose>

	<Challenge
		id="02-tokens:fusiones"
		title="Compress the corpus"
		objective="Reach a compression of {TARGET_RATIO.toFixed(
			2
		)}x or better in {TARGET_MERGES} merges."
		hints={[
			'The winning strategy is always the same: pick the pair with the highest number.',
			'Symbols you merge can be merged again. That is how long pieces get built out of short ones.',
			'Watch the endings: in English, -tion and -ing show up everywhere.'
		]}
	>
		{#snippet children(api)}
			<BpeGame
				corpus={DATA.corpusBpe}
				targetMerges={TARGET_MERGES}
				targetRatio={TARGET_RATIO}
				onsolve={(result) => api.solve(result)}
				onprogress={(result) => api.report(result)}
			/>
		{/snippet}
		{#snippet success(result)}
			<p>
				Compression <strong>{result.detail?.ratio}x</strong> in {result.detail?.merges} merges. You have
				just trained a tokeniser.
			</p>
		{/snippet}
	</Challenge>

	<Callout title="What just happened">
		Nobody told the algorithm what a suffix is. It still discovered <code>-tion</code> and
		<code>-ing</code> on its own, because they are the pieces that repeat most. A real tokeniser does
		exactly this over billions of words, until it reaches a vocabulary of some 100,000 tokens.
	</Callout>
</Step>

<Step title="The hidden bill">
	<Prose>
		<p>
			This way of chopping has consequences we will carry to the last chapter of the course. Try it
			yourself with the vocabulary we have just learned:
		</p>
	</Prose>

	<Figure caption="The same text, as the model sees it">
		<TokenizerDemo demo={DATA.tokenizer} corpus={DATA.corpusBpe} merges={DEMO_MERGES} />
	</Figure>

	<Prose>
		<p>
			Look at what happens with repeated letters. When you ask a model how many r’s there are in
			<code>strawberry</code>, it often gets it wrong. It is not that it is stupid: it
			<strong>literally cannot see the letters</strong>. It sees a handful of tokens, and some of
			them carry several r’s inside with no mark to tell them apart.
		</p>
		<p>
			It is also why models are worse in languages barely represented in their training corpus: if
			the tokeniser never saw that language, it splits it into tiny pieces, and everything costs
			more tokens, more money and more context.
		</p>
	</Prose>

	<Callout kind="key" title="Remember this">
		From here on, when we say “token”, we mean an integer: the position of that piece in the
		vocabulary. A text is a list of integers. And right now those integers mean nothing — token
		4,812 is no “closer” to 4,813 than to 90,001. Fixing that is the next chapter. The r’s can be
		fixed too, but you need a few more things first: we will come back to it in chapter 13.
	</Callout>
</Step>
