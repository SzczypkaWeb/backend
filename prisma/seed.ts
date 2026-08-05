import { PrismaClient } from '../generated/prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding service categories...');

  // Seed top-level categories matching the marketplace mockup
  const topLevelCategories = [
    { name: 'Hydraulik', slug: 'hydraulik' },
    { name: 'Elektryk', slug: 'elektryk' },
    { name: 'Sprzątanie', slug: 'sprzatanie' },
    { name: 'Przeprowadzki', slug: 'przeprowadzki' },
    { name: 'Remonty', slug: 'remonty' },
    { name: 'Ogrodnictwo', slug: 'ogrodnictwo' },
    { name: 'Transport', slug: 'transport' },
    { name: 'Informatyka', slug: 'informatyka' },
    { name: 'Fotografia', slug: 'fotografia' },
  ];

  for (const category of topLevelCategories) {
    await prisma.serviceCategory.upsert({
      where: { slug: category.slug },
      update: {},
      create: {
        name: category.name,
        slug: category.slug,
      },
    });
  }

  console.log('Service categories seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
