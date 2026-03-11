import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
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
import { formatCurrency, formatDate, getInitials } from '@/lib/utils'
import { getUsers, getUsersBySubscription, toggleUserStatus, deleteUser, User } from '@/lib/api'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Search,
  Download,
  MoreHorizontal,
  Eye,
  Ban,
  CheckCircle,
  Mail,
  Star,
  Crown,
  Users as UsersIcon,
  TrendingUp,
  ShoppingBag,
  Loader2,
  RefreshCw,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Wallet,
  Building,
  CreditCard,
} from 'lucide-react'

interface StatCardProps {
  title: string
  value: string | number
  icon: React.ReactNode
  trend?: string
  loading?: boolean
}

function StatCard({ title, value, icon, trend, loading }: StatCardProps) {
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
            <>
              <p className="text-2xl font-bold">{value}</p>
              {trend && <p className="text-xs text-green-500">{trend}</p>}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default function Users() {
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0 })
  const [stats, setStats] = useState({
    total: 0,
    premium: 0,
    sellers: 0,
    newToday: 0,
  })
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)

  const fetchUsers = async (page = 1) => {
    setLoading(true)
    setError(null)

    try {
      const [usersRes, subscriptionRes] = await Promise.all([
        getUsers({
          page,
          limit: 20,
          search: searchTerm || undefined,
          subscription: activeTab === 'premium' ? 'premium' : undefined,
          status: activeTab === 'inactive' ? 'inactive' : undefined,
        }),
        getUsersBySubscription(),
      ])

      if (usersRes.success) {
        setUsers(usersRes.users)
        setPagination({
          page: usersRes.pagination.page,
          limit: usersRes.pagination.limit,
          total: usersRes.pagination.total,
        })
        setStats(prev => ({
          ...prev,
          total: usersRes.pagination.total,
        }))
      }

      if (subscriptionRes.success) {
        const premiumCount = subscriptionRes.data.find(s => s.subscription_type === 'premium')?.count || 0
        const premiumPlusCount = subscriptionRes.data.find(s => s.subscription_type === 'premium_plus')?.count || 0
        setStats(prev => ({
          ...prev,
          premium: parseInt(String(premiumCount)) + parseInt(String(premiumPlusCount)),
        }))
      }
    } catch (err: any) {
      console.error('Erro ao carregar usuarios:', err)
      setError(err.message || 'Erro ao carregar usuarios')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [activeTab])

  const handleSearch = () => {
    fetchUsers(1)
  }

  const handleToggleStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const res = await toggleUserStatus(userId)
      if (res.success) {
        setUsers(users.map(u =>
          u.id === userId ? { ...u, is_active: res.is_active } : u
        ))
      }
    } catch (err) {
      console.error('Erro ao alterar status:', err)
    }
  }

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`Tem certeza que deseja excluir o usuario "${userName}"? Esta acao nao pode ser desfeita.`)) {
      return
    }
    try {
      const res = await deleteUser(userId)
      if (res.success) {
        setUsers(users.filter(u => u.id !== userId))
      }
    } catch (err) {
      console.error('Erro ao excluir usuario:', err)
    }
  }

  const handlePageChange = (newPage: number) => {
    fetchUsers(newPage)
  }

  const handleViewDetails = (user: User) => {
    setSelectedUser(user)
    setDetailsOpen(true)
  }

  const getPixKeyTypeLabel = (type?: string) => {
    const labels: Record<string, string> = {
      cpf: 'CPF',
      cnpj: 'CNPJ',
      email: 'E-mail',
      phone: 'Telefone',
      random: 'Chave Aleatoria',
    }
    return labels[type || ''] || type || '-'
  }

  const getAccountTypeLabel = (type?: string) => {
    return type === 'poupanca' ? 'Poupanca' : type === 'corrente' ? 'Corrente' : '-'
  }

  const hasPaymentInfo = (user: User) => {
    return !!(user.pix_key || user.bank_account)
  }

  const filteredUsers = users.filter(user => {
    if (activeTab === 'sellers') return (user.sales_count || 0) > 0
    return true
  })

  const totalPages = Math.ceil(pagination.total / pagination.limit)

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <p className="text-lg font-medium">Erro ao carregar usuarios</p>
        <p className="text-sm text-muted-foreground">{error}</p>
        <Button onClick={() => fetchUsers()} variant="outline" className="gap-2">
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
          <h1 className="text-3xl font-bold tracking-tight">Usuarios</h1>
          <p className="text-muted-foreground">
            Gerencie os usuarios do marketplace
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => fetchUsers(pagination.page)}>
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
          title="Total de Usuarios"
          value={stats.total.toLocaleString('pt-BR')}
          icon={<UsersIcon className="h-6 w-6" />}
          loading={loading}
        />
        <StatCard
          title="Usuarios Premium"
          value={stats.premium.toLocaleString('pt-BR')}
          icon={<Crown className="h-6 w-6" />}
          loading={loading}
        />
        <StatCard
          title="Vendedores Ativos"
          value={filteredUsers.filter(u => (u.sales_count || 0) > 0).length.toString()}
          icon={<ShoppingBag className="h-6 w-6" />}
          loading={loading}
        />
        <StatCard
          title="Novos Este Mes"
          value={users.filter(u => {
            const created = new Date(u.created_at)
            const now = new Date()
            return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear()
          }).length.toString()}
          icon={<TrendingUp className="h-6 w-6" />}
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
                <TabsTrigger value="premium">Premium</TabsTrigger>
                <TabsTrigger value="sellers">Vendedores</TabsTrigger>
                <TabsTrigger value="inactive">Inativos</TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar usuario..."
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
          ) : filteredUsers.length === 0 ? (
            <div className="flex items-center justify-center h-64 text-muted-foreground">
              Nenhum usuario encontrado
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Localizacao</TableHead>
                    <TableHead>Plano</TableHead>
                    <TableHead>Saldo</TableHead>
                    <TableHead>Pagamento</TableHead>
                    <TableHead>Avaliacao</TableHead>
                    <TableHead>Vendas</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Desde</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={user.avatar_url || undefined} />
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {getInitials(user.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{user.name}</span>
                            </div>
                            <span className="text-sm text-muted-foreground">{user.email}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{user.city || '-'}{user.state ? `, ${user.state}` : ''}</span>
                      </TableCell>
                      <TableCell>
                        {user.subscription_type === 'premium' || user.subscription_type === 'premium_plus' ? (
                          <Badge className="gap-1 bg-gradient-to-r from-amber-500 to-yellow-500">
                            <Crown className="h-3 w-3" />
                            {user.subscription_type === 'premium_plus' ? 'Premium+' : 'Premium'}
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Free</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">{formatCurrency(user.balance || 0)}</span>
                      </TableCell>
                      <TableCell>
                        {hasPaymentInfo(user) ? (
                          <Badge variant="success" className="gap-1">
                            <Wallet className="h-3 w-3" />
                            {user.pix_key ? 'PIX' : 'Banco'}
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="gap-1">
                            Pendente
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span>{(parseFloat(String(user.seller_rating)) || 0).toFixed(1)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span>{user.sales_count || 0}</span>
                      </TableCell>
                      <TableCell>
                        {user.is_active ? (
                          <Badge variant="success">Ativo</Badge>
                        ) : (
                          <Badge variant="destructive">Inativo</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {formatDate(user.created_at)}
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
                            <DropdownMenuItem onClick={() => handleViewDetails(user)}>
                              <Eye className="mr-2 h-4 w-4" />
                              Ver Perfil
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Mail className="mr-2 h-4 w-4" />
                              Enviar E-mail
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {user.is_active ? (
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => handleToggleStatus(user.id, user.is_active)}
                              >
                                <Ban className="mr-2 h-4 w-4" />
                                Bloquear Usuario
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                className="text-green-600"
                                onClick={() => handleToggleStatus(user.id, user.is_active)}
                              >
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Ativar Usuario
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => handleDeleteUser(user.id, user.name)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Excluir Usuario
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
                    Mostrando {((pagination.page - 1) * pagination.limit) + 1} a {Math.min(pagination.page * pagination.limit, pagination.total)} de {pagination.total} usuarios
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

      {/* User Details Modal */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes do Usuario</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-6">
              {/* User Info */}
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={selectedUser.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary text-xl">
                    {getInitials(selectedUser.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-semibold">{selectedUser.name}</h3>
                  <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                  {selectedUser.phone && (
                    <p className="text-sm text-muted-foreground">{selectedUser.phone}</p>
                  )}
                </div>
              </div>

              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Localizacao</p>
                  <p>{selectedUser.city || '-'}{selectedUser.state ? `, ${selectedUser.state}` : ''}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">CPF</p>
                  <p>{selectedUser.cpf || 'Nao informado'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Saldo</p>
                  <p className="font-semibold text-green-600">{formatCurrency(selectedUser.balance || 0)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Vendas</p>
                  <p>{selectedUser.sales_count || 0}</p>
                </div>
              </div>

              {/* Payment Info */}
              <div className="border-t pt-4">
                <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
                  <Wallet className="h-4 w-4" />
                  Dados para Pagamento
                </h4>

                {/* PIX Info */}
                <div className="bg-muted/50 rounded-lg p-4 mb-4">
                  <div className="flex items-center gap-2 mb-3">
                    <CreditCard className="h-4 w-4 text-primary" />
                    <span className="font-medium">PIX</span>
                    {selectedUser.pix_key ? (
                      <Badge variant="success" className="ml-auto">Configurado</Badge>
                    ) : (
                      <Badge variant="secondary" className="ml-auto">Nao configurado</Badge>
                    )}
                  </div>
                  {selectedUser.pix_key ? (
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-muted-foreground">Tipo de Chave</p>
                        <p className="font-medium">{getPixKeyTypeLabel(selectedUser.pix_key_type)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Chave PIX</p>
                        <p className="font-medium font-mono">{selectedUser.pix_key}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Usuario nao cadastrou chave PIX</p>
                  )}
                </div>

                {/* Bank Info */}
                <div className="bg-muted/50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Building className="h-4 w-4 text-primary" />
                    <span className="font-medium">Conta Bancaria</span>
                    {selectedUser.bank_account ? (
                      <Badge variant="success" className="ml-auto">Configurado</Badge>
                    ) : (
                      <Badge variant="secondary" className="ml-auto">Nao configurado</Badge>
                    )}
                  </div>
                  {selectedUser.bank_account ? (
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-muted-foreground">Banco</p>
                        <p className="font-medium">{selectedUser.bank_name || selectedUser.bank_code || '-'}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Agencia</p>
                        <p className="font-medium">{selectedUser.bank_agency || '-'}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Conta</p>
                        <p className="font-medium">{selectedUser.bank_account}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Tipo</p>
                        <p className="font-medium">{getAccountTypeLabel(selectedUser.bank_account_type)}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Usuario nao cadastrou conta bancaria</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
