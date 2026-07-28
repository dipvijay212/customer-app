import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withDelay } from 'react-native-reanimated';
import { Svg, Path, Circle, Rect } from 'react-native-svg';
import { COLORS } from '../constants/colors';
import { FONTS } from '../constants/fonts';
import { SPACING, RADIUS } from '../constants/spacing';

export type BenefitIconType = 'scooter' | 'store' | 'shield';

interface BenefitCardProps {
  iconType: BenefitIconType;
  title: string;
  subtitle: string;
  index?: number;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const BenefitCard: React.FC<BenefitCardProps> = ({
  iconType,
  title,
  subtitle,
  index = 0,
}) => {
  const scale = useSharedValue(0.88);
  const opacity = useSharedValue(0);

  useEffect(() => {
    const delay = 250 + index * 120;
    opacity.value = withDelay(delay, withSpring(1, { damping: 18, stiffness: 220 }));
    scale.value = withDelay(delay, withSpring(1, { damping: 15, stiffness: 240 }));
  }, [index, opacity, scale]);

  const handlePressIn = () => {
    scale.value = withSpring(0.96, { damping: 15 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15 });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  const renderIcon = () => {
    switch (iconType) {
      case 'scooter':
        return (
          <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
            <Circle cx="5.5" cy="17.5" r="2.5" fill={COLORS.darkGreen} />
            <Circle cx="18.5" cy="17.5" r="2.5" fill={COLORS.darkGreen} />
            <Path
              d="M15 6H19V8H16L14 12V14H6V12C6 10.34 7.34 9 9 9H11.5L12.5 7H9V5H13.5L15 6ZM3 14H19V15.5H3V14Z"
              fill={COLORS.darkGreen}
            />
          </Svg>
        );
      case 'store':
        return (
          <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
            <Path
              d="M20 4H4C2.89 4 2.01 4.89 2.01 6L2 11C2 11.55 2.22 12.05 2.59 12.42V19C2.59 20.11 3.48 21 4.59 21H19.41C20.52 21 21.41 20.11 21.41 19V12.42C21.78 12.05 22 11.55 22 11V6C22 4.89 21.11 4 20 4ZM19 19H5V13H19V19ZM19 10H5V6H19V10Z"
              fill={COLORS.darkGreen}
            />
            <Rect x="8" y="14" width="3" height="5" rx="1" fill={COLORS.darkGreen} />
          </Svg>
        );
      case 'shield':
      default:
        return (
          <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
            <Path
              d="M12 1L3 5V11C3 16.55 6.84 21.74 12 23C17.16 21.74 21 16.55 21 11V5L12 1ZM12 11.99H19C18.47 16.11 15.72 19.78 12 20.93V12H5V6.3L12 3.19V11.99Z"
              fill={COLORS.darkGreen}
            />
            <Path
              d="M10 12C9.45 12 9 12.45 9 13V16C9 16.55 9.45 17 10 17H14C14.55 17 15 16.55 15 16V13C15 12.45 14.55 12 14 12H10Z"
              fill={COLORS.darkGreen}
            />
          </Svg>
        );
    }
  };

  return (
    <AnimatedPressable
      style={[styles.card, animatedStyle]}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      accessibilityRole="text"
    >
      <View style={styles.iconCircle}>{renderIcon()}</View>
      <Text style={styles.title} numberOfLines={2}>
        {title}
      </Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: COLORS.softGreenBackground,
    borderRadius: RADIUS.xl,
    paddingVertical: SPACING.m + 2,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginHorizontal: 3.5,
    borderWidth: 1,
    borderColor: 'rgba(22, 163, 74, 0.1)',
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.lightGreen,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.s,
  },
  title: {
    fontFamily: FONTS.family.bold,
    fontWeight: FONTS.weight.bold,
    fontSize: 12.5,
    lineHeight: 16,
    color: COLORS.primaryText,
    textAlign: 'center',
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  subtitle: {
    fontFamily: FONTS.family.regular,
    fontWeight: FONTS.weight.regular,
    fontSize: FONTS.size.xs,
    lineHeight: FONTS.lineHeight.xs,
    color: COLORS.secondaryText,
    textAlign: 'center',
  },
});
