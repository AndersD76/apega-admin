import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatDateTime } from '@/lib/utils'
import {
  getCrescimento, ingerirCrescimento, getLeads,
  CrescimentoPainel, LeadsResposta,
} from '@/lib/api'
import { RefreshCw, Loader2, AlertCircle, Search, MousePointerClick, Eye, Sparkles, Mail, ShoppingBag, TrendingUp } from 'lucide-react'

function Numero({ titulo, valor, antes, icone, sufixo = '' }: { titulo: string; valor: number | null | undefined; antes?: number | null; icone: React.ReactNode; sufixo?: string }) {
  const v = valor ?? 0
  const a = antes ?? null
  const delta = a && a > 0 ? Math.round(((v - a) / a) * 100) : null
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <div className="rounded-lg bg-orange-50 p-3 text-orange-700">{icone}</div>
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">{titulo}</p>
          <p className="text-2xl font-bold">{valor == null ? '—' : v.toLocaleString('pt-BR')}{sufixo}</p>
          {delta != null && <p className={`text-xs ${delta >= 0 ? 'text-green-700' : 'text-red-700'}`}>{delta >= 0 ? '+' : ''}{delta}% vs período anterior</p>}
        </div>
      </CardContent>
    </Card>
  )
}

const CANAL: Record<string, string> = {
  busca_organica: 'Busca orgânica', ia: 'Assistentes de IA', social: 'Social', direto: 'Direto', referencia: 'Referência',
  email: 'E-mail', pago: 'Pago', sem_origem: 'Sem origem (app nativo ou antigo)',
}

