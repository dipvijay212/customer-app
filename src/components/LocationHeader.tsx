import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';
import { Svg, Path, Circle } from 'react-native-svg';
import { COLORS } from '../constants/colors';
import { FONTS } from '../constants/fonts';
import { SPACING } from '../constants/spacing';

interface LocationHeaderProps {
  location?: string;
  onPress?: () => void;
}

export const LocationHeader: React.FC<LocationHeaderProps> = ({
  location = 'Your Location',
  onPress,
}) => {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(-8);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 500, easing: Easing.out(Easing.ease) });
    translateY.value = withTiming(0, { duration: 500, easing: Easing.out(Easing.ease) });
  }, [opacity, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <TouchableOpacity
        style={styles.touchable}
        activeOpacity={0.7}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`Delivering to ${location}`}
      >
        <View style={styles.iconContainer}>
          <Svg width={24} height={30} viewBox="0 0 24 30" fill="none">
            <Path
              d="M12 0C5.373 0 0 5.373 0 12C0 20.25 12 30 12 30C12 30 24 20.25 24 12C24 5.373 18.627 0 12 0Z"
              fill={COLORS.primaryGreen}
            />
            <Circle cx={12} cy={11} r={4.2} fill={COLORS.white} />
          </Svg>
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.subText}>Delivering to</Text>
          <View style={styles.locationRow}>
            <Text style={styles.locationText} numberOfLines={1}>
              {location}
            </Text>
            <View style={styles.arrowIcon}>
              <Svg width={11} height={7} viewBox="0 0 12 8" fill="none">
                <Path
                  d="M1.41 0.590088L6 5.17009L10.59 0.590088L12 2.00009L6 8.00009L0 2.00009L1.41 0.590088Z"
                  fill={COLORS.primaryGreen}
                />
              </Svg>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignSelf: 'flex-start',
    marginTop: Platform.OS === 'android' ? 14 : 8,
    marginBottom: SPACING.m,
  },
  touchable: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    marginRight: SPACING.s + 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    flexDirection: 'column',
    justifyContent: 'center',
  },
  subText: {
    fontFamily: FONTS.family.regular,
    fontSize: FONTS.size.s,
    color: COLORS.secondaryText,
    marginBottom: 1,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    fontFamily: FONTS.family.bold,
    fontWeight: FONTS.weight.bold,
    fontSize: FONTS.size.xl,
    color: COLORS.primaryText,
  },
  arrowIcon: {
    marginLeft: SPACING.s,
    justifyContent: 'center',
    marginTop: 2,
  },
});
