import React from 'react';
import { Text, StyleSheet, ActivityIndicator, Pressable, View, Platform } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { Svg, Path } from 'react-native-svg';
import { COLORS } from '../constants/colors';
import { FONTS } from '../constants/fonts';
import { SPACING, RADIUS } from '../constants/spacing';

interface PrimaryButtonProps {
  title?: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const PrimaryButton: React.FC<PrimaryButtonProps> = ({
  title = 'Continue',
  onPress,
  disabled = false,
  loading = false,
}) => {
  const scale = useSharedValue(1);

  const handlePressIn = () => {
    if (!disabled && !loading) {
      scale.value = withSpring(0.96, { damping: 14, stiffness: 280 });
    }
  };

  const handlePressOut = () => {
    if (!disabled && !loading) {
      scale.value = withSpring(1, { damping: 14, stiffness: 280 });
    }
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      style={[
        styles.container,
        disabled ? styles.disabledContainer : styles.activeContainer,
        animatedStyle,
      ]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityState={{ disabled, busy: loading }}
      accessibilityLabel={title}
    >
      {loading ? (
        <ActivityIndicator color={COLORS.white} size="small" />
      ) : (
        <View style={styles.contentRow}>
          <Text style={[styles.title, disabled && styles.disabledTitle]}>
            {title}
          </Text>
          <View style={styles.iconContainer}>
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
              <Path
                d="M5 12H19M19 12L12 5M19 12L12 19"
                stroke={disabled ? COLORS.disabledText : COLORS.white}
                strokeWidth="2.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </View>
        </View>
      )}
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 56,
    borderRadius: RADIUS.l,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.l,
  },
  activeContainer: {
    backgroundColor: COLORS.primaryGreen,
    ...Platform.select({
      android: {
        elevation: 4,
        shadowColor: COLORS.primaryGreen,
      },
      ios: {
        shadowColor: COLORS.primaryGreen,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
    }),
  },
  disabledContainer: {
    backgroundColor: COLORS.disabledBackground,
    elevation: 0,
    shadowOpacity: 0,
  },
  contentRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
  },
  title: {
    fontFamily: FONTS.family.bold,
    fontWeight: FONTS.weight.bold,
    fontSize: 17,
    color: COLORS.white,
    letterSpacing: 0.2,
  },
  disabledTitle: {
    color: COLORS.disabledText,
  },
  iconContainer: {
    position: 'absolute',
    right: SPACING.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
