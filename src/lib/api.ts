import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'https://api.applargo.com.br/api'

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Sem console.log aqui: era uma linha por requisicao — incluindo a busca com
    // debounce do cabecalho — e ainda anunciava a presenca do token no console.
    const token = localStorage.getItem('admin_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

/** Limpa a sessao e manda para o login. Usada no 401. */
function dropSession() {
  localStorage.removeItem('admin_token')
  localStorage.removeItem('admin_user')
  if (window.location.pathname !== '/login') {
    // `replace` para o botao "voltar" nao devolver a tela vazia.
    window.location.replace('/login')
  }
}

// Response interceptor
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const status: number | undefined = error.response?.status

    // O token expira em 24 h e a sessao so era conferida na montagem do app.
    // Depois disso toda chamada falhava em silencio e o operador ficava olhando
    // telas vazias, achando que nao havia dados. Agora o 401 derruba a sessao.
    if (status === 401) {
      dropSession()
    }

    // O interceptor antigo rejeitava com `error.response.data` puro: um objeto
    // sem `status` e sem prototipo de Error, entao as paginas nao distinguiam
    // 403 de 500. Aqui o corpo do backend e preservado e o status viaja junto.
    const body = error.response?.data
    const message =
      (body && typeof body === 'object' && (body as any).message) ||
      error.message ||
      'Erro de comunicacao com o servidor'

    const normalized = Object.assign(new Error(message), body || {}, {
      status,
      message,
    })

    return Promise.reject(normalized)
  }
)

// Types
export interface DashboardData {
  users: {
    total: number
    active: number
    newThisMonth: number
    growth: number
  }
  products: {
    total: number
    active: number
  }
  orders: {
    total: number
    thisMonth: number
    growth: number
  }
  revenue: {
    thisMonth: number
    lastMonth: number
    growth: number
    commission: number
  }
  withdrawals: {
    pendingAmount: number
    pendingCount: number
  }
  carts: {
    abandoned: number
  }
}

export interface User {
  id: string
  name: string
  email: string
  phone?: string
  avatar_url?: string
  bio?: string
  city?: string
  state?: string
  is_active: boolean
  is_admin?: boolean
  is_outlet?: boolean
  seller_rating?: number
  total_sales?: number
  balance?: number
  created_at: string
  last_login_at?: string
  products_count?: number
  sales_count?: number
  // A LISTAGEM devolve apenas estes dois booleanos. Documento, chave PIX e
  // dados bancarios saem so no detalhe (`getUserDetails`) e ja mascarados.
  has_pix?: boolean
  has_bank_account?: boolean
}

/** Detalhe de um usuario. Os campos sensiveis chegam MASCARADOS do backend. */
export interface UserDetails extends User {
  cashback_balance?: number
  person_type?: string
  company_name?: string
  pix_key_type?: 'cpf' | 'cnpj' | 'email' | 'phone' | 'random'
  pix_key?: string
  bank_code?: string
  bank_name?: string
  bank_agency?: string
  bank_account?: string
  bank_account_type?: 'corrente' | 'poupanca'
  cpf?: string
  cnpj?: string
}

export interface Product {
  id: string
  seller_id: string
  title: string
  description?: string
  brand?: string
  size?: string
  color?: string
  condition: 'novo' | 'seminovo' | 'usado'
  price: number
  original_price?: number
  status: 'active' | 'paused' | 'sold' | 'deleted' | 'pending' | 'rejected'
  is_premium: boolean
  is_featured: boolean
  views: number
  favorites: number
  city?: string
  state?: string
  created_at: string
  seller_name?: string
  seller_email?: string
  image_url?: string
  category_name?: string
}

/**
 * Status reais do pedido, espelhando `KNOWN_STATUSES` de
 * `largo-backend/src/services/orderState.js`. O painel enviava 'pending' e
 * 'paid', que o backend nunca aceitou — toda mudanca de status dava 400.
 */
