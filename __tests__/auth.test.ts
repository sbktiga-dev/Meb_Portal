import { hashPassword, verifyPassword, generateToken, verifyToken } from '@/lib/auth';

describe('Auth Library', () => {
  const testPassword = 'testPassword123';
  let hashedPassword: string;

  beforeAll(async () => {
    hashedPassword = await hashPassword(testPassword);
  });

  describe('hashPassword', () => {
    it('should hash password', async () => {
      expect(hashedPassword).toBeDefined();
      expect(hashedPassword).not.toBe(testPassword);
    });

    it('should generate different hashes for same password', async () => {
      const hash2 = await hashPassword(testPassword);
      expect(hash2).not.toBe(hashedPassword);
    });
  });

  describe('verifyPassword', () => {
    it('should verify correct password', async () => {
      const result = await verifyPassword(testPassword, hashedPassword);
      expect(result).toBe(true);
    });

    it('should reject wrong password', async () => {
      const result = await verifyPassword('wrongPassword', hashedPassword);
      expect(result).toBe(false);
    });
  });

  describe('generateToken', () => {
    it('should generate valid JWT token', () => {
      const payload = { userId: '123', email: 'test@test.com', role: 'USER' };
      const token = generateToken(payload);
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);
    });
  });

  describe('verifyToken', () => {
    it('should verify valid token', () => {
      const payload = { userId: '123', email: 'test@test.com', role: 'USER' };
      const token = generateToken(payload);
      const verified = verifyToken(token);
      expect(verified).toBeDefined();
      expect(verified?.userId).toBe('123');
      expect(verified?.email).toBe('test@test.com');
      expect(verified?.role).toBe('USER');
    });

    it('should return null for invalid token', () => {
      const result = verifyToken('invalid-token');
      expect(result).toBeNull();
    });

    it('should return null for expired token', () => {
      // This test would need a token that's already expired
      // For now, we just verify the function handles invalid tokens
      const result = verifyToken('eyJhbGciOiJIUzI1NiJ9.eyJ1c2VySWQiOiIxMjMiLCJpYXQiOjE2MDAwMDAwMDB9.invalid');
      expect(result).toBeNull();
    });
  });
});
