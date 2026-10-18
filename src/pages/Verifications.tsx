import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { formatDateTime } from '@/lib/utils'
import { getPendingVerifications, reviewVerification, Verification } from '@/lib/api'
import {
  ShieldCheck,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  RefreshCw,
  AlertCircle,
  User,
  FileText,
} from 'lucide-react'

/**
 * Fila de verificacao de identidade dos vendedores.
 *
 * O backend ja tinha as duas rotas (listar pendentes, aprovar/rejeitar) desde
 * o KYC, mas o painel nunca ganhou a tela: o vendedor via "Verificacao em
 * analise (ate 48h)" no app e nao existia lugar nenhum para alguem analisar.
 *
 * As fotos chegam como URLs ASSINADAS e de vida curta (o backend nao expoe o
 * documento de ninguem por link permanente). Por isso a lista e recarregada ao
 * abrir cada cadastro: uma foto aberta minutos depois ja pode ter expirado.
 */

const TIPO_DOCUMENTO: Record<string, string> = {
  rg: 'RG',
  cnh: 'CNH',
  passport: 'Passaporte',
  passaporte: 'Passaporte',
}

function rotuloDocumento(tipo?: string) {
  if (!tipo) return 'Documento'
  return TIPO_DOCUMENTO[tipo.toLowerCase()] || tipo.toUpperCase()
}

function Foto({ titulo, url }: { titulo: string; url?: string | null }) {
  if (!url) {
    return (
      <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
        {titulo}: nao enviada
      </div>
    )
  }
  return (
    <a href={url} target="_blank" rel="noreferrer" className="block">
      <p className="mb-1 text-xs font-medium text-muted-foreground">{titulo}</p>
      <img
        src={url}
        alt={titulo}
        className="h-48 w-full rounded-lg border object-cover transition hover:opacity-90"
      />
    </a>
  )
}

export default function Verifications() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [verifications, setVerifications] = useState<Verification[]>([])
  const [selected, setSelected] = useState<Verification | null>(null)
  const [notes, setNotes] = useState('')
  const [reviewing, setReviewing] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)

  const fetchPending = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await getPendingVerifications()
      if (res.success) setVerifications(res.verifications)
    } catch (err: any) {
      setError(err?.message || 'Erro ao carregar verificacoes')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPending()
  }, [fetchPending])

  // Reabre com URLs novas: as assinadas da lista podem ja ter vencido.
  const abrir = async (v: Verification) => {
    setNotes(v.admin_notes || '')
    setSelected(v)
    try {
      const res = await getPendingVerifications()
      if (res.success) {
        setVerifications(res.verifications)
        const atual = res.verifications.find((x) => x.id === v.id)
        if (atual) setSelected(atual)
      }
    } catch {
      // Mantem a que ja estava aberta; o pior caso e uma foto expirada,
      // que o botao "Recarregar" resolve.
    }
  }

  const decidir = async (action: 'approve' | 'reject') => {
    if (!selected) return
    if (action === 'reject' && !notes.trim()) {
      setFeedback('Ao rejeitar, escreva o motivo: ele e o que o vendedor vai ler.')
      return
    }
    setReviewing(true)
    setFeedback(null)
    try {
      const res = await reviewVerification(selected.id, action, notes.trim() || undefined)
      if (res.success) {
        setVerifications((lista) => lista.filter((x) => x.id !== selected.id))
        setSelected(null)
        setNotes('')
      }
    } catch (err: any) {
      setFeedback(err?.message || 'Nao foi possivel registrar a decisao')
    } finally {
      setReviewing(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Verificacoes</h1>
          <p className="text-muted-foreground">
            Vendedores aguardando analise de identidade
          </p>
        </div>
        <Button variant="outline" onClick={fetchPending} disabled={loading} className="gap-2">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Recarregar
        </Button>
      </div>

      <Card>
        <CardContent className="flex items-center gap-4 p-6">
          <div className="rounded-lg bg-amber-100 p-3 text-amber-700">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Aguardando analise</p>
            {loading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <p className="text-2xl font-bold">{verifications.length}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      {!loading && !error && verifications.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 p-12 text-center text-muted-foreground">
            <ShieldCheck className="h-10 w-10" />
            <p>Nenhuma verificacao pendente.</p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {verifications.map((v) => (
          <Card key={v.id} className="cursor-pointer transition hover:shadow-md" onClick={() => abrir(v)}>
            <CardContent className="space-y-3 p-5">
              <div className="flex items-center gap-3">
                {v.avatar_url ? (
                  <img src={v.avatar_url} alt="" className="h-10 w-10 rounded-full object-cover" />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                    <User className="h-5 w-5 text-muted-foreground" />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="truncate font-medium">{v.name}</p>
                  <p className="truncate text-sm text-muted-foreground">{v.email}</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <Badge variant="outline" className="gap-1">
                  <FileText className="h-3 w-3" />
                  {rotuloDocumento(v.document_type)}
                </Badge>
                <Badge variant="warning" className="gap-1">
                  <Clock className="h-3 w-3" />
                  Pendente
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Enviado em {formatDateTime(v.submitted_at)}
                {v.user_since ? ` · na plataforma desde ${formatDateTime(v.user_since).split(' ')[0]}` : ''}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={!!selected} onOpenChange={(aberto) => { if (!aberto) { setSelected(null); setFeedback(null) } }}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Analisar verificacao</DialogTitle>
            <DialogDescription>
              Confira se a selfie e o documento sao da mesma pessoa e se os dados batem com o cadastro.
            </DialogDescription>
          </DialogHeader>

          {selected && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Vendedor</label>
                  <p className="font-medium">{selected.name}</p>
                  <p className="text-sm text-muted-foreground">{selected.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Documento</label>
                  <p className="font-medium">{rotuloDocumento(selected.document_type)}</p>
                  <p className="text-sm text-muted-foreground">
                    enviado em {formatDateTime(selected.submitted_at)}
                  </p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <Foto titulo="Selfie" url={selected.selfie_url} />
                <Foto titulo="Documento (frente)" url={selected.document_front_url} />
                <Foto titulo="Documento (verso)" url={selected.document_back_url} />
              </div>
              <p className="text-xs text-muted-foreground">
                Os links das fotos vencem em poucos minutos por seguranca. Se alguma nao abrir, feche e abra de novo.
              </p>

              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Observacao {`(obrigatoria ao rejeitar — o vendedor vai ler)`}
                </label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ex.: a foto do documento esta ilegivel, envie novamente com boa iluminacao."
                  rows={3}
                />
              </div>

              {feedback && (
                <div className="flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  {feedback}
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="destructive"
              onClick={() => decidir('reject')}
              disabled={reviewing}
              className="gap-2"
            >
              {reviewing ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
              Rejeitar
            </Button>
            <Button onClick={() => decidir('approve')} disabled={reviewing} className="gap-2">
              {reviewing ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
              Aprovar vendedor
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
