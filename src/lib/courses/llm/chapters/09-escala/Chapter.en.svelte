<script lang="ts">
	import Step from '$ui/Step.svelte';
	import Prose from '$ui/Prose.svelte';
	import Callout from '$ui/Callout.svelte';
	import Challenge from '$ui/Challenge.svelte';
	import BudgetLab from './BudgetLab.svelte';

	const BUDGET = 1e22;
	const TOLERANCE = 0.005;
</script>

<Step title="What happens when you make it big">
	<Prose lead>
		<p>
			Somewhere between 2020 and 2022 something uncomfortable became clear to researchers: a good
			part of the progress was coming not from new ideas, but from doing the same thing much bigger.
		</p>
	</Prose>

	<Prose>
		<p>
			And the strange part is that it happens predictably. A model's loss follows a
			<strong>scaling law</strong>: a simple formula relating it to the number of parameters and the
			amount of data. It falls smoothly, without surprises, across many orders of magnitude. You can
			predict a model's performance before training it.
		</p>
		<p>
			What is <em>not</em> smooth is the capabilities. Abilities like adding several digits or
			following complex instructions appear all at once past a certain size, even though the loss
			curve does nothing special at that point. That was called <strong>emergence</strong>, and it
			is still argued about: part of the effect comes from how we measure.
		</p>
	</Prose>

	<Callout title="A reminder">
		A <strong>parameter</strong> is each of the numbers the model learns: the attention matrices,
		the feed-forward ones, the embeddings. The little model you trained in the previous chapter had
		<strong>6,787</strong>. The models the press talks about have between a billion and several
		trillion. And <strong>D</strong>, the training tokens, is how much text it reads: not how many
		distinct words it knows, but how many tokens go past it in total.
	</Callout>

	<Callout title="The formula">
		The Chinchilla law says the loss is roughly
		<code>1.69 + 406/N^0.34 + 411/D^0.28</code>, where N is the parameters and D the training
		tokens. The first term is the <em>irreducible loss</em>: the intrinsic noise of language, which
		no amount of growth removes. And training costs approximately <code>6·N·D</code> operations.
	</Callout>
</Step>

<Step gate="09-escala:presupuesto" title="Split the budget">
	<Prose>
		<p>
			Here is the real dilemma facing anyone training models. You have a fixed compute budget
			—money, GPUs, time— and since the cost is <code>6·N·D</code>, every parameter you add takes
			away data to read.
		</p>
		<p>
			A giant model trained on little text wastes capacity. A tiny model trained on masses of text
			saturates and stops learning. In between there is an optimum, and for years the industry got
			it wrong: GPT-3 was too big for the data it saw.
		</p>
	</Prose>

	<Challenge
		id="09-escala:presupuesto"
		title="Find the optimal split"
		objective="Adjust the model size to minimise the predicted loss for the given budget."
		hints={[
			'Push the dial to both extremes first: you will see the two ways of wasting the budget.',
			'The curve on the chart has a minimum. Look for the bottom of the valley.',
			'Watch the “tokens per parameter” readout: the optimum is in the low tens.'
		]}
	>
		{#snippet children(api)}
			<BudgetLab budget={BUDGET} tolerance={TOLERANCE} onsolve={(result) => api.solve(result)} />
		{/snippet}
		{#snippet success(result)}
			<p>
				<strong>{result.detail?.parameters}</strong> of parameters with
				{result.detail?.tokens} tokens: {result.detail?.tokensPerParameter} tokens per parameter.
			</p>
		{/snippet}
	</Challenge>
</Step>

<Step title="The other limit: the window">
	<Prose>
		<p>
			There is a second limit that has nothing to do with training and that you will notice daily:
			the <strong>context window</strong>. A model can only look at a finite number of tokens at
			once.
		</p>
		<p>
			The attention from chapter 6 is to blame. If every token has to be compared with every other,
			the cost grows with the <em>square</em> of the length. Doubling the context quadruples the work.
			There are many techniques to soften this, but the underlying problem is still there.
		</p>
		<p>
			And when something falls out of the window, it is not that the model remembers it less well:
			it <strong>stops existing</strong>. There is no warning. The model will answer with its usual
			confidence about a document it can no longer see in full.
		</p>
	</Prose>

	<Callout kind="key" title="And even so, it is not an assistant">
		With all this you have an enormous, well trained model that predicts the next token
		magnificently. If you write “what is the capital of France?”, it might answer you… or it might
		carry on with “And Italy's? And Portugal's?”, because on the internet questions tend to come in
		lists. Turning that into something that <em>obeys</em> is a whole other problem.
	</Callout>
</Step>
