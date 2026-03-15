import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { sanitizeString } from '../utils/sanitize';
import { AppError } from '../middleware/errorHandler';

export const adminRouter = Router();

// Simple admin check - in production use proper role-based auth
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@oneface.ru';

async function adminCheck(req: AuthRequest, res: any, next: any) {
  const user = await prisma.user.findUnique({
    where: { id: req.userId },
  });
  if (!user || user.email !== ADMIN_EMAIL) {
    return res.status(403).json({ error: 'Доступ запрещён' });
  }
  next();
}

adminRouter.use(authMiddleware, adminCheck);

adminRouter.get('/users', async (_req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        schoolId: true,
        birthDate: true,
        chatStatus: true,
        banStatus: true,
        createdAt: true,
        school: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ users });
  } catch (e) {
    next(e);
  }
});

adminRouter.get('/chats', async (_req, res, next) => {
  try {
    const chats = await prisma.chat.findMany({
      include: {
        user1: { select: { id: true, email: true } },
        user2: { select: { id: true, email: true } },
        _count: { select: { messages: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ chats });
  } catch (e) {
    next(e);
  }
});

adminRouter.get('/reports', async (_req, res, next) => {
  try {
    const reports = await prisma.report.findMany({
      include: {
        chat: {
          include: {
            user1: { select: { id: true, email: true } },
            user2: { select: { id: true, email: true } },
          },
        },
        fromUser: { select: { id: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ reports });
  } catch (e) {
    next(e);
  }
});

adminRouter.post('/ban-user', async (req: AuthRequest, res, next) => {
  try {
    const { userId } = req.body;
    const id = parseInt(userId, 10);

    if (isNaN(id)) {
      throw new AppError('Некорректный ID пользователя', 400);
    }

    await prisma.user.update({
      where: { id },
      data: { banStatus: true },
    });

    res.json({ message: 'Пользователь заблокирован' });
  } catch (e) {
    next(e);
  }
});
