import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeScreen, LoginScreen, ProfileScreen, DiscoveryFeedScreen, CreateLookScreen, LookDetailScreen, SelectAuctionProductsScreen } from '../screens';
import { colors } from '../theme';

export type RootStackParamList = {
  Login: undefined;
  Main: undefined;
  Home: undefined;
  Profile: undefined;
  Search: undefined;
  Discovery: undefined;
  Favorites: undefined;
  NewItem: undefined;
  ProductDetail: { productId: string };
  Cart: undefined;
  MyProducts: undefined;
  Sales: undefined;
  Orders: undefined;
  Messages: undefined;
  Wallet: undefined;
  Addresses: undefined;
  Settings: undefined;
  Help: undefined;
  CreateLook: { productId?: string };
  LookDetail: { lookId: string };
  SelectAuctionProducts: undefined;
  QuartaLargo: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

// Placeholder screen for routes not yet implemented
function PlaceholderScreen() {
  return null;
}

export function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.white },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="Main" component={HomeScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="Search" component={PlaceholderScreen} />
        <Stack.Screen
          name="Discovery"
          component={DiscoveryFeedScreen}
          options={{ animation: 'slide_from_bottom' }}
        />
        <Stack.Screen name="Favorites" component={PlaceholderScreen} />
        <Stack.Screen name="NewItem" component={PlaceholderScreen} />
        <Stack.Screen name="ProductDetail" component={PlaceholderScreen} />
        <Stack.Screen name="Cart" component={PlaceholderScreen} />
        <Stack.Screen name="MyProducts" component={PlaceholderScreen} />
        <Stack.Screen name="Sales" component={PlaceholderScreen} />
        <Stack.Screen name="Orders" component={PlaceholderScreen} />
        <Stack.Screen name="Messages" component={PlaceholderScreen} />
        <Stack.Screen name="Wallet" component={PlaceholderScreen} />
        <Stack.Screen name="Addresses" component={PlaceholderScreen} />
        <Stack.Screen name="Settings" component={PlaceholderScreen} />
        <Stack.Screen name="Help" component={PlaceholderScreen} />
        <Stack.Screen name="CreateLook" component={CreateLookScreen} />
        <Stack.Screen name="LookDetail" component={LookDetailScreen} />
        <Stack.Screen
          name="SelectAuctionProducts"
          component={SelectAuctionProductsScreen}
          options={{ animation: 'slide_from_bottom' }}
        />
        <Stack.Screen name="QuartaLargo" component={PlaceholderScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default AppNavigator;
