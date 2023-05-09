<script lang="ts">
	import { applyAction, enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { reloadSocket } from '$lib/clientSocket';
	import 'iconify-icon';
	export let data;
</script>

<div class="flex flex-col p-5 w-full h-full">
	<div class="flex flex-col gap-3 card p-4">
		<div class="flex items-center gap-3">
			<h3>{data.user.name}</h3>
			<span class="badge variant-filled-success">Онлайн</span>
		</div>
		{#if data.currentGame}
			<div class="flex items-center gap-3 card p-3">
				<iconify-icon class="text-3xl" icon="material-symbols:swords" />
				<span>Играет в игру</span>
			</div>
		{:else}
			<form
				method="POST"
				action={data.user.isFindingGame ? '?/closeRoom' : '?/openRoom'}
				class="flex items-center gap-3 w-fit p-3 rounded-full"
				class:variant-filled-surface={data.user.isFindingGame}
				class:bg-gray-500={!data.user.isFindingGame}
				use:enhance={() => {
					return async ({ result }) => {
						await applyAction(result);
						reloadSocket();
						await invalidateAll();
					};
				}}
			>
				<button class="btn variant-filled">
					<iconify-icon
						class="text-3xl"
						icon={data.user.isFindingGame
							? 'material-symbols:lock-open-right'
							: 'material-symbols:lock'}
					/>
				</button>
				<span
					>{data.user.isFindingGame
						? 'Open for incoming requests.'
						: 'Closed for incoming requests.'}</span
				>
			</form>
		{/if}
	</div>
	<div class="card p-4">
		<h3>Входящие приглашения</h3>
		{#each data.recievedInvites || [] as invite}
			<pre>{JSON.stringify(invite)}</pre>
		{/each}
	</div>
</div>
