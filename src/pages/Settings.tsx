import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { getSettings, updateSetting, SETTINGS_WITHOUT_EFFECT, Settings as SettingsType } from '@/lib/api'
import {
  Percent,
  DollarSign,
  Bell,
  Shield,
  Save,
  Store,
  Truck,
  CreditCard,
  Loader2,
  RefreshCw,
  AlertCircle,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react'

/**
 * Aviso de campo inerte.
 *
 * O painel grava doze chaves em `settings`, mas hoje o backend so LE quatro
 * (`commission_free`, `commission_outlet`, `first_purchase_shipping_discount` e
 * `cashback_buyer` — a whitelist em `analytics.js` documenta isso). As outras
 * oito sao salvas e nunca consultadas: o operador mudava a "Taxa PIX" achando
 * que tinha mudado a taxa cobrada, e nada acontecia. Enquanto as regras nao
 * forem ligadas, a tela precisa dizer a verdade em cada campo.
 */
function SemEfeito({ children }: { children?: React.ReactNode }) {
  return (
    <p className="flex items-start gap-1.5 rounded-md bg-amber-100 px-2 py-1.5 text-xs text-amber-900 dark:bg-amber-900/30 dark:text-amber-200">
      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
      <span>
        <strong>Ainda nao aplicado pelo sistema.</strong> O valor fica salvo, mas nenhuma
        regra do backend le esta configuracao hoje.{children ? ' ' : ''}{children}
      </span>
    </p>
  )
}

/** Marca [ATIVA] os campos que o backend realmente le. */
function Ativa() {
  return (
    <p className="flex items-start gap-1.5 text-xs text-green-700 dark:text-green-400">
      <CheckCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
      <span>Aplicada pelo sistema em tempo real.</span>
    </p>
  )
}

export default function Settings() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [settings, setSettings] = useState<SettingsType>({
    // Placeholders ate o fetch responder — alinhados com o settings do banco
    // para que uma falha de rede nao exiba taxa errada na tela.
    commission_free: 20,
    commission_outlet: 5,
    first_purchase_shipping_discount: 20,
    pix_fee: 0.99,
    card_fee_percent: 3.99,
    card_fee_fixed: 0.39,
    boleto_fee: 3.49,
    withdrawal_fee: 2.00,
    min_withdrawal: 20,
    release_days: 3,
    // 2 pontos percentuais: mesmo fallback de `DEFAULT_CASHBACK_RATE` em
    // services/orderState.js. O placeholder era 5 e nao correspondia a nada.
    cashback_buyer: 2,
    cart_abandon_hours: 1,
  })

  const fetchSettings = async () => {
    setLoading(true)
    setError(null)

    try {
      const res = await getSettings()
      if (res.success && res.settings) {
        setSettings(prev => ({
          ...prev,
          ...res.settings,
        }))
      }
    } catch (err: any) {
      console.error('Erro ao carregar configuracoes:', err)
      setError(err.message || 'Erro ao carregar configuracoes')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSettings()
  }, [])

  const handleSave = async (section: string) => {
    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const updates: { key: string; value: any }[] = []

      if (section === 'fees') {
        updates.push(
          { key: 'commission_free', value: settings.commission_free },
          { key: 'commission_outlet', value: settings.commission_outlet },
          { key: 'pix_fee', value: settings.pix_fee },
          { key: 'card_fee_percent', value: settings.card_fee_percent },
          { key: 'card_fee_fixed', value: settings.card_fee_fixed },
          { key: 'boleto_fee', value: settings.boleto_fee },
          { key: 'withdrawal_fee', value: settings.withdrawal_fee },
          { key: 'first_purchase_shipping_discount', value: settings.first_purchase_shipping_discount },
        )
      } else if (section === 'financial') {
        updates.push(
          { key: 'min_withdrawal', value: settings.min_withdrawal },
          { key: 'release_days', value: settings.release_days },
          { key: 'cashback_buyer', value: settings.cashback_buyer },
        )
      } else if (section === 'notifications') {
        updates.push(
          { key: 'cart_abandon_hours', value: settings.cart_abandon_hours },
        )
      }

      // Um campo apagado vira NaN no parseFloat e o backend responde 400 com a
      // mensagem da whitelist. Barrar aqui da um erro compreensivel na tela.
      const invalid = updates.find(u => !Number.isFinite(Number(u.value)))
      if (invalid) {
        throw new Error(`Preencha um numero valido para "${invalid.key}"`)
      }

      for (const update of updates) {
        await updateSetting(update.key, update.value)
      }

      setSuccess('Configuracoes salvas com sucesso!')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err: any) {
      console.error('Erro ao salvar configuracoes:', err)
      setError(err.message || 'Erro ao salvar configuracoes')
    } finally {
      setSaving(false)
    }
  }

  // A marcacao vem da lista exportada por lib/api.ts (espelho da whitelist do
  // backend), e nao de um `if` escrito a mao aqui: quando uma regra for ligada,
  // basta tirar a chave da lista e o aviso some de todas as telas de uma vez.
  const semEfeito = (key: string) => (SETTINGS_WITHOUT_EFFECT as readonly string[]).includes(key)

  const handleChange = (key: string, value: number) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Configuracoes</h1>
          <p className="text-muted-foreground">Gerencie as configuracoes do marketplace</p>
        </div>
        <Button variant="outline" onClick={fetchSettings} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 bg-destructive/10 text-destructive rounded-lg">
          <AlertCircle className="h-5 w-5" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 p-4 bg-green-500/10 text-green-600 rounded-lg">
          <CheckCircle className="h-5 w-5" />
          <span>{success}</span>
        </div>
      )}

      <Tabs defaultValue="fees">
        <TabsList>
          <TabsTrigger value="fees">Taxas</TabsTrigger>
          <TabsTrigger value="payments">Pagamentos</TabsTrigger>
          <TabsTrigger value="notifications">Notificacoes</TabsTrigger>
          <TabsTrigger value="security">Seguranca</TabsTrigger>
        </TabsList>

        <TabsContent value="fees" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Percent className="h-5 w-5" />
                Taxas de Comissao
              </CardTitle>
              <CardDescription>Configure as taxas cobradas nas transacoes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Comissao Vendedor Free</label>
                  <div className="relative">
                    <Input
                      type="number"
                      value={settings.commission_free}
                      onChange={(e) => handleChange('commission_free', parseFloat(e.target.value))}
                      className="pr-8"
                    />
                    <span className="absolute right-3 top-2.5 text-muted-foreground">%</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Taxa padrao para todos os vendedores</p>
                  <Ativa />
                </div>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium">
                    <Store className="h-4 w-4 text-primary" />
                    Comissao Lojista (PJ)
                  </label>
                  <div className="relative">
                    <Input
                      type="number"
                      value={settings.commission_outlet}
                      onChange={(e) => handleChange('commission_outlet', parseFloat(e.target.value))}
                      className="pr-8"
                    />
                    <span className="absolute right-3 top-2.5 text-muted-foreground">%</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Contas com CNPJ (lojistas)</p>
                  <Ativa />
                </div>
              </div>

              <Separator />

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium">
                    <Truck className="h-4 w-4 text-primary" />
                    Desconto no frete — primeira compra
                  </label>
                  <div className="relative">
                    <Input
                      type="number"
                      value={settings.first_purchase_shipping_discount}
                      onChange={(e) => handleChange('first_purchase_shipping_discount', parseFloat(e.target.value))}
                      className="pr-8"
                    />
                    <span className="absolute right-3 top-2.5 text-muted-foreground">%</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Vale so no primeiro pedido pago do comprador. 0 desliga a promocao.
                  </p>
                  <Ativa />
                </div>
              </div>

              <Separator />

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Taxa PIX</label>
                  <div className="relative">
                    <Input
                      type="number"
                      step="0.01"
                      value={settings.pix_fee}
                      onChange={(e) => handleChange('pix_fee', parseFloat(e.target.value))}
                      className="pr-8"
                    />
                    <span className="absolute right-3 top-2.5 text-muted-foreground">%</span>
                  </div>
                  {semEfeito('pix_fee') && <SemEfeito>A taxa cobrada de verdade e a do contrato com o Asaas.</SemEfeito>}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Taxa Cartao (%)</label>
                  <div className="relative">
                    <Input
                      type="number"
                      step="0.01"
                      value={settings.card_fee_percent}
                      onChange={(e) => handleChange('card_fee_percent', parseFloat(e.target.value))}
                      className="pr-8"
                    />
                    <span className="absolute right-3 top-2.5 text-muted-foreground">%</span>
                  </div>
                  {semEfeito('card_fee_percent') && <SemEfeito>A taxa cobrada de verdade e a do contrato com o Asaas.</SemEfeito>}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Taxa Cartao (Fixa)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-muted-foreground">R$</span>
                    <Input
                      type="number"
                      step="0.01"
                      value={settings.card_fee_fixed}
                      onChange={(e) => handleChange('card_fee_fixed', parseFloat(e.target.value))}
                      className="pl-10"
                    />
                  </div>
                  {semEfeito('card_fee_fixed') && <SemEfeito>A taxa cobrada de verdade e a do contrato com o Asaas.</SemEfeito>}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Taxa Boleto</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-muted-foreground">R$</span>
                    <Input
                      type="number"
                      step="0.01"
                      value={settings.boleto_fee}
                      onChange={(e) => handleChange('boleto_fee', parseFloat(e.target.value))}
                      className="pl-10"
                    />
                  </div>
                  {semEfeito('boleto_fee') && <SemEfeito>A taxa cobrada de verdade e a do contrato com o Asaas.</SemEfeito>}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Taxa de Saque</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-muted-foreground">R$</span>
                    <Input
                      type="number"
                      step="0.01"
                      value={settings.withdrawal_fee}
                      onChange={(e) => handleChange('withdrawal_fee', parseFloat(e.target.value))}
                      className="pl-10"
                    />
                  </div>
                  {semEfeito('withdrawal_fee') && <SemEfeito>Nenhuma taxa e descontada do saque hoje.</SemEfeito>}
                </div>
              </div>

              <Button onClick={() => handleSave('fees')} disabled={saving}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Salvar Alteracoes
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Configuracoes Financeiras
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Saque Minimo</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-muted-foreground">R$</span>
                    <Input
                      type="number"
                      value={settings.min_withdrawal}
                      onChange={(e) => handleChange('min_withdrawal', parseFloat(e.target.value))}
                      className="pl-10"
                    />
                  </div>
                  {semEfeito('min_withdrawal') && <SemEfeito>O minimo aceito continua sendo o do codigo de pagamentos.</SemEfeito>}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Dias para Liberacao</label>
                  <Input
                    type="number"
                    value={settings.release_days}
                    onChange={(e) => handleChange('release_days', parseInt(e.target.value))}
                  />
                  <p className="text-xs text-muted-foreground">Apos confirmacao de entrega</p>
                  {semEfeito('release_days') && <SemEfeito>O saldo do vendedor e creditado pela maquina de estados do pedido, sem esperar estes dias.</SemEfeito>}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Cashback Comprador</label>
                  <div className="relative">
                    <Input
                      type="number"
                      value={settings.cashback_buyer}
                      onChange={(e) => handleChange('cashback_buyer', parseFloat(e.target.value))}
                      className="pr-8"
                      min={0}
                      max={20}
                      step="0.5"
                    />
                    <span className="absolute right-3 top-2.5 text-muted-foreground">%</span>
                  </div>
                  {/* Pontos percentuais, nao fracao: `2` significa 2%. O backend
                      (services/orderState.js) divide por 100 na leitura e recusa
                      valor fora de 0-20. Gravar `0.02` aqui daria 0,02% de cashback. */}
                  <p className="text-xs text-muted-foreground">
                    Em pontos percentuais: <strong>2 = 2%</strong> do valor do pedido. Entre 0 e 20.
                  </p>
                  <Ativa />
                </div>
              </div>

              <Button onClick={() => handleSave('financial')} disabled={saving}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Salvar Alteracoes
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Gateways de Pagamento
              </CardTitle>
              <CardDescription>Configure os provedores de pagamento</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded bg-green-100 flex items-center justify-center">
                    <span className="font-bold text-green-600">PIX</span>
                  </div>
                  <div>
                    <p className="font-medium">PIX</p>
                    <p className="text-sm text-muted-foreground">Pagamento instantaneo</p>
                  </div>
                </div>
                <Badge variant="success">Ativo</Badge>
              </div>

              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded bg-blue-100 flex items-center justify-center">
                    <CreditCard className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">Cartao de Credito</p>
                    <p className="text-sm text-muted-foreground">Visa, Mastercard, Elo</p>
                  </div>
                </div>
                <Badge variant="success">Ativo</Badge>
              </div>

              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded bg-orange-100 flex items-center justify-center">
                    <span className="font-bold text-orange-600 text-xs">BOL</span>
                  </div>
                  <div>
                    <p className="font-medium">Boleto Bancario</p>
                    <p className="text-sm text-muted-foreground">Compensacao em ate 3 dias</p>
                  </div>
                </div>
                <Badge variant="success">Ativo</Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Configuracoes de Notificacao
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Tempo para Abandono de Carrinho</label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={settings.cart_abandon_hours}
                    onChange={(e) => handleChange('cart_abandon_hours', parseInt(e.target.value))}
                    className="w-24"
                  />
                  <span className="text-muted-foreground">hora(s)</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Tempo apos ultima atividade para considerar carrinho abandonado
                </p>
                {semEfeito('cart_abandon_hours') && (
                  <SemEfeito>A tela de Carrinhos usa 24 h fixas, definidas na consulta do backend.</SemEfeito>
                )}
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">E-mail de Recuperacao</p>
                    <p className="text-sm text-muted-foreground">Enviar e-mail para carrinhos abandonados</p>
                  </div>
                  <Badge variant="success">Ativo</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Push de Recuperacao</p>
                    <p className="text-sm text-muted-foreground">Enviar push notification</p>
                  </div>
                  <Badge variant="success">Ativo</Badge>
                </div>
              </div>

              <Button onClick={() => handleSave('notifications')} disabled={saving}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Salvar Alteracoes
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Seguranca
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Autenticacao de Dois Fatores</p>
                  <p className="text-sm text-muted-foreground">Exigir 2FA para admins</p>
                </div>
                <Badge variant="success">Ativo</Badge>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Logs de Auditoria</p>
                  <p className="text-sm text-muted-foreground">Registrar todas as acoes administrativas</p>
                </div>
                <Badge variant="success">Ativo</Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
