import { useState, useEffect, useCallback } from 'react'
import { PeriodFilter, periodPreset, type Period } from '@/components/PeriodFilter'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { formatCurrency, formatDate } from '@/lib/utils'
import {
  getFinanceCategories,
  createFinanceCategory,
  updateFinanceCategory,
  getFinancePartners,
  createFinancePartner,
  updateFinancePartner,
  getFinanceEntries,
  createFinanceEntry,
  updateFinanceEntry,
  payFinanceEntry,
  unpayFinanceEntry,
  cancelFinanceEntry,
  deleteFinanceEntry,
  getFinanceSummary,
  getFinanceCashflow,
  type FinanceCategory,
  type FinancePartner,
  type FinanceEntry,
  type FinanceEntryTotals,
  type FinanceSummary,
  type FinanceCashflowMonth,
} from '@/lib/api'
import {
  ArrowDownCircle,
  ArrowUpCircle,
  AlertCircle,
  CalendarClock,
  CheckCircle,
  Loader2,
  MoreHorizontal,
  Plus,
  RotateCcw,
  Trash2,
  Pencil,
  XCircle,
  Wallet,
  RefreshCw,
} from 'lucide-react'
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip as ChartTooltip,
  Legend,
  CartesianGrid,
} from 'recharts'

const PAYMENT_METHODS = [
  { value: 'pix', label: 'PIX' },
  { value: 'boleto', label: 'Boleto' },
  { value: 'cartao', label: 'Cartão' },
  { value: 'transferencia', label: 'Transferência' },
  { value: 'dinheiro', label: 'Dinheiro' },
]

const num = (v: string | number | undefined | null) => parseFloat(String(v ?? 0)) || 0

const today = () => new Date().toISOString().slice(0, 10)

const monthLabel = (ym: string) => {
  const [y, m] = ym.split('-')
  const names = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']
  return `${names[parseInt(m) - 1]}/${y.slice(2)}`
}

interface EntryForm {
  description: string
  amount: string
  due_date: string
  category_id: string
  partner_id: string
  counterparty: string
  payment_method: string
  recurring: boolean
  notes: string
  alreadyPaid: boolean
}

const emptyForm: EntryForm = {
  description: '',
  amount: '',
  due_date: today(),
  category_id: 'none',
  partner_id: 'none',
  counterparty: '',
  payment_method: 'none',
  recurring: false,
  notes: '',
  alreadyPaid: false,
}

