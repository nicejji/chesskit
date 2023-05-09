<script lang="ts">
	import { socket } from '$lib/clientSocket';
	import type { Invite, User } from '@prisma/client';
	import { modalStore } from '@skeletonlabs/skeleton';

	export let from: User;
	export let invite: Invite;

	const rejectInvite = () => {
		socket.emit('reject', invite.id);
		modalStore.close();
	};

	const confirmInvite = () => {
		socket.emit('confirm', invite.id);
		modalStore.close();
	};
</script>

<div class="card flex flex-col gap-5 p-4 items-center">
	<h3>Вы полуили приглашение в игру от: {from.name}!</h3>
	<div class="flex gap-5">
		<button class="btn variant-filled-success" on:click={confirmInvite}>Принять</button>
		<button class="btn variant-filled-error" on:click={rejectInvite}>Отклонить</button>
	</div>
</div>
