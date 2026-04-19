import type { Server } from 'socket.io';

let io: Server | null = null;

export function attachSocketIo(server: Server) {
  io = server;
}

export function emitChatClosed(chatId: number) {
  io?.to(`chat:${chatId}`).emit('disconnect_chat');
}