export default function Crescimento() {
  const [dias, setDias] = useState(28)
  const [dados, setDados] = useState<CrescimentoPainel | null>(null)
  const [leads, setLeads] = useState<LeadsResposta | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [ingerindo, setIngerindo] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const carregar = async (d = dias) => {
    setCarregando(true)
    setErro(null)
    try {
      const [c, l] = await Promise.all([getCrescimento({ dias: d }), getLeads({ limit: 200 })])
      setDados(c)
      setLeads(l)
    } catch (e: any) {
      setErro(e.message || 'Erro ao carregar')
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => { carregar(dias) }, [dias])

  const ingerir = async () => {
    setIngerindo(true)
    try {
      await ingerirCrescimento()
      await carregar(dias)
    } catch (e: any) {
      setErro(e.message || 'Erro na ingestão')
    } finally {
      setIngerindo(false)
    }
  }

  const t = dados?.totais
  const a = dados?.anteriores

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Crescimento orgânico</h1>
          <p className="text-muted-foreground">Busca, assistentes de IA, iscas e leads. Fonte: cópia diária do Search Console e do GA4 no banco.</p>
        </div>
        <div className="flex items-center gap-2">
          {[7, 28, 90].map((d) => (
            <Button key={d} size="sm" variant={dias === d ? 'default' : 'outline'} onClick={() => setDias(d)}>{d} dias</Button>
          ))}
          <Button variant="outline" onClick={ingerir} disabled={ingerindo}>
            <RefreshCw className={`mr-2 h-4 w-4 ${ingerindo ? 'animate-spin' : ''}`} />
            Buscar agora
          </Button>
        </div>
      </div>

      {dados && dados.faltando.length > 0 && (
        <Card className="border-yellow-300 bg-yellow-50">
          <CardContent className="p-4 text-sm text-yellow-900 flex gap-3">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <div>
              <p className="font-medium">Ingestão do Google incompleta. Falta no Railway (serviço do backend): {dados.faltando.join(', ')}.</p>
              <p className="mt-1">A conta de serviço precisa ser leitora da propriedade GA4 e usuária da propriedade do Search Console (sc-domain:applargo.com.br). Leads e sessões próprias já aparecem sem isso.</p>
            </div>
          </CardContent>
        </Card>
      )}
      {erro && <p className="text-sm text-destructive">{erro}</p>}

      {carregando && !dados ? (
        <div className="flex items-center justify-center h-40"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
            <Numero titulo="Cliques na busca" valor={t?.cliques} antes={a?.cliques} icone={<MousePointerClick className="h-5 w-5" />} />
            <Numero titulo="Impressões" valor={t?.impressoes} antes={a?.impressoes} icone={<Eye className="h-5 w-5" />} />
            <Numero titulo="Posição média" valor={t?.posicao ?? null} icone={<Search className="h-5 w-5" />} />
            <Numero titulo="Sessões orgânicas" valor={t?.sessoes_organicas} antes={a?.sessoes_organicas} icone={<TrendingUp className="h-5 w-5" />} />
            <Numero titulo="Sessões vindas de IA" valor={t?.sessoes_ia} antes={a?.sessoes_ia} icone={<Sparkles className="h-5 w-5" />} />
            <Numero titulo="Leads" valor={leads?.total?.total ?? t?.leads} icone={<Mail className="h-5 w-5" />} />
          </div>

          <Tabs defaultValue="leads">
            <TabsList>
              <TabsTrigger value="leads">Leads e iscas</TabsTrigger>
              <TabsTrigger value="consultas">Consultas</TabsTrigger>
              <TabsTrigger value="paginas">Páginas</TabsTrigger>
              <TabsTrigger value="oportunidades">Oportunidades (posição 4 a 15)</TabsTrigger>
              <TabsTrigger value="canais">Canais</TabsTrigger>
            </TabsList>

            <TabsContent value="leads" className="mt-4 space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <Card><CardHeader><CardTitle className="text-base">Por isca</CardTitle></CardHeader><CardContent className="space-y-1 text-sm">
                  {(leads?.por_isca || []).map((i) => <p key={i.isca_id}><strong>{i.total}</strong> {i.isca_id} <span className="text-muted-foreground">({i.optin} com opt-in)</span></p>)}
                  {!leads?.por_isca?.length && <p className="text-muted-foreground">Nenhum lead ainda.</p>}
                </CardContent></Card>
                <Card><CardHeader><CardTitle className="text-base">Por canal</CardTitle></CardHeader><CardContent className="space-y-1 text-sm">
                  {(leads?.por_canal || []).map((c) => <p key={c.canal}><strong>{c.total}</strong> {CANAL[c.canal] || c.canal}</p>)}
                </CardContent></Card>
                <Card><CardHeader><CardTitle className="text-base">Últimos 7 dias</CardTitle></CardHeader><CardContent className="text-3xl font-bold">{leads?.total?.semana ?? 0}</CardContent></Card>
              </div>
              <Card>
                <CardHeader><CardTitle>Leads recentes</CardTitle><CardDescription>Quem pediu uma isca no site. Opt-in é a série de 5 e-mails; sem ele só vai o e-mail pedido.</CardDescription></CardHeader>
                <CardContent>
                  {leads?.leads?.length ? (
                    <Table>
                      <TableHeader><TableRow><TableHead>Quando</TableHead><TableHead>E-mail</TableHead><TableHead>Isca</TableHead><TableHead>Página</TableHead><TableHead>Canal</TableHead><TableHead>Opt-in</TableHead><TableHead>Etapa</TableHead></TableRow></TableHeader>
                      <TableBody>
                        {leads.leads.map((l) => (
                          <TableRow key={l.id}>
                            <TableCell className="whitespace-nowrap">{formatDateTime(l.created_at)}</TableCell>
                            <TableCell>{l.email}</TableCell>
                            <TableCell>{l.isca_id}{l.marca_slug ? ` · ${l.marca_slug}` : ''}</TableCell>
                            <TableCell className="max-w-[260px] truncate" title={l.pagina || ''}>{l.pagina}</TableCell>
                            <TableCell>{CANAL[l.canal || ''] || l.canal || '—'}</TableCell>
                            <TableCell>{l.descadastrado_em ? <Badge variant="secondary">saiu</Badge> : l.aceita_marketing ? <Badge variant="success">sim</Badge> : <Badge variant="outline">não</Badge>}</TableCell>
                            <TableCell>{l.sequencia_etapa}/5</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : <p className="text-sm text-muted-foreground">Nenhum lead ainda. As iscas estão em todas as páginas /quanto-vale e /brecho.</p>}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="consultas" className="mt-4">
              <TabelaGsc titulo="Consultas com mais cliques" linhas={dados?.consultas || []} vazio="Sem dados do Search Console ainda." />
            </TabsContent>
            <TabsContent value="paginas" className="mt-4">
              <TabelaGsc titulo="Páginas com mais cliques" linhas={dados?.paginas || []} vazio="Sem dados do Search Console ainda." />
            </TabsContent>
            <TabsContent value="oportunidades" className="mt-4">
              <TabelaGsc titulo="Consultas em posição 4 a 15 (reforçar a página sobe para o topo)" linhas={dados?.oportunidades || []} vazio="Nenhuma consulta nessa faixa ainda." />
            </TabsContent>
            <TabsContent value="canais" className="mt-4 grid gap-4 md:grid-cols-2">
              <Card><CardHeader><CardTitle className="text-base">GA4: sessões por canal</CardTitle><CardDescription>“Assistentes de IA” separa ChatGPT, Perplexity, Gemini, Copilot e Claude.</CardDescription></CardHeader><CardContent className="space-y-1 text-sm">
                {(dados?.canais_ga4 || []).map((c) => <p key={c.canal}><strong>{c.sessoes}</strong> {CANAL[c.canal] || c.canal} <span className="text-muted-foreground">· {c.conversoes} eventos-chave</span></p>)}
                {!dados?.canais_ga4?.length && <p className="text-muted-foreground">Sem dados do GA4 ainda.</p>}
              </CardContent></Card>
              <Card><CardHeader><CardTitle className="text-base">Telemetria própria: sessões por canal</CardTitle><CardDescription>Medido pelo próprio app (user_sessions), sem depender do Google.</CardDescription></CardHeader><CardContent className="space-y-1 text-sm">
                {(dados?.sessoes_proprias || []).map((c) => <p key={c.canal}><strong>{c.sessoes}</strong> {CANAL[c.canal] || c.canal}</p>)}
              </CardContent></Card>
            </TabsContent>
          </Tabs>
          <p className="text-xs text-muted-foreground">Última coleta: {dados?.ultima_coleta ? formatDateTime(dados.ultima_coleta) : 'nenhuma'}. O Search Console publica com 2 a 3 dias de atraso.</p>
        </>
      )}
    </div>
  )
}

function TabelaGsc({ titulo, linhas, vazio }: { titulo: string; linhas: { chave: string; cliques: number; impressoes: number; posicao: number | string | null }[]; vazio: string }) {
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">{titulo}</CardTitle></CardHeader>
      <CardContent>
        {linhas.length ? (
          <Table>
            <TableHeader><TableRow><TableHead>Chave</TableHead><TableHead className="text-right">Cliques</TableHead><TableHead className="text-right">Impressões</TableHead><TableHead className="text-right">Posição</TableHead></TableRow></TableHeader>
            <TableBody>
              {linhas.map((l) => (
                <TableRow key={l.chave}>
                  <TableCell className="max-w-[420px] truncate" title={l.chave}>{l.chave.replace('https://applargo.com.br', '')}</TableCell>
                  <TableCell className="text-right">{l.cliques}</TableCell>
                  <TableCell className="text-right">{l.impressoes}</TableCell>
                  <TableCell className="text-right">{l.posicao ?? '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : <p className="text-sm text-muted-foreground flex items-center gap-2"><ShoppingBag className="h-4 w-4" />{vazio}</p>}
      </CardContent>
    </Card>
  )
}