export default function Contas() {
  const [activeTab, setActiveTab] = useState('resumo')

  // Cadastros compartilhados
  const [categories, setCategories] = useState<FinanceCategory[]>([])
  const [partners, setPartners] = useState<FinancePartner[]>([])

  // Resumo
  const [summary, setSummary] = useState<FinanceSummary | null>(null)

  // Lançamentos (aba a pagar / a receber)
  const [entries, setEntries] = useState<FinanceEntry[]>([])
  const [totals, setTotals] = useState<FinanceEntryTotals | null>(null)
  const [loading, setLoading] = useState(false)
  const [statusFilter, setStatusFilter] = useState('todos')
  const [categoryFilter, setCategoryFilter] = useState('todas')
  const [partnerFilter, setPartnerFilter] = useState('todos')
  const [period, setPeriod] = useState<Period>(periodPreset('mes'))

  // Fluxo de caixa
  const [cashflow, setCashflow] = useState<{ realized: FinanceCashflowMonth[]; projected: FinanceCashflowMonth[] } | null>(null)

  // Dialogs
  const [entryDialog, setEntryDialog] = useState<{ kind: 'pagar' | 'receber'; editing: FinanceEntry | null } | null>(null)
  const [form, setForm] = useState<EntryForm>(emptyForm)
  const [payDialog, setPayDialog] = useState<FinanceEntry | null>(null)
  const [payForm, setPayForm] = useState({ paid_at: today(), payment_method: 'none' })
  const [saving, setSaving] = useState(false)

  // Cadastros: forms inline
  const [newCategory, setNewCategory] = useState({ name: '', kind: 'despesa' as 'despesa' | 'receita' })
  const [newPartner, setNewPartner] = useState('')

  const currentKind: 'pagar' | 'receber' | null =
    activeTab === 'pagar' ? 'pagar' : activeTab === 'receber' ? 'receber' : null

  // ─── Fetching ───────────────────────────────────────────

  const fetchRegistries = useCallback(async () => {
    try {
      const [cats, parts] = await Promise.all([getFinanceCategories(), getFinancePartners()])
      setCategories(cats.categories || [])
      setPartners(parts.partners || [])
    } catch (e) {
      console.error('Erro ao carregar cadastros:', e)
    }
  }, [])

  const fetchSummary = useCallback(async () => {
    try {
      const res = await getFinanceSummary({ from: period.from, to: period.to })
      setSummary(res)
    } catch (e) {
      console.error('Erro ao carregar resumo:', e)
    }
  }, [period.from, period.to])

  const fetchEntries = useCallback(async (kind: 'pagar' | 'receber') => {
    setLoading(true)
    try {
      const res = await getFinanceEntries({
        kind,
        status: statusFilter !== 'todos' ? statusFilter : undefined,
        category_id: categoryFilter !== 'todas' ? categoryFilter : undefined,
        partner_id: partnerFilter !== 'todos' ? partnerFilter : undefined,
        from: period.from,
        to: period.to,
        limit: 100,
      })
      setEntries(res.entries || [])
      setTotals(res.totals || null)
    } catch (e) {
      console.error('Erro ao carregar lançamentos:', e)
    } finally {
      setLoading(false)
    }
  }, [statusFilter, categoryFilter, partnerFilter, period.from, period.to])

  const fetchCashflow = useCallback(async () => {
    try {
      const res = await getFinanceCashflow(6)
      setCashflow({ realized: res.realized || [], projected: res.projected || [] })
    } catch (e) {
      console.error('Erro ao carregar fluxo de caixa:', e)
    }
  }, [])

  useEffect(() => {
    fetchRegistries()
    fetchSummary()
  }, [fetchRegistries, fetchSummary])

  useEffect(() => {
    if (currentKind) fetchEntries(currentKind)
    if (activeTab === 'fluxo') fetchCashflow()
    if (activeTab === 'resumo') fetchSummary()
  }, [activeTab, currentKind, fetchEntries, fetchCashflow, fetchSummary])

  // ─── Ações de lançamento ────────────────────────────────

  const openNewEntry = (kind: 'pagar' | 'receber') => {
    setForm(emptyForm)
    setEntryDialog({ kind, editing: null })
  }

  const openEditEntry = (entry: FinanceEntry) => {
    setForm({
      description: entry.description,
      amount: String(num(entry.amount)),
      due_date: entry.due_date?.slice(0, 10) || today(),
      category_id: entry.category_id || 'none',
      partner_id: entry.partner_id || 'none',
      counterparty: entry.counterparty || '',
      payment_method: entry.payment_method || 'none',
      recurring: entry.recurring,
      notes: entry.notes || '',
      alreadyPaid: false,
    })
    setEntryDialog({ kind: entry.kind, editing: entry })
  }

  const saveEntry = async () => {
    if (!entryDialog) return
    if (!form.description.trim() || !form.amount || !form.due_date) {
      alert('Preencha descrição, valor e vencimento.')
      return
    }
    setSaving(true)
    try {
      const payload: any = {
        kind: entryDialog.kind,
        description: form.description,
        amount: form.amount.replace(',', '.'),
        due_date: form.due_date,
        category_id: form.category_id !== 'none' ? form.category_id : null,
        partner_id: form.partner_id !== 'none' ? form.partner_id : null,
        counterparty: form.counterparty || null,
        payment_method: form.payment_method !== 'none' ? form.payment_method : null,
        recurring: form.recurring,
        notes: form.notes || null,
      }
      if (entryDialog.editing) {
        await updateFinanceEntry(entryDialog.editing.id, payload)
      } else {
        if (form.alreadyPaid) payload.status = 'pago'
        await createFinanceEntry(payload)
      }
      setEntryDialog(null)
      if (currentKind) fetchEntries(currentKind)
      fetchSummary()
    } catch (e: any) {
      alert(e?.message || 'Erro ao salvar lançamento')
    } finally {
      setSaving(false)
    }
  }

  const confirmPay = async () => {
    if (!payDialog) return
    setSaving(true)
    try {
      const res = await payFinanceEntry(payDialog.id, {
        paid_at: payForm.paid_at,
        payment_method: payForm.payment_method !== 'none' ? payForm.payment_method : undefined,
      })
      setPayDialog(null)
      if (res.next_entry) {
        alert(`Conta recorrente: próxima parcela criada para ${formatDate(res.next_entry.due_date)}.`)
      }
      if (currentKind) fetchEntries(currentKind)
      fetchSummary()
    } catch (e: any) {
      alert(e?.message || 'Erro ao dar baixa')
    } finally {
      setSaving(false)
    }
  }

  const handleUnpay = async (entry: FinanceEntry) => {
    if (!confirm('Estornar a baixa deste lançamento? Ele volta para pendente.')) return
    try {
      await unpayFinanceEntry(entry.id)
      if (currentKind) fetchEntries(currentKind)
      fetchSummary()
    } catch (e: any) {
      alert(e?.message || 'Erro ao estornar')
    }
  }

  const handleCancel = async (entry: FinanceEntry) => {
    if (!confirm('Cancelar este lançamento?')) return
    try {
      await cancelFinanceEntry(entry.id)
      if (currentKind) fetchEntries(currentKind)
      fetchSummary()
    } catch (e: any) {
      alert(e?.message || 'Erro ao cancelar')
    }
  }

  const handleDelete = async (entry: FinanceEntry) => {
    if (!confirm('Excluir definitivamente este lançamento pendente?')) return
    try {
      await deleteFinanceEntry(entry.id)
      if (currentKind) fetchEntries(currentKind)
      fetchSummary()
    } catch (e: any) {
      alert(e?.message || 'Erro ao excluir')
    }
  }

  // ─── Cadastros ──────────────────────────────────────────

  const addCategory = async () => {
    if (!newCategory.name.trim()) return
    try {
      await createFinanceCategory(newCategory.name, newCategory.kind)
      setNewCategory({ name: '', kind: newCategory.kind })
      fetchRegistries()
    } catch (e: any) {
      alert(e?.message || 'Erro ao criar categoria')
    }
  }

  const toggleCategory = async (cat: FinanceCategory) => {
    try {
      await updateFinanceCategory(cat.id, { active: !cat.active })
      fetchRegistries()
    } catch (e: any) {
      alert(e?.message || 'Erro ao atualizar categoria')
    }
  }

  const addPartner = async () => {
    if (!newPartner.trim()) return
    try {
      await createFinancePartner(newPartner)
      setNewPartner('')
      fetchRegistries()
    } catch (e: any) {
      alert(e?.message || 'Erro ao criar sócio')
    }
  }

  const togglePartner = async (p: FinancePartner) => {
    try {
      await updateFinancePartner(p.id, { active: !p.active })
      fetchRegistries()
    } catch (e: any) {
      alert(e?.message || 'Erro ao atualizar sócio')
    }
  }

  // ─── Renderização ───────────────────────────────────────

  const statusBadge = (entry: FinanceEntry) => {
    if (entry.status === 'pago') {
      return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">{entry.kind === 'pagar' ? 'Pago' : 'Recebido'}</Badge>
    }
    if (entry.status === 'cancelado') {
      return <Badge variant="secondary">Cancelado</Badge>
    }
    if (entry.is_overdue) {
      return <Badge variant="destructive">Vencido</Badge>
    }
    return <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">Pendente</Badge>
  }

  const kindCategories = (kind: 'pagar' | 'receber') =>
    categories.filter((c) => c.active && c.kind === (kind === 'pagar' ? 'despesa' : 'receita'))

  const cashflowChartData = (() => {
    if (!cashflow) return []
    const map = new Map<string, { month: string; entradas: number; saidas: number; projecao_entradas: number; projecao_saidas: number }>()
    for (const r of cashflow.realized) {
      map.set(r.month, { month: r.month, entradas: num(r.entradas), saidas: num(r.saidas), projecao_entradas: 0, projecao_saidas: 0 })
    }
    for (const p of cashflow.projected) {
      const row = map.get(p.month) || { month: p.month, entradas: 0, saidas: 0, projecao_entradas: 0, projecao_saidas: 0 }
      row.projecao_entradas = num(p.entradas)
      row.projecao_saidas = num(p.saidas)
      map.set(p.month, row)
    }
    const rows = Array.from(map.values()).sort((a, b) => a.month.localeCompare(b.month))
    let acc = 0
    return rows.map((r) => {
      acc += r.entradas - r.saidas + r.projecao_entradas - r.projecao_saidas
      return { ...r, label: monthLabel(r.month), saldo_acumulado: Math.round(acc * 100) / 100 }
    })
  })()

  const renderEntriesTab = (kind: 'pagar' | 'receber') => (
    <div className="space-y-4">
      {/* Filtros + novo */}
      <div className="flex flex-wrap items-center gap-2">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os status</SelectItem>
            <SelectItem value="pendente">Pendentes</SelectItem>
            <SelectItem value="vencido">Vencidos</SelectItem>
            <SelectItem value="pago">{kind === 'pagar' ? 'Pagos' : 'Recebidos'}</SelectItem>
            <SelectItem value="cancelado">Cancelados</SelectItem>
          </SelectContent>
        </Select>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[210px]"><SelectValue placeholder="Categoria" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas as categorias</SelectItem>
            {kindCategories(kind).map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={partnerFilter} onValueChange={setPartnerFilter}>
          <SelectTrigger className="w-[170px]"><SelectValue placeholder="Sócio" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os sócios</SelectItem>
            {partners.filter((p) => p.active).map((p) => (
              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="ml-auto flex gap-2">
          <Button variant="outline" size="icon" onClick={() => fetchEntries(kind)}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button onClick={() => openNewEntry(kind)}>
            <Plus className="mr-2 h-4 w-4" />
            {kind === 'pagar' ? 'Nova conta a pagar' : 'Nova conta a receber'}
          </Button>
        </div>
      </div>

      {/* Totais da seleção */}
      {totals && (
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          <span>Pendente: <strong className="text-foreground">{formatCurrency(num(totals.total_pendente))}</strong></span>
          <span>Vencido: <strong className="text-red-600">{formatCurrency(num(totals.total_vencido))}</strong></span>
          <span>{kind === 'pagar' ? 'Pago' : 'Recebido'}: <strong className="text-green-600">{formatCurrency(num(totals.total_pago))}</strong></span>
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : entries.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              Nenhum lançamento encontrado. Clique em "{kind === 'pagar' ? 'Nova conta a pagar' : 'Nova conta a receber'}".
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>{kind === 'pagar' ? 'Fornecedor' : 'Cliente/Origem'}</TableHead>
                  <TableHead>Sócio</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((entry) => (
                  <TableRow key={entry.id} className={entry.status === 'cancelado' ? 'opacity-50' : ''}>
                    <TableCell className="whitespace-nowrap">
                      {formatDate(entry.due_date)}
                      {entry.recurring && <RotateCcw className="ml-1 inline h-3 w-3 text-muted-foreground" aria-label="Recorrente" />}
                    </TableCell>
                    <TableCell className="max-w-[220px]">
                      <span className="block truncate font-medium">{entry.description}</span>
                      {entry.paid_at && (
                        <span className="text-xs text-muted-foreground">
                          {entry.kind === 'pagar' ? 'Pago em ' : 'Recebido em '}{formatDate(entry.paid_at)}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>{entry.category_name || '—'}</TableCell>
                    <TableCell>{entry.counterparty || '—'}</TableCell>
                    <TableCell>{entry.partner_name || 'Empresa'}</TableCell>
                    <TableCell className="text-right font-medium whitespace-nowrap">
                      {formatCurrency(num(entry.amount))}
                    </TableCell>
                    <TableCell>{statusBadge(entry)}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {entry.status === 'pendente' && (
                            <DropdownMenuItem onClick={() => { setPayForm({ paid_at: today(), payment_method: entry.payment_method || 'none' }); setPayDialog(entry) }}>
                              <CheckCircle className="mr-2 h-4 w-4" />
                              {kind === 'pagar' ? 'Marcar como pago' : 'Marcar como recebido'}
                            </DropdownMenuItem>
                          )}
                          {entry.status === 'pago' && (
                            <DropdownMenuItem onClick={() => handleUnpay(entry)}>
                              <RotateCcw className="mr-2 h-4 w-4" />
                              Estornar baixa
                            </DropdownMenuItem>
                          )}
                          {entry.status !== 'cancelado' && (
                            <DropdownMenuItem onClick={() => openEditEntry(entry)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          {entry.status !== 'cancelado' && (
                            <DropdownMenuItem onClick={() => handleCancel(entry)}>
                              <XCircle className="mr-2 h-4 w-4" />
                              Cancelar
                            </DropdownMenuItem>
                          )}
                          {entry.status === 'pendente' && (
                            <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(entry)}>
                              <Trash2 className="mr-2 h-4 w-4" />
                              Excluir
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Contas</h1>
        <p className="text-muted-foreground">Contas a pagar, contas a receber e fluxo de caixa</p>
      </div>

      {/* Período (vale para Resumo e para os vencimentos das listas) */}
      <PeriodFilter value={period} onChange={setPeriod} />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="resumo">Resumo</TabsTrigger>
          <TabsTrigger value="pagar">A Pagar</TabsTrigger>
          <TabsTrigger value="receber">A Receber</TabsTrigger>
          <TabsTrigger value="fluxo">Fluxo de Caixa</TabsTrigger>
          <TabsTrigger value="cadastros">Cadastros</TabsTrigger>
        </TabsList>

        {/* ─── RESUMO ─── */}
        <TabsContent value="resumo" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">A Pagar (aberto)</CardTitle>
                <ArrowDownCircle className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(num(summary?.cards.a_pagar))}</div>
                {num(summary?.cards.a_pagar_vencido) > 0 && (
                  <p className="text-xs text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {formatCurrency(num(summary?.cards.a_pagar_vencido))} vencido
                  </p>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">A Receber (aberto)</CardTitle>
                <ArrowUpCircle className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(num(summary?.cards.a_receber))}</div>
                {num(summary?.cards.a_receber_vencido) > 0 && (
                  <p className="text-xs text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {formatCurrency(num(summary?.cards.a_receber_vencido))} vencido
                  </p>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Pago no mês</CardTitle>
                <CalendarClock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(num(summary?.cards.pago_periodo))}</div>
                <p className="text-xs text-muted-foreground">saídas efetivadas</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Recebido no mês</CardTitle>
                <Wallet className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(num(summary?.cards.recebido_periodo))}</div>
                <p className="text-xs text-muted-foreground">entradas efetivadas</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Despesas por categoria (mês)</CardTitle>
              </CardHeader>
              <CardContent>
                {(summary?.by_category || []).filter((c) => c.kind === 'pagar').length === 0 ? (
                  <p className="text-sm text-muted-foreground">Sem despesas pagas no período.</p>
                ) : (
                  <Table>
                    <TableBody>
                      {(summary?.by_category || []).filter((c) => c.kind === 'pagar').map((c, i) => (
                        <TableRow key={i}>
                          <TableCell>{c.category}</TableCell>
                          <TableCell className="text-right font-medium">{formatCurrency(num(c.total))}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Por sócio pagante (mês)</CardTitle>
              </CardHeader>
              <CardContent>
                {(summary?.by_partner || []).length === 0 ? (
                  <p className="text-sm text-muted-foreground">Sem lançamentos baixados no período.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Sócio</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(summary?.by_partner || []).map((p, i) => (
                        <TableRow key={i}>
                          <TableCell>{p.partner}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{p.kind === 'pagar' ? 'Pagou' : 'Recebeu'}</Badge>
                          </TableCell>
                          <TableCell className="text-right font-medium">{formatCurrency(num(p.total))}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ─── A PAGAR / A RECEBER ─── */}
        <TabsContent value="pagar">{renderEntriesTab('pagar')}</TabsContent>
        <TabsContent value="receber">{renderEntriesTab('receber')}</TabsContent>

        {/* ─── FLUXO DE CAIXA ─── */}
        <TabsContent value="fluxo" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Fluxo de caixa</CardTitle>
              <p className="text-sm text-muted-foreground">
                Realizado (6 meses) + projeção de pendentes por vencimento (3 meses à frente)
              </p>
            </CardHeader>
            <CardContent>
              {cashflowChartData.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  Sem lançamentos ainda. Cadastre contas a pagar/receber para ver o fluxo.
                </p>
              ) : (
                <ResponsiveContainer width="100%" height={320}>
                  <ComposedChart data={cashflowChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                    <XAxis dataKey="label" fontSize={12} />
                    <YAxis fontSize={12} tickFormatter={(v: number) => `R$${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`} />
                    <ChartTooltip formatter={(v: number) => formatCurrency(v)} />
                    <Legend />
                    <Bar dataKey="entradas" name="Entradas" fill="#22c55e" stackId="in" />
                    <Bar dataKey="projecao_entradas" name="Entradas (projeção)" fill="#86efac" stackId="in" />
                    <Bar dataKey="saidas" name="Saídas" fill="#ef4444" stackId="out" />
                    <Bar dataKey="projecao_saidas" name="Saídas (projeção)" fill="#fca5a5" stackId="out" />
                    <Line dataKey="saldo_acumulado" name="Saldo acumulado" stroke="#0ea5e9" strokeWidth={2} dot />
                  </ComposedChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {cashflowChartData.length > 0 && (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Mês</TableHead>
                      <TableHead className="text-right">Entradas</TableHead>
                      <TableHead className="text-right">Saídas</TableHead>
                      <TableHead className="text-right">Resultado</TableHead>
                      <TableHead className="text-right">Saldo acumulado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cashflowChartData.map((r) => {
                      const inn = r.entradas + r.projecao_entradas
                      const out = r.saidas + r.projecao_saidas
                      return (
                        <TableRow key={r.month}>
                          <TableCell>{r.label}{(r.projecao_entradas > 0 || r.projecao_saidas > 0) && <span className="ml-1 text-xs text-muted-foreground">(c/ projeção)</span>}</TableCell>
                          <TableCell className="text-right text-green-600">{formatCurrency(inn)}</TableCell>
                          <TableCell className="text-right text-red-600">{formatCurrency(out)}</TableCell>
                          <TableCell className={`text-right font-medium ${inn - out >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(inn - out)}</TableCell>
                          <TableCell className={`text-right font-medium ${r.saldo_acumulado >= 0 ? '' : 'text-red-600'}`}>{formatCurrency(r.saldo_acumulado)}</TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ─── CADASTROS ─── */}
        <TabsContent value="cadastros" className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Plano de contas (categorias)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Nova categoria..."
                  value={newCategory.name}
                  onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                  onKeyDown={(e) => e.key === 'Enter' && addCategory()}
                />
                <Select value={newCategory.kind} onValueChange={(v: 'despesa' | 'receita') => setNewCategory({ ...newCategory, kind: v })}>
                  <SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="despesa">Despesa</SelectItem>
                    <SelectItem value="receita">Receita</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={addCategory}><Plus className="h-4 w-4" /></Button>
              </div>
              <Table>
                <TableBody>
                  {categories.map((c) => (
                    <TableRow key={c.id} className={c.active ? '' : 'opacity-50'}>
                      <TableCell>{c.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{c.kind === 'despesa' ? 'Despesa' : 'Receita'}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => toggleCategory(c)}>
                          {c.active ? 'Desativar' : 'Reativar'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Sócios</CardTitle>
              <p className="text-sm text-muted-foreground">
                Quem pagou/recebeu com recursos próprios. Lançamentos sem sócio contam como "Empresa (conta PJ)".
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Nome do sócio..."
                  value={newPartner}
                  onChange={(e) => setNewPartner(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addPartner()}
                />
                <Button onClick={addPartner}><Plus className="h-4 w-4" /></Button>
              </div>
              <Table>
                <TableBody>
                  {partners.map((p) => (
                    <TableRow key={p.id} className={p.active ? '' : 'opacity-50'}>
                      <TableCell>{p.name}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => togglePartner(p)}>
                          {p.active ? 'Desativar' : 'Reativar'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ─── DIALOG: novo/editar lançamento ─── */}
      <Dialog open={!!entryDialog} onOpenChange={(open) => !open && setEntryDialog(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {entryDialog?.editing ? 'Editar lançamento' : entryDialog?.kind === 'pagar' ? 'Nova conta a pagar' : 'Nova conta a receber'}
            </DialogTitle>
            <DialogDescription>
              {entryDialog?.kind === 'pagar'
                ? 'Despesa com vencimento. Identifique o sócio pagante quando não sair da conta PJ.'
                : 'Receita prevista. Identifique o sócio quando o valor entrar na conta dele.'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3 py-2">
            <div className="grid gap-1.5">
              <Label>Descrição *</Label>
              <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Ex.: Railway (infra) — agosto" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label>Valor (R$) *</Label>
                <Input type="number" min="0.01" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="0,00" />
              </div>
              <div className="grid gap-1.5">
                <Label>Vencimento *</Label>
                <Input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label>Categoria</Label>
                <Select value={form.category_id} onValueChange={(v) => setForm({ ...form, category_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sem categoria</SelectItem>
                    {entryDialog && kindCategories(entryDialog.kind).map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label>Sócio pagante</Label>
                <Select value={form.partner_id} onValueChange={(v) => setForm({ ...form, partner_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Empresa (conta PJ)</SelectItem>
                    {partners.filter((p) => p.active).map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label>{entryDialog?.kind === 'pagar' ? 'Fornecedor' : 'Cliente/Origem'}</Label>
                <Input value={form.counterparty} onChange={(e) => setForm({ ...form, counterparty: e.target.value })} placeholder="Opcional" />
              </div>
              <div className="grid gap-1.5">
                <Label>Forma de pagamento</Label>
                <Select value={form.payment_method} onValueChange={(v) => setForm({ ...form, payment_method: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Não informar</SelectItem>
                    {PAYMENT_METHODS.map((m) => (
                      <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label>Observações</Label>
              <Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
            <div className="flex items-center gap-6 pt-1">
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input type="checkbox" checked={form.recurring} onChange={(e) => setForm({ ...form, recurring: e.target.checked })} />
                Recorrente mensal
              </label>
              {!entryDialog?.editing && (
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <input type="checkbox" checked={form.alreadyPaid} onChange={(e) => setForm({ ...form, alreadyPaid: e.target.checked })} />
                  {entryDialog?.kind === 'pagar' ? 'Já está pago' : 'Já foi recebido'}
                </label>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEntryDialog(null)}>Cancelar</Button>
            <Button onClick={saveEntry} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {entryDialog?.editing ? 'Salvar alterações' : 'Criar lançamento'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── DIALOG: baixa (pagar/receber) ─── */}
      <Dialog open={!!payDialog} onOpenChange={(open) => !open && setPayDialog(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{payDialog?.kind === 'pagar' ? 'Confirmar pagamento' : 'Confirmar recebimento'}</DialogTitle>
            <DialogDescription>
              {payDialog?.description} — {formatCurrency(num(payDialog?.amount))}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="grid gap-1.5">
              <Label>Data</Label>
              <Input type="date" value={payForm.paid_at} onChange={(e) => setPayForm({ ...payForm, paid_at: e.target.value })} />
            </div>
            <div className="grid gap-1.5">
              <Label>Forma de pagamento</Label>
              <Select value={payForm.payment_method} onValueChange={(v) => setPayForm({ ...payForm, payment_method: v })}>
                <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Não informar</SelectItem>
                  {PAYMENT_METHODS.map((m) => (
                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {payDialog?.recurring && (
              <p className="text-xs text-muted-foreground">
                Conta recorrente: ao confirmar, a parcela do mês seguinte é criada automaticamente.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayDialog(null)}>Cancelar</Button>
            <Button onClick={confirmPay} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
