import * as React from 'react'
import { AlertTriangle, Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

/**
 * Confirmacao de acao destrutiva, sobre o `Dialog` que ja existe no projeto.
 *
 * Motivo: o painel aprovava saque, bloqueava usuario e rejeitava produto no
 * primeiro clique, sem nenhuma pergunta — e quando dava erro o operador nao
 * ficava sabendo, porque a falha ia so para o console. Este componente resolve
 * as duas metades: pergunta antes e mostra o erro do backend na propria caixa,
 * mantendo o dialogo aberto para o operador tentar de novo.
 *
 * `onConfirm` pode lancar: a mensagem do erro aparece no dialogo.
 * Quando `reason` e exigido, o texto digitado chega como argumento.
 */
export interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: React.ReactNode
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'default' | 'destructive'
  /** Pede uma justificativa antes de liberar o botao de confirmar. */
  reason?: {
    label: string
    placeholder?: string
    required?: boolean
  }
  onConfirm: (reason?: string) => void | Promise<void>
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  variant = 'default',
  reason,
  onConfirm,
}: ConfirmDialogProps) {
  const [busy, setBusy] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [reasonText, setReasonText] = React.useState('')

  // Cada abertura comeca limpa: erro antigo ou justificativa da acao anterior
  // reaparecendo na proxima confirmacao seria pior que nao ter dialogo.
  React.useEffect(() => {
    if (open) {
      setError(null)
      setReasonText('')
      setBusy(false)
    }
  }, [open])

  const reasonMissing = !!reason?.required && reasonText.trim().length === 0

  const handleConfirm = async () => {
    if (reasonMissing) return
    setBusy(true)
    setError(null)
    try {
      await onConfirm(reason ? reasonText.trim() : undefined)
      onOpenChange(false)
    } catch (err: any) {
      setError(err?.message || 'Nao foi possivel concluir a acao')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!busy) onOpenChange(next) }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {variant === 'destructive' && <AlertTriangle className="h-5 w-5 text-destructive" />}
            {title}
          </DialogTitle>
          {description && <DialogDescription asChild><div>{description}</div></DialogDescription>}
        </DialogHeader>

        {reason && (
          <div className="space-y-2">
            <Label htmlFor="confirm-reason">{reason.label}</Label>
            <Textarea
              id="confirm-reason"
              value={reasonText}
              placeholder={reason.placeholder}
              onChange={(e) => setReasonText(e.target.value)}
              disabled={busy}
            />
          </div>
        )}

        {error && (
          <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
            {cancelLabel}
          </Button>
          <Button
            variant={variant === 'destructive' ? 'destructive' : 'default'}
            onClick={handleConfirm}
            disabled={busy || reasonMissing}
          >
            {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
