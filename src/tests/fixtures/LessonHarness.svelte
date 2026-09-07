<script lang="ts">
	import Lesson from '$ui/Lesson.svelte';
	import Step from '$ui/Step.svelte';
	import Challenge from '$ui/Challenge.svelte';
	import { COURSES } from '$content/courses';

	const entry = COURSES[0].chapters[0];
	const gate = entry.gates[0];
</script>

<Lesson {entry}>
	<Step title="Primero">
		<p data-testid="step-1">Contenido inicial</p>
	</Step>

	<Step {gate} title="Segundo">
		<Challenge id={gate} title="Reto" objective="Pulsa el botón">
			{#snippet children(api)}
				<button data-testid="win" onclick={() => api.solve({ score: 1 })}>Ganar</button>
			{/snippet}
		</Challenge>
	</Step>

	<Step title="Tercero">
		<p data-testid="step-3">Contenido final</p>
	</Step>
</Lesson>
