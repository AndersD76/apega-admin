import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/HomeScreen';
import ItemDetailScreen from '../screens/ItemDetailScreen';
import NewItemScreen from '../screens/NewItemScreen';
import SubscriptionScreen from '../screens/SubscriptionScreen';
import SearchScreen from '../screens/SearchScreen';
import ProfileScreen from '../screens/ProfileScreen';
import FavoritesScreen from '../screens/FavoritesScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import CreateProductScreen from '../screens/CreateProductScreen';
import SalesScreen from '../screens/SalesScreen';
import MessagesScreen from '../screens/MessagesScreen';
import LoginScreen from '../screens/LoginScreen';
import SettingsScreen from '../screens/SettingsScreen';
import CheckoutScreen from '../screens/CheckoutScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import OrdersScreen from '../screens/OrdersScreen';
import CartScreen from '../screens/CartScreen';
import ReviewsScreen from '../screens/ReviewsScreen';
import MyStoreScreen from '../screens/MyStoreScreen';
import BalanceScreen from '../screens/BalanceScreen';
import AddressesScreen from '../screens/AddressesScreen';
import AddAddressScreen from '../screens/AddAddressScreen';
import PaymentsScreen from '../screens/PaymentsScreen';
import HelpScreen from '../screens/HelpScreen';
import TermsScreen from '../screens/TermsScreen';
import EditProductScreen from '../screens/EditProductScreen';

export type RootStackParamList = {
  Login: undefined;
  Home: undefined;
  ItemDetail: { itemId?: string; item?: any };
  NewItem: { productId?: string };
  EditProduct: { productId: string };
  Subscription: undefined;
  Search: undefined;
  Profile: undefined;
  Favorites: undefined;
  Notifications: undefined;
  CreateProduct: undefined;
  Sales: undefined;
  Messages: undefined;
  Settings: undefined;
  Checkout: { item?: any };
  EditProfile: undefined;
  Orders: undefined;
  Cart: undefined;
  Reviews: undefined;
  MyStore: undefined;
  Balance: undefined;
  Addresses: undefined;
  AddAddress: { address?: any };
  Payments: undefined;
  Help: undefined;
  Terms: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="ItemDetail" component={ItemDetailScreen} />
        <Stack.Screen name="NewItem" component={NewItemScreen} />
        <Stack.Screen name="Subscription" component={SubscriptionScreen} />
        <Stack.Screen name="Search" component={SearchScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="Favorites" component={FavoritesScreen} />
        <Stack.Screen name="Notifications" component={NotificationsScreen} />
        <Stack.Screen name="CreateProduct" component={CreateProductScreen} />
        <Stack.Screen name="Sales" component={SalesScreen} />
        <Stack.Screen name="Messages" component={MessagesScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
        <Stack.Screen name="Checkout" component={CheckoutScreen} />
        <Stack.Screen name="EditProfile" component={EditProfileScreen} />
        <Stack.Screen name="Orders" component={OrdersScreen} />
        <Stack.Screen name="Cart" component={CartScreen} />
        <Stack.Screen name="Reviews" component={ReviewsScreen} />
        <Stack.Screen name="MyStore" component={MyStoreScreen} />
        <Stack.Screen name="Balance" component={BalanceScreen} />
        <Stack.Screen name="Addresses" component={AddressesScreen} />
        <Stack.Screen name="AddAddress" component={AddAddressScreen} />
        <Stack.Screen name="Payments" component={PaymentsScreen} />
        <Stack.Screen name="Help" component={HelpScreen} />
        <Stack.Screen name="Terms" component={TermsScreen} />
        <Stack.Screen name="EditProduct" component={EditProductScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
