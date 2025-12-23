import React, { useCallback, useEffect, useState } from 'react';
import {
  YStack,
  XStack,
  Text,
  Image,
  Input,
  ScrollView,
  Stack,
  styled,
  useTheme,
  Spinner,
  AnimatePresence,
} from 'tamagui';
import { RefreshControl, Pressable, useWindowDimensions, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { getProducts, Product } from '../services/products';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';

const isWeb = Platform.OS === 'web';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

// Styled Components
const Container = styled(YStack, {
  flex: 1,
  backgroundColor: '$background',
});

const TopBanner = styled(XStack, {
  backgroundColor: '$brand',
  paddingVertical: '$2',
  justifyContent: 'center',
  alignItems: 'center',
});

const TopBannerText = styled(Text, {
  color: 'white',
  fontSize: 12,
  fontWeight: '500',
  textAlign: 'center',
});

const Header = styled(XStack, {
  paddingHorizontal: '$4',
  paddingVertical: '$3',
  alignItems: 'center',
  gap: '$3',
  borderBottomWidth: 1,
  borderBottomColor: '$borderColor',
  backgroundColor: '$background',
});

const Logo = styled(Text, {
  fontSize: 26,
  fontWeight: '700',
  color: '$brand',
  fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
});

const SearchContainer = styled(XStack, {
  flex: 1,
  backgroundColor: '$backgroundStrong',
  borderRadius: '$full',
  alignItems: 'center',
  paddingHorizontal: '$3',
  height: 44,
  maxWidth: 400,
});

const SearchInput = styled(Input, {
  flex: 1,
  backgroundColor: 'transparent',
  borderWidth: 0,
  fontSize: 14,
  color: '$color',
  height: 44,
});

const IconButton = styled(Stack, {
  width: 40,
  height: 40,
  borderRadius: 20,
  alignItems: 'center',
  justifyContent: 'center',
  pressStyle: {
    opacity: 0.7,
    scale: 0.95,
  },
  animation: 'fast',
});

const SellButton = styled(Stack, {
  backgroundColor: '$brand',
  paddingHorizontal: '$4',
  paddingVertical: '$2',
  borderRadius: '$full',
  pressStyle: {
    opacity: 0.9,
    scale: 0.98,
  },
  animation: 'fast',
});

const TabsContainer = styled(ScrollView, {
  borderBottomWidth: 1,
  borderBottomColor: '$borderColor',
});

const Tab = styled(Stack, {
  paddingVertical: '$3',
  paddingHorizontal: '$4',
  pressStyle: {
    opacity: 0.7,
  },
});

const TabText = styled(Text, {
  fontSize: 14,
  fontWeight: '500',
  color: '$placeholderColor',

  variants: {
    active: {
      true: {
        color: '$brand',
        fontWeight: '600',
      },
    },
  } as const,
});

const PromoCard = styled(Stack, {
  borderRadius: '$4',
  overflow: 'hidden',
  marginHorizontal: '$4',
  marginTop: '$4',
});

const SectionHeader = styled(XStack, {
  paddingHorizontal: '$4',
  paddingTop: '$5',
  paddingBottom: '$3',
  justifyContent: 'space-between',
  alignItems: 'flex-end',
});

const SectionTitle = styled(Text, {
  fontSize: 22,
  fontWeight: '700',
  color: '$color',
});

const SectionSubtitle = styled(Text, {
  fontSize: 13,
  color: '$placeholderColor',
  marginTop: '$1',
});

const SeeAllLink = styled(Text, {
  fontSize: 14,
  fontWeight: '600',
  color: '$brand',
});

const ProductsGrid = styled(XStack, {
  paddingHorizontal: '$3',
  gap: '$2',
});

const ProductColumn = styled(YStack, {
  flex: 1,
  gap: '$2',
});

const ProductCardContainer = styled(Stack, {
  borderRadius: '$3',
  overflow: 'hidden',
  backgroundColor: '$backgroundStrong',
  pressStyle: {
    scale: 0.98,
    opacity: 0.95,
  },
  animation: 'fast',
});

const ProductImage = styled(Image, {
  width: '100%',
  backgroundColor: '$backgroundStrong',
});

const ProductPlaceholder = styled(Stack, {
  width: '100%',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: '$backgroundStrong',
});

const PriceTag = styled(Stack, {
  position: 'absolute',
  bottom: 10,
  left: 10,
  backgroundColor: 'white',
  paddingHorizontal: '$2',
  paddingVertical: '$1',
  borderRadius: '$2',
  shadowColor: '$shadowColor',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 1,
  shadowRadius: 4,
  elevation: 2,
});

const PriceText = styled(Text, {
  fontSize: 14,
  fontWeight: '700',
  color: '$color',
});

const FavoriteButton = styled(Stack, {
  position: 'absolute',
  top: 10,
  right: 10,
  width: 32,
  height: 32,
  borderRadius: 16,
  backgroundColor: 'rgba(0,0,0,0.3)',
  alignItems: 'center',
  justifyContent: 'center',
  pressStyle: {
    scale: 0.9,
  },
  animation: 'bouncy',
});

const LoadingContainer = styled(YStack, {
  paddingVertical: '$8',
  alignItems: 'center',
  justifyContent: 'center',
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

// Product Item Component
function ProductItem({
  item,
  onPress,
  width,
  height,
}: {
  item: Product;
  onPress: () => void;
  width: number;
  height: number;
}) {
  const theme = useTheme();
  const imageUrl = item.image_url || (item.images && item.images[0]?.image_url) || '';
  const price = typeof item.price === 'string' ? parseFloat(item.price) : item.price;

  return (
    <Pressable onPress={onPress}>
      <ProductCardContainer width={width} height={height}>
        {imageUrl ? (
          <ProductImage source={{ uri: imageUrl }} width={width} height={height} resizeMode="cover" />
        ) : (
          <ProductPlaceholder height={height}>
            <Ionicons name="image-outline" size={32} color={theme.placeholderColor?.val} />
          </ProductPlaceholder>
        )}

        <PriceTag>
          <PriceText>R$ {price.toFixed(0)}</PriceText>
        </PriceTag>

        <FavoriteButton>
          <Ionicons name="heart-outline" size={18} color="white" />
        </FavoriteButton>
      </ProductCardContainer>
    </Pressable>
  );
}

// Main Component
export default function HomeScreen({ navigation }: Props) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const isDesktop = isWeb && width > 900;

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('novidades');

  const tabs = [
    { id: 'novidades', label: 'novidades' },
    { id: 'ofertas', label: 'ofertas' },
    { id: 'premium', label: 'premium' },
    { id: 'marcas', label: 'marcas' },
  ];

  const fetchProducts = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const response = await getProducts({ limit: 50, sort: 'recent' });
      setProducts(response.products || []);
    } catch (error) {
      console.error('Erro:', error);
      setProducts([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchProducts(false);
  }, [fetchProducts]);

  // Layout calculations
  const gap = 8;
  const padding = isWeb ? 24 : 12;
  const numColumns = isDesktop ? 4 : 2;
  const baseWidth = (width - padding * 2 - gap * (numColumns - 1)) / numColumns;

  // Create masonry layout
  const leftColumn: { item: Product; height: number }[] = [];
  const rightColumn: { item: Product; height: number }[] = [];
  let leftHeight = 0;
  let rightHeight = 0;

  products.forEach((product, index) => {
    const heights = [baseWidth * 1.2, baseWidth * 1.5, baseWidth * 1.3, baseWidth * 1.4];
    const h = heights[index % heights.length];

    if (leftHeight <= rightHeight) {
      leftColumn.push({ item: product, height: h });
      leftHeight += h + gap;
    } else {
      rightColumn.push({ item: product, height: h });
      rightHeight += h + gap;
    }
  });

  const navItems = [
    { key: 'Home', icon: 'home', label: 'Início' },
    { key: 'Search', icon: 'search', label: 'Buscar' },
    { key: 'NewItem', icon: 'add', label: 'Vender', isCenter: true },
    { key: 'Favorites', icon: 'heart', label: 'Salvos' },
    { key: 'Profile', icon: 'person', label: 'Perfil' },
  ];

  return (
    <Container>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.brand?.val}
            colors={[theme.brand?.val || '#5D8A7D']}
          />
        }
        contentContainerStyle={{ paddingBottom: isWeb ? 40 : 100 }}
      >
        {/* Top Banner */}
        <TopBanner>
          <TopBannerText>moda sustentável é nosso modo de mudar o mundo ✨</TopBannerText>
        </TopBanner>

        {/* Header */}
        <Header paddingTop={isWeb ? '$3' : insets.top + 8}>
          <Logo>brechó</Logo>

          <SearchContainer>
            <Ionicons name="search" size={18} color={theme.placeholderColor?.val} />
            <SearchInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder='busque "zara"'
              placeholderTextColor={theme.placeholderColor?.val}
            />
          </SearchContainer>

          <XStack gap="$2" alignItems="center">
            {isWeb && (
              <>
                <Pressable>
                  <Text fontSize={14} fontWeight="500" color="$color">feminino</Text>
                </Pressable>
                <Pressable>
                  <Text fontSize={14} fontWeight="500" color="$color" marginLeft="$3">masculino</Text>
                </Pressable>
              </>
            )}
            <Pressable onPress={() => navigation.navigate('Favorites')}>
              <IconButton>
                <Ionicons name="heart-outline" size={22} color={theme.color?.val} />
              </IconButton>
            </Pressable>
            <Pressable onPress={() => navigation.navigate('Profile')}>
              <IconButton>
                <Ionicons name="person-outline" size={22} color={theme.color?.val} />
              </IconButton>
            </Pressable>
            <Pressable onPress={() => navigation.navigate('NewItem')}>
              <SellButton>
                <Text color="white" fontSize={14} fontWeight="600">quero vender</Text>
              </SellButton>
            </Pressable>
          </XStack>
        </Header>

        {/* Tabs */}
        <TabsContainer horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
          {tabs.map((tab) => (
            <Pressable key={tab.id} onPress={() => setActiveTab(tab.id)}>
              <Tab
                borderBottomWidth={activeTab === tab.id ? 2 : 0}
                borderBottomColor="$brand"
              >
                <TabText active={activeTab === tab.id}>{tab.label}</TabText>
              </Tab>
            </Pressable>
          ))}
        </TabsContainer>

        {/* Promo Banner */}
        <PromoCard>
          <LinearGradient
            colors={['#5D8A7D', '#7BA396']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ padding: 24, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
          >
            <YStack>
              <Text fontSize={32} fontWeight="800" color="white">até 70% off</Text>
              <Text fontSize={15} color="rgba(255,255,255,0.85)">em peças selecionadas</Text>
            </YStack>
            <Pressable>
              <Stack backgroundColor="white" paddingHorizontal="$5" paddingVertical="$3" borderRadius="$full">
                <Text color="$brand" fontSize={14} fontWeight="600">ver tudo</Text>
              </Stack>
            </Pressable>
          </LinearGradient>
        </PromoCard>

        {/* Section Header */}
        <SectionHeader>
          <YStack>
            <SectionTitle>acabou de chegar</SectionTitle>
            <SectionSubtitle>corre que é novidade quentinha</SectionSubtitle>
          </YStack>
          <Pressable>
            <SeeAllLink>não vai perder</SeeAllLink>
          </Pressable>
        </SectionHeader>

        {/* Products Grid */}
        {loading ? (
          <LoadingContainer>
            <Spinner size="large" color="$brand" />
          </LoadingContainer>
        ) : (
          <ProductsGrid paddingHorizontal={padding}>
            <ProductColumn marginRight={gap / 2}>
              {leftColumn.map(({ item, height }) => (
                <ProductItem
                  key={item.id}
                  item={item}
                  width={baseWidth}
                  height={height}
                  onPress={() => navigation.navigate('ItemDetail', { item })}
                />
              ))}
            </ProductColumn>
            <ProductColumn marginLeft={gap / 2}>
              {rightColumn.map(({ item, height }) => (
                <ProductItem
                  key={item.id}
                  item={item}
                  width={baseWidth}
                  height={height}
                  onPress={() => navigation.navigate('ItemDetail', { item })}
                />
              ))}
            </ProductColumn>
          </ProductsGrid>
        )}
      </ScrollView>

      {/* Bottom Navigation */}
      {!isDesktop && (
        <BottomNav paddingBottom={Math.max(insets.bottom, 12)}>
          {navItems.map((item) => {
            const isActive = item.key === 'Home';

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