export const ORDER_STATUSES = [
  'pending_payment',
  'processing',
  'payment_failed',
  'pending_shipment',
  'shipped',
  'in_transit',
  'delivered',
  'completed',
  'disputed',
  'cancelled',
  'refunded',
  'chargeback',
] as const

export type OrderStatus = typeof ORDER_STATUSES[number]

/** Rotulo em portugues de cada status, usado em badges e selects. */
export const ORDER_STATUS_LABELS: Record<string, string> = {
  pending_payment: 'Aguardando Pagamento',
  processing: 'Processando Pagamento',
  payment_failed: 'Pagamento Falhou',
  pending_shipment: 'Aguardando Envio',
  paid: 'Pago',
  shipped: 'Enviado',
  in_transit: 'Em Transito',
  delivered: 'Entregue',
  completed: 'Concluido',
  disputed: 'Em Disputa',
  cancelled: 'Cancelado',
  refunded: 'Estornado',
  chargeback: 'Chargeback',
}

/**
 * Espelho das transicoes que o papel `admin` pode disparar, copiado de
 * `TRANSITIONS` em `largo-backend/src/services/orderState.js`.
 *
 * A autoridade continua sendo o backend — isto existe so para a tela nao
 * oferecer uma acao que vai voltar 403. Note que 'pending_payment' ->
 * 'pending_shipment' NAO esta aqui: confirmar pagamento e do webhook do
 * gateway, nunca do painel. O botao "Confirmar Pagamento" que existia na tela
 * jamais poderia funcionar.
 */
export const ADMIN_ORDER_TRANSITIONS: Record<string, OrderStatus[]> = {
  pending_payment: ['cancelled'],
  processing: ['cancelled'],
  payment_failed: ['cancelled'],
  pending_shipment: ['shipped', 'disputed', 'cancelled', 'refunded'],
  shipped: ['in_transit', 'delivered', 'disputed', 'refunded'],
  in_transit: ['delivered', 'disputed', 'refunded'],
  delivered: ['completed', 'disputed', 'refunded'],
  disputed: ['delivered', 'completed', 'refunded'],
  completed: [],
  cancelled: [],
  refunded: [],
  chargeback: [],
}

export interface Order {
  id: string
  order_number?: string
  product_id: string
  buyer_id: string
  seller_id: string
  // Dominio real da maquina de estados (services/orderState.js). 'paid' fica
  // so por causa de pedidos antigos gravados antes da padronizacao.
  status: OrderStatus | 'paid'
  total_amount: number
  commission_amount: number
  seller_receives: number
  shipping_price: number
  product_price?: number
  commission_rate?: number
  shipping_code?: string
  shipping_carrier?: string
  created_at: string
  product_title?: string
  buyer_name?: string
  seller_name?: string
  product_image?: string
}

export interface Cart {
  id: string
  user_id: string
  total_value: number
  items_count: number
  device_type?: string
  status: 'active' | 'abandoned' | 'recovered' | 'converted'
  last_activity_at: string
  abandoned_at?: string
  user_name?: string
  user_email?: string
}

export interface RevenueChartData {
  date: string
  revenue: number
  commission: number
  orders: number
}

export interface CategorySalesData {
  category: string
  sales: number
  revenue: number
}

/**
 * Funil do periodo (backend: services/analytics.js, getConversionFunnel).
 * Etapas em pessoas: visitantes > viram peca > iniciaram checkout > compraram.
 * Totais em eventos: visualizacoes, adicoes a sacola, checkouts, pedidos pagos.
 */
export interface ConversionMetrics {
  from: string
  to: string
  uniqueVisitors: number
  viewers: number
  checkoutUsers: number
  buyers: number
  totalViews: number
  cartAdditions: number
  checkoutStarts: number
  completedOrders: number
  viewToCartRate: string
  checkoutToOrderRate: string
  overallConversionRate: string
}

