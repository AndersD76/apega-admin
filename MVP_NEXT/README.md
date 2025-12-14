# 🛍️ Apega Desapega - MVP Next.js + Firebase

> Marketplace de brechó online - MVP lean e rápido para validar o negócio

## ✨ Stack

- **Next.js 14** (App Router + TypeScript)
- **Firebase** (Firestore + Storage)
- **Tailwind CSS** + shadcn/ui
- **React Hook Form** + Zod

## 🚀 Setup Rápido

### 1. Instalar dependências

```bash
cd MVP_NEXT
npm install
```

### 2. Configurar Firebase

#### 2.1 Criar projeto no Firebase

1. Acesse: https://console.firebase.google.com/
2. Criar novo projeto: "apega-app" (ou nome que quiser)
3. Ativar Firestore Database (modo teste para começar)
4. Ativar Storage (modo teste)

#### 2.2 Obter credenciais

**Firebase Client (SDK Web):**

1. Project Settings > General
2. Scroll até "Seus apps" > Web app
3. Copiar o `firebaseConfig`

**Firebase Admin (Service Account):**

1. Project Settings > Service Accounts
2. "Generate new private key"
3. Baixar arquivo JSON

#### 2.3 Configurar variáveis de ambiente

Copie `.env.local.example` para `.env.local` e preencha:

```env
# Firebase Client (do firebaseConfig)
NEXT_PUBLIC_FIREBASE_API_KEY="..."
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="..."
NEXT_PUBLIC_FIREBASE_PROJECT_ID="..."
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="..."
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="..."
NEXT_PUBLIC_FIREBASE_APP_ID="..."

# Firebase Admin (do service account JSON)
FIREBASE_ADMIN_PROJECT_ID="..."
FIREBASE_ADMIN_CLIENT_EMAIL="..."
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# App Config
NEXT_PUBLIC_APP_NAME="Apega Desapega"
NEXT_PUBLIC_APP_CITY="Passo Fundo"
COMMISSION_RATE=5
```

### 3. Iniciar desenvolvimento

```bash
npm run dev
```

Abra: http://localhost:3000

## 📁 Estrutura do Projeto

```
MVP_NEXT/
├── src/
│   ├── app/                    # Páginas (App Router)
│   │   ├── page.tsx            # Home (feed)
│   │   ├── novo-anuncio/       # Criar anúncio
│   │   ├── item/[id]/          # Detalhes do item
│   │   └── api/                # API Routes
│   ├── components/             # Componentes React
│   │   ├── ui/                 # Componentes base
│   │   └── ItemCard.tsx        # Card de peça
│   ├── lib/                    # Utilitários
│   │   ├── firebase.ts         # Firebase Client
│   │   ├── firebase-admin.ts   # Firebase Admin
│   │   └── utils.ts            # Helpers
│   └── types/                  # TypeScript types
├── .env.local                  # Variáveis (não commitar!)
└── package.json
```

## ✅ Status do MVP

### Pronto (80%)

- ✅ Estrutura Next.js + TypeScript
- ✅ Firebase configurado (Client + Admin)
- ✅ Types completos
- ✅ Componentes UI base (Button, Card)
- ✅ ItemCard component
- ✅ Página Home (listagem)
- ✅ API de items (criar/listar)
- ✅ Layout responsivo

### A Fazer (20%)

- [ ] Página "Novo Anúncio" (formulário)
- [ ] Página de detalhes do item
- [ ] API de order (reservar)
- [ ] Componentes de Input/Form
- [ ] Validação com Zod
- [ ] Upload de imagens para Firebase Storage

## 🔨 Próximos Passos

### 1. Completar formulário de novo anúncio

Criar: `src/app/novo-anuncio/page.tsx`

```typescript
// Usar React Hook Form + Zod
// Campos: sellerName, sellerWhats, title, description, etc
// Upload de imagem (URL por enquanto, depois Firebase Storage)
```

### 2. Página de detalhes

Criar: `src/app/item/[id]/page.tsx`

```typescript
// Buscar item do Firestore
// Exibir fotos, descrição, preço
// Botão "Reservar" (abre WhatsApp do vendedor)
```

### 3. Sistema de reserva (futuro)

- API para criar Order
- Mudar status do item para RESERVED
- Integração com Mercado Pago (checkout PIX)

## 📦 Coleções do Firestore

### `sellers`

```json
{
  "id": "auto-generated",
  "name": "Maria Silva",
  "whatsapp": "5554999999999",
  "createdAt": "2025-10-30T..."
}
```

### `items`

```json
{
  "id": "auto-generated",
  "title": "Vestido Floral",
  "description": "Lindo vestido...",
  "priceCents": 8900,
  "brand": "Zara",
  "size": "M",
  "condition": "semi-novo",
  "imageUrl": "https://...",
  "status": "AVAILABLE",
  "city": "Passo Fundo",
  "sellerId": "seller-id",
  "createdAt": "2025-10-30T...",
  "updatedAt": "2025-10-30T..."
}
```

### `orders` (futuro)

```json
{
  "id": "auto-generated",
  "itemId": "item-id",
  "buyerName": "João",
  "buyerWhats": "5554888888888",
  "status": "PENDING",
  "createdAt": "2025-10-30T..."
}
```

## 💡 Dicas

### Upload de imagens (MVP)

**Opção 1 - URL Externa (mais rápido):**

- Hospedar fotos no Unsplash, Imgur, etc
- Colar URL no formulário
- **Vantagem**: Rápido para testar
- **Desvantagem**: Não escalável

**Opção 2 - Firebase Storage (recomendado):**

1. Usar `<input type="file" />`
2. Upload para Firebase Storage
3. Pegar URL pública
4. Salvar no Firestore

```typescript
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";

async function uploadImage(file: File) {
  const storageRef = ref(storage, `items/${Date.now()}_${file.name}`);
  await uploadBytes(storageRef, file);
  const url = await getDownloadURL(storageRef);
  return url;
}
```

### Comissão de 5%

Calculada automaticamente ao criar pedido:

```typescript
import { calculateFees } from "@/lib/utils";

const { grossCents, feeMarketplaceCents, netCents } =
  calculateFees(priceCents);

// grossCents = 10000 (R$ 100)
// feeMarketplaceCents = 500 (R$ 5 - comissão 5%)
// netCents = 9500 (R$ 95 - líquido pro vendedor)
```

## 🚀 Deploy

### Opção 1 - Vercel (Recomendado)

```bash
npm install -g vercel
vercel
```

Configurar variáveis de ambiente no painel do Vercel.

### Opção 2 - Firebase Hosting

```bash
npm run build
npm install -g firebase-tools
firebase init hosting
firebase deploy
```

## 📚 Recursos

- [Next.js Docs](https://nextjs.org/docs)
- [Firebase Docs](https://firebase.google.com/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [shadcn/ui](https://ui.shadcn.com/)

## 🐛 Troubleshooting

### Erro: Firebase not initialized

- Verifique se `.env.local` existe e está preenchido
- Reinicie o servidor (`npm run dev`)

### Erro: Permission denied (Firestore)

- Vá no Firebase Console > Firestore > Rules
- Mude para modo teste (temporário):

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true; // TESTE - depois trocar
    }
  }
}
```

### Imagens não carregam

- Adicione o domínio em `next.config.mjs` > `remotePatterns`

## 💰 Custos

- **Firebase**: Grátis até 50k reads/dia
- **Vercel**: Grátis para hobby
- **Total**: R$ 0/mês (até escalar)

---

**Pronto para vender! 🚀**

Ver: [PROXIMOS_PASSOS.md](../PROXIMOS_PASSOS.md) para roadmap completo.
