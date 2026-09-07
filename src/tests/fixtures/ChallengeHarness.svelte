<script lang="ts">
	import Challenge from '$ui/Challenge.svelte';
	import { setCourseId } from '$ui/lesson.svelte';
	import { COURSES } from '$content/courses';
	import type { ChallengeId } from '$content/types';

	interface ChallengeHarnessProps {
		id: ChallengeId;
	}

	let { id }: ChallengeHarnessProps = $props();

	setCourseId(COURSES[0].id);
</script>

<Challenge {id} title="Reto de prueba" objective="Pulsa el botón">
	{#snippet children(api)}
		<button data-testid="win" onclick={() => api.solve({ score: 7 })}>Ganar</button>
		<button data-testid="lose" onclick={() => api.fail()}>Fallar</button>
	{/snippet}
	{#snippet success(result)}
		<span data-testid="success">Puntuación {result.score}</span>
	{/snippet}
</Challenge>
