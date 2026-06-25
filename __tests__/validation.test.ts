import { sanitizeHtml, sanitizeInput, validateEmail, validatePassword, validateName } from '@/lib/validation';

describe('Validation Library', () => {
  describe('sanitizeHtml', () => {
    it('should escape HTML entities', () => {
      expect(sanitizeHtml('<script>alert("xss")</script>')).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;');
    });

    it('should escape quotes', () => {
      expect(sanitizeHtml('He said "hello"')).toBe('He said &quot;hello&quot;');
    });

    it('should escape ampersand', () => {
      expect(sanitizeHtml('A & B')).toBe('A &amp; B');
    });
  });

  describe('sanitizeInput', () => {
    it('should remove HTML tags', () => {
      expect(sanitizeInput('<b>bold</b>')).toBe('bold');
    });

    it('should remove javascript protocol', () => {
      expect(sanitizeInput('javascript:alert(1)')).toBe('alert(1)');
    });

    it('should remove data protocol', () => {
      expect(sanitizeInput('data:text/html,<script>alert(1)</script>')).toBe('text/html,alert(1)');
    });

    it('should remove event handlers', () => {
      expect(sanitizeInput('onclick=alert(1)')).toBe('alert(1)');
    });

    it('should trim whitespace', () => {
      expect(sanitizeInput('  hello  ')).toBe('hello');
    });
  });

  describe('validateEmail', () => {
    it('should accept valid emails', () => {
      expect(validateEmail('test@example.com')).toBe(true);
      expect(validateEmail('user.name@domain.co')).toBe(true);
      expect(validateEmail('user+tag@domain.com')).toBe(true);
    });

    it('should reject invalid emails', () => {
      expect(validateEmail('')).toBe(false);
      expect(validateEmail('not-an-email')).toBe(false);
      expect(validateEmail('@domain.com')).toBe(false);
      expect(validateEmail('user@')).toBe(false);
    });
  });

  describe('validatePassword', () => {
    it('should accept valid passwords', () => {
      expect(validatePassword('password123')).toEqual({ valid: true });
      expect(validatePassword('123456')).toEqual({ valid: true });
    });

    it('should reject short passwords', () => {
      const result = validatePassword('12345');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('6 символов');
    });

    it('should reject long passwords', () => {
      const longPassword = 'a'.repeat(129);
      const result = validatePassword(longPassword);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('слишком длинный');
    });
  });

  describe('validateName', () => {
    it('should accept valid names', () => {
      expect(validateName('John')).toEqual({ valid: true });
      expect(validateName('A')).toEqual({ valid: true });
    });

    it('should reject empty names', () => {
      const result = validateName('');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('обязательно');
    });

    it('should reject long names', () => {
      const longName = 'a'.repeat(101);
      const result = validateName(longName);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('слишком длинное');
    });
  });
});
