# API Documentation - Apega Desapega Backend

## Base URL

- **Development**: `http://localhost:3000`
- **Production**: `https://seu-app.vercel.app` (após deploy)

---

## Endpoints

### 1. Upload de Imagem

**POST** `/api/upload`

Faz upload de uma imagem para o Firebase Storage e retorna a URL pública.

**Request:**
- Content-Type: `multipart/form-data`
- Body:
  - `file`: Arquivo de imagem (JPG, PNG ou WEBP, máx 5MB)

**Response:**
```json
{
  "success": true,
  "url": "https://storage.googleapis.com/bucket-name/items/timestamp-filename.jpg",
  "fileName": "items/timestamp-filename.jpg"
}
```

**Erros:**
- `400`: Arquivo inválido ou muito grande
- `500`: Erro no upload

---

### 2. Criar Item

**POST** `/api/items`

Cria um novo item no marketplace. Se o vendedor não existir, cria automaticamente.

**Request:**
- Content-Type: `multipart/form-data`
- Body:
  - `sellerName`: string (obrigatório)
  - `sellerWhats`: string (obrigatório) - WhatsApp com DDD
  - `title`: string (obrigatório)
  - `description`: string (obrigatório)
  - `brand`: string (opcional)
  - `size`: string (opcional)
  - `priceCents`: number (obrigatório) - Preço em centavos
  - `condition`: string (opcional) - "novo", "semi-novo" ou "usado"
  - `imageUrl`: string (obrigatório) - URL da imagem
  - `city`: string (opcional) - Default: "Passo Fundo"

**Response:**
```json
{
  "success": true,
  "itemId": "abc123..."
}
```

**Erros:**
- `400`: Campos obrigatórios faltando
- `500`: Erro ao criar item

---

### 3. Listar Itens

**GET** `/api/items`

Lista todos os itens disponíveis (status AVAILABLE), ordenados por data de criação (mais recentes primeiro).

**Query Parameters:**
- `limit`: number (opcional) - Default: 24

**Response:**
```json
{
  "success": true,
  "items": [
    {
      "id": "item123",
      "title": "Vestido Floral",
      "description": "Lindo vestido...",
      "priceCents": 8900,
      "brand": "Zara",
      "size": "M",
      "condition": "semi-novo",
      "imageUrl": "https://...",
      "status": "AVAILABLE",
      "city": "Passo Fundo",
      "sellerId": "seller123",
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-01-01T00:00:00.000Z"
    }
  ]
}
```

**Erros:**
- `500`: Erro ao buscar itens

---

### 4. Buscar Item por ID

**GET** `/api/items/[id]`

Retorna os dados completos de um item específico, incluindo informações do vendedor.

**Path Parameters:**
- `id`: string - ID do item

**Response:**
```json
{
  "success": true,
  "item": {
    "id": "item123",
    "title": "Vestido Floral",
    "description": "Lindo vestido...",
    "priceCents": 8900,
    "brand": "Zara",
    "size": "M",
    "condition": "semi-novo",
    "imageUrl": "https://...",
    "status": "AVAILABLE",
    "city": "Passo Fundo",
    "sellerId": "seller123",
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-01T00:00:00.000Z"
  },
  "seller": {
    "id": "seller123",
    "name": "João Silva",
    "whatsapp": "5554999999999",
    "createdAt": "2025-01-01T00:00:00.000Z"
  }
}
```

**Erros:**
- `404`: Item não encontrado
- `500`: Erro ao buscar item

---

### 5. Atualizar Item

**PATCH** `/api/items/[id]`

Atualiza informações de um item existente.

**Path Parameters:**
- `id`: string - ID do item

**Request:**
- Content-Type: `application/json`
- Body (todos opcionais):
  - `status`: "AVAILABLE" | "RESERVED" | "SOLD"
  - `title`: string
  - `description`: string
  - `priceCents`: number
  - `condition`: "novo" | "semi-novo" | "usado"

**Response:**
```json
{
  "success": true,
  "message": "Item atualizado com sucesso"
}
```

**Erros:**
- `404`: Item não encontrado
- `500`: Erro ao atualizar item

---

### 6. Deletar Item

**DELETE** `/api/items/[id]`

Remove um item do banco de dados.

**Path Parameters:**
- `id`: string - ID do item

**Response:**
```json
{
  "success": true,
  "message": "Item deletado com sucesso"
}
```

**Erros:**
- `404`: Item não encontrado
- `500`: Erro ao deletar item

---

### 7. Buscar Vendedor por ID

**GET** `/api/sellers/[id]`

Retorna os dados de um vendedor específico.

**Path Parameters:**
- `id`: string - ID do vendedor

**Response:**
```json
{
  "success": true,
  "seller": {
    "id": "seller123",
    "name": "João Silva",
    "whatsapp": "5554999999999",
    "createdAt": "2025-01-01T00:00:00.000Z"
  }
}
```

**Erros:**
- `404`: Vendedor não encontrado
- `500`: Erro ao buscar vendedor

---

## Modelo de Dados

### Item
```typescript
{
  id: string;
  title: string;
  description: string;
  priceCents: number;        // Preço em centavos (ex: 8900 = R$ 89,00)
  brand?: string;
  size?: string;
  condition?: 'novo' | 'semi-novo' | 'usado';
  imageUrl: string;
  status: 'AVAILABLE' | 'RESERVED' | 'SOLD';
  city: string;
  sellerId: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### Seller
```typescript
{
  id: string;
  name: string;
  whatsapp: string;          // Formato: 5554999999999 (DDI + DDD + número)
  createdAt: Date;
}
```

---

## Segurança

- Todas as APIs usam Firebase Admin SDK (server-side)
- Credenciais Firebase não são expostas ao client
- Upload de imagens validado (tipo e tamanho)
- Campos permitidos para atualização são limitados

---

## Rate Limiting

Recomenda-se implementar rate limiting em produção:
- Sugestão: 100 req/minuto por IP para leitura
- Sugestão: 10 req/minuto por IP para escrita

---

## CORS

Configure CORS adequadamente para produção:
```javascript
// next.config.js
{
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: 'https://seu-app.vercel.app' },
        ],
      },
    ];
  },
}
```
