import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatDateTime } from '@/lib/utils'
import { getAdminNotifications, AdminNotification } from '@/lib/api'
import {
  Bell,
  Mail,
  MessageSquare,
  RefreshCw,
  Loader2,
  AlertCircle,
} from 'lucide-react'

function getTypeBadge(type: string) {
  switch (type) {
    case 'sale':
      return <Badge variant="success">Venda</Badge>
    case 'shipping':
      return <Badge variant="info">Envio</Badge>
    case 'payment':
      return <Badge variant="warning">Pagamento</Badge>
    default:
      return <Badge variant="secondary">{type}</Badge>
  }
}

export default function Communications() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notifications, setNotifications] = useState<AdminNotification[]>([])
  const [stats, setStats] = useState({ total: 0, unread: 0 })

  const fetchData = async () => {
    setLoading(true)
    setError(null)

    try {
      const res = await getAdminNotifications({ limit: 50 })
      if (res.success) {
        setNotifications(res.notifications || [])
        setStats(res.stats)
      }
    } catch (err: any) {
      console.error('Erro ao carregar notificacoes:', err)
      setError(err.message || 'Erro ao carregar notificacoes')
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
        <p className="text-lg font-medium">Erro ao carregar notificacoes</p>
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
          <h1 className="text-3xl font-bold tracking-tight">Comunicacoes</h1>
          <p className="text-muted-foreground">Notificacoes do sistema</p>
        </div>
        <Button variant="outline" onClick={fetchData} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="rounded-lg bg-blue-100 p-3 text-blue-600">
              <Bell className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="rounded-lg bg-orange-100 p-3 text-orange-600">
              <Mail className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Nao lidas</p>
              <p className="text-2xl font-bold">{stats.unread}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="rounded-lg bg-green-100 p-3 text-green-600">
              <MessageSquare className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Lidas</p>
              <p className="text-2xl font-bold">{Math.max(stats.total - stats.unread, 0)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Notificacoes</CardTitle>
          <CardDescription>Ultimas notificacoes do sistema</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : notifications.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Titulo</TableHead>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {notifications.map((notification) => (
                  <TableRow key={notification.id}>
                    <TableCell>{getTypeBadge(notification.type)}</TableCell>
                    <TableCell className="font-medium">{notification.title}</TableCell>
                    <TableCell>{notification.user_name || notification.user_email || '-'}</TableCell>
                    <TableCell>
                      {notification.is_read ? <Badge variant="secondary">Lida</Badge> : <Badge variant="warning">Nao lida</Badge>}
                    </TableCell>
                    <TableCell>{formatDateTime(notification.created_at)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-muted-foreground">Nenhuma notificacao encontrada.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