/**
 * Chaves reais da tabela `settings` (whitelist do backend em
 * `analytics.js`). `commission_rate`, `minimum_withdrawal`,
 * `free_listings_limit` e `shipping_base_cost` foram removidas daqui: nao
 * existem no banco nem no codigo, e por estarem no tipo davam a impressao
 * de que a tela mexia em algo.
 *
 * Marcadas com [ATIVA] as que o backend realmente le hoje.
 */
export interface Settings {
  [key: string]: any
  commission_free?: number                  // [ATIVA] services/commission.js
  commission_outlet?: number                // [ATIVA] services/commission.js
  first_purchase_shipping_discount?: number // [ATIVA] services/promotions.js
  cashback_buyer?: number                   // [ATIVA] services/orderState.js — pontos percentuais (2 = 2%)
  pix_fee?: number                          // sem efeito no backend
  card_fee_percent?: number                 // sem efeito no backend
  card_fee_fixed?: number                   // sem efeito no backend
  boleto_fee?: number                       // sem efeito no backend
  withdrawal_fee?: number                   // sem efeito no backend
  min_withdrawal?: number                   // sem efeito no backend
  release_days?: number                     // sem efeito no backend
  cart_abandon_hours?: number               // sem efeito no backend
}

/**
 * Chaves gravadas pelo painel que NENHUM codigo do backend le ainda.
 * A tela de Configuracoes usa esta lista para avisar o operador, campo a campo.
 */
export const SETTINGS_WITHOUT_EFFECT = [
  'pix_fee',
  'card_fee_percent',
  'card_fee_fixed',
  'boleto_fee',
  'withdrawal_fee',
  'min_withdrawal',
  'release_days',
  'cart_abandon_hours',
] as const

export interface AdminNotification {
  id: string
  user_id: string
  type: string
  title: string
  message?: string
  data?: any
  is_read: boolean
  created_at: string
  user_name?: string
  user_email?: string
}

// API Functions

// Auth
export const adminLogin = async (email: string, password: string): Promise<{ success: boolean; token?: string; user?: any; message?: string }> => {
  try {
    const response = await api.post('/auth/admin-login', { email, password })
    return response as any
  } catch (error: any) {
    return { success: false, message: error.message || 'Erro ao fazer login' }
  }
}

export const checkAdminAuth = async (): Promise<{ success: boolean; user?: any }> => {
  try {
    const response = await api.get('/auth/admin-check')
    return response as any
  } catch (error) {
    return { success: false }
  }
}

// Dashboard
export const getDashboard = (params?: { from?: string; to?: string }): Promise<{ success: boolean; data: DashboardData }> =>
  api.get('/analytics/admin/dashboard', { params })

export const getRevenueChart = (period: string = '6months'): Promise<{ success: boolean; data: RevenueChartData[] }> =>
  api.get(`/analytics/admin/revenue-chart?period=${period}`)

export const getOrdersByStatus = (): Promise<{ success: boolean; data: { status: string; count: number }[] }> =>
  api.get('/analytics/admin/orders-by-status')

export const getSalesByCategory = (): Promise<{ success: boolean; data: CategorySalesData[] }> =>
  api.get('/analytics/admin/sales-by-category')

export const getConversionMetrics = (params?: { from?: string; to?: string }): Promise<{ success: boolean; data: ConversionMetrics }> =>
  api.get('/analytics/admin/conversion-metrics', { params })

export const getTopSellers = (): Promise<{ success: boolean; data: User[] }> =>
  api.get('/analytics/admin/top-sellers')

export const getTopProducts = (): Promise<{ success: boolean; data: Product[] }> =>
  api.get('/analytics/admin/top-products')

export const getHourlyViews = (): Promise<{ success: boolean; data: { hour: number; views: number }[] }> =>
  api.get('/analytics/admin/hourly-views')

// Users
export interface UserStats {
  total: number
  inactive: number
  sellers: number
  new_this_month: number
}

export const getUsers = (params?: {
  page?: number
  limit?: number
  search?: string
  subscription?: string
  status?: string
}): Promise<{ success: boolean; users: User[]; stats: UserStats; pagination: { page: number; limit: number; total: number } }> =>
  api.get('/analytics/admin/users', { params })

