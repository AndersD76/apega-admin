# PROMPT COMPLETO: NOVO LAYOUT APEGA DESAPEGA (Estilo Enjoei)

## CONTEXTO DO PROJETO

O **apega desapega** é um marketplace de moda sustentável (brechó online) similar ao Enjoei. O app é construído em React Native/Expo com TypeScript e roda em iOS, Android e Web.

**URL de Produção**: https://apega-desapega-production.up.railway.app

---

## REFERÊNCIA PRINCIPAL: ENJOEI

### Características Visuais do Enjoei

**Cores**:
- **Roxo principal**: `#61005D` (magenta escuro) - usado em botões, links, CTAs
- **Laranja/Coral**: cor secundária para destaques
- **Branco**: backgrounds principais
- **Cinza claro**: backgrounds secundários
- **Preto**: textos principais

**Tipografia**:
- Fonte: **Montserrat** (Google Fonts)
- Tom: **informal, divertido, conversacional** em português brasileiro
- Frases como: "mais que queridos", "de cair o queixo", "bora desapegar"

**Layout Geral**:
- Grid de produtos em **2 colunas** no mobile
- Cards de produtos com **foto quadrada** ocupando maior parte
- Preços com destaque visual (preço original riscado + preço atual)
- Navegação por **tabs na parte inferior**
- Header fixo com busca proeminente
- Linguagem informal e brasileira

### Estrutura de Navegação Enjoei

**Bottom Tab Bar** (5 itens):
1. **Início** - Feed de produtos
2. **Buscar** - Busca com filtros
3. **Vender** (botão central destacado) - Anunciar produto
4. **Carrinho** - Sacola de compras
5. **Perfil** - Minha conta / Minha loja

**Header** (fixo no topo):
- Logo à esquerda
- Campo de busca centralizado
- Ícone de notificações à direita

### Tela HOME (Feed)

**Estrutura**:
1. Header com busca
2. Banners rotativos (promoções, campanhas)
3. Categorias em scroll horizontal (chips/pills)
4. Seções de produtos:
   - "Acabou de chegar" - grid 2 colunas
   - "Marcas que você ama" - logos de marcas
   - "Mais vistos" - grid 2 colunas
   - "Ofertas do dia" - com badge de desconto
5. Carregar mais ao scroll

**Card de Produto**:
```
┌─────────────────┐
│                 │
│   [FOTO 1:1]    │  ← Imagem quadrada
│                 │
├─────────────────┤
│ R$ 49           │  ← Preço atual (destaque)
│ R$ 89 --------- │  ← Preço original (riscado, se houver)
│ Vestido Zara M  │  ← Título (1-2 linhas, truncado)
│ ♡ 12  👁 45     │  ← Curtidas e visualizações
└─────────────────┘
```

### Tela BUSCA

**Estrutura**:
1. Campo de busca focado
2. Filtros rápidos (chips): Tamanho, Marca, Preço, Condição
3. Botão "Filtros" que abre modal
4. Ordenação (relevância, menor preço, mais recentes)
5. Grid de resultados 2 colunas
6. Contador de resultados

**Modal de Filtros**:
- Categorias (checkboxes)
- Tamanhos (seleção múltipla)
- Condição (novo, seminovo, usado)
- Faixa de preço (slider ou inputs)
- Marcas (busca + checkboxes)
- Botões: Limpar filtros | Aplicar

### Tela PRODUTO (Detalhes)

**Estrutura**:
1. Galeria de fotos (swipe horizontal)
   - Indicadores de página
   - Zoom ao tocar
2. Preço e desconto
3. Título do produto
4. Tamanho e condição
5. Descrição
6. Informações do vendedor:
   - Avatar
   - Nome da loja
   - Avaliação (estrelas)
   - "Ver loja" botão
7. Botões de ação fixos no bottom:
   - "Fazer oferta" (secundário)
   - "Comprar agora" (primário)
8. Coração para favoritar (canto superior direito)
9. Compartilhar (ícone)

