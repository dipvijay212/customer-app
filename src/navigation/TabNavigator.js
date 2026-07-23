import React from 'react';
import { View, Text, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, Search, ShoppingCart, List, User, WifiOff } from 'lucide-react-native';
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthContext } from '../context/AuthContext';
import axiosClient from '../api/axiosClient';
import { HomeScreen } from '../screens/HomeScreen';
import { ExploreScreen } from '../screens/ExploreScreen';
import { BasketScreen } from '../screens/BasketScreen';
import { OrdersScreen } from '../screens/OrdersScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { theme } from '../theme';

const Tab = createBottomTabNavigator();

export const TabNavigator = () => {
  const { isOffline } = React.useContext(AuthContext);
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
      tabBarShowLabel: false,
      tabBarStyle: {
        backgroundColor: theme.colors.surface,
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
        height: 55 + Math.max(insets.bottom, Platform.OS === 'android' ? 10 : 20),
        paddingBottom: Math.max(insets.bottom, Platform.OS === 'android' ? 10 : 20),
        paddingTop: 10,
      },
      tabBarIcon: ({ focused }) => {
        let IconComponent;
        let label = route.name;
        switch (route.name) {
          case 'Home': IconComponent = Home; break;
          case 'Explore': IconComponent = Search; break;
          case 'Basket': IconComponent = ShoppingCart; break;
          case 'Orders': IconComponent = List; break;
          case 'Profile': IconComponent = User; break;
          default: IconComponent = Home;
        }
        
        return (
          <View style={{
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: focused ? theme.colors.primary : 'transparent',
            paddingVertical: 6,
            paddingHorizontal: 8,
            borderRadius: 16,
            minWidth: 50,
          }}>
            <View>
              <IconComponent 
                color={focused ? '#FFF' : theme.colors.textLight} 
                size={20} 
              />
              {route.name === 'Basket' && totalCartItems > 0 && (
                <View style={{
                  position: 'absolute',
                  top: -8,
                  right: -12,
                  backgroundColor: theme.colors.error || '#E53935',
                  borderRadius: 10,
                  minWidth: 16,
                  height: 16,
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingHorizontal: 4,
                  borderWidth: 1.5,
                  borderColor: focused ? theme.colors.primary : theme.colors.surface,
                }}>
                  <Text style={{ color: '#FFF', fontSize: 9, fontWeight: 'bold' }}>
                    {totalCartItems > 99 ? '99+' : totalCartItems}
                  </Text>
                </View>
              )}
            </View>
            <Text 
              numberOfLines={1}
              style={{
                fontSize: 10,
                marginTop: 4,
                fontWeight: focused ? 'bold' : '500',
                color: focused ? '#FFF' : theme.colors.textLight,
              }}
            >
              {label}
            </Text>
          </View>
        );
      },
    })}
  >
    <Tab.Screen name="Home" component={HomeScreen} />
    <Tab.Screen name="Explore" component={ExploreScreen} />
    <Tab.Screen name="Basket" component={BasketScreen} />
    <Tab.Screen name="Orders" component={OrdersScreen} />
    <Tab.Screen name="Profile" component={ProfileScreen} />
  </Tab.Navigator>
    </View>
  );
};