export const getUserDetails = (userId: string): Promise<{ success: boolean; user: UserDetails }> =>
  api.get(`/analytics/admin/users/${userId}`)

export const toggleUserStatus = (userId: string): Promise<{ success: boolean; is_active: boolean }> =>
  api.post(`/analytics/admin/users/${userId}/toggle-status`)

export const deleteUser = (userId: string): Promise<{ success: boolean }> =>
  api.delete(`/analytics/admin/users/${userId}`)

// Products
export const getProducts = (params?: {
  page?: number
  limit?: number
  search?: string
  status?: string
  category?: string
  sort?: string
}): Promise<{ success: boolean; products: Product[]; stats: { active: number; pending: number; sold: number; total: number }; pagination: { page: number; limit: number; total: number } }> =>
  api.get('/analytics/admin/products', { params })

export const getProductDetails = (productId: string): Promise<{ success: boolean; product: Product & { images: string[] } }> =>
  api.get(`/analytics/admin/products/${productId}`)

export const getPendingProducts = (): Promise<{ success: boolean; data: Product[] }> =>
  api.get('/analytics/admin/pending-products')

export const approveProduct = (productId: string): Promise<{ success: boolean }> =>
  api.post(`/analytics/admin/products/${productId}/approve`)

export const rejectProduct = (productId: string, reason?: string): Promise<{ success: boolean }> =>
  api.post(`/analytics/admin/products/${productId}/reject`, { reason })

export const deleteProduct = (productId: string): Promise<{ success: boolean }> =>
  api.delete(`/analytics/admin/products/${productId}`)

// ==================== TRACKING / ENGAJAMENTO ====================

export interface TrackingEvent {
  id: string
  event_type: string
  event_category?: string
  created_at: string
  session_id?: string
  device_type?: string
  metadata?: any
  user_name?: string
  user_email?: string
  product_title?: string
  product_id?: string
}

export interface EngagementFunnel {
  views: string
  favorites: string
  cart_adds: string
  checkout_starts: string
  purchases: string
  sessions: string
  users: string
}

export interface EngagementSessions {
  total: string
  avg_seconds: string
  max_seconds: string
  avg_screens: string
}

export interface UserSession {
  id: string
  started_at: string
  last_seen_at: string
  duration_seconds: number
  screen_views: number
  platform?: string
  device_type?: string
  user_name?: string
  user_email?: string
  events_count: string
}

export interface ProductAudience {
  events: {
    event_type: string
    created_at: string
    session_id?: string
    device_type?: string
    user_id?: string
    user_name?: string
    user_email?: string
    avatar_url?: string
  }[]
  totals: {
    views: string
    unique_viewers: string
    favorites: string
    cart_adds: string
    checkouts: string
  }
}

export const getEngagement = (params?: { from?: string; to?: string }): Promise<{
  success: boolean
  funnel: EngagementFunnel
  sessions: EngagementSessions
  byDevice: { device: string; count: string }[]
  topSearches: { term: string; count: string }[]
}> => api.get('/analytics/admin/engagement', { params })

export const getSessions = (limit = 50): Promise<{ success: boolean; sessions: UserSession[] }> =>
  api.get('/analytics/admin/sessions', { params: { limit } })

export const getTrackingEvents = (params?: { limit?: number; event_type?: string }): Promise<{
  success: boolean
  events: TrackingEvent[]
}> => api.get('/analytics/admin/events', { params })

export const getProductAudience = (productId: string): Promise<{ success: boolean } & ProductAudience> =>
  api.get(`/analytics/admin/products/${productId}/audience`)

// Orders
export const getOrders = (params?: {
  page?: number
  limit?: number
  status?: string
  from?: string
  to?: string
  search?: string
}): Promise<{ success: boolean; orders: Order[]; stats: { pending: number; paid: number; shipped: number; delivered: number; cancelled: number; total_revenue: number; total_commission: number }; pagination: { page: number; limit: number; total: number } }> =>
  api.get('/analytics/admin/orders', { params })

