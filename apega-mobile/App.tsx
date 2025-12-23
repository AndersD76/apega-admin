import React from 'react';
import { TamaguiProvider } from 'tamagui';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import AppNavigator from './src/navigation/AppNavigator';
import { ProductsProvider } from './src/contexts/ProductsContext';
import { AuthProvider } from './src/contexts/AuthContext';
import config from './tamagui.config';

export default function App() {
  const [loaded] = useFonts({
    Inter: require('@tamagui/font-inter/otf/Inter-Medium.otf'),
    InterBold: require('@tamagui/font-inter/otf/Inter-Bold.otf'),
  });

  if (!loaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <TamaguiProvider config={config}>
        <AuthProvider>
          <ProductsProvider>
            <StatusBar style="dark" />
            <AppNavigator />
          </ProductsProvider>
        </AuthProvider>
      </TamaguiProvider>
    </GestureHandlerRootView>
  );
}
