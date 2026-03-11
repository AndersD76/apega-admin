import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
import { formatCurrency, formatDate } from '@/lib/utils'
import {
  getProducts,
  getProductDetails,
  approveProduct,
  rejectProduct,
  deleteProduct,
  getCategories,
  Product,
} from '@/lib/api'
import {
  Search,
  Download,
  MoreHorizontal,
  Eye,
  CheckCircle,
  XCircle,
  Trash2,
  Star,
  ShoppingBag,
  Clock,
  Package,
  TrendingUp,
  Heart,
  Image,
  Loader2,
  RefreshCw,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react'

function getStatusBadge(status: string) {
  switch (status) {
    case 'active':
      return <Badge variant="success" className="gap-1"><CheckCircle className="h-3 w-3" /> Ativo</Badge>
    case 'pending':
      return <Badge variant="warning" className="gap-1"><Clock className="h-3 w-3" /> Pendente</Badge>
    case 'sold':
      return <Badge variant="info" className="gap-1"><Package className="h-3 w-3" /> Vendido</Badge>
    case 'rejected':
      return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" /> Rejeitado</Badge>
    case 'paused':
      return <Badge variant="secondary" className="gap-1"><Clock className="h-3 w-3" /> Pausado</Badge>
    default:
      return <Badge>{status}</Badge>
  }
}

function getConditionBadge(condition: string) {
  switch (condition) {
    case 'novo':
      return <Badge variant="success">Novo</Badge>
    case 'seminovo':
      return <Badge variant="info">Seminovo</Badge>
    case 'usado':
      return <Badge variant="secondary">Usado</Badge>
    default:
      return <Badge variant="outline">{condition}</Badge>
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

export default function Products() {
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([])
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0 })
  const [stats, setStats] = useState({ active: 0, pending: 0, sold: 0, total: 0 })
  const [selectedProduct, setSelectedProduct] = useState<(Product & { images?: string[] }) | null>(null)
  const [detailsLoading, setDetailsLoading] = useState(false)

  const fetchProducts = async (page = 1) => {
    setLoading(true)
    setError(null)

    try {
      const [productsRes, categoriesRes] = await Promise.all([
        getProducts({
          page,
          limit: 20,
          search: searchTerm || undefined,
          status: activeTab === 'all' ? undefined : activeTab,
        }),
        getCategories(),
      ])

      if (productsRes.success) {
        setProducts(productsRes.products)
        setStats(productsRes.stats)
        setPagination({
          page: productsRes.pagination.page,
          limit: productsRes.pagination.limit,
          total: productsRes.pagination.total,
        })
      }

      if (categoriesRes.success) {
        setCategories(categoriesRes.categories)
      }
    } catch (err: any) {
      console.error('Erro ao carregar produtos:', err)
      setError(err.message || 'Erro ao carregar produtos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [activeTab])

  const handleSearch = () => {
    fetchProducts(1)
  }

  const handleViewDetails = async (productId: string) => {
    setDetailsLoading(true)
    try {
      const res = await getProductDetails(productId)
      if (res.success) {
        setSelectedProduct(res.product)
      }
    } catch (err) {
      console.error('Erro ao carregar detalhes:', err)
    } finally {
      setDetailsLoading(false)
    }
  }

  const handleApprove = async (productId: string) => {
    try {
      const res = await approveProduct(productId)
      if (res.success) {
        setProducts(products.map(p =>
          p.id === productId ? { ...p, status: 'active' as const } : p
        ))
      }
    } catch (err) {
      console.error('Erro ao aprovar produto:', err)
    }
  }

  const handleReject = async (productId: string) => {
    const reason = prompt('Motivo da rejeicao:')
    if (!reason) return

    try {
      const res = await rejectProduct(productId, reason)
      if (res.success) {
        setProducts(products.map(p =>
          p.id === productId ? { ...p, status: 'rejected' as const } : p
        ))
      }
    } catch (err) {
      console.error('Erro ao rejeitar produto:', err)
    }
  }

  const handleDelete = async (productId: string, title: string) => {
    if (!confirm(`Tem certeza que deseja excluir "${title}"?`)) return

    try {
      const res = await deleteProduct(productId)
      if (res.success) {
        setProducts(products.filter(p => p.id !== productId))
      }
    } catch (err) {
      console.error('Erro ao excluir produto:', err)
    }
  }

  const handlePageChange = (newPage: number) => {
    fetchProducts(newPage)
  }

  const filteredProducts = categoryFilter === 'all'
    ? products
    : products.filter(p => p.category_name === categoryFilter)

  const totalPages = Math.ceil(pagination.total / pagination.limit)

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <p className="text-lg font-medium">Erro ao carregar produtos</p>
        <p className="text-sm text-muted-foreground">{error}</p>
        <Button onClick={() => fetchProducts()} variant="outline" className="gap-2">
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
          <h1 className="text-3xl font-bold tracking-tight">Produtos</h1>
          <p className="text-muted-foreground">
            Gerencie os produtos do marketplace
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => fetchProducts(pagination.page)}>
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
          title="Total de Produtos"
          value={stats.total.toLocaleString('pt-BR')}
          icon={<ShoppingBag className="h-6 w-6" />}
          loading={loading}
        />
        <StatCard
          title="Aguardando Aprovacao"
          value={stats.pending.toLocaleString('pt-BR')}
          icon={<Clock className="h-6 w-6" />}
          loading={loading}
        />
        <StatCard
          title="Produtos Ativos"
          value={stats.active.toLocaleString('pt-BR')}
          icon={<TrendingUp className="h-6 w-6" />}
          loading={loading}
        />
        <StatCard
          title="Vendidos"
          value={stats.sold.toLocaleString('pt-BR')}
          icon={<Heart className="h-6 w-6" />}
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
                <TabsTrigger value="pending">Pendentes</TabsTrigger>
                <TabsTrigger value="active">Ativos</TabsTrigger>
                <TabsTrigger value="sold">Vendidos</TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar produto..."
                  className="w-64 pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {categories.map(cat => (
                    <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
          ) : filteredProducts.length === 0 ? (
            <div className="flex items-center justify-center h-64 text-muted-foreground">
              Nenhum produto encontrado
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produto</TableHead>
                    <TableHead>Vendedor</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Preco</TableHead>
                    <TableHead>Condicao</TableHead>
                    <TableHead>Views</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {product.image_url ? (
                            <img
                              src={product.image_url}
                              alt={product.title}
                              className="h-12 w-12 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
                              <Image className="h-5 w-5 text-muted-foreground" />
                            </div>
                          )}
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{product.title}</span>
                              {product.is_featured && (
                                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                              )}
                            </div>
                            <span className="text-sm text-muted-foreground">
                              {product.brand || '-'} {product.size ? `• Tam. ${product.size}` : ''}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{product.seller_name || '-'}</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{product.category_name || '-'}</Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <span className="font-medium">{formatCurrency(product.price)}</span>
                          {product.original_price && product.original_price > product.price && (
                            <span className="ml-2 text-xs text-muted-foreground line-through">
                              {formatCurrency(product.original_price)}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getConditionBadge(product.condition)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Eye className="h-4 w-4 text-muted-foreground" />
                          <span>{product.views || 0}</span>
                          <Heart className="ml-2 h-4 w-4 text-muted-foreground" />
                          <span>{product.favorites || 0}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(product.status)}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {formatDate(product.created_at)}
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
                            <DropdownMenuItem onClick={() => handleViewDetails(product.id)}>
                              <Eye className="mr-2 h-4 w-4" />
                              Ver Detalhes
                            </DropdownMenuItem>
                            {product.status === 'pending' && (
                              <>
                                <DropdownMenuItem
                                  className="text-green-600"
                                  onClick={() => handleApprove(product.id)}
                                >
                                  <CheckCircle className="mr-2 h-4 w-4" />
                                  Aprovar
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-red-600"
                                  onClick={() => handleReject(product.id)}
                                >
                                  <XCircle className="mr-2 h-4 w-4" />
                                  Rejeitar
                                </DropdownMenuItem>
                              </>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => handleDelete(product.id, product.title)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Excluir
                            </DropdownMenuItem>
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
                    Mostrando {((pagination.page - 1) * pagination.limit) + 1} a {Math.min(pagination.page * pagination.limit, pagination.total)} de {pagination.total} produtos
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

      {/* Product Details Modal */}
      <Dialog open={!!selectedProduct} onOpenChange={() => setSelectedProduct(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes do Produto</DialogTitle>
            <DialogDescription>
              Informacoes completas do produto
            </DialogDescription>
          </DialogHeader>
          {detailsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : selectedProduct && (
            <div className="space-y-6">
              {/* Images */}
              {selectedProduct.images && selectedProduct.images.length > 0 && (
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {selectedProduct.images.map((img, idx) => (
                    <img
                      key={idx}
                      src={img}
                      alt={`${selectedProduct.title} ${idx + 1}`}
                      className="h-32 w-32 rounded-lg object-cover flex-shrink-0"
                    />
                  ))}
                </div>
              )}

              {/* Product Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Titulo</label>
                  <p className="font-medium">{selectedProduct.title}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <p>{getStatusBadge(selectedProduct.status)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Preco</label>
                  <p className="font-medium text-lg">{formatCurrency(selectedProduct.price)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Condicao</label>
                  <p>{getConditionBadge(selectedProduct.condition)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Marca</label>
                  <p>{selectedProduct.brand || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Tamanho</label>
                  <p>{selectedProduct.size || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Cor</label>
                  <p>{selectedProduct.color || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Categoria</label>
                  <p>{selectedProduct.category_name || '-'}</p>
                </div>
              </div>

              {/* Description */}
              {selectedProduct.description && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Descricao</label>
                  <p className="text-sm mt-1">{selectedProduct.description}</p>
                </div>
              )}

              {/* Seller Info */}
              <div className="border-t pt-4">
                <h4 className="font-medium mb-2">Vendedor</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Nome</label>
                    <p>{selectedProduct.seller_name || '-'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Email</label>
                    <p>{selectedProduct.seller_email || '-'}</p>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="border-t pt-4">
                <h4 className="font-medium mb-2">Estatisticas</h4>
                <div className="flex gap-6">
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedProduct.views || 0} visualizacoes</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Heart className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedProduct.favorites || 0} favoritos</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              {selectedProduct.status === 'pending' && (
                <div className="flex gap-2 pt-4 border-t">
                  <Button
                    variant="default"
                    className="flex-1"
                    onClick={() => {
                      handleApprove(selectedProduct.id)
                      setSelectedProduct(null)
                    }}
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Aprovar
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1"
                    onClick={() => {
                      handleReject(selectedProduct.id)
                      setSelectedProduct(null)
                    }}
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Rejeitar
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
