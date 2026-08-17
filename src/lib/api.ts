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
    const token = localStorage.getItem('admin_token')
    console.log('[API] v2 Request to:', config.url, '| Token:', token ? 'Present' : 'Missing')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    console.error('API Error:', error.response?.data || error.message)
    return Promise.reject(error.response?.data || error)
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
  subscription_type: 'free' | 'premium' | 'premium_plus'
  subscription_expires_at?: string
  seller_rating?: number
  total_sales?: number
  balance?: number
  created_at: string
  last_login_at?: string
  products_count?: number
  sales_count?: number
  // Payment info
  pix_key_type?: 'cpf' | 'cnpj' | 'email' | 'phone' | 'random'
  pix_key?: string
  bank_code?: string
  bank_name?: string
  bank_agency?: string
  bank_account?: string
  bank_account_type?: 'corrente' | 'poupanca'
  cpf?: string
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

export interface Order {
  id: string
  order_number?: string
  product_id: string
  buyer_id: string
  seller_id: string
  status: 'pending_payment' | 'pending_shipment' | 'paid' | 'shipped' | 'delivered' | 'completed' | 'cancelled' | 'disputed' | 'refunded'
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

export interface ConversionMetrics {
  totalViews: number
  uniqueVisitors: number
  cartAdditions: number
  completedOrders: number
  viewToCartRate: string
  cartToOrderRate: string
  overallConversionRate: string
}

export interface Settings {
  [key: string]: any
  commission_rate?: number
  free_listings_limit?: number
  premium_price?: number
  premium_plus_price?: number
  shipping_base_cost?: number
  minimum_withdrawal?: number
}

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

export const getConversionMetrics = (): Promise<{ success: boolean; data: ConversionMetrics }> =>
  api.get('/analytics/admin/conversion-metrics')

export const getTopSellers = (): Promise<{ success: boolean; data: User[] }> =>
  api.get('/analytics/admin/top-sellers')

export const getTopProducts = (): Promise<{ success: boolean; data: Product[] }> =>
  api.get('/analytics/admin/top-products')

export const getHourlyViews = (): Promise<{ success: boolean; data: { hour: number; views: number }[] }> =>
  api.get('/analytics/admin/hourly-views')

// Users
export const getUsers = (params?: {
  page?: number
  limit?: number
  search?: string
  subscription?: string
  status?: string
}): Promise<{ success: boolean; users: User[]; pagination: { page: number; limit: number; total: number } }> =>
  api.get('/analytics/admin/users', { params })

export const toggleUserStatus = (userId: string): Promise<{ success: boolean; is_active: boolean }> =>
  api.post(`/analytics/admin/users/${userId}/toggle-status`)

export const deleteUser = (userId: string): Promise<{ success: boolean }> =>
  api.delete(`/analytics/admin/users/${userId}`)

export const getUsersBySubscription = (): Promise<{ success: boolean; data: { subscription_type: string; count: number }[] }> =>
  api.get('/analytics/admin/users-by-subscription')

// Products
export const getProducts = (params?: {
  page?: number
  limit?: number
  search?: string
  status?: string
  category?: string
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

// Orders
export const getOrders = (params?: {
  page?: number
  limit?: number
  status?: string
  from?: string
  to?: string
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

export const updateOrderStatus = (orderId: string, status: string): Promise<{ success: boolean }> =>
  api.put(`/analytics/admin/orders/${orderId}/status`, { status })

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

export const getAsaasBalance = (): Promise<{ success: boolean; data: any }> =>
  api.get('/payments/admin/balance')

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
