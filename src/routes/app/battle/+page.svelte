<script lang="ts">
	import { goto } from '$app/navigation';
	import { reloadSocket, socket } from '$lib/clientSocket';
	import ChessBoard from '$lib/components/ChessBoard.svelte';
	import { Chess } from 'chess.js';

	export let data;

	let chess = data.game ? new Chess(data.game.FEN) : null;
	socket.on('move', (fen) => {
		chess = new Chess(fen);
	});

	const surrender = () => {
		socket.emit('surrender');
		reloadSocket();
		goto('/app/profile/');
	};
</script>

<div class="w-full h-full flex flex-col p-5 gap-5 items-center">
	{#if data.game}
		<ChessBoard
			chess={chess || new Chess()}
			player={data.game.blackPlayerId === data.user.id ? 'b' : 'w'}
			on:move={(e) => {
				socket.emit('move', e.detail);
			}}
		/>
		<button class="btn variant-filled-error" on:click={surrender}>Сдаться</button>
	{:else}
		<h3>Возращайтесь сюда, после начала боя.</h3>
	{/if}
</div>
