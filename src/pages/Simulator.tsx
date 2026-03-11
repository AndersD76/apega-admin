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
import { getSettings, Settings } from '@/lib/api'
import {
  Calculator,
  DollarSign,
  Percent,
  CreditCard,
  Wallet,
  TrendingUp,
  Crown,
  User,
} from 'lucide-react'

// Fee configuration (matching the settings in the database)
const DEFAULT_FEES = {
  commissionPercentage: 12,
  premiumCommissionPercentage: 8,
  pixFeePercent: 0.99,
  cardFeePercent: 3.99,
  cardFeeFixed: 0.39,
  withdrawalFee: 2.00,
  cashbackPercentage: 5,
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
            premiumCommissionPercentage: settings.commission_premium ?? prev.premiumCommissionPercentage,
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
    const commissionRate = sellerType === 'premium'
      ? fees.premiumCommissionPercentage
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
    const cashbackAmount = (totalBuyerPays * fees.cashbackPercentage) / 100

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
                      Vendedor Free ({fees.commissionPercentage}% comissao)
                    </div>
                  </SelectItem>
                  <SelectItem value="premium">
                    <div className="flex items-center gap-2">
                      <Crown className="h-4 w-4 text-yellow-500" />
                      Vendedor Premium ({fees.premiumCommissionPercentage}% comissao)
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
                {sellerType === 'premium' ? (
                  <Crown className="h-4 w-4 text-yellow-500" />
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
                <Crown className="h-4 w-4 text-yellow-500" />
                Comissao Premium
              </div>
              <p className="mt-2 text-2xl font-bold">{fees.premiumCommissionPercentage}%</p>
              <p className="text-xs text-muted-foreground">Por venda realizada</p>
            </div>

            <div className="rounded-lg border p-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Wallet className="h-4 w-4 text-green-500" />
                Taxa PIX
              </div>
              <p className="mt-2 text-2xl font-bold">{fees.pixFeePercent}%</p>
              <p className="text-xs text-muted-foreground">Do valor total</p>
            </div>

            <div className="rounded-lg border p-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                <CreditCard className="h-4 w-4 text-blue-500" />
                Taxa Cartao
              </div>
              <p className="mt-2 text-2xl font-bold">{fees.cardFeePercent}% + R$ {fees.cardFeeFixed.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">Por transacao</p>
            </div>

            <div className="rounded-lg border p-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                <DollarSign className="h-4 w-4 text-purple-500" />
                Taxa de Saque
              </div>
              <p className="mt-2 text-2xl font-bold">{formatCurrency(fees.withdrawalFee)}</p>
              <p className="text-xs text-muted-foreground">Por saque realizado</p>
            </div>

            <div className="rounded-lg border p-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                <TrendingUp className="h-4 w-4 text-emerald-500" />
                Cashback Comprador
              </div>
              <p className="mt-2 text-2xl font-bold">{fees.cashbackPercentage}%</p>
              <p className="text-xs text-muted-foreground">Do valor da compra</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
