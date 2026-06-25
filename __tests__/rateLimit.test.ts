import { rateLimit, checkRateLimit, getRateLimitHeaders } from '@/lib/rateLimit';

describe('Rate Limiting', () => {
  beforeEach(() => {
    // Clear any existing rate limit entries by waiting
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('rateLimit', () => {
    it('should allow first request', () => {
      const result = rateLimit('test-key', 5, 60000);
      expect(result.allowed).toBe(true);
      expect(result.resetAt).toBeGreaterThan(Date.now());
    });

    it('should track request count', () => {
      const key = 'test-count';
      // Make 3 requests
      rateLimit(key, 5, 60000);
      rateLimit(key, 5, 60000);
      const result = rateLimit(key, 5, 60000);
      expect(result.allowed).toBe(true);
    });

    it('should block after max requests', () => {
      const key = 'test-block';
      // Make 5 requests (max)
      for (let i = 0; i < 5; i++) {
        rateLimit(key, 5, 60000);
      }
      // 6th request should be blocked
      const result = rateLimit(key, 5, 60000);
      expect(result.allowed).toBe(false);
    });

    it('should reset after window expires', () => {
      const key = 'test-reset';
      // Make request
      rateLimit(key, 5, 1000);
      // Advance time past window
      jest.advanceTimersByTime(1100);
      // Should allow again
      const result = rateLimit(key, 5, 1000);
      expect(result.allowed).toBe(true);
    });
  });

  describe('checkRateLimit', () => {
    it('should return remaining count', () => {
      const result = checkRateLimit('test-remaining', { windowMs: 60000, maxRequests: 10 });
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(9);
    });

    it('should decrement remaining count', () => {
      const key = 'test-decrement';
      checkRateLimit(key, { windowMs: 60000, maxRequests: 10 });
      const result = checkRateLimit(key, { windowMs: 60000, maxRequests: 10 });
      expect(result.remaining).toBe(8);
    });

    it('should return 0 remaining when blocked', () => {
      const key = 'test-zero';
      const config = { windowMs: 60000, maxRequests: 2 };
      checkRateLimit(key, config);
      checkRateLimit(key, config);
      const result = checkRateLimit(key, config);
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });
  });

  describe('getRateLimitHeaders', () => {
    it('should return proper headers', () => {
      const result = getRateLimitHeaders({ remaining: 5, resetAt: Date.now() + 60000 });
      expect(result['X-RateLimit-Remaining']).toBe('5');
      expect(result['X-RateLimit-Reset']).toBeDefined();
    });
  });
});
