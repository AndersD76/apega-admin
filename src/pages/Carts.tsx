import { useState, useEffect } from 'react'
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
import { formatCurrency, formatDateTime, downloadCSV } from '@/lib/utils'
import { getAbandonedCarts, getHourlyViews, Cart } from '@/lib/api'
import {
  Search,
  Download,
  ShoppingCart,
  CheckCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Loader2,
  RefreshCw,
  AlertCircle,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

function getStatusBadge(status: string) {
  switch (status) {
    case 'abandoned':
      return <Badge variant="warning" className="gap-1"><ShoppingCart className="h-3 w-3" /> Abandonado</Badge>
    case 'active':
      return <Badge variant="info" className="gap-1"><Clock className="h-3 w-3" /> Ativo</Badge>
    case 'expiring':
      return <Badge variant="warning" className="gap-1"><Clock className="h-3 w-3" /> Expirando</Badge>
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
  // `recovered` saiu do estado junto com os cards que o exibiam: o backend
  // devolve o literal `0` nesse campo, nao ha o que guardar.
  const [stats, setStats] = useState({
    abandoned: 0,
    expiring: 0,
    lost_revenue: 0,
  })
  const [hourlyData, setHourlyData] = useState<{ hour: string; views: number }[]>([])

  // `deviceData` foi removido: `GET /admin/abandoned-carts` nao devolve
  // `device_type` — o campo era sempre undefined, o grafico caia no fallback
  // 'mobile' e desenhava 100% mobile, com as legendas "68% Mobile / 28% Desktop"
  // escritas a mao logo abaixo. Um grafico que nao le nada e pior que nenhum.
  // Quando o backend passar a registrar o dispositivo do carrinho, a fonte certa
  // e `GET /admin/engagement` (campo `byDevice`), ja usada na tela de Analytics.

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
          abandoned: Number(cartsRes.stats.abandoned) || 0,
          expiring: Number(cartsRes.stats.expiring) || 0,
          lost_revenue: Number(cartsRes.stats.lost_revenue) || 0,
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

  // Exporta o que esta na tela (nao ha rota de export no backend). O helper de
  // CSV faz o quoting e neutraliza formula, entao um nome comecando com "=" nao
  // vira formula ao abrir no Excel.
  const handleExport = () => {
    downloadCSV(
      'carrinhos-abandonados.csv',
      ['Usuario', 'E-mail', 'Telefone', 'Itens', 'Valor', 'Ultima atividade', 'Status'],
      filteredCarts.map(c => [
        c.user_name || '',
        c.user_email || '',
        (c as any).user_phone || '',
        c.items_count,
        Number(c.total_value || 0).toFixed(2).replace('.', ','),
        formatDateTime(c.last_activity_at),
        c.status,
      ]),
    )
  }

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
          <Button variant="outline" onClick={handleExport} disabled={loading || filteredCarts.length === 0}>
            <Download className="mr-2 h-4 w-4" />
            Exportar CSV
          </Button>
        </div>
      </div>

      {/*
        Stats. "Taxa de Recuperacao" e "Recuperados" sairam daqui: o backend
        devolve `0 as recovered` literalmente — nao existe medicao de carrinho
        recuperado no sistema — entao os dois cards mostravam 0 e 0,0% para
        sempre, e alguem podia ler isso como "a recuperacao nao esta funcionando"
        em vez de "nao e medido". No lugar entra "Expirando", que o backend
        calcula de verdade.
      */}
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          title="Carrinhos Abandonados"
          value={stats.abandoned}
          icon={<ShoppingCart className="h-6 w-6" />}
          description="Sem atividade ha mais de 24 h"
          loading={loading}
        />
        <StatCard
          title="Expirando"
          value={stats.expiring}
          icon={<Clock className="h-6 w-6" />}
          description="Parados entre 1 h e 24 h"
          loading={loading}
        />
        <StatCard
          title="Receita Perdida"
          value={formatCurrency(stats.lost_revenue)}
          icon={<DollarSign className="h-6 w-6" />}
          description="Soma dos carrinhos abandonados"
          loading={loading}
        />
      </div>

      <p className="text-xs text-muted-foreground">
        Recuperacao de carrinho ainda nao e medida: o sistema nao registra quando um
        carrinho abandonado vira pedido, entao nao ha taxa de recuperacao para exibir.
      </p>

      {/* Charts Row */}
      <div className="grid gap-4">
        {/* Hourly Distribution */}
        <Card>
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
      </div>

      {/* Abandoned Carts Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="all">Todos</TabsTrigger>
                <TabsTrigger value="abandoned">Abandonados</TabsTrigger>
                {/* A aba "Recuperados" saiu: o backend classifica os carrinhos em
                    active/expiring/abandoned, e nunca em 'recovered'. A aba
                    filtrava por um status que nao existe e ficava sempre vazia. */}
                <TabsTrigger value="expiring">Expirando</TabsTrigger>
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
                  {/* Coluna "Dispositivo" removida: escrevia "Mobile" fixo em toda
                      linha, sem nenhum dado por tras. */}
                  <TableHead>Ultima Atividade</TableHead>
                  <TableHead>Status</TableHead>
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
                      <span className="text-sm text-muted-foreground">
                        {formatDateTime(cart.last_activity_at)}
                      </span>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(cart.status)}
                    </TableCell>
                    {/* O menu de acoes saiu inteiro: "Ver Carrinho", "Enviar
                        Lembrete" e "Enviar Push" nao tinham onClick nem rota no
                        backend. Tres itens que abriam e nao faziam nada custavam
                        mais que a ausencia deles. */}
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


