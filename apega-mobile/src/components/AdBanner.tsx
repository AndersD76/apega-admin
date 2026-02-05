import React, { useState } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';

// IDs de PRODUÇÃO - Largô
const AD_UNIT_IDS = {
  android: 'ca-app-pub-3584331403172895/7609410512',
  ios: 'ca-app-pub-3584331403172895/7609410512',
};

interface AdBannerProps {
  size?: 'banner' | 'largeBanner' | 'mediumRectangle' | 'fullBanner' | 'leaderboard';
  style?: object;
}

// Componente que só carrega AdMob em plataformas nativas
function NativeAdBanner({ size, style }: AdBannerProps) {
  const [adError, setAdError] = useState(false);
  const [adLoaded, setAdLoaded] = useState(false);

  // Import dinâmico só funciona em runtime, então usamos require condicional
  try {
    const { BannerAd, BannerAdSize, useForeground } = require('react-native-google-mobile-ads');

    // Hook para recarregar quando app volta ao primeiro plano
    useForeground();

    const getAdUnitId = () => {
      return Platform.OS === 'android' ? AD_UNIT_IDS.android : AD_UNIT_IDS.ios;
    };

    const getBannerSize = () => {
      switch (size) {
        case 'largeBanner':
          return BannerAdSize.LARGE_BANNER;
        case 'mediumRectangle':
          return BannerAdSize.MEDIUM_RECTANGLE;
        case 'fullBanner':
          return BannerAdSize.FULL_BANNER;
        case 'leaderboard':
          return BannerAdSize.LEADERBOARD;
        default:
          return BannerAdSize.BANNER;
      }
    };

    if (adError) {
      return null;
    }

    return (
      <View style={[styles.container, style]}>
        {!adLoaded && (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderText}>Carregando...</Text>
          </View>
        )}
        <BannerAd
          unitId={getAdUnitId()}
          size={getBannerSize()}
          requestOptions={{
            requestNonPersonalizedAdsOnly: true,
          }}
          onAdLoaded={() => {
            setAdLoaded(true);
          }}
          onAdFailedToLoad={() => {
            setAdError(true);
          }}
        />
      </View>
    );
  } catch (error) {
    // Se falhar ao carregar o módulo, retorna null
    return null;
  }
}

// Componente principal que verifica a plataforma
export function AdBanner({ size = 'banner', style }: AdBannerProps) {
  // Na web, não mostra anúncios (AdMob não suporta web)
  if (Platform.OS === 'web') {
    return null;
  }

  return <NativeAdBanner size={size} style={style} />;
}

// Componente de fallback para quando o anúncio não carrega
export function FallbackAdBanner({ style }: { style?: object }) {
  return (
    <View style={[styles.fallbackContainer, style]}>
      <View style={styles.fallbackContent}>
        <Text style={styles.fallbackLabel}>Anúncio</Text>
        <Text style={styles.fallbackText}>Espaço disponível para publicidade</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 12,
  },
  placeholder: {
    position: 'absolute',
    backgroundColor: '#f5f5f5',
    padding: 20,
    borderRadius: 8,
  },
  placeholderText: {
    fontSize: 12,
    color: '#999',
  },
  fallbackContainer: {
    marginVertical: 12,
    marginHorizontal: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  fallbackContent: {
    padding: 16,
    alignItems: 'center',
  },
  fallbackLabel: {
    fontSize: 10,
    color: '#adb5bd',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  fallbackText: {
    fontSize: 13,
    color: '#868e96',
  },
});

export default AdBanner;
