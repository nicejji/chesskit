<script lang="ts">
	import { applyAction, enhance } from '$app/forms';
	import { modalStore } from '@skeletonlabs/skeleton';

	export let title: string;
</script>

<h3>{title}</h3>
<form
	use:enhance={() => {
		return ({ result }) => {
			if (result.type === 'failure') {
				modalStore.trigger({
					type: 'alert',
					title: 'Что-то пошло не так...',
					body: result?.data?.message,
					buttonTextCancel: 'Попробовать снова'
				});
			} else {
				applyAction(result);
			}
		};
	}}
	method="POST"
	class="flex flex-col gap-3 card p-4"
>
	<label class="label">
		<span>Имя пользователя</span>
		<input name="username" class="input" type="text" placeholder="Имя пользователя" />
	</label>
	<label class="label">
		<span>Пароль</span>
		<input name="password" class="input" type="password" placeholder="Пароль" />
	</label>
	<button class="btn variant-filled-success">Продолжить</button>
</form>
