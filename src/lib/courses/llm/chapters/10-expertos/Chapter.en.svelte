<script lang="ts">
	import { ENGLISH as DATA } from '../../data/en';
	import { EXPERT_CAPACITY, ROUTING_TARGET } from '../../config';
	import Step from '$ui/Step.svelte';
	import Prose from '$ui/Prose.svelte';
	import Callout from '$ui/Callout.svelte';
	import Challenge from '$ui/Challenge.svelte';
	import Figure from '$ui/Figure.svelte';
	import RouterGame from './RouterGame.svelte';
	import RouterMechanism from './RouterMechanism.svelte';
	import SparsityLab from './SparsityLab.svelte';
</script>

<Step title="Every token pays for everything">
	<Prose lead>
		<p>
			In the previous chapter the cost was <code>6·N·D</code>: every parameter is paid for on every
			token. That equation has a crack in it, and exploiting it is what almost every large model
			does today.
		</p>
	</Prose>

	<Prose>
		<p>
			Back to the block you assembled in chapter 7: the <strong>feed-forward network</strong> was
			the piece where most of the parameters lived, and it processed each token separately. Notice
			what that implies: when the model processes the word <code>of</code>, it goes through exactly
			the same billions of parameters as when it processes <code>cliff</code>
			or the symbol <code>==</code>.
		</p>
		<p>
			What if it did not have to? A code token and a poetry token probably want different
			transformations. The idea behind <strong>mixture of experts</strong> (MoE) is to replace that
			single feed-forward network with <em>many</em> —the experts— and have each token go through only
			a few.
		</p>
		<p>
			The one deciding which is the <strong>router</strong>: a tiny layer that looks at the token
			and shares it out. That is the job you are about to do by hand.
		</p>
	</Prose>

	<Callout kind="warn" title="What MoE does not fix">
		Let us be clear, because this gets confused a lot: MoE is an <strong>efficiency</strong>
		technique. It does not make the model smarter on its own, and it certainly does not fix the tokeniser
		blindness from chapter 2 (the model cannot count how many L's a word has because it sees vectors,
		not words) — an MoE still cannot see the letters, because the chopping happens long before. What does
		fix it we will see in chapter 13.
	</Callout>
</Step>

<Step title="And how does the router know who is expert in what?">
	<Prose lead>
		<p>
			There is a trick question here. If nobody assigns a subject to each expert, and the router has
			to decide where to send each token… where does it get that information from?
		</p>
	</Prose>

	<Prose>
		<p>
			The short answer is that <strong
				>it does not get it from anywhere: it builds it at the same time</strong
			>. And the long answer starts by taking the mystery out of the router. It is not a program
			that reasons about tokens: it is a <strong>matrix</strong>, one row per expert. You multiply
			the token's vector by that matrix, you get a score per expert, you apply a softmax and you
			keep the highest ones. That is all.
		</p>
	</Prose>

	<Figure wide caption="Inside the router: a dot product and not much else">
		<RouterMechanism
			experts={DATA.experts}
			tokens={DATA.routableTokens}
			featureNames={DATA.featureNames}
			trainedRouter={DATA.trainedRouter}
			untrainedRouter={DATA.untrainedRouter}
		/>
	</Figure>

	<Prose>
		<p>
			Try the “freshly initialised router” button. At the start of training that matrix is full of
			random numbers: the split is practically a coin toss and every expert is equally useless.
			There is no specialisation to discover yet.
		</p>
		<p>What happens from there is a loop that feeds itself:</p>
		<ul>
			<li>By pure chance, one expert receives a few extra numeric tokens.</li>
			<li>Training on them, it gets <em>a little</em> better at numbers.</li>
			<li>
				Since the loss now falls further when numbers go there, the gradient pushes the router to
				send it more numbers.
			</li>
			<li>With more numbers, it specialises further. And round it goes again.</li>
		</ul>
		<p>
			The router and the experts are trained <strong>at the same time</strong>, by the same
			gradient. Specialisation is not a precondition of the routing: it is its
			<em>consequence</em>. A minuscule asymmetry at the start is amplified until it becomes a
			division of labour.
		</p>
	</Prose>

	<Callout kind="key" title="We are the ones who give them names">
		The router does not “know” that expert B is the code one, just as there is no label written
		anywhere. There is only a row of numbers that gives a high value when the token carries certain
		features. That we then look at what reaches it and say “ah, this is the code one” is our own
		interpretation, after the fact. It is exactly what happened with the attention heads in chapter
		6: nobody programs them, they emerge, and we name them afterwards.
	</Callout>

	<Callout kind="warn" title="And this is why it can go wrong">
		That “whoever is winning wins more” loop does not have to share out evenly. If one expert gets
		ahead too early, it can end up taking almost everything while the others go untrained. Hold on
		to this idea: you are going to watch it happen on the scoreboard of the next challenge.
	</Callout>
