import { useEffect, useRef, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { formatDateTime } from '@/lib/utils'
import { getPushAlcance, enviarPush, getPushCampanhas, PushAlcance, PushCampanha } from '@/lib/api'
import { BellRing, Loader2, RefreshCw, Smartphone, Globe, Users, Sparkles } from 'lucide-react'

/**
 * Campanhas de push. O número de alcance vem do banco (quem tem push ativo e
 * aceita promoção); os modelos de mensagem usam números medidos (peças novas,
 * peças na Quarta) e nunca um número de cabeça.
 */

const DESTINOS: { valor: string; rotulo: string }[] = [
  { valor: '/', rotulo: 'Início' },
  { valor: '/quarta-largo', rotulo: 'Quarta do Largô' },
  { valor: '/buscar', rotulo: 'Busca' },
  { valor: '/vender', rotulo: 'Vender' },
]

// Atalhos de emoji para título e mensagem. O emoji entra onde está o cursor.
// Conta no limite como o servidor conta (String.length): 🛍️ ocupa 3.
const EMOJIS = ['🛍️', '👗', '👠', '👜', '🧥', '👖', '✨', '🔥', '💸', '🏷️', '⏰', '🖤', '💖', '🎉', '♻️', '📦', '👀', '🤑']

function modelos(a: PushAlcance | null) {
  const novas = a?.pecas_novas_24h ?? 0
  const quarta = a?.pecas_na_quarta ?? 0
  return [
    {
      nome: 'Black Friday',
      titulo: '🖤 Black Friday de brechó no Largô',
      mensagem: 'Peça seminova já custa menos que na loja. Hoje, faça sua oferta em qualquer peça: a vendedora decide. 💸',
      url: '/buscar',
      segmento: 'todos',
    },
    {
      nome: 'Black Friday: vendedoras',
      titulo: '🖤 Sua peça na Black Friday',
      mensagem: 'Ative a Quarta do Largô nas peças paradas e aceite ofertas nesta semana. Peça com oferta roda mais rápido. 🔥',
      url: '/vender',
      segmento: 'vendedores',
    },
    {
      nome: `Peças novas (${novas} nas últimas 24h)`,
      titulo: novas > 0 ? `🛍️ ${novas} peças novas no Largô` : '🛍️ Peças novas no Largô',
      mensagem: 'Chegaram hoje. Garimpe antes que rodem. ✨',
      url: '/',
      segmento: 'todos',
      desabilitado: novas < 5,
    },
    {
      nome: `Quarta do Largô (${quarta} peças na vitrine)`,
      titulo: '🏷️ Quarta do Largô amanhã',
      mensagem: quarta > 0 ? `${quarta} peças com o desconto que cada vendedora escolheu. Faça sua oferta. 💸` : 'Peças com o desconto que cada vendedora escolheu. Faça sua oferta. 💸',
      url: '/quarta-largo',
      segmento: 'todos',
    },
    {
      nome: 'Carrinho parado',
      titulo: '👀 Sua peça ainda está lá',
      mensagem: 'A peça do seu carrinho continua disponível. Peça única: quando roda, roda. ⏰',
      url: '/',
      segmento: 'carrinho',
    },
  ]
}

export default function Push() {
  const [alcance, setAlcance] = useState<PushAlcance | null>(null)
  const [segmentos, setSegmentos] = useState<Record<string, string>>({})
  const [limites, setLimites] = useState({ titulo: 60, mensagem: 180 })
  const [campanhas, setCampanhas] = useState<PushCampanha[]>([])
  const [loading, setLoading] = useState(true)
  const [titulo, setTitulo] = useState('')
  const [mensagem, setMensagem] = useState('')
  const [url, setUrl] = useState('/')
  const [segmento, setSegmento] = useState('todos')
  const [confirmar, setConfirmar] = useState(false)
  const [resultado, setResultado] = useState<string | null>(null)
  const [campoAtivo, setCampoAtivo] = useState<'titulo' | 'mensagem'>('titulo')
  const tituloRef = useRef<HTMLInputElement>(null)
  const mensagemRef = useRef<HTMLTextAreaElement>(null)

  const inserirEmoji = (emoji: string) => {
    const el = campoAtivo === 'titulo' ? tituloRef.current : mensagemRef.current
    const atual = campoAtivo === 'titulo' ? titulo : mensagem
    const limite = campoAtivo === 'titulo' ? limites.titulo : limites.mensagem
    if (atual.length + emoji.length > limite) return
    const ini = el?.selectionStart ?? atual.length
    const fim = el?.selectionEnd ?? atual.length
    const novo = atual.slice(0, ini) + emoji + atual.slice(fim)
    if (campoAtivo === 'titulo') setTitulo(novo); else setMensagem(novo)
    requestAnimationFrame(() => {
      if (!el) return
      el.focus()
      el.setSelectionRange(ini + emoji.length, ini + emoji.length)
    })
  }

  const carregar = async () => {
    setLoading(true)
    try {
      const [a, c] = await Promise.all([getPushAlcance(), getPushCampanhas()])
      setAlcance(a.alcance)
      setSegmentos(a.segmentos)
      setLimites(a.limites)
      setCampanhas(c.campanhas)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { carregar() }, [])

  const enviar = async () => {
    const r = await enviarPush({ titulo, mensagem, url, segmento })
    setResultado(
      r.campanha.enviados === 0 && r.campanha.destinatarios > 0
        ? `Chegou a 0 de ${r.campanha.destinatarios} pessoas do segmento: ninguém nele aceitou promoções ainda.`
        : `Chegou a ${r.campanha.enviados} de ${r.campanha.destinatarios} pessoas do segmento.`
    )
    setTitulo(''); setMensagem('')
    await carregar()
  }

  const pronto = titulo.trim().length > 0 && mensagem.trim().length > 0 && titulo.length <= limites.titulo && mensagem.length <= limites.mensagem

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Push</h1>
          <p className="text-muted-foreground">Avisos para quem tem notificação ativa. Promoção só chega a quem aceitou promoção.</p>
        </div>
        <Button variant="outline" onClick={carregar} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Atualizar
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardHeader className="pb-2"><CardDescription className="flex items-center gap-2"><Users className="h-4 w-4" /> Com push ativo</CardDescription><CardTitle className="text-3xl">{alcance?.total ?? '–'}</CardTitle></CardHeader></Card>
        <Card><CardHeader className="pb-2"><CardDescription className="flex items-center gap-2"><BellRing className="h-4 w-4" /> Aceitam promoção</CardDescription><CardTitle className="text-3xl">{alcance?.aceitam_promo ?? '–'}</CardTitle></CardHeader></Card>
        <Card><CardHeader className="pb-2"><CardDescription className="flex items-center gap-2"><Smartphone className="h-4 w-4" /> App (iOS/Android)</CardDescription><CardTitle className="text-3xl">{alcance?.app ?? '–'}</CardTitle></CardHeader></Card>
        <Card><CardHeader className="pb-2"><CardDescription className="flex items-center gap-2"><Globe className="h-4 w-4" /> Web (PWA)</CardDescription><CardTitle className="text-3xl">{alcance?.web ?? '–'}</CardTitle></CardHeader></Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Nova campanha</CardTitle>
            <CardDescription>Título curto, mensagem de uma frase, e para onde o toque leva.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Título <span className="text-muted-foreground">({titulo.length}/{limites.titulo})</span></label>
              <Input ref={tituloRef} value={titulo} onFocus={() => setCampoAtivo('titulo')} onChange={(e) => setTitulo(e.target.value)} maxLength={limites.titulo} placeholder="Ex.: 🛍️ 12 peças novas no Largô" />
            </div>
            <div>
              <label className="text-sm font-medium">Mensagem <span className="text-muted-foreground">({mensagem.length}/{limites.mensagem})</span></label>
              <textarea
                ref={mensagemRef}
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={mensagem}
                onFocus={() => setCampoAtivo('mensagem')}
                onChange={(e) => setMensagem(e.target.value)}
                maxLength={limites.mensagem}
                placeholder="Ex.: Chegaram hoje. Garimpe antes que rodem. ✨"
              />
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Emoji no {campoAtivo === 'titulo' ? 'título' : 'texto da mensagem'} (clique no campo para trocar)</p>
              <div className="flex flex-wrap gap-1">
                {EMOJIS.map((e) => (
                  <button
                    key={e}
                    type="button"
                    onMouseDown={(ev) => ev.preventDefault()}
                    onClick={() => inserirEmoji(e)}
                    className="h-9 w-9 rounded-md border text-lg leading-none hover:bg-muted/60"
                    title={`Inserir ${e}`}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium">Quem recebe</label>
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={segmento} onChange={(e) => setSegmento(e.target.value)}>
                  {Object.entries(segmentos).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Ao tocar, abre</label>
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={url} onChange={(e) => setUrl(e.target.value)}>
                  {DESTINOS.map((d) => <option key={d.valor} value={d.valor}>{d.rotulo} ({d.valor})</option>)}
                </select>
              </div>
            </div>

            <div className="rounded-lg border bg-muted/40 p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Prévia</p>
              <div className="flex gap-3 items-start rounded-xl bg-background p-3 shadow-sm">
                <img src="/largo-icon.png" alt="Largô" className="h-10 w-10 rounded-lg border object-cover shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Largô · agora</p>
                  <p className="font-medium text-sm break-words">{titulo || 'Título'}</p>
                  <p className="text-sm text-muted-foreground break-words">{mensagem || 'Mensagem'}</p>
                </div>
              </div>
            </div>

            {alcance && alcance.aceitam_promo === 0 && (
              <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
                Ninguém aceitou receber promoções ainda, então a campanha chega a <b>0 pessoas</b>. O app passou a
                perguntar ("Quer saber das novidades?") a quem já ativou notificações, e a chave "Promoções e
                novidades" voltou aos Ajustes. O número sobe conforme as pessoas aceitam.
              </div>
            )}

            {resultado && <p className="text-sm text-green-700">{resultado}</p>}

            <Button onClick={() => setConfirmar(true)} disabled={!pronto}>
              <BellRing className="h-4 w-4 mr-2" /> Enviar agora
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Sparkles className="h-4 w-4" /> Modelos</CardTitle>
            <CardDescription>Preenchem o formulário; você ajusta antes de enviar.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {modelos(alcance).map((m) => (
              <button
                key={m.nome}
                disabled={m.desabilitado}
                onClick={() => { setTitulo(m.titulo); setMensagem(m.mensagem); setUrl(m.url); setSegmento(m.segmento); setResultado(null) }}
                className="w-full text-left rounded-lg border p-3 hover:bg-muted/60 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <p className="font-medium text-sm">{m.nome}</p>
                <p className="text-xs text-muted-foreground line-clamp-2">{m.mensagem}</p>
                {m.desabilitado && <p className="text-xs text-amber-700 mt-1">Menos de 5 peças novas: sem novidade, sem push.</p>}
              </button>
            ))}
            <p className="text-xs text-muted-foreground pt-2">Às 18h, se houver 5 ou mais peças novas no dia, o servidor manda sozinho o aviso de peças novas.</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Campanhas enviadas</CardTitle>
          <CardDescription>"Entregues" conta quem tinha pelo menos um aparelho que aceitou o envio.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-32"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : campanhas.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma campanha ainda.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Quando</TableHead>
                  <TableHead>Título</TableHead>
                  <TableHead>Mensagem</TableHead>
                  <TableHead>Segmento</TableHead>
                  <TableHead>Origem</TableHead>
                  <TableHead className="text-right">Entregues</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campanhas.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">{formatDateTime(c.created_at)}</TableCell>
                    <TableCell className="font-medium">{c.titulo}</TableCell>
                    <TableCell className="text-sm max-w-md">{c.mensagem}</TableCell>
                    <TableCell><Badge variant="outline">{segmentos[c.segmento] || c.segmento}</Badge></TableCell>
                    <TableCell className="text-sm">{c.origem === 'auto_novas' ? 'automática' : 'painel'}</TableCell>
                    <TableCell className="text-right">{c.enviados} / {c.destinatarios}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={confirmar}
        onOpenChange={setConfirmar}
        title="Enviar esta campanha?"
        description={`"${titulo}" vai para ${segmentos[segmento] || segmento}, mas só chega a quem aceitou promoções (hoje ${alcance?.aceitam_promo ?? 0} de ${alcance?.total ?? 0} pessoas com push ativo). Não dá para desfazer.`}
        confirmLabel="Enviar"
        onConfirm={enviar}
      />
    </div>
  )
}
