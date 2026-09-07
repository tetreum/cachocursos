<script lang="ts">
	import { setLocale, type Locale } from '$i18n/locale';
	import TranslatedFixture from './TranslatedFixture.svelte';

	interface LocaleHarnessProps {
		locale: Locale;
	}

	let { locale }: LocaleHarnessProps = $props();

	setLocale(() => locale);
</script>

<TranslatedFixture />
