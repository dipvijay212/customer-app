import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
  withSpring,
  withRepeat,
  Easing,
} from 'react-native-reanimated';
import Svg, { Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import { Home } from 'lucide-react-native';
import { theme } from '../theme';

const { width, height } = Dimensions.get('window');
const LOGO_SIZE = 116;
const BAR_TRACK_WIDTH = 140;
const BAR_FILL_WIDTH = 56;

export const SplashScreen = () => {
  const logoScale = useSharedValue(0);
  const glowScale = useSharedValue(0.9);
  const glowOpacity = useSharedValue(0);
  const orbitRotation = useSharedValue(0);
  const titleOpacity = useSharedValue(0);
  const titleTranslateY = useSharedValue(16);
  const taglineOpacity = useSharedValue(0);
  const taglineTranslateY = useSharedValue(12);
  const barOpacity = useSharedValue(0);
  const barProgress = useSharedValue(0);

  useEffect(() => {
    // Logo badge pops in with a slight overshoot
    logoScale.value = withSpring(1, { damping: 11, stiffness: 110 });

    // Soft glow ring pulses gently behind the logo, looping
    glowOpacity.value = withDelay(150, withTiming(1, { duration: 400 }));
    glowScale.value = withDelay(
      150,
      withRepeat(
        withSequence(
          withTiming(1.18, { duration: 1100, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.95, { duration: 1100, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      )
    );

    // A small accent dot orbits the logo, continuously
    orbitRotation.value = withDelay(
      300,
      withRepeat(withTiming(360, { duration: 3200, easing: Easing.linear }), -1, false)
    );

    // Title & tagline reveal, staggered
    titleOpacity.value = withDelay(280, withTiming(1, { duration: 500, easing: Easing.out(Easing.exp) }));
    titleTranslateY.value = withDelay(280, withTiming(0, { duration: 500, easing: Easing.out(Easing.exp) }));

    taglineOpacity.value = withDelay(480, withTiming(1, { duration: 500, easing: Easing.out(Easing.exp) }));
    taglineTranslateY.value = withDelay(480, withTiming(0, { duration: 500, easing: Easing.out(Easing.exp) }));

    // Bottom progress indicator fades in, then sweeps indefinitely
    barOpacity.value = withDelay(650, withTiming(1, { duration: 400 }));
    barProgress.value = withDelay(
      650,
      withRepeat(withTiming(1, { duration: 950, easing: Easing.inOut(Easing.ease) }), -1, true)
    );
  }, [
    logoScale,
    glowOpacity,
    glowScale,
    orbitRotation,
    titleOpacity,
    titleTranslateY,
    taglineOpacity,
    taglineTranslateY,
    barOpacity,
    barProgress,
  ]);

  const logoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value * 0.5,
    transform: [{ scale: glowScale.value }],
  }));

  const orbitStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${orbitRotation.value}deg` }],
  }));

  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleTranslateY.value }],
  }));

  const taglineStyle = useAnimatedStyle(() => ({
    opacity: taglineOpacity.value,
    transform: [{ translateY: taglineTranslateY.value }],
  }));

  const barContainerStyle = useAnimatedStyle(() => ({
    opacity: barOpacity.value,
  }));

  const barFillStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: (barProgress.value * (BAR_TRACK_WIDTH - BAR_FILL_WIDTH)),
      },
    ],
  }));

  return (
    <View style={styles.container}>
      {/* Soft branded gradient backdrop */}
      <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#F0FDF4" stopOpacity="1" />
            <Stop offset="0.55" stopColor="#FAF9F6" stopOpacity="1" />
            <Stop offset="1" stopColor="#FFFFFF" stopOpacity="1" />
          </LinearGradient>
        </Defs>
        <Rect width={width} height={height} fill="url(#bg)" />
      </Svg>

      <View style={styles.content}>
        {/* Logo mark with pulsing glow + orbiting accent */}
        <View style={styles.logoWrapper}>
          <Animated.View style={[styles.glowRing, glowStyle]} />

          <Animated.View style={[styles.orbit, orbitStyle]}>
            <View style={styles.orbitDot} />
          </Animated.View>

          <Animated.View style={[styles.logoBadge, logoStyle]}>
            <Svg width={LOGO_SIZE} height={LOGO_SIZE} style={StyleSheet.absoluteFill}>
              <Defs>
                <LinearGradient id="logoGrad" x1="0" y1="0" x2="1" y2="1">
                  <Stop offset="0" stopColor={theme.colors.primary} />
                  <Stop offset="1" stopColor={theme.colors.primaryDark} />
                </LinearGradient>
              </Defs>
              <Rect width={LOGO_SIZE} height={LOGO_SIZE} rx={32} fill="url(#logoGrad)" />
            </Svg>
            <Home color="#FFFFFF" size={52} strokeWidth={2.2} />
          </Animated.View>
        </View>

        {/* App Title & Tagline */}
        <Animated.Text style={[styles.title, titleStyle]}>Local Shops</Animated.Text>
        <Animated.Text style={[styles.subtitle, taglineStyle]}>Your Neighborhood, Delivered.</Animated.Text>
      </View>

      {/* Branded indeterminate progress bar */}
      <Animated.View style={[styles.barTrack, barContainerStyle]}>
        <Animated.View style={[styles.barFill, barFillStyle]} />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF9F6',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoWrapper: {
    width: 180,
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  glowRing: {
    position: 'absolute',
    width: 168,
    height: 168,
    borderRadius: 84,
    backgroundColor: theme.colors.primaryLight,
  },
  orbit: {
    position: 'absolute',
    width: 176,
    height: 176,
    alignItems: 'center',
  },
  orbitDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.colors.primaryDark,
  },
  logoBadge: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: theme.colors.primaryDark,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.28,
    shadowRadius: 20,
    elevation: 10,
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    color: theme.colors.primaryDark,
    letterSpacing: 0.4,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: theme.colors.textLight,
    fontWeight: '600',
    letterSpacing: 0.4,
  },
  barTrack: {
    position: 'absolute',
    bottom: 72,
    alignSelf: 'center',
    width: BAR_TRACK_WIDTH,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.primaryLight,
    overflow: 'hidden',
  },
  barFill: {
    width: BAR_FILL_WIDTH,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.primary,
  },
});

export default SplashScreen;
