<script lang="ts">
	import 'iconify-icon';
	import { page } from '$app/stores';
	import { AppShell, AppBar, AppRail, AppRailTile, modalStore } from '@skeletonlabs/skeleton';
	import LogoutModal from '$lib/components/LogoutModal.svelte';
	import { derived } from 'svelte/store';
	import { fade } from 'svelte/transition';
	import { reloadSocket, socket } from '$lib/clientSocket';
	import GameRequestModal from '$lib/components/GameRequestModal.svelte';
	import { goto, invalidateAll } from '$app/navigation';

	export let data;

	const handleInvite = (data: any) => {
		modalStore.trigger({
			type: 'component',
			component: {
				ref: GameRequestModal,
				props: { from: data.from, invite: data.invite }
			}
		});
	};

	const handleReject = (data: any) => {
		modalStore.trigger({
			type: 'alert',
			title: `Ваше приглашение к ${data.from.name} было отклонено!`
		});
	};

	const handleConfirm = async (data: any) => {
		modalStore.trigger({
			type: 'alert',
			title: `Ваше приглашение к ${data.from.name} было принято, перейдите к игре!`
		});
		reloadSocket();
		goto('/app/battle/');
		if ($page.url.pathname === '/app/battle') await invalidateAll();
	};

	const handleSurrender = () => {
		modalStore.trigger({
			type: 'alert',
			title: `Соперник сдался!`
		});
		reloadSocket();
		goto('/app/profile');
	};

	socket.on('invite', handleInvite);
	socket.on('reject', handleReject);
	socket.on('confirmation', handleConfirm);
	socket.on('surrender', handleSurrender);
	socket.on('win', () => {
		modalStore.trigger({
			type: 'alert',
			title: `Вы выиграли!`
		});
		reloadSocket();
		goto('/app/profile');
	});
	socket.on('lose', () => {
		modalStore.trigger({
			type: 'alert',
			title: `Вы проиграли!`
		});
		reloadSocket();
		goto('/app/profile');
	});
</script>

<AppShell>
	<svelte:fragment slot="header">
		<AppBar gridColumns="grid-cols-3" slotDefault="place-self-center" slotTrail="place-content-end">
			<svelte:fragment slot="lead">
				<a href="/app/games" class="flex items-center gap-3">
					<iconify-icon icon="fluent:chess-20-filled" class="text-3xl" />
					<span>Шахматы онлайн</span>
				</a>
			</svelte:fragment>
			<svelte:fragment slot="trail">
				<span>Выполнен вход как: <span class="font-bold">{data.user.name}</span></span>
				<button
					class="btn btn-sm variant-ringed-primary"
					on:click={() => {
						modalStore.trigger({
							type: 'component',
							component: {
								ref: LogoutModal
							}
						});
					}}>Выйти из аккаунта</button
				>
			</svelte:fragment>
		</AppBar>
	</svelte:fragment>
	<svelte:fragment slot="sidebarLeft">
		<AppRail
			selected={{
				...derived(page, ($page) => $page.url.pathname),
				set: () => {},
				update: () => {}
			}}
		>
			<AppRailTile value="/app/profile" tag="a" href="/app/profile" label="Профиль">
				<iconify-icon icon="iconamoon:profile-fill" class="text-3xl" />
			</AppRailTile>
			<AppRailTile value="/app/games" tag="a" href="/app/games" label="Поиск">
				<iconify-icon icon="material-symbols:search" class="text-3xl" />
			</AppRailTile>
			<AppRailTile value="/app/battle" tag="a" href="/app/battle" label="Игра">
				<iconify-icon icon="material-symbols:swords" class="text-3xl" />
			</AppRailTile>
		</AppRail>
	</svelte:fragment>
	<div class="h-full overflow-hidden">
		{#key data.url}
			<div in:fade={{ duration: 200, delay: 200 }} out:fade={{ duration: 200 }} class="h-full">
				<slot />
			</div>
		{/key}
	</div>
</AppShell>
