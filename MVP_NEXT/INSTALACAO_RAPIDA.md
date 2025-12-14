# ⚡ Instalação Rápida - 10 Minutos

## 1. Instalar dependências (2 min)

```bash
cd MVP_NEXT
npm install
```

## 2. Criar projeto Firebase (3 min)

### 2.1 Acesse Firebase Console

https://console.firebase.google.com/

### 2.2 Criar projeto

1. Clicar em "Adicionar projeto"
2. Nome: `apega-app`
3. Desativar Google Analytics (não precisa por enquanto)
4. Criar projeto

### 2.3 Ativar Firestore

1. No menu lateral: **Build > Firestore Database**
2. Clicar em "Criar banco de dados"
3. Modo: **Iniciar no modo de teste** (temporário)
4. Local: **southamerica-east1 (São Paulo)**
5. Ativar

### 2.4 Ativar Storage

1. No menu lateral: **Build > Storage**
2. Clicar em "Começar"
3. Modo: **Iniciar no modo de teste**
4. Usar mesmo local (São Paulo)
5. Concluir

## 3. Copiar credenciais Firebase (3 min)

### 3.1 Credenciais Web (SDK)

1. Project Settings (engrenagem) > General
2. Scroll até "Seus apps"
3. Clicar no ícone `</>`  (Web)
4. Registrar app: nome "apega-web"
5. Copiar o objeto `firebaseConfig`

### 3.2 Credenciais Admin (Service Account)

1. Project Settings > Service Accounts
2. Clicar em "Gerar nova chave privada"
3. Baixar arquivo JSON

### 3.3 Criar arquivo .env.local

```bash
cp .env.local.example .env.local
```

Editar `.env.local` e colar:

```env
# Firebase Web SDK (do firebaseConfig)
NEXT_PUBLIC_FIREBASE_API_KEY="AIzaSy..."
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="apega-app.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="apega-app"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="apega-app.appspot.com"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="123456789"
NEXT_PUBLIC_FIREBASE_APP_ID="1:123456789:web:abc123"

# Firebase Admin (do JSON baixado)
FIREBASE_ADMIN_PROJECT_ID="apega-app"
FIREBASE_ADMIN_CLIENT_EMAIL="firebase-adminsdk-xxx@apega-app.iam.gserviceaccount.com"
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkq...\n-----END PRIVATE KEY-----\n"

# App
NEXT_PUBLIC_APP_NAME="Apega Desapega"
NEXT_PUBLIC_APP_CITY="Passo Fundo"
COMMISSION_RATE=5
```

**⚠️ IMPORTANTE**: No `FIREBASE_ADMIN_PRIVATE_KEY`, copie exatamente como está no JSON, incluindo `\n` nas quebras de linha.

## 4. Rodar o projeto (1 min)

```bash
npm run dev
```

Abrir: http://localhost:3000

## 5. Adicionar dados de teste (1 min)

### Manualmente pelo Firestore Console:

1. Ir em **Firestore Database**
2. Clicar em "Iniciar coleção"
3. ID da coleção: `sellers`
4. Adicionar documento:

```
ID: (auto)
name: "Apega Desapega"
whatsapp: "5554999999999"
createdAt: (timestamp)
```

5. Criar outra coleção: `items`
6. Adicionar documento:

```
ID: (auto)
title: "Vestido Floral"
description: "Lindo vestido estampa floral"
priceCents: 8900
brand: "Zara"
size: "M"
condition: "semi-novo"
imageUrl: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800"
status: "AVAILABLE"
city: "Passo Fundo"
sellerId: (ID do seller criado acima)
createdAt: (timestamp)
updatedAt: (timestamp)
```

### Ou via API:

Use Postman ou Insomnia:

**POST** `http://localhost:3000/api/items`

Body (form-data):
```
sellerName: Apega Desapega
sellerWhats: 5554999999999
title: Vestido Floral
description: Lindo vestido estampa floral
brand: Zara
size: M
condition: semi-novo
priceCents: 8900
imageUrl: https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800
city: Passo Fundo
```

## ✅ Pronto!

Atualize http://localhost:3000 e veja seu primeiro item!

## 🐛 Problemas?

### Erro: "Firebase not initialized"

- Verificar se `.env.local` existe
- Reiniciar servidor (Ctrl+C e `npm run dev` novamente)

### Erro: "Permission denied"

Firestore está em modo teste? Verificar regras:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true; // TESTE
    }
  }
}
```

### Imagens não aparecem

Adicionar domínio em `next.config.mjs`:

```javascript
images: {
  remotePatterns: [
    {
      protocol: 'https',
      hostname: 'images.unsplash.com',
    },
  ],
},
```

## 📚 Próximo

Ver: [PROXIMOS_PASSOS.md](../PROXIMOS_PASSOS.md)
