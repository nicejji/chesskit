import prisma from '$lib/prisma';
import type { Actions } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const actions: Actions = {
	findUsers: async ({ request, locals }) => {
		const formData = await request.formData();
		const query = String(formData.get('query')) || '';
		const foundUsers = await prisma.user.findMany({ where: { name: { contains: query } } });
		return {
			foundUsers: foundUsers.filter(
				(u) => u.isFindingGame && u.gameId === null && u.id !== locals.user.id
			)
		};
	}
};

export const load: PageServerLoad = async ({ locals }) => {
	const foundUsers = await prisma.user.findMany();
	return {
		foundUsers: foundUsers.filter(
			(u) => u.isFindingGame && u.gameId === null && u.id !== locals.user.id
		)
	};
};
