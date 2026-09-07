<script lang="ts">
	import { ENGLISH as DATA } from '../../data/en';
	import Step from '$ui/Step.svelte';
	import Prose from '$ui/Prose.svelte';
	import Callout from '$ui/Callout.svelte';
	import Challenge from '$ui/Challenge.svelte';
	import Figure from '$ui/Figure.svelte';
	import DigitTokens from './DigitTokens.svelte';
	import StrategyWorkshop from './StrategyWorkshop.svelte';
	import CompoundingLab from './CompoundingLab.svelte';
</script>

<Step title="A transformer cannot go round in circles">
	<Prose lead>
		<p>
			In chapter 2 we saw that the model cannot count the r’s in <code>strawberry</code>. It is time
			to close that off, because the same problem explains why it fails at arithmetic — and because
			the fix is the same in both cases.
		</p>
	</Prose>

	<Prose>
		<p>There are <strong>two stacked causes</strong>, and it is worth separating them.</p>
		<p>
			<strong>You already know the first:</strong> the unit the model works with does not match the unit
			of the task. Letters hide inside tokens… and so do digits.
		</p>
	</Prose>

	<Figure wide caption="The same tokeniser from chapter 2, now with numbers">
		<DigitTokens
			placeValues={DATA.placeValues}
			corpus={DATA.corpusNumbers}
			merges={DATA.numberMerges}
		/>
	</Figure>

	<Prose>
		<p>
			Look at what happens there, because it is worse than it seems: the way numbers get split
			<strong>is not consistent</strong>. <code>1200</code> appeared often in the corpus and stayed
			as a single opaque token; <code>347</code> appeared rarely and ended up split into digits. The model
			cannot lean on any place-value structure, because sometimes it has one and sometimes it does not,
			depending on how frequently each number happened to appear on the internet.
		</p>
		<p>
			From that comes the obvious fix, and it is the one almost every modern tokeniser uses today:
			<strong>split numbers into digits</strong> —or into fixed groups— always, no exceptions. It is exactly
			the same intervention as spelling a word out, only done in training instead of in the prompt.
		</p>
	</Prose>

	<Callout kind="key" title="The second cause, the real one">
		A transformer does a <strong>fixed</strong> amount of work per token: the input crosses N
		layers, always N, whatever the question is. But adding two eight-digit numbers needs eight
		carries, and each one depends on the one before. Counting letters needs one step per letter.
		These are algorithms whose <em>length depends on the input</em>, and a fixed stack of layers
		cannot express “repeat until done”. There is no loop. There is none in the architecture you
		assembled in chapter 7.
	</Callout>

	<Prose>
		<p>
			And here is the trick that solves it, which is the same for letters and for sums:
			<strong>the model writes the steps out and reads them back</strong>. Every token it emits gets
			a complete pass through the N layers. By writing <code>s-t-r-a-w-…</code> or
			<code>7+5=12, carry 1…</code>, the model turns depth it does not have into length it does. The
			context window becomes its working memory.
		</p>
		<p>
			That is the <em>chain of thought</em> from the previous chapter, seen from the inside. It is not
			that the model “reasons out loud” for your benefit: it is that it has nowhere else to put the intermediate
			results.
		</p>
	</Prose>
</Step>

<Step gate="13-limites:estrategias" title="Pick the smallest tool">
	<Prose>
		<p>
			Four strategies, ordered from cheapest to most expensive: answer directly, split into letters
			or digits, write the steps out, or call a tool that genuinely runs code.
		</p>
		<p>
			Six tasks. For each one, pick the <strong>cheapest that works reliably</strong>. The orange
			dots show the cost. You do not always need the artillery, and cheap is not always enough.
		</p>
	</Prose>

	<Challenge
		id="13-limites:estrategias"
		title="The cheapest strategy that works"
		objective="Get the minimum strategy right on at least 5 of the 6 tasks."
		hints={[
			'Ask two things per task: do I need to see individual letters or digits? and how many steps depend on the one before?',
			'Splitting into units fixes access, but adds no computing capacity: if many steps are chained, it is not enough.',
			'Writing the steps out does add capacity, but each step multiplies the chance of failure. With many steps, the tool wins.'
		]}
	>
		{#snippet children(api)}
			<StrategyWorkshop
				tasks={DATA.tasks}
				strategyLabels={DATA.strategyLabels}
				onsolve={(result) => api.solve(result)}
			/>
		{/snippet}
		{#snippet success(result)}
			<p>
				<strong>{result.detail?.hits}</strong> of {result.detail?.tasks}. You have the criterion
				now.
			</p>
		{/snippet}
	</Challenge>
</Step>

<Step title="Why the chain has a ceiling">
	<Prose>
		<p>
			What is left is to understand why, past a certain point, writing the steps out stops helping.
			The reason is purely arithmetic: if each step comes out right with probability <em>p</em>, the
			whole chain comes out right with probability <em>p</em> raised to the number of steps. Multiplying
			numbers smaller than one leads to exactly one place.
		</p>
	</Prose>

	<Figure wide caption="Reliability of a chain by its length">
		<CompoundingLab />
	</Figure>

	<Prose>
		<p>
			At 97% per step —already optimistic for intermediate operations— the chain holds for about
			three steps before dropping below 90%. And here is the asymmetry between our two problems:
			counting letters needs <strong>one</strong> step once you can see the letters, so it is fixed outright.
			Multiplying two three-digit numbers needs nine, and there the ceiling is real.
		</p>
		<p>
			This is why the honest answer in production, for the letters and for the sums, ends up being
			the same: <strong>call a tool</strong>. The model writes
			<code>word.count('l')</code> or <code>463*287</code> and another program runs it. That is not giving
			up: it is recognising that a fixed-depth network should not be emulating a CPU.
		</p>
	</Prose>

	<Callout title="And the radical route">
		There is a third line of work: take the tokeniser out of the picture. Models like ByT5 or the
		Byte Latent Transformer work directly on bytes, so letters and digits never hide. The price is
		that sequences get far longer —and you know from chapter 9 that attention costs the square of
		the length— so for now it is research, not everyday practice.
	</Callout>
</Step>
