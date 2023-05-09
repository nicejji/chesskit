import prisma from '$lib/prisma';
import type { PageServerLoad } from './$types';
import type { Actions } from '@sveltejs/kit';

export let load: PageServerLoad = async ({ locals }) => {
	const user = await prisma.user.findUnique({
		where: { id: locals.user.id },
		include: {
			recievedInvites: {
				include: {
					from: true
				}
			},
			sentInvites: {
				include: {
					to: true
				}
			},
			currentGame: {
				include: {
					players: true
				}
			}
		}
	});
  const games = await prisma.game.findMany({where: {
    OR: [{winnerId: locals.user.id}, {loserId: locals.user.id}]
  }, orderBy: {endedAt: 'desc'}, include: {winner: true, loser: true}})
	return {
    games,
		currentGame: user?.currentGame,
		recievedInvites: user?.recievedInvites,
		sentInvites: user?.sentInvites
	};
};

export const actions: Actions = {
	closeRoom: async ({ locals }) => {
		await prisma.user.update({
			where: {
				id: locals.user.id
			},
			data: {
				isFindingGame: false
			}
		});
	},
	openRoom: async ({ locals }) => {
		await prisma.user.update({
			where: {
				id: locals.user.id
			},
			data: {
				isFindingGame: true
			}
		});
	}
};
