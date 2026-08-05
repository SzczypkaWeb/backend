import {
  Prisma,
  AuthProvider,
  UserStatus,
  VerificationStatus,
  ServiceRequestStatus,
  QuoteStatus,
} from '../../generated/prisma/client';

// Contract test for the service-marketplace domain added to prisma/schema.prisma.
//
// This test is written *before* the schema/migration exists, following this
// repo's TDD-lite convention and the precedent set by
// `listings.prisma-schema-sync.spec.ts`: it pins down, at the type and
// runtime-enum level, the exact shape the task specification asks for. Until
// the schema is migrated and the client regenerated, this file will fail to
// compile - that's the expected "red" state.
//
// It intentionally checks the generated Prisma namespace types (WhereInput /
// CreateInput / UpdateInput) rather than hitting a real database, so it runs
// as a fast, isolated unit test without needing Postgres.
describe('prisma marketplace schema', () => {
  describe('User extensions', () => {
    it('adds authProvider, verification and status fields without touching existing fields', () => {
      const data: Prisma.UserCreateInput = {
        email: 'provider@example.com',
        authProvider: AuthProvider.google,
        emailVerifiedAt: new Date(),
        phone: '+48123456789',
        phoneVerifiedAt: new Date(),
        status: UserStatus.pending_verification,
      };

      expect(data.authProvider).toBe('google');
      expect(data.status).toBe('pending_verification');
    });

    it('exposes the AuthProvider enum aligned with the existing googleId field (email | google)', () => {
      expect(AuthProvider).toEqual({ email: 'email', google: 'google' });
    });

    it('exposes the UserStatus enum with pending_verification as a plausible default', () => {
      expect(UserStatus).toEqual({
        pending_verification: 'pending_verification',
        active: 'active',
        banned: 'banned',
      });
    });
  });

  describe('ServiceCategory', () => {
    it('supports name, unique slug and a nullable self-relation parentId for subcategories', () => {
      const data: Prisma.ServiceCategoryCreateInput = {
        name: 'Plumbing',
        slug: 'plumbing',
      };
      const subcategory: Prisma.ServiceCategoryCreateInput = {
        name: 'Pipe repair',
        slug: 'pipe-repair',
        parent: { connect: { id: 'parent-id' } },
      };

      const where: Prisma.ServiceCategoryWhereUniqueInput = { slug: 'plumbing' };

      expect(data.slug).toBe('plumbing');
      expect(subcategory.parent).toBeDefined();
      expect(where.slug).toBe('plumbing');
    });
  });

  describe('ProviderProfile', () => {
    it('is a 1:1 profile keyed by a unique userId, with verification and coverage fields', () => {
      const data: Prisma.ProviderProfileCreateInput = {
        user: { connect: { id: 'user-id' } },
        nip: '1234567890',
        companyName: 'Acme Plumbing',
        companyAddress: 'Main St 1, Warsaw',
        verificationStatus: VerificationStatus.pending,
        baseLat: 52.2297,
        baseLng: 21.0122,
        baseAddress: 'Main St 1, Warsaw',
        serviceRadiusKm: 25,
        bio: null,
      };

      const where: Prisma.ProviderProfileWhereUniqueInput = { userId: 'user-id' };

      expect(data.verificationStatus).toBe('pending');
      expect(where.userId).toBe('user-id');
    });

    it('exposes the VerificationStatus enum', () => {
      expect(VerificationStatus).toEqual({
        pending: 'pending',
        verified: 'verified',
        rejected: 'rejected',
      });
    });
  });

  describe('ProviderCategory (join table)', () => {
    it('has a composite primary key of providerId + categoryId', () => {
      const where: Prisma.ProviderCategoryWhereUniqueInput = {
        providerId_categoryId: { providerId: 'provider-id', categoryId: 'category-id' },
      };

      expect(where.providerId_categoryId).toEqual({
        providerId: 'provider-id',
        categoryId: 'category-id',
      });
    });
  });

  describe('ClientProfile', () => {
    it('is a 1:1 profile keyed by a unique userId', () => {
      const data: Prisma.ClientProfileCreateInput = {
        user: { connect: { id: 'user-id' } },
      };
      const where: Prisma.ClientProfileWhereUniqueInput = { userId: 'user-id' };

      expect(data.user).toBeDefined();
      expect(where.userId).toBe('user-id');
    });
  });

  describe('ServiceRequest', () => {
    it('supports quote-vs-budget flow, geolocation, optional desired date and status', () => {
      const quoteRequest: Prisma.ServiceRequestCreateInput = {
        client: { connect: { id: 'client-id' } },
        category: { connect: { id: 'category-id' } },
        description: 'Fix a leaking pipe',
        address: 'Main St 1, Warsaw',
        lat: 52.2297,
        lng: 21.0122,
        needsQuote: true,
        budgetMin: null,
        budgetMax: null,
        desiredDate: null,
        status: ServiceRequestStatus.open,
      };

      const fixedBudgetRequest: Prisma.ServiceRequestCreateInput = {
        client: { connect: { id: 'client-id' } },
        category: { connect: { id: 'category-id' } },
        description: 'Mow the lawn',
        address: 'Side St 2, Warsaw',
        lat: 52.23,
        lng: 21.02,
        needsQuote: false,
        budgetMin: 100,
        budgetMax: 200,
        desiredDate: new Date('2026-08-20'),
        status: ServiceRequestStatus.open,
      };

      expect(quoteRequest.needsQuote).toBe(true);
      expect(fixedBudgetRequest.budgetMin).toBe(100);
    });

    it('exposes the ServiceRequestStatus enum', () => {
      expect(ServiceRequestStatus).toEqual({ open: 'open', matched: 'matched', closed: 'closed' });
    });

    it('is filterable by status + categoryId together (backing the @@index)', () => {
      const where: Prisma.ServiceRequestWhereInput = {
        status: ServiceRequestStatus.open,
        categoryId: 'category-id',
      };

      expect(where).toEqual({ status: 'open', categoryId: 'category-id' });
    });
  });

  describe('RequestPhoto', () => {
    it('belongs to a request and has an ordering field', () => {
      const data: Prisma.RequestPhotoCreateInput = {
        request: { connect: { id: 'request-id' } },
        url: 'https://example.com/photo.jpg',
        sortOrder: 0,
      };

      expect(data.sortOrder).toBe(0);
    });
  });

  describe('Quote', () => {
    it('links a request and a provider with a price, optional message and status', () => {
      const data: Prisma.QuoteCreateInput = {
        request: { connect: { id: 'request-id' } },
        provider: { connect: { id: 'provider-id' } },
        price: new Prisma.Decimal(199.99),
        message: null,
        status: QuoteStatus.pending,
      };

      expect(data.status).toBe('pending');
    });

    it('exposes the QuoteStatus enum', () => {
      expect(QuoteStatus).toEqual({
        pending: 'pending',
        accepted: 'accepted',
        rejected: 'rejected',
      });
    });

    it('is filterable by requestId (backing the @@index)', () => {
      const where: Prisma.QuoteWhereInput = { requestId: 'request-id' };
      expect(where.requestId).toBe('request-id');
    });
  });

  describe('PhoneOtp', () => {
    it('belongs to a user and tracks a code, expiry and optional verification time', () => {
      const data: Prisma.PhoneOtpCreateInput = {
        user: { connect: { id: 'user-id' } },
        code: '123456',
        expiresAt: new Date(Date.now() + 5 * 60_000),
        verifiedAt: null,
      };

      expect(data.code).toBe('123456');
      expect(data.verifiedAt).toBeNull();
    });
  });
});
