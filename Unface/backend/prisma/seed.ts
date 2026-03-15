import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Demo schools
  const school1 = await prisma.school.upsert({
    where: { name: 'Школа №1' },
    update: {},
    create: { name: 'Школа №1' },
  });

  const school2 = await prisma.school.upsert({
    where: { name: 'Лицей №2' },
    update: {},
    create: { name: 'Лицей №2' },
  });

  const school3 = await prisma.school.upsert({
    where: { name: 'Гимназия №3' },
    update: {},
    create: { name: 'Гимназия №3' },
  });

  const hashedPassword = await bcrypt.hash('password123', 10);

  // Demo users (age 14-16, birth dates 2008-2010)
  const users = [
    { email: 'student1@school.ru', schoolId: school1.id, birthDate: new Date('2009-05-15') },
    { email: 'student2@school.ru', schoolId: school1.id, birthDate: new Date('2009-08-20') },
    { email: 'student3@school.ru', schoolId: school1.id, birthDate: new Date('2010-01-10') },
    { email: 'student4@school.ru', schoolId: school1.id, birthDate: new Date('2008-11-25') },
    { email: 'student5@school.ru', schoolId: school2.id, birthDate: new Date('2009-03-08') },
    { email: 'student6@school.ru', schoolId: school2.id, birthDate: new Date('2010-06-12') },
    { email: 'admin@oneface.ru', schoolId: school1.id, birthDate: new Date('1990-01-01') },
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        email: u.email,
        password: hashedPassword,
        schoolId: u.schoolId,
        phoneNumber: '+79001234567',
        birthDate: u.birthDate,
        policyAgreed: true,
      },
    });
  }

  console.log('Seed completed: schools and demo users created.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
