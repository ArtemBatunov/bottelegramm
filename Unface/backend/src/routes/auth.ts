import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { sanitizeEmail, sanitizeString } from '../utils/sanitize';
import { AppError } from '../middleware/errorHandler';
import validator from 'validator';

export const authRouter = Router();

const JWT_EXPIRES = '7d';

function calculateAge(birthDate: Date): number {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

authRouter.post('/register', async (req, res, next) => {
  try {
    const { email, password, confirmPassword, school, birthDate, phoneNumber, policyAgreed } = req.body;

    if (!policyAgreed) {
      throw new AppError('Необходимо согласие с политикой конфиденциальности', 400);
    }

    const cleanEmail = sanitizeEmail(email);
    if (!validator.isEmail(cleanEmail)) {
      throw new AppError('Некорректный email', 400);
    }

    if (password !== confirmPassword) {
      throw new AppError('Пароли не совпадают', 400);
    }

    if (password.length < 6) {
      throw new AppError('Пароль должен быть не менее 6 символов', 400);
    }

    const schoolName = sanitizeString(school, 100);
    if (!schoolName) {
      throw new AppError('Укажите школу', 400);
    }

    const birth = new Date(birthDate);
    if (isNaN(birth.getTime())) {
      throw new AppError('Некорректная дата рождения', 400);
    }

    const age = calculateAge(birth);
    if (age < 14) {
      throw new AppError('Регистрация доступна с 14 лет', 400);
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (existingUser) {
      throw new AppError('Пользователь с таким email уже существует', 409);
    }

    let schoolRecord = await prisma.school.findFirst({
      where: { name: schoolName },
    });

    if (!schoolRecord) {
      schoolRecord = await prisma.school.create({
        data: { name: schoolName },
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const phone = phoneNumber ? sanitizeString(phoneNumber, 20) : null;

    const user = await prisma.user.create({
      data: {
        email: cleanEmail,
        password: hashedPassword,
        schoolId: schoolRecord.id,
        birthDate: birth,
        phoneNumber: phone,
        policyAgreed: true,
      },
    });

    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET!,
      { expiresIn: JWT_EXPIRES }
    );

    res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        schoolId: user.schoolId,
      },
    });
  } catch (e) {
    next(e);
  }
});

authRouter.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const cleanEmail = sanitizeEmail(email);
    if (!validator.isEmail(cleanEmail)) {
      throw new AppError('Некорректный email', 400);
    }

    const user = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (!user) {
      throw new AppError('Неверный email или пароль', 401);
    }

    if (user.banStatus) {
      throw new AppError('Ваш аккаунт заблокирован', 403);
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      throw new AppError('Неверный email или пароль', 401);
    }

    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET!,
      { expiresIn: JWT_EXPIRES }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        schoolId: user.schoolId,
      },
    });
  } catch (e) {
    next(e);
  }
});

authRouter.post('/logout', (_req, res) => {
  res.json({ message: 'Выход выполнен' });
});

authRouter.get('/me', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        id: true,
        email: true,
        schoolId: true,
        birthDate: true,
        chatStatus: true,
        school: { select: { name: true } },
      },
    });

    if (!user) {
      throw new AppError('Пользователь не найден', 404);
    }

    res.json(user);
  } catch (e) {
    next(e);
  }
});
