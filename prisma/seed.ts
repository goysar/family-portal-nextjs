import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Create admin user
  const adminPassword = await hash('admin123', 12);
  const admin = await prisma.familyMember.upsert({
    where: { email: 'admin@family.com' },
    update: {},
    create: {
      email: 'admin@family.com',
      password: adminPassword,
      firstName: 'Admin',
      lastName: 'User',
      gender: 'male',
      dateOfBirth: new Date('1990-01-01'),
      placeOfBirth: 'Unknown',
      role: 'admin',
    },
  });

  console.log({ admin });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 