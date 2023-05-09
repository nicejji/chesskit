<script lang="ts">
	import { socket } from '$lib/clientSocket';
	import ChessBoard from '$lib/components/ChessBoard.svelte';
	import { Chess } from 'chess.js';

	export let data;

	let chess = new Chess(data.game.FEN);
	socket.on('move', (fen) => {
		chess = new Chess(fen);
	});
</script>

<div class="w-full h-full flex flex-col p-5 gap-5 items-center">
	<h3>Бой</h3>
	<ChessBoard
		{chess}
		player={data.game.blackPlayerId === data.user.id ? 'b' : 'w'}
		on:move={(e) => {
			socket.emit('move', e.detail);
		}}
	/>
</div>
