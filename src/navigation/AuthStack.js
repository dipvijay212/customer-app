import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LanguageSelectScreen } from '../screens/auth/LanguageSelectScreen';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { VerifyOTPScreen } from '../screens/auth/VerifyOTPScreen';
import { ProfileSetupScreen } from '../screens/auth/ProfileSetupScreen';

const Stack = createNativeStackNavigator();

export const AuthStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="LanguageSelect" component={LanguageSelectScreen} />
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="VerifyOTP" component={VerifyOTPScreen} />
    <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
  </Stack.Navigator>
);
