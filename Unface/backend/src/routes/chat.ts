import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { sanitizeString } from '../utils/sanitize';
import { AppError } from '../middleware/errorHandler';
import { emitChatClosed } from '../lib/socketIo';

export const chatRouter = Router();

chatRouter.use(authMiddleware);

chatRouter.get('/current', async (req: AuthRequest, res, next) => {
  try {
    const chat = await prisma.chat.findFirst({
      where: {
        OR: [{ user1Id: req.userId! }, { user2Id: req.userId! }],
        status: 'active',
      },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            text: true,
            userId: true,
            createdAt: true,
          },
        },
      },
    });

    if (!chat) {
      return res.json({ chat: null });
    }

    const partnerId = chat.user1Id === req.userId ? chat.user2Id : chat.user1Id;

    res.json({
      chat: {
        id: chat.id,
        partnerId,
        messages: chat.messages,
        createdAt: chat.createdAt,
      },
    });
  } catch (e) {
    next(e);
  }
});

chatRouter.get('/history', async (req: AuthRequest, res, next) => {
  try {
    const chats = await prisma.chat.findMany({
      where: {
        OR: [{ user1Id: req.userId! }, { user2Id: req.userId! }],
        status: 'closed',
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          take: 5,
          select: { text: true, userId: true },
        },
      },
    });

    res.json({
      chats: chats.map((c) => ({
        id: c.id,
        createdAt: c.createdAt,
        lastMessages: c.messages,
      })),
    });
  } catch (e) {
    next(e);
  }
});

chatRouter.post('/report', async (req: AuthRequest, res, next) => {
  try {
    const { chatId, reason } = req.body;

    const chat = await prisma.chat.findFirst({
      where: {
        id: chatId,
        OR: [{ user1Id: req.userId! }, { user2Id: req.userId! }],
        status: 'active',
      },
    });

    if (!chat) {
      throw new AppError('Чат не найден', 404);
    }

    const cleanReason = sanitizeString(reason || 'Жалоба', 500);

    await prisma.report.create({
      data: {
        chatId: chat.id,
        fromUserId: req.userId!,
        reason: cleanReason,
      },
    });

    await prisma.chat.update({
      where: { id: chat.id },
      data: { reportStatus: 'pending', status: 'closed' },
    });

    await prisma.user.updateMany({
      where: { id: { in: [chat.user1Id, chat.user2Id] } },
      data: { chatStatus: 'idle' },
    });

    emitChatClosed(chat.id);

    res.status(201).json({ message: 'Жалоба отправлена' });
  } catch (e) {
    next(e);
  }
});
