import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatNumber } from '@/lib/utils'
import {
  getDashboard,
  getRevenueChart,
  getOrdersByStatus,
  getSalesByCategory,
  getOrders,
  getTopProducts,
  getConversionMetrics,
  DashboardData,
  RevenueChartData,
  CategorySalesData,
  Order,
  Product,
  ConversionMetrics,
} from '@/lib/api'
import {
  Users,
  ShoppingBag,
  Package,
  DollarSign,
  ShoppingCart,
  Eye,
  Heart,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle2,
  XCircle,
  Truck,
  Loader2,
  AlertCircle,
  RefreshCw,
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
  change?: number
  icon: React.ReactNode
  description?: string
  loading?: boolean
}

function StatCard({ title, value, change, icon, description, loading }: StatCardProps) {
  const isPositive = (change ?? 0) >= 0

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className="rounded-lg bg-primary/10 p-2 text-primary">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm text-muted-foreground">Carregando...</span>
          </div>
        ) : (
          <>
            <div className="text-2xl font-bold">{value}</div>
            {change !== undefined && (
              <div className="flex items-center gap-1 text-xs">
                {isPositive ? (
                  <ArrowUpRight className="h-3 w-3 text-green-500" />
                ) : (
                  <ArrowDownRight className="h-3 w-3 text-red-500" />
                )}
                <span className={isPositive ? 'text-green-500' : 'text-red-500'}>
                  {Math.abs(change)}%
                </span>
                <span className="text-muted-foreground">{description || 'vs. mes anterior'}</span>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'pending':
    case 'pending_payment':
      return <Badge variant="warning" className="gap-1"><Clock className="h-3 w-3" /> Pendente</Badge>
    case 'pending_shipment':
      return <Badge variant="info" className="gap-1"><Package className="h-3 w-3" /> Aguardando Envio</Badge>
    case 'paid':
      return <Badge variant="info" className="gap-1"><DollarSign className="h-3 w-3" /> Pago</Badge>
    case 'shipped':
      return <Badge variant="info" className="gap-1"><Truck className="h-3 w-3" /> Enviado</Badge>
    case 'delivered':
      return <Badge variant="success" className="gap-1"><CheckCircle2 className="h-3 w-3" /> Entregue</Badge>
    case 'cancelled':
      return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" /> Cancelado</Badge>
    default:
      return <Badge>{status}</Badge>
  }
}

const CATEGORY_COLORS = ['#ec4899', '#8b5cf6', '#06b6d4', '#f59e0b', '#10b981', '#ef4444', '#3b82f6', '#84cc16']

export default function Dashboard() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [revenueData, setRevenueData] = useState<RevenueChartData[]>([])
  const [categoryData, setCategoryData] = useState<any[]>([])
  const [ordersStatus, setOrdersStatus] = useState<{ name: string; value: number }[]>([])
  const [recentOrders, setRecentOrders] = useState<Order[]>([])
  const [topProducts, setTopProducts] = useState<Product[]>([])
  const [conversionMetrics, setConversionMetrics] = useState<ConversionMetrics | null>(null)

  const fetchData = async () => {
    setLoading(true)
    setError(null)

    try {
      const [
        dashboardRes,
        revenueRes,
        categoryRes,
        statusRes,
        ordersRes,
        productsRes,
        conversionRes,
      ] = await Promise.all([
        getDashboard(),
        getRevenueChart('6months'),
        getSalesByCategory(),
        getOrdersByStatus(),
        getOrders({ limit: 5 }),
        getTopProducts(),
        getConversionMetrics(),
      ])

      if (dashboardRes.success) {
        setDashboardData(dashboardRes.data)
      }

      if (revenueRes.success) {
        setRevenueData(revenueRes.data.map(item => ({
          ...item,
          date: new Date(item.date).toLocaleDateString('pt-BR', { month: 'short' }),
          revenue: parseFloat(String(item.revenue)),
          commission: parseFloat(String(item.commission)),
        })))
      }

      if (categoryRes.success) {
        setCategoryData(categoryRes.data.map((item, index) => ({
          ...item,
          name: item.category || 'Sem categoria',
          value: item.sales,
          color: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
        })))
      }

      if (statusRes.success) {
        const statusMap: { [key: string]: string } = {
          pending: 'Pendentes',
          pending_payment: 'Aguardando Pagamento',
          pending_shipment: 'Aguardando Envio',
          paid: 'Pagos',
          shipped: 'Enviados',
          delivered: 'Entregues',
          cancelled: 'Cancelados',
        }
        setOrdersStatus(statusRes.data.map(item => ({
          name: statusMap[item.status] || item.status,
          value: parseInt(String(item.count)),
        })))
      }

      if (ordersRes.success) {
        setRecentOrders(ordersRes.orders || [])
      }

      if (productsRes.success) {
        setTopProducts(productsRes.data || [])
      }

      if (conversionRes.success) {
        setConversionMetrics(conversionRes.data)
      }
    } catch (err: any) {
      console.error('Erro ao carregar dashboard:', err)
      setError(err.message || 'Erro ao carregar dados do dashboard')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <p className="text-lg font-medium">Erro ao carregar dashboard</p>
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
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Visao geral do marketplace Apega Desapega
          </p>
        </div>
        <Button onClick={fetchData} variant="outline" size="sm" className="gap-2" disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Receita do Mes"
          value={formatCurrency(dashboardData?.revenue.thisMonth || 0)}
          change={dashboardData?.revenue.growth}
          icon={<DollarSign className="h-5 w-5" />}
          loading={loading}
        />
        <StatCard
          title="Pedidos do Mes"
          value={formatNumber(dashboardData?.orders.thisMonth || 0)}
          change={dashboardData?.orders.growth}
          icon={<Package className="h-5 w-5" />}
          loading={loading}
        />
        <StatCard
          title="Usuarios Ativos"
          value={formatNumber(dashboardData?.users.active || 0)}
          change={dashboardData?.users.growth}
          icon={<Users className="h-5 w-5" />}
          loading={loading}
        />
        <StatCard
          title="Produtos Ativos"
          value={formatNumber(dashboardData?.products.active || 0)}
          icon={<ShoppingBag className="h-5 w-5" />}
          loading={loading}
        />
      </div>

      {/* Secondary KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total de Usuarios"
          value={formatNumber(dashboardData?.users.total || 0)}
          icon={<Users className="h-5 w-5" />}
          loading={loading}
        />
        <StatCard
          title="Taxa de Conversao"
          value={`${conversionMetrics?.overallConversionRate || 0}%`}
          icon={<ShoppingCart className="h-5 w-5" />}
          loading={loading}
        />
        <StatCard
          title="Carrinhos Abandonados"
          value={formatNumber(dashboardData?.carts.abandoned || 0)}
          icon={<ShoppingCart className="h-5 w-5" />}
          loading={loading}
        />
        <StatCard
          title="Comissao Gerada"
          value={formatCurrency(dashboardData?.revenue.commission || 0)}
          icon={<DollarSign className="h-5 w-5" />}
          loading={loading}
        />
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 lg:grid-cols-7">
        {/* Revenue Chart */}
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Receita e Comissoes</CardTitle>
            <CardDescription>Visao mensal de receita e comissoes do marketplace</CardDescription>
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
                    <XAxis dataKey="date" className="text-xs" />
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
                      dataKey="revenue"
                      name="Receita (R$)"
                      stroke="#ec4899"
                      fill="#ec4899"
                      fillOpacity={0.3}
                    />
                    <Area
                      type="monotone"
                      dataKey="commission"
                      name="Comissao (R$)"
                      stroke="#8b5cf6"
                      fill="#8b5cf6"
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

        {/* Category Distribution */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Vendas por Categoria</CardTitle>
            <CardDescription>Distribuicao das vendas por categoria</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-60">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : categoryData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      nameKey="name"
                    >
                      {categoryData.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.color || CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  Sem dados de categoria
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Orders and Activity Row */}
      <div className="grid gap-4 lg:grid-cols-7">
        {/* Recent Orders */}
        <Card className="lg:col-span-4">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Pedidos Recentes</CardTitle>
              <CardDescription>Ultimos pedidos realizados no marketplace</CardDescription>
            </div>
            <Badge variant="secondary">Ultimos 5</Badge>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center h-48">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : recentOrders.length > 0 ? (
              <div className="space-y-4">
                {recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                        <Package className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{order.product_title || 'Produto'}</p>
                        <p className="text-xs text-muted-foreground">
                          #{order.id.slice(0, 8)} - {order.buyer_name || 'Comprador'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-semibold">{formatCurrency(order.total_amount)}</span>
                      {getStatusBadge(order.status)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-48 text-muted-foreground">
                Nenhum pedido encontrado
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Metricas de Conversao</CardTitle>
            <CardDescription>Ultimos 30 dias</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {loading ? (
              <div className="flex items-center justify-center h-48">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Visualizacoes para Carrinho</span>
                    <span className="font-medium">{conversionMetrics?.viewToCartRate || 0}%</span>
                  </div>
                  <Progress value={parseFloat(conversionMetrics?.viewToCartRate || '0')} className="h-2" />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Carrinho para Compra</span>
                    <span className="font-medium">{conversionMetrics?.cartToOrderRate || 0}%</span>
                  </div>
                  <Progress value={parseFloat(conversionMetrics?.cartToOrderRate || '0')} className="h-2" />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Conversao Geral</span>
                    <span className="font-medium">{conversionMetrics?.overallConversionRate || 0}%</span>
                  </div>
                  <Progress value={parseFloat(conversionMetrics?.overallConversionRate || '0') * 10} className="h-2" />
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4">
                  <div className="rounded-lg border p-3 text-center">
                    <div className="flex items-center justify-center gap-1 text-2xl font-bold">
                      <Eye className="h-5 w-5 text-muted-foreground" />
                      {formatNumber(conversionMetrics?.totalViews || 0)}
                    </div>
                    <p className="text-xs text-muted-foreground">Visualizacoes</p>
                  </div>
                  <div className="rounded-lg border p-3 text-center">
                    <div className="flex items-center justify-center gap-1 text-2xl font-bold">
                      <ShoppingCart className="h-5 w-5 text-primary" />
                      {formatNumber(conversionMetrics?.cartAdditions || 0)}
                    </div>
                    <p className="text-xs text-muted-foreground">Adicionados ao Carrinho</p>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Orders Status Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Status dos Pedidos</CardTitle>
          <CardDescription>Distribuicao de pedidos por status este mes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : ordersStatus.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ordersStatus} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" className="text-xs" />
                  <YAxis dataKey="name" type="category" className="text-xs" width={100} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="value" fill="#ec4899" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                Sem dados de status
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Top Products */}
      {topProducts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Produtos Mais Visualizados</CardTitle>
            <CardDescription>Top 10 produtos com mais visualizacoes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topProducts.slice(0, 5).map((product) => (
                <div key={product.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                  <div className="flex items-center gap-4">
                    {product.image_url ? (
                      <img src={product.image_url} alt={product.title} className="h-12 w-12 rounded-lg object-cover" />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
                        <ShoppingBag className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium">{product.title}</p>
                      <p className="text-xs text-muted-foreground">{product.seller_name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-sm font-semibold">{formatCurrency(product.price)}</p>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Eye className="h-4 w-4" />
                        {formatNumber(product.views)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Heart className="h-4 w-4" />
                        {formatNumber(product.favorites)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
