<script lang="ts">
	import { applyAction, enhance } from '$app/forms';
	import { modalStore } from '@skeletonlabs/skeleton';
</script>

<div class="card flex flex-col gap-5 p-4 items-center">
	<h3>Вы уверены?</h3>
	<div class="flex gap-5">
		<form
			method="POST"
			action="/app/logout"
			use:enhance={() => {
				return async ({ result }) => {
					modalStore.close();
					await applyAction(result);
				};
			}}
		>
			<button class="btn variant-filled-warning">Выйти</button>
		</form>
		<button class="btn variant-ringed-primary" on:click={() => modalStore.close()}>Отмена</button>
	</div>
</div>
