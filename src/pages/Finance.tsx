import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatCurrency, formatDate } from '@/lib/utils'
import {
  getDashboard,
  getRevenueChart,
  getTransactions,
  processWithdrawal,
  getCashFlow,
  getAsaasPayments,
  getFinancialStatements,
  getPaymentMethods,
  getAsaasBalance,
  type DashboardData,
  type AsaasPayment,
  type FinancialEntry,
  type CashFlowMonth,
  type PaymentMethodData,
  type AsaasBalance,
} from '@/lib/api'
import {
  DollarSign,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  Receipt,
  Download,
  RefreshCw,
  Clock,
  Loader2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Banknote,
  PiggyBank,
  CreditCard,
  QrCode,
  ExternalLink,
} from 'lucide-react'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

// ─── Helpers ────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    PENDING: { label: 'Pendente', variant: 'outline' },
    RECEIVED: { label: 'Recebido', variant: 'default' },
    CONFIRMED: { label: 'Confirmado', variant: 'default' },
    OVERDUE: { label: 'Vencido', variant: 'destructive' },
    REFUNDED: { label: 'Estornado', variant: 'secondary' },
    REFUND_REQUESTED: { label: 'Estorno solicitado', variant: 'secondary' },
    CHARGEBACK_REQUESTED: { label: 'Chargeback', variant: 'destructive' },
    AWAITING_RISK_ANALYSIS: { label: 'Análise de risco', variant: 'outline' },
    pending: { label: 'Pendente', variant: 'outline' },
    approved: { label: 'Aprovado', variant: 'default' },
    rejected: { label: 'Rejeitado', variant: 'destructive' },
    paid: { label: 'Pago', variant: 'default' },
    completed: { label: 'Concluído', variant: 'default' },
  }
  const info = map[status] || { label: status, variant: 'outline' as const }
  return <Badge variant={info.variant}>{info.label}</Badge>
}

function BillingBadge({ type }: { type: string }) {
  const map: Record<string, { label: string; icon: React.ReactNode }> = {
    PIX: { label: 'PIX', icon: <QrCode className="h-3 w-3" /> },
    CREDIT_CARD: { label: 'Crédito', icon: <CreditCard className="h-3 w-3" /> },
    DEBIT_CARD: { label: 'Débito', icon: <CreditCard className="h-3 w-3" /> },
    BOLETO: { label: 'Boleto', icon: <Receipt className="h-3 w-3" /> },
  }
  const info = map[type] || { label: type, icon: null }
  return (
    <Badge variant="outline" className="gap-1">
      {info.icon} {info.label}
    </Badge>
  )
}

interface StatCardProps {
  title: string
  value: string | number
  icon: React.ReactNode
  trend?: { value: number; isPositive: boolean }
  description?: string
  loading?: boolean
  accent?: string
}

function StatCard({ title, value, icon, trend, description, loading, accent }: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className={`rounded-lg p-3 ${accent || 'bg-primary/10 text-primary'}`}>
            {icon}
          </div>
          {trend && !loading && (
            <div className={`flex items-center gap-1 text-sm ${trend.isPositive ? 'text-green-500' : 'text-red-500'}`}>
              {trend.isPositive ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
              {Math.abs(trend.value)}%
            </div>
          )}
        </div>
        <div className="mt-4">
          {loading ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : (
            <p className="text-2xl font-bold">{value}</p>
          )}
          <p className="text-sm text-muted-foreground">{title}</p>
          {description && <p className="mt-1 text-xs text-muted-foreground">{description}</p>}
        </div>
      </CardContent>
    </Card>
  )
}

