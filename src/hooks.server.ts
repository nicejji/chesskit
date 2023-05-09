import { getUserFromToken } from '$lib/server/auth';
import { redirect, type Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
	const user = await getUserFromToken(event.cookies.get('token') ?? '');
	if (user) event.locals.user = user;
	if (!user && event.url.pathname.startsWith('/app')) throw redirect(303, '/');
	if (user && !event.url.pathname.startsWith('/app')) throw redirect(303, '/app/profile');
	return await resolve(event);
};
