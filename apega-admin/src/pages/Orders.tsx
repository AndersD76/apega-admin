import { useState, useEffect } from 'react'
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
import { formatCurrency, formatDateTime } from '@/lib/utils'
import { getOrders, getOrderDetails, updateOrderStatus, Order } from '@/lib/api'
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

function getStatusBadge(status: string) {
  switch (status) {
    case 'pending_payment':
      return <Badge variant="warning" className="gap-1"><Clock className="h-3 w-3" /> Aguardando Pagamento</Badge>
    case 'pending_shipment':
      return <Badge variant="info" className="gap-1"><DollarSign className="h-3 w-3" /> Aguardando Envio</Badge>
    case 'paid':
      return <Badge variant="info" className="gap-1"><DollarSign className="h-3 w-3" /> Pago</Badge>
    case 'shipped':
      return <Badge variant="info" className="gap-1"><Truck className="h-3 w-3" /> Enviado</Badge>
    case 'delivered':
      return <Badge variant="success" className="gap-1"><CheckCircle className="h-3 w-3" /> Entregue</Badge>
    case 'cancelled':
      return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" /> Cancelado</Badge>
    default:
      return <Badge>{status}</Badge>
  }
}

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
  seller_phone?: string
  buyer_avatar?: string
  seller_avatar?: string
}

export default function Orders() {
  const [searchTerm, setSearchTerm] = useState('')
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

  const fetchOrders = async (page = 1) => {
    setLoading(true)
    setError(null)

    try {
      const res = await getOrders({
        page,
        limit: 20,
        status: activeTab === 'all' ? undefined : activeTab,
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

  useEffect(() => {
    fetchOrders()
  }, [activeTab])

  const handleSearch = () => {
    fetchOrders(1)
  }

  const handleViewDetails = async (orderId: string) => {
    setDetailsLoading(true)
    try {
      const res = await getOrderDetails(orderId)
      if (res.success) {
        setSelectedOrder(res.order)
      }
    } catch (err) {
      console.error('Erro ao carregar detalhes:', err)
    } finally {
      setDetailsLoading(false)
    }
  }

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    try {
      const res = await updateOrderStatus(orderId, newStatus)
      if (res.success) {
        setOrders(orders.map(o =>
          o.id === orderId ? { ...o, status: newStatus as Order['status'] } : o
        ))
        if (selectedOrder?.id === orderId) {
          setSelectedOrder({ ...selectedOrder, status: newStatus as Order['status'] })
        }
      }
    } catch (err) {
      console.error('Erro ao atualizar status:', err)
    }
  }

  const handlePageChange = (newPage: number) => {
    fetchOrders(newPage)
  }

  const filteredOrders = orders.filter(order => {
    const matchesSearch = (order.order_number || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (order.buyer_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (order.seller_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (order.product_title || '').toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

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
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
        </div>
      </div>

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
          ) : filteredOrders.length === 0 ? (
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
                  {filteredOrders.map((order) => (
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
                        <span className="font-medium">{formatCurrency(order.total_amount)}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-primary font-medium">{formatCurrency(order.commission_amount)}</span>
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
                              <DropdownMenuItem onClick={() => handleUpdateStatus(order.id, 'pending_shipment')}>
                                <DollarSign className="mr-2 h-4 w-4" />
                                Confirmar Pagamento
                              </DropdownMenuItem>
                            )}
                            {order.status === 'pending_shipment' && (
                              <DropdownMenuItem onClick={() => handleUpdateStatus(order.id, 'shipped')}>
                                <Truck className="mr-2 h-4 w-4" />
                                Marcar como Enviado
                              </DropdownMenuItem>
                            )}
                            {order.status === 'shipped' && (
                              <DropdownMenuItem onClick={() => handleUpdateStatus(order.id, 'delivered')}>
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Marcar como Entregue
                              </DropdownMenuItem>
                            )}
                            {order.status !== 'cancelled' && order.status !== 'delivered' && (
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => handleUpdateStatus(order.id, 'cancelled')}
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
                    onValueChange={(value) => handleUpdateStatus(selectedOrder.id, value)}
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

