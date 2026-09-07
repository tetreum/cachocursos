<script lang="ts">
	import type { Snippet } from 'svelte';
	import '../styles/app.scss';

	interface LayoutProps {
		children: Snippet;
	}

	let { children }: LayoutProps = $props();
</script>

{@render children()}
