import prisma from '$lib/prisma';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const game = await prisma.game.findUnique({ where: { id: locals.user.gameId || -1 } });
	if (!game) throw redirect(303, '/app/profile/');
	return {
		game
	};
};
