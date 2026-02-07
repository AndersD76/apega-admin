import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet, Pressable, Platform, ActivityIndicator, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  useFonts,
  Nunito_400Regular,
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_800ExtraBold,
} from '@expo-google-fonts/nunito';

import { AuthProvider } from './src/context/AuthContext';
import { SocketProvider } from './src/context/SocketContext';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { colors, getColors } from './src/theme';
import {
  HomeScreen,
  ProfileScreen,
  LoginScreen,
  SearchScreen,
  FavoritesScreen,
  SellScreen,
  ProductDetailScreen,
  RegisterScreen,
  OnboardingQuizScreen,
  CartScreen,
  CheckoutScreen,
  MyProductsScreen,
  OrdersScreen,
  MessagesScreen,
  ChatScreen,
  OffersScreen,
  SettingsScreen,
  EditProfileScreen,
  AddressesScreen,
  SubscriptionScreen,
  WalletScreen,
  HelpScreen,
  EditProductScreen,
  SellerProfileScreen,
  PoliciesScreen,
  PremiumScreen,
  DiscoveryFeedScreen,
  CreateLookScreen,
  LookDetailScreen,
  QuartaLargoScreen,
} from './src/screens';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Custom Tab Bar - Largo Design (only visible on mobile)
function CustomTabBar({ state, descriptors, navigation }: any) {
  const { width } = useWindowDimensions();
  const { isDark } = useTheme();
  const themeColors = getColors(isDark);

  // Hide tab bar on desktop/web (width >= 768px)
  if (width >= 768) {
    return null;
  }

  const icons: Record<string, { active: string; inactive: string }> = {
    Home: { active: 'home', inactive: 'home-outline' },
    Search: { active: 'search', inactive: 'search-outline' },
    Sell: { active: 'add-circle', inactive: 'add-circle-outline' },
    Favorites: { active: 'heart', inactive: 'heart-outline' },
    Profile: { active: 'person', inactive: 'person-outline' },
  };

  const tabBarStyles = {
    ...styles.tabBar,
    backgroundColor: themeColors.surface,
    borderTopColor: themeColors.border,
  };

  const sellButtonStyles = {
    ...styles.sellButton,
    backgroundColor: themeColors.primary,
    ...(Platform.OS === 'web'
      ? { boxShadow: `0 4px 12px rgba(${isDark ? '232, 132, 90' : '199, 92, 58'}, 0.4)` }
      : { shadowColor: themeColors.primary }
    ),
  };

  return (
    <View style={tabBarStyles}>
      {state.routes.map((route: any, index: number) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;
        const isSell = route.name === 'Sell';

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        if (isSell) {
          return (
            <Pressable key={route.key} onPress={onPress} style={styles.sellTab}>
              <View style={sellButtonStyles}>
                <Ionicons name="pricetag" size={24} color={isDark ? themeColors.background : '#fff'} />
              </View>
              <Text style={[styles.sellLabel, { color: themeColors.primary }]}>Largar</Text>
            </Pressable>
          );
        }

        const iconConfig = icons[route.name];

        return (
          <Pressable key={route.key} onPress={onPress} style={styles.tab}>
            <Ionicons
              name={(isFocused ? iconConfig.active : iconConfig.inactive) as any}
              size={24}
              color={isFocused ? themeColors.primary : themeColors.textMuted}
            />
            <Text style={[
              styles.tabLabel,
              { color: themeColors.textMuted },
              isFocused && { color: themeColors.primary, fontWeight: '600' }
            ]}>
              {options.title || route.name}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Home' }} />
      <Tab.Screen name="Search" component={SearchScreen} options={{ title: 'Buscar' }} />
      <Tab.Screen name="Sell" component={SellScreen} options={{ title: 'Largar' }} />
      <Tab.Screen name="Favorites" component={FavoritesScreen} options={{ title: 'Quero!' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Perfil' }} />
    </Tab.Navigator>
  );
}

// Loading screen while fonts load
function LoadingScreen() {
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={styles.loadingText}>Buscando achados...</Text>
    </View>
  );
}

// Main app content with theme support
function AppContent() {
  const { isDark } = useTheme();
  const themeColors = getColors(isDark);

  return (
    <NavigationContainer>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Main" component={MainTabs} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="OnboardingQuiz" component={OnboardingQuizScreen} />
        <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
        <Stack.Screen name="Cart" component={CartScreen} />
        <Stack.Screen name="Checkout" component={CheckoutScreen} />
        <Stack.Screen name="MyProducts" component={MyProductsScreen} />
        <Stack.Screen name="EditProduct" component={EditProductScreen} />
        <Stack.Screen name="Orders" component={OrdersScreen} />
        <Stack.Screen name="Messages" component={MessagesScreen} />
        <Stack.Screen name="Chat" component={ChatScreen} />
        <Stack.Screen name="Offers" component={OffersScreen} />
        <Stack.Screen name="QuartaDesapego" component={QuartaLargoScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
        <Stack.Screen name="EditProfile" component={EditProfileScreen} />
        <Stack.Screen name="Addresses" component={AddressesScreen} />
        <Stack.Screen name="Subscription" component={SubscriptionScreen} />
        <Stack.Screen name="Wallet" component={WalletScreen} />
        <Stack.Screen name="Help" component={HelpScreen} />
        <Stack.Screen name="SellerProfile" component={SellerProfileScreen} />
        <Stack.Screen name="Policies" component={PoliciesScreen} />
        <Stack.Screen name="Premium" component={PremiumScreen} />
        <Stack.Screen name="DiscoveryFeed" component={DiscoveryFeedScreen} />
        <Stack.Screen name="CreateLook" component={CreateLookScreen} />
        <Stack.Screen name="LookDetail" component={LookDetailScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    Nunito_400Regular,
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
  });

  if (!fontsLoaded) {
    return <LoadingScreen />;
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <SocketProvider>
            <AppContent />
          </SocketProvider>
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textSecondary,
    fontFamily: 'Nunito_400Regular',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    paddingTop: 8,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: colors.textMuted,
  },
  tabLabelActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  sellTab: {
    flex: 1,
    alignItems: 'center',
    marginTop: -20,
  },
  sellButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 4px 12px rgba(199, 92, 58, 0.4)' }
      : { shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 8 }
    ),
  } as any,
  sellLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primary,
    marginTop: 4,
  },
});