### Tela VENDER (Criar Anúncio)

**Fluxo em etapas**:

**Passo 1 - Fotos**:
- Área grande para adicionar fotos
- Mínimo 1, máximo 10 fotos
- Preview em grid
- Reordenar arrastando

**Passo 2 - Detalhes**:
- Título (obrigatório)
- Descrição (com placeholder sugestivo)
- Categoria (dropdown)
- Marca (busca + dropdown)
- Tamanho (seleção)
- Condição (novo/seminovo/usado)

**Passo 3 - Preço**:
- Campo de preço
- Preço sugerido (baseado em similares)
- Simulador: "Você recebe: R$ XX"
- Opção de aceitar ofertas

**Passo 4 - Revisão**:
- Preview do anúncio
- Botão "Publicar"

### Tela CARRINHO (Sacola)

**Estrutura**:
1. Lista de itens:
   - Foto do produto
   - Título
   - Tamanho
   - Preço
   - Botão remover
2. Resumo:
   - Subtotal
   - Frete (calcular por CEP)
   - Total
3. Campo de cupom
4. Botão "Finalizar compra"
5. Estado vazio: ilustração + "Sua sacola está vazia"

### Tela PERFIL / MINHA LOJA

**Duas visualizações**: Perfil próprio vs Loja de outro vendedor

**Minha Loja (próprio perfil)**:
```
┌─────────────────────────────────────┐
│ [Banner da loja - editável]         │
├─────────────────────────────────────┤
│ ○ Avatar    Nome da Loja            │
│             @usuario                 │
│             ⭐ 4.8 (32 avaliações)  │
│             📍 Passo Fundo, RS      │
├─────────────────────────────────────┤
│ Bio/Descrição da loja               │
├─────────────────────────────────────┤
│ [Editar perfil] [Compartilhar]      │
├─────────────────────────────────────┤
│  32        15         28            │
│ peças   seguidores  seguindo        │
├─────────────────────────────────────┤
│ Tabs: [À venda] [Vendidos] [Avaliações] │
├─────────────────────────────────────┤
│ Grid de produtos 3 colunas          │
│ ┌───┐ ┌───┐ ┌───┐                   │
│ │   │ │   │ │   │                   │
│ └───┘ └───┘ └───┘                   │
└─────────────────────────────────────┘
```

**Ações no perfil próprio**:
- Editar perfil/loja
- Ver vendas
- Ver compras
- Saldo/Carteira
- Configurações
- Sair

### Tela VENDAS (Painel do Vendedor)

**Dashboard**:
1. Card de resumo:
   - Faturamento do mês
   - Número de vendas
   - Ticket médio
2. Tabs: Aguardando envio | Enviadas | Entregues
3. Cards de pedido:
   - Foto do produto
   - Nome do produto
   - Comprador
   - Valor
   - Status com cor
   - Botões de ação (Gerar etiqueta, Marcar enviado)

### Tela PEDIDOS (Compras)

**Estrutura**:
1. Tabs: Todos | Em andamento | Entregues
2. Cards de pedido:
   - Foto do produto
   - Nome
   - Vendedor
   - Valor pago
   - Status com ícone
   - Data
3. Ao tocar: abre detalhes com rastreamento

---

## ESPECIFICAÇÕES TÉCNICAS

### Paleta de Cores (Nova)