// Google Analytics 4 (Data API via service account no backend)
export interface GA4Overview {
  configured: boolean
  from: string
  to: string
  totals: { activeUsers: number; sessions: number; screenPageViews: number }
  daily: { date: string; activeUsers: number; sessions: number; screenPageViews: number }[]
  top_pages: { pagePath: string; screenPageViews: number; activeUsers: number }[]
  sources: { sessionSource: string; sessionMedium: string; sessions: number; activeUsers: number }[]
}

export const getGA4 = (params?: { from?: string; to?: string }): Promise<{ success: boolean } & GA4Overview> =>
  api.get('/analytics/admin/ga4', { params })

export const getOrderDetails = (orderId: string): Promise<{ success: boolean; order: Order & { product_images: string[]; street?: string; number?: string; complement?: string; neighborhood?: string; city?: string; state?: string; zipcode?: string; recipient_name?: string } }> =>
  api.get(`/analytics/admin/orders/${orderId}`)

export const updateOrderStatus = (orderId: string, status: string): Promise<{ success: boolean; order?: Order; effects?: any }> =>
  api.put(`/analytics/admin/orders/${orderId}/status`, { status })

/** Destinos que o admin pode alcancar a partir do estado atual do pedido. */
export const getOrderTransitions = (orderId: string): Promise<{ success: boolean; status: string; transitions: string[] }> =>
  api.get(`/analytics/admin/orders/${orderId}/transitions`)

// Carts
export const getAbandonedCarts = (params?: {
  page?: number
  limit?: number
  status?: string
}): Promise<{ success: boolean; carts: Cart[]; stats: { abandoned: number; recovered: number; expiring: number; lost_revenue: number } }> =>
  api.get('/analytics/admin/abandoned-carts', { params })

// Communications
export const getAdminNotifications = (params?: {
  page?: number
  limit?: number
  type?: string
}): Promise<{ success: boolean; notifications: AdminNotification[]; stats: { total: number; unread: number }; pagination: { page: number; limit: number; total: number } }> =>
  api.get('/analytics/admin/notifications', { params })

// Reports
export const getPendingReports = (): Promise<{ success: boolean; data: any[]; pendingCount: number }> =>
  api.get('/analytics/admin/pending-reports')

export interface Report {
  id: string
  reporter_id: string
  reported_user_id?: string
  product_id?: string
  reason: string
  description?: string
  status: 'pending' | 'resolved' | 'dismissed'
  resolution_notes?: string
  created_at: string
  resolved_at?: string
  reporter_name?: string
  reporter_email?: string
  reported_name?: string
  reported_email?: string
  product_title?: string
}

export const getReports = (params?: {
  page?: number
  limit?: number
  status?: string
}): Promise<{ success: boolean; reports: Report[]; stats: { pending: number; resolved: number; dismissed: number }; pagination: { page: number; limit: number; total: number } }> =>
  api.get('/analytics/admin/reports', { params })

export const resolveReport = (reportId: string, status: 'resolved' | 'dismissed', resolution_notes?: string): Promise<{ success: boolean }> =>
  api.put(`/analytics/admin/reports/${reportId}`, { status, resolution_notes })

// Settings
export const getSettings = (): Promise<{ success: boolean; settings: Settings }> =>
  api.get('/analytics/admin/settings')

export const updateSetting = (key: string, value: any): Promise<{ success: boolean }> =>
  api.put(`/analytics/admin/settings/${key}`, { value })

// Categories
export const getCategories = (): Promise<{ success: boolean; categories: { id: string; name: string; icon?: string; products_count?: number }[] }> =>
  api.get('/categories')

// Finance
export const getTransactions = (params?: {
  page?: number
  limit?: number
  type?: string
  status?: string
}): Promise<{ success: boolean; transactions: any[]; pagination: { page: number; limit: number; total: number } }> =>
  api.get('/payments/transactions', { params })

export const processWithdrawal = (transactionId: string, action: 'approve' | 'reject'): Promise<{ success: boolean }> =>
  api.post(`/payments/withdrawals/${transactionId}/${action}`)

