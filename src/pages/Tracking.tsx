import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
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
import { PeriodFilter, periodPreset, type Period } from '@/components/PeriodFilter'
import {
  getEngagement,
  getSessions,
  getTrackingEvents,
  type EngagementFunnel,
  type EngagementSessions,
  type UserSession,
  type TrackingEvent,
} from '@/lib/api'
import {
  Eye, Heart, ShoppingCart, CreditCard, CheckCircle2,
  Clock, Smartphone, Search, Users, Loader2, RefreshCw, AlertCircle, Activity,
} from 'lucide-react'

/** Rotulo e cor de cada tipo de evento, para o feed ficar legivel. */
const EVENT_LABELS: Record<string, { label: string; tone: string }> = {
  product_view: { label: 'Viu produto', tone: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300' },
  favorite_add: { label: 'Favoritou', tone: 'bg-pink-100 text-pink-700 dark:bg-pink-950 dark:text-pink-300' },
  favorite_remove: { label: 'Desfavoritou', tone: 'bg-muted text-muted-foreground' },
  cart_add: { label: 'Botou na sacola', tone: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300' },
  cart_remove: { label: 'Tirou da sacola', tone: 'bg-muted text-muted-foreground' },
  checkout_start: { label: 'Iniciou compra', tone: 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300' },
  checkout_complete: { label: 'Comprou', tone: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300' },
  search_perform: { label: 'Buscou', tone: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300' },
  session_start: { label: 'Abriu o app', tone: 'bg-muted text-muted-foreground' },
  screen_view: { label: 'Navegou', tone: 'bg-muted text-muted-foreground' },
  product_create: { label: 'Anunciou', tone: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300' },
}

function eventBadge(type: string) {
  const cfg = EVENT_LABELS[type] || { label: type, tone: 'bg-muted text-muted-foreground' }
  return <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${cfg.tone}`}>{cfg.label}</span>
}

function formatDuration(seconds: number): string {
  if (!seconds || seconds < 60) return `${seconds || 0}s`
  const m = Math.floor(seconds / 60)
  if (m < 60) return `${m}min ${seconds % 60}s`
  return `${Math.floor(m / 60)}h ${m % 60}min`
}

function formatWhen(iso: string): string {
  const d = new Date(iso)
  const diff = Date.now() - d.getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return 'agora'
  if (min < 60) return `${min}min atrás`
  const h = Math.floor(min / 60)
  if (h < 24) return `${h}h atrás`
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}

interface FunnelStepProps {
  label: string
  value: number
  icon: React.ReactNode
  /** Percentual em relacao ao topo do funil. */
  pct: number | null
}

function FunnelStep({ label, value, icon, pct }: FunnelStepProps) {
  return (
    <div className="flex items-center gap-4 rounded-lg border p-4">
      <div className="rounded-lg bg-primary/10 p-3 text-primary">{icon}</div>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-2xl font-bold tabular-nums">{value.toLocaleString('pt-BR')}</p>
      </div>
      {pct !== null && (
        <Badge variant={pct >= 10 ? 'success' : pct >= 2 ? 'warning' : 'secondary'} className="tabular-nums">
          {pct.toFixed(1)}%
        </Badge>
      )}
    </div>
  )
}

export default function Tracking() {
  const [period, setPeriod] = useState<Period>(periodPreset('30d'))
  const [activeTab, setActiveTab] = useState('funil')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [funnel, setFunnel] = useState<EngagementFunnel | null>(null)
  const [sessionStats, setSessionStats] = useState<EngagementSessions | null>(null)
  const [byDevice, setByDevice] = useState<{ device: string; count: string }[]>([])
  const [topSearches, setTopSearches] = useState<{ term: string; count: string }[]>([])
  const [sessions, setSessions] = useState<UserSession[]>([])
  const [events, setEvents] = useState<TrackingEvent[]>([])

  const fetchAll = async () => {
    setLoading(true)
    setError(null)
    try {
      const [eng, sess, evs] = await Promise.all([
        getEngagement({ from: period.from, to: period.to }),
        getSessions(50),
        getTrackingEvents({ limit: 100 }),
      ])
      if (eng.success) {
        setFunnel(eng.funnel)
        setSessionStats(eng.sessions)
        setByDevice(eng.byDevice || [])
        setTopSearches(eng.topSearches || [])
      }
      if (sess.success) setSessions(sess.sessions || [])
      if (evs.success) setEvents(evs.events || [])
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar tracking')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period.from, period.to])

  const n = (v?: string) => parseInt(v || '0') || 0
  const views = n(funnel?.views)
  const pctOf = (v: number) => (views > 0 ? (v / views) * 100 : null)

  if (error) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <p className="text-lg font-medium">Erro ao carregar tracking</p>
        <p className="text-sm text-muted-foreground">{error}</p>
        <Button onClick={fetchAll} variant="outline" className="gap-2">
          <RefreshCw className="h-4 w-4" /> Tentar novamente
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tracking</h1>
          <p className="text-muted-foreground">
            Quem viu, favoritou, botou na sacola e quanto tempo navegou
          </p>
        </div>
        <div className="flex gap-2">
          <PeriodFilter value={period} onChange={setPeriod} />
          <Button variant="outline" onClick={fetchAll}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Funil */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <FunnelStep label="Visualizações" value={views} icon={<Eye className="h-5 w-5" />} pct={null} />
        <FunnelStep label="Favoritos" value={n(funnel?.favorites)} icon={<Heart className="h-5 w-5" />} pct={pctOf(n(funnel?.favorites))} />
        <FunnelStep label="Na sacola" value={n(funnel?.cart_adds)} icon={<ShoppingCart className="h-5 w-5" />} pct={pctOf(n(funnel?.cart_adds))} />
        <FunnelStep label="Checkouts" value={n(funnel?.checkout_starts)} icon={<CreditCard className="h-5 w-5" />} pct={pctOf(n(funnel?.checkout_starts))} />
        <FunnelStep label="Compras" value={n(funnel?.purchases)} icon={<CheckCircle2 className="h-5 w-5" />} pct={pctOf(n(funnel?.purchases))} />
      </div>

      {/* Navegacao */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="rounded-lg bg-primary/10 p-3 text-primary"><Clock className="h-5 w-5" /></div>
            <div>
              <p className="text-sm text-muted-foreground">Tempo médio de sessão</p>
              <p className="text-2xl font-bold">{formatDuration(n(sessionStats?.avg_seconds))}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="rounded-lg bg-primary/10 p-3 text-primary"><Activity className="h-5 w-5" /></div>
            <div>
              <p className="text-sm text-muted-foreground">Sessão mais longa</p>
              <p className="text-2xl font-bold">{formatDuration(n(sessionStats?.max_seconds))}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="rounded-lg bg-primary/10 p-3 text-primary"><Users className="h-5 w-5" /></div>
            <div>
              <p className="text-sm text-muted-foreground">Sessões</p>
              <p className="text-2xl font-bold">{n(sessionStats?.total).toLocaleString('pt-BR')}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="rounded-lg bg-primary/10 p-3 text-primary"><Smartphone className="h-5 w-5" /></div>
            <div>
              <p className="text-sm text-muted-foreground">Telas por sessão</p>
              <p className="text-2xl font-bold">{sessionStats?.avg_screens || '0'}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="funil">Atividade</TabsTrigger>
              <TabsTrigger value="sessoes">Sessões</TabsTrigger>
              <TabsTrigger value="buscas">Buscas e dispositivos</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : activeTab === 'funil' ? (
            events.length === 0 ? (
              <div className="flex h-48 items-center justify-center text-center text-muted-foreground">
                Nenhum evento registrado ainda.<br />
                <span className="text-xs">Os eventos aparecem conforme o app é usado.</span>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Quando</TableHead>
                      <TableHead>Ação</TableHead>
                      <TableHead>Quem</TableHead>
                      <TableHead>Produto</TableHead>
                      <TableHead>Dispositivo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {events.map(e => (
                      <TableRow key={e.id}>
                        <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                          {formatWhen(e.created_at)}
                        </TableCell>
                        <TableCell>{eventBadge(e.event_type)}</TableCell>
                        <TableCell>
                          {e.user_name ? (
                            <div>
                              <div className="text-sm font-medium">{e.user_name}</div>
                              <div className="text-xs text-muted-foreground">{e.user_email}</div>
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">Visitante</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm">
                          {e.product_title || (e.metadata?.query ? <em>"{e.metadata.query}"</em> : '-')}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{e.device_type || '-'}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )
          ) : activeTab === 'sessoes' ? (
            sessions.length === 0 ? (
              <div className="flex h-48 items-center justify-center text-muted-foreground">
                Nenhuma sessão registrada ainda
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Usuário</TableHead>
                      <TableHead>Início</TableHead>
                      <TableHead>Duração</TableHead>
                      <TableHead>Telas</TableHead>
                      <TableHead>Eventos</TableHead>
                      <TableHead>Plataforma</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sessions.map(s => (
                      <TableRow key={s.id}>
                        <TableCell>
                          {s.user_name ? (
                            <div>
                              <div className="text-sm font-medium">{s.user_name}</div>
                              <div className="text-xs text-muted-foreground">{s.user_email}</div>
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">Visitante</span>
                          )}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                          {formatWhen(s.started_at)}
                        </TableCell>
                        <TableCell className="font-medium tabular-nums">
                          {formatDuration(s.duration_seconds)}
                        </TableCell>
                        <TableCell className="tabular-nums">{s.screen_views}</TableCell>
                        <TableCell className="tabular-nums">{s.events_count}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{s.platform || s.device_type || '-'}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <h3 className="mb-3 flex items-center gap-2 font-medium">
                  <Search className="h-4 w-4" /> Termos mais buscados
                </h3>
                {topSearches.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhuma busca registrada</p>
                ) : (
                  <div className="space-y-2">
                    {topSearches.map(s => (
                      <div key={s.term} className="flex items-center justify-between rounded-lg border px-3 py-2">
                        <span className="text-sm">{s.term}</span>
                        <Badge variant="secondary" className="tabular-nums">{s.count}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <h3 className="mb-3 flex items-center gap-2 font-medium">
                  <Smartphone className="h-4 w-4" /> Por dispositivo
                </h3>
                {byDevice.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Sem dados</p>
                ) : (
                  <div className="space-y-2">
                    {byDevice.map(d => (
                      <div key={d.device} className="flex items-center justify-between rounded-lg border px-3 py-2">
                        <span className="text-sm capitalize">{d.device}</span>
                        <Badge variant="secondary" className="tabular-nums">{d.count}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
