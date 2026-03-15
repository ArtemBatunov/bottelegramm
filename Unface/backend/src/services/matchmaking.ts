import { prisma } from '../lib/prisma';

export async function findMatch(userId: number): Promise<number | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { school: true },
  });

  if (!user) return null;
  if (user.chatStatus !== 'searching') return null;

  // Age ±1 year: same school, 14-16 if user is 15
  const minBirth = new Date(user.birthDate);
  minBirth.setFullYear(minBirth.getFullYear() - 1);
  const maxBirth = new Date(user.birthDate);
  maxBirth.setFullYear(maxBirth.getFullYear() + 1);

  // Users from same school, age ±1, not in chat, not previously chatted
  const previousChatUserIds = await prisma.chat.findMany({
    where: {
      OR: [{ user1Id: userId }, { user2Id: userId }],
    },
    select: {
      user1Id: true,
      user2Id: true,
    },
  });

  const excludedIds = new Set<number>([userId]);
  previousChatUserIds.forEach((c) => {
    excludedIds.add(c.user1Id);
    excludedIds.add(c.user2Id);
  });

  const candidates = await prisma.user.findMany({
    where: {
      schoolId: user.schoolId,
      id: { notIn: Array.from(excludedIds) },
      chatStatus: 'searching',
      banStatus: false,
      birthDate: {
        gte: minBirth,
        lte: maxBirth,
      },
    },
    select: { id: true },
  });

  if (candidates.length === 0) return null;

  const random = candidates[Math.floor(Math.random() * candidates.length)];
  return random.id;
}
