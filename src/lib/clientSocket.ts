import { io } from 'socket.io-client';

export let socket = io();
export const reloadSocket = () => {
	socket.disconnect();
	socket.connect();
};
