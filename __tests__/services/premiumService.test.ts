import { PREMIUM_FEATURES } from '../../src/services/premiumService';

describe('Premium Service', () => {
  describe('PREMIUM_FEATURES', () => {
    it('should have correct free daily limit', () => {
      expect(PREMIUM_FEATURES.AI_DAILY_LIMIT_FREE).toBe(5);
    });

    it('should have correct premium daily limit', () => {
      expect(PREMIUM_FEATURES.AI_DAILY_LIMIT_PREMIUM).toBe(999);
    });

    it('should allow free features for non-premium users', () => {
      expect(PREMIUM_FEATURES.canAccessFeature('basic_feature', false)).toBe(true);
    });

    it('should block premium features for non-premium users', () => {
      expect(PREMIUM_FEATURES.canAccessFeature('audio_devotionals', false)).toBe(false);
      expect(PREMIUM_FEATURES.canAccessFeature('custom_themes', false)).toBe(false);
      expect(PREMIUM_FEATURES.canAccessFeature('offline_access', false)).toBe(false);
      expect(PREMIUM_FEATURES.canAccessFeature('advanced_ai', false)).toBe(false);
    });

    it('should allow premium features for premium users', () => {
      expect(PREMIUM_FEATURES.canAccessFeature('audio_devotionals', true)).toBe(true);
      expect(PREMIUM_FEATURES.canAccessFeature('custom_themes', true)).toBe(true);
    });
  });
});
