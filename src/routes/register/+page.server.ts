import { fail, type Actions, redirect } from '@sveltejs/kit';
import { createToken, createUser, getUserByName, parseForm } from '$lib/server/auth';

export const actions: Actions = {
	default: async (event) => {
		const { error, data } = parseForm(await event.request.formData());
		if (error || !data) return fail(400, { message: error });
		if (await getUserByName(data.username || ''))
			return fail(400, { message: 'Пользователь с таким именем уже существует.' });
		const user = await createUser(data.username, data.password);
		if (!user) return fail(500, { message: 'Произошла неизвестная ошибка.' });
		const token = await createToken(user.id);
		event.cookies.set('token', token, { secure: false, httpOnly: false });
		throw redirect(303, '/app/profile');
	}
};
