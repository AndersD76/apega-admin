# PROMPT DE DESIGN - LARGÔ APP

## Baseado em: Enjoei, Poshmark, Vinted, Mercado Livre

---

## PRINCÍPIOS FUNDAMENTAIS

### 1. Mobile-First OBRIGATÓRIO
- Design começa pelo mobile (320px-428px)
- Desktop é adaptação do mobile, NÃO o contrário
- Touch targets mínimo 44px
- Thumb zone optimization

### 2. Minimalismo Funcional
- MENOS é MAIS
- Cada elemento deve ter propósito claro
- Remover decoração desnecessária
- Foco no conteúdo (produtos)

### 3. Consistência Visual
- Sistema de design coeso
- Componentes reutilizáveis
- Espaçamentos padronizados (múltiplos de 4px)

---

## PALETA DE CORES

### Primária (Terracota - identidade Largô)
```
primary: #C75C3A (principal)
primaryLight: #E07A5A (hover states)
primaryDark: #A04830 (pressed states)
```

### Neutras
```
background: #FFFFFF (fundo principal - NÃO creme)
surface: #FAFAFA (cards, elevações)
border: #E5E5E5 (divisores, bordas)
```

### Texto
```
text: #1A1A1A (principal - quase preto)
textSecondary: #6B6B6B (secundário)
textMuted: #9B9B9B (desabilitado, hints)
```

### Status
```
success: #22C55E
error: #EF4444
warning: #F59E0B
```

---

## TIPOGRAFIA

### Família
- **Principal**: Inter ou System Font (-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto)
- **NÃO usar**: Nunito (muito arredondada, não profissional)

### Escala (Mobile)
```
h1: 24px / 700 / 1.2 line-height
h2: 20px / 600 / 1.25
h3: 16px / 600 / 1.3
body: 14px / 400 / 1.5
small: 12px / 400 / 1.4
caption: 11px / 500 / 1.3
```

### Escala (Desktop)
```
h1: 28px / 700
h2: 22px / 600
h3: 18px / 600
body: 15px / 400
small: 13px / 400
caption: 12px / 500
```

---

## ESPAÇAMENTOS

### Sistema de 4px
```
xs: 4px
sm: 8px
md: 12px
lg: 16px
xl: 24px
2xl: 32px
3xl: 48px
```

### Padding de Containers
- Mobile: 16px horizontal
- Tablet: 24px
- Desktop: 32px (max-width 1200px centralizado)

---

## COMPONENTES

### HEADER (Mobile)
```
Altura: 56px (sem notch)
Background: #FFFFFF
Border-bottom: 1px solid #E5E5E5
Shadow: NENHUMA ou muito sutil

Layout:
[Logo texto "Largô"] --- [Busca icon] [Sino] [Sacola]

- Logo: 20px, font-weight 700, color primary
- Ícones: 24px, color #1A1A1A, touch area 44px
```

### HEADER (Desktop)
```
Altura: 64px
Max-width: 1200px centralizado

Layout:
[Logo] [====== Barra de Busca ======] [Vender] [Sino] [Sacola] [Avatar]

- Barra de busca: 40px altura, border-radius 8px, border 1px #E5E5E5
- Botão Vender: Texto link, não botão
```

### CATEGORIAS (Mobile)
```
NÃO usar ícones elaborados
Usar CHIPS de texto simples

Layout horizontal scroll:
[Todos] [Feminino] [Masculino] [Infantil] [Acessórios]

Chip style:
- Padding: 8px 16px
- Border-radius: 20px
- Background inativo: #F5F5F5
- Background ativo: #1A1A1A
- Text inativo: #6B6B6B
- Text ativo: #FFFFFF
- Font: 13px / 500
```

### BANNER PROMOCIONAL
```
NÃO usar gradientes chamativos
Design sutil e elegante

Mobile:
- Altura: 120px max
- Border-radius: 12px
- Margin: 16px
- Background: Cor sólida suave ou imagem

Conteúdo:
- Título: 18px bold
- Subtítulo: 13px regular
- CTA discreto (link ou botão outline)
```

