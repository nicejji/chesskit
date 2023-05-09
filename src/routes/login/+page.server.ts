import { fail, type Actions, redirect } from '@sveltejs/kit';
import bcrypt from 'bcrypt';
import { createToken, getUserByName, parseForm } from '$lib/server/auth';

export const actions: Actions = {
	default: async (event) => {
		const { error, data } = parseForm(await event.request.formData());
		if (error || !data) return fail(400, { message: error });
		const user = await getUserByName(data.username);
		if (!user) return fail(400, { message: 'Пользователя с таким именем не существует.' });
		if (!(await bcrypt.compare(data.password, user.passwordHash)))
			return fail(400, { message: 'Пароль от аккаунта не совпадает.' });
		const token = await createToken(user.id);
		event.cookies.set('token', token, { secure: false, httpOnly: false });
		throw redirect(303, '/app/profile');
	}
};
