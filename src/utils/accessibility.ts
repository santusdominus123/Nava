import { AccessibilityInfo, Platform } from 'react-native';

// Check if screen reader is enabled
export async function isScreenReaderEnabled(): Promise<boolean> {
  return AccessibilityInfo.isScreenReaderEnabled();
}

// Announce for screen readers
export function announceForAccessibility(message: string) {
  AccessibilityInfo.announceForAccessibility(message);
}

// Generate accessibility props for common patterns
export function a11yButton(label: string, hint?: string) {
  return {
    accessible: true,
    accessibilityRole: 'button' as const,
    accessibilityLabel: label,
    accessibilityHint: hint,
  };
}

export function a11yHeader(label: string, level?: 1 | 2 | 3) {
  return {
    accessible: true,
    accessibilityRole: 'header' as const,
    accessibilityLabel: label,
  };
}

export function a11yImage(label: string) {
  return {
    accessible: true,
    accessibilityRole: 'image' as const,
    accessibilityLabel: label,
  };
}

export function a11yText(label: string) {
  return {
    accessible: true,
    accessibilityRole: 'text' as const,
    accessibilityLabel: label,
  };
}

export function a11yLink(label: string, hint?: string) {
  return {
    accessible: true,
    accessibilityRole: 'link' as const,
    accessibilityLabel: label,
    accessibilityHint: hint,
  };
}

export function a11ySwitch(label: string, value: boolean) {
  return {
    accessible: true,
    accessibilityRole: 'switch' as const,
    accessibilityLabel: label,
    accessibilityState: { checked: value },
  };
}

export function a11yTab(label: string, selected: boolean) {
  return {
    accessible: true,
    accessibilityRole: 'tab' as const,
    accessibilityLabel: label,
    accessibilityState: { selected },
  };
}

export function a11yProgress(label: string, current: number, total: number) {
  return {
    accessible: true,
    accessibilityRole: 'progressbar' as const,
    accessibilityLabel: `${label}: ${current} of ${total}`,
    accessibilityValue: {
      min: 0,
      max: total,
      now: current,
    },
  };
}

// Dynamic font scaling support
export function scaledFontSize(baseSize: number, maxScale: number = 1.5): number {
  // In React Native, font scaling is handled automatically
  // This helper provides a maximum scale limit
  return baseSize; // React Native handles this via allowFontScaling prop
}

// Reduced motion check
export async function prefersReducedMotion(): Promise<boolean> {
  return AccessibilityInfo.isReduceMotionEnabled();
}
