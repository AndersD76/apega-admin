import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert, ActivityIndicator, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../context/AuthContext';
import { formatPrice } from '../utils/format';
import { usersService } from '../api/users';
import { colors } from '../theme';

export function ProfileScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const auth = useAuth();
  const { user, isAuthenticated, isLoading, logout, refreshUser } = auth || {};

  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);

  const pickImage = async (type: 'avatar' | 'banner') => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert('Permissao necessaria', 'Precisamos de acesso a galeria para trocar a imagem.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: type === 'avatar' ? [1, 1] : [16, 9],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const uri = result.assets[0].uri;
      await uploadImage(uri, type);
    }
  };

  const uploadImage = async (imageUri: string, type: 'avatar' | 'banner') => {
    if (type === 'avatar') {
      setUploadingAvatar(true);
    } else {
      setUploadingBanner(true);
    }

    try {
      const response = await usersService.uploadImage(imageUri, type);
      if (response.success) {
        // Refresh user data to get updated avatar/banner URLs
        if (refreshUser) {
          await refreshUser();
        }
        Alert.alert('Sucesso', 'Imagem atualizada com sucesso!');
      }
    } catch (error: any) {
      console.error('Error uploading image:', error);
      Alert.alert('Erro', error?.response?.data?.message || 'Nao foi possivel enviar a imagem');
    } finally {
      if (type === 'avatar') {
        setUploadingAvatar(false);
      } else {
        setUploadingBanner(false);
      }
    }
  };

  const avatarUrl = user?.avatar_url;
  const bannerUrl = user?.banner_url;

  const handleLogout = async () => {
    if (Platform.OS === 'web') {
      // Use window.confirm on web since Alert.alert doesn't work properly
      const confirmed = window.confirm('Deseja sair da sua conta?');
      if (confirmed) {
        await logout?.();
      }
    } else {
      Alert.alert('Sair', 'Deseja sair da sua conta?', [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Sair', style: 'destructive', onPress: () => logout?.() },
      ]);
    }
  };

  const menuItems: Array<{ icon: string; title: string; subtitle: string; screen: string; params: object; badge?: string }> = [
    { icon: 'pricetag-outline', title: 'Meus Anúncios', subtitle: 'Gerencie seus produtos', screen: 'MyProducts', params: {} },
    { icon: 'trending-up-outline', title: 'Minhas Vendas', subtitle: 'Acompanhe suas vendas', screen: 'Orders', params: { type: 'sales' } },
    { icon: 'bag-outline', title: 'Minhas Compras', subtitle: 'Histórico de compras', screen: 'Orders', params: { type: 'purchases' } },
    { icon: 'heart-outline', title: 'Quero!', subtitle: 'Peças que você curtiu', screen: 'Favorites', params: {} },
    { icon: 'cash-outline', title: 'Minhas Ofertas', subtitle: 'Negociações', screen: 'Offers', params: {} },
    { icon: 'wallet-outline', title: 'Carteira', subtitle: 'Saldo e saques', screen: 'Wallet', params: {} },
    { icon: 'location-outline', title: 'Endereços', subtitle: 'Endereços de entrega', screen: 'Addresses', params: {} },
    { icon: 'settings-outline', title: 'Configurações', subtitle: 'Preferências', screen: 'Settings', params: {} },
    { icon: 'help-circle-outline', title: 'Ajuda', subtitle: 'Central de ajuda', screen: 'Help', params: {} },
  ];

  // Show loading only briefly, then fallback to guest view
  if (isLoading === true) {
    return (
      <View style={[styles.container, styles.loadingContainer, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Carregando...</Text>
      </View>
    );
  }

  // Guest view (not authenticated or auth not loaded yet)
  if (!isAuthenticated) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.guestContainer}>
          <View style={styles.guestIcon}>
            <Ionicons name="person-outline" size={48} color={colors.primary} />
          </View>
          <Text style={styles.guestTitle}>Entre na sua conta</Text>
          <Text style={styles.guestSubtitle}>
            Entra aí pra ver suas peças, compras e muito mais!
          </Text>
          <Pressable style={styles.loginBtn} onPress={() => navigation.navigate('Login')}>
            <Text style={styles.loginBtnText}>Entrar</Text>
          </Pressable>
          <Pressable style={styles.registerBtn} onPress={() => navigation.navigate('Register')}>
            <Text style={styles.registerBtnText}>Criar conta</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header with Banner */}
        <View style={styles.headerContainer}>
          {/* Banner Background */}
          {bannerUrl ? (
            <Image source={{ uri: bannerUrl }} style={styles.bannerImage} contentFit="cover" />
          ) : (
            <LinearGradient colors={[colors.primary, colors.primaryLight]} style={styles.bannerImage} />
          )}

          {/* Banner Edit Button */}
          <Pressable
            style={[styles.bannerEditBtn, { top: insets.top + 12 }]}
            onPress={() => pickImage('banner')}
            disabled={uploadingBanner}
          >
            {uploadingBanner ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="camera" size={18} color="#fff" />
            )}
          </Pressable>

          {/* Profile Content */}
          <View style={[styles.profileContent, { paddingTop: insets.top + 70 }]}>
            <View style={styles.avatarWrap}>
              {uploadingAvatar ? (
                <View style={styles.avatarPlaceholder}>
                  <ActivityIndicator size="large" color={colors.primary} />
                </View>
              ) : avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={styles.avatar} contentFit="cover" />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Ionicons name="person" size={48} color={colors.primary} />
                </View>
              )}
              <Pressable
                style={styles.editAvatarBtn}
                onPress={() => pickImage('avatar')}
                disabled={uploadingAvatar}
              >
                <Ionicons name="camera" size={14} color="#fff" />
              </Pressable>
            </View>

            <Text style={styles.userName}>{user?.store_name || user?.name || 'Usuário'}</Text>

            {/* Subscription Badge */}
            <Pressable
              style={[
                styles.subscriptionBadge,
                user?.subscription_type === 'premium' || user?.subscription_type === 'premium_plus'
                  ? styles.subscriptionBadgePremium
                  : styles.subscriptionBadgeFree
              ]}
              onPress={() => navigation.navigate('Premium')}
            >
              <Ionicons
                name={user?.subscription_type === 'premium' || user?.subscription_type === 'premium_plus' ? 'star' : 'star-outline'}
                size={12}
                color={user?.subscription_type === 'premium' || user?.subscription_type === 'premium_plus' ? '#fff' : '#737373'}
              />
              <Text style={[
                styles.subscriptionBadgeText,
                user?.subscription_type === 'premium' || user?.subscription_type === 'premium_plus'
                  ? styles.subscriptionBadgeTextPremium
                  : styles.subscriptionBadgeTextFree
              ]}>
                {user?.subscription_type === 'premium' || user?.subscription_type === 'premium_plus' ? 'Premium' : 'Free'}
              </Text>
            </Pressable>

            {user?.city && (
              <View style={styles.locationRow}>
                <Ionicons name="location" size={14} color="rgba(255,255,255,0.8)" />
                <Text style={styles.locationText}>{user.city}</Text>
              </View>
            )}

            {/* Stats */}
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{user?.total_sales || 0}</Text>
                <Text style={styles.statLabel}>Vendas</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{user?.total_followers || 0}</Text>
                <Text style={styles.statLabel}>Seguidores</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                {user?.total_reviews && user.total_reviews > 0 ? (
                  <>
                    <View style={styles.ratingRow}>
                      <Ionicons name="star" size={14} color="#FFD700" />
                      <Text style={styles.statValue}>{user?.rating?.toFixed(1) || '-'}</Text>
                    </View>
                    <Text style={styles.statLabel}>{user.total_reviews} avaliações</Text>
                  </>
                ) : (
                  <>
                    <Text style={styles.statValue}>-</Text>
                    <Text style={styles.statLabel}>Estrelas</Text>
                  </>
                )}
              </View>
            </View>
          </View>
        </View>

        {/* Premium Banner */}
        {(!user?.subscription_type || user?.subscription_type === 'free') && (
          <Pressable style={styles.premiumBanner} onPress={() => navigation.navigate('Premium')}>
            <LinearGradient colors={['#FFD700', '#FFA500']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.premiumGrad}>
              <Ionicons name="star" size={24} color="#fff" />
              <View style={styles.premiumText}>
                <Text style={styles.premiumTitle}>Seja Premium</Text>
                <Text style={styles.premiumSub}>IA para fotos + taxa de apenas 10%</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#fff" />
            </LinearGradient>
          </Pressable>
        )}

        {/* Balance */}
        <View style={styles.balanceCard}>
          <View style={styles.balanceHeader}>
            <Text style={styles.balanceLabel}>Saldo disponível</Text>
            <Pressable onPress={() => navigation.navigate('Wallet')}><Text style={styles.withdrawBtn}>Sacar</Text></Pressable>
          </View>
          <Text style={styles.balanceValue}>R$ {formatPrice(user?.balance || 0)}</Text>
        </View>

        {/* Menu */}
        <View style={styles.menuCard}>
          {menuItems.map((item, idx) => (
            <Pressable key={item.title} style={[styles.menuItem, idx === menuItems.length - 1 && styles.menuItemLast]} onPress={() => item.screen && navigation.navigate(item.screen, item.params)}>
              <View style={styles.menuIcon}>
                <Ionicons name={item.icon as any} size={22} color="#525252" />
              </View>
              <View style={styles.menuContent}>
                <Text style={styles.menuTitle}>{item.title}</Text>
                <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
              </View>
              {item.badge && (
                <View style={styles.menuBadge}>
                  <Text style={styles.menuBadgeText}>{item.badge}</Text>
                </View>
              )}
              <Ionicons name="chevron-forward" size={20} color="#A3A3A3" />
            </Pressable>
          ))}
        </View>

        {/* Logout */}
        <Pressable style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={22} color="#EF4444" />
          <Text style={styles.logoutText}>Sair da conta</Text>
        </Pressable>

        <Text style={styles.version}>Versão 1.0.0</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  loadingContainer: { alignItems: 'center', justifyContent: 'center' },
  loadingText: { fontSize: 14, color: '#737373', marginTop: 12 },

  // Guest
  guestContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  guestIcon: { width: 100, height: 100, borderRadius: 50, backgroundColor: colors.primaryMuted, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  guestTitle: { fontSize: 24, fontWeight: '700', color: '#1A1A1A', marginBottom: 8 },
  guestSubtitle: { fontSize: 15, color: '#737373', textAlign: 'center', marginBottom: 32, lineHeight: 22 },
  loginBtn: { backgroundColor: colors.primary, paddingHorizontal: 48, paddingVertical: 14, borderRadius: 28, marginBottom: 12 },
  loginBtnText: { fontSize: 16, fontWeight: '600', color: '#fff' },
  registerBtn: { paddingVertical: 14 },
  registerBtnText: { fontSize: 15, fontWeight: '600', color: colors.primary },

  // Header with Banner
  headerContainer: { position: 'relative', backgroundColor: colors.primary, minHeight: 320 },
  bannerImage: { position: 'absolute', top: 0, left: 0, right: 0, height: 160, zIndex: 0 },
  bannerEditBtn: { position: 'absolute', right: 16, width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center', zIndex: 10 },
  profileContent: { paddingHorizontal: 16, paddingBottom: 24, alignItems: 'center', zIndex: 1 },
  avatarWrap: { position: 'relative', marginBottom: 12 },
  avatar: { width: 100, height: 100, borderRadius: 50, borderWidth: 3, borderColor: '#fff' },
  avatarPlaceholder: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: '#fff' },
  editAvatarBtn: { position: 'absolute', bottom: 0, right: 0, width: 28, height: 28, borderRadius: 14, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff' },
  userName: { fontSize: 22, fontWeight: '700', color: '#fff', marginBottom: 4 },
  subscriptionBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, marginBottom: 8 },
  subscriptionBadgeFree: { backgroundColor: 'rgba(255,255,255,0.2)' },
  subscriptionBadgePremium: { backgroundColor: '#FFD700' },
  subscriptionBadgeText: { fontSize: 12, fontWeight: '600' },
  subscriptionBadgeTextFree: { color: 'rgba(255,255,255,0.9)' },
  subscriptionBadgeTextPremium: { color: '#fff' },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 16 },
  locationText: { fontSize: 14, color: 'rgba(255,255,255,0.8)' },
  statsRow: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 16, paddingVertical: 12, paddingHorizontal: 24 },
  statItem: { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.3)', marginHorizontal: 16 },
  statValue: { fontSize: 18, fontWeight: '700', color: '#fff' },
  statLabel: { fontSize: 11, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },

  // Premium
  premiumBanner: { marginHorizontal: 16, marginTop: -12, borderRadius: 16, overflow: 'hidden', elevation: 4, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' } as any,
  premiumGrad: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16, gap: 12 },
  premiumText: { flex: 1 },
  premiumTitle: { fontSize: 16, fontWeight: '700', color: '#fff' },
  premiumSub: { fontSize: 12, color: 'rgba(255,255,255,0.9)' },

  // Balance
  balanceCard: { marginHorizontal: 16, marginTop: 16, backgroundColor: '#fff', borderRadius: 16, padding: 16, elevation: 2, boxShadow: '0 1px 4px rgba(0,0,0,0.05)' } as any,
  balanceHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  balanceLabel: { fontSize: 14, color: '#737373' },
  withdrawBtn: { fontSize: 14, fontWeight: '600', color: colors.primary },
  balanceValue: { fontSize: 28, fontWeight: '700', color: '#1A1A1A' },

  // Menu
  menuCard: { marginHorizontal: 16, marginTop: 16, backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', elevation: 2, boxShadow: '0 1px 4px rgba(0,0,0,0.05)' } as any,
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  menuItemLast: { borderBottomWidth: 0 },
  menuIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F5F5F5', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  menuContent: { flex: 1 },
  menuTitle: { fontSize: 15, fontWeight: '500', color: '#1A1A1A' },
  menuSubtitle: { fontSize: 12, color: '#A3A3A3', marginTop: 2 },
  menuBadge: { backgroundColor: colors.primary, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, marginRight: 8 },
  menuBadgeText: { fontSize: 11, fontWeight: '700', color: '#fff' },

  // Logout
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 24, paddingVertical: 16 },
  logoutText: { fontSize: 15, fontWeight: '600', color: '#EF4444' },
  version: { fontSize: 12, color: '#A3A3A3', textAlign: 'center', marginTop: 8, marginBottom: 100 },
});

export default ProfileScreen;
