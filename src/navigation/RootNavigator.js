import React, { useContext } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthContext } from '../context/AuthContext';
import { AuthStack } from './AuthStack';
import { TabNavigator } from './TabNavigator';
import { SplashScreen } from '../screens/SplashScreen';
import BootSplash from 'react-native-bootsplash';
import { ShopStorefrontScreen } from '../screens/ShopStorefrontScreen';
import { CategoryProductsScreen } from '../screens/CategoryProductsScreen';
import { CheckoutScreen } from '../screens/CheckoutScreen';
import { UpiPaymentScreen } from '../screens/UpiPaymentScreen';
import { OrderConfirmationScreen } from '../screens/OrderConfirmationScreen';
import { OrderDetailScreen } from '../screens/OrderDetailScreen';
import { WishlistScreen } from '../screens/WishlistScreen';
import { AddressListScreen } from '../screens/AddressListScreen';
import { AddressMapPickerScreen } from '../screens/AddressMapPickerScreen';
import { ManageShopsScreen } from '../screens/ManageShopsScreen';
import { LanguageSettingsScreen } from '../screens/LanguageSettingsScreen';
import { HelpSupportScreen } from '../screens/HelpSupportScreen';
import { KhataScreen } from '../screens/KhataScreen';

const Stack = createNativeStackNavigator();

export const RootNavigator = () => {
  const { isLoading, userToken } = useContext(AuthContext);

  React.useEffect(() => {
    // Keep the beautiful native splash screen visible until auth state is resolved!
    if (!isLoading) {
      BootSplash.hide({ fade: true });
    }
  }, [isLoading]);

  // Return nothing while loading. The native BootSplash covers the screen.
  // This prevents any weird JS rendering glitches (like the black donut).
  if (isLoading) return null;

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!userToken ? (
        <Stack.Screen name="Auth" component={AuthStack} />
      ) : (
        <>
          <Stack.Screen name="MainTabs" component={TabNavigator} />
          <Stack.Screen name="ShopStorefront" component={ShopStorefrontScreen} />
          <Stack.Screen name="CategoryProducts" component={CategoryProductsScreen} />
          <Stack.Screen name="Checkout" component={CheckoutScreen} />
          <Stack.Screen name="UpiPayment" component={UpiPaymentScreen} />
          <Stack.Screen name="OrderConfirmation" component={OrderConfirmationScreen} />
          <Stack.Screen name="OrderDetail" component={OrderDetailScreen} />
          <Stack.Screen name="Wishlist" component={WishlistScreen} />
          <Stack.Screen name="AddressList" component={AddressListScreen} />
          <Stack.Screen name="AddressMapPicker" component={AddressMapPickerScreen} />
          <Stack.Screen name="ManageShops" component={ManageShopsScreen} />
          <Stack.Screen name="LanguageSettings" component={LanguageSettingsScreen} />
          <Stack.Screen name="HelpSupport" component={HelpSupportScreen} />
          <Stack.Screen name="Khata" component={KhataScreen} />
        </>
      )}
    </Stack.Navigator>
  );
};
