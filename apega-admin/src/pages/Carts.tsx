import { useMemo, useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import { getAbandonedCarts, getHourlyViews, Cart } from '@/lib/api'
import {
  Search,
  Download,
  MoreHorizontal,
  Eye,
  ShoppingCart,
  Mail,
  Bell,
  RefreshCcw,
  CheckCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Smartphone,
  Monitor,
  Loader2,
  RefreshCw,
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

function getStatusBadge(status: string) {
  switch (status) {
    case 'abandoned':
      return <Badge variant="warning" className="gap-1"><ShoppingCart className="h-3 w-3" /> Abandonado</Badge>
    case 'active':
      return <Badge variant="info" className="gap-1"><Clock className="h-3 w-3" /> Ativo</Badge>
    case 'recovered':
      return <Badge variant="success" className="gap-1"><CheckCircle className="h-3 w-3" /> Recuperado</Badge>
    case 'converted':
      return <Badge variant="success" className="gap-1"><CheckCircle className="h-3 w-3" /> Convertido</Badge>
    default:
      return <Badge>{status}</Badge>
  }
}

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
          {trend && (
            <div className={`flex items-center gap-1 text-sm ${trend.isPositive ? 'text-green-500' : 'text-red-500'}`}>
              {trend.isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              {Math.abs(trend.value)}%
            </div>
          )}
        </div>
        <div className="mt-4">
          {loading ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : (
            <>
              <p className="text-2xl font-bold">{value}</p>
              <p className="text-sm text-muted-foreground">{title}</p>
              {description && <p className="mt-1 text-xs text-muted-foreground">{description}</p>}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default function Carts() {
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [carts, setCarts] = useState<Cart[]>([])
  const [stats, setStats] = useState({
    abandoned: 0,
    recovered: 0,
    expiring: 0,
    lost_revenue: 0,
  })
  const [hourlyData, setHourlyData] = useState<{ hour: string; views: number }[]>([])

  const deviceData = useMemo(() => {
    const counts = carts.reduce((acc, cart) => {
      const key = (cart.device_type || 'mobile').toLowerCase();
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const total = Object.values(counts).reduce((sum, val) => sum + val, 0) || 1;
    return [
      { name: 'Mobile', value: Math.round((counts.mobile || 0) / total * 100), color: '#ec4899' },
      { name: 'Desktop', value: Math.round((counts.desktop || 0) / total * 100), color: '#8b5cf6' },
      { name: 'Tablet', value: Math.round((counts.tablet || 0) / total * 100), color: '#06b6d4' },
    ];
  }, [carts]);


  const fetchData = async () => {
    setLoading(true)
    setError(null)

    try {
      const [cartsRes, hourlyRes] = await Promise.all([
        getAbandonedCarts({ status: activeTab === 'all' ? undefined : activeTab }),
        getHourlyViews(),
      ])

      if (cartsRes.success) {
        setCarts(cartsRes.carts)
        setStats({
          abandoned: cartsRes.stats.abandoned,
          recovered: cartsRes.stats.recovered,
          expiring: cartsRes.stats.expiring,
          lost_revenue: cartsRes.stats.lost_revenue,
        })
      }

      if (hourlyRes.success) {
        setHourlyData(hourlyRes.data.map(item => ({
          hour: `${item.hour}h`,
          views: parseInt(String(item.views)),
        })))
      }
    } catch (err: any) {
      console.error('Erro ao carregar carrinhos:', err)
      setError(err.message || 'Erro ao carregar carrinhos abandonados')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [activeTab])

  const filteredCarts = carts.filter(cart => {
    const matchesSearch = (cart.user_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (cart.user_email || '').toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

  const recoveryRate = stats.abandoned > 0 ? ((stats.recovered / stats.abandoned) * 100).toFixed(1) : 0

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <p className="text-lg font-medium">Erro ao carregar carrinhos</p>
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
          <h1 className="text-3xl font-bold tracking-tight">Carrinhos Abandonados</h1>
          <p className="text-muted-foreground">
            Monitore e recupere vendas perdidas
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchData}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          title="Carrinhos Abandonados"
          value={stats.abandoned}
          icon={<ShoppingCart className="h-6 w-6" />}
          loading={loading}
        />
        <StatCard
          title="Taxa de Recuperacao"
          value={`${recoveryRate}%`}
          icon={<RefreshCcw className="h-6 w-6" />}
          loading={loading}
        />
        <StatCard
          title="Receita Perdida"
          value={formatCurrency(stats.lost_revenue)}
          icon={<DollarSign className="h-6 w-6" />}
          description="Potencial de recuperacao"
          loading={loading}
        />
        <StatCard
          title="Recuperados"
          value={stats.recovered}
          icon={<CheckCircle className="h-6 w-6" />}
          loading={loading}
        />
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 lg:grid-cols-7">
        {/* Hourly Distribution */}
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Horarios de Pico</CardTitle>
            <CardDescription>Visualizacoes por hora do dia (ultimos 7 dias)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : hourlyData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={hourlyData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="hour" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Bar dataKey="views" name="Visualizacoes" fill="#ec4899" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  Sem dados de horario
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Device Distribution */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Por Dispositivo</CardTitle>
            <CardDescription>Onde os carrinhos sao abandonados</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={deviceData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {deviceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 flex items-center justify-center gap-4">
              <div className="flex items-center gap-2">
                <Smartphone className="h-4 w-4 text-primary" />
                <span className="text-sm">68% Mobile</span>
              </div>
              <div className="flex items-center gap-2">
                <Monitor className="h-4 w-4 text-purple-500" />
                <span className="text-sm">28% Desktop</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Abandoned Carts Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="all">Todos</TabsTrigger>
                <TabsTrigger value="abandoned">Abandonados</TabsTrigger>
                <TabsTrigger value="recovered">Recuperados</TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar usuario..."
                className="w-64 pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredCarts.length === 0 ? (
            <div className="flex items-center justify-center h-64 text-muted-foreground">
              Nenhum carrinho encontrado
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Itens</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Dispositivo</TableHead>
                  <TableHead>Ultima Atividade</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCarts.map((cart) => (
                  <TableRow key={cart.id}>
                    <TableCell>
                      <div>
                        <span className="font-medium">{cart.user_name || 'Usuario'}</span>
                        <p className="text-xs text-muted-foreground">{cart.user_email || '-'}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span>{cart.items_count} itens</span>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">{formatCurrency(cart.total_value)}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Smartphone className="h-4 w-4 text-muted-foreground" />
                        <span className="capitalize">Mobile</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {formatDateTime(cart.last_activity_at)}
                      </span>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(cart.status)}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Acoes</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>
                            <Eye className="mr-2 h-4 w-4" />
                            Ver Carrinho
                          </DropdownMenuItem>
                          {cart.status === 'abandoned' && (
                            <DropdownMenuItem>
                              <Mail className="mr-2 h-4 w-4" />
                              Enviar Lembrete
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem>
                            <Bell className="mr-2 h-4 w-4" />
                            Enviar Push
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}


