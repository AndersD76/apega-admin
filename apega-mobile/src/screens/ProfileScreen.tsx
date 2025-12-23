import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  YStack,
  XStack,
  Text,
  Image,
  ScrollView,
  Stack,
  styled,
  useTheme,
  Spinner,
  Separator,
} from 'tamagui';
import { RefreshControl, Pressable, useWindowDimensions, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../contexts/AuthContext';
import { getMyProducts, Product } from '../services/products';
import { Button, Avatar } from '../components/ui';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';

const isWeb = Platform.OS === 'web';

type Props = NativeStackScreenProps<RootStackParamList, 'Profile'>;

// Styled Components
const Container = styled(YStack, {
  flex: 1,
  backgroundColor: '$background',
});

const Header = styled(XStack, {
  paddingHorizontal: '$4',
  paddingVertical: '$3',
  alignItems: 'center',
  justifyContent: 'space-between',
  borderBottomWidth: 1,
  borderBottomColor: '$borderColor',
  backgroundColor: '$background',
});

const Logo = styled(Text, {
  fontSize: 20,
  fontWeight: '700',
  color: '$brand',
  fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
});

const ProfileSection = styled(YStack, {
  alignItems: 'center',
  paddingVertical: '$6',
  paddingHorizontal: '$4',
  borderBottomWidth: 1,
  borderBottomColor: '$borderColor',
});

const AvatarContainer = styled(Stack, {
  position: 'relative',
  marginBottom: '$4',
});

const EditAvatarButton = styled(Stack, {
  position: 'absolute',
  bottom: 0,
  right: 0,
  width: 32,
  height: 32,
  borderRadius: 16,
  backgroundColor: '$brand',
  alignItems: 'center',
  justifyContent: 'center',
  borderWidth: 3,
  borderColor: '$background',
});

const UserName = styled(Text, {
  fontSize: 22,
  fontWeight: '600',
  color: '$color',
  marginBottom: '$1',
});

const UserEmail = styled(Text, {
  fontSize: 14,
  color: '$placeholderColor',
});

const RatingContainer = styled(XStack, {
  alignItems: 'center',
  gap: '$1',
  marginTop: '$2',
});

const StatsContainer = styled(XStack, {
  paddingVertical: '$4',
  paddingHorizontal: '$4',
  borderBottomWidth: 1,
  borderBottomColor: '$borderColor',
});

const StatItem = styled(YStack, {
  flex: 1,
  alignItems: 'center',
});

const StatValue = styled(Text, {
  fontSize: 24,
  fontWeight: '700',
  color: '$color',
});

const StatLabel = styled(Text, {
  fontSize: 13,
  color: '$placeholderColor',
  marginTop: '$1',
});

const StatDivider = styled(Stack, {
  width: 1,
  backgroundColor: '$borderColor',
});

const MenuSection = styled(YStack, {
  paddingTop: '$5',
  paddingHorizontal: '$4',
});

const MenuSectionTitle = styled(Text, {
  fontSize: 13,
  fontWeight: '600',
  color: '$placeholderColor',
  textTransform: 'lowercase',
  marginBottom: '$3',
  paddingLeft: '$1',
});

const MenuItem = styled(XStack, {
  alignItems: 'center',
  justifyContent: 'space-between',
  paddingVertical: '$3',
  pressStyle: {
    opacity: 0.7,
  },
});

const MenuLeft = styled(XStack, {
  alignItems: 'center',
  flex: 1,
  gap: '$3',
});

const MenuIconWrap = styled(Stack, {
  width: 40,
  height: 40,
  borderRadius: 20,
  backgroundColor: '$backgroundStrong',
  alignItems: 'center',
  justifyContent: 'center',

  variants: {
    complete: {
      true: {
        backgroundColor: '$brand',
      },
    },
  } as const,
});

const MenuContent = styled(YStack, {
  flex: 1,
});

const MenuLabel = styled(Text, {
  fontSize: 15,
  fontWeight: '500',
  color: '$color',
});

const MenuValue = styled(Text, {
  fontSize: 13,
  color: '$placeholderColor',
  marginTop: 2,
});

const MenuDivider = styled(Stack, {
  height: 1,
  backgroundColor: '$borderColor',
  marginLeft: 52,
});

const LogoutButton = styled(XStack, {
  alignItems: 'center',
  justifyContent: 'center',
  gap: '$2',
  paddingVertical: '$4',
  marginTop: '$5',
  marginHorizontal: '$4',
  borderTopWidth: 1,
  borderTopColor: '$borderColor',
  pressStyle: {
    opacity: 0.7,
  },
});

const VersionText = styled(Text, {
  fontSize: 12,
  color: '$placeholderColor',
  textAlign: 'center',
  paddingVertical: '$4',
});

// Guest State Components
const GuestContainer = styled(YStack, {
  flex: 1,
  alignItems: 'center',
  justifyContent: 'center',
  padding: '$6',
});

const GuestAvatar = styled(Stack, {
  width: 100,
  height: 100,
  borderRadius: 50,
  backgroundColor: '$backgroundStrong',
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: '$5',
});

const GuestTitle = styled(Text, {
  fontSize: 24,
  fontWeight: '600',
  color: '$color',
  marginBottom: '$2',
});

const GuestSubtitle = styled(Text, {
  fontSize: 15,
  color: '$placeholderColor',
  textAlign: 'center',
  marginBottom: '$6',
  lineHeight: 22,
});

// Bottom Navigation
const BottomNav = styled(XStack, {
  position: 'absolute',
  bottom: 0,
  left: 0,
  right: 0,
  backgroundColor: 'rgba(255,255,255,0.98)',
  borderTopWidth: 1,
  borderTopColor: '$borderColor',
  paddingTop: '$3',
  justifyContent: 'space-around',
  alignItems: 'flex-end',
});

const NavItem = styled(YStack, {
  flex: 1,
  alignItems: 'center',
  justifyContent: 'center',
  paddingVertical: '$1',
  pressStyle: {
    opacity: 0.7,
  },
});

const NavIconWrap = styled(Stack, {
  width: 48,
  height: 32,
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: 16,

  variants: {
    active: {
      true: {
        backgroundColor: '$brandMuted',
      },
    },
  } as const,
});

const NavLabel = styled(Text, {
  fontSize: 11,
  fontWeight: '600',
  color: '$placeholderColor',
  marginTop: '$1',

  variants: {
    active: {
      true: {
        color: '$brand',
        fontWeight: '700',
      },
    },
  } as const,
});

const CenterNavButton = styled(Stack, {
  marginTop: -28,
  width: 60,
  height: 60,
  borderRadius: 30,
  alignItems: 'center',
  justifyContent: 'center',
  shadowColor: '$brand',
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.4,
  shadowRadius: 16,
  elevation: 8,
  pressStyle: {
    scale: 0.95,
  },
  animation: 'bouncy',
});

// Menu Item Component
function MenuItemRow({
  icon,
  label,
  value,
  onPress,
  isComplete = false,
}: {
  icon: string;
  label: string;
  value?: string;
  onPress?: () => void;
  isComplete?: boolean;
}) {
  const theme = useTheme();

  return (
    <Pressable onPress={onPress}>
      <MenuItem>
        <MenuLeft>
          <MenuIconWrap complete={isComplete}>
            <Ionicons
              name={icon as any}
              size={18}
              color={isComplete ? 'white' : theme.placeholderColor?.val}
            />
          </MenuIconWrap>
          <MenuContent>
            <MenuLabel>{label}</MenuLabel>
            {value && <MenuValue>{value}</MenuValue>}
          </MenuContent>
        </MenuLeft>
        <Ionicons name="chevron-forward" size={20} color={theme.borderColor?.val} />
      </MenuItem>
    </Pressable>
  );
}

export default function ProfileScreen({ navigation }: Props) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const isDesktop = isWeb && width > 900;

  const { user, isAuthenticated, isLoading, refreshUser, logout } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadProducts = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const response = await getMyProducts();
      setProducts(response.products || []);
    } catch (error) {
      console.error('Erro:', error);
      setProducts([]);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      refreshUser();
      loadProducts();
    }
  }, [isAuthenticated, refreshUser, loadProducts]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshUser();
    await loadProducts();
    setRefreshing(false);
  };

  const stats = useMemo(
    () => ({
      active: products.filter((p) => p.status === 'active').length,
      sold: products.filter((p) => p.status === 'sold').length,
      total: products.length,
    }),
    [products]
  );

  const navItems = [
    { key: 'Home', icon: 'home', label: 'Início' },
    { key: 'Search', icon: 'search', label: 'Buscar' },
    { key: 'NewItem', icon: 'add', label: 'Vender', isCenter: true },
    { key: 'Favorites', icon: 'heart', label: 'Salvos' },
    { key: 'Profile', icon: 'person', label: 'Perfil' },
  ];

  if (isLoading) {
    return (
      <Container alignItems="center" justifyContent="center">
        <Spinner size="large" color="$brand" />
      </Container>
    );
  }

  // Guest State
  if (!isAuthenticated || !user) {
    return (
      <Container>
        <Header paddingTop={isWeb ? '$3' : insets.top + 8}>
          <Pressable onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={theme.color?.val} />
          </Pressable>
          <Logo>brechó</Logo>
          <Stack width={24} />
        </Header>

        <GuestContainer>
          <GuestAvatar>
            <Ionicons name="person-outline" size={48} color={theme.placeholderColor?.val} />
          </GuestAvatar>

          <GuestTitle>entre na sua conta</GuestTitle>
          <GuestSubtitle>para vender, comprar e acompanhar seus pedidos</GuestSubtitle>

          <YStack width="100%" maxWidth={300} gap="$3">
            <Button
              variant="primary"
              size="lg"
              fullWidth
              onPress={() => navigation.navigate('Login')}
            >
              entrar
            </Button>
            <Button
              variant="secondary"
              size="lg"
              fullWidth
              onPress={() => navigation.navigate('Register')}
            >
              criar conta
            </Button>
          </YStack>
        </GuestContainer>

        {!isDesktop && (
          <BottomNav paddingBottom={Math.max(insets.bottom, 12)}>
            {navItems.map((item) => {
              const isActive = item.key === 'Profile';

              if (item.isCenter) {
                return (
                  <Pressable key={item.key} onPress={() => navigation.navigate(item.key as any)}>
                    <CenterNavButton>
                      <LinearGradient
                        colors={['#5D8A7D', '#7BA396']}
                        style={{ width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center' }}
                      >
                        <Ionicons name="add" size={32} color="white" />
                      </LinearGradient>
                    </CenterNavButton>
                  </Pressable>
                );
              }

              return (
                <Pressable key={item.key} onPress={() => navigation.navigate(item.key as any)}>
                  <NavItem>
                    <NavIconWrap active={isActive}>
                      <Ionicons
                        name={isActive ? (item.icon as any) : (`${item.icon}-outline` as any)}
                        size={24}
                        color={isActive ? theme.brand?.val : theme.placeholderColor?.val}
                      />
                    </NavIconWrap>
                    <NavLabel active={isActive}>{item.label}</NavLabel>
                  </NavItem>
                </Pressable>
              );
            })}
          </BottomNav>
        )}
      </Container>
    );
  }

  const rating = typeof user.rating === 'number' ? user.rating : parseFloat(user.rating || '0');
  const hasAddress = user.city && user.state;
  const hasPhone = user.phone;

  return (
    <Container>
      <Header paddingTop={isWeb ? '$3' : insets.top + 8}>
        <Pressable onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={theme.color?.val} />
        </Pressable>
        <Logo>brechó</Logo>
        <Pressable onPress={() => navigation.navigate('EditProfile')}>
          <Avatar src={user.avatar_url} name={user.name} size="sm" />
        </Pressable>
      </Header>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={theme.brand?.val}
            colors={[theme.brand?.val || '#5D8A7D']}
          />
        }
        contentContainerStyle={{ paddingBottom: isWeb ? 40 : 120 }}
      >
        {/* Profile Section */}
        <ProfileSection>
          <AvatarContainer>
            <Avatar src={user.avatar_url} name={user.name} size="xl" />
            <Pressable onPress={() => navigation.navigate('EditProfile')}>
              <EditAvatarButton>
                <Ionicons name="camera" size={14} color="white" />
              </EditAvatarButton>
            </Pressable>
          </AvatarContainer>

          <UserName>{user.store_name || user.name}</UserName>
          <UserEmail>{user.email}</UserEmail>

          {user.total_reviews > 0 && (
            <RatingContainer>
              <Ionicons name="star" size={14} color="#F5A623" />
              <Text fontSize={14} fontWeight="600" color="$color">{rating.toFixed(1)}</Text>
              <Text fontSize={13} color="$placeholderColor">({user.total_reviews} avaliações)</Text>
            </RatingContainer>
          )}
        </ProfileSection>

        {/* Stats */}
        <StatsContainer>
          <StatItem>
            <StatValue>{stats.total}</StatValue>
            <StatLabel>anúncios</StatLabel>
          </StatItem>
          <StatDivider />
          <StatItem>
            <StatValue>{stats.sold}</StatValue>
            <StatLabel>vendas</StatLabel>
          </StatItem>
          <StatDivider />
          <StatItem>
            <StatValue>{user.total_followers || 0}</StatValue>
            <StatLabel>seguidores</StatLabel>
          </StatItem>
        </StatsContainer>

        {/* Menu Sections */}
        <MenuSection>
          <MenuSectionTitle>minha conta</MenuSectionTitle>
          <MenuItemRow
            icon="mail-outline"
            label="email"
            value={user.email}
            isComplete={!!user.email}
            onPress={() => navigation.navigate('EditProfile')}
          />
          <MenuDivider />
          <MenuItemRow
            icon="person-outline"
            label="dados pessoais"
            value={user.name ? 'completo' : 'pendente'}
            isComplete={!!user.name}
            onPress={() => navigation.navigate('EditProfile')}
          />
          <MenuDivider />
          <MenuItemRow
            icon="call-outline"
            label="telefone"
            value={hasPhone ? user.phone : 'adicionar'}
            isComplete={!!hasPhone}
            onPress={() => navigation.navigate('EditProfile')}
          />
          <MenuDivider />
          <MenuItemRow
            icon="location-outline"
            label="endereço"
            value={hasAddress ? `${user.city}, ${user.state}` : 'adicionar'}
            isComplete={!!hasAddress}
            onPress={() => navigation.navigate('EditProfile')}
          />
        </MenuSection>

        <MenuSection>
          <MenuSectionTitle>minhas vendas</MenuSectionTitle>
          <MenuItemRow
            icon="pricetag-outline"
            label="meus anúncios"
            value={`${stats.total} itens`}
            onPress={() => navigation.navigate('MyProducts' as any)}
          />
          <MenuDivider />
          <MenuItemRow
            icon="stats-chart-outline"
            label="painel de vendas"
            onPress={() => navigation.navigate('Sales')}
          />
          <MenuDivider />
          <MenuItemRow
            icon="wallet-outline"
            label="meus ganhos"
            onPress={() => navigation.navigate('Sales')}
          />
        </MenuSection>

        <MenuSection>
          <MenuSectionTitle>minhas compras</MenuSectionTitle>
          <MenuItemRow
            icon="bag-outline"
            label="meus pedidos"
            onPress={() => navigation.navigate('Orders')}
          />
          <MenuDivider />
          <MenuItemRow
            icon="heart-outline"
            label="favoritos"
            onPress={() => navigation.navigate('Favorites')}
          />
        </MenuSection>

        <MenuSection>
          <MenuSectionTitle>configurações</MenuSectionTitle>
          <MenuItemRow icon="notifications-outline" label="notificações" onPress={() => {}} />
          <MenuDivider />
          <MenuItemRow icon="shield-checkmark-outline" label="privacidade" onPress={() => {}} />
          <MenuDivider />
          <MenuItemRow icon="help-circle-outline" label="ajuda" onPress={() => {}} />
        </MenuSection>

        <Pressable onPress={logout}>
          <LogoutButton>
            <Ionicons name="log-out-outline" size={20} color={theme.placeholderColor?.val} />
            <Text fontSize={15} fontWeight="500" color="$placeholderColor">sair da conta</Text>
          </LogoutButton>
        </Pressable>

        <VersionText>versão 1.0.0</VersionText>
      </ScrollView>

      {!isDesktop && (
        <BottomNav paddingBottom={Math.max(insets.bottom, 12)}>
          {navItems.map((item) => {
            const isActive = item.key === 'Profile';

            if (item.isCenter) {
              return (
                <Pressable key={item.key} onPress={() => navigation.navigate(item.key as any)}>
                  <CenterNavButton>
                    <LinearGradient
                      colors={['#5D8A7D', '#7BA396']}
                      style={{ width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center' }}
                    >
                      <Ionicons name="add" size={32} color="white" />
                    </LinearGradient>
                  </CenterNavButton>
                </Pressable>
              );
            }

            return (
              <Pressable key={item.key} onPress={() => navigation.navigate(item.key as any)}>
                <NavItem>
                  <NavIconWrap active={isActive}>
                    <Ionicons
                      name={isActive ? (item.icon as any) : (`${item.icon}-outline` as any)}
                      size={24}
                      color={isActive ? theme.brand?.val : theme.placeholderColor?.val}
                    />
                  </NavIconWrap>
                  <NavLabel active={isActive}>{item.label}</NavLabel>
                </NavItem>
              </Pressable>
            );
          })}
        </BottomNav>
      )}
    </Container>
  );
}
