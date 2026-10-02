import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { formatCurrency } from '@/lib/utils'
import { getSettings, SETTINGS_WITHOUT_EFFECT, Settings } from '@/lib/api'
import {
  Calculator,
  DollarSign,
  Percent,
  CreditCard,
  Wallet,
  TrendingUp,
  Store,
  User,
  AlertTriangle,
} from 'lucide-react'

/**
 * Fallbacks usados so enquanto `GET /admin/settings` nao responde.
 *
 * `cashbackPercentage` era 5 e nunca vinha do backend na pratica, entao o
 * simulador anunciava 5% de cashback enquanto o sistema pagava 2%. Agora o
 * numero sai de `settings.cashback_buyer` (mesma fonte da tela de
 * Configuracoes e de `services/orderState.js`) e este fallback espelha o
 * `DEFAULT_CASHBACK_RATE` do backend, para as duas pontas nunca divergirem.
 */
const DEFAULT_FEES = {
  commissionPercentage: 20,
  outletCommissionPercentage: 5,
  pixFeePercent: 0.99,
  cardFeePercent: 3.99,
  cardFeeFixed: 0.39,
  withdrawalFee: 2.00,
  cashbackPercentage: 2,
}

/** Espelha a whitelist do backend: taxa marcada aqui e salva, mas nao cobrada. */
const semEfeito = (key: string) => (SETTINGS_WITHOUT_EFFECT as readonly string[]).includes(key)

/** Selo de "numero ilustrativo" nos cards de taxa que o sistema ainda nao aplica. */
function SemEfeitoTag() {
  return (
    <p className="mt-2 flex items-start gap-1 rounded-md bg-amber-100 px-2 py-1 text-[11px] leading-tight text-amber-900 dark:bg-amber-900/30 dark:text-amber-200">
      <AlertTriangle className="mt-px h-3 w-3 shrink-0" />
      <span>Valor ilustrativo — ainda nao aplicado pelo sistema.</span>
    </p>
  )
}

interface SimulationResult {
  productPrice: number
  shippingPrice: number
  totalBuyerPays: number
  commissionRate: number
  commissionAmount: number
  paymentFee: number
  paymentFeeDescription: string
  sellerReceives: number
  platformProfit: number
  cashbackAmount: number
}

