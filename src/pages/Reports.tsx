import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
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
  DialogFooter,
} from '@/components/ui/dialog'
import { formatDateTime } from '@/lib/utils'
import { getReports, resolveReport, Report } from '@/lib/api'
import {
  AlertTriangle,
  Search,
  MoreHorizontal,
  Eye,
  Ban,
  CheckCircle,
  Clock,
  Flag,
  User,
  ShoppingBag,
  Loader2,
  RefreshCw,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  XCircle,
} from 'lucide-react'

function getStatusBadge(status: string) {
  switch (status) {
    case 'pending':
      return <Badge variant="warning" className="gap-1"><Clock className="h-3 w-3" /> Pendente</Badge>
    case 'resolved':
      return <Badge variant="success" className="gap-1"><CheckCircle className="h-3 w-3" /> Resolvido</Badge>
    case 'dismissed':
      return <Badge variant="secondary" className="gap-1"><XCircle className="h-3 w-3" /> Descartado</Badge>
    default:
      return <Badge>{status}</Badge>
  }
}

interface StatCardProps {
  title: string
  value: string | number
  icon: React.ReactNode
  iconBg: string
  iconColor: string
  loading?: boolean
}

function StatCard({ title, value, icon, iconBg, iconColor, loading }: StatCardProps) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-6">
        <div className={`rounded-lg p-3 ${iconBg} ${iconColor}`}>
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

