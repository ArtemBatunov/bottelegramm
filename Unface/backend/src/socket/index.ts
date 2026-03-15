import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import validator from 'validator';
import { prisma } from '../lib/prisma';

interface AuthenticatedSocket {
  userId: number;
}

export function setupSocket(io: Server) {
  io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) {
      return next(new Error('Требуется авторизация'));
    }
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: number };
      (socket as any).userId = decoded.userId;
      next();
    } catch {
      next(new Error('Недействительный токен'));
    }
  });

  io.on('connection', (socket) => {
    const userId = (socket as any).userId;

    socket.on('join_chat', async (chatId: number) => {
      const chat = await prisma.chat.findFirst({
        where: {
          id: chatId,
          OR: [{ user1Id: userId }, { user2Id: userId }],
          status: 'active',
        },
      });

      if (chat) {
        socket.join(`chat:${chatId}`);
      }
    });

    socket.on('send_message', async (data: { chatId: number; text: string }) => {
      const { chatId, text } = data;

      const chat = await prisma.chat.findFirst({
        where: {
          id: chatId,
          OR: [{ user1Id: userId }, { user2Id: userId }],
          status: 'active',
        },
      });

      if (!chat || !text?.trim()) return;

      const sanitizedText = validator.escape(validator.trim(text)).slice(0, 1000);
      if (!sanitizedText) return;

      const message = await prisma.message.create({
        data: {
          chatId,
          userId,
          text: sanitizedText,
        },
      });

      io.to(`chat:${chatId}`).emit('receive_message', {
        id: message.id,
        text: message.text,
        userId: message.userId,
        createdAt: message.createdAt,
      });
    });

    socket.on('next_chat', async (chatId: number) => {
      const chat = await prisma.chat.findFirst({
        where: {
          id: chatId,
          OR: [{ user1Id: userId }, { user2Id: userId }],
          status: 'active',
        },
      });

      if (chat) {
        io.to(`chat:${chatId}`).emit('disconnect_chat');
        await prisma.chat.update({
          where: { id: chatId },
          data: { status: 'closed' },
        });
        await prisma.user.updateMany({
          where: { id: { in: [chat.user1Id, chat.user2Id] } },
          data: { chatStatus: 'idle' },
        });
      }
    });

    socket.on('disconnect', () => {
      // Optional: update user status on disconnect
    });
  });
}