```typescript
const COLORS = {
  // Principal - Roxo Enjoei
  primary: '#61005D',
  primaryLight: '#8B1A85',
  primaryDark: '#4A0047',
  primaryExtraLight: '#F5E6F4',

  // Secundária - Coral/Laranja
  secondary: '#FF6B6B',
  secondaryLight: '#FF8E8E',
  secondaryDark: '#E54545',

  // Sucesso/Vendido
  success: '#00C853',
  successLight: '#69F0AE',
  successDark: '#00A040',

  // Alerta
  warning: '#FFB300',
  warningLight: '#FFCA28',
  warningDark: '#FF8F00',

  // Erro
  error: '#FF5252',
  errorLight: '#FF8A80',
  errorDark: '#D32F2F',

  // Info
  info: '#2196F3',
  infoLight: '#64B5F6',
  infoDark: '#1976D2',

  // Neutras
  white: '#FFFFFF',
  black: '#1A1A1A',

  gray: {
    50: '#FAFAFA',
    100: '#F5F5F5',
    200: '#EEEEEE',
    300: '#E0E0E0',
    400: '#BDBDBD',
    500: '#9E9E9E',
    600: '#757575',
    700: '#616161',
    800: '#424242',
    900: '#212121',
  },

  // Backgrounds
  background: '#FAFAFA',
  surface: '#FFFFFF',

  // Textos
  textPrimary: '#1A1A1A',
  textSecondary: '#616161',
  textTertiary: '#9E9E9E',
  textDisabled: '#BDBDBD',

  // Preços
  priceOld: '#9E9E9E',
  priceNew: '#1A1A1A',
  priceDiscount: '#FF5252',

  // Premium/Pro
  premium: '#FFD700',
  premiumDark: '#FFC107',
}
```

### Tipografia

```typescript
const TYPOGRAPHY = {
  fontFamily: 'Montserrat', // ou System para performance

  sizes: {
    xs: 10,
    sm: 12,
    base: 14,
    md: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 28,
    '4xl': 32,
  },

  weights: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
  },
}
```

### Espaçamentos

```typescript
const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 48,
}
```

### Border Radius

```typescript
const RADIUS = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
}
```

### Sombras

```typescript
const SHADOWS = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
}
```

---

## COMPONENTES CHAVE

### 1. ProductCard

```tsx
// Card de produto para grid (2 colunas mobile, 4 desktop)
<ProductCard
  image={string}
  price={number}
  originalPrice={number | null}
  title={string}
  likes={number}
  views={number}
  isFavorited={boolean}
  onPress={() => void}
  onFavorite={() => void}
/>
```

### 2. BottomTabBar

```tsx
// 5 tabs: Home, Search, Sell (destaque), Cart, Profile
<BottomTabBar
  activeTab={string}
  cartCount={number}
  onTabPress={(tab) => void}
/>
```

### 3. Header

```tsx
// Header fixo com busca
<Header
  showSearch={boolean}
  showBack={boolean}
  title={string}
  rightAction={ReactNode}
  onSearch={(query) => void}
/>
```

### 4. FilterChips

```tsx
// Chips de filtro horizontais
<FilterChips
  filters={[{ id, label, active }]}
  onToggle={(id) => void}
/>
```

### 5. PriceDisplay

```tsx
// Exibição de preço com desconto
<PriceDisplay
  price={number}
  originalPrice={number | null}
  size={'sm' | 'md' | 'lg'}
/>
```

### 6. SellerCard

```tsx
// Card do vendedor no detalhe do produto
<SellerCard
  avatar={string}
  name={string}
  rating={number}
  reviewsCount={number}
  location={string}
  onViewStore={() => void}
/>
```

### 7. StatusBadge

```tsx
// Badge de status (vendido, enviado, etc)
<StatusBadge
  status={'active' | 'sold' | 'paused' | 'pending' | 'shipped' | 'delivered'}
/>
```

---

## TELAS A IMPLEMENTAR (PRIORIDADE)

### ALTA PRIORIDADE

1. **HomeScreen** - Feed principal com produtos
2. **ProfileScreen** - Minha loja / Perfil do vendedor
3. **ProductDetailScreen** - Detalhes do produto
4. **SearchScreen** - Busca com filtros
5. **NewItemScreen** - Criar anúncio

### MÉDIA PRIORIDADE

6. **CartScreen** - Carrinho de compras
7. **SalesScreen** - Minhas vendas (dashboard)
8. **OrdersScreen** - Minhas compras
9. **CheckoutScreen** - Finalizar compra

