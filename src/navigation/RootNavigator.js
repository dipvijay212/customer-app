import React, { useContext, useState, useEffect } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthContext } from '../context/AuthContext';
import { AuthStack } from './AuthStack';
import { TabNavigator } from './TabNavigator';
import { SplashScreen } from '../screens/SplashScreen';
import { ShopStorefrontScreen } from '../screens/ShopStorefrontScreen';
import { CategoryProductsScreen } from '../screens/CategoryProductsScreen';
import { CheckoutScreen } from '../screens/CheckoutScreen';
import { UpiPaymentScreen } from '../screens/UpiPaymentScreen';
import { OrderConfirmationScreen } from '../screens/OrderConfirmationScreen';
import { OrderDetailScreen } from '../screens/OrderDetailScreen';
import { OrdersScreen } from '../screens/OrdersScreen';
import { AddressListScreen } from '../screens/AddressListScreen';
import { AddressMapPickerScreen } from '../screens/AddressMapPickerScreen';
import { ManageShopsScreen } from '../screens/ManageShopsScreen';
import { LanguageSettingsScreen } from '../screens/LanguageSettingsScreen';
import { HelpSupportScreen } from '../screens/HelpSupportScreen';
import { KhataScreen } from '../screens/KhataScreen';
import { NotificationsScreen } from '../screens/NotificationsScreen';
import { QRScannerScreen } from '../screens/QRScannerScreen';
import { EditProfileScreen } from '../screens/EditProfileScreen';

const Stack = createNativeStackNavigator();

// Auth bootstrapping can resolve in a few milliseconds (e.g. no stored
// token), which would otherwise skip the splash screen before it ever
// paints. Keep it on screen for at least this long so its entrance
// animation is actually seen.
const MIN_SPLASH_DURATION_MS = 2000;

export const RootNavigator = () => {
  const { isLoading, userToken } = useContext(AuthContext);
  const [minDurationElapsed, setMinDurationElapsed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMinDurationElapsed(true), MIN_SPLASH_DURATION_MS);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading || !minDurationElapsed) return <SplashScreen />;

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!userToken ? (
        <Stack.Screen name="Auth" component={AuthStack} />
      ) : (
        <>
          <Stack.Screen name="MainTabs" component={TabNavigator} />
          <Stack.Screen name="Orders" component={OrdersScreen} />
          <Stack.Screen name="Notifications" component={NotificationsScreen} />
          <Stack.Screen name="QRScanner" component={QRScannerScreen} />
          <Stack.Screen name="ShopStorefront" component={ShopStorefrontScreen} />
          <Stack.Screen name="CategoryProducts" component={CategoryProductsScreen} />
          <Stack.Screen name="Checkout" component={CheckoutScreen} />
          <Stack.Screen name="UpiPayment" component={UpiPaymentScreen} />
          <Stack.Screen name="OrderConfirmation" component={OrderConfirmationScreen} />
          <Stack.Screen name="OrderDetail" component={OrderDetailScreen} />
          <Stack.Screen name="AddressList" component={AddressListScreen} />
          <Stack.Screen name="AddressMapPicker" component={AddressMapPickerScreen} />
          <Stack.Screen name="ManageShops" component={ManageShopsScreen} />
          <Stack.Screen name="LanguageSettings" component={LanguageSettingsScreen} />
          <Stack.Screen name="HelpSupport" component={HelpSupportScreen} />
          <Stack.Screen name="Khata" component={KhataScreen} />
          <Stack.Screen name="EditProfile" component={EditProfileScreen} />
        </>
      )}
    </Stack.Navigator>
  );
};
