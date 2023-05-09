<script lang="ts">
	import { applyAction, enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { socket } from '$lib/clientSocket';
	import { modalStore } from '@skeletonlabs/skeleton';
	import type { ActionResult } from '@sveltejs/kit';
	import 'iconify-icon';
	export let data;

	let users = data.foundUsers;

	const handleSubmit = async (o: { result: ActionResult }) => {
		users = (o.result as any).data.foundUsers;
		await applyAction(o.result);
		await invalidateAll();
	};

	const sendRequest = (toId: number) => {
		socket.emit('invite', toId);
	};
</script>

<div class="w-full h-full flex flex-col p-5 gap-5 items-center">
	<h3>Пользователи в поиске игры</h3>
	<form
		action="?/findUsers"
		method="POST"
		class="input-group input-group-divider grid-cols-[auto_1fr_auto] w-fit"
		use:enhance={() => handleSubmit}
	>
		<input type="search" placeholder="Search..." name="query" />
		<button class="variant-filled-secondary">
			<iconify-icon icon="material-symbols:search-rounded" class="text-3xl" />
		</button>
	</form>
	<div class="flex flex-col gap-3">
		{#if users.length}
			{#each users as u}
				<div class="card p-4 flex items-center gap-3">
					<span class="text-xl">{u.name}</span>
					<button class="btn btn-sm variant-filled-success" on:click={() => sendRequest(u.id)}
						>Отправить приглашение.</button
					>
				</div>
			{/each}
		{:else}
			<span>Пользователи по запросу не найдены.</span>
		{/if}
	</div>
</div>
