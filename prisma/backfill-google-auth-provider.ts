// One-off manual backfill for the authProvider data bug (see
// src/users/users.service.ts#backfillGoogleAuthProvider, which contains the
// exact same logic and is unit-tested).
//
// The `20260806120000_backfill_google_auth_provider` migration already
// applies this fix automatically to every database that runs
// `prisma migrate deploy`. This script exists as a manual escape hatch for
// running the same idempotent fix on demand (e.g. against a database that
// was seeded/restored without running that migration).
//
// Usage: pnpm backfill:google-auth-provider
import { PrismaClient } from '../generated/prisma/client';

const prisma = new PrismaClient();

async function main() {
  const { count } = await prisma.user.updateMany({
    where: {
      googleId: { not: null },
      passwordHash: null,
      authProvider: 'email',
    },
    data: { authProvider: 'google' },
  });

  console.log(`Backfilled authProvider to 'google' for ${count} user(s).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
