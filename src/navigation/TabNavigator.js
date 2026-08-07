import React from 'react';
import { View, Text, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, Search, ShoppingCart, Menu, WifiOff } from 'lucide-react-native';
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthContext } from '../context/AuthContext';
import axiosClient from '../api/axiosClient';
import { HomeScreen } from '../screens/HomeScreen';
import { ExploreScreen } from '../screens/ExploreScreen';
import { BasketScreen } from '../screens/BasketScreen';
import { MoreScreen } from '../screens/MoreScreen';
import { theme } from '../theme';
import { useTranslation } from '../utils/translations';

const Tab = createBottomTabNavigator();

export const TabNavigator = () => {
  const { isOffline } = React.useContext(AuthContext);
  const t = useTranslation();
  const insets = useSafeAreaInsets();

  const { data: cartData } = useQuery({
    queryKey: ['cart'],
    queryFn: async () => {
      const res = await axiosClient.get('/cart');
      return res.data.carts;
    }
  });
  
  const totalCartItems = Array.isArray(cartData) ? cartData.reduce((total, cart) => {
    return total + (cart.items?.reduce((sum, item) => sum + item.quantity, 0) || 0);
  }, 0) : 0;

  return (
    <View style={{ flex: 1 }}>
      {isOffline && (
        <View style={{ backgroundColor: '#EF4444', padding: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
          <WifiOff color="#FFF" size={16} />
          <Text style={{ color: '#FFF', fontSize: 12, fontWeight: '600', marginLeft: 8 }}>You're currently offline.</Text>
        </View>
      )}
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarShowLabel: true,
          tabBarActiveTintColor: theme.colors.primary,
          tabBarInactiveTintColor: '#64748B',
          tabBarStyle: {
            backgroundColor: '#FFFFFF',
            borderTopWidth: 1,
            borderTopColor: '#F1F5F9',
            height: 64 + Math.max(insets.bottom + 12, Platform.OS === 'android' ? 24 : 16),
            paddingBottom: Math.max(insets.bottom + 12, Platform.OS === 'android' ? 24 : 16),
            paddingTop: 10,
            elevation: 8,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.05,
            shadowRadius: 4,
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '700',
            marginTop: 2,
            marginBottom: 2,
          },
          tabBarIcon: ({ focused }) => {
            let IconComponent;
            switch (route.name) {
              case 'Home': IconComponent = Home; break;
              case 'Explore': IconComponent = Search; break;
              case 'Basket': IconComponent = ShoppingCart; break;
              case 'More': IconComponent = Menu; break;
              default: IconComponent = Home;
            }
            
            return (
              <View style={{
                alignItems: 'center',
                justifyContent: 'center',
                width: 44,
                height: 28,
                borderRadius: 14,
                backgroundColor: focused ? '#ECFDF5' : 'transparent',
              }}>
                <IconComponent 
                  color={focused ? theme.colors.primary : '#64748B'} 
                  size={22} 
                />
                {route.name === 'Basket' && totalCartItems > 0 && (
                  <View style={{
                    position: 'absolute',
                    top: -4,
                    right: -4,
                    backgroundColor: '#EF4444',
                    borderRadius: 9,
                    minWidth: 16,
                    height: 16,
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingHorizontal: 4,
                    borderWidth: 1.5,
                    borderColor: '#FFFFFF',
                  }}>
                    <Text style={{ color: '#FFF', fontSize: 9, fontWeight: 'bold' }}>
                      {totalCartItems > 99 ? '99+' : totalCartItems}
                    </Text>
                  </View>
                )}
              </View>
            );
          },
        })}
      >
        <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarLabel: t('homeTab') }} />
        <Tab.Screen name="Explore" component={ExploreScreen} options={{ tabBarLabel: t('exploreTab') }} />
        <Tab.Screen name="Basket" component={BasketScreen} options={{ tabBarLabel: t('basketTab') }} />
        <Tab.Screen name="More" component={MoreScreen} options={{ tabBarLabel: t('moreTab') }} />
      </Tab.Navigator>
    </View>
  );
};

export default TabNavigator;
