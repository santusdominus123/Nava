import { t, setLanguage, getLanguage, getGreeting } from '../../src/services/i18n';

describe('i18n Service', () => {
  beforeEach(() => {
    setLanguage('en');
  });

  describe('t()', () => {
    it('should return English translation by default', () => {
      expect(t('sign_in')).toBe('Sign In');
    });

    it('should return Indonesian translation when language is id', () => {
      setLanguage('id');
      expect(t('sign_in')).toBe('Masuk');
    });

    it('should fall back to English for missing keys', () => {
      setLanguage('id');
      const result = t('nonexistent_key');
      expect(result).toBe('nonexistent_key');
    });

    it('should replace %d placeholders with arguments', () => {
      const result = t('day_of', 3, 7);
      expect(result).toContain('3');
      expect(result).toContain('7');
    });
  });

  describe('getLanguage()', () => {
    it('should return current language', () => {
      expect(getLanguage()).toBe('en');
      setLanguage('id');
      expect(getLanguage()).toBe('id');
    });
  });

  describe('getGreeting()', () => {
    it('should return a greeting string', () => {
      const greeting = getGreeting();
      expect(greeting).toBeTruthy();
      expect(typeof greeting).toBe('string');
    });
  });
});
