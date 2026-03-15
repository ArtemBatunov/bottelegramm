import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { sanitizeString } from '../utils/sanitize';

export const userRouter = Router();

userRouter.use(authMiddleware);

userRouter.get('/profile', async (req: AuthRequest, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        id: true,
        email: true,
        schoolId: true,
        phoneNumber: true,
        birthDate: true,
        chatStatus: true,
        school: { select: { name: true } },
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    res.json(user);
  } catch (e) {
    next(e);
  }
});

userRouter.put('/profile', async (req: AuthRequest, res, next) => {
  try {
    const { phoneNumber } = req.body;

    const data: { phoneNumber?: string | null } = {};
    if (phoneNumber !== undefined) {
      data.phoneNumber = phoneNumber ? sanitizeString(phoneNumber, 20) : null;
    }

    const user = await prisma.user.update({
      where: { id: req.userId },
      data,
      select: {
        id: true,
        email: true,
        schoolId: true,
        phoneNumber: true,
        birthDate: true,
        school: { select: { name: true } },
      },
    });

    res.json(user);
  } catch (e) {
    next(e);
  }
});
