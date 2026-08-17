import { useEffect, useState } from 'react'
import { PeriodFilter, periodPreset, type Period } from '@/components/PeriodFilter'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatCurrency, formatNumber } from '@/lib/utils'
import {
  TrendingUp,
  Users,
  ShoppingBag,
  Eye,
  RefreshCcw,
  ArrowUpRight,
  ArrowDownRight,
  AlertCircle,
  Loader2,
  RefreshCw,
} from 'lucide-react'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import {
  getRevenueChart,
  getSalesByCategory,
  getConversionMetrics,
  getUsersBySubscription,
  getGA4,
  ConversionMetrics,
  RevenueChartData,
  CategorySalesData,
  GA4Overview,
} from '@/lib/api'

interface MetricCardProps {
  title: string
  value: string | number
  change?: number
  icon: React.ReactNode
}

function MetricCard({ title, value, change, icon }: MetricCardProps) {
  const isPositive = (change ?? 0) >= 0
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="rounded-lg bg-primary/10 p-3 text-primary">
            {icon}
          </div>
          {change !== undefined && (
            <div className={`flex items-center gap-1 text-sm ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
              {isPositive ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
              {Math.abs(change)}%
            </div>
          )}
        </div>
        <div className="mt-4">
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-sm text-muted-foreground">{title}</p>
        </div>
      </CardContent>
    </Card>
  )
}

export default function Analytics() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [conversion, setConversion] = useState<ConversionMetrics | null>(null)
  const [revenueData, setRevenueData] = useState<RevenueChartData[]>([])
  const [categoryData, setCategoryData] = useState<CategorySalesData[]>([])
  const [subscriptionData, setSubscriptionData] = useState<{ subscription_type: string; count: number }[]>([])
  const [period, setPeriod] = useState<Period>(periodPreset('30d'))
  const [ga4, setGa4] = useState<GA4Overview | null>(null)
  const [ga4Error, setGa4Error] = useState<string | null>(null)
  const [ga4Loading, setGa4Loading] = useState(false)

  const fetchGA4 = async (p: Period) => {
    setGa4Loading(true)
    setGa4Error(null)
    try {
      const res = await getGA4({ from: p.from, to: p.to })
      setGa4(res)
    } catch (err: any) {
      setGa4(null)
      setGa4Error(err?.message || 'Erro ao consultar o Google Analytics')
    } finally {
      setGa4Loading(false)
    }
  }

  const fetchData = async () => {
    setLoading(true)
    setError(null)

    try {
      const [conversionRes, revenueRes, categoryRes, subscriptionRes] = await Promise.all([
        getConversionMetrics(),
        getRevenueChart('30days'),
        getSalesByCategory(),
        getUsersBySubscription(),
      ])

      if (conversionRes.success) {
        setConversion(conversionRes.data)
      }

      if (revenueRes.success) {
        setRevenueData(revenueRes.data.map(item => ({
          ...item,
          date: new Date(item.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
          revenue: parseFloat(String(item.revenue)),
          commission: parseFloat(String(item.commission)),
          orders: parseInt(String(item.orders)),
        })))
      }

      if (categoryRes.success) {
        setCategoryData(categoryRes.data)
      }

      if (subscriptionRes.success) {
        setSubscriptionData(subscriptionRes.data || [])
      }
    } catch (err: any) {
      console.error('Erro ao carregar analytics:', err)
      setError(err.message || 'Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    fetchGA4(period)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period.from, period.to])

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <p className="text-lg font-medium">Erro ao carregar analytics</p>
        <p className="text-sm text-muted-foreground">{error}</p>
        <button onClick={fetchData} className="inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm">
          <RefreshCw className="h-4 w-4" />
          Tentar novamente
        </button>
      </div>
    )
  }

  const funnelData = conversion ? [
    { stage: 'Visitantes', value: conversion.uniqueVisitors },
    { stage: 'Visualizacoes', value: conversion.totalViews },
    { stage: 'Carrinho', value: conversion.cartAdditions },
    { stage: 'Pedidos', value: conversion.completedOrders },
  ] : []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground">Metricas do marketplace</p>
      </div>

      <PeriodFilter value={period} onChange={setPeriod} />

      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard
          title="Taxa de Conversao"
          value={conversion ? `${conversion.overallConversionRate}%` : '0%'}
          icon={<TrendingUp className="h-6 w-6" />}
        />
        <MetricCard
          title="View -> Carrinho"
          value={conversion ? `${conversion.viewToCartRate}%` : '0%'}
          icon={<ShoppingBag className="h-6 w-6" />}
        />
        <MetricCard
          title="Carrinho -> Pedido"
          value={conversion ? `${conversion.cartToOrderRate}%` : '0%'}
          icon={<RefreshCcw className="h-6 w-6" />}
        />
        <MetricCard
          title="Visitantes Unicos"
          value={formatNumber(conversion?.uniqueVisitors || 0)}
          icon={<Users className="h-6 w-6" />}
        />
      </div>

      <Tabs defaultValue="revenue">
        <TabsList>
          <TabsTrigger value="revenue">Receita</TabsTrigger>
          <TabsTrigger value="funnel">Funil</TabsTrigger>
          <TabsTrigger value="categories">Categorias</TabsTrigger>
          <TabsTrigger value="subscriptions">Assinaturas</TabsTrigger>
          <TabsTrigger value="google">Google</TabsTrigger>
        </TabsList>

        <TabsContent value="google" className="mt-6 space-y-4">
          {ga4Loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : !ga4 ? (
            <Card>
              <CardHeader>
                <CardTitle>Google Analytics nao conectado</CardTitle>
                <CardDescription>
                  {ga4Error || 'Configure as credenciais para ver os dados do GA4 aqui.'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>1. No Google Cloud Console, crie um <strong>service account</strong> e gere uma chave JSON.</p>
                <p>2. No GA4: Administrador → Gerenciamento de acesso da propriedade → adicione o e-mail do service account como <strong>Leitor</strong>.</p>
                <p>3. No Railway, adicione as variaveis <code>GA4_PROPERTY_ID</code>, <code>GOOGLE_SA_EMAIL</code> e <code>GOOGLE_SA_PRIVATE_KEY</code> (private_key do JSON).</p>
                <p>Detalhes no HANDOFF.md do projeto.</p>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-3">
                <MetricCard title="Usuarios ativos" value={formatNumber(ga4.totals.activeUsers)} icon={<Users className="h-6 w-6" />} />
                <MetricCard title="Sessoes" value={formatNumber(ga4.totals.sessions)} icon={<TrendingUp className="h-6 w-6" />} />
                <MetricCard title="Pageviews" value={formatNumber(ga4.totals.screenPageViews)} icon={<Eye className="h-6 w-6" />} />
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Usuarios e sessoes por dia</CardTitle>
                  <CardDescription>Fonte: Google Analytics 4</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={ga4.daily.map(d => ({ ...d, label: `${d.date.slice(6,8)}/${d.date.slice(4,6)}` }))}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                        <XAxis dataKey="label" fontSize={12} />
                        <YAxis fontSize={12} allowDecimals={false} />
                        <Tooltip />
                        <Legend />
                        <Area dataKey="activeUsers" name="Usuarios" stroke="#22c55e" fill="#22c55e" fillOpacity={0.25} />
                        <Area dataKey="sessions" name="Sessoes" stroke="#0ea5e9" fill="#0ea5e9" fillOpacity={0.15} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <div className="grid gap-4 lg:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Paginas mais vistas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {ga4.top_pages.map((pg, i) => (
                        <div key={i} className="flex items-center justify-between border-b pb-1.5 text-sm last:border-0">
                          <span className="truncate pr-4 text-muted-foreground">{pg.pagePath}</span>
                          <span className="font-medium whitespace-nowrap">{formatNumber(pg.screenPageViews)}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Origens de trafego</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {ga4.sources.map((src, i) => (
                        <div key={i} className="flex items-center justify-between border-b pb-1.5 text-sm last:border-0">
                          <span className="truncate pr-4 text-muted-foreground">{src.sessionSource} / {src.sessionMedium}</span>
                          <span className="font-medium whitespace-nowrap">{formatNumber(src.sessions)} sessoes</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="revenue" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Receita e Pedidos</CardTitle>
              <CardDescription>Ultimos 30 dias</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                {loading ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={revenueData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="date" />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <Tooltip
                        contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                        formatter={(value: number, name: string) => {
                          if (name === 'Pedidos') return value
                          return formatCurrency(value)
                        }}
                      />
                      <Legend />
                      <Line yAxisId="left" type="monotone" dataKey="revenue" name="Receita" stroke="#22c55e" strokeWidth={2} />
                      <Line yAxisId="left" type="monotone" dataKey="commission" name="Comissao" stroke="#ec4899" strokeWidth={2} />
                      <Line yAxisId="right" type="monotone" dataKey="orders" name="Pedidos" stroke="#3b82f6" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="funnel" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Funil de Conversao</CardTitle>
              <CardDescription>Ultimos 30 dias</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                {loading ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={funnelData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis type="number" />
                      <YAxis dataKey="stage" type="category" width={150} />
                      <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                      <Bar dataKey="value" fill="#ec4899" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Performance por Categoria</CardTitle>
              <CardDescription>Ultimos 30 dias</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                {loading ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={categoryData.map(item => ({
                      name: item.category || 'Sem categoria',
                      sales: parseInt(String(item.sales)),
                      revenue: parseFloat(String(item.revenue)),
                    }))}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip
                        contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                        formatter={(value: number, name: string) => (name === 'revenue' ? formatCurrency(value) : value)}
                      />
                      <Legend />
                      <Area type="monotone" dataKey="sales" name="Vendas" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                      <Area type="monotone" dataKey="revenue" name="Receita" stroke="#22c55e" fill="#22c55e" fillOpacity={0.3} />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subscriptions" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Usuarios por Assinatura</CardTitle>
              <CardDescription>Distribuicao atual</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                {loading ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={subscriptionData.map(item => ({
                      name: item.subscription_type,
                      total: parseInt(String(item.count)),
                    }))}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                      <Bar dataKey="total" name="Usuarios" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