export default function Simulator() {
  const [productPrice, setProductPrice] = useState<number>(100)
  const [shippingPrice, setShippingPrice] = useState<number>(15)
  const [paymentMethod, setPaymentMethod] = useState<string>('pix')
  const [sellerType, setSellerType] = useState<string>('free')
  const [fees, setFees] = useState(DEFAULT_FEES);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const res = await getSettings();
        if (res.success && res.settings) {
          const settings = res.settings as Settings;
          setFees((prev) => ({
            ...prev,
            commissionPercentage: settings.commission_free ?? prev.commissionPercentage,
            outletCommissionPercentage: settings.commission_outlet ?? prev.outletCommissionPercentage,
            pixFeePercent: settings.pix_fee ?? prev.pixFeePercent,
            cardFeePercent: settings.card_fee_percent ?? prev.cardFeePercent,
            cardFeeFixed: settings.card_fee_fixed ?? prev.cardFeeFixed,
            withdrawalFee: settings.withdrawal_fee ?? prev.withdrawalFee,
            cashbackPercentage: settings.cashback_buyer ?? prev.cashbackPercentage,
          }));
        }
      } catch (error) {
        console.error('Erro ao carregar settings:', error);
      }
    };
    loadSettings();
  }, []);


  const simulation = useMemo<SimulationResult>(() => {
    const commissionRate = sellerType === 'outlet'
      ? fees.outletCommissionPercentage
      : fees.commissionPercentage

    const commissionAmount = (productPrice * commissionRate) / 100

    let paymentFee = 0
    let paymentFeeDescription = ''

    switch (paymentMethod) {
      case 'pix':
        paymentFee = (productPrice + shippingPrice) * (fees.pixFeePercent / 100)
        paymentFeeDescription = `${fees.pixFeePercent}% do total`
        break
      case 'card':
        paymentFee = ((productPrice + shippingPrice) * (fees.cardFeePercent / 100)) + fees.cardFeeFixed
        paymentFeeDescription = `${fees.cardFeePercent}% + R$ ${fees.cardFeeFixed.toFixed(2)}`
        break
    }

    const totalBuyerPays = productPrice + shippingPrice
    const sellerReceives = productPrice - commissionAmount
    const platformProfit = commissionAmount - paymentFee
    // Base = preco do produto, sem frete. E o que `creditOrderEffects` em
    // services/orderState.js credita (`order.product_price * taxa`); somar o
    // frete aqui inflava o cashback simulado em relacao ao que o comprador
    // recebe de verdade.
    const cashbackAmount = (productPrice * fees.cashbackPercentage) / 100

    return {
      productPrice,
      shippingPrice,
      totalBuyerPays,
      commissionRate,
      commissionAmount,
      paymentFee,
      paymentFeeDescription,
      sellerReceives,
      platformProfit,
      cashbackAmount,
    }
  }, [productPrice, shippingPrice, paymentMethod, sellerType, fees])

  const ResultRow = ({ label, value, highlight = false, icon }: {
    label: string
    value: string
    highlight?: boolean
    icon?: React.ReactNode
  }) => (
    <div className={`flex items-center justify-between py-3 ${highlight ? 'font-semibold' : ''}`}>
      <div className="flex items-center gap-2">
        {icon}
        <span className={highlight ? 'text-foreground' : 'text-muted-foreground'}>{label}</span>
      </div>
      <span className={highlight ? 'text-primary text-lg' : ''}>{value}</span>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Simulador de Negocio</h1>
        <p className="text-muted-foreground">
          Simule transacoes e entenda o fluxo financeiro do marketplace
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Input Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Dados da Transacao
            </CardTitle>
            <CardDescription>
              Configure os parametros da venda para simular
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Preco do Produto</label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-muted-foreground">R$</span>
                <Input
                  type="number"
                  value={productPrice}
                  onChange={(e) => setProductPrice(Number(e.target.value))}
                  className="pl-10"
                  min={0}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Preco do Frete</label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-muted-foreground">R$</span>
                <Input
                  type="number"
                  value={shippingPrice}
                  onChange={(e) => setShippingPrice(Number(e.target.value))}
                  className="pl-10"
                  min={0}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo de Vendedor</label>
              <Select value={sellerType} onValueChange={setSellerType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Vendedor padrao ({fees.commissionPercentage}% comissao)
                    </div>
                  </SelectItem>
                  <SelectItem value="outlet">
                    <div className="flex items-center gap-2">
                      <Store className="h-4 w-4 text-blue-500" />
                      Lojista / CNPJ ({fees.outletCommissionPercentage}% comissao)
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Forma de Pagamento</label>
              <Tabs value={paymentMethod} onValueChange={setPaymentMethod}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="pix" className="gap-2">
                    <Wallet className="h-4 w-4" />
                    PIX
                  </TabsTrigger>
                  <TabsTrigger value="card" className="gap-2">
                    <CreditCard className="h-4 w-4" />
                    Cartao
                  </TabsTrigger>
                </TabsList>
              </Tabs>
              <p className="text-xs text-muted-foreground">
                Taxa: {simulation.paymentFeeDescription}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Results Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Resultado da Simulacao
            </CardTitle>
            <CardDescription>
              Detalhamento completo da transacao
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Buyer Section */}
            <div className="rounded-lg bg-muted/50 p-4">
              <h3 className="mb-3 flex items-center gap-2 font-semibold">
                <User className="h-4 w-4" />
                Comprador Paga
              </h3>
              <ResultRow
                label="Produto"
                value={formatCurrency(simulation.productPrice)}
              />
              <ResultRow
                label="Frete"
                value={formatCurrency(simulation.shippingPrice)}
              />
              <Separator />
              <ResultRow
                label="Total"
                value={formatCurrency(simulation.totalBuyerPays)}
                highlight
              />
              <div className="mt-2 flex items-center gap-2 text-sm text-green-600">
                <Badge variant="success" className="gap-1">
                  <Percent className="h-3 w-3" />
                  Cashback {fees.cashbackPercentage}%
                </Badge>
                <span>+{formatCurrency(simulation.cashbackAmount)} de volta</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Calculado sobre o preco do produto (sem frete), como faz o backend.
              </p>
            </div>

            {/* Platform Section */}
            <div className="rounded-lg border p-4">
              <h3 className="mb-3 flex items-center gap-2 font-semibold">
                <DollarSign className="h-4 w-4" />
                Plataforma
              </h3>
              <ResultRow
                label={`Comissao (${simulation.commissionRate}%)`}
                value={formatCurrency(simulation.commissionAmount)}
              />
              <ResultRow
                label="Taxa Gateway"
                value={`- ${formatCurrency(simulation.paymentFee)}`}
              />
              <Separator />
              <ResultRow
                label="Lucro Liquido"
                value={formatCurrency(simulation.platformProfit)}
                highlight
                icon={<TrendingUp className="h-4 w-4 text-green-500" />}
              />
            </div>

            {/* Seller Section */}
            <div className="rounded-lg bg-primary/5 p-4">
              <h3 className="mb-3 flex items-center gap-2 font-semibold">
                {sellerType === 'outlet' ? (
                  <Store className="h-4 w-4 text-blue-500" />
                ) : (
                  <User className="h-4 w-4" />
                )}
                Vendedor Recebe
              </h3>
              <ResultRow
                label="Preco do Produto"
                value={formatCurrency(simulation.productPrice)}
              />
              <ResultRow
                label={`Comissao (${simulation.commissionRate}%)`}
                value={`- ${formatCurrency(simulation.commissionAmount)}`}
              />
              <Separator />
              <ResultRow
                label="Valor Liquido"
                value={formatCurrency(simulation.sellerReceives)}
                highlight
              />
              <p className="mt-2 text-xs text-muted-foreground">
                * Valor liberado apos confirmacao de entrega
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Fee Reference Table */}
      <Card>
        <CardHeader>
          <CardTitle>Tabela de Taxas</CardTitle>
          <CardDescription>
            Referencia rapida de todas as taxas aplicadas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border p-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Percent className="h-4 w-4 text-primary" />
                Comissao Free
              </div>
              <p className="mt-2 text-2xl font-bold">{fees.commissionPercentage}%</p>
              <p className="text-xs text-muted-foreground">Por venda realizada</p>
            </div>

            <div className="rounded-lg border p-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Store className="h-4 w-4 text-blue-500" />
                Comissao Lojista
              </div>
              <p className="mt-2 text-2xl font-bold">{fees.outletCommissionPercentage}%</p>
              <p className="text-xs text-muted-foreground">Por venda realizada</p>
            </div>

            <div className="rounded-lg border p-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Wallet className="h-4 w-4 text-green-500" />
                Taxa PIX
              </div>
              <p className="mt-2 text-2xl font-bold">{fees.pixFeePercent}%</p>
              <p className="text-xs text-muted-foreground">Do valor total</p>
              {semEfeito('pix_fee') && <SemEfeitoTag />}
            </div>

            <div className="rounded-lg border p-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                <CreditCard className="h-4 w-4 text-blue-500" />
                Taxa Cartao
              </div>
              <p className="mt-2 text-2xl font-bold">{fees.cardFeePercent}% + R$ {fees.cardFeeFixed.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">Por transacao</p>
              {(semEfeito('card_fee_percent') || semEfeito('card_fee_fixed')) && <SemEfeitoTag />}
            </div>

            <div className="rounded-lg border p-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                <DollarSign className="h-4 w-4 text-purple-500" />
                Taxa de Saque
              </div>
              <p className="mt-2 text-2xl font-bold">{formatCurrency(fees.withdrawalFee)}</p>
              <p className="text-xs text-muted-foreground">Por saque realizado</p>
              {semEfeito('withdrawal_fee') && <SemEfeitoTag />}
            </div>

            <div className="rounded-lg border p-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                <TrendingUp className="h-4 w-4 text-emerald-500" />
                Cashback Comprador
              </div>
              <p className="mt-2 text-2xl font-bold">{fees.cashbackPercentage}%</p>
              <p className="text-xs text-muted-foreground">
                Do preco do produto — vem de Configuracoes ({'cashback_buyer'}).
              </p>
            </div>
          </div>
          {/* O simulador le `GET /admin/settings`, a mesma fonte da tela de
              Configuracoes. Comissoes e cashback saem exatamente como o backend
              aplica; as taxas de gateway ainda sao apenas referencia. */}
          <p className="mt-4 text-xs text-muted-foreground">
            Comissoes e cashback vem de Configuracoes e sao os valores que o sistema aplica de verdade.
            As taxas de gateway e de saque ficam salvas, mas nenhuma regra do backend as usa ainda.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