// Finance - Asaas integration
export interface AsaasBalance {
  available: number
  pending: number
  total: number
}

export interface AsaasPayment {
  id: string
  customer: string
  value: number
  netValue: number
  billingType: string
  status: string
  dueDate: string
  paymentDate?: string
  confirmedDate?: string
  description?: string
  externalReference?: string
  invoiceUrl?: string
  installmentCount?: number
}

export interface FinancialEntry {
  id: string
  value: number
  balance: number
  type: string
  date: string
  description?: string
  paymentId?: string
}

export interface CashFlowMonth {
  month: string
  revenue: number
  commission: number
  sellerPayouts: number
  refunds: number
  refundsCount: number
  paidOrders: number
  approvedWithdrawals: number
  pendingWithdrawals: number
  netCashFlow: number
}

export interface PaymentMethodData {
  key: string
  name: string
  count: number
  amount: number
  color: string
}

/**
 * Saldo Asaas.
 *
 * `GET /payments/admin/balance` devolve o objeto CRU do Asaas
 * (`{ balance, totalPending }`), enquanto o card do painel lia `available` —
 * por isso a Visao Geral mostrava sempre R$ 0,00. Ja `/payments/admin/cash-flow`
 * devolve o formato mapeado. A rota do backend e de outra frente, entao a
 * normalizacao acontece aqui e aceita os dois formatos.
 */
export const getAsaasBalance = async (): Promise<{ success: boolean; data: AsaasBalance | null }> => {
  const res = await (api.get('/payments/admin/balance') as unknown as Promise<{ success: boolean; data: any }>)
  const raw = res?.data
  if (!raw) return { success: !!res?.success, data: null }

  const available = Number(raw.available ?? raw.balance ?? 0)
  const pending = Number(raw.pending ?? raw.totalPending ?? 0)
  return {
    success: !!res.success,
    data: {
      available: Number.isFinite(available) ? available : 0,
      pending: Number.isFinite(pending) ? pending : 0,
      total: (Number.isFinite(available) ? available : 0) + (Number.isFinite(pending) ? pending : 0),
    },
  }
}

export const getAsaasPayments = (params?: {
  page?: number
  limit?: number
  status?: string
  billingType?: string
  startDate?: string
  endDate?: string
}): Promise<{ success: boolean; payments: AsaasPayment[]; pagination: { page: number; limit: number; total: number } }> =>
  api.get('/payments/admin/payments', { params })

export const getFinancialStatements = (params?: {
  page?: number
  limit?: number
  startDate?: string
  finishDate?: string
  type?: string
}): Promise<{ success: boolean; entries: FinancialEntry[]; pagination: { page: number; limit: number; total: number } }> =>
  api.get('/payments/admin/financial-statements', { params })

export const getAsaasTransfers = (params?: {
  page?: number
  limit?: number
  startDate?: string
  endDate?: string
}): Promise<{ success: boolean; transfers: any[]; pagination: { page: number; limit: number; total: number } }> =>
  api.get('/payments/admin/transfers', { params })

export const getCashFlow = (months?: number): Promise<{ success: boolean; balance: AsaasBalance | null; cashFlow: CashFlowMonth[] }> =>
  api.get('/payments/admin/cash-flow', { params: { months } })

export const getPaymentMethods = (): Promise<{ success: boolean; methods: PaymentMethodData[] }> =>
  api.get('/payments/admin/payment-methods')

export const refundPayment = (paymentId: string, value?: number): Promise<{ success: boolean }> =>
  api.post(`/payments/admin/refund/${paymentId}`, { value })

// ==================== FINANCEIRO GERENCIAL (contas a pagar/receber) ====================

export interface FinanceCategory {
  id: string
  name: string
  kind: 'despesa' | 'receita'
  active: boolean
  entries_count?: number
}

export interface FinancePartner {
  id: string
  name: string
  active: boolean
  entries_count?: number
}

