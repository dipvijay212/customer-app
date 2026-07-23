import React, { useEffect } from 'react';
import { View, StyleSheet, Text, ActivityIndicator, Dimensions } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withSequence, 
  withDelay, 
  withSpring,
  Easing
} from 'react-native-reanimated';
import { Store } from 'lucide-react-native';

const { width } = Dimensions.get('window');

export const SplashScreen = () => {
  const iconScale = useSharedValue(0);
  const textOpacity = useSharedValue(0);
  const textTranslateY = useSharedValue(20);

  useEffect(() => {
    // Animate the icon popping in
    iconScale.value = withSpring(1, { damping: 12, stiffness: 90 });
    
    // Animate the text fading and sliding up after a short delay
    textOpacity.value = withDelay(
      300, 
      withTiming(1, { duration: 800, easing: Easing.out(Easing.exp) })
    );
    textTranslateY.value = withDelay(
      300, 
      withTiming(0, { duration: 800, easing: Easing.out(Easing.exp) })
    );
  }, []);

  const animatedIconStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: iconScale.value }],
    };
  });

  const animatedTextStyle = useAnimatedStyle(() => {
    return {
      opacity: textOpacity.value,
      transform: [{ translateY: textTranslateY.value }],
    };
  });

  return (
    <View style={styles.container}>
      {/* Central Icon */}
      <Animated.View style={[styles.iconContainer, animatedIconStyle]}>
        <Store color="#2E7D32" size={60} strokeWidth={2} />
      </Animated.View>

      {/* App Title & Subtitle */}
      <Animated.View style={[styles.textContainer, animatedTextStyle]}>
        <Text style={styles.title}>Local Shops</Text>
        <Text style={styles.subtitle}>Your Neighborhood, Delivered.</Text>
      </Animated.View>

      {/* Loader */}
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#2E7D32" />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF9F6', // Matches bootsplash background
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  textContainer: {
    alignItems: 'center',
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    color: '#2E7D32',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748B',
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  loaderContainer: {
    position: 'absolute',
    bottom: 80,
  }
});
