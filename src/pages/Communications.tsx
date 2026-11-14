import { useEffect, useRef, useState } from 'react'
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
import {
  getAdminNotifications,
  AdminNotification,
  getAllConversations,
  getConversationThread,
  AdminConversation,
  AdminConversationMessage,
} from '@/lib/api'
import {
  Bell,
  Mail,
  MessageSquare,
  MessageCircle,
  RefreshCw,
  Loader2,
  AlertCircle,
  Search,
  ArrowLeft,
  Eye,
  Headphones,
  Tag,
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

function quando(dateStr?: string | null) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const horas = (Date.now() - date.getTime()) / 36e5
  if (horas < 24) return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  if (horas < 48) return 'Ontem'
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

function reais(valor?: string | number | null) {
  if (valor === null || valor === undefined || valor === '') return ''
  return Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

/**
 * Conversas entre usuários, para moderação.
 *
 * Só leitura, de propósito: a rota não marca nada como lido, então quem está
 * conversando não fica sabendo. Para falar com alguém, use a tela Suporte.
 */
function Conversas() {
  const [lista, setLista] = useState<AdminConversation[]>([])
  const [total, setTotal] = useState(0)
  const [pagina, setPagina] = useState(1)
  const [busca, setBusca] = useState('')
  const [buscaAplicada, setBuscaAplicada] = useState('')
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [aberta, setAberta] = useState<AdminConversation | null>(null)
  const [mensagens, setMensagens] = useState<AdminConversationMessage[]>([])
  const [carregandoMensagens, setCarregandoMensagens] = useState(false)
  const fimRef = useRef<HTMLDivElement>(null)
  const LIMITE = 30

  const carregar = async (p: number, q: string, acumular = false) => {
    setCarregando(true)
    setErro(null)
    try {
      const res = await getAllConversations({ q: q || undefined, page: p, limit: LIMITE })
      if (res.success) {
        setLista((antes) => (acumular ? [...antes, ...res.conversations] : res.conversations))
        setTotal(res.pagination.total)
        setPagina(p)
      }
    } catch (e: any) {
      setErro(e.message || 'Erro ao carregar conversas')
    } finally {
      setCarregando(false)
    }
  }

  // Busca no servidor, com meio segundo de pausa depois de digitar.
  useEffect(() => {
    const t = setTimeout(() => setBuscaAplicada(busca.trim()), 500)
    return () => clearTimeout(t)
  }, [busca])

  useEffect(() => {
    carregar(1, buscaAplicada)
  }, [buscaAplicada])

  const abrir = async (c: AdminConversation) => {
    setAberta(c)
    setCarregandoMensagens(true)
    try {
      const res = await getConversationThread(c.id)
      if (res.success) {
        setAberta(res.conversation)
        setMensagens(res.messages)
      }
    } catch (e: any) {
      setErro(e.message || 'Erro ao abrir a conversa')
    } finally {
      setCarregandoMensagens(false)
    }
  }

  useEffect(() => {
    fimRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mensagens])

  const nome = (c: AdminConversation, lado: 1 | 2) =>
    (lado === 1 ? c.user1_name : c.user2_name) || (lado === 1 ? c.user1_email : c.user2_email) || 'Usuário'

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle>Conversas entre usuários</CardTitle>
            <CardDescription>
              Leitura de moderação. Abrir uma conversa aqui não marca nada como lido para quem está conversando.
              Para responder alguém, use a tela Suporte.
            </CardDescription>
          </div>
          <Badge variant="secondary">{total} conversas</Badge>
        </div>
      </CardHeader>
      <div className="flex border-t" style={{ height: '640px' }}>
        {/* Lista */}
        <div className={`w-96 border-r flex flex-col ${aberta ? 'hidden md:flex' : 'flex w-full md:w-96'}`}>
          <div className="p-3 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                id="busca-conversas"
                type="text"
                placeholder="Nome, e-mail ou peça…"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {erro && (
              <div className="p-4 text-sm text-destructive flex items-center gap-2">
                <AlertCircle className="h-4 w-4" /> {erro}
              </div>
            )}
            {carregando && lista.length === 0 ? (
              <div className="p-8 text-center text-gray-400">Carregando…</div>
            ) : lista.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <MessageCircle className="mx-auto h-12 w-12 mb-2 opacity-30" />
                <p>Nenhuma conversa</p>
              </div>
            ) : (
              lista.map((c) => (
                <button
                  key={c.id}
                  onClick={() => abrir(c)}
                  className={`w-full p-3 flex flex-col gap-1 hover:bg-gray-50 transition border-b text-left ${
                    aberta?.id === c.id ? 'bg-orange-50' : ''
                  }`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <p className="font-semibold text-sm truncate">
                      {nome(c, 1)} <span className="text-gray-400 font-normal">↔</span> {nome(c, 2)}
                    </p>
                    <span className="text-xs text-gray-400 flex-shrink-0">{quando(c.last_message_at)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500 min-w-0">
                    {c.is_support && (
                      <Badge variant="info" className="gap-1 px-1.5 py-0">
                        <Headphones className="h-3 w-3" /> suporte
                      </Badge>
                    )}
                    {c.product_title && (
                      <span className="truncate flex items-center gap-1">
                        <Tag className="h-3 w-3 flex-shrink-0" /> {c.product_title}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 truncate">{c.last_message || 'Sem mensagens'}</p>
                  <p className="text-xs text-gray-400">{c.messages_count} mensagens</p>
                </button>
              ))
            )}
            {lista.length < total && (
              <div className="p-3">
                <Button
                  variant="outline"
                  className="w-full"
                  disabled={carregando}
                  onClick={() => carregar(pagina + 1, buscaAplicada, true)}
                >
                  {carregando ? <Loader2 className="h-4 w-4 animate-spin" /> : `Carregar mais (${total - lista.length})`}
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Conversa */}
        <div className={`flex-1 flex flex-col ${!aberta ? 'hidden md:flex' : 'flex'}`}>
          {aberta ? (
            <>
              <div className="p-3 border-b bg-white flex items-center gap-3">
                <button onClick={() => setAberta(null)} className="md:hidden p-1 hover:bg-gray-100 rounded">
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">
                    {nome(aberta, 1)} <span className="text-gray-400 font-normal">↔</span> {nome(aberta, 2)}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {aberta.user1_email} · {aberta.user2_email}
                  </p>
                  {aberta.product_title && (
                    <p className="text-xs text-gray-600 mt-0.5 flex items-center gap-1">
                      <Tag className="h-3 w-3" /> {aberta.product_title}
                      {aberta.product_price ? ` · ${reais(aberta.product_price)}` : ''}
                      {aberta.product_status ? ` · ${aberta.product_status}` : ''}
                    </p>
                  )}
                </div>
                <span className="text-xs text-gray-400 flex items-center gap-1">
                  <Eye className="h-3 w-3" /> só leitura
                </span>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
                {carregandoMensagens ? (
                  <div className="text-center text-gray-400 py-8">Carregando mensagens…</div>
                ) : mensagens.length === 0 ? (
                  <div className="text-center text-gray-400 py-8">Nenhuma mensagem</div>
                ) : (
                  mensagens.map((m) => {
                    const doPrimeiro = m.sender_id === aberta.user1_id
                    return (
                      <div key={m.id} className={`flex ${doPrimeiro ? 'justify-start' : 'justify-end'}`}>
                        <div
                          className={`max-w-[75%] rounded-2xl px-4 py-2 shadow-sm ${
                            doPrimeiro ? 'bg-white rounded-bl-sm' : 'bg-orange-100 rounded-br-sm'
                          }`}
                        >
                          <p className="text-[11px] font-semibold text-gray-500 mb-0.5">{m.sender_name || 'Usuário'}</p>
                          <p className="text-sm whitespace-pre-wrap break-words">{m.content}</p>
                          <p className="text-[10px] text-gray-400 mt-1 text-right">
                            {formatDateTime(m.created_at)}
                            {m.is_read ? ' · lida' : ''}
                          </p>
                        </div>
                      </div>
                    )
                  })
                )}
                <div ref={fimRef} />
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-2">
              <MessageCircle className="h-12 w-12 opacity-30" />
              <p className="text-sm">Escolha uma conversa à esquerda</p>
            </div>
          )}
        </div>
      </div>
    </Card>
  )
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Comunicações</h1>
          <p className="text-muted-foreground">Conversas entre usuários e notificações do sistema</p>
        </div>
        <Button variant="outline" onClick={fetchData} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      <Conversas />

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="rounded-lg bg-blue-100 p-3 text-blue-600">
              <Bell className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Notificações</p>
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
              <p className="text-sm text-muted-foreground">Não lidas</p>
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
          <CardTitle>Notificações</CardTitle>
          <CardDescription>Últimas notificações do sistema</CardDescription>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="flex flex-col items-center justify-center h-40 gap-3">
              <AlertCircle className="h-8 w-8 text-destructive" />
              <p className="text-sm text-muted-foreground">{error}</p>
              <Button onClick={fetchData} variant="outline" className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Tentar novamente
              </Button>
            </div>
          ) : loading ? (
            <div className="flex items-center justify-center h-40">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : notifications.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Título</TableHead>
                  <TableHead>Usuário</TableHead>
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
                      {notification.is_read ? <Badge variant="secondary">Lida</Badge> : <Badge variant="warning">Não lida</Badge>}
                    </TableCell>
                    <TableCell>{formatDateTime(notification.created_at)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-muted-foreground">Nenhuma notificação encontrada.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
