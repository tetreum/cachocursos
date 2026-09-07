<script lang="ts">
	import Lesson from '$ui/Lesson.svelte';
	import { COURSES } from '$content/courses';
	import ContentA from './ContentA.svelte';
	import ContentB from './ContentB.svelte';

	interface NavHarnessProps {
		which: 'a' | 'b';
		keyed?: boolean;
		/** El idioma que muestra la ruta: cambia el componente, no el capítulo. */
		locale?: string;
	}

	let { which, keyed = true, locale = 'es' }: NavHarnessProps = $props();

	const chapters = COURSES[0].chapters;
	const entry = $derived(which === 'a' ? chapters[0] : chapters[1]);
	const Content = $derived(which === 'a' && locale === 'es' ? ContentA : ContentB);
</script>

{#if keyed}
	{#key `${locale}:${entry.id}`}
		<Lesson {entry}><Content /></Lesson>
	{/key}
{:else}
	<Lesson {entry}><Content /></Lesson>
{/if}
