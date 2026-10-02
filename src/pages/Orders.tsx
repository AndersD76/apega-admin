import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { PeriodFilter, periodPreset, type Period } from '@/components/PeriodFilter'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { formatCurrency, formatDateTime, downloadCSV } from '@/lib/utils'
import {
  getOrders,
  getOrderDetails,
  updateOrderStatus,
  getOrderTransitions,
  ADMIN_ORDER_TRANSITIONS,
  ORDER_STATUS_LABELS,
  Order,
} from '@/lib/api'
import {
  Search,
  Download,
  MoreHorizontal,
  Eye,
  Package,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  Loader2,
  RefreshCw,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  MapPin,
  User,
  Phone,
  Mail,
  Image,
} from 'lucide-react'

// Todos os status do dominio real (services/orderState.js). A versao anterior
// so conhecia cinco e os demais apareciam como texto cru na tela.
function getStatusBadge(status: string) {
  const label = ORDER_STATUS_LABELS[status] || status
  switch (status) {
    case 'pending_payment':
      return <Badge variant="warning" className="gap-1"><Clock className="h-3 w-3" /> {label}</Badge>
    case 'processing':
      return <Badge variant="warning" className="gap-1"><Loader2 className="h-3 w-3" /> {label}</Badge>
    case 'payment_failed':
      return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" /> {label}</Badge>
    case 'pending_shipment':
    case 'paid':
      return <Badge variant="info" className="gap-1"><DollarSign className="h-3 w-3" /> {label}</Badge>
    case 'shipped':
    case 'in_transit':
      return <Badge variant="info" className="gap-1"><Truck className="h-3 w-3" /> {label}</Badge>
    case 'delivered':
      return <Badge variant="success" className="gap-1"><Package className="h-3 w-3" /> {label}</Badge>
    case 'completed':
      return <Badge variant="success" className="gap-1"><CheckCircle className="h-3 w-3" /> {label}</Badge>
    case 'disputed':
      return <Badge variant="warning" className="gap-1"><AlertCircle className="h-3 w-3" /> {label}</Badge>
    case 'cancelled':
    case 'refunded':
    case 'chargeback':
      return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" /> {label}</Badge>
    default:
      return <Badge>{label}</Badge>
  }
}

/** Transicoes que exigem confirmacao antes de disparar. */
const DESTRUCTIVE_TRANSITIONS = ['cancelled', 'refunded', 'disputed', 'completed']

interface StatCardProps {
  title: string
  value: string | number
  icon: React.ReactNode
  loading?: boolean
}

