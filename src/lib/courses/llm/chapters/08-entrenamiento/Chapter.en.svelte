<script lang="ts">
	import { ENGLISH as DATA } from '../../data/en';
	import Step from '$ui/Step.svelte';
	import Prose from '$ui/Prose.svelte';
	import Callout from '$ui/Callout.svelte';
	import Challenge from '$ui/Challenge.svelte';
	import TrainingLab from './TrainingLab.svelte';

	const TARGET_LOSS = 3;
	const STEP_BUDGET = 600;
</script>

<Step title="Learning is getting it wrong methodically">
	<Prose lead>
		<p>
			A freshly created model has its weights full of random numbers. Training it means repeating a
			four-step cycle, millions of times.
		</p>
	</Prose>

	<Prose>
		<p>
			<strong>One:</strong> you show it a chunk of text and ask it to predict the next token.
			<strong>Two:</strong> you compare its distribution with the real answer and compute the
			<em>loss</em>, a number measuring how wrong it was. <strong>Three:</strong> for every one of
			the billions of weights, you compute which direction it would have to move for the loss to
			drop a little; that is backpropagation. <strong>Four:</strong> you move every weight one small step
			in that direction.
		</p>
		<p>
			The size of that step is called the <strong>learning rate</strong>, and it is probably the
			most delicate setting in all of machine learning. Too small and the model takes forever. Too
			large and the weights go flying: the loss explodes and the model ends up worse than when it
			started.
		</p>
	</Prose>

	<Callout title="The loss, specifically">
		We use <em>cross-entropy</em>: the negative logarithm of the probability the model gave the
		correct token. If it gave it 100%, the loss is 0. If it gave it a minuscule probability, the
		loss shoots up. A model answering completely at random over a vocabulary of N tokens has a loss
		of ln(N).
	</Callout>
</Step>

<Step gate="08-entrenamiento:loss" title="Train a real model">
	<Prose>
		<p>
			Below is a small neural network —embedding, hidden layer with tanh, and projection to the
			vocabulary— wired to the same lighthouse keeper text. It is not an animation: it genuinely
			trains, with backpropagation written by hand, in your browser.
		</p>
		<p>
			You have {STEP_BUDGET} steps and a single dial. Find a learning rate that brings the loss down to
			{TARGET_LOSS} within the budget.
		</p>
	</Prose>

	<Challenge
		id="08-entrenamiento:loss"
		title="Bring the loss down"
		objective="Reach a loss of {TARGET_LOSS} or less in fewer than {STEP_BUDGET} steps."
		hints={[
			'Try very small and very large values first to see both failures: the one that crawls and the one that explodes.',
			'The sweet spot for this model is between 1 and 5. That is not a general rule: it depends on the model.',
			'Watch the generated text, not just the curve. The loss is a number; the text is what you actually want.'
		]}
	>
		{#snippet children(api)}
			<TrainingLab
				corpus={DATA.corpus}
				targetLoss={TARGET_LOSS}
				stepBudget={STEP_BUDGET}
				onsolve={(result) => api.solve(result)}
			/>
		{/snippet}
		{#snippet success(result)}
			<p>
				Loss <strong>{result.detail?.loss}</strong> in {result.detail?.steps} steps with learning rate
				{result.detail?.learningRate}.
			</p>
		{/snippet}
	</Challenge>
</Step>

<Step title="From this toy to a real model">
	<Prose>
		<p>
			What you have just trained has a few thousand parameters and has seen about six hundred and
			fifty words. A large model has hundreds of billions of parameters and has seen trillions of
			tokens. The loop is identical. What changes is the scale, and the strange things that happen
			when you scale.
		</p>
		<p>
			You will also have noticed something uncomfortable: however far the loss comes down, the text
			that comes out still is not good. That is because the model has learned <em>that</em> text, not
			English. With a model this small and a corpus this small, overfitting is inevitable.
		</p>
		<p>
			Which raises the question of the next chapter, and it is the billion-pound question: given a
			fixed compute budget, do you spend it on a bigger model or on more data?
		</p>
	</Prose>
</Step>