### CARD DE PRODUTO
```
Este é o componente MAIS IMPORTANTE
Deve ser LIMPO e focado na FOTO

Mobile (2 colunas):
- Width: calc(50% - 8px)
- Gap: 16px entre cards

Estrutura:
┌─────────────────┐
│                 │
│     IMAGEM      │  aspect-ratio: 1:1 (quadrado)
│                 │  ou 3:4
│  [♡]            │  coração no canto superior direito
└─────────────────┘
  R$ 89           <- preço: 15px bold #1A1A1A
  Vestido floral  <- título: 13px #6B6B6B (1 linha)
  Zara            <- marca: 12px #9B9B9B (opcional)

Detalhes:
- Border-radius imagem: 8px
- Padding info: 8px 0
- SEM SOMBRA no card (clean)
- SEM BORDA no card
- Botão favorito: 32px, background rgba(0,0,0,0.4), border-radius 50%
```

### CARD DE PRODUTO (Desktop - 4 colunas)
```
Width: calc(25% - 18px)
Gap: 24px
Hover: transform scale(1.02), transition 0.2s
```

### SEÇÕES
```
Título da seção:
- Font: 18px / 600 mobile, 20px desktop
- Color: #1A1A1A
- Margin-bottom: 16px

"Ver todos" link:
- Font: 13px / 500
- Color: primary
- NO arrow icon (clean)
```

### BOTÕES

Primary:
```
Background: #C75C3A
Color: #FFFFFF
Height: 48px mobile, 44px desktop
Border-radius: 8px
Font: 15px / 600
Padding: 0 24px
```

Secondary:
```
Background: transparent
Border: 1.5px solid #E5E5E5
Color: #1A1A1A
```

Text Button:
```
Background: none
Color: primary
Font: 14px / 600
```

### NAVEGAÇÃO BOTTOM (Mobile)
```
Altura: 56px + safe area
Background: #FFFFFF
Border-top: 1px solid #E5E5E5
Shadow: 0 -2px 10px rgba(0,0,0,0.05)

5 itens:
[Home] [Buscar] [+Vender] [Favoritos] [Perfil]

- Ícones: 24px outline
- Ícone ativo: filled, color primary
- Label: 10px
- Botão central (+) pode ser destacado com background primary
```

---

## LAYOUT RESPONSIVO

### Breakpoints
```
mobile: 0 - 599px
tablet: 600 - 899px
desktop: 900px+
```

### Grid de Produtos
```
mobile: 2 colunas
tablet: 3 colunas
desktop: 4 colunas (max 5)
```

### Container
```
mobile: 100% width, 16px padding
tablet: 100% width, 24px padding
desktop: max-width 1200px, centered, 32px padding
```

---

## O QUE NÃO FAZER

1. ❌ Gradientes chamativos
2. ❌ Ícones SVG elaborados/amadores
3. ❌ Sombras pesadas
4. ❌ Cores de fundo creme/bege
5. ❌ Fontes muito arredondadas
6. ❌ Muitos níveis de hierarquia visual
7. ❌ Banners que competem com produtos
8. ❌ Elementos decorativos sem função
9. ❌ Cards com muita informação
10. ❌ Sidebar em mobile

## O QUE FAZER

1. ✅ Fundo branco limpo
2. ✅ Tipografia clara e legível
3. ✅ Foco total nos produtos
4. ✅ Espaçamento generoso
5. ✅ Ícones simples (Ionicons outline)
6. ✅ Interações sutis
7. ✅ Consistência em tudo
8. ✅ Mobile-first sempre
9. ✅ Cards minimalistas
10. ✅ Navegação intuitiva

---

## REFERÊNCIA VISUAL

### Enjoei
- Cor primária: #61005D (roxo)
- Linguagem descontraída
- Cards simples com preço em destaque
- Breakpoint mobile: 900px

### Poshmark
- Cor primária: #7f0353 (magenta)
- Grid de 24 colunas
- Botões com border-radius 3px
- Altura botão: 36px

### Vinted
- Grid: 2 mobile, 4 desktop
- Border-radius cards: 8-18px
- Sombra sutil: 0 2px 8px rgba(0,0,0,0.04)
- Espaçamento: 16px mobile, 20px desktop

### Mercado Livre
- Background branco
- Cor primária: #3483fa (azul)
- Max-width: 1220px
- Tipografia: Proxima Nova/Roboto

---

## IMPLEMENTAÇÃO IMEDIATA

Para o Largô, aplicar:

1. **Header simplificado**: Logo texto + busca + ícones
2. **Categorias como chips**: Texto simples, sem ícones
3. **Banner discreto**: Uma cor, texto limpo
4. **Grid de produtos**: 2 colunas mobile, foco na foto
5. **Cards minimalistas**: Foto + preço + título (só)
6. **Cores**: Primary terracota, fundo BRANCO
7. **Tipografia**: System font, não Nunito
8. **Navegação bottom**: 5 itens simples
