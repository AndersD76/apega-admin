import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { AuthProvider } from './src/context/AuthContext';
import { HomeScreen } from './src/screens/HomeScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { LoginScreen } from './src/screens/LoginScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Placeholder screens
function SearchScreen() {
  return (
    <View style={styles.placeholder}>
      <Ionicons name="search" size={48} color="#5D8A7D" />
      <Text style={styles.placeholderTitle}>Buscar</Text>
      <Text style={styles.placeholderText}>Em breve</Text>
    </View>
  );
}

function FavoritesScreen() {
  return (
    <View style={styles.placeholder}>
      <Ionicons name="heart" size={48} color="#5D8A7D" />
      <Text style={styles.placeholderTitle}>Favoritos</Text>
      <Text style={styles.placeholderText}>Em breve</Text>
    </View>
  );
}

function SellScreen() {
  return (
    <View style={styles.placeholder}>
      <Ionicons name="camera" size={48} color="#5D8A7D" />
      <Text style={styles.placeholderTitle}>Vender</Text>
      <Text style={styles.placeholderText}>Em breve</Text>
    </View>
  );
}

// Custom Tab Bar
function CustomTabBar({ state, descriptors, navigation }: any) {
  return (
    <View style={styles.tabBar}>
      {state.routes.map((route: any, index: number) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;
        const isSell = route.name === 'Sell';

        const icons: Record<string, string> = {
          Home: 'home',
          Search: 'search',
          Sell: 'add',
          Favorites: 'heart',
          Profile: 'person',
        };

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
              <LinearGradient
                colors={['#5D8A7D', '#7BA396']}
                style={styles.sellButton}
              >
                <Ionicons name="add" size={28} color="#fff" />
              </LinearGradient>
            </Pressable>
          );
        }

        return (
          <Pressable key={route.key} onPress={onPress} style={styles.tab}>
            <View style={[styles.tabIconWrap, isFocused && styles.tabIconActive]}>
              <Ionicons
                name={(isFocused ? icons[route.name] : `${icons[route.name]}-outline`) as any}
                size={22}
                color={isFocused ? '#5D8A7D' : '#A3A3A3'}
              />
            </View>
            <Text style={[styles.tabLabel, isFocused && styles.tabLabelActive]}>
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
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Início' }} />
      <Tab.Screen name="Search" component={SearchScreen} options={{ title: 'Buscar' }} />
      <Tab.Screen name="Sell" component={SellScreen} options={{ title: 'Vender' }} />
      <Tab.Screen name="Favorites" component={FavoritesScreen} options={{ title: 'Favoritos' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Perfil' }} />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NavigationContainer>
          <StatusBar style="dark" />
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen name="Login" component={LoginScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FAFAFA',
  },
  placeholderTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
    marginTop: 16,
  },
  placeholderText: {
    fontSize: 14,
    color: '#A3A3A3',
    marginTop: 8,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E8E8E8',
    paddingTop: 8,
    paddingBottom: 24,
    paddingHorizontal: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
  },
  tabIconWrap: {
    width: 44,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
  },
  tabIconActive: {
    backgroundColor: '#E8F0ED',
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: '#A3A3A3',
    marginTop: 4,
  },
  tabLabelActive: {
    color: '#5D8A7D',
    fontWeight: '600',
  },
  sellTab: {
    flex: 1,
    alignItems: 'center',
    marginTop: -24,
  },
  sellButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 8px rgba(93,138,125,0.3)',
    elevation: 8,
  } as any,
});
