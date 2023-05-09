<script lang="ts">
	import '@skeletonlabs/skeleton/themes/theme-skeleton.css';
	import '@skeletonlabs/skeleton/styles/all.css';
	import '../app.postcss';
	import { Modal } from '@skeletonlabs/skeleton';
	import { fade } from 'svelte/transition';

	export let data;
</script>

<Modal />
<div class="h-full overflow-hidden">
	{#key data.url.split('/')?.[1]}
		<div in:fade={{ duration: 200, delay: 200 }} out:fade={{ duration: 200 }} class="h-full">
			<slot />
		</div>
	{/key}
</div>
