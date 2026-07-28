import { Platform, StyleSheet, Dimensions } from 'react-native';
import { COLORS } from './colors';

const { width, height } = Dimensions.get('window');

export const SPACING = {
  xs: 4,
  s: 8,
  m: 12,
  l: 16,
  xl: 20,
  xxl: 24,
  xxxl: 28,
  screenPadding: 16,
  cardPadding: 20,
  heroMargin: 32,
  screenWidth: width,
  screenHeight: height,
} as const;

export const RADIUS = {
  s: 8,
  m: 14,
  l: 16,
  xl: 22,
  card: 26,
  round: 999,
} as const;

export const SHADOWS = StyleSheet.create({
  soft: {
    ...Platform.select({
      ios: {
        shadowColor: COLORS.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
      },
      android: {
        elevation: 3,
        shadowColor: '#000000',
      },
    }),
  },
  medium: {
    ...Platform.select({
      ios: {
        shadowColor: COLORS.shadow,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.1,
        shadowRadius: 16,
      },
      android: {
        elevation: 4,
        shadowColor: '#000000',
      },
    }),
  },
});
