<script lang="ts">
	import { ENGLISH as DATA } from '../../data/en';
	import Step from '$ui/Step.svelte';
	import Prose from '$ui/Prose.svelte';
	import Callout from '$ui/Callout.svelte';
	import Challenge from '$ui/Challenge.svelte';
	import LabellerGame from './LabellerGame.svelte';
</script>

<Step title="A base model is not an assistant">
	<Prose lead>
		<p>
			The model we have built knows how to continue text. That is not the same as answering
			questions, and the difference shows immediately.
		</p>
	</Prose>

	<Prose>
		<p>
			If you write “write a poem about the sea” to a base model, a perfectly plausible continuation
			is “…in fewer than twenty lines. Hand in before Friday.” Because on the internet that sentence
			appears many times inside a homework assignment, not as a request to a machine.
		</p>
		<p>The model is not disobeying you. We simply never asked it to obey.</p>
		<p>
			Turning it into an assistant takes two more phases. The first, <strong
				>instruction tuning</strong
			>, is ordinary training on a set of hand-written examples of the form “instruction → good
			answer”. It is surprisingly cheap compared with pretraining, and it already fixes most of the
			problem.
		</p>
		<p>
			The second is subtler. For many questions there is no single correct answer you could write by
			hand, but it is easy to say which of two answers is better. So that is what people are asked.
		</p>
	</Prose>

	<Callout title="RLHF, in three steps">
		Thousands of human comparisons between pairs of answers are collected. They are used to train a
		<strong>reward model</strong>: a network that learns to score answers the way a labeller would.
		And finally the language model is optimised to maximise that score. The human does not write
		answers: the human writes the criterion.
	</Callout>
</Step>

<Step gate="11-alineamiento:etiquetador" title="Be the labeller">
	<Prose>
		<p>
			Six questions, two answers each. Pick the one you would rather receive. When you finish we
			will train a real reward model —pairwise logistic regression, the same method used in
			practice— on your choices, and show you what it learned.
		</p>
		<p>Answer honestly. The point of the exercise is in whatever comes out.</p>
	</Prose>

	<Challenge
		id="11-alineamiento:etiquetador"
		title="Train a reward model on your preferences"
		objective="Choose your preferred answer in all six comparisons."
		hints={[
			'There is no right answer. What is interesting is which trait ends up weighing most in your model.',
			'Notice whether you are rewarding answers that genuinely settle the question or only answers that sound good.'
		]}
	>
		{#snippet children(api)}
			<LabellerGame
				pairs={DATA.responsePairs}
				traitLabels={DATA.traitLabels}
				onsolve={(result) => api.solve(result)}
			/>
		{/snippet}
		{#snippet success(result)}
			<p>
				Your reward model reproduces your preferences
				<strong>{result.detail?.accuracy}</strong> of the time, and what it rewards most is “{result
					.detail?.dominantTrait}”.
			</p>
		{/snippet}
	</Challenge>
</Step>

<Step title="Optimising what you measure, not what you want">
	<Prose>
		<p>
			The problem you have just seen in miniature is the central problem of alignment. The reward
			model is an <em>approximation</em> of what you want. The moment you push hard against it, the model
			finds the gaps between the approximation and your real intention.
		</p>
		<p>
			In practice this produces some very recognisable things: answers longer than they need to be,
			because labellers tend to score length more highly. Flattery —the model agrees with you
			because contradicting you scores worse. And excessive caution, those endless “consult a
			professional” warnings that help nobody but are never scored as incorrect.
		</p>
		<p>
			None of those behaviours was programmed. They are all <strong>reward hacking</strong>: the
			model maximising exactly what we asked for, which was not exactly what we wanted.
		</p>
	</Prose>

	<Callout kind="key" title="What is left">
		We now have an assistant. But its behaviour depends enormously on how you talk to it, and that
		opens up a skill that requires training nothing: prompting.
	</Callout>
</Step>
