<script lang="ts">
	import Step from '$ui/Step.svelte';
	import Prose from '$ui/Prose.svelte';
	import Callout from '$ui/Callout.svelte';
	import Challenge from '$ui/Challenge.svelte';
	import ProbabilityBars from '$ui/ProbabilityBars.svelte';
	import Figure from '$ui/Figure.svelte';
	import GuessGame, { type GuessRound } from './GuessGame.svelte';

	const ROUNDS: readonly GuessRound[] = [
		{
			prefix: 'I am running late, I have to catch the',
			options: ['train', 'cheese', 'Tuesday', 'green'],
			answer: 'train',
			note: 'Almost any English speaker would say “train” or “bus”. That shared expectation is what the model learns.'
		},
		{
			prefix: 'Once upon a time there was a princess who lived in a',
			options: ['castle', 'traffic light', 'because', 'ate'],
			answer: 'castle',
			note: 'The genre of the text matters: “Once upon a time” has already put you in fairy-tale mode.'
		},
		{
			prefix: 'Please close the door when you',
			options: ['leave', 'blue', 'we', 'root'],
			answer: 'leave',
			note: 'Meaning is not deciding here, grammar is: after “when you” comes a verb.'
		},
		{
			prefix: 'Water boils at one hundred degrees',
			options: ['Celsius', 'sad', 'running', 'although'],
			answer: 'Celsius',
			note: 'Sometimes predicting the next word takes knowing how the world works, not just the language.'
		},
		{
			prefix: 'I asked for tea and they brought me tea with',
			options: ['milk', 'window', 'jumped', 'perhaps'],
			answer: 'milk',
			note: 'Set phrases are the easiest thing to predict. And they are enormously frequent.'
		},
		{
			prefix: 'The day after Monday is',
			options: ['Tuesday', 'Sunday', 'winter', 'train'],
			answer: 'Tuesday',
			note: '“Sunday” is a day too, but only one is right. Predicting well takes more than the category.'
		}
	];

	const EXAMPLE_DISTRIBUTION = [
		{ label: 'train', probability: 0.41, tone: 'model' as const },
		{ label: 'bus', probability: 0.22, tone: 'model' as const },
		{ label: 'tube', probability: 0.14, tone: 'model' as const },
		{ label: 'car', probability: 0.09, tone: 'model' as const },
		{ label: 'plane', probability: 0.05, tone: 'model' as const },
		{ label: 'bull', probability: 0.001, tone: 'muted' as const },
		{ label: 'cheese', probability: 0.0002, tone: 'muted' as const }
	];
</script>

<Step title="A machine that does only one thing">
	<Prose lead>
		<p>
			Everything a language model does —translate, summarise, program, hold a conversation— comes
			out of a single skill: <strong>guessing what comes next</strong>.
		</p>
	</Prose>

	<Prose>
		<p>
			It sounds like a let-down. And yet, if you are forced to predict the next word of any text in
			the world, you end up needing grammar, facts, logic, style and something close to common
			sense. There is no shortcut: to finish “the capital of France is…” properly you have to know
			the answer.
		</p>
		<p>Before we explain how the machine does it, do it yourself.</p>
	</Prose>
</Step>

<Step gate="01-prediccion:adivina" title="Be the language model">
	<Challenge
		id="01-prediccion:adivina"
		title="Finish the sentences"
		objective="Play the six rounds. You do not have to get them all: what matters is seeing what you are doing."
		hints={['Notice whether meaning, grammar or plain habit is guiding you.']}
	>
		{#snippet children(api)}
			<GuessGame rounds={ROUNDS} onsolve={(result) => api.solve(result)} />
		{/snippet}
		{#snippet success(result)}
			<p>
				You got <strong>{result.detail?.hits}</strong> of {result.detail?.rounds}. We have kept your
				score: in chapter 4 you will face a real model.
			</p>
		{/snippet}
	</Challenge>

	<Callout kind="key" title="What you just did">
		You walked through a text and, at every gap, put in the word that seemed most likely. Training a
		language model is exactly that, repeated over trillions of words: predict, check, and if you get
		it wrong, correct yourself a little.
	</Callout>
</Step>

<Step title="The model does not choose: it shares out">
	<Prose>
		<p>
			There is an important difference between what you did and what the model does. You picked
			<em>one</em> word. The model does not pick: it shares
			<strong>probability out across every word it knows</strong>, all at once.
		</p>
	</Prose>

	<Figure caption="What the model produces for “I have to catch the…”">
		<ProbabilityBars items={EXAMPLE_DISTRIBUTION} limit={7} />
	</Figure>

	<Prose>
		<p>
			That complete list of probabilities is the real output of a language model. Turning it into
			one concrete word is a separate step, with rules of its own, and we will give it the whole of
			chapter 5.
		</p>
		<p>
			Notice too that we have not even said what a “word” is. It turns out the model does not work
			with words, and that decision has consequences we will drag along to the end of the course.
		</p>
	</Prose>
</Step>
