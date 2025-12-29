import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Gift, Star, Crown, Users, TrendingUp, CheckCircle2 } from 'lucide-react'

interface PromoStats {
  totalSlots: number
  usedSlots: number
  availableSlots: number
  percentUsed: number
  premiumSlots: { total: number; used: number; available: number }
  reducedRateSlots: { total: number; used: number; available: number }
}

interface PromoUser {
  id: string
  user_id?: string
  user_name?: string
  user_email?: string
  name?: string
  email?: string
  avatar_url?: string
  promo_name?: string
  subscription_type: string
  commission_rate: number
  is_official?: boolean
  created_at?: string
  claimed_at?: string
}

interface OfficialStore {
  id: string
  name: string
  email: string
  avatar_url?: string
  subscription_type: string
  commission_rate: number
  is_official: boolean
  is_verified: boolean
  promo_type?: string
  created_at: string
}

export default function Promos() {
  const token = localStorage.getItem('admin_token')
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<PromoStats | null>(null)
  const [promoUsers, setPromoUsers] = useState<PromoUser[]>([])
  const [officialStores, setOfficialStores] = useState<OfficialStore[]>([])

  const API_URL = import.meta.env.VITE_API_URL || 'https://apega-desapega-production.up.railway.app/api'

  useEffect(() => {
    fetchPromoData()
  }, [])

  const fetchPromoData = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${API_URL}/promo/admin`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setStats(data.stats)
        setPromoUsers(data.promoUsers || [])
        setOfficialStores(data.officialStores || [])
      }
    } catch (error) {
      console.error('Erro ao carregar dados de promocao:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Promocoes de Lancamento</h1>
        <p className="text-muted-foreground">
          Gerencie as vagas promocionais e acompanhe os usuarios beneficiados
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-amber-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Vagas</CardTitle>
            <Gift className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.totalSlots || 50}</div>
            <p className="text-xs text-muted-foreground">Vagas de lancamento</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vagas Ocupadas</CardTitle>
            <Users className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.usedSlots || 0}</div>
            <p className="text-xs text-muted-foreground">Vendedoras cadastradas</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vagas Disponiveis</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.availableSlots || 50}</div>
            <p className="text-xs text-muted-foreground">Ainda restam</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Preenchimento</CardTitle>
            <Star className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.percentUsed || 0}%</div>
            <Progress value={stats?.percentUsed || 0} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Promo Slots Detail */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-amber-500" />
              Premium Gratis (5 vagas)
            </CardTitle>
            <CardDescription>
              Premium gratis por 1 ano + comissao de 5%
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between text-sm">
              <span>Ocupadas</span>
              <span className="font-semibold">{stats?.premiumSlots?.used || 0}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Disponiveis</span>
              <span className="font-semibold text-green-600">{stats?.premiumSlots?.available || 5}</span>
            </div>
            <Progress
              value={stats?.premiumSlots?.total ? ((stats.premiumSlots.used / stats.premiumSlots.total) * 100) : 0}
              className="h-3"
            />
            <p className="text-xs text-muted-foreground">
              {stats?.premiumSlots?.total
                ? Math.round((stats.premiumSlots.used / stats.premiumSlots.total) * 100)
                : 0}% preenchido
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-blue-500" />
              Taxa Reduzida (45 vagas)
            </CardTitle>
            <CardDescription>
              Comissao de apenas 5% (economia de 50%)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between text-sm">
              <span>Ocupadas</span>
              <span className="font-semibold">{stats?.reducedRateSlots?.used || 0}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Disponiveis</span>
              <span className="font-semibold text-green-600">{stats?.reducedRateSlots?.available || 45}</span>
            </div>
            <Progress
              value={stats?.reducedRateSlots?.total ? ((stats.reducedRateSlots.used / stats.reducedRateSlots.total) * 100) : 0}
              className="h-3"
            />
            <p className="text-xs text-muted-foreground">
              {stats?.reducedRateSlots?.total
                ? Math.round((stats.reducedRateSlots.used / stats.reducedRateSlots.total) * 100)
                : 0}% preenchido
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Official Stores */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-blue-500" />
            Lojas Oficiais
          </CardTitle>
          <CardDescription>
            Lojas verificadas e certificadas pela plataforma
          </CardDescription>
        </CardHeader>
        <CardContent>
          {officialStores.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhuma loja oficial cadastrada ainda
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Loja</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead>Comissao</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {officialStores.map((store) => (
                  <TableRow key={store.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          {store.avatar_url ? (
                            <AvatarImage src={store.avatar_url} />
                          ) : null}
                          <AvatarFallback className="bg-blue-100 text-blue-600">
                            {store.name?.charAt(0)?.toUpperCase() || 'L'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium flex items-center gap-2">
                            {store.name}
                            <CheckCircle2 className="h-4 w-4 text-blue-500" />
                          </div>
                          <div className="text-sm text-muted-foreground">{store.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="default" className="bg-amber-500">
                        <Crown className="h-3 w-3 mr-1" />
                        Premium
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold text-green-600">{store.commission_rate}%</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="border-blue-500 text-blue-500">
                        Loja Oficial
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(store.created_at)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Promo Users */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-amber-500" />
            Usuarios Promocionais
          </CardTitle>
          <CardDescription>
            Vendedoras que garantiram vagas na promocao de lancamento
          </CardDescription>
        </CardHeader>
        <CardContent>
          {promoUsers.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhum usuario promocional cadastrado ainda
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead>Comissao</TableHead>
                  <TableHead>Data</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {promoUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          {user.avatar_url ? (
                            <AvatarImage src={user.avatar_url} />
                          ) : null}
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {(user.user_name || user.name || 'U').charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{user.user_name || user.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {user.user_email || user.email}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {user.promo_name === 'premium_launch' ? (
                        <Badge className="bg-amber-500">
                          <Crown className="h-3 w-3 mr-1" />
                          Premium Gratis
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <Gift className="h-3 w-3 mr-1" />
                          Taxa Reduzida
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {user.subscription_type || 'free'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold text-green-600">{user.commission_rate}%</span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(user.claimed_at || user.created_at || new Date().toISOString())}
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
}
