# Manual Completo - ApegaDesapega

## Indice

1. [Visao Geral](#visao-geral-do-sistema)
2. [Arquitetura](#arquitetura-do-sistema)
3. [Fluxo do Comprador](#fluxo-completo-do-comprador)
4. [Fluxo do Vendedor](#fluxo-completo-do-vendedor)
5. [Fluxo do Admin](#fluxo-do-administrador)
6. [Categorias e Produtos](#categorias-e-produtos)
7. [Taxas e Comissoes](#sistema-de-taxas-e-comissoes)
8. [Assinatura Premium](#assinatura-premium)
9. [Recursos de IA](#recursos-de-ia)
10. [Funcionalidades Sociais](#funcionalidades-sociais)
11. [Politicas](#politicas)
12. [APIs](#apis-do-backend)
13. [Banco de Dados](#banco-de-dados)
14. [Deploy](#deploy-e-atualizacoes)
15. [Simulacoes Financeiras](#simulacoes-financeiras)

---

## Visao Geral do Sistema

| Componente | Tecnologia | URL |
|------------|------------|-----|
| **Mobile App** | React Native + Expo | Google Play Store |
| **Backend API** | Node.js + Express | https://apega-desapega-production.up.railway.app |
| **Admin Panel** | React + Vite | https://apega-admin-production.up.railway.app |
| **Banco de Dados** | PostgreSQL | Neon.tech |
| **Imagens** | Cloudinary | cloudinary.com |
| **Pagamentos** | Mercado Pago | mercadopago.com.br |
| **IA** | Claude 3.5 Sonnet | Anthropic |

---

## Arquitetura do Sistema

```
+------------------+     +------------------+     +------------------+
|   Mobile App     |     |   Admin Panel    |     |   PostgreSQL     |
|  (React Native)  |     |     (React)      |     |   (Neon.tech)    |
+--------+---------+     +--------+---------+     +--------+---------+
         |                        |                        |
         v                        v                        |
+----------------------------------------------------------+
|                    Backend API (Node.js)                  |
|                       Railway.app                         |
+----------------------------------------------------------+
         |              |              |              |
         v              v              v              v
+------------+  +------------+  +------------+  +------------+
| Cloudinary |  |   Claude   |  |  Mercado   |  |  Google    |
|  (Imagens) |  |    (IA)    |  |   Pago     |  |   AdMob    |
+------------+  +------------+  +------------+  +------------+
```

---

## Fluxo Completo do Comprador

### 1. Cadastro
```
Abre app -> Cadastro -> Nome + Email + Senha -> Conta FREE criada -> Login automatico
```

### 2. Navegacao (Tabs)
```
+------------------------------------------------------------------+
|   Home   |   Busca   |   Vender   |  Notificacoes  |   Perfil    |
+------------------------------------------------------------------+
     |          |            |              |              |
   Feed     Filtros      Criar         Alertas       Minha conta
  produtos  categorias   anuncio     mensagens      configuracoes
            tamanhos                  vendas         carteira
            precos                    seguidores     favoritos
```

### 3. Processo de Compra

```
1. Encontra produto no feed ou busca
2. Clica para ver detalhes (fotos, descricao, vendedor)
3. Pode iniciar chat com vendedor (tira duvidas)
4. Adiciona ao carrinho
5. Vai para checkout
6. Seleciona ou cadastra endereco de entrega
7. Escolhe pagamento: PIX, Boleto ou Cartao
8. Confirma compra

APOS COMPRA:
- Pedido criado (status: pending_payment)
- Se PIX: QR Code exibido, paga em ate 30 min
- Se Boleto: codigo gerado, paga em ate 3 dias
- Se Cartao: aprovacao instantanea
- Paga -> status: paid -> pending_shipment
- Vendedor notificado para enviar
- Vendedor envia -> status: shipped
- Codigo de rastreio disponivel no app
- Chegou -> status: delivered
- 7 dias para confirmar recebimento
- Confirma ou automatico -> status: completed
- Dinheiro liberado para vendedor
- Cashback creditado para comprador
- Pode avaliar vendedor (1-5 estrelas + comentario)
```

### 4. Status dos Pedidos (Comprador)

| Status | Significado | Acao do Comprador |
|--------|-------------|-------------------|
| `pending_payment` | Aguardando pagamento | Pagar PIX/Boleto |
| `paid` | Pagamento confirmado | Aguardar envio |
| `pending_shipment` | Aguardando vendedor postar | Aguardar |
| `shipped` | Enviado | Acompanhar rastreio |
| `in_transit` | Em transito | Acompanhar |
| `delivered` | Entregue | Confirmar recebimento |
| `completed` | Finalizado | Avaliar vendedor |
| `cancelled` | Cancelado | Ver motivo |

### 5. Cashback do Comprador

| Tipo Usuario | Cashback | Exemplo R$100 |
|--------------|----------|---------------|
| FREE | 2% do valor do produto | R$ 2,00 |
| PREMIUM | 0,5% do valor do produto | R$ 0,50 |

O cashback vai para `cashback_balance` e pode ser:
- Usado como desconto em compras
- Sacado via PIX (minimo R$ 10)

---

## Fluxo Completo do Vendedor

### 1. Configurar Loja

```
Perfil -> Configuracoes -> Preencher:
- Nome da loja (aparece publicamente)
- Descricao da loja
- Avatar (foto do perfil)
- Banner (capa da loja)
- Cidade/Estado
- Instagram (opcional)

Dados bancarios (OBRIGATORIO para receber):
- CPF (verificacao)
- Tipo de chave PIX (CPF, email, telefone, aleatoria)
- Chave PIX
- Banco, Agencia, Conta (opcional, backup)
```

### 2. Publicar Produto - Usuario FREE

```
Clica em "Vender" (tab central)
    |
    v
VERIFICA LIMITE: MAX 5 PRODUTOS ATIVOS
    |
    +-> Atingiu limite? -> Mostra tela de upgrade Premium
    |
    +-> Tem espaco? -> Continua
          |
          v
Preenche manualmente:
- Fotos (1 a 5 fotos, max 5MB cada)
- Titulo (max 100 caracteres)
- Descricao detalhada
- Categoria (seleciona da lista)
- Marca (opcional)
- Tamanho (PP, P, M, G, GG, XG ou 34-44)
- Condicao (novo, seminovo, usado, vintage)
- Cores
- Preco desejado (quanto quer receber)
          |
          v
Sistema calcula preco final automaticamente:
+--------------------------------+
| Preco vendedor: R$ 100,00      |
| Taxa FREE: 25%                 |
| Preco exibido: R$ 125,00       |
| Vendedor recebe: R$ 100,00     |
+--------------------------------+
          |
          v
Preview -> Confirma -> Produto publicado!
```

### 3. Publicar Produto - Usuario PREMIUM

```
Clica em "Vender"
    |
    v
SEM LIMITE DE PRODUTOS (ilimitado)
    |
    v
DUAS OPCOES:

[OPCAO 1] Publicacao Manual (igual FREE)
    |
[OPCAO 2] Publicacao com IA (exclusivo Premium)
    |
    v
Tira foto da roupa (ou seleciona da galeria)
    |
    v
+----------------------------------------+
|         IA ANALISA (Claude 3.5)        |
|        Processando... 5-10 seg         |
+----------------------------------------+
              |
              v
+----------------------------------------+
|        RESULTADO DA ANALISE            |
+----------------------------------------+
| Tipo: Vestido midi floral              |
| Marca: Zara (identificada na etiqueta) |
| Condicao: Seminovo, bom estado         |
| Cores: Rosa, verde, branco             |
| Material: Viscose                      |
| Tamanho estimado: M                    |
| Estilo: Casual/Romantico               |
|                                        |
| PRECO SUGERIDO (mercado brasileiro):   |
| Minimo: R$ 45                          |
| Maximo: R$ 75                          |
| Recomendado: R$ 55                     |
|                                        |
| Titulo sugerido:                       |
| "Vestido Midi Floral Zara Tamanho M"   |
|                                        |
| Descricao sugerida:                    |
| [texto completo otimizado para vendas] |
|                                        |
| Hashtags: #vestido #zara #floral #midi |
+----------------------------------------+
    |
    v
Vendedor pode:
- Aceitar tudo (1 clique)
- Editar qualquer campo
- Ajustar preco
    |
    v
Sistema gera VARIACOES automaticas da foto:
1. Foto original
2. Fundo removido (branco limpo)
3. Zoom central no produto
    |
    v
+--------------------------------+
| Preco vendedor: R$ 55,00       |
| Taxa PREMIUM: 12%              |
| Preco exibido: R$ 61,60        |
| Vendedor recebe: R$ 55,00      |
+--------------------------------+
    |
    v
Produto publicado com SELO PREMIUM
(destaque dourado, aparece primeiro nos resultados)
```

### 4. Gerenciar Produtos

```
Perfil -> Meus Produtos
    |
    v
Lista com filtros:
- Ativos (a venda)
- Vendidos
- Pausados
- Todos

Acoes por produto:
- Editar (fotos, preco, descricao)
- Pausar (tira do ar temporariamente)
- Excluir (remove permanentemente)
- Ver estatisticas (visualizacoes, favoritos)
```

### 5. Gerenciar Vendas

```
Notificacao de venda -> "Minhas Vendas"
    |
    v
Lista por status:
- Aguardando pagamento (cinza)
- Pagos - ENVIAR! (verde pulsante)
- Enviados (azul)
- Entregues (roxo)
- Finalizados (verde)
    |
    v
Clica no pedido PAGO:
+--------------------------------+
| Produto: Vestido Floral        |
| Comprador: Maria Silva         |
| Endereco: Rua X, 123...        |
| Cidade: Sao Paulo - SP         |
| CEP: 01234-567                 |
+--------------------------------+
    |
    v
1. Embala o produto com cuidado
2. Vai aos Correios/transportadora
3. Posta o pacote
4. Adiciona codigo de rastreio no app
5. Clica "Marcar como Enviado"
    |
    v
Comprador recebe notificacao
Rastreio disponivel para ambos
    |
    v
Entrega confirmada -> Saldo liberado
+--------------------------------+
| Valor da venda: R$ 61,60       |
| Taxa (12%): R$ 6,60            |
| Frete recebido: R$ 15,00       |
| VOCE RECEBE: R$ 70,00          |
+--------------------------------+
```

### 6. Sacar Dinheiro

```
Perfil -> Carteira
    |
    v
+--------------------------------+
| Saldo disponivel: R$ 250,00    |
| Saldo pendente: R$ 80,00       |
| Cashback: R$ 12,50             |
+--------------------------------+
    |
    v
Clica "Sacar"
    |
    v
Informa valor (minimo R$ 20,00)
    |
    v
Confirma dados PIX:
- Chave: seu@email.com
- CPF: 123.456.789-00
    |
    v
Saque criado (status: pending)
    |
    v
ADMIN verifica e aprova (1-3 dias uteis)
    |
    v
PIX realizado -> Vendedor notificado
    |
    v
Dinheiro na conta!
```

---

## Fluxo do Administrador

### 1. Acesso
```
URL: https://apega-admin-production.up.railway.app
Login com conta que tem is_admin = true no banco
```

### 2. Dashboard Principal
```
+------------------------------------------------------------------+
|                         DASHBOARD                                 |
+------------------------------------------------------------------+
|  +------------+  +------------+  +------------+  +------------+  |
|  | Usuarios   |  | Produtos   |  | Pedidos    |  | Receita    |  |
|  | 1.234      |  | 5.678      |  | 890        |  | R$ 45.000  |  |
|  | +12 hoje   |  | +45 hoje   |  | +23 hoje   |  | +R$ 2.300  |  |
|  +------------+  +------------+  +------------+  +------------+  |
|                                                                   |
|  [Grafico] Vendas ultimos 30 dias                                |
|  [Grafico] Novos usuarios por semana                             |
|  [Grafico] Produtos por categoria                                |
+------------------------------------------------------------------+
```

### 3. Menu e Funcoes

| Menu | Funcoes |
|------|---------|
| **Dashboard** | Metricas, graficos, resumo geral |
| **Usuarios** | Listar, buscar, ver detalhes, bloquear/desbloquear, promover admin |
| **Produtos** | Listar, filtrar por status, pausar, excluir, ver denuncias |
| **Pedidos** | Listar todos, filtrar por status, alterar status, ver detalhes |
| **Saques** | Lista pendentes, APROVAR ou REJEITAR, historico |
| **Assinaturas** | Ver premium ativos, receita mensal |
| **Analytics** | Carrinhos abandonados, produtos mais vistos, vendedores top |
| **Configuracoes** | Taxas, promocoes, limites |

### 4. Aprovar Saques (TAREFA CRITICA)

```
Menu Saques -> Aba "Pendentes"
    |
    v
+------------------------------------------------------------------+
| # | Usuario     | Valor    | Chave PIX       | Data    | Acao   |
+------------------------------------------------------------------+
| 1 | Maria Silva | R$ 150   | maria@email.com | 02/01   | [...]  |
| 2 | Joao Santos | R$ 320   | 11999998888     | 02/01   | [...]  |
+------------------------------------------------------------------+
    |
    v
Clica em um saque -> Ve detalhes:
+--------------------------------+
| Usuario: Maria Silva           |
| CPF: 123.456.789-00            |
| Valor solicitado: R$ 150,00    |
| Saldo atual: R$ 180,00         |
| Chave PIX: maria@email.com     |
| Tipo: Email                    |
| Banco: (se informado)          |
+--------------------------------+

VERIFICAR:
1. Saldo suficiente? (>=valor)
2. CPF confere?
3. Historico do usuario ok?

[APROVAR]                    [REJEITAR]
    |                            |
    v                            v
Fazer PIX manual             Informar motivo
pelo banco                   (saldo devolvido)
    |                            |
    v                            v
Marcar como "approved"       Marcar como "rejected"
    |                            |
    v                            v
Usuario notificado           Usuario notificado
```

---

## Categorias e Produtos

### Categorias Disponiveis

| Categoria | Icone | Descricao |
|-----------|-------|-----------|
| Vestidos | dress | Vestidos de todos os tipos |
| Blusas | shirt | Blusas, camisetas, tops |
| Calcas | pants | Calcas, jeans, leggings |
| Saias | skirt | Saias curtas e longas |
| Shorts | shorts | Shorts e bermudas |
| Conjuntos | set | Sets e conjuntos |
| Acessorios | accessory | Cintos, lencos, chapeus |
| Calcados | shoe | Sapatos, tenis, sandalias |
| Bolsas | bag | Bolsas e mochilas |
| Joias | jewelry | Bijuterias e joias |

### Condicoes do Produto

| Condicao | Codigo | Descricao |
|----------|--------|-----------|
| Novo | `novo` | Com etiqueta ou nunca usado |
| Seminovo | `seminovo` | Usado poucas vezes, otimo estado |
| Usado | `usado` | Sinais de uso, bom estado |
| Vintage | `vintage` | Peca antiga, estilo retro |

### Tamanhos Disponiveis

**Letras (Brasil):**
- PP (Extra Pequeno)
- P (Pequeno)
- M (Medio)
- G (Grande)
- GG (Extra Grande)
- XG (Extra Extra Grande)

**Numeros:**
- 34, 36, 38, 40, 42, 44

### Limites de Fotos

| Tipo | Quantidade | Tamanho Max |
|------|------------|-------------|
| Fotos por produto | 1-5 | 5MB cada |
| Formatos aceitos | JPEG, PNG, WEBP | - |

---

## Sistema de Taxas e Comissoes

### Resumo das Taxas

```
+------------------------------------------------------------------+
|                    VENDEDOR FREE                                  |
+------------------------------------------------------------------+
| Taxa sobre venda: 25%                                            |
| Limite de anuncios: ILIMITADO                                    |
| Cashback em compras: 1%                                          |
| Acesso a IA: NAO                                                 |
| Destaque: NAO                                                    |
|                                                                   |
| CALCULO COMPLETO (com impostos):                                 |
| Vendedor quer receber: R$ 100,00                                 |
| Taxa plataforma (25%): R$ 25,00                                  |
| Preco exibido ao comprador: R$ 125,00                            |
|                                                                   |
| Receita plataforma: R$ 25,00                                     |
| (-) Impostos Lucro Presumido (16,33%): R$ 4,08                   |
| (=) Receita liquida plataforma: R$ 20,92                         |
| Vendedor recebe: R$ 100,00                                       |
+------------------------------------------------------------------+

+------------------------------------------------------------------+
|                    VENDEDOR PREMIUM                               |
+------------------------------------------------------------------+
| Taxa sobre venda: 12%                                            |
| Limite de anuncios: ILIMITADO                                    |
| Cashback em compras: 1%                                          |
| Acesso a IA: SIM (analise, preco, fundo)                         |
| Destaque: SIM (aparece primeiro)                                 |
|                                                                   |
| CALCULO COMPLETO (com impostos):                                 |
| Vendedor quer receber: R$ 100,00                                 |
| Taxa plataforma (12%): R$ 12,00                                  |
| Preco exibido ao comprador: R$ 112,00                            |
|                                                                   |
| Receita plataforma: R$ 12,00                                     |
| (-) Impostos Lucro Presumido (16,33%): R$ 1,96                   |
| (=) Receita liquida plataforma: R$ 10,04                         |
| Vendedor recebe: R$ 100,00                                       |
+------------------------------------------------------------------+

+------------------------------------------------------------------+
|                    PROMOCAO LANCAMENTO                            |
|               (primeiros 50 vendedores)                          |
+------------------------------------------------------------------+
| Taxa: 5% (desconto especial!)                                    |
| Vendedor quer receber: R$ 100,00                                 |
| Taxa (5%): R$ 5,00                                               |
| Preco exibido: R$ 105,00                                         |
| Valido ate: completar 50 vendedores ou 90 dias                   |
+------------------------------------------------------------------+
```

### Impostos (Lucro Presumido)

```
+------------------------------------------------------------------+
|              CARGA TRIBUTARIA - LUCRO PRESUMIDO                  |
+------------------------------------------------------------------+
|                                                                   |
| Base de calculo: Receita Bruta de Servicos (comissoes)           |
| Regime: Lucro Presumido (servicos = 32% de presuncao)            |
|                                                                   |
| TRIBUTOS FEDERAIS:                                               |
| +------------------------------------------------------------+   |
| | Tributo | Base           | Aliquota | Efetivo s/ receita  |   |
| +------------------------------------------------------------+   |
| | PIS     | Receita bruta  | 0,65%    | 0,65%               |   |
| | COFINS  | Receita bruta  | 3,00%    | 3,00%               |   |
| | IRPJ    | 32% da receita | 15%      | 4,80%               |   |
| | CSLL    | 32% da receita | 9%       | 2,88%               |   |
| +------------------------------------------------------------+   |
| | Subtotal Federal                    | 11,33%              |   |
| +------------------------------------------------------------+   |
|                                                                   |
| TRIBUTO MUNICIPAL:                                               |
| +------------------------------------------------------------+   |
| | ISS     | Receita bruta  | 5%       | 5,00%               |   |
| +------------------------------------------------------------+   |
|                                                                   |
| +------------------------------------------------------------+   |
| | TOTAL CARGA TRIBUTARIA              | 16,33%              |   |
| +------------------------------------------------------------+   |
|                                                                   |
| EXEMPLO PRATICO:                                                 |
| Venda de R$ 125,00 (produto R$100 + taxa 25%)                   |
| Receita da plataforma: R$ 25,00                                  |
| Impostos (16,33%): R$ 4,08                                       |
| Receita liquida: R$ 20,92                                        |
|                                                                   |
+------------------------------------------------------------------+
```

### Frete

```
+------------------------------------------------------------------+
|                         FRETE                                     |
+------------------------------------------------------------------+
| Valor base: R$ 15,00 (fixo inicial)                              |
| Calculado via: Melhor Envio API                                  |
| Opcoes: PAC, SEDEX, Jadlog                                       |
|                                                                   |
| Quem paga: COMPRADOR (adicionado ao total)                       |
| Destino do frete: VENDEDOR (para custear envio)                  |
|                                                                   |
| Exemplo:                                                         |
| Produto: R$ 110,00                                               |
| Frete: R$ 15,00                                                  |
| Total pago pelo comprador: R$ 125,00                             |
| Vendedor recebe: R$ 100,00 (produto) + R$ 15,00 (frete)          |
+------------------------------------------------------------------+
```

---

## Assinatura Premium

### Comparativo de Planos

```
+------------------------------------------------------------------+
|                         GRATUITO                                  |
+------------------------------------------------------------------+
| Preco: R$ 0                                                      |
| Anuncios: ILIMITADOS                                             |
| Taxa por venda: 25%                                              |
| Cashback compras: 1%                                             |
| Analise IA: NAO                                                  |
| Sugestao preco: NAO                                              |
| Remocao fundo: NAO                                               |
| Destaque busca: NAO                                              |
| Selo Premium: NAO                                                |
+------------------------------------------------------------------+

+------------------------------------------------------------------+
|                      PREMIUM MENSAL                               |
+------------------------------------------------------------------+
| Preco: R$ 19,90/mes                                              |
| Anuncios: ILIMITADOS                                             |
| Taxa por venda: 12% (menos da metade!)                           |
| Cashback compras: 1%                                             |
| Analise IA: SIM - Claude 3.5 Sonnet                              |
| Sugestao preco: SIM - baseado no mercado                         |
| Remocao fundo: SIM - automatico                                  |
| Destaque busca: SIM - aparece primeiro                           |
| Selo Premium: SIM - badge dourado                                |
| Suporte: Prioritario                                             |
+------------------------------------------------------------------+

+------------------------------------------------------------------+
|                       PREMIUM ANUAL                               |
+------------------------------------------------------------------+
| Preco: R$ 199,90/ano                                             |
| Equivale a: R$ 16,66/mes                                         |
| Economia: R$ 38,90 (2 meses gratis!)                             |
|                                                                   |
| Todos os beneficios do mensal +                                  |
| Prova virtual IA (em breve)                                      |
+------------------------------------------------------------------+
```

### Fluxo de Assinatura

```
Usuario FREE -> Perfil -> "Seja Premium"
    |
    v
Tela de comparacao (FREE vs PREMIUM)
    |
    v
Escolhe: [Mensal R$ 19,90] ou [Anual R$ 199,90]
    |
    v
Escolhe pagamento: [PIX] ou [Boleto]
    |
    +-> PIX:
    |     QR Code exibido na tela
    |     Validade: 30 minutos
    |     Paga com app do banco
    |     Webhook confirma instantaneo
    |
    +-> Boleto:
         Codigo de barras gerado
         Validade: 3 dias
         Paga no banco/app
         Webhook confirma em 1-2 dias
    |
    v
Pagamento confirmado via Webhook Mercado Pago
    |
    v
Sistema atualiza usuario:
- subscription_type = 'premium'
- subscription_expires_at = data + 1 mes (ou 1 ano)
    |
    v
Usuario agora e PREMIUM!
- Badge dourado aparece no perfil
- IA liberada
- Limite removido
- Taxa reduzida nas proximas vendas
```

### Renovacao e Cancelamento

```
RENOVACAO:
- Nao e automatica (sem cartao recorrente)
- 3 dias antes: notificacao "Premium expirando"
- Usuario escolhe renovar ou deixar expirar

CANCELAMENTO:
- Pode cancelar a qualquer momento
- Continua Premium ate a data de expiracao
- Apos expirar, volta para FREE
- Produtos acima de 5 ficam pausados
```

---

## Recursos de IA

### Provedores Utilizados

| Servico | Funcao | Custo |
|---------|--------|-------|
| **Claude 3.5 Sonnet** | Analise de roupas, sugestao preco | ~$0.003/request |
| **Cloudinary** | Remocao fundo, transformacoes | Incluso no plano |
| **Replicate (Kolors)** | Virtual Try-On (futuro) | ~$0.01/request |

### 1. Analise de Roupa (POST /api/ai/analyze)

O que a IA identifica automaticamente:

```json
{
  "tipo": "Vestido midi floral",
  "marca": "Zara",
  "condicao": "seminovo",
  "condicaoDetalhada": "Usado poucas vezes, sem manchas ou rasgos",
  "cores": ["rosa", "verde", "branco"],
  "corPrincipal": "rosa",
  "materiais": ["viscose"],
  "tamanho": "M",
  "estilo": "casual romantico",
  "ocasiao": ["dia a dia", "passeio"],
  "estacao": ["primavera", "verao"],
  "precoSugerido": {
    "minimo": 45,
    "maximo": 75,
    "ideal": 55,
    "justificativa": "Marca popular, bom estado, estilo atemporal"
  },
  "tituloSugerido": "Vestido Midi Floral Zara Tamanho M",
  "descricaoSugerida": "Lindo vestido midi floral da Zara...",
  "hashtags": ["#vestido", "#zara", "#floral", "#midi", "#seminovo"],
  "dicasVenda": "Fotografe com luz natural para destacar as cores"
}
```

### 2. Variacoes Automaticas de Foto

Ao fazer upload, o sistema gera 3 versoes:

| Versao | Descricao | Uso |
|--------|-----------|-----|
| Original | Foto como enviada | Galeria |
| Fundo Removido | Fundo branco limpo | Destaque |
| Zoom Central | Recorte focado no produto | Thumbnail |

### 3. Outras APIs de IA

| Endpoint | Funcao | Premium |
|----------|--------|---------|
| `POST /api/ai/analyze` | Analise completa da roupa | Sim |
| `POST /api/ai/improve-description` | Melhora texto existente | Sim |
| `POST /api/ai/remove-background` | Remove fundo de foto | Sim |
| `POST /api/ai/enhance-image` | Melhora qualidade | Sim |
| `POST /api/ai/virtual-tryon` | Prova virtual (beta) | Sim |
| `GET /api/ai/status` | Verifica se tem acesso | Nao |

---

## Funcionalidades Sociais

### 1. Sistema de Avaliacoes

```
COMO FUNCIONA:
- Apos pedido "completed", ambos podem avaliar
- Nota: 1 a 5 estrelas
- Comentario: opcional (max 500 caracteres)
- Uma avaliacao por pedido por pessoa
- Media calculada automaticamente no perfil

EXIBICAO:
+--------------------------------+
| Maria Silva          * 4.8    |
| 127 avaliacoes                 |
+--------------------------------+
| ***** "Otima vendedora,        |
| produto como descrito!"        |
| - Joao, 2 dias atras           |
+--------------------------------+
```

### 2. Sistema de Chat

```
INICIAR CONVERSA:
- Pelo produto: "Conversar com vendedor"
- Pelo perfil: "Enviar mensagem"

FUNCIONALIDADES:
- Mensagens de texto
- Vinculo com produto (opcional)
- Notificacao push de nova mensagem
- Indicador de lido/nao lido
- Historico permanente

TELA DE CONVERSAS:
+--------------------------------+
| Maria Silva           2h atras |
| "Oi! O vestido ainda esta...   |
+--------------------------------+
| Joao Santos       ontem        |
| "Obrigado pela compra!"        |
+--------------------------------+
```

### 3. Sistema de Favoritos

```
ADICIONAR:
- Coracao no card do produto
- Coracao na tela de detalhes

VER FAVORITOS:
Perfil -> Favoritos
Lista de todos os produtos salvos

NOTIFICACOES (futuro):
- Preco baixou
- Produto quase vendendo
```

### 4. Sistema de Seguidores

```
SEGUIR:
- Botao "Seguir" no perfil do vendedor
- Nao pode seguir a si mesmo

BENEFICIOS:
- Feed prioriza produtos de quem voce segue
- Notificacao quando publica produto novo

VER:
Perfil -> Seguidores (quem te segue)
Perfil -> Seguindo (quem voce segue)
```

### 5. Notificacoes

| Tipo | Quando | Mensagem Exemplo |
|------|--------|------------------|
| `message` | Nova mensagem | "Maria enviou uma mensagem" |
| `follow` | Novo seguidor | "Joao comecou a seguir voce" |
| `sale` | Venda confirmada | "Voce vendeu Vestido Floral!" |
| `order` | Compra confirmada | "Seu pedido foi confirmado" |
| `shipping` | Produto enviado | "Seu pedido foi enviado! Rastreio: XX123" |
| `delivered` | Produto entregue | "Seu pedido foi entregue" |
| `review` | Nova avaliacao | "Maria avaliou voce com 5 estrelas" |
| `subscription_expiring` | 3 dias antes | "Seu Premium expira em 3 dias" |
| `subscription_expired` | Expirou | "Seu Premium expirou" |

---

## Politicas

### Termos de Uso

**1. Aceitacao dos Termos**
Ao acessar e usar o aplicativo Apega Desapega, voce concorda com estes termos de uso. Se voce nao concordar com algum termo, nao utilize nossos servicos.

**2. Cadastro e Conta**
Para utilizar nossos servicos, voce deve criar uma conta com informacoes verdadeiras e atualizadas. Voce e responsavel por manter a confidencialidade de sua senha e por todas as atividades realizadas em sua conta.

**3. Uso da Plataforma**
O Apega Desapega e uma plataforma de marketplace para compra e venda de itens usados e seminovos. E proibido anunciar produtos falsificados, ilegais, roubados ou que violem direitos de terceiros.

**4. Responsabilidades**
Os vendedores sao responsaveis pela veracidade das informacoes dos produtos anunciados. Os compradores devem verificar as informacoes antes de confirmar a compra. A plataforma nao se responsabiliza por disputas entre usuarios.

**5. Taxas e Comissoes**
A plataforma cobra uma taxa de 20% sobre o valor das vendas para usuarios gratuitos e 10% para usuarios Premium. As taxas sao deduzidas automaticamente do valor recebido pelo vendedor.

**6. Propriedade Intelectual**
Todo o conteudo do aplicativo, incluindo marca, logo e design, sao propriedade do Apega Desapega e protegidos por leis de propriedade intelectual.

---

### Politica de Privacidade

**1. Coleta de Dados**
Coletamos informacoes que voce fornece diretamente, como nome, e-mail, telefone, endereco e dados de pagamento. Tambem coletamos dados de uso do aplicativo para melhorar nossos servicos.

**2. Uso das Informacoes**
Utilizamos seus dados para: processar transacoes, enviar comunicacoes sobre pedidos, melhorar nossos servicos, prevenir fraudes e cumprir obrigacoes legais.

**3. Compartilhamento**
Compartilhamos dados apenas com: parceiros de pagamento e envio para processar transacoes, quando exigido por lei, e com seu consentimento expresso. Nunca vendemos seus dados.

**4. Seguranca**
Implementamos medidas de seguranca tecnicas e organizacionais para proteger seus dados, incluindo criptografia, controle de acesso e monitoramento continuo.

**5. Seus Direitos (LGPD)**
Voce tem direito a: acessar seus dados, corrigir informacoes incorretas, solicitar exclusao de dados, revogar consentimento e portabilidade de dados.

**6. Cookies**
Utilizamos cookies e tecnologias similares para melhorar sua experiencia, analisar o uso do aplicativo e personalizar conteudo.

---

### Politica de Envio

**1. Opcoes de Envio**
Oferecemos envio pelos Correios (PAC, SEDEX) e transportadoras parceiras. O prazo e valor do frete sao calculados com base no CEP de destino e dimensoes do produto.

**2. Prazo de Postagem**
O vendedor tem ate 3 dias uteis apos a confirmacao do pagamento para postar o produto. O nao cumprimento pode resultar em penalidades ou cancelamento do pedido.

**3. Rastreamento**
Todos os envios incluem codigo de rastreamento. O status pode ser acompanhado diretamente no aplicativo na secao "Meus Pedidos".

**4. Problemas de Entrega**
Em caso de extravio, dano durante o transporte ou atraso significativo, entre em contato conosco. Analisaremos o caso e tomaremos as medidas cabiveis.

**5. Embalagem**
O vendedor e responsavel por embalar o produto de forma adequada para evitar danos durante o transporte. Recomendamos uso de caixas resistentes e material de protecao.

---

### Politica de Reembolso

**1. Direito de Arrependimento**
Conforme o Codigo de Defesa do Consumidor, voce pode desistir da compra em ate 7 dias apos o recebimento do produto, sem necessidade de justificativa.

**2. Condicoes para Reembolso**
O produto deve ser devolvido em sua condicao original, sem sinais de uso alem do necessario para verificacao. A embalagem original, etiquetas e acessorios devem estar inclusos.

**3. Processo de Reembolso**
Apos aprovacao da devolucao, o reembolso sera processado em ate 10 dias uteis. O valor sera creditado na mesma forma de pagamento utilizada na compra.

**4. Custos de Devolucao**
Em caso de arrependimento, o comprador arca com os custos de envio da devolucao. Se o produto apresentar defeito ou divergencia, os custos sao do vendedor.

**5. Reembolso Parcial**
Podemos oferecer reembolso parcial em casos especificos, como pequenas divergencias que nao impecam o uso do produto, mediante acordo entre as partes.

---

### Politica de Troca e Devolucao

**1. Quando Solicitar Troca**
Voce pode solicitar troca quando: o produto apresentar defeito nao informado, o tamanho divergir do anunciado, ou o produto recebido for diferente do anunciado.

**2. Prazo para Solicitacao**
A solicitacao de troca ou devolucao deve ser feita em ate 7 dias apos o recebimento do produto atraves da secao "Meus Pedidos" no aplicativo.

**3. Analise do Pedido**
Nossa equipe analisara a solicitacao em ate 2 dias uteis. Podemos solicitar fotos ou informacoes adicionais para avaliar o caso.

**4. Envio do Produto**
Apos aprovacao, voce recebera as instrucoes para envio do produto. Use uma embalagem adequada para proteger o item durante o transporte.

**5. Produtos Nao Elegiveis**
Nao aceitamos troca/devolucao de: produtos de higiene pessoal, roupas intimas, produtos personalizados, ou itens danificados pelo comprador.

**6. Disputa entre Usuarios**
Em caso de desacordo entre comprador e vendedor, nossa equipe de suporte mediara a situacao buscando uma solucao justa para ambas as partes.

---

## APIs do Backend

### Base URL
```
Producao: https://apega-desapega-production.up.railway.app/api
```

### Autenticacao
```
Header: Authorization: Bearer <token_jwt>
Token expira em: 7 dias
```

### Rotas Principais

| Categoria | Metodo | Rota | Descricao |
|-----------|--------|------|-----------|
| **Auth** | POST | /auth/register | Criar conta |
| | POST | /auth/login | Login |
| | GET | /auth/me | Dados do usuario logado |
| | PUT | /auth/profile | Atualizar perfil |
| **Products** | GET | /products | Listar produtos |
| | POST | /products | Criar produto |
| | GET | /products/:id | Detalhes |
| | PUT | /products/:id | Atualizar |
| | DELETE | /products/:id | Excluir |
| **Orders** | GET | /orders/purchases | Minhas compras |
| | GET | /orders/sales | Minhas vendas |
| | POST | /orders | Criar pedido |
| | PATCH | /orders/:id/status | Atualizar status |
| **Chat** | GET | /messages/conversations | Listar conversas |
| | POST | /messages/conversations | Criar conversa |
| | GET | /messages/conversations/:id/messages | Mensagens |
| | POST | /messages/conversations/:id/messages | Enviar |
| **Users** | GET | /users/:id | Perfil publico |
| | POST | /users/:id/follow | Seguir |
| | DELETE | /users/:id/follow | Deixar de seguir |
| **Favorites** | GET | /favorites | Meus favoritos |
| | POST | /favorites/:product_id | Favoritar |
| | DELETE | /favorites/:product_id | Desfavoritar |
| **Payments** | POST | /payments/withdraw | Solicitar saque |
| | GET | /payments/transactions | Historico |
| | GET | /payments/balance | Saldo |
| **Subscriptions** | GET | /subscriptions/plans | Ver planos |
| | GET | /subscriptions/status | Status atual |
| | POST | /subscriptions/pix | Assinar via PIX |
| | POST | /subscriptions/boleto | Assinar via Boleto |
| | POST | /subscriptions/cancel | Cancelar |
| **AI** | POST | /ai/analyze | Analisar roupa |
| | POST | /ai/remove-background | Remover fundo |
| | POST | /ai/enhance-image | Melhorar imagem |
| **Admin** | GET | /admin/dashboard | Metricas |
| | GET | /admin/users | Listar usuarios |
| | GET | /admin/products | Listar produtos |
| | GET | /admin/orders | Listar pedidos |
| | GET | /admin/withdrawals | Listar saques |
| | PATCH | /admin/withdrawals/:id | Aprovar/rejeitar |

---

## Banco de Dados

### Tabelas Principais

| Tabela | Descricao | Campos Chave |
|--------|-----------|--------------|
| **users** | Usuarios | id, email, name, balance, subscription_type |
| **products** | Produtos | id, seller_id, title, price, status |
| **product_images** | Imagens | id, product_id, url, position |
| **orders** | Pedidos | id, buyer_id, seller_id, status, total |
| **reviews** | Avaliacoes | id, order_id, rating, comment |
| **favorites** | Favoritos | user_id, product_id |
| **followers** | Seguidores | follower_id, following_id |
| **conversations** | Conversas | id, user1_id, user2_id, product_id |
| **messages** | Mensagens | id, conversation_id, sender_id, content |
| **transactions** | Transacoes | id, user_id, type, amount |
| **withdrawals** | Saques | id, user_id, amount, status |
| **subscriptions** | Assinaturas | id, user_id, plan, expires_at |
| **cart_items** | Carrinho | user_id, product_id |
| **notifications** | Notificacoes | id, user_id, type, message |
| **categories** | Categorias | id, name, slug, icon |
| **addresses** | Enderecos | id, user_id, cep, street |
| **analytics_events** | Eventos | id, event_type, user_id, data |

---

## Deploy e Atualizacoes

### Backend (Railway)

```bash
# 1. Editar railway.json para BACKEND:
{
  "build": { "buildCommand": "cd apega-backend && npm install" },
  "deploy": { "startCommand": "cd apega-backend && node src/server.js" }
}

# 2. Commit e push
git add .
git commit -m "fix: descricao da alteracao"
git push backend master

# 3. Railway detecta e faz deploy automatico (~2-3 min)
```

### Admin (Railway)

```bash
# 1. Editar railway.json para ADMIN:
{
  "build": { "buildCommand": "cd apega-admin && npm install && npm run build" },
  "deploy": { "startCommand": "cd apega-admin && node server.js" }
}

# 2. Commit e push
git add .
git commit -m "fix: descricao da alteracao"
git push origin master

# 3. Railway detecta e faz deploy automatico (~3-5 min)
```

### Mobile (Google Play)

```bash
# 1. Aumentar versionCode no app.json
"versionCode": 3  # incrementar sempre

# 2. Build de producao
cd apega-mobile
eas build --platform android --profile production

# 3. Aguardar build (~15-20 min)
# 4. Baixar AAB do Expo (link no terminal)

# 5. Google Play Console:
#    - Producao -> Criar nova versao
#    - Upload do AAB
#    - Preencher notas da versao
#    - Enviar para revisao

# 6. Aguardar aprovacao (1-7 dias)
```

---

## Simulacoes Financeiras

### Cenario de Crescimento de Usuarios

```
+------------------------------------------------------------------+
|                    PROJECAO DE USUARIOS                          |
+------------------------------------------------------------------+
|  Mes  | Novos   | Total   | Ativos  | Premium | Conv. Premium    |
+------------------------------------------------------------------+
|   1   |   500   |    500  |   400   |    10   |   2.0%           |
|   2   | 1.000   |  1.500  | 1.200   |    36   |   3.0%           |
|   3   | 2.000   |  3.500  | 2.800   |   112   |   4.0%           |
|   4   | 3.000   |  6.500  | 5.200   |   260   |   5.0%           |
|   5   | 4.000   | 10.500  | 8.400   |   504   |   6.0%           |
|   6   | 5.000   | 15.500  | 12.400  |   868   |   7.0%           |
|   7   | 6.000   | 21.500  | 17.200  | 1.376   |   8.0%           |
|   8   | 7.000   | 28.500  | 22.800  | 2.052   |   9.0%           |
|   9   | 8.000   | 36.500  | 29.200  | 2.920   |  10.0%           |
|  10   | 9.000   | 45.500  | 36.400  | 3.640   |  10.0%           |
|  11   | 10.000  | 55.500  | 44.400  | 4.440   |  10.0%           |
|  12   | 12.000  | 67.500  | 54.000  | 5.400   |  10.0%           |
+------------------------------------------------------------------+
| Premissas:                                                       |
| - 80% dos usuarios permanecem ativos                             |
| - Taxa de conversao Premium cresce de 2% a 10%                   |
| - Crescimento organico via indicacao e ASO                       |
+------------------------------------------------------------------+
```

### Projecao de Receita - Assinaturas Premium

```
+------------------------------------------------------------------+
|                 RECEITA DE ASSINATURAS                           |
+------------------------------------------------------------------+
|  Mes  | Premium | Mensal    | Anual     | Receita Total          |
|       | Ativos  | (70%)     | (30%)     | (R$)                   |
+------------------------------------------------------------------+
|   1   |    10   |     7     |     3     |      139 + 600 = 739   |
|   2   |    36   |    25     |    11     |      498 + 2.199 = 2.697|
|   3   |   112   |    78     |    34     |    1.552 + 6.797 = 8.349|
|   4   |   260   |   182     |    78     |    3.622 + 15.592 = 19.214|
|   5   |   504   |   353     |   151     |    7.025 + 30.169 = 37.194|
|   6   |   868   |   608     |   260     |   12.099 + 51.974 = 64.073|
|   7   | 1.376   |   963     |   413     |   19.163 + 82.532 = 101.695|
|   8   | 2.052   | 1.436     |   616     |   28.576 + 123.083 = 151.659|
|   9   | 2.920   | 2.044     |   876     |   40.676 + 175.087 = 215.763|
|  10   | 3.640   | 2.548     | 1.092     |   50.705 + 218.240 = 268.945|
|  11   | 4.440   | 3.108     | 1.332     |   61.849 + 266.287 = 328.136|
|  12   | 5.400   | 3.780     | 1.620     |   75.222 + 323.838 = 399.060|
+------------------------------------------------------------------+
| TOTAL ANO 1: R$ 1.597.525 em assinaturas                         |
+------------------------------------------------------------------+
| Premissas:                                                       |
| - 70% escolhem mensal (R$ 19,90)                                 |
| - 30% escolhem anual (R$ 199,90)                                 |
| - Churn mensal de 5% (retido no calculo)                         |
+------------------------------------------------------------------+
```

### Projecao de Receita - Comissoes sobre Vendas

```
+------------------------------------------------------------------+
|                   RECEITA DE COMISSOES                           |
+------------------------------------------------------------------+
|  Mes  | Vendas  | Ticket   | GMV Total | Comissao | Receita      |
|       | /mes    | Medio    | (R$)      | Media    | (R$)         |
+------------------------------------------------------------------+
|   1   |    50   |   R$ 60  |    3.000  |   18%    |      540     |
|   2   |   150   |   R$ 60  |    9.000  |   17%    |    1.530     |
|   3   |   400   |   R$ 65  |   26.000  |   16%    |    4.160     |
|   4   |   800   |   R$ 65  |   52.000  |   15%    |    7.800     |
|   5   | 1.500   |   R$ 70  |  105.000  |   14%    |   14.700     |
|   6   | 2.500   |   R$ 70  |  175.000  |   14%    |   24.500     |
|   7   | 4.000   |   R$ 75  |  300.000  |   13%    |   39.000     |
|   8   | 6.000   |   R$ 75  |  450.000  |   13%    |   58.500     |
|   9   | 8.500   |   R$ 80  |  680.000  |   12%    |   81.600     |
|  10   | 11.000  |   R$ 80  |  880.000  |   12%    |  105.600     |
|  11   | 14.000  |   R$ 85  | 1.190.000 |   12%    |  142.800     |
|  12   | 18.000  |   R$ 85  | 1.530.000 |   12%    |  183.600     |
+------------------------------------------------------------------+
| TOTAL ANO 1: R$ 664.330 em comissoes                             |
| GMV TOTAL ANO 1: R$ 5.400.000                                    |
+------------------------------------------------------------------+
| Premissas:                                                       |
| - Comissao media cai conforme mais usuarios viram Premium        |
| - Ticket medio cresce com maturidade do marketplace              |
| - ~30% dos usuarios ativos vendem pelo menos 1 produto/mes       |
+------------------------------------------------------------------+
```

### Projecao de Receita - Google AdMob

```
+------------------------------------------------------------------+
|                   RECEITA DE ANUNCIOS (AdMob)                    |
+------------------------------------------------------------------+
|  Mes  | MAU     | DAU     | Sessoes  | Impressoes | eCPM   | Receita|
|       | (ativos)| (30%)   | /dia     | /dia       | (R$)   | (R$)   |
+------------------------------------------------------------------+
|   1   |   400   |   120   |   360    |    1.080   |  8,00  |   259  |
|   2   | 1.200   |   360   | 1.080    |    3.240   |  8,00  |   778  |
|   3   | 2.800   |   840   | 2.520    |    7.560   |  9,00  | 2.041  |
|   4   | 5.200   | 1.560   | 4.680    |   14.040   |  9,00  | 3.791  |
|   5   | 8.400   | 2.520   | 7.560    |   22.680   | 10,00  | 6.804  |
|   6   | 12.400  | 3.720   | 11.160   |   33.480   | 10,00  | 10.044 |
|   7   | 17.200  | 5.160   | 15.480   |   46.440   | 11,00  | 15.325 |
|   8   | 22.800  | 6.840   | 20.520   |   61.560   | 11,00  | 20.315 |
|   9   | 29.200  | 8.760   | 26.280   |   78.840   | 12,00  | 28.382 |
|  10   | 36.400  | 10.920  | 32.760   |   98.280   | 12,00  | 35.381 |
|  11   | 44.400  | 13.320  | 39.960   |  119.880   | 13,00  | 46.753 |
|  12   | 54.000  | 16.200  | 48.600   |  145.800   | 13,00  | 56.862 |
+------------------------------------------------------------------+
| TOTAL ANO 1: R$ 226.735 em anuncios                              |
+------------------------------------------------------------------+
| Premissas:                                                       |
| - 30% dos MAU sao DAU (usuarios diarios)                         |
| - 3 sessoes por usuario por dia (media)                          |
| - 3 impressoes de anuncio por sessao                             |
| - eCPM cresce de R$ 8 a R$ 13 com otimizacao                     |
| - Usuarios Premium NAO veem anuncios (excluidos do calculo)      |
| - Banner ads no feed + Interstitial apos compra                  |
+------------------------------------------------------------------+
```

### Resumo Financeiro - Ano 1

```
+------------------------------------------------------------------+
|                    RESUMO FINANCEIRO ANO 1                       |
+------------------------------------------------------------------+
|                                                                   |
|  RECEITAS:                                                       |
|  +------------------------------------------------------------+  |
|  | Assinaturas Premium    | R$ 1.597.525  |  64.1%            |  |
|  | Comissoes sobre Vendas | R$   664.330  |  26.7%            |  |
|  | Anuncios Google AdMob  | R$   226.735  |   9.1%            |  |
|  +------------------------------------------------------------+  |
|  | RECEITA BRUTA TOTAL    | R$ 2.488.590  | 100.0%            |  |
|  +------------------------------------------------------------+  |
|                                                                   |
|  CUSTOS ESTIMADOS:                                               |
|  +------------------------------------------------------------+  |
|  | Infraestrutura (Railway, Neon, Cloudinary)                 |  |
|  |   - Railway: ~R$ 200/mes = R$ 2.400                        |  |
|  |   - Neon DB: ~R$ 100/mes = R$ 1.200                        |  |
|  |   - Cloudinary: ~R$ 300/mes = R$ 3.600                     |  |
|  | Subtotal Infra: R$ 7.200                                   |  |
|  +------------------------------------------------------------+  |
|  | APIs (Claude, Mercado Pago)                                |  |
|  |   - Claude AI: ~R$ 0,015/analise x 50.000 = R$ 750        |  |
|  |   - Mercado Pago: 0,5% do GMV = R$ 27.000                 |  |
|  | Subtotal APIs: R$ 27.750                                   |  |
|  +------------------------------------------------------------+  |
|  | Marketing (opcional)                                       |  |
|  |   - ASO e organico inicial: R$ 5.000                      |  |
|  |   - Ads pagos (se necessario): R$ 20.000                  |  |
|  | Subtotal Marketing: R$ 25.000                              |  |
|  +------------------------------------------------------------+  |
|  | CUSTO TOTAL ESTIMADO   | R$ 59.950                        |  |
|  +------------------------------------------------------------+  |
|                                                                   |
|  +------------------------------------------------------------+  |
|  | LUCRO BRUTO ANO 1      | R$ 2.428.640                     |  |
|  | Margem                 | 97.6%                            |  |
|  +------------------------------------------------------------+  |
|                                                                   |
+------------------------------------------------------------------+
```

### Projecao Mensal Consolidada

```
+------------------------------------------------------------------+
|                  RECEITA MENSAL CONSOLIDADA                      |
+------------------------------------------------------------------+
|  Mes  | Assinaturas | Comissoes | Anuncios | TOTAL      | Acum.  |
+------------------------------------------------------------------+
|   1   |      739    |     540   |    259   |   1.538    |    1.5K|
|   2   |    2.697    |   1.530   |    778   |   5.005    |    6.5K|
|   3   |    8.349    |   4.160   |  2.041   |  14.550    |   21.1K|
|   4   |   19.214    |   7.800   |  3.791   |  30.805    |   51.9K|
|   5   |   37.194    |  14.700   |  6.804   |  58.698    |  110.6K|
|   6   |   64.073    |  24.500   | 10.044   |  98.617    |  209.2K|
|   7   |  101.695    |  39.000   | 15.325   | 156.020    |  365.2K|
|   8   |  151.659    |  58.500   | 20.315   | 230.474    |  595.7K|
|   9   |  215.763    |  81.600   | 28.382   | 325.745    |  921.5K|
|  10   |  268.945    | 105.600   | 35.381   | 409.926    | 1.331.4K|
|  11   |  328.136    | 142.800   | 46.753   | 517.689    | 1.849.1K|
|  12   |  399.060    | 183.600   | 56.862   | 639.522    | 2.488.6K|
+------------------------------------------------------------------+
| Break-even estimado: Mes 3-4 (custos ~R$ 5.000/mes)              |
+------------------------------------------------------------------+
```

### Cenarios Alternativos

```
+------------------------------------------------------------------+
|                    CENARIOS DE CRESCIMENTO                       |
+------------------------------------------------------------------+

CENARIO CONSERVADOR (50% das metas):
+------------------------------------------------------------------+
| Usuarios Ano 1: 33.750                                           |
| Premium: 2.700 (8%)                                              |
| Receita Total: R$ 1.244.295                                      |
| Lucro: R$ 1.184.345                                              |
+------------------------------------------------------------------+

CENARIO OTIMISTA (150% das metas):
+------------------------------------------------------------------+
| Usuarios Ano 1: 101.250                                          |
| Premium: 10.125 (10%)                                            |
| Receita Total: R$ 3.732.885                                      |
| Lucro: R$ 3.652.935                                              |
+------------------------------------------------------------------+

CENARIO AGRESSIVO (com investimento em marketing):
+------------------------------------------------------------------+
| Investimento Marketing: R$ 100.000                               |
| CAC esperado: R$ 5,00                                            |
| Usuarios adicionais: 20.000                                      |
| Usuarios Ano 1: 87.500                                           |
| Premium: 8.750 (10%)                                             |
| Receita Total: R$ 3.200.000                                      |
| Lucro: R$ 3.040.050                                              |
+------------------------------------------------------------------+
```

### KPIs para Monitorar

```
+------------------------------------------------------------------+
|                       KPIs PRINCIPAIS                            |
+------------------------------------------------------------------+
| Metrica              | Meta Mes 6  | Meta Mes 12  | Como Medir   |
+------------------------------------------------------------------+
| MAU (usuarios ativos)| 12.400      | 54.000       | Analytics    |
| DAU/MAU ratio        | 30%         | 30%          | Analytics    |
| Taxa conversao Premium | 7%        | 10%          | Dashboard    |
| Churn Premium mensal | < 5%        | < 3%         | Dashboard    |
| Ticket medio         | R$ 70       | R$ 85        | Orders       |
| GMV mensal           | R$ 175K     | R$ 1.53M     | Orders       |
| ARPU (receita/user)  | R$ 7,95     | R$ 11,84     | Calculado    |
| LTV estimado         | R$ 95       | R$ 142       | Calculado    |
| CAC (organico)       | R$ 0        | R$ 0         | Marketing    |
| NPS (satisfacao)     | > 40        | > 50         | Pesquisa     |
+------------------------------------------------------------------+
```

---

## URLs Importantes

| Recurso | URL |
|---------|-----|
| API | https://apega-desapega-production.up.railway.app/api |
| Admin | https://apega-admin-production.up.railway.app |
| Privacidade | https://apega-desapega-production.up.railway.app/privacy-policy.html |
| Exclusao Conta | https://apega-desapega-production.up.railway.app/delete-account.html |

---

## Conta de Teste Google

```
Email: googletest@apegadesapega.com
Senha: GoogleTest2025!
```

---

## Estrutura de Custos Operacionais

### Custos Fixos Mensais (Operação Remota)

```
+------------------------------------------------------------------+
|              CUSTOS FIXOS MENSAIS - FREELANCERS                   |
+------------------------------------------------------------------+
|                                                                   |
| EQUIPE (remoto, sem CLT, PJ ou MEI):                             |
| +------------------------------------------------------------+   |
| | Função                | Horas/mês | Valor/hora | Total     |   |
| +------------------------------------------------------------+   |
| | Desenvolvedor (PJ)    | 40h       | R$ 80      | R$ 3.200  |   |
| | Suporte/Atendimento   | 60h       | R$ 30      | R$ 1.800  |   |
| | Marketing Digital     | 30h       | R$ 60      | R$ 1.800  |   |
| +------------------------------------------------------------+   |
| | Subtotal Equipe       |           |            | R$ 6.800  |   |
| +------------------------------------------------------------+   |
|                                                                   |
| ADMINISTRATIVO:                                                  |
| +------------------------------------------------------------+   |
| | Item                         | Valor Mensal               |   |
| +------------------------------------------------------------+   |
| | Contador (escritório)        | R$ 500                     |   |
| | Certificado Digital          | R$ 25 (~R$300/ano)         |   |
| | Domínio + DNS                | R$ 25 (~R$300/ano)         |   |
| +------------------------------------------------------------+   |
| | Subtotal Admin               | R$ 550                     |   |
| +------------------------------------------------------------+   |
|                                                                   |
| INFRAESTRUTURA TECH:                                             |
| +------------------------------------------------------------+   |
| | Item                         | Valor Mensal               |   |
| +------------------------------------------------------------+   |
| | Railway (backend)            | R$ 100 (~$20 USD)          |   |
| | Cloudinary (imagens)         | R$ 0 (free tier)           |   |
| | Claude API (IA)              | R$ 150 (~$30 USD)          |   |
| | Melhor Envio API             | R$ 0 (por transação)       |   |
| | Mercado Pago                 | R$ 0 (% por transação)     |   |
| | Firebase/Push                | R$ 0 (free tier)           |   |
| +------------------------------------------------------------+   |
| | Subtotal Infra               | R$ 250                     |   |
| +------------------------------------------------------------+   |
|                                                                   |
| HARDWARE (depreciação 36 meses):                                 |
| +------------------------------------------------------------+   |
| | Item                  | Valor Total | Mensal (deprec.)     |   |
| +------------------------------------------------------------+   |
| | Notebook dev/admin    | R$ 4.500    | R$ 125               |   |
| | Celular teste         | R$ 1.800    | R$ 50                |   |
| +------------------------------------------------------------+   |
| | Subtotal Hardware     |             | R$ 175               |   |
| +------------------------------------------------------------+   |
|                                                                   |
| +------------------------------------------------------------+   |
| | TOTAL CUSTOS FIXOS MENSAIS         | R$ 7.775              |   |
| +------------------------------------------------------------+   |
|                                                                   |
+------------------------------------------------------------------+
```

### Custos Variáveis (por transação)

```
+------------------------------------------------------------------+
|                    CUSTOS VARIÁVEIS                               |
+------------------------------------------------------------------+
|                                                                   |
| POR TRANSAÇÃO DE VENDA:                                          |
| +------------------------------------------------------------+   |
| | Item                         | Percentual                  |   |
| +------------------------------------------------------------+   |
| | Mercado Pago (gateway)       | 4,99% do total              |   |
| | Melhor Envio (label)         | R$ 0,50 por etiqueta        |   |
| +------------------------------------------------------------+   |
|                                                                   |
| EXEMPLO - Venda de R$ 125 (produto R$100 + taxa 25%):            |
| +------------------------------------------------------------+   |
| | Receita plataforma           | R$ 25,00                    |   |
| | Taxa Mercado Pago (4,99%)    | -R$ 6,24 (sobre R$125)      |   |
| | Etiqueta Melhor Envio        | -R$ 0,50                    |   |
| | Impostos (16,33%)            | -R$ 4,08 (sobre R$25)       |   |
| +------------------------------------------------------------+   |
| | Lucro líquido por venda      | R$ 14,18                    |   |
| | Margem líquida               | 56,7%                       |   |
| +------------------------------------------------------------+   |
|                                                                   |
+------------------------------------------------------------------+
```

### DRE Projetado (Mensal - Após 12 meses)

```
+------------------------------------------------------------------+
|            DRE MENSAL PROJETADO (MÊS 12)                          |
+------------------------------------------------------------------+
|                                                                   |
| Premissas:                                                       |
| - 50.000 usuários ativos                                         |
| - 5.000 vendas/mês (ticket médio R$ 80)                          |
| - 10% usuários premium (5.000 assinantes)                        |
| - Taxa média ponderada: 18% (mix free 25% + premium 12%)         |
|                                                                   |
| RECEITAS:                                                        |
| +------------------------------------------------------------+   |
| | Fonte                        | Cálculo         | Valor     |   |
| +------------------------------------------------------------+   |
| | Comissões vendas             | 5K x R$80 x 18% | R$ 72.000 |   |
| | Assinaturas Premium          | 5K x R$19,90    | R$ 99.500 |   |
| | AdMob (ads)                  | 50K x R$0,10    | R$ 5.000  |   |
| +------------------------------------------------------------+   |
| | RECEITA BRUTA                |                 | R$176.500 |   |
| +------------------------------------------------------------+   |
|                                                                   |
| DEDUÇÕES:                                                        |
| +------------------------------------------------------------+   |
| | Impostos (16,33%)            |                 | -R$28.830 |   |
| | Taxa Mercado Pago            |                 | -R$20.000 |   |
| | Etiquetas Melhor Envio       | 5K x R$0,50     | -R$ 2.500 |   |
| +------------------------------------------------------------+   |
| | RECEITA LÍQUIDA              |                 | R$125.170 |   |
| +------------------------------------------------------------+   |
|                                                                   |
| CUSTOS FIXOS:                                                    |
| +------------------------------------------------------------+   |
| | Equipe freelancer            |                 | -R$ 6.800 |   |
| | Administrativo               |                 | -R$   550 |   |
| | Infraestrutura               |                 | -R$   250 |   |
| | Hardware (deprec.)           |                 | -R$   175 |   |
| | Marketing extra              |                 | -R$ 5.000 |   |
| +------------------------------------------------------------+   |
| | TOTAL CUSTOS                 |                 | -R$12.775 |   |
| +------------------------------------------------------------+   |
|                                                                   |
| +------------------------------------------------------------+   |
| | LUCRO OPERACIONAL (EBITDA)   |                 | R$112.395 |   |
| | Margem EBITDA                |                 | 63,7%     |   |
| +------------------------------------------------------------+   |
|                                                                   |
+------------------------------------------------------------------+
```

### Breakeven Analysis

```
+------------------------------------------------------------------+
|                    PONTO DE EQUILÍBRIO                           |
+------------------------------------------------------------------+
|                                                                   |
| Custos fixos mensais: R$ 7.775                                   |
| Lucro líquido por venda (média): R$ 14                           |
|                                                                   |
| BREAKEVEN VENDAS = R$ 7.775 / R$ 14 = ~555 vendas/mês            |
|                                                                   |
| COM ASSINATURAS:                                                 |
| Se tiver 100 assinantes premium:                                 |
| Receita assinaturas: 100 x R$ 19,90 = R$ 1.990                   |
| Custos restantes: R$ 7.775 - R$ 1.990 = R$ 5.785                 |
| Breakeven: R$ 5.785 / R$ 14 = ~413 vendas/mês                    |
|                                                                   |
| CENÁRIOS DE BREAKEVEN:                                           |
| +------------------------------------------------------------+   |
| | Premium Assinantes | Vendas Necessárias | Usuários Estimados|   |
| +------------------------------------------------------------+   |
| | 0                  | 555 vendas         | ~2.800 usuários   |   |
| | 100                | 413 vendas         | ~2.100 usuários   |   |
| | 500                | 0 vendas           | ~5.000 usuários   |   |
| +------------------------------------------------------------+   |
|                                                                   |
| Com 500 assinantes premium, os custos fixos são cobertos        |
| apenas pelas assinaturas!                                        |
|                                                                   |
+------------------------------------------------------------------+
```

---

## Valuation - Quanto Vale o Negócio

### Visão Geral dos Ativos

```
+------------------------------------------------------------------+
|                    ATIVOS DO NEGÓCIO                              |
+------------------------------------------------------------------+
|                                                                   |
|  ATIVOS TANGÍVEIS:                                               |
|  +------------------------------------------------------------+  |
|  | Loja Física        | 10 anos de operação                   |  |
|  | Patrimônio Loja    | R$ 850.000 (móveis, estrutura, ponto) |  |
|  | Faturamento Mensal | R$ 50.000                             |  |
|  | Faturamento Anual  | R$ 600.000                            |  |
|  | Estoque Comprado   | R$ 20.000 (peças próprias)            |  |
|  | Estoque Consignado | Peças de terceiros (variável)         |  |
|  +------------------------------------------------------------+  |
|                                                                   |
|  ATIVOS INTANGÍVEIS:                                             |
|  +------------------------------------------------------------+  |
|  | Marca              | "Brechó Apega Desapega" - 10 anos     |  |
|  |                    | (NÃO registrada no INPI)              |  |
|  | Instagram          | 19.000 seguidores                     |  |
|  | App Mobile         | MVP completo, publicado Google Play   |  |
|  |                    | 24 telas, 9 componentes               |  |
|  | Backend/Infraestr. | Sistema completo com IA               |  |
|  |                    | 145 endpoints, 20 rotas               |  |
|  | Admin Panel        | Dashboard de gestão                   |  |
|  | Base de Clientes   | 10 anos de relacionamento             |  |
|  +------------------------------------------------------------+  |
|                                                                   |
+------------------------------------------------------------------+
```

---

### Método 1: Múltiplo de Receita (Loja Física)

```
+------------------------------------------------------------------+
|              VALUATION - MÚLTIPLO DE RECEITA                     |
+------------------------------------------------------------------+
|                                                                   |
|  Faturamento Anual: R$ 600.000                                   |
|                                                                   |
|  Múltiplos típicos para varejo de moda:                          |
|  +------------------------------------------------------------+  |
|  | Múltiplo     | Tipo de Negócio        | Valor               |  |
|  +------------------------------------------------------------+  |
|  | 0.3x - 0.5x  | Varejo tradicional     | R$ 180K - R$ 300K   |  |
|  | 0.5x - 1.0x  | Varejo + marca forte   | R$ 300K - R$ 600K   |  |
|  | 1.0x - 2.0x  | Varejo + tech + marca  | R$ 600K - R$ 1.2M   |  |
|  +------------------------------------------------------------+  |
|                                                                   |
|  APLICAÇÃO (marca forte + tech):                                 |
|  Múltiplo recomendado: 1.5x                                      |
|  VALOR LOJA FÍSICA: R$ 900.000                                   |
|                                                                   |
+------------------------------------------------------------------+
```

---

### Método 2: Custo de Reposição (Tecnologia)

```
+------------------------------------------------------------------+
|           VALUATION - CUSTO DE REPOSIÇÃO DO APP                  |
+------------------------------------------------------------------+
|                                                                   |
|  Quanto custaria desenvolver tudo do zero?                       |
|                                                                   |
|  ESCOPO REAL DO PROJETO:                                         |
|  +------------------------------------------------------------+  |
|  | App Mobile     | 24 telas, 9 componentes reutilizáveis     |  |
|  | Backend        | 145 endpoints, 20 arquivos de rotas       |  |
|  | Admin Panel    | Dashboard completo de gestão              |  |
|  | Integrações    | Mercado Pago, Claude AI, Cloudinary,      |  |
|  |                | Melhor Envio                              |  |
|  +------------------------------------------------------------+  |
|                                                                   |
|  DESENVOLVIMENTO (R$ 150/hora - dev sênior freelancer):          |
|  +------------------------------------------------------------+  |
|  | Componente               | Detalhes       | Horas | Custo  |  |
|  +------------------------------------------------------------+  |
|  | App Mobile (RN + Expo)   | 24 telas       | 200h  | R$30K  |  |
|  |   - Telas complexas (6)  | ~12h cada      |       |        |  |
|  |   - Telas médias (10)    | ~8h cada       |       |        |  |
|  |   - Telas simples (8)    | ~5h cada       |       |        |  |
|  | Componentes (9)          | reutilizáveis  | 30h   | R$4.5K |  |
|  | Backend (Node.js)        | 145 endpoints  | 180h  | R$27K  |  |
|  |   - ~1.2h por endpoint   |                |       |        |  |
|  | Admin Panel (React)      | Dashboard      | 80h   | R$12K  |  |
|  | Integrações:             |                |       |        |  |
|  |   - Mercado Pago         | Pagamentos     | 20h   | R$3K   |  |
|  |   - Claude AI            | Análise roupas | 16h   | R$2.4K |  |
|  |   - Cloudinary           | Upload imgs    | 12h   | R$1.8K |  |
|  |   - Melhor Envio         | Frete/rastreio | 12h   | R$1.8K |  |
|  | Banco de Dados           | Schema + migr. | 30h   | R$4.5K |  |
|  | DevOps/Deploy            | Railway, EAS   | 24h   | R$3.6K |  |
|  | Testes/QA                | Básico         | 40h   | R$6K   |  |
|  | UI/UX Design             | Design system  | 50h   | R$7.5K |  |
|  +------------------------------------------------------------+  |
|  | SUBTOTAL DEV             |                | 694h  | R$104K |  |
|  +------------------------------------------------------------+  |
|                                                                   |
|  OUTROS CUSTOS:                                                  |
|  +------------------------------------------------------------+  |
|  | Conta desenvolvedor Google    | R$ 150 (única vez)        |  |
|  | Domínios                      | R$ 300                    |  |
|  | Infraestrutura setup inicial  | R$ 1.000                  |  |
|  +------------------------------------------------------------+  |
|  | SUBTOTAL OUTROS               | R$ 1.450                  |  |
|  +------------------------------------------------------------+  |
|                                                                   |
|  PRÊMIO POR APP FUNCIONAL (1.2x):                               |
|  (MVP testado, publicado na Play Store, pronto para escalar)    |
|                                                                   |
|  VALOR TECNOLOGIA: R$ 104.000 x 1.2 = R$ 124.800                |
|                                                                   |
+------------------------------------------------------------------+
```

---

### Método 3: Valor da Marca e Audiência

```
+------------------------------------------------------------------+
|            VALUATION - MARCA E AUDIÊNCIA                         |
+------------------------------------------------------------------+
|                                                                   |
|  VALOR DA MARCA (10 anos):                                       |
|  +------------------------------------------------------------+  |
|  | Fator                    | Valor                           |  |
|  +------------------------------------------------------------+  |
|  | Nome reconhecido         | Estabelecido há 10 anos         |  |
|  | Domínio web              | apegadesapega.com.br            |  |
|  | Confiança do mercado     | Histórico comprovado            |  |
|  | Posicionamento           | Brechó sustentável              |  |
|  | Registro INPI            | NÃO REGISTRADA (risco)          |  |
|  +------------------------------------------------------------+  |
|  | Custo para criar marca   | R$ 50.000 - R$ 100.000          |  |
|  | Tempo para estabelecer   | 5-10 anos                       |  |
|  | Desconto por não registro| -30% (risco jurídico)           |  |
|  | VALOR ESTIMADO MARCA     | R$ 105.000 (150K x 0.7)         |  |
|  +------------------------------------------------------------+  |
|                                                                   |
|  VALOR DA AUDIÊNCIA INSTAGRAM:                                   |
|  +------------------------------------------------------------+  |
|  | Seguidores               | 19.000                          |  |
|  | Valor por seguidor       | R$ 2 - R$ 5 (nicho moda)        |  |
|  | Engajamento estimado     | 3-5% (nicho)                    |  |
|  +------------------------------------------------------------+  |
|  | Cálculo conservador      | 19.000 x R$ 2 = R$ 38.000       |  |
|  | Cálculo otimista         | 19.000 x R$ 5 = R$ 95.000       |  |
|  | VALOR MÉDIO INSTAGRAM    | R$ 65.000                       |  |
|  +------------------------------------------------------------+  |
|                                                                   |
|  BASE DE CLIENTES DA LOJA:                                       |
|  +------------------------------------------------------------+  |
|  | Clientes estimados       | ~2.000 (10 anos, recorrentes)   |  |
|  | LTV médio cliente brechó | R$ 500/ano                      |  |
|  | Potencial conversão app  | 30%                             |  |
|  +------------------------------------------------------------+  |
|  | VALOR BASE CLIENTES      | 2.000 x 30% x R$ 500 = R$ 300K |  |
|  +------------------------------------------------------------+  |
|                                                                   |
|  TOTAL MARCA + AUDIÊNCIA: R$ 470.000                            |
|  (Marca R$105K + Instagram R$65K + Base Clientes R$300K)        |
|                                                                   |
+------------------------------------------------------------------+
```

---

### Método 4: DCF - Fluxo de Caixa Descontado (5 anos)

```
+------------------------------------------------------------------+
|         VALUATION - DCF (PROJEÇÃO 5 ANOS DO APP)                 |
+------------------------------------------------------------------+
|                                                                   |
|  Premissas:                                                      |
|  - Taxa de desconto: 25% (risco startup)                         |
|  - Crescimento conservador baseado nas projeções                 |
|  - Considera sinergia com loja física                            |
|                                                                   |
|  PROJEÇÃO DE LUCRO LÍQUIDO:                                      |
|  +------------------------------------------------------------+  |
|  | Ano | Receita App  | Custos    | Lucro     | VP (25%)       |  |
|  +------------------------------------------------------------+  |
|  | 1   | R$ 1.244K    | R$ 60K    | R$ 1.184K | R$ 947.200     |  |
|  | 2   | R$ 2.800K    | R$ 120K   | R$ 2.680K | R$ 1.715.200   |  |
|  | 3   | R$ 4.500K    | R$ 200K   | R$ 4.300K | R$ 2.201.600   |  |
|  | 4   | R$ 6.500K    | R$ 300K   | R$ 6.200K | R$ 2.540.800   |  |
|  | 5   | R$ 8.500K    | R$ 400K   | R$ 8.100K | R$ 2.654.208   |  |
|  +------------------------------------------------------------+  |
|  | TOTAL VP FLUXOS         |           | R$ 10.059.008      |  |
|  +------------------------------------------------------------+  |
|                                                                   |
|  Valor Terminal (perpetuidade com 3% crescimento):               |
|  VT = (8.100K x 1.03) / (0.25 - 0.03) = R$ 37.922.727           |
|  VP do VT = 37.922.727 / (1.25)^5 = R$ 12.425.574               |
|                                                                   |
|  +------------------------------------------------------------+  |
|  | VALOR DCF TOTAL (APP)   | R$ 22.484.582                   |  |
|  +------------------------------------------------------------+  |
|                                                                   |
|  AJUSTE PARA ESTÁGIO PRÉ-RECEITA (30% do valor):                |
|  (App ainda não tem usuários pagantes)                          |
|                                                                   |
|  +------------------------------------------------------------+  |
|  | VALOR DCF AJUSTADO      | R$ 6.745.374                    |  |
|  +------------------------------------------------------------+  |
|                                                                   |
+------------------------------------------------------------------+
```

---

### Método 5: Comparáveis de Mercado

```
+------------------------------------------------------------------+
|           VALUATION - MÚLTIPLOS DE MERCADO                       |
+------------------------------------------------------------------+
|                                                                   |
|  Marketplaces brasileiros de moda usada:                         |
|  +------------------------------------------------------------+  |
|  | Empresa      | Valuation   | GMV Anual  | Múltiplo GMV     |  |
|  +------------------------------------------------------------+  |
|  | Enjoei       | R$ 1.5B     | R$ 500M    | 3.0x             |  |
|  | Repassa      | R$ 200M     | R$ 80M     | 2.5x             |  |
|  | Troc         | R$ 50M      | R$ 25M     | 2.0x             |  |
|  +------------------------------------------------------------+  |
|  | Média múltiplo GMV: 2.5x                                    |  |
|  +------------------------------------------------------------+  |
|                                                                   |
|  APLICAÇÃO PARA APEGA DESAPEGA:                                  |
|  +------------------------------------------------------------+  |
|  | GMV projetado Ano 1      | R$ 5.400.000                    |  |
|  | GMV projetado Ano 2      | R$ 15.000.000                   |  |
|  | Múltiplo conservador     | 0.5x (pré-tração)               |  |
|  | Múltiplo otimista        | 1.5x (com marca + loja)         |  |
|  +------------------------------------------------------------+  |
|  | Valor conservador        | R$ 2.700.000                    |  |
|  | Valor otimista           | R$ 8.100.000                    |  |
|  | VALOR MÉDIO COMPARÁVEIS  | R$ 5.400.000                    |  |
|  +------------------------------------------------------------+  |
|                                                                   |
+------------------------------------------------------------------+
```

---

### Resumo do Valuation

```
+------------------------------------------------------------------+
|                    RESUMO DO VALUATION                           |
+------------------------------------------------------------------+
|                                                                   |
|  MÉTODOS UTILIZADOS:                                             |
|  +------------------------------------------------------------+  |
|  | Método                    | Valor                          |  |
|  +------------------------------------------------------------+  |
|  | 1. Múltiplo Receita Loja  | R$    900.000                  |  |
|  | 2. Custo Reposição Tech   | R$    124.800                  |  |
|  | 3. Marca + Audiência      | R$    470.000                  |  |
|  | 4. DCF Ajustado (App)     | R$  6.745.374                  |  |
|  | 5. Comparáveis Mercado    | R$  5.400.000                  |  |
|  +------------------------------------------------------------+  |
|                                                                   |
|  CÁLCULO DO VALOR JUSTO:                                         |
|  +------------------------------------------------------------+  |
|  | Componente               | Peso  | Valor Ponderado         |  |
|  +------------------------------------------------------------+  |
|  | Loja Física (certo)      | 100%  | R$    900.000           |  |
|  | Patrimônio Loja          | 100%  | R$    850.000           |  |
|  | Tecnologia (certo)       | 100%  | R$    124.800           |  |
|  | Marca + Audiência        | 100%  | R$    470.000           |  |
|  | Estoque comprado         | 100%  | R$     20.000           |  |
|  | Potencial App (DCF)      | 30%   | R$  2.023.612           |  |
|  +------------------------------------------------------------+  |
|  | SUBTOTAL                 |       | R$  4.388.412           |  |
|  +------------------------------------------------------------+  |
|                                                                   |
+------------------------------------------------------------------+

+==================================================================+
|                                                                   |
|                    VALUATION FINAL                               |
|                                                                   |
|  +------------------------------------------------------------+  |
|  |                                                            |  |
|  |   VALOR MÍNIMO (Floor):        R$ 2.500.000               |  |
|  |   (Loja + Patrimônio + Tech + Marca + Estoque)            |  |
|  |                                                            |  |
|  |   VALOR JUSTO (Fair Value):    R$ 4.400.000               |  |
|  |   (Todos os ativos ponderados)                            |  |
|  |                                                            |  |
|  |   VALOR MÁXIMO (Ceiling):      R$ 6.000.000               |  |
|  |   (Com potencial de crescimento)                          |  |
|  |                                                            |  |
|  +------------------------------------------------------------+  |
|                                                                   |
|  RANGE DE NEGOCIAÇÃO:  R$ 3.500.000 - R$ 5.500.000              |
|                                                                   |
+==================================================================+
```

---

### Justificativas do Valuation

```
+------------------------------------------------------------------+
|                 POR QUE VALE R$ 3.5M - R$ 5.5M                   |
+------------------------------------------------------------------+
|                                                                   |
|  PONTOS FORTES (justificam valor alto):                          |
|  +------------------------------------------------------------+  |
|  | + Marca estabelecida há 10 anos                            |  |
|  | + Fluxo de caixa positivo existente (R$ 50K/mês)           |  |
|  | + Base de clientes pronta para migrar                      |  |
|  | + Audiência engajada (19K seguidores)                      |  |
|  | + MVP completo e publicado na Play Store                   |  |
|  | + Tecnologia diferenciada (IA para precificação)           |  |
|  | + Três fontes de receita (comissão + assinatura + ads)     |  |
|  | + Mercado de segunda mão em crescimento (ESG)              |  |
|  | + Baixo CAC (migração de clientes existentes)              |  |
|  +------------------------------------------------------------+  |
|                                                                   |
|  PONTOS DE ATENÇÃO (justificam desconto):                        |
|  +------------------------------------------------------------+  |
|  | - Marca NÃO registrada no INPI (risco jurídico)            |  |
|  | - App ainda sem usuários/tração                            |  |
|  | - Mercado competitivo (Enjoei, Repassa)                    |  |
|  | - Dependência de aprovação Google Play                     |  |
|  | - Necessidade de investimento em marketing                 |  |
|  | - Risco de execução na escalabilidade                      |  |
|  +------------------------------------------------------------+  |
|                                                                   |
+------------------------------------------------------------------+
```

---

### Cenários de Venda/Investimento

```
+------------------------------------------------------------------+
|              CENÁRIOS DE NEGOCIAÇÃO                              |
+------------------------------------------------------------------+

CENÁRIO 1: VENDA TOTAL DO NEGÓCIO
+------------------------------------------------------------------+
| Inclui: Loja física + App + Marca + Instagram + Clientes         |
|         + Estoque comprado (R$ 20K)                              |
| Valor pedido: R$ 4.000.000                                       |
| Valor mínimo aceitável: R$ 2.500.000                             |
| Condições: 50% à vista + 50% em 12 meses                         |
+------------------------------------------------------------------+

CENÁRIO 2: VENDA APENAS DO APP + MARCA DIGITAL
+------------------------------------------------------------------+
| Inclui: App + Backend + Admin + Marca + Instagram                |
| Não inclui: Loja física, estoque e operação                      |
| Valor pedido: R$ 1.500.000                                       |
| Valor mínimo aceitável: R$ 800.000                               |
+------------------------------------------------------------------+

CENÁRIO 3: INVESTIMENTO (EQUITY)
+------------------------------------------------------------------+
| Captação desejada: R$ 300.000                                    |
| Valuation pré-money: R$ 2.500.000                                |
| Equity oferecido: 10.7% (300K / 2.8M)                            |
| Uso dos recursos:                                                |
|   - Marketing: R$ 120.000                                        |
|   - Time: R$ 100.000 (6 meses)                                   |
|   - Infraestrutura: R$ 50.000                                    |
|   - Reserva: R$ 30.000                                           |
+------------------------------------------------------------------+

CENÁRIO 4: SMART MONEY (Investidor Estratégico)
+------------------------------------------------------------------+
| Investidor ideal: Rede de brechós, marketplace moda              |
| Captação: R$ 500.000                                             |
| Valuation pré-money: R$ 3.000.000                                |
| Equity oferecido: 14.3%                                          |
| Benefícios esperados: Know-how + Escala + Sinergias              |
+------------------------------------------------------------------+
```

---

### Projeção de Valuation Futuro

```
+------------------------------------------------------------------+
|              PROJEÇÃO DE VALUATION (3 ANOS)                      |
+------------------------------------------------------------------+
|                                                                   |
|  Se atingir as metas projetadas:                                 |
|                                                                   |
|  +------------------------------------------------------------+  |
|  | Marco           | Métricas      | Valuation Esperado       |  |
|  +------------------------------------------------------------+  |
|  | HOJE            | MVP pronto    | R$ 2.0M - R$ 4.0M        |  |
|  | 6 meses         | 10K usuários  | R$ 4M - R$ 6M            |  |
|  | 12 meses        | 50K usuários  | R$ 8M - R$ 12M           |  |
|  |                 | R$ 200K MRR   |                          |  |
|  | 24 meses        | 150K usuários | R$ 25M - R$ 40M          |  |
|  |                 | R$ 500K MRR   |                          |  |
|  | 36 meses        | 300K usuários | R$ 50M - R$ 80M          |  |
|  |                 | R$ 1M MRR     |                          |  |
|  +------------------------------------------------------------+  |
|                                                                   |
|  Múltiplo típico para marketplace com tração:                    |
|  - Seed/Pré-Seed: 5-10x ARR                                      |
|  - Série A: 10-20x ARR                                           |
|  - Série B+: 15-30x ARR                                          |
|                                                                   |
+------------------------------------------------------------------+
```

---

## Contato

- Email: suporte@apegadesapega.com.br
- Email: contato@apegadesapega.com.br
