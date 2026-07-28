import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing, withDelay } from 'react-native-reanimated';
import { COLORS } from '../constants/colors';
import { FONTS } from '../constants/fonts';
import { SPACING } from '../constants/spacing';

interface FooterProps {
  onPressTerms?: () => void;
  onPressPrivacy?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onPressTerms, onPressPrivacy }) => {
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withDelay(500, withTiming(1, { duration: 600, easing: Easing.out(Easing.ease) }));
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <View style={styles.textWrap}>
        <Text style={styles.text}>By continuing, you agree to our </Text>
        <TouchableOpacity onPress={onPressTerms} activeOpacity={0.7} accessibilityRole="link">
          <Text style={styles.link}>Terms & Conditions</Text>
        </TouchableOpacity>
        <Text style={styles.text}> and </Text>
        <TouchableOpacity onPress={onPressPrivacy} activeOpacity={0.7} accessibilityRole="link">
          <Text style={styles.link}>Privacy Policy</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: SPACING.xxl,
    marginBottom: SPACING.heroMargin,
    paddingHorizontal: SPACING.m,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontFamily: FONTS.family.regular,
    fontSize: FONTS.size.s,
    lineHeight: FONTS.lineHeight.m,
    color: COLORS.secondaryText,
    textAlign: 'center',
  },
  link: {
    fontFamily: FONTS.family.bold,
    fontWeight: FONTS.weight.bold,
    fontSize: FONTS.size.s,
    lineHeight: FONTS.lineHeight.m,
    color: COLORS.primaryGreen,
    textAlign: 'center',
  },
});
