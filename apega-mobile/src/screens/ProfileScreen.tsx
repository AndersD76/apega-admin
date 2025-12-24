import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { useAuth } from '../context/AuthContext';

export function ProfileScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { user, isAuthenticated, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert('Sair', 'Deseja sair da sua conta?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: () => logout() },
    ]);
  };

  const menuItems = [
    { icon: 'pricetag-outline', title: 'Meus Anúncios', subtitle: 'Gerencie seus produtos' },
    { icon: 'trending-up-outline', title: 'Minhas Vendas', subtitle: 'Acompanhe suas vendas' },
    { icon: 'bag-outline', title: 'Minhas Compras', subtitle: 'Histórico de compras' },
    { icon: 'heart-outline', title: 'Favoritos', subtitle: 'Peças salvas' },
    { icon: 'chatbubble-outline', title: 'Mensagens', subtitle: '3 novas', badge: 3 },
    { icon: 'wallet-outline', title: 'Carteira', subtitle: 'Saldo e saques' },
    { icon: 'location-outline', title: 'Endereços', subtitle: 'Endereços de entrega' },
    { icon: 'settings-outline', title: 'Configurações', subtitle: 'Preferências' },
    { icon: 'help-circle-outline', title: 'Ajuda', subtitle: 'Central de ajuda' },
  ];

  if (!isAuthenticated) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.guestContainer}>
          <View style={styles.guestIcon}>
            <Ionicons name="person-outline" size={48} color="#5D8A7D" />
          </View>
          <Text style={styles.guestTitle}>Entre na sua conta</Text>
          <Text style={styles.guestSubtitle}>
            Faça login para acessar seus anúncios, compras e muito mais
          </Text>
          <Pressable style={styles.loginBtn} onPress={() => navigation.navigate('Login')}>
            <Text style={styles.loginBtnText}>Entrar</Text>
          </Pressable>
          <Pressable style={styles.registerBtn}>
            <Text style={styles.registerBtnText}>Criar conta</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <LinearGradient colors={['#5D8A7D', '#7BA396']} style={[styles.header, { paddingTop: insets.top + 16 }]}>
          <Pressable style={styles.settingsBtn}>
            <Ionicons name="settings-outline" size={24} color="#fff" />
          </Pressable>

          <View style={styles.avatarWrap}>
            {user?.avatar_url ? (
              <Image source={{ uri: user.avatar_url }} style={styles.avatar} contentFit="cover" />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={40} color="#5D8A7D" />
              </View>
            )}
            <Pressable style={styles.editAvatarBtn}>
              <Ionicons name="camera" size={14} color="#fff" />
            </Pressable>
          </View>

          <Text style={styles.userName}>{user?.name || 'Usuário'}</Text>
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
              <View style={styles.ratingRow}>
                <Ionicons name="star" size={14} color="#FFD700" />
                <Text style={styles.statValue}>{user?.rating?.toFixed(1) || '5.0'}</Text>
              </View>
              <Text style={styles.statLabel}>{user?.total_reviews || 0} avaliações</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Premium Banner */}
        {user?.subscription_type === 'free' && (
          <Pressable style={styles.premiumBanner}>
            <LinearGradient colors={['#FFD700', '#FFA500']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.premiumGrad}>
              <Ionicons name="star" size={24} color="#fff" />
              <View style={styles.premiumText}>
                <Text style={styles.premiumTitle}>Seja Premium</Text>
                <Text style={styles.premiumSub}>Anúncios ilimitados + destaque</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#fff" />
            </LinearGradient>
          </Pressable>
        )}

        {/* Balance */}
        <View style={styles.balanceCard}>
          <View style={styles.balanceHeader}>
            <Text style={styles.balanceLabel}>Saldo disponível</Text>
            <Pressable><Text style={styles.withdrawBtn}>Sacar</Text></Pressable>
          </View>
          <Text style={styles.balanceValue}>R$ {(user?.balance || 0).toFixed(2)}</Text>
        </View>

        {/* Menu */}
        <View style={styles.menuCard}>
          {menuItems.map((item, idx) => (
            <Pressable key={item.title} style={[styles.menuItem, idx === menuItems.length - 1 && styles.menuItemLast]}>
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

  // Guest
  guestContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  guestIcon: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#E8F0ED', alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  guestTitle: { fontSize: 24, fontWeight: '700', color: '#1A1A1A', marginBottom: 8 },
  guestSubtitle: { fontSize: 15, color: '#737373', textAlign: 'center', marginBottom: 32, lineHeight: 22 },
  loginBtn: { backgroundColor: '#5D8A7D', paddingHorizontal: 48, paddingVertical: 14, borderRadius: 28, marginBottom: 12 },
  loginBtnText: { fontSize: 16, fontWeight: '600', color: '#fff' },
  registerBtn: { paddingVertical: 14 },
  registerBtnText: { fontSize: 15, fontWeight: '600', color: '#5D8A7D' },

  // Header
  header: { paddingHorizontal: 16, paddingBottom: 24, alignItems: 'center' },
  settingsBtn: { position: 'absolute', top: 60, right: 16, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  avatarWrap: { position: 'relative', marginBottom: 12 },
  avatar: { width: 88, height: 88, borderRadius: 44, borderWidth: 3, borderColor: '#fff' },
  avatarPlaceholder: { width: 88, height: 88, borderRadius: 44, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: '#fff' },
  editAvatarBtn: { position: 'absolute', bottom: 0, right: 0, width: 28, height: 28, borderRadius: 14, backgroundColor: '#5D8A7D', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff' },
  userName: { fontSize: 22, fontWeight: '700', color: '#fff', marginBottom: 4 },
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
  withdrawBtn: { fontSize: 14, fontWeight: '600', color: '#5D8A7D' },
  balanceValue: { fontSize: 28, fontWeight: '700', color: '#1A1A1A' },

  // Menu
  menuCard: { marginHorizontal: 16, marginTop: 16, backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', elevation: 2, boxShadow: '0 1px 4px rgba(0,0,0,0.05)' } as any,
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  menuItemLast: { borderBottomWidth: 0 },
  menuIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F5F5F5', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  menuContent: { flex: 1 },
  menuTitle: { fontSize: 15, fontWeight: '500', color: '#1A1A1A' },
  menuSubtitle: { fontSize: 12, color: '#A3A3A3', marginTop: 2 },
  menuBadge: { backgroundColor: '#5D8A7D', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, marginRight: 8 },
  menuBadgeText: { fontSize: 11, fontWeight: '700', color: '#fff' },

  // Logout
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 24, paddingVertical: 16 },
  logoutText: { fontSize: 15, fontWeight: '600', color: '#EF4444' },
  version: { fontSize: 12, color: '#A3A3A3', textAlign: 'center', marginTop: 8, marginBottom: 100 },
});

export default ProfileScreen;
