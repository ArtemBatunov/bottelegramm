import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { findMatch } from '../services/matchmaking';
import { AppError } from '../middleware/errorHandler';

export const matchmakingRouter = Router();

matchmakingRouter.use(authMiddleware);

matchmakingRouter.post('/find-chat', async (req: AuthRequest, res, next) => {
  try {
    const userId = req.userId!;

    await prisma.user.update({
      where: { id: userId },
      data: { chatStatus: 'searching' },
    });

    const matchId = await findMatch(userId);

    if (!matchId) {
      // Оставляем пользователя в режиме поиска — он будет ждать, пока кто-то ещё нажмёт "Найти чат"
      return res.status(202).json({
        waiting: true,
        message: 'Ожидание собеседника... Нажмите "Отменить поиск", чтобы выйти.',
      });
    }

    const [user1Id, user2Id] = [userId, matchId].sort((a, b) => a - b);

    const existingChat = await prisma.chat.findFirst({
      where: {
        user1Id,
        user2Id,
        status: 'active',
      },
    });

    if (existingChat) {
      throw new AppError('Чат уже существует', 409);
    }

    const chat = await prisma.chat.create({
      data: {
        user1Id,
        user2Id,
        status: 'active',
      },
    });

    await prisma.user.updateMany({
      where: { id: { in: [userId, matchId] } },
      data: { chatStatus: 'in_chat' },
    });

    res.status(201).json({
      chatId: chat.id,
      partnerId: matchId,
    });
  } catch (e) {
    next(e);
  }
});

matchmakingRouter.post('/next-chat', async (req: AuthRequest, res, next) => {
  try {
    const userId = req.userId!;

    const activeChat = await prisma.chat.findFirst({
      where: {
        OR: [{ user1Id: userId }, { user2Id: userId }],
        status: 'active',
      },
    });

    if (activeChat) {
      await prisma.chat.update({
        where: { id: activeChat.id },
        data: { status: 'closed' },
      });

      await prisma.user.updateMany({
        where: { id: { in: [activeChat.user1Id, activeChat.user2Id] } },
        data: { chatStatus: 'idle' },
      });
    }

    await prisma.user.update({
      where: { id: userId },
      data: { chatStatus: 'searching' },
    });

    const matchId = await findMatch(userId);

    if (!matchId) {
      await prisma.user.update({
        where: { id: userId },
        data: { chatStatus: 'idle' },
      });
      throw new AppError('Нет доступных пользователей для чата', 404);
    }

    const [user1Id, user2Id] = [userId, matchId].sort((a, b) => a - b);

    const chat = await prisma.chat.create({
      data: {
        user1Id,
        user2Id,
        status: 'active',
      },
    });

    await prisma.user.updateMany({
      where: { id: { in: [userId, matchId] } },
      data: { chatStatus: 'in_chat' },
    });

    res.status(201).json({
      chatId: chat.id,
      partnerId: matchId,
    });
  } catch (e) {
    next(e);
  }
});

matchmakingRouter.post('/stop-search', async (req: AuthRequest, res, next) => {
  try {
    await prisma.user.update({
      where: { id: req.userId! },
      data: { chatStatus: 'idle' },
    });
    res.json({ message: 'Поиск остановлен' });
  } catch (e) {
    next(e);
  }
});