### BAIXA PRIORIDADE

10. **MessagesScreen** - Chat
11. **NotificationsScreen** - Notificações
12. **SettingsScreen** - Configurações

---

## FLUXOS PRINCIPAIS

### Fluxo de Compra
```
Home → Produto → Adicionar ao carrinho → Carrinho → Checkout → Pagamento → Confirmação
```

### Fluxo de Venda
```
Tab Vender → Fotos → Detalhes → Preço → Publicar → Confirmação
```

### Fluxo de Envio (Vendedor)
```
Vendas → Pedido pendente → Gerar etiqueta → Marcar enviado → Acompanhar
```

---

## LINGUAGEM/COPY

Usar tom **informal, divertido e brasileiro**:

- "Desapega!" em vez de "Vender"
- "Quero!" em vez de "Comprar"
- "Sacola" em vez de "Carrinho"
- "Bora negociar?" para ofertas
- "Novinho em folha" para condição nova
- "Tá esperando o quê?" para CTAs
- "Encontramos X peças lindas" para resultados

---

## ANIMAÇÕES E MICRO-INTERAÇÕES

1. **Favoritar**: Coração pulsa ao curtir
2. **Adicionar ao carrinho**: Item "voa" para o ícone
3. **Pull to refresh**: Animação suave
4. **Skeleton loading**: Enquanto carrega
5. **Swipe para deletar**: Em listas editáveis
6. **Modal de filtros**: Slide de baixo para cima

---

## RESPONSIVIDADE

### Mobile (< 768px)
- Grid: 2 colunas
- Bottom tab bar
- Header compacto

### Tablet (768px - 1024px)
- Grid: 3 colunas
- Bottom tab bar
- Header expandido com busca

### Desktop (> 1024px)
- Grid: 4-5 colunas
- Sidebar de navegação (opcional)
- Header completo
- Largura máxima: 1200px centralizado

---

## CHECKLIST DE IMPLEMENTAÇÃO

- [ ] Atualizar theme.ts com novas cores
- [ ] Criar componente ProductCard
- [ ] Criar componente BottomTabBar
- [ ] Criar componente Header
- [ ] Refatorar HomeScreen
- [ ] Refatorar ProfileScreen (Minha Loja)
- [ ] Refatorar ProductDetailScreen
- [ ] Refatorar SearchScreen
- [ ] Refatorar NewItemScreen
- [ ] Refatorar CartScreen
- [ ] Refatorar SalesScreen
- [ ] Refatorar OrdersScreen
- [ ] Adicionar animações
- [ ] Testar responsividade
- [ ] Testar em iOS/Android/Web

---

## EXEMPLO DE ESTRUTURA DE ARQUIVOS

```
src/
├── components/
│   ├── ui/
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Badge.tsx
│   │   └── ...
│   ├── product/
│   │   ├── ProductCard.tsx
│   │   ├── ProductGrid.tsx
│   │   ├── PriceDisplay.tsx
│   │   └── ...
│   ├── layout/
│   │   ├── Header.tsx
│   │   ├── BottomTabBar.tsx
│   │   ├── ScreenContainer.tsx
│   │   └── ...
│   └── seller/
│       ├── SellerCard.tsx
│       ├── SellerStats.tsx
│       └── ...
├── screens/
│   └── ... (27 telas)
├── constants/
│   └── theme.ts (ATUALIZADO)
└── ...
```

---

## INSTRUÇÕES FINAIS

1. **Comece pelo tema**: Atualize `theme.ts` com as novas cores e tipografia
2. **Crie componentes base**: ProductCard, Header, BottomTabBar
3. **Refatore tela por tela**: Comece pela Home, depois Profile
4. **Mantenha consistência**: Use os componentes criados em todas as telas
5. **Teste sempre**: Verifique iOS, Android e Web
6. **Commits pequenos**: Um commit por tela/componente

---

*Este documento serve como referência completa para implementação do novo layout do app apega desapega, inspirado no Enjoei.*
