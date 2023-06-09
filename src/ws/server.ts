import { Server, type Socket } from 'socket.io';
import type { ViteDevServer } from 'vite';
import { PrismaClient, type Game, type User } from '@prisma/client';
import * as jose from 'jose';
import { Chess } from 'chess.js';

const prisma = new PrismaClient();
const PRIVATE_SECRET_KEY = 'f649a308d86966f34ff262a40258d6a77a62d0fcae100e82d6c9e20c1b2d7498';
const MS_TO_AUTOLOSE = 60000;

const getTokenFromCookies = (cookiesString: string) => {
	const parsed = Object.fromEntries(cookiesString.split(';').map((c) => c.split('=')));
	return parsed['token'] || null;
};

const getUserFromToken = async (token: string) => {
	try {
		const {
			payload: { id }
		} = await jose.jwtVerify(token, new TextEncoder().encode(PRIVATE_SECRET_KEY));
		return await prisma.user.findUnique({ where: { id: id as number } });
	} catch {
		return null;
	}
};

const authUser = async (socket: Socket) => {
	const token = getTokenFromCookies(socket.request.headers?.cookie || '');
	const user = token ? await getUserFromToken(token) : null;
	if (user) {
		activeClients.push({ user, socket });
		socket.on('disconnect', () => {
			activeClients = activeClients.filter((client) => client.socket !== socket);
		});
		return user;
	} else {
		return null;
	}
};

let activeClients: { user: User; socket: Socket }[] = [];

const findClient = (id: number) => {
	return activeClients.find((c) => c.user.id === id);
};

const handleInvite = async (from: User, toId: number) => {
	const to = await prisma.user.findUnique({ where: { id: toId } });
	if (!to) return;
	const sentInvites = await prisma.invite.findMany({ where: { fromId: from.id, toId } });
	if (sentInvites.length) return;
	const invite = await prisma.invite.create({ data: { fromId: from.id, toId: to.id } });
	const recipient = findClient(toId);
	if (recipient)
		recipient.socket.emit('invite', {
			from,
			invite
		});
};

const handleReject = async (from: User, inviteId: number) => {
	const invite = await prisma.invite.findUnique({ where: { id: inviteId } });
	if (!invite || invite.toId !== from.id) return;
	await prisma.invite.delete({ where: { id: inviteId } });
	const recipient = findClient(invite.fromId);
	if (recipient) recipient.socket.emit('reject', { from });
};

let timeOuts: { game: Game; timeOutId: ReturnType<typeof setTimeout> }[] = [];
const findTimeout = (gameId: number) => timeOuts.find((t) => t.game.id === gameId);
const deleteTimeout = (gameId: number) => {
	const t = findTimeout(gameId);
	clearTimeout(t?.timeOutId);
	timeOuts = timeOuts.filter((t) => t.game.id !== gameId);
};

const handleConfirm = async (socket: Socket, from: User, inviteId: number) => {
	const invite = await prisma.invite.findUnique({ where: { id: inviteId } });
	if (!invite || invite.toId !== from.id) return;
	const isBusy =
		(await prisma.user.findUnique({ where: { id: invite.fromId } }))?.gameId !== null ||
		(await prisma.user.findUnique({ where: { id: invite.toId } }))?.gameId !== null;
	if (isBusy) return;
	await prisma.invite.delete({ where: { id: inviteId } });
	const recipient = findClient(invite.fromId);
	const game = await prisma.game.create({
		data: {
			whitePlayerId: invite.fromId,
			blackPlayerId: invite.toId,
			FEN: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
		}
	});
	await prisma.user.update({ where: { id: invite.fromId }, data: { gameId: game.id } });
	await prisma.user.update({ where: { id: invite.toId }, data: { gameId: game.id } });
	const updated = await prisma.user.findUnique({ where: { id: invite.fromId } });
	if (!updated) return;
	timeOuts.push({
		game,
		timeOutId: setTimeout(() => handleSurrender(updated), MS_TO_AUTOLOSE)
	});
	socket.emit('confirmation', { from });
	if (recipient) recipient.socket.emit('confirmation', { from });
};

const endGame = async (game: Game, winnerId: number, loserId: number) => {
	deleteTimeout(game.id);
	await prisma.game.update({
		where: { id: game.id },
		data: { loserId, winnerId, endedAt: new Date() }
	});
	await prisma.user.update({ where: { id: game.blackPlayerId }, data: { gameId: null } });
	await prisma.user.update({ where: { id: game.whitePlayerId }, data: { gameId: null } });
};

const handleSurrender = async (from: User) => {
	const game = await prisma.game.findUnique({ where: { id: from.gameId || -1 } });
	if (!game) return;
	const winnerId = game.blackPlayerId !== from.id ? game.blackPlayerId : game.whitePlayerId;
	const loserId = game.blackPlayerId === winnerId ? game.whitePlayerId : game.blackPlayerId;
	await endGame(game, winnerId, loserId);
	const winnerClient = findClient(winnerId);
	winnerClient?.socket?.emit('surrender');
};

export const webSocketServer = {
	name: 'webSocketServer',
	configureServer(server: ViteDevServer) {
		const io = new Server(server.httpServer as any);

		io.on('connect', async (socket) => {
			const user = await authUser(socket);
			if (!user) return socket.disconnect();

			socket.on('invite', async (toId) => await handleInvite(user, toId));
			socket.on('reject', async (inviteId) => await handleReject(user, inviteId));
			socket.on('confirm', async (inviteId) => await handleConfirm(socket, user, inviteId));
			socket.on('surrender', async () => await handleSurrender(user));

			// implementing game itself
			socket.on('move', async (move) => {
				const game = await prisma.game.findUnique({ where: { id: user.gameId || -1 } });
				if (!game) return;
				deleteTimeout(game.id);
				const chess = new Chess(game.FEN);
				if (chess.isCheckmate()) {
					const turn = chess.turn();
					const loserId = turn === 'w' ? game.whitePlayerId : game.blackPlayerId;
					const winnerId = loserId === game.whitePlayerId ? game.blackPlayerId : game.whitePlayerId;
					endGame(game, winnerId, loserId);
					const winnerPlayer = findClient(winnerId);
					const loserPlayer = findClient(loserId);
					winnerPlayer?.socket?.emit('win');
					loserPlayer?.socket?.emit('lose');
					return;
				}
				try {
					chess.move(move);
					const fen = chess.fen();
					await prisma.game.update({ where: { id: game.id }, data: { FEN: fen } });
					const blackPlayer = findClient(game.blackPlayerId);
					const whitePlayer = findClient(game.whitePlayerId);
					blackPlayer?.socket?.emit('move', fen);
					whitePlayer?.socket?.emit('move', fen);
					const blackUser = await prisma.user.findUnique({ where: { id: game.blackPlayerId } });
					const whiteUser = await prisma.user.findUnique({ where: { id: game.whitePlayerId } });
					if (!blackUser || !whiteUser) return;
					timeOuts.push({
						game,
						timeOutId: setTimeout(
							() => handleSurrender(chess.turn() === 'w' ? whiteUser : blackUser),
							MS_TO_AUTOLOSE
						)
					});
				} catch {
					socket.emit('moveReject');
				}
			});
			// implementing game itself
		});
	}
};