</Step>

<Step gate="10-expertos:enrutado" title="Be the router">
	<Prose>
		<p>
			Now it is your turn to be the matrix. Twelve tokens and four already trained experts: each
			specialised on its own following the loop you have just seen, and processes some tokens better
			than others.
		</p>
		<p>
			The detail that complicates it: every expert has a limited <strong>capacity</strong>. Send it
			more tokens than it can process and the extras are dropped and skip the whole layer. Sharing
			out well is not only about getting the subject right; it is also about not overloading anyone.
		</p>
	</Prose>

	<Challenge
		id="10-expertos:enrutado"
		title="Share the tokens among the experts"
		objective="Place all twelve tokens and reach a quality of {Math.round(ROUTING_TARGET * 100)}%."
		hints={[
			'Group by type: numbers with numbers, code with code. That is exactly how the experts specialise.',
			'There are twelve tokens, four experts and capacity for four each. The arithmetic works out exactly: three per expert.',
			'If you cannot see why it fails, turn on “Show affinities” and compare what you placed with what each expert prefers.'
		]}
	>
		{#snippet children(api)}
			<RouterGame
				experts={DATA.experts}
				tokens={DATA.routableTokens}
				capacity={EXPERT_CAPACITY}
				target={ROUTING_TARGET}
				onsolve={(result) => api.solve(result)}
			/>
		{/snippet}
		{#snippet success(result)}
			<p>
				Quality <strong>{result.detail?.quality}</strong> with no token dropped.
			</p>
		{/snippet}
	</Challenge>
</Step>

<Step title="Parameters you do not pay for">
	<Prose>
		<p>
			Now the accounting consequence, which is what made this idea famous. The parameters of the
			experts that are <em>not</em> activated still exist —they have to be kept in memory— but they cost
			no compute on that token.
		</p>
	</Prose>

	<Figure wide caption="Capacity versus compute in a layer of experts">
		<SparsityLab />
	</Figure>

	<Prose>
		<p>
			This is why you will see models announced with two figures: “this many total parameters, this
			many active”. A model can have hundreds of billions of parameters and activate only tens of
			billions per token. In the scaling law from the previous chapter, it is as if you could raise
			<strong>N</strong> without paying the whole <code>6·N·D</code>.
		</p>
		<p>
			The bill moves somewhere else: <strong>memory</strong>. Every expert has to be loaded just in
			case, even though you use two per token. An MoE is cheap to run and expensive to house.
		</p>
	</Prose>

	<Callout kind="key" title="And the problem it creates">
		Nothing guarantees the router shares out well. If it learns that one expert is slightly better
		than the rest, it will start sending it everything, that expert will overload and the others
		will go untrained: that is <strong>router collapse</strong>, and you saw it on the challenge's
		scoreboard. This is why training an MoE carries an extra term in the loss whose only job is to
		<em>force</em> the load to spread.
	</Callout>
</Step>
