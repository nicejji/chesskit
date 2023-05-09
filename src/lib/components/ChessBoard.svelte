<script lang="ts">
	import 'iconify-icon';
	import { fade } from 'svelte/transition';
	import type { Chess, Square } from 'chess.js';
	import { createEventDispatcher } from 'svelte';
	import { socket } from '$lib/clientSocket';
	export let chess: Chess;
	export let player: 'w' | 'b';

	const dispatch = createEventDispatcher();

	$: myMove = chess.turn() === player;
	$: board = chess.board();
	$: backgrounds = board.map((row, columnIndex) =>
		row.map((_, rowIndex) => getCellBg(columnIndex, rowIndex))
	);
	$: squares = board.map((row, columnIndex) =>
		row.map((_, rowIndex) => getSquare(columnIndex, rowIndex))
	);

	let selectedFrom: Square | undefined;
	let selectedTo: Square | undefined;
	let promotionPrompt = false;
	// let selectedTo: Square | undefined;
	$: moves = selectedFrom ? chess.moves({ square: selectedFrom, verbose: true }) : [];
	$: movesMap = squares.map((row) => row.map((square) => moves.find((move) => move.to === square)));
	const getCellBg = (columnIndex: number, rowIndex: number): 'w' | 'b' =>
		columnIndex % 2 ? (rowIndex % 2 ? 'w' : 'b') : rowIndex % 2 ? 'b' : 'w';

	const getSquare = (columnIndex: number, rowIndex: number): Square => {
		const number = 8 - columnIndex;
		const letter = 'abcdefgh'[rowIndex];
		return `${letter}${number}` as Square;
	};

	const icons = {
		p: 'fa6-solid:chess-pawn',
		b: 'fa6-solid:chess-bishop',
		q: 'fa6-solid:chess-queen',
		r: 'fa-solid:chess-rook',
		n: 'fa-solid:chess-knight',
		k: 'fa6-solid:chess-king'
	};

	socket.on('moveReject', () => (promotionPrompt = true));
</script>

<span class="chip" class:variant-filled-success={myMove} class:variant-filled-warning={!myMove}
	>{myMove ? 'Ваш ход' : 'Ожидание хода соперника...'}</span
>
<div class="flex flex-col rounded-xl overflow-hidden" class:flex-col-reverse={player === 'b'}>
	{#each board as row, columnIndex}
		<div class="flex">
			{#each row as cell, rowIndex}
				<div
					class="w-16 h-16 flex items-center justify-center"
					class:bg-tertiary-700={backgrounds[columnIndex][rowIndex] === 'w' &&
						squares[columnIndex][rowIndex] !== selectedFrom &&
						!movesMap[columnIndex][rowIndex]}
					class:bg-primary-700={backgrounds[columnIndex][rowIndex] === 'b' &&
						squares[columnIndex][rowIndex] !== selectedFrom &&
						!movesMap[columnIndex][rowIndex]}
					class:bg-success-500={squares[columnIndex][rowIndex] === selectedFrom}
					class:bg-warning-500={movesMap[columnIndex][rowIndex]}
					on:keydown
					on:click={() => {
						if (movesMap[columnIndex][rowIndex] && selectedFrom) {
							selectedTo = squares[columnIndex][rowIndex];
							const move = { from: selectedFrom, to: squares[columnIndex][rowIndex] };
							dispatch('move', move);
						} else {
							if (cell?.color === player) {
								selectedFrom = squares[columnIndex][rowIndex];
								promotionPrompt = false;
							}
						}
					}}
				>
					{#if cell}
						<iconify-icon
							transition:fade
							icon={icons[cell.type]}
							class="text-5xl"
							class:text-black={cell.color === 'b'}
							class:text-white={cell.color === 'w'}
						/>
					{/if}
				</div>
			{/each}
		</div>
	{/each}
	{#if promotionPrompt}
		<div class="card p-4 gap-5 items-center flex flex-col" transition:fade>
			<h3>Choose promotion</h3>
			<div class="flex gap-3 justify-center">
				{#each 'nbrq' as promotion}
					<button
						class="btn variant-filled-primary"
						on:click={() => {
							if (selectedTo && selectedFrom) {
								const move = { from: selectedFrom, to: selectedTo, promotion };
								dispatch('move', move);
								promotionPrompt = false;
								selectedFrom = undefined;
							}
						}}>{promotion}</button
					>
				{/each}
			</div>
		</div>
	{/if}
</div>
