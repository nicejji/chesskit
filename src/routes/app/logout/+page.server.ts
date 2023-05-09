import { redirect, type Actions } from '@sveltejs/kit';

export const actions: Actions = {
	default: async (event) => {
		event.cookies.delete('token', { path: '/' });
		throw redirect(303, '/');
	}
};