export default function Reports() {
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState('pending')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reports, setReports] = useState<Report[]>([])
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0 })
  const [stats, setStats] = useState({ pending: 0, resolved: 0, dismissed: 0 })
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)
  const [resolutionNotes, setResolutionNotes] = useState('')
  const [resolving, setResolving] = useState(false)

  const fetchReports = async (page = 1) => {
    setLoading(true)
    setError(null)

    try {
      const res = await getReports({
        page,
        limit: 20,
        status: activeTab === 'all' ? undefined : activeTab,
      })

      if (res.success) {
        setReports(res.reports)
        setStats(res.stats)
        setPagination({
          page: res.pagination.page,
          limit: res.pagination.limit,
          total: res.pagination.total,
        })
      }
    } catch (err: any) {
      console.error('Erro ao carregar denuncias:', err)
      setError(err.message || 'Erro ao carregar denuncias')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReports()
  }, [activeTab])

  const handleResolve = async (reportId: string, status: 'resolved' | 'dismissed') => {
    setResolving(true)
    try {
      const res = await resolveReport(reportId, status, resolutionNotes)
      if (res.success) {
        setReports(reports.map(r =>
          r.id === reportId ? { ...r, status, resolution_notes: resolutionNotes } : r
        ))
        setSelectedReport(null)
        setResolutionNotes('')
      }
    } catch (err) {
      console.error('Erro ao resolver denuncia:', err)
    } finally {
      setResolving(false)
    }
  }

  const handlePageChange = (newPage: number) => {
    fetchReports(newPage)
  }

  const filteredReports = reports.filter(report => {
    const matchesSearch = (report.reporter_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (report.reported_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (report.product_title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (report.reason || '').toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

  const totalPages = Math.ceil(pagination.total / pagination.limit)

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <p className="text-lg font-medium">Erro ao carregar denuncias</p>
        <p className="text-sm text-muted-foreground">{error}</p>
        <Button onClick={() => fetchReports()} variant="outline" className="gap-2">
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
          <h1 className="text-3xl font-bold tracking-tight">Denuncias</h1>
          <p className="text-muted-foreground">Gerencie denuncias de usuarios e produtos</p>
        </div>
        <Button variant="outline" onClick={() => fetchReports(pagination.page)}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          title="Pendentes"
          value={stats.pending}
          icon={<Clock className="h-6 w-6" />}
          iconBg="bg-yellow-100"
          iconColor="text-yellow-600"
          loading={loading}
        />
        <StatCard
          title="Resolvidas"
          value={stats.resolved}
          icon={<CheckCircle className="h-6 w-6" />}
          iconBg="bg-green-100"
          iconColor="text-green-600"
          loading={loading}
        />
        <StatCard
          title="Descartadas"
          value={stats.dismissed}
          icon={<XCircle className="h-6 w-6" />}
          iconBg="bg-gray-100"
          iconColor="text-gray-600"
          loading={loading}
        />
      </div>

      {/* Filters and Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="all">Todas</TabsTrigger>
                <TabsTrigger value="pending">Pendentes</TabsTrigger>
                <TabsTrigger value="resolved">Resolvidas</TabsTrigger>
                <TabsTrigger value="dismissed">Descartadas</TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar denuncia..."
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
          ) : filteredReports.length === 0 ? (
            <div className="flex items-center justify-center h-64 text-muted-foreground">
              Nenhuma denuncia encontrada
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Denunciante</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Denunciado</TableHead>
                    <TableHead>Motivo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReports.map((report) => (
                    <TableRow key={report.id}>
                      <TableCell>
                        <div>
                          <span className="font-medium">{report.reporter_name || '-'}</span>
                          <p className="text-xs text-muted-foreground">{report.reporter_email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {report.product_id ? (
                            <><ShoppingBag className="mr-1 h-3 w-3" /> Produto</>
                          ) : (
                            <><User className="mr-1 h-3 w-3" /> Usuario</>
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {report.product_title || report.reported_name || '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="destructive" className="gap-1">
                          <Flag className="h-3 w-3" />
                          {report.reason}
                        </Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(report.status)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDateTime(report.created_at)}
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
                            <DropdownMenuItem onClick={() => setSelectedReport(report)}>
                              <Eye className="mr-2 h-4 w-4" />
                              Ver Detalhes
                            </DropdownMenuItem>
                            {report.status === 'pending' && (
                              <>
                                <DropdownMenuItem
                                  className="text-green-600"
                                  onClick={() => {
                                    setSelectedReport(report)
                                  }}
                                >
                                  <CheckCircle className="mr-2 h-4 w-4" />
                                  Resolver
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-gray-600"
                                  onClick={() => handleResolve(report.id, 'dismissed')}
                                >
                                  <XCircle className="mr-2 h-4 w-4" />
                                  Descartar
                                </DropdownMenuItem>
                              </>
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
                    Mostrando {((pagination.page - 1) * pagination.limit) + 1} a {Math.min(pagination.page * pagination.limit, pagination.total)} de {pagination.total} denuncias
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

      {/* Report Details Modal */}
      <Dialog open={!!selectedReport} onOpenChange={() => setSelectedReport(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Detalhes da Denuncia</DialogTitle>
            <DialogDescription>
              Analise e resolva a denuncia
            </DialogDescription>
          </DialogHeader>
          {selectedReport && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Denunciante</label>
                  <p className="font-medium">{selectedReport.reporter_name}</p>
                  <p className="text-sm text-muted-foreground">{selectedReport.reporter_email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <p>{getStatusBadge(selectedReport.status)}</p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Denunciado</label>
                <p className="font-medium">
                  {selectedReport.product_title || selectedReport.reported_name || '-'}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Motivo</label>
                <p>
                  <Badge variant="destructive" className="gap-1">
                    <Flag className="h-3 w-3" />
                    {selectedReport.reason}
                  </Badge>
                </p>
              </div>

              {selectedReport.description && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Descricao</label>
                  <p className="text-sm">{selectedReport.description}</p>
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-muted-foreground">Data</label>
                <p className="text-sm">{formatDateTime(selectedReport.created_at)}</p>
              </div>

              {selectedReport.status === 'pending' && (
                <div className="border-t pt-4">
                  <label className="text-sm font-medium text-muted-foreground">Notas de Resolucao</label>
                  <Textarea
                    placeholder="Adicione notas sobre a resolucao..."
                    value={resolutionNotes}
                    onChange={(e) => setResolutionNotes(e.target.value)}
                    className="mt-2"
                  />
                </div>
              )}

              {selectedReport.resolution_notes && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Notas de Resolucao</label>
                  <p className="text-sm">{selectedReport.resolution_notes}</p>
                </div>
              )}
            </div>
          )}
          {selectedReport?.status === 'pending' && (
            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => handleResolve(selectedReport.id, 'dismissed')}
                disabled={resolving}
              >
                <XCircle className="mr-2 h-4 w-4" />
                Descartar
              </Button>
              <Button
                onClick={() => handleResolve(selectedReport.id, 'resolved')}
                disabled={resolving}
              >
                {resolving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle className="mr-2 h-4 w-4" />
                )}
                Resolver
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