export interface FinanceEntry {
  id: string
  kind: 'pagar' | 'receber'
  description: string
  category_id?: string
  category_name?: string
  partner_id?: string
  partner_name?: string
  counterparty?: string
  amount: string
  due_date: string
  paid_at?: string
  status: 'pendente' | 'pago' | 'cancelado'
  is_overdue?: boolean
  payment_method?: string
  recurring: boolean
  notes?: string
  created_at: string
}

export interface FinanceEntryTotals {
  count: string
  total_pendente: string
  total_vencido: string
  total_pago: string
}

export interface FinanceSummary {
  cards: {
    a_pagar: string
    a_pagar_vencido: string
    a_receber: string
    a_receber_vencido: string
    pago_periodo: string
    recebido_periodo: string
  }
  by_category: { kind: string; category: string; total: string }[]
  by_partner: { partner: string; kind: string; total: string; count: string }[]
}

export interface FinanceCashflowMonth {
  month: string
  entradas: string
  saidas: string
}

export const getFinanceCategories = (): Promise<{ success: boolean; categories: FinanceCategory[] }> =>
  api.get('/admin/finance/categories')

export const createFinanceCategory = (name: string, kind: 'despesa' | 'receita'): Promise<{ success: boolean; category: FinanceCategory }> =>
  api.post('/admin/finance/categories', { name, kind })

export const updateFinanceCategory = (id: string, data: { name?: string; active?: boolean }): Promise<{ success: boolean; category: FinanceCategory }> =>
  api.put(`/admin/finance/categories/${id}`, data)

export const getFinancePartners = (): Promise<{ success: boolean; partners: FinancePartner[] }> =>
  api.get('/admin/finance/partners')

export const createFinancePartner = (name: string): Promise<{ success: boolean; partner: FinancePartner }> =>
  api.post('/admin/finance/partners', { name })

export const updateFinancePartner = (id: string, data: { name?: string; active?: boolean }): Promise<{ success: boolean; partner: FinancePartner }> =>
  api.put(`/admin/finance/partners/${id}`, data)

export const getFinanceEntries = (params?: {
  kind?: string
  status?: string
  category_id?: string
  partner_id?: string
  from?: string
  to?: string
  page?: number
  limit?: number
}): Promise<{ success: boolean; entries: FinanceEntry[]; totals: FinanceEntryTotals; pagination: { page: number; limit: number; total: number } }> =>
  api.get('/admin/finance/entries', { params })

export const createFinanceEntry = (data: Partial<FinanceEntry>): Promise<{ success: boolean; entry: FinanceEntry }> =>
  api.post('/admin/finance/entries', data)

export const updateFinanceEntry = (id: string, data: Partial<FinanceEntry>): Promise<{ success: boolean; entry: FinanceEntry }> =>
  api.put(`/admin/finance/entries/${id}`, data)

export const payFinanceEntry = (id: string, data?: { paid_at?: string; payment_method?: string }): Promise<{ success: boolean; entry: FinanceEntry; next_entry?: FinanceEntry }> =>
  api.post(`/admin/finance/entries/${id}/pay`, data)

export const unpayFinanceEntry = (id: string): Promise<{ success: boolean; entry: FinanceEntry }> =>
  api.post(`/admin/finance/entries/${id}/unpay`)

export const cancelFinanceEntry = (id: string): Promise<{ success: boolean; entry: FinanceEntry }> =>
  api.post(`/admin/finance/entries/${id}/cancel`)

export const deleteFinanceEntry = (id: string): Promise<{ success: boolean }> =>
  api.delete(`/admin/finance/entries/${id}`)

export const getFinanceSummary = (params?: { from?: string; to?: string }): Promise<{ success: boolean } & FinanceSummary> =>
  api.get('/admin/finance/summary', { params })

export const getFinanceCashflow = (months?: number): Promise<{ success: boolean; realized: FinanceCashflowMonth[]; projected: FinanceCashflowMonth[] }> =>
  api.get('/admin/finance/cashflow', { params: { months } })


export default api
