import { Prisma } from '../../generated/prisma/client';

// Regression test for the generated Prisma Client staying in sync with
// prisma/schema.prisma.
//
// The Listing model's `location` and `viewCount` fields were added to
// prisma/schema.prisma (see the `add_location_to_listing` and
// `add_listing_view_count` migrations) but the generated client under
// `generated/prisma` was never regenerated. Because that directory is a
// build artifact (gitignored, produced by `prisma generate`), the checked-in
// source kept compiling against a stale `Listing` type that was missing
// both fields entirely.
//
// That stale type is what caused ESLint's type-aware rules to report
// "Unsafe member access .viewCount on a type that cannot be resolved" in
// listings.controller.spec.ts, and forced `any`/eslint-disable workarounds
// in ListingsService#findAll.
//
// If the generated client ever drifts from schema.prisma again, this file
// will fail to type-check (ts-jest compiles it as part of running the
// suite), turning a confusing downstream lint error into an obvious,
// on-point test failure.
describe('generated Prisma client / schema.prisma sync (Listing model)', () => {
  it('exposes `location` on Prisma.ListingWhereInput, matching the schema field', () => {
    const where: Prisma.ListingWhereInput = {
      location: { contains: 'Warsaw', mode: 'insensitive' },
    };

    expect(where.location).toEqual({ contains: 'Warsaw', mode: 'insensitive' });
  });

  it('exposes `viewCount` on Prisma.ListingUpdateInput, matching the schema field', () => {
    const data: Prisma.ListingUpdateInput = {
      viewCount: { increment: 1 },
    };

    expect(data.viewCount).toEqual({ increment: 1 });
  });
});