function Pagination({ page, total, limit, onPageChange }: { page: number; total: number; limit: number; onPageChange: (p: number) => void }) {
  const totalPages = Math.ceil(total / limit)
  if (totalPages <= 1) return null
  return (
    <div className="flex items-center justify-between pt-4">
      <p className="text-sm text-muted-foreground">
        {total} registro{total !== 1 ? 's' : ''} — página {page} de {totalPages}
      </p>
      <div className="flex gap-1">
        <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

// ─── Main Component ─────────────────────────────────────────

export default function Finance() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('overview')

  // Overview state
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [revenueData, setRevenueData] = useState<{ name: string; receita: number; comissao: number }[]>([])
  const [paymentMethodsData, setPaymentMethodsData] = useState<PaymentMethodData[]>([])
  const [asaasBalance, setAsaasBalance] = useState<AsaasBalance | null>(null)
  const [withdrawals, setWithdrawals] = useState<any[]>([])

  // Receivables state
  const [receivables, setReceivables] = useState<AsaasPayment[]>([])
  const [receivablesPage, setReceivablesPage] = useState(1)
  const [receivablesTotal, setReceivablesTotal] = useState(0)
  const [receivablesFilter, setReceivablesFilter] = useState({ status: '', billingType: '' })
  const [receivablesLoading, setReceivablesLoading] = useState(false)

  // Payables state (withdrawals/transfers to sellers)
  const [allTransactions, setAllTransactions] = useState<any[]>([])
  const [payablesPage, setPayablesPage] = useState(1)
  const [payablesTotal, setPayablesTotal] = useState(0)
  const [payablesLoading, setPayablesLoading] = useState(false)

  // Cash flow state
  const [cashFlow, setCashFlow] = useState<CashFlowMonth[]>([])
  const [cashFlowLoading, setCashFlowLoading] = useState(false)

  // Entries state
  const [entries, setEntries] = useState<FinancialEntry[]>([])
  const [entriesPage, setEntriesPage] = useState(1)
  const [entriesTotal, setEntriesTotal] = useState(0)
  const [entriesLoading, setEntriesLoading] = useState(false)

  // ─── Data fetching ──────────────────────────────────────

  const fetchOverview = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [dashRes, revRes, pmRes, balRes, txRes] = await Promise.all([
        getDashboard().catch(() => null),
        getRevenueChart('6months').catch(() => null),
        getPaymentMethods().catch(() => null),
        getAsaasBalance().catch(() => null),
        getTransactions({ limit: 50, type: 'withdrawal', status: 'pending' }).catch(() => null),
      ])

      if (dashRes?.success) setDashboardData(dashRes.data)

      if (revRes?.success) {
        setRevenueData(revRes.data.map((item: any) => ({
          name: new Date(item.date).toLocaleDateString('pt-BR', { month: 'short' }),
          receita: parseFloat(String(item.revenue)),
          comissao: parseFloat(String(item.commission)),
        })))
      }

      if (pmRes?.success) setPaymentMethodsData(pmRes.methods)
      if (balRes?.success) setAsaasBalance(balRes.data)
      if (txRes?.success) setWithdrawals(txRes.transactions?.filter((t: any) => t.type === 'withdrawal' && t.status === 'pending') || [])
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchReceivables = useCallback(async (page = 1) => {
    setReceivablesLoading(true)
    try {
      const res = await getAsaasPayments({
        page,
        limit: 15,
        status: receivablesFilter.status || undefined,
        billingType: receivablesFilter.billingType || undefined,
      })
      if (res.success) {
        setReceivables(res.payments)
        setReceivablesTotal(res.pagination.total)
        setReceivablesPage(page)
      }
    } catch { /* silent */ } finally {
      setReceivablesLoading(false)
    }
  }, [receivablesFilter])

  const fetchPayables = useCallback(async (page = 1) => {
    setPayablesLoading(true)
    try {
      const res = await getTransactions({ page, limit: 15, type: 'withdrawal' })
      if (res.success) {
        setAllTransactions(res.transactions)
        setPayablesTotal(res.pagination.total)
        setPayablesPage(page)
      }
    } catch { /* silent */ } finally {
      setPayablesLoading(false)
    }
  }, [])

  const fetchCashFlow = useCallback(async () => {
    setCashFlowLoading(true)
    try {
      const res = await getCashFlow(6)
      if (res.success) {
        setCashFlow(res.cashFlow)
        if (res.balance) setAsaasBalance(res.balance)
      }
    } catch { /* silent */ } finally {
      setCashFlowLoading(false)
    }
  }, [])

  const fetchEntries = useCallback(async (page = 1) => {
    setEntriesLoading(true)
    try {
      const res = await getFinancialStatements({ page, limit: 20 })
      if (res.success) {
        setEntries(res.entries)
        setEntriesTotal(res.pagination.total)
        setEntriesPage(page)
      }
    } catch { /* silent */ } finally {
      setEntriesLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchOverview()
  }, [fetchOverview])

  useEffect(() => {
    if (activeTab === 'receivables') fetchReceivables(1)
    if (activeTab === 'payables') fetchPayables(1)
    if (activeTab === 'cashflow') fetchCashFlow()
    if (activeTab === 'entries') fetchEntries(1)
  }, [activeTab])

  const handleWithdrawal = async (transactionId: string, action: 'approve' | 'reject') => {
    try {
      await processWithdrawal(transactionId, action)
      fetchOverview()
      if (activeTab === 'payables') fetchPayables(payablesPage)
    } catch { /* silent */ }
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <p className="text-lg font-medium">Erro ao carregar dados financeiros</p>
        <p className="text-sm text-muted-foreground">{error}</p>
        <Button onClick={fetchOverview} variant="outline" className="gap-2">
          <RefreshCw className="h-4 w-4" /> Tentar novamente
        </Button>
      </div>
    )
  }

  // ─── Render ───────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Financeiro</h1>
          <p className="text-muted-foreground">Gestao financeira integrada com Asaas</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => { fetchOverview(); if (activeTab !== 'overview') setActiveTab('overview') }} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Main tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Visao Geral</TabsTrigger>
          <TabsTrigger value="receivables">A Receber</TabsTrigger>
          <TabsTrigger value="payables">A Pagar</TabsTrigger>
          <TabsTrigger value="cashflow">Fluxo de Caixa</TabsTrigger>
          <TabsTrigger value="entries">Lancamentos</TabsTrigger>
        </TabsList>

        {/* ═══ VISÃO GERAL ═══ */}
        <TabsContent value="overview" className="space-y-6">
          {/* Balance + Stats */}
          <div className="grid gap-4 md:grid-cols-5">
            <StatCard
              title="Saldo Asaas Disponivel"
              value={formatCurrency(asaasBalance?.available || 0)}
              icon={<Wallet className="h-6 w-6" />}
              description={asaasBalance?.pending ? `${formatCurrency(asaasBalance.pending)} a liberar` : undefined}
              loading={loading}
              accent="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
            />
            <StatCard
              title="Receita do Mes"
              value={formatCurrency(dashboardData?.revenue.thisMonth || 0)}
              icon={<DollarSign className="h-6 w-6" />}
              trend={dashboardData?.revenue.growth ? { value: dashboardData.revenue.growth, isPositive: dashboardData.revenue.growth >= 0 } : undefined}
              loading={loading}
            />
            <StatCard
              title="Comissoes Geradas"
              value={formatCurrency(dashboardData?.revenue.commission || 0)}
              icon={<TrendingUp className="h-6 w-6" />}
              loading={loading}
              accent="bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400"
            />
            <StatCard
              title="Saques Pendentes"
              value={formatCurrency(dashboardData?.withdrawals.pendingAmount || 0)}
              icon={<Banknote className="h-6 w-6" />}
              description={`${dashboardData?.withdrawals.pendingCount || 0} solicitacoes`}
              loading={loading}
              accent="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
            />
            <StatCard
              title="Pedidos do Mes"
              value={dashboardData?.orders.thisMonth || 0}
              icon={<Receipt className="h-6 w-6" />}
              loading={loading}
            />
          </div>

          {/* Charts */}
          <div className="grid gap-4 lg:grid-cols-7">
            <Card className="lg:col-span-4">
              <CardHeader>
                <CardTitle>Receita vs Comissoes</CardTitle>
                <CardDescription>Ultimos 6 meses</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  {loading ? (
                    <div className="flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
                  ) : revenueData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={revenueData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="name" className="text-xs" />
                        <YAxis className="text-xs" />
                        <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} formatter={(value: number) => formatCurrency(value)} />
                        <Legend />
                        <Area type="monotone" dataKey="receita" name="Receita" stroke="#22c55e" fill="#22c55e" fillOpacity={0.3} />
                        <Area type="monotone" dataKey="comissao" name="Comissao" stroke="#ec4899" fill="#ec4899" fillOpacity={0.3} />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">Sem dados de receita</div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle>Metodos de Pagamento</CardTitle>
                <CardDescription>Distribuicao este mes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-60">
                  {loading ? (
                    <div className="flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
                  ) : paymentMethodsData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={paymentMethodsData} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={5} dataKey="amount">
                          {paymentMethodsData.map((entry, i) => (
                            <Cell key={i} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(v: number) => formatCurrency(v)} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">Sem dados de pagamento</div>
                  )}
                </div>
                {paymentMethodsData.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {paymentMethodsData.map((m) => (
                      <div key={m.key} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div className="h-3 w-3 rounded-full" style={{ backgroundColor: m.color }} />
                          <span>{m.name}</span>
                          <span className="text-muted-foreground">({m.count})</span>
                        </div>
                        <span className="font-medium">{formatCurrency(m.amount)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Pending withdrawals */}
          {withdrawals.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" /> Saques Pendentes ({withdrawals.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Usuario</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Acoes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {withdrawals.map((w: any) => (
                      <TableRow key={w.id}>
                        <TableCell className="font-medium">{w.user_name || 'Usuario'}</TableCell>
                        <TableCell>{formatCurrency(w.amount)}</TableCell>
                        <TableCell>{formatDate(w.created_at)}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => handleWithdrawal(w.id, 'approve')}>Aprovar</Button>
                            <Button size="sm" variant="destructive" onClick={() => handleWithdrawal(w.id, 'reject')}>Rejeitar</Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ═══ CONTAS A RECEBER ═══ */}
        <TabsContent value="receivables" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <CardTitle>Contas a Receber</CardTitle>
                  <CardDescription>Cobranças registradas no Asaas</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Select value={receivablesFilter.status} onValueChange={(v) => { setReceivablesFilter(f => ({ ...f, status: v === 'all' ? '' : v })); setTimeout(() => fetchReceivables(1), 0) }}>
                    <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="PENDING">Pendente</SelectItem>
                      <SelectItem value="RECEIVED">Recebido</SelectItem>
                      <SelectItem value="CONFIRMED">Confirmado</SelectItem>
                      <SelectItem value="OVERDUE">Vencido</SelectItem>
                      <SelectItem value="REFUNDED">Estornado</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={receivablesFilter.billingType} onValueChange={(v) => { setReceivablesFilter(f => ({ ...f, billingType: v === 'all' ? '' : v })); setTimeout(() => fetchReceivables(1), 0) }}>
                    <SelectTrigger className="w-[140px]"><SelectValue placeholder="Metodo" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="PIX">PIX</SelectItem>
                      <SelectItem value="CREDIT_CARD">Credito</SelectItem>
                      <SelectItem value="DEBIT_CARD">Debito</SelectItem>
                      <SelectItem value="BOLETO">Boleto</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="sm" onClick={() => fetchReceivables(receivablesPage)} disabled={receivablesLoading}>
                    <RefreshCw className={`h-4 w-4 ${receivablesLoading ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {receivablesLoading ? (
                <div className="flex items-center justify-center h-32"><Loader2 className="h-6 w-6 animate-spin" /></div>
              ) : receivables.length === 0 ? (
                <div className="flex items-center justify-center h-32 text-muted-foreground">Nenhuma cobranca encontrada</div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Descricao</TableHead>
                        <TableHead>Metodo</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Valor Liquido</TableHead>
                        <TableHead>Vencimento</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Link</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {receivables.map((p) => (
                        <TableRow key={p.id}>
                          <TableCell className="font-mono text-xs">{p.id?.slice(-8)}</TableCell>
                          <TableCell className="max-w-[200px] truncate">{p.description || p.externalReference || '-'}</TableCell>
                          <TableCell><BillingBadge type={p.billingType} /></TableCell>
                          <TableCell className="font-medium">{formatCurrency(p.value)}</TableCell>
                          <TableCell className="text-green-600">{formatCurrency(p.netValue)}</TableCell>
                          <TableCell>{p.dueDate}</TableCell>
                          <TableCell><StatusBadge status={p.status} /></TableCell>
                          <TableCell>
                            {p.invoiceUrl && (
                              <a href={p.invoiceUrl} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-4 w-4 text-muted-foreground hover:text-primary" />
                              </a>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <Pagination page={receivablesPage} total={receivablesTotal} limit={15} onPageChange={(p) => fetchReceivables(p)} />
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══ CONTAS A PAGAR ═══ */}
        <TabsContent value="payables" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Contas a Pagar</CardTitle>
                  <CardDescription>Saques de vendedores (transferencias para vendedores)</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => fetchPayables(payablesPage)} disabled={payablesLoading}>
                  <RefreshCw className={`h-4 w-4 ${payablesLoading ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {payablesLoading ? (
                <div className="flex items-center justify-center h-32"><Loader2 className="h-6 w-6 animate-spin" /></div>
              ) : allTransactions.length === 0 ? (
                <div className="flex items-center justify-center h-32 text-muted-foreground">Nenhum saque encontrado</div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Vendedor</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead>Acoes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allTransactions.map((tx: any) => (
                        <TableRow key={tx.id}>
                          <TableCell className="font-medium">{tx.user_name || 'Usuario'}</TableCell>
                          <TableCell className="text-muted-foreground">{tx.user_email || '-'}</TableCell>
                          <TableCell className="text-red-600 font-medium">-{formatCurrency(Math.abs(parseFloat(tx.amount)))}</TableCell>
                          <TableCell><StatusBadge status={tx.status} /></TableCell>
                          <TableCell>{formatDate(tx.created_at)}</TableCell>
                          <TableCell>
                            {tx.status === 'pending' ? (
                              <div className="flex gap-2">
                                <Button size="sm" variant="outline" onClick={() => handleWithdrawal(tx.id, 'approve')}>Aprovar</Button>
                                <Button size="sm" variant="destructive" onClick={() => handleWithdrawal(tx.id, 'reject')}>Rejeitar</Button>
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground">Processado</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <Pagination page={payablesPage} total={payablesTotal} limit={15} onPageChange={(p) => fetchPayables(p)} />
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══ FLUXO DE CAIXA ═══ */}
        <TabsContent value="cashflow" className="space-y-4">
          {/* Balance cards */}
          <div className="grid gap-4 md:grid-cols-3">
            <StatCard
              title="Saldo Disponivel"
              value={formatCurrency(asaasBalance?.available || 0)}
              icon={<Wallet className="h-6 w-6" />}
              loading={cashFlowLoading}
              accent="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
            />
            <StatCard
              title="A Liberar"
              value={formatCurrency(asaasBalance?.pending || 0)}
              icon={<Clock className="h-6 w-6" />}
              loading={cashFlowLoading}
              accent="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
            />
            <StatCard
              title="Total na Conta"
              value={formatCurrency(asaasBalance?.total || 0)}
              icon={<PiggyBank className="h-6 w-6" />}
              loading={cashFlowLoading}
              accent="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
            />
          </div>

          {/* Cash flow chart */}
          <Card>
            <CardHeader>
              <CardTitle>Fluxo de Caixa Mensal</CardTitle>
              <CardDescription>Entradas (comissao) vs saidas (saques + estornos) — ultimos 6 meses</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                {cashFlowLoading ? (
                  <div className="flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
                ) : cashFlow.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={cashFlow.map(cf => ({
                      name: cf.month,
                      entradas: cf.commission,
                      saidas: cf.approvedWithdrawals + cf.refunds,
                      liquido: cf.netCashFlow,
                    }))}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="name" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} formatter={(v: number) => formatCurrency(v)} />
                      <Legend />
                      <Bar dataKey="entradas" name="Entradas" fill="#22c55e" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="saidas" name="Saidas" fill="#ef4444" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="liquido" name="Liquido" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">Sem dados de fluxo de caixa</div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Cash flow table */}
          {cashFlow.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Detalhamento Mensal</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Mes</TableHead>
                      <TableHead>Receita Total</TableHead>
                      <TableHead>Comissao</TableHead>
                      <TableHead>Repasse Vendedores</TableHead>
                      <TableHead>Estornos</TableHead>
                      <TableHead>Saques Aprovados</TableHead>
                      <TableHead>Resultado Liquido</TableHead>
                      <TableHead>Pedidos</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cashFlow.map((cf) => (
                      <TableRow key={cf.month}>
                        <TableCell className="font-medium">{cf.month}</TableCell>
                        <TableCell>{formatCurrency(cf.revenue)}</TableCell>
                        <TableCell className="text-green-600">{formatCurrency(cf.commission)}</TableCell>
                        <TableCell className="text-muted-foreground">{formatCurrency(cf.sellerPayouts)}</TableCell>
                        <TableCell className="text-red-600">{cf.refunds > 0 ? `-${formatCurrency(cf.refunds)}` : formatCurrency(0)}</TableCell>
                        <TableCell className="text-red-600">{cf.approvedWithdrawals > 0 ? `-${formatCurrency(cf.approvedWithdrawals)}` : formatCurrency(0)}</TableCell>
                        <TableCell className={`font-bold ${cf.netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(cf.netCashFlow)}
                        </TableCell>
                        <TableCell>{cf.paidOrders}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ═══ LANÇAMENTOS ═══ */}
        <TabsContent value="entries" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Lancamentos</CardTitle>
                  <CardDescription>Extrato financeiro do Asaas (movimentacoes na conta)</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => fetchEntries(entriesPage)} disabled={entriesLoading}>
                  <RefreshCw className={`h-4 w-4 ${entriesLoading ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {entriesLoading ? (
                <div className="flex items-center justify-center h-32"><Loader2 className="h-6 w-6 animate-spin" /></div>
              ) : entries.length === 0 ? (
                <div className="flex items-center justify-center h-32 text-muted-foreground">Nenhum lancamento encontrado</div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Descricao</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Saldo</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {entries.map((entry: any) => (
                        <TableRow key={entry.id}>
                          <TableCell>{entry.date || formatDate(entry.dateCreated)}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{entry.type || '-'}</Badge>
                          </TableCell>
                          <TableCell className="max-w-[300px] truncate">{entry.description || '-'}</TableCell>
                          <TableCell className={parseFloat(entry.value) >= 0 ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                            {parseFloat(entry.value) >= 0 ? '+' : ''}{formatCurrency(Math.abs(parseFloat(entry.value)))}
                          </TableCell>
                          <TableCell className="text-muted-foreground">{formatCurrency(parseFloat(entry.balance || 0))}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <Pagination page={entriesPage} total={entriesTotal} limit={20} onPageChange={(p) => fetchEntries(p)} />
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
