import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Image, Dimensions, Platform } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing, withDelay } from 'react-native-reanimated';
import { Svg, Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import { COLORS } from '../constants/colors';
import { FONTS } from '../constants/fonts';
import { SPACING } from '../constants/spacing';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const HeroSection: React.FC = () => {
  const textOpacity = useSharedValue(0);
  const textTranslateY = useSharedValue(12);
  const imageOpacity = useSharedValue(0);
  const imageScale = useSharedValue(0.9);

  useEffect(() => {
    textOpacity.value = withDelay(100, withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) }));
    textTranslateY.value = withDelay(100, withTiming(0, { duration: 600, easing: Easing.out(Easing.cubic) }));
    imageOpacity.value = withDelay(200, withTiming(1, { duration: 700, easing: Easing.out(Easing.cubic) }));
    imageScale.value = withDelay(200, withTiming(1, { duration: 700, easing: Easing.out(Easing.cubic) }));
  }, [textOpacity, textTranslateY, imageOpacity, imageScale]);

  const textAnimatedStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
    transform: [{ translateY: textTranslateY.value }],
  }));

  const imageAnimatedStyle = useAnimatedStyle(() => ({
    opacity: imageOpacity.value,
    transform: [{ scale: imageScale.value }],
  }));

  return (
    <View style={styles.container}>
      {/* Top Banner Row: Perfectly balanced heights between Left Column and Right Illustration */}
      <View style={styles.topBanner}>
        <Animated.View style={[styles.titleContainer, textAnimatedStyle]}>
          <Text style={styles.heading}>
            <Text style={styles.primaryText}>Fresh groceries{'\n'}from </Text>
            <Text style={styles.greenText}>nearby{'\n'}local shops</Text>
          </Text>

          {/* Delivery speed pill badge & offer tag to fill the visual space beneath 'local shops' */}
          <View style={styles.badgeSection}>
            <View style={styles.deliveryPill}>
              <Text style={styles.boltIcon}>⚡</Text>
              <Text style={styles.pillText}>10–15 mins delivery</Text>
            </View>
            
            <View style={styles.offerRow}>
              <View style={styles.indicatorDot} />
              <Text style={styles.offerText}>Free delivery on 1st order</Text>
            </View>
          </View>
        </Animated.View>

        <Animated.View style={[styles.imageContainer, imageAnimatedStyle]}>
          <View style={styles.glowShape} />
          <View style={styles.organicMask}>
            <Image
              source={require('../../assets/images/loginHero.png')}
              style={styles.heroImage}
              resizeMode="cover"
            />
            <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" pointerEvents="none">
              <Defs>
                <LinearGradient id="heroFade" x1="0%" y1="60%" x2="0%" y2="100%">
                  <Stop offset="0%" stopColor={COLORS.background} stopOpacity="0" />
                  <Stop offset="100%" stopColor={COLORS.background} stopOpacity="0.8" />
                </LinearGradient>
              </Defs>
              <Rect width="100%" height="100%" fill="url(#heroFade)" />
            </Svg>
          </View>
        </Animated.View>
      </View>

      {/* Bottom Full-Width Row: Subtext flows cleanly across the screen width */}
      <Animated.View style={[styles.subtextContainer, textAnimatedStyle]}>
        <Text style={styles.subtext}>
          Order groceries, fruits, medicines and daily essentials from trusted neighbourhood shops near you.
        </Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.xl,
    marginTop: Platform.OS === 'android' ? 4 : 0,
  },
  topBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleContainer: {
    flex: 1,
    paddingRight: SPACING.s,
    justifyContent: 'center',
  },
  heading: {
    fontFamily: FONTS.family.bold,
    fontSize: SCREEN_WIDTH < 360 ? 20 : 22,
    fontWeight: FONTS.weight.heavy,
    lineHeight: SCREEN_WIDTH < 360 ? 26 : 29,
    letterSpacing: -0.3,
  },
  primaryText: {
    color: COLORS.primaryText,
  },
  greenText: {
    color: COLORS.primaryGreen,
  },
  badgeSection: {
    marginTop: 12,
  },
  deliveryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.lightGreen,
    paddingVertical: 5,
    paddingHorizontal: 11,
    borderRadius: 16,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(22, 163, 74, 0.25)',
  },
  boltIcon: {
    fontSize: 12.5,
    marginRight: 5,
  },
  pillText: {
    fontFamily: FONTS.family.bold,
    fontWeight: FONTS.weight.bold,
    fontSize: 12.5,
    color: COLORS.darkGreen,
    letterSpacing: -0.2,
  },
  offerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    marginLeft: 3,
  },
  indicatorDot: {
    width: 6.5,
    height: 6.5,
    borderRadius: 3.25,
    backgroundColor: COLORS.primaryGreen,
    marginRight: 6,
  },
  offerText: {
    fontFamily: FONTS.family.medium,
    fontWeight: FONTS.weight.medium,
    fontSize: 11.5,
    color: COLORS.secondaryText,
  },
  imageContainer: {
    width: 140,
    height: 154,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginRight: -4,
  },
  glowShape: {
    position: 'absolute',
    width: 138,
    height: 152,
    backgroundColor: COLORS.lightGreen,
    borderTopLeftRadius: 70,
    borderBottomRightRadius: 70,
    borderBottomLeftRadius: 36,
    borderTopRightRadius: 22,
    opacity: 0.65,
    transform: [{ rotate: '-5deg' }],
  },
  organicMask: {
    width: 132,
    height: 146,
    borderTopLeftRadius: 66,
    borderBottomRightRadius: 66,
    borderBottomLeftRadius: 32,
    borderTopRightRadius: 18,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    backgroundColor: COLORS.card,
    elevation: 3,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
  },
  heroImage: {
    width: '100%',
    height: '100%',
    opacity: 0.92,
  },
  subtextContainer: {
    marginTop: 14,
    width: '98%',
  },
  subtext: {
    fontFamily: FONTS.family.regular,
    fontSize: 13.5,
    lineHeight: 20,
    color: COLORS.secondaryText,
    fontWeight: FONTS.weight.regular,
  },
});
