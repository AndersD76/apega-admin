import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
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
import { formatCurrency, formatDate, getInitials, downloadCSV } from '@/lib/utils'
import {
  getUsers,
  getUserDetails,
  toggleUserStatus,
  deleteUser,
  type User,
  type UserDetails,
  type UserStats,
} from '@/lib/api'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
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
  Star,
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
  const [searchParams] = useSearchParams()
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '')
  const [activeTab, setActiveTab] = useState('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0 })
  // Contadores dos cards: vem do backend (`stats` de GET /admin/users), calculado
  // sobre a tabela inteira. Antes eram contados sobre `users`, que e so a pagina
  // corrente de 20 registros — com mais de uma pagina os numeros ficavam errados,
  // e o filtro de aba ainda encolhia a conta.
  const [stats, setStats] = useState<UserStats>({
    total: 0,
    inactive: 0,
    sellers: 0,
    new_this_month: 0,
  })
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  // A listagem nao traz mais CPF, chave PIX nem conta bancaria: esses campos so
  // saem no endpoint de detalhe e ja mascarados. O modal busca sob demanda.
  const [details, setDetails] = useState<UserDetails | null>(null)
  const [detailsLoading, setDetailsLoading] = useState(false)
  const [detailsError, setDetailsError] = useState<string | null>(null)
  // Acoes destrutivas passam por confirmacao (antes, bloquear disparava no clique
  // e excluir usava o `confirm()` do navegador, que nao mostra o erro do backend).
  const [pendingAction, setPendingAction] = useState<
    { kind: 'toggle' | 'delete'; user: User } | null
  >(null)

  // searchOverride: a busca do header navega com ?q= e o fetch precisa do
  // termo novo sem esperar o setState propagar.
  const fetchUsers = async (page = 1, searchOverride?: string) => {
    setLoading(true)
    setError(null)

    try {
      const usersRes = await getUsers({
        page,
        limit: 20,
        search: (searchOverride !== undefined ? searchOverride : searchTerm) || undefined,
        status: activeTab === 'inactive' ? 'inactive' : undefined,
      })

      if (usersRes.success) {
        setUsers(usersRes.users)
        setPagination({
          page: usersRes.pagination.page,
          limit: usersRes.pagination.limit,
          total: usersRes.pagination.total,
        })
        if (usersRes.stats) {
          setStats({
            total: Number(usersRes.stats.total) || 0,
            inactive: Number(usersRes.stats.inactive) || 0,
            sellers: Number(usersRes.stats.sellers) || 0,
            new_this_month: Number(usersRes.stats.new_this_month) || 0,
          })
        }
      }

    } catch (err: any) {
      console.error('Erro ao carregar usuarios:', err)
      setError(err.message || 'Erro ao carregar usuarios')
    } finally {
      setLoading(false)
    }
  }

  const urlQuery = searchParams.get('q') || ''

  useEffect(() => {
    setSearchTerm(urlQuery)
  }, [urlQuery])

  useEffect(() => {
    fetchUsers(1, urlQuery)
  }, [activeTab, urlQuery])

  const handleSearch = () => {
    fetchUsers(1)
  }

  // Sem try/catch: o erro sobe para o ConfirmDialog, que o exibe. O backend
  // recusa acao sobre a propria conta e sobre outro admin, e essa mensagem
  // precisa chegar ao operador — antes ia so para o console.
  const handleToggleStatus = async (userId: string) => {
    const res = await toggleUserStatus(userId)
    if (res.success) {
      setUsers(prev => prev.map(u => (u.id === userId ? { ...u, is_active: res.is_active } : u)))
    }
  }

  const handleDeleteUser = async (userId: string) => {
    const res = await deleteUser(userId)
    if (res.success) {
      setUsers(prev => prev.filter(u => u.id !== userId))
      setStats(prev => ({ ...prev, total: Math.max(0, prev.total - 1) }))
    }
  }

  // Exporta a pagina carregada. Nao ha rota de export no backend, entao o CSV sai
  // do que esta na tela — e o cabecalho diz isso para ninguem achar que baixou a
  // base inteira. Dados sensiveis ficam de fora de proposito: a listagem so tem
  // os booleanos de PIX/banco.
  const handleExport = () => {
    downloadCSV(
      `usuarios-pagina-${pagination.page}.csv`,
      ['Nome', 'E-mail', 'Telefone', 'Cidade', 'UF', 'Saldo', 'Avaliacao', 'Vendas', 'PIX cadastrado', 'Conta bancaria', 'Status', 'Cadastro'],
      filteredUsers.map(u => [
        u.name,
        u.email,
        u.phone || '',
        u.city || '',
        u.state || '',
        Number(u.balance || 0).toFixed(2).replace('.', ','),
        (parseFloat(String(u.seller_rating)) || 0).toFixed(1).replace('.', ','),
        u.sales_count || 0,
        u.has_pix ? 'Sim' : 'Nao',
        u.has_bank_account ? 'Sim' : 'Nao',
        u.is_active ? 'Ativo' : 'Inativo',
        formatDate(u.created_at),
      ]),
    )
  }

  const handlePageChange = (newPage: number) => {
    fetchUsers(newPage)
  }

  const handleViewDetails = async (user: User) => {
    setSelectedUser(user)
    setDetails(null)
    setDetailsError(null)
    setDetailsOpen(true)
    setDetailsLoading(true)
    try {
      const res = await getUserDetails(user.id)
      if (res.success) setDetails(res.user)
    } catch (err: any) {
      setDetailsError(err?.message || 'Nao foi possivel carregar os dados do usuario')
    } finally {
      setDetailsLoading(false)
    }
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

  // A listagem devolve apenas `has_pix` e `has_bank_account`. Ler `pix_key` aqui
  // dava sempre `undefined` desde que o backend parou de expor o dado, e a coluna
  // marcava todo mundo como "Pendente".
  const hasPaymentInfo = (user: User) => !!(user.has_pix || user.has_bank_account)

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
          <Button variant="outline" onClick={handleExport} disabled={loading || filteredUsers.length === 0}>
            <Download className="mr-2 h-4 w-4" />
            Exportar CSV
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          title="Total de Usuarios"
          value={stats.total.toLocaleString('pt-BR')}
          icon={<UsersIcon className="h-6 w-6" />}
          loading={loading}
        />
        <StatCard
          title="Vendedores Ativos"
          value={stats.sellers.toLocaleString('pt-BR')}
          icon={<ShoppingBag className="h-6 w-6" />}
          loading={loading}
        />
        <StatCard
          title="Novos Este Mes"
          value={stats.new_this_month.toLocaleString('pt-BR')}
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
                        <span className="font-medium">{formatCurrency(user.balance || 0)}</span>
                      </TableCell>
                      <TableCell>
                        {hasPaymentInfo(user) ? (
                          <Badge variant="success" className="gap-1">
                            <Wallet className="h-3 w-3" />
                            {user.has_pix ? 'PIX' : 'Banco'}
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
                            {/* "Enviar E-mail" saiu daqui: nunca teve onClick nem
                                rota no backend, e um item de menu que nao faz nada
                                so gasta o clique de quem precisa avisar o usuario. */}
                            <DropdownMenuSeparator />
                            {user.is_active ? (
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => setPendingAction({ kind: 'toggle', user })}
                              >
                                <Ban className="mr-2 h-4 w-4" />
                                Bloquear Usuario
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                className="text-green-600"
                                onClick={() => setPendingAction({ kind: 'toggle', user })}
                              >
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Ativar Usuario
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => setPendingAction({ kind: 'delete', user })}
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

          {/*
            Documento, chave PIX e conta bancaria NAO vem mais na listagem: o
            backend deixou de trafegar o cadastro completo de todo mundo a cada
            pagina. Aqui buscamos o detalhe do usuario aberto, ja mascarado pelo
            backend — serve para conferir "e essa a chave?" sem expor o dado.
          */}
          {detailsLoading && (
            <div className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" /> Carregando dados do usuario...
            </div>
          )}

          {detailsError && (
            <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {detailsError}
            </div>
          )}

          {selectedUser && !detailsLoading && (
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
                  {/* Chega mascarado do backend (ex.: `***.***.*89-00`). */}
                  <p className="font-mono">{details?.cpf || 'Nao informado'}</p>
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
                    {(details?.has_pix ?? selectedUser.has_pix) ? (
                      <Badge variant="success" className="ml-auto">Configurado</Badge>
                    ) : (
                      <Badge variant="secondary" className="ml-auto">Nao configurado</Badge>
                    )}
                  </div>
                  {(details?.has_pix ?? selectedUser.has_pix) ? (
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-muted-foreground">Tipo de Chave</p>
                        <p className="font-medium">{getPixKeyTypeLabel(details?.pix_key_type)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Chave PIX (mascarada)</p>
                        <p className="font-medium font-mono">{details?.pix_key || '-'}</p>
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
                    {(details?.has_bank_account ?? selectedUser.has_bank_account) ? (
                      <Badge variant="success" className="ml-auto">Configurado</Badge>
                    ) : (
                      <Badge variant="secondary" className="ml-auto">Nao configurado</Badge>
                    )}
                  </div>
                  {(details?.has_bank_account ?? selectedUser.has_bank_account) ? (
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-muted-foreground">Banco</p>
                        <p className="font-medium">{details?.bank_name || details?.bank_code || '-'}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Agencia (mascarada)</p>
                        <p className="font-medium font-mono">{details?.bank_agency || '-'}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Conta (mascarada)</p>
                        <p className="font-medium font-mono">{details?.bank_account || '-'}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Tipo</p>
                        <p className="font-medium">{getAccountTypeLabel(details?.bank_account_type)}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Usuario nao cadastrou conta bancaria</p>
                  )}
                  <p className="mt-3 text-xs text-muted-foreground">
                    Os dados sensiveis chegam mascarados do backend. O painel nunca recebe o valor completo.
                  </p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/*
        Bloquear/ativar e excluir sao acoes destrutivas: bloquear derruba o acesso
        do vendedor e excluir e irreversivel. Antes uma disparava no primeiro clique
        e a outra usava o `confirm()` do navegador, que nao mostra a recusa do
        backend ("nao e possivel alterar outro administrador", por exemplo).
      */}
      <ConfirmDialog
        open={!!pendingAction}
        onOpenChange={(open) => { if (!open) setPendingAction(null) }}
        variant={pendingAction?.kind === 'delete' || pendingAction?.user.is_active ? 'destructive' : 'default'}
        title={
          pendingAction?.kind === 'delete'
            ? 'Excluir usuario?'
            : pendingAction?.user.is_active
              ? 'Bloquear usuario?'
              : 'Ativar usuario?'
        }
        confirmLabel={
          pendingAction?.kind === 'delete'
            ? 'Excluir'
            : pendingAction?.user.is_active
              ? 'Bloquear'
              : 'Ativar'
        }
        description={
          pendingAction ? (
            <div className="space-y-2">
              <p>
                <strong>{pendingAction.user.name}</strong> — {pendingAction.user.email}
              </p>
              {pendingAction.kind === 'delete' ? (
                <p>
                  A conta e removida do painel e o usuario perde o acesso. Esta acao nao pode ser desfeita.
                </p>
              ) : pendingAction.user.is_active ? (
                <p>O usuario perde o acesso ao app e os anuncios dele saem do ar ate ser reativado.</p>
              ) : (
                <p>O usuario volta a acessar o app normalmente.</p>
              )}
            </div>
          ) : null
        }
        onConfirm={async () => {
          if (!pendingAction) return
          if (pendingAction.kind === 'delete') {
            await handleDeleteUser(pendingAction.user.id)
          } else {
            await handleToggleStatus(pendingAction.user.id)
          }
          setPendingAction(null)
        }}
      />
    </div>
  )
}
