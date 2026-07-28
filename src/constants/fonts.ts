import { Platform } from 'react-native';

export const FONTS = {
  family: {
    regular: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    medium: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
    bold: Platform.OS === 'ios' ? 'System' : 'sans-serif-bold',
    heavy: Platform.OS === 'ios' ? 'System' : 'sans-serif-black',
  },
  size: {
    xs: 10.5,
    s: 12,
    m: 13.5,
    l: 15,
    xl: 16,
    xxl: 18,
    title: 21,
    hero: 28,
  },
  weight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    heavy: '800' as const,
  },
  lineHeight: {
    xs: 14,
    s: 16,
    m: 18,
    l: 21,
    xl: 23,
    title: 26,
    hero: 34,
  },
} as const;