function StatCard({ title, value, icon, loading }: StatCardProps) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-6">
        <div className="rounded-lg bg-primary/10 p-3 text-primary">
          {icon}
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          {loading ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : (
            <p className="text-2xl font-bold">{value}</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

interface OrderWithDetails extends Order {
  product_images?: string[]
  product_brand?: string
  product_size?: string
  street?: string
  number?: string
  complement?: string
  neighborhood?: string
  city?: string
  state?: string
  zipcode?: string
  recipient_name?: string
  product_description?: string
  product_condition?: string
  buyer_phone?: string
  buyer_email?: string
  seller_phone?: string
  seller_email?: string
  buyer_avatar?: string
  seller_avatar?: string
}

export default function Orders() {
  const [searchParams] = useSearchParams()
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '')
  const [activeTab, setActiveTab] = useState('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0 })
  const [stats, setStats] = useState({
    pending: 0,
    paid: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0,
    total_revenue: 0,
    total_commission: 0,
  })
  const [selectedOrder, setSelectedOrder] = useState<OrderWithDetails | null>(null)
  const [detailsLoading, setDetailsLoading] = useState(false)
  const [period, setPeriod] = useState<Period>(periodPreset('12m'))
  // Resultado da ultima mudanca de status. Antes o erro so ia para o console e
  // o operador achava que tinha salvado.
  const [actionError, setActionError] = useState<string | null>(null)
  const [actionMessage, setActionMessage] = useState<string | null>(null)
  // Transicoes que o backend autoriza para o pedido aberto no modal.
  const [allowedTransitions, setAllowedTransitions] = useState<string[]>([])
  const [confirmTarget, setConfirmTarget] = useState<{ order: Order; status: string } | null>(null)

  // searchOverride: a busca do cabecalho navega com ?q= e o fetch precisa do
  // termo novo sem esperar o setState propagar.
  const fetchOrders = async (page = 1, searchOverride?: string) => {
    setLoading(true)
    setError(null)

    try {
      const res = await getOrders({
        page,
        limit: 20,
        status: activeTab === 'all' ? undefined : activeTab,
        from: period.from,
        to: period.to,
        // A busca e do BANCO, nao da pagina atual: antes o filtro rodava sobre
        // os 20 registros ja carregados e "nao encontrado" era mentira sempre
        // que o pedido estava na pagina 2.
        search: (searchOverride !== undefined ? searchOverride : searchTerm) || undefined,
      })

      if (res.success) {
        setOrders(res.orders)
        setStats(res.stats)
        setPagination({
          page: res.pagination.page,
          limit: res.pagination.limit,
          total: res.pagination.total,
        })
      }
    } catch (err: any) {
      console.error('Erro ao carregar pedidos:', err)
      setError(err.message || 'Erro ao carregar pedidos')
    } finally {
      setLoading(false)
    }
  }

  // A busca do cabecalho navega com ?q=; o termo entra no proprio fetch.
  const urlQuery = searchParams.get('q') || ''
  useEffect(() => {
    setSearchTerm(urlQuery)
  }, [urlQuery])

  useEffect(() => {
    fetchOrders(1, urlQuery)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, period.from, period.to, urlQuery])

  const handleSearch = () => {
    fetchOrders(1)
  }

  const handleViewDetails = async (orderId: string) => {
    setDetailsLoading(true)
    setAllowedTransitions([])
    try {
      const [res, transitions] = await Promise.all([
        getOrderDetails(orderId),
        // Quem manda no que pode virar o que e o backend. O select passa a
        // oferecer exatamente isso, em vez de cinco opcoes fixas das quais
        // duas sempre davam 400.
        getOrderTransitions(orderId).catch(() => null),
      ])
      if (res.success) {
        setSelectedOrder(res.order)
      }
      if (transitions?.success) {
        setAllowedTransitions(transitions.transitions)
      }
    } catch (err: any) {
      setActionError(err.message || 'Erro ao carregar detalhes do pedido')
    } finally {
      setDetailsLoading(false)
    }
  }

  const applyStatus = async (orderId: string, newStatus: string) => {
    setActionError(null)
    setActionMessage(null)
    const res = await updateOrderStatus(orderId, newStatus)
    if (res.success) {
      setOrders(prev => prev.map(o =>
        o.id === orderId ? { ...o, status: newStatus as Order['status'] } : o
      ))
      setSelectedOrder(prev =>
        prev && prev.id === orderId ? { ...prev, status: newStatus as Order['status'] } : prev
      )
      setAllowedTransitions(ADMIN_ORDER_TRANSITIONS[newStatus] || [])
      setActionMessage(
        res.effects?.creditedSeller
          ? `Pedido concluido. Vendedor creditado em ${formatCurrency(res.effects.creditedSeller)}.`
          : `Status atualizado para "${ORDER_STATUS_LABELS[newStatus] || newStatus}".`
      )
    }
  }

  // Transicoes de dinheiro (concluir, estornar, cancelar) passam por
  // confirmacao; as demais vao direto, mas o erro aparece na tela nos dois casos.
  const handleUpdateStatus = async (order: Order, newStatus: string) => {
    if (DESTRUCTIVE_TRANSITIONS.includes(newStatus)) {
      setConfirmTarget({ order, status: newStatus })
      return
    }
    try {
      await applyStatus(order.id, newStatus)
    } catch (err: any) {
      setActionError(err.message || 'Erro ao atualizar status do pedido')
    }
  }

  const handleExportCSV = () => {
    downloadCSV(
      `pedidos-${period.from || 'inicio'}-a-${period.to || 'hoje'}.csv`,
      ['Pedido', 'Produto', 'Comprador', 'Vendedor', 'Valor', 'Frete', 'Comissao', 'Vendedor recebe', 'Status', 'Rastreio', 'Data'],
      orders.map(o => [
        o.order_number || o.id,
        o.product_title || '',
        o.buyer_name || '',
        o.seller_name || '',
        String(o.product_price ?? o.total_amount ?? '').replace('.', ','),
        String(o.shipping_price ?? '').replace('.', ','),
        String(o.commission_amount ?? '').replace('.', ','),
        String(o.seller_receives ?? '').replace('.', ','),
        ORDER_STATUS_LABELS[o.status] || o.status,
        o.shipping_code || '',
        o.created_at?.slice(0, 10) || '',
      ])
    )
  }

  const handlePageChange = (newPage: number) => {
    fetchOrders(newPage)
  }

  const totalPages = Math.ceil(pagination.total / pagination.limit)

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <p className="text-lg font-medium">Erro ao carregar pedidos</p>
        <p className="text-sm text-muted-foreground">{error}</p>
        <Button onClick={() => fetchOrders()} variant="outline" className="gap-2">
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
          <h1 className="text-3xl font-bold tracking-tight">Pedidos</h1>
          <p className="text-muted-foreground">
            Gerencie os pedidos do marketplace
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => fetchOrders(pagination.page)}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          {/* Exporta a pagina carregada, em CSV, sem passar pelo servidor. */}
          <Button variant="outline" onClick={handleExportCSV} disabled={orders.length === 0}>
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Retorno das acoes de status — o erro precisa ser visivel, nao console */}
      {actionError && (
        <div className="flex items-start gap-2 rounded-lg bg-destructive/10 p-4 text-destructive">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <div className="flex-1 text-sm">{actionError}</div>
          <button className="text-xs underline" onClick={() => setActionError(null)}>fechar</button>
        </div>
      )}
      {actionMessage && (
        <div className="flex items-start gap-2 rounded-lg bg-green-500/10 p-4 text-green-600">
          <CheckCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <div className="flex-1 text-sm">{actionMessage}</div>
          <button className="text-xs underline" onClick={() => setActionMessage(null)}>fechar</button>
        </div>
      )}

      {/* Período */}
      <PeriodFilter value={period} onChange={setPeriod} />

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          title="Aguardando"
          value={(stats.pending + stats.paid).toLocaleString('pt-BR')}
          icon={<Clock className="h-6 w-6" />}
          loading={loading}
        />
        <StatCard
          title="Em Transito"
          value={stats.shipped.toLocaleString('pt-BR')}
          icon={<Truck className="h-6 w-6" />}
          loading={loading}
        />
        <StatCard
          title="Entregues"
          value={stats.delivered.toLocaleString('pt-BR')}
          icon={<CheckCircle className="h-6 w-6" />}
          loading={loading}
        />
        <StatCard
          title="Receita Total"
          value={formatCurrency(stats.total_revenue)}
          icon={<DollarSign className="h-6 w-6" />}
          loading={loading}
        />
      </div>

      {/* Filters and Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="all">Todos</TabsTrigger>
                <TabsTrigger value="pending_payment">Aguardando Pagamento</TabsTrigger>
                <TabsTrigger value="pending_shipment">Aguardando Envio</TabsTrigger>
                <TabsTrigger value="shipped">Em Transito</TabsTrigger>
                <TabsTrigger value="delivered">Entregues</TabsTrigger>
                <TabsTrigger value="cancelled">Cancelados</TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar pedido..."
                  className="w-64 pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
              <Button onClick={handleSearch} variant="secondary">
                Buscar
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : orders.length === 0 ? (
            <div className="flex items-center justify-center h-64 text-muted-foreground">
              Nenhum pedido encontrado
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Pedido</TableHead>
                    <TableHead>Produto</TableHead>
                    <TableHead>Comprador</TableHead>
                    <TableHead>Vendedor</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Comissao</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell>
                        <div>
                          <span className="font-medium">{order.order_number || `#${order.id.slice(0, 8)}`}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {order.product_image ? (
                            <img
                              src={order.product_image}
                              alt={order.product_title || 'Produto'}
                              className="h-10 w-10 rounded object-cover"
                            />
                          ) : (
                            <div className="flex h-10 w-10 items-center justify-center rounded bg-muted">
                              <Image className="h-4 w-4 text-muted-foreground" />
                            </div>
                          )}
                          <span className="text-sm">{order.product_title || 'Produto'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{order.buyer_name || '-'}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{order.seller_name || '-'}</span>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">{formatCurrency(order.product_price ?? order.total_amount)}</span>
                        {order.product_price != null && (
                          <p className="text-xs text-muted-foreground">
                            + {formatCurrency(order.shipping_price || 0)} frete
                          </p>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-primary font-medium">{formatCurrency(order.commission_amount)}</span>
                        {order.commission_rate != null && (
                          <p className="text-xs text-muted-foreground">
                            {Math.round(Number(order.commission_rate) * 100)}% da peça
                          </p>
                        )}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(order.status)}
                        {order.shipping_code && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            {order.shipping_code}
                          </p>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {formatDateTime(order.created_at)}
                        </span>
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
                            <DropdownMenuItem onClick={() => handleViewDetails(order.id)}>
                              <Eye className="mr-2 h-4 w-4" />
                              Ver Detalhes
                            </DropdownMenuItem>
                            {order.shipping_code && (
                              <DropdownMenuItem>
                                <MapPin className="mr-2 h-4 w-4" />
                                Rastrear
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            {order.status === 'pending_payment' && (
                              <DropdownMenuItem onClick={() => handleUpdateStatus(order, 'pending_shipment')}>
                                <DollarSign className="mr-2 h-4 w-4" />
                                Confirmar Pagamento
                              </DropdownMenuItem>
                            )}
                            {order.status === 'pending_shipment' && (
                              <DropdownMenuItem onClick={() => handleUpdateStatus(order, 'shipped')}>
                                <Truck className="mr-2 h-4 w-4" />
                                Marcar como Enviado
                              </DropdownMenuItem>
                            )}
                            {order.status === 'shipped' && (
                              <DropdownMenuItem onClick={() => handleUpdateStatus(order, 'delivered')}>
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Marcar como Entregue
                              </DropdownMenuItem>
                            )}
                            {order.status !== 'cancelled' && order.status !== 'delivered' && (
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => handleUpdateStatus(order, 'cancelled')}
                              >
                                <XCircle className="mr-2 h-4 w-4" />
                                Cancelar Pedido
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Mostrando {((pagination.page - 1) * pagination.limit) + 1} a {Math.min(pagination.page * pagination.limit, pagination.total)} de {pagination.total} pedidos
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page <= 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="flex items-center px-3 text-sm">
                      Pagina {pagination.page} de {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page >= totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Order Details Modal */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes do Pedido</DialogTitle>
            <DialogDescription>
              {selectedOrder?.order_number || `#${selectedOrder?.id?.slice(0, 8)}`}
            </DialogDescription>
          </DialogHeader>
          {detailsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : selectedOrder && (
            <div className="space-y-6">
              {/* Product Images */}
              {selectedOrder.product_images && selectedOrder.product_images.length > 0 && (
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {selectedOrder.product_images.map((img, idx) => (
                    <img
                      key={idx}
                      src={img}
                      alt={`Produto ${idx + 1}`}
                      className="h-24 w-24 rounded-lg object-cover flex-shrink-0"
                    />
                  ))}
                </div>
              )}

              {/* Order Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <p>{getStatusBadge(selectedOrder.status)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Data do Pedido</label>
                  <p>{formatDateTime(selectedOrder.created_at)}</p>
                </div>
              </div>

              {/* Product Details */}
              <div className="border rounded-lg p-4">
                <h4 className="font-medium mb-3">Produto</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Titulo</label>
                    <p>{selectedOrder.product_title || '-'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Marca/Tamanho</label>
                    <p>{selectedOrder.product_brand || '-'} {selectedOrder.product_size ? `/ ${selectedOrder.product_size}` : ''}</p>
                  </div>
                </div>
              </div>

              {/* Financial */}
              <div className="border rounded-lg p-4">
                <h4 className="font-medium mb-3">Valores</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Total</label>
                    <p className="text-lg font-bold">{formatCurrency(selectedOrder.total_amount)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Comissao</label>
                    <p className="text-lg font-bold text-primary">{formatCurrency(selectedOrder.commission_amount)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Vendedor Recebe</label>
                    <p className="text-lg font-bold text-green-600">{formatCurrency(selectedOrder.seller_receives)}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-3 pt-3 border-t">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Frete</label>
                    <p>{formatCurrency(selectedOrder.shipping_price)}</p>
                  </div>
                  {selectedOrder.shipping_code && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Codigo de Rastreio</label>
                      <p className="font-mono">{selectedOrder.shipping_code}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Buyer and Seller */}
              <div className="grid grid-cols-2 gap-4">
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <User className="h-4 w-4" /> Comprador
                  </h4>
                  <div className="space-y-2">
                    <p className="font-medium">{selectedOrder.buyer_name || '-'}</p>
                    {selectedOrder.buyer_email && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Mail className="h-3 w-3" /> {selectedOrder.buyer_email}
                      </p>
                    )}
                    {selectedOrder.buyer_phone && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Phone className="h-3 w-3" /> {selectedOrder.buyer_phone}
                      </p>
                    )}
                  </div>
                </div>
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <User className="h-4 w-4" /> Vendedor
                  </h4>
                  <div className="space-y-2">
                    <p className="font-medium">{selectedOrder.seller_name || '-'}</p>
                    {selectedOrder.seller_email && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Mail className="h-3 w-3" /> {selectedOrder.seller_email}
                      </p>
                    )}
                    {selectedOrder.seller_phone && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Phone className="h-3 w-3" /> {selectedOrder.seller_phone}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Shipping Address */}
              {selectedOrder.street && (
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <MapPin className="h-4 w-4" /> Endereco de Entrega
                  </h4>
                  <div className="space-y-1 text-sm">
                    {selectedOrder.recipient_name && (
                      <p className="font-medium">{selectedOrder.recipient_name}</p>
                    )}
                    <p>{selectedOrder.street}, {selectedOrder.number} {selectedOrder.complement && `- ${selectedOrder.complement}`}</p>
                    <p>{selectedOrder.neighborhood}</p>
                    <p>{selectedOrder.city} - {selectedOrder.state}</p>
                    <p>CEP: {selectedOrder.zipcode}</p>
                  </div>
                </div>
              )}

              {/* Status Update */}
              <div className="border-t pt-4">
                <h4 className="font-medium mb-3">Atualizar Status</h4>
                <div className="flex gap-2">
                  <Select
                    value={selectedOrder.status}
                    onValueChange={(value) => handleUpdateStatus(selectedOrder, value)}
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending_payment">Aguardando Pagamento</SelectItem>
                      <SelectItem value="pending_shipment">Aguardando Envio</SelectItem>
                      <SelectItem value="shipped">Enviado</SelectItem>
                      <SelectItem value="delivered">Entregue</SelectItem>
                      <SelectItem value="cancelled">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

