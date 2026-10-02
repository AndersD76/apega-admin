import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatDateTime, downloadCSV } from '@/lib/utils'
import { getOrders, ORDER_STATUS_LABELS, type Order } from '@/lib/api'
import {
  Truck,
  Package,
  Clock,
  CheckCircle,
  AlertTriangle,
  Search,
  Download,
  RefreshCw,
  Loader2,
  AlertCircle,
} from 'lucide-react'

function getStatusBadge(status: string) {
  switch (status) {
    case 'pending_shipment':
      return <Badge variant="warning" className="gap-1"><Clock className="h-3 w-3" /> Aguardando Envio</Badge>
    case 'shipped':
      return <Badge variant="info" className="gap-1"><Truck className="h-3 w-3" /> Em Transito</Badge>
    case 'delivered':
      return <Badge variant="success" className="gap-1"><CheckCircle className="h-3 w-3" /> Entregue</Badge>
    case 'cancelled':
      return <Badge variant="destructive" className="gap-1"><AlertTriangle className="h-3 w-3" /> Cancelado</Badge>
    default:
      return <Badge variant="secondary">{status}</Badge>
  }
}

export default function Shipping() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [activeTab, setActiveTab] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  /**
   * Contadores vindos do backend.
   *
   * Antes esta tela puxava `limit: 200` e contava os status dentro do array
   * recebido. Passando de 200 pedidos — o que ja acontece — os quatro cards
   * simplesmente paravam de crescer e o operador via "Aguardando Envio: 200"
   * como se fosse o total real. `GET /admin/orders` ja devolve `stats` calculado
   * sobre a tabela inteira; e ele que manda agora.
   *
   * Mapeamento: o backend chama de `paid` o contador de `pending_shipment`
   * (`COUNT(*) FILTER (WHERE status IN ('pending_shipment','paid'))`), que e
   * exatamente "pago, aguardando o vendedor postar".
   */
  const [stats, setStats] = useState({ pending: 0, shipped: 0, delivered: 0, cancelled: 0 })

  // O filtro de aba vai para o servidor: filtrar no cliente sobre a janela de
  // 200 registros escondia os pedidos mais antigos de cada status.
  const fetchData = async () => {
    setLoading(true)
    setError(null)

    try {
      const res = await getOrders({
        limit: 200,
        status: activeTab === 'all' ? undefined : activeTab,
      })
      if (res.success) {
        setOrders(res.orders || [])
        if (res.stats) {
          setStats({
            pending: Number(res.stats.paid) || 0,
            shipped: Number(res.stats.shipped) || 0,
            delivered: Number(res.stats.delivered) || 0,
            cancelled: Number(res.stats.cancelled) || 0,
          })
        }
      }
    } catch (err: any) {
      console.error('Erro ao carregar envios:', err)
      setError(err.message || 'Erro ao carregar envios')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab])

  // A busca continua no cliente porque o `search` do backend cobre numero do
  // pedido, comprador e titulo da peca — nao o codigo de rastreio, que e o que
  // se procura nesta tela.
  const filteredOrders = useMemo(() => {
    if (!searchTerm) return orders
    const needle = searchTerm.toLowerCase()
    return orders.filter((order) => {
      const haystack = `${order.order_number || ''} ${order.shipping_code || ''}`.toLowerCase()
      return haystack.includes(needle)
    })
  }, [orders, searchTerm])

  // Exporta os envios carregados. O helper de CSV faz quoting e neutraliza
  // formula (um codigo de rastreio nunca comeca com "=", mas a regra vale para
  // toda coluna vinda do banco).
  const handleExport = () => {
    downloadCSV(
      'envios.csv',
      ['Pedido', 'Rastreio', 'Transportadora', 'Status', 'Comprador', 'Vendedor', 'Data'],
      filteredOrders.map(o => [
        o.order_number || o.id.slice(0, 8),
        o.shipping_code || '',
        o.shipping_carrier || '',
        ORDER_STATUS_LABELS[o.status] || o.status,
        o.buyer_name || '',
        o.seller_name || '',
        formatDateTime(o.created_at),
      ]),
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <p className="text-lg font-medium">Erro ao carregar envios</p>
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
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Envios</h1>
          <p className="text-muted-foreground">Acompanhe os envios do marketplace</p>
        </div>
        <Button variant="outline" onClick={handleExport} disabled={loading || filteredOrders.length === 0}>
          <Download className="mr-2 h-4 w-4" />
          Exportar CSV
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="rounded-lg bg-yellow-100 p-3 text-yellow-600">
              <Clock className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Aguardando Envio</p>
              <p className="text-2xl font-bold">{stats.pending}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="rounded-lg bg-blue-100 p-3 text-blue-600">
              <Truck className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Em Transito</p>
              <p className="text-2xl font-bold">{stats.shipped}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="rounded-lg bg-green-100 p-3 text-green-600">
              <CheckCircle className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Entregues</p>
              <p className="text-2xl font-bold">{stats.delivered}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="rounded-lg bg-red-100 p-3 text-red-600">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Cancelados</p>
              <p className="text-2xl font-bold">{stats.cancelled}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="all">Todos</TabsTrigger>
                <TabsTrigger value="pending_shipment">Pendentes</TabsTrigger>
                <TabsTrigger value="shipped">Em Transito</TabsTrigger>
                <TabsTrigger value="delivered">Entregues</TabsTrigger>
                <TabsTrigger value="cancelled">Cancelados</TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar codigo de rastreio..."
                className="w-64 pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pedido</TableHead>
                  <TableHead>Rastreio</TableHead>
                  <TableHead>Transportadora</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.order_number || order.id.slice(0, 8)}</TableCell>
                    <TableCell>{order.shipping_code || '-'}</TableCell>
                    <TableCell>{order.shipping_carrier || '-'}</TableCell>
                    <TableCell>{getStatusBadge(order.status)}</TableCell>
                    <TableCell>{formatDateTime(order.created_at)}</TableCell>
                  </TableRow>
                ))}
                {filteredOrders.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      Nenhum envio encontrado.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
