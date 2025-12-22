import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
  DashboardData,
  RevenueChartData,
} from '@/lib/api'
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  CreditCard,
  Receipt,
  Download,
  RefreshCw,
  Clock,
  CheckCircle,
  Loader2,
  AlertCircle,
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

interface StatCardProps {
  title: string
  value: string | number
  icon: React.ReactNode
  trend?: { value: number; isPositive: boolean }
  description?: string
  loading?: boolean
}

function StatCard({ title, value, icon, trend, description, loading }: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="rounded-lg bg-primary/10 p-3 text-primary">
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

export default function Finance() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [revenueData, setRevenueData] = useState<{ name: string; receita: number; comissao: number }[]>([])
  const [transactions, setTransactions] = useState<any[]>([])

  const fetchData = async () => {
    setLoading(true)
    setError(null)

    try {
      const [dashboardRes, revenueRes, transactionsRes] = await Promise.all([
        getDashboard(),
        getRevenueChart('6months'),
        getTransactions({ limit: 20 }),
      ])

      if (dashboardRes.success) {
        setDashboardData(dashboardRes.data)
      }

      if (revenueRes.success) {
        setRevenueData(revenueRes.data.map(item => ({
          name: new Date(item.date).toLocaleDateString('pt-BR', { month: 'short' }),
          receita: parseFloat(String(item.revenue)),
          comissao: parseFloat(String(item.commission)),
        })))
      }

      if (transactionsRes.success) {
        setTransactions(transactionsRes.transactions || [])
      }
    } catch (err: any) {
      console.error('Erro ao carregar dados financeiros:', err)
      setError(err.message || 'Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }

  const handleWithdrawal = async (transactionId: string, action: 'approve' | 'reject') => {
    try {
      await processWithdrawal(transactionId, action);
      fetchData();
    } catch (error) {
      console.error('Erro ao processar saque:', error);
    }
  };

  useEffect(() => {
    fetchData()
  }, [])

  // Dados de mÃ©todos de pagamento (calculados a partir do dashboard)
  const paymentMethodData: { name: string; value: number; amount: number; color: string }[] = [];
  const hasPaymentData = paymentMethodData.some((item) => item.value > 0);

  // Saques pendentes (filtrados das transaÃ§Ãµes)
  const withdrawals = transactions.filter(t => t.type === 'withdrawal' && t.status === 'pending')

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <p className="text-lg font-medium">Erro ao carregar dados financeiros</p>
        <p className="text-sm text-muted-foreground">{error}</p>
        <Button onClick={fetchData} variant="outline" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Tentar novamente
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Financeiro</h1>
          <p className="text-muted-foreground">
            Gestao financeira do marketplace
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchData} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Exportar Relatorio
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          title="Receita Total (Mes)"
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
        />
        <StatCard
          title="Saques Pendentes"
          value={formatCurrency(dashboardData?.withdrawals.pendingAmount || 0)}
          icon={<RefreshCw className="h-6 w-6" />}
          description={`${dashboardData?.withdrawals.pendingCount || 0} solicitacoes`}
          loading={loading}
        />
        <StatCard
          title="Pedidos do Mes"
          value={dashboardData?.orders.thisMonth || 0}
          icon={<Clock className="h-6 w-6" />}
          loading={loading}
        />
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 lg:grid-cols-7">
        {/* Revenue Chart */}
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Receita vs Comissoes</CardTitle>
            <CardDescription>Ultimos 6 meses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : revenueData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="name" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                      formatter={(value: number) => formatCurrency(value)}
                    />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="receita"
                      name="Receita"
                      stroke="#22c55e"
                      fill="#22c55e"
                      fillOpacity={0.3}
                    />
                    <Area
                      type="monotone"
                      dataKey="comissao"
                      name="Comissao"
                      stroke="#ec4899"
                      fill="#ec4899"
                      fillOpacity={0.3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  Sem dados de receita
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Payment Methods */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Metodos de Pagamento</CardTitle>
            <CardDescription>Distribuicao este mes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-60">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : hasPaymentData ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={paymentMethodData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {paymentMethodData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  Sem dados de metodos de pagamento
                </div>
              )}
            </div>
            {hasPaymentData && (
              <div className="mt-4 space-y-2">
                {paymentMethodData.map((method) => (
                  <div key={method.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full" style={{ backgroundColor: method.color }} />
                      <span>{method.name}</span>
                    </div>
                    <span className="font-medium">{formatCurrency(method.amount)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tabs for Withdrawals and Transactions */}
      <Card>
        <CardHeader>
          <Tabs defaultValue="withdrawals">
            <TabsList>
              <TabsTrigger value="withdrawals">Saques Pendentes</TabsTrigger>
              <TabsTrigger value="transactions">Transacoes</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="withdrawals">
            <TabsContent value="withdrawals">
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : withdrawals.length === 0 ? (
                <div className="flex items-center justify-center h-32 text-muted-foreground">
                  Nenhum saque pendente
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Usuario</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Acoes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {withdrawals.map((withdrawal) => (
                      <TableRow key={withdrawal.id}>
                        <TableCell className="font-medium">{withdrawal.user_name || 'Usuario'}</TableCell>
                        <TableCell>{formatCurrency(withdrawal.amount)}</TableCell>
                        <TableCell>
                          <Badge variant="warning" className="gap-1">
                            <Clock className="h-3 w-3" /> Pendente
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDate(withdrawal.created_at)}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => handleWithdrawal(withdrawal.id, 'approve')}>
                              Aprovar
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => handleWithdrawal(withdrawal.id, 'reject')}>
                              Rejeitar
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>
            <TabsContent value="transactions">
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : transactions.length === 0 ? (
                <div className="flex items-center justify-center h-32 text-muted-foreground">
                  Nenhuma transacao encontrada
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Descricao</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Data</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((tx) => (
                      <TableRow key={tx.id}>
                        <TableCell className="font-medium">{tx.description || 'Transacao'}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{tx.type}</Badge>
                        </TableCell>
                        <TableCell className={parseFloat(tx.amount) >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {parseFloat(tx.amount) >= 0 ? '+' : ''}{formatCurrency(Math.abs(parseFloat(tx.amount)))}
                        </TableCell>
                        <TableCell>{formatDate(tx.created_at)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}


