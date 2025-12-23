# PROMPT COMPLETO: APEGA DESAPEGA (APP COMPLETO)

## CONTEXTO
O **apega desapega** e um marketplace de moda sustentavel (brecho online) similar ao Enjoei. O app e construido em React Native/Expo com TypeScript e roda em iOS, Android e Web. Ha um backend Node/Express com PostgreSQL (Neon) e um painel admin em React + Vite.

**URL de producao**: https://apega-desapega-production.up.railway.app

Objetivo: entregar o app completo (mobile/web), backend e admin mantendo arquitetura, rotas, modelos e configuracoes atuais. A melhoria deve ter foco significativo no frontend, com layout mais profissional e Instagram-like, mas preservando o estilo do app e a identidade do marketplace.

---

## ENTREGAVEIS (OBRIGATORIOS)
1. Backend completo com API REST, autenticacao, CRUDs e integracoes (pagamento, envio, imagens).
2. App mobile/web (Expo) com todas as telas, navegacao e consumo da API.
3. Painel admin (web) com gestao de usuarios, produtos, pedidos, promocoes e analytics.
4. Banco de dados com schema completo e scripts de init/migrations.
5. Documentacao basica: como rodar, env vars, scripts, seed.

---

## REPOSITORIO / PASTAS
- `apega-backend` (Node/Express)
- `apega-mobile` (React Native/Expo)
- `apega-admin` (React/Vite)

---

## STACK TECNICA
### Backend
- Node.js + Express
- PostgreSQL (Neon) com `@neondatabase/serverless`
- JWT + bcrypt
- Multer + Cloudinary (upload)
- MercadoPago (pagamentos)
- MelhorEnvio (frete)
- Anthropic SDK (IA)

### Mobile/Web
- Expo SDK 54
- React Native 0.81 + React 19
- React Navigation
- TypeScript

### Admin
- React 18 + Vite
- Radix UI
- React Query
- Tailwind (utilitarios)

---

## SETUP RAPIDO
### Backend
- `cd apega-backend`
- `npm install`
- Criar `.env` com as variaveis abaixo
- `npm run db:init`
- `npm run dev`

### Mobile/Web
- `cd apega-mobile`
- `npm install`
- `npm start` (expo)
- `npm run web` para web

### Admin
- `cd apega-admin`
- `npm install`
- `npm run dev`

---

## ENV VARS (EXEMPLO)
### Backend `.env`
```
PORT=3001
DATABASE_URL=postgresql://USER:PASS@HOST:PORT/DB
JWT_SECRET=super_secret
CORS_ORIGIN=*

CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...

MERCADOPAGO_ACCESS_TOKEN=...
MERCADOPAGO_PUBLIC_KEY=...

MELHORENVIO_TOKEN=...
MELHORENVIO_ENV=production

ANTHROPIC_API_KEY=...
```

### Mobile
- API base: `https://apega-desapega-production.up.railway.app/api` (prod)
- Dev: `http://localhost:3001/api` (web) e IP do Expo (mobile)

### Admin
- API base: `http://localhost:3001/api` (dev)

---

## BACKEND (API)
### Arquitetura
- `src/server.js` (express)
- `src/routes/*`
- `src/services/*` (integracoes)
- `src/middleware/auth.js`
- `src/database/init.js`

### Rotas principais (prefixo `/api`)
- `/auth` (login, register, refresh)
- `/users`
- `/products`
- `/orders`
- `/cart`
- `/favorites`
- `/addresses`
- `/payments`
- `/messages`
- `/notifications`
- `/reviews`
- `/categories`
- `/checkout`
- `/shipping`
- `/subscriptions`
- `/ai`
- `/analytics`
- `/promo`

### Responsabilidades
- Auth JWT, roles (admin, user)
- CRUD completo para produtos, categorias e usuarios
- Carrinho, pedidos e checkout
- Favoritos e seguidores
- Mensagens e notificacoes
- Pagamentos via MercadoPago
- Frete via MelhorEnvio
- Upload de imagens via Cloudinary
- Analytics (eventos, views)

### Database (tabelas)
- users, categories, products, product_images
- favorites, cart_items, orders, transactions
- payment_methods, addresses
- messages, conversations, notifications
- followers, subscriptions, reports
- carts, product_views, analytics_events
- settings

---

## MOBILE/WEB (EXPO)
### Navegacao
- Stack principal com tabs inferiores
- Tabs: Home, Search, Sell, Cart, Profile

### Telas principais
- HomeScreen (feed + banners + categorias)
- SearchScreen (filtros + grid)
- ItemDetailScreen (produto)
- NewItemScreen (criar anuncio)
- CartScreen
- CheckoutScreen
- OrdersScreen
- SalesScreen
- ProfileScreen
- LoginScreen
- SettingsScreen
- NotificationsScreen
- MessagesScreen

### Componentes base
- Header (busca + notificacoes)
- BottomNavigation
- ProductCard
- PriceDisplay
- FilterChips
- SellerCard
- StatusBadge

### Design
- Cara de Instagram: grid limpo, tipografia clara, espacos bem definidos
- Manter identidade do app, cores e tipografia atuais (theme.ts)
- Nao alterar configuracoes atuais (scripts, base URL, navegacao)
- Layout responsivo (mobile/tablet/desktop)

---

## ADMIN (WEB)
### Paginas
- Dashboard
- Users
- Products
- Orders
- Shipping
- Carts
- Analytics
- Reports
- Promos
- Communications
- Finance
- Settings
- Simulator

### Requisitos
- Autenticacao admin
- Listagens com filtros e paginacao
- Acoes administrativas (ban, destaque, promo)

---

## UI/UX (INSTAGRAM-LIKE, MANTENDO ESTILO ATUAL)
- Usar as cores e tipografia atuais do app (nao substituir theme.ts)
- Linguagem informal e brasileira
- Cards com imagem quadrada
- Preco em destaque, preco original riscado
- CTA claros e profissionais

---

## ANIMACOES
- Favoritar com pulso
- Adicionar ao carrinho com animacao
- Pull to refresh suave
- Skeleton loading
- Modal de filtros com slide

---

## RESPONSIVIDADE
- Mobile: 2 colunas
- Tablet: 3 colunas
- Desktop: 4-5 colunas e largura maxima 1200px

---

## CHECKLIST DE IMPLEMENTACAO
- [ ] Backend completo (rotas + services + auth)
- [ ] Banco de dados e seed
- [ ] Mobile com todas as telas
- [ ] Admin com todas as paginas
- [ ] Tema e componentes base
- [ ] Integracoes (pagamento, frete, upload)
- [ ] Testes basicos e validacoes
- [ ] Documentacao de uso

---

## ORDEM SUGERIDA
1. Backend: auth, users, products
2. Backend: orders, payments, shipping
3. Mobile: componentes base (sem alterar tema)
4. Mobile: Home, Product, Search
5. Mobile: Cart, Checkout, Profile
6. Admin: Dashboard, Users, Products
7. Admin: Orders, Reports, Promos

---

## NOTAS
- Evite inventar endpoints diferentes: siga a arquitetura e nomes acima.
- Se faltar alguma informacao, pergunte antes de inventar.
- Nao alterar cores/tipografia nem configuracoes existentes.
- Priorize melhoria significativa do frontend com consistencia visual profissional.
