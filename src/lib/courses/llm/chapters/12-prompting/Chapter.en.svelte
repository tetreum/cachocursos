<script lang="ts">
	import Step from '$ui/Step.svelte';
	import Prose from '$ui/Prose.svelte';
	import Callout from '$ui/Callout.svelte';
	import Challenge from '$ui/Challenge.svelte';
	import PromptWorkshop, { type PromptBlock } from './PromptWorkshop.svelte';

	const TARGET_QUALITY = 0.8;

	const TASK =
		'Extract the data from this email:\n\n“Hello, I am Martha Rush. I am writing from Leeds. My order 88213 arrived broken on Tuesday and I want to return it.”';

	const BLOCKS: readonly PromptBlock[] = [
		{
			id: 'rol',
			label: 'Give the model a role',
			snippet: 'Act as a data extraction system for a customer support desk.',
			quality: 0.15,
			explanation: 'It places the model in the part of text-space where that kind of task lives.'
		},
		{
			id: 'formato',
			label: 'Specify the output format',
			snippet: 'Return only a JSON object with the keys: name, city, order, issue.',
			quality: 0.35,
			explanation: 'The best value of the lot. Without it, the model picks the format for you.'
		},
		{
			id: 'ejemplo',
			label: 'Add a worked example',
			snippet:
				'Example:\nInput: “I am Louis Gill, from Bristol. Order 40122 never arrived.”\nOutput: {"name":"Louis Gill","city":"Bristol","order":"40122","issue":"not delivered"}',
			quality: 0.3,
			explanation:
				'In-context learning: a single example fixes format, style and criterion all at once.'
		},
		{
			id: 'vacios',
			label: 'Say what to do about what is missing',
			snippet: 'If a field does not appear in the text, put null. Do not invent it.',
			quality: 0.2,
			explanation: 'Gaps are the main source of invention in extraction tasks.'
		},
		{
			id: 'cortesia',
			label: 'Ask nicely',
			snippet: 'Please do your very best. Thank you!',
			quality: 0,
			explanation:
				'It does no harm, but it adds nothing measurable either. Politeness is not a technique.'
		},
		{
			id: 'presion',
			label: 'Threaten or apply pressure',
			snippet: 'It is VERY IMPORTANT that you do not fail or there will be serious consequences.',
			quality: 0,
			explanation: 'Very popular and very unreliable. It adds noise without specifying anything.'
		}
	];

	const BAD_OUTPUT =
		'Of course! I have read Martha’s email. It seems she has had a problem with her order and I understand her frustration. The most relevant details would be her name, Martha Rush, and that she is writing from Leeds. Would you like me to draft a reply?';

	const GOOD_OUTPUT =
		'{\n  "name": "Martha Rush",\n  "city": "Leeds",\n  "order": "88213",\n  "issue": "broken product"\n}';
</script>

<Step title="Learning without changing a single weight">
	<Prose lead>
		<p>
			Something happens here that was not in the plan. If you put a few examples of the task inside
			the prompt, the model gets better at that task instantly, with no training at all.
		</p>
	</Prose>

	<Prose>
		<p>
			It is called <strong>in-context learning</strong> and nobody designed it: it showed up on its own
			as models scaled. The weights do not change; the only thing that changes is what is in the context
			window. The model infers the pattern on the fly and continues it, because continuing patterns is
			exactly the only thing it knows how to do.
		</p>
		<p>
			Seen this way, the prompt is not an order: it is the <em>beginning of a document</em> the model
			is going to complete. Writing good prompts means building an opening such that the most likely continuation
			is the answer you want.
		</p>
		<p>
			That is also where <strong>chain-of-thought</strong> comes from: if you ask it to reason step
			by step, the intermediate steps enter the context and each one conditions the next. The model
			literally <em>uses its own output as working memory</em>. That is why it works on multi-step
			problems.
		</p>
	</Prose>
</Step>

<Step gate="12-prompting:taller" title="Build a prompt">
	<Prose>
		<p>
			A data extraction task. Switch blocks on and watch how the prompt and the answer change. Not
			every block helps: some are widespread superstitions.
		</p>
	</Prose>

	<Challenge
		id="12-prompting:taller"
		title="Get a usable output"
		objective="Combine blocks until you reach an estimated quality of {Math.round(
			TARGET_QUALITY * 100
		)}%."
		hints={[
			'Ask yourself which block really removes an ambiguity, and which merely sounds good.',
			'Specifying the exact output format is almost always what contributes most.',
			'One worked example is worth more than three sentences explaining what you want.'
		]}
	>
		{#snippet children(api)}
			<PromptWorkshop
				task={TASK}
				blocks={BLOCKS}
				badOutput={BAD_OUTPUT}
				goodOutput={GOOD_OUTPUT}
				targetQuality={TARGET_QUALITY}
				onsolve={(result) => api.solve(result)}
			/>
		{/snippet}
		{#snippet success(result)}
			<p>
				Quality <strong>{result.detail?.quality}</strong> with {result.detail?.blocks} blocks.
			</p>
		{/snippet}
	</Challenge>

	<Callout kind="warn" title="Confidence is not correctness">
		A warning worth taking away from the course: how confidently a model states something bears
		little relation to whether it is true. There is no internal mechanism separating “I know this”
		from “this sounds plausible”. When it does not have the fact, the most likely continuation is
		still a well-formed, self-assured sentence. That is what hallucinations are, and they are not a
		malfunction: they are normal operation applied to a gap.
	</Callout>
</Step>

<Step title="A model that writes like a human">
	<Prose>
		<p>
			Let us recap what we have built. A tokeniser that chops the text up. Embeddings that turn the
			pieces into geometry. Attention that puts them in context. A block that repeats dozens of
			times. Training at scale. Alignment so it obeys. And prompting to steer it.
		</p>
		<p>
			The result is a system capable of producing text that, often, cannot be told apart from a
			person's. And that raises a very practical question that is no longer entirely technical:
			<strong>can you tell whether a text was written by a machine?</strong>
		</p>
		<p>
			There is an ingenious answer, and understanding it needs exactly the pieces you now have: what
			a token is, where the logits come from, and what happens if somebody touches them before
			sampling.
		</p>
	</Prose>
</Step>
