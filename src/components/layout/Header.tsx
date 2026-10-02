import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, Search, Menu, X, Heart, Moon, Sun, LogOut, Package, User as UserIcon, Receipt, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { getProducts, getUsers, getOrders, getAdminNotifications, AdminNotification } from '@/lib/api'
import { formatCurrency } from '@/lib/utils'

/** "agora", "5min", "3h", "2d" — o dropdown so tem espaco para isso. */
function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return 'agora'
  if (min < 60) return `${min}min`
  const h = Math.floor(min / 60)
  if (h < 24) return `${h}h`
  return `${Math.floor(h / 24)}d`
}
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'

interface HeaderProps {
  onMenuClick?: () => void
  isMobileMenuOpen?: boolean
}

interface SearchHit {
  kind: 'produto' | 'usuario' | 'pedido'
  id: string
  title: string
  subtitle: string
  /** Termo que a pagina de destino usa para filtrar. */
  query: string
  path: string
}

export function Header({ onMenuClick, isMobileMenuOpen }: HeaderProps) {
  const [isDark, setIsDark] = useState(false)
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const [term, setTerm] = useState('')
  const [hits, setHits] = useState<SearchHit[]>([])
  const [searching, setSearching] = useState(false)
  const [open, setOpen] = useState(false)
  const boxRef = useRef<HTMLDivElement>(null)

  const [notifications, setNotifications] = useState<AdminNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  // Notificacoes reais, recarregadas a cada 60s.
  useEffect(() => {
    let alive = true
    const load = async () => {
      try {
        const res = await getAdminNotifications({ limit: 8 })
        if (!alive || !res.success) return
        setNotifications(res.notifications || [])
        setUnreadCount(res.stats?.unread || 0)
      } catch {
        // Sino sem numero e melhor do que numero inventado.
      }
    }
    load()
    const timer = setInterval(load, 60000)
    return () => { alive = false; clearInterval(timer) }
  }, [])

  // Fecha o dropdown ao clicar fora.
  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  // Busca com debounce: evita disparar tres requests a cada tecla.
  useEffect(() => {
    const q = term.trim()
    if (q.length < 2) {
      setHits([])
      setSearching(false)
      return
    }
    setSearching(true)
    const timer = setTimeout(async () => {
      const [prods, users, orders] = await Promise.all([
        getProducts({ search: q, limit: 4 }).catch(() => null),
        getUsers({ search: q, limit: 4 }).catch(() => null),
        getOrders({ search: q, limit: 4 }).catch(() => null),
      ])

      const found: SearchHit[] = []
      prods?.products?.slice(0, 4).forEach(p => found.push({
        kind: 'produto', id: p.id, title: p.title,
        subtitle: `${p.seller_name || 'sem vendedor'} · ${formatCurrency(p.price)}`,
        query: p.title, path: '/produtos',
      }))
      users?.users?.slice(0, 4).forEach(u => found.push({
        kind: 'usuario', id: u.id, title: u.name,
        subtitle: u.email, query: u.email, path: '/usuarios',
      }))
      orders?.orders?.slice(0, 4).forEach(o => found.push({
        kind: 'pedido', id: o.id, title: o.order_number || o.id.slice(0, 8),
        subtitle: `${o.buyer_name || '-'} · ${formatCurrency(o.total_amount)}`,
        query: o.order_number || '', path: '/pedidos',
      }))

      setHits(found)
      setSearching(false)
      setOpen(true)
    }, 350)

    return () => clearTimeout(timer)
  }, [term])

  const goTo = (hit: SearchHit) => {
    setOpen(false)
    setTerm('')
    navigate(`${hit.path}?q=${encodeURIComponent(hit.query)}`)
  }

  // Enter sem escolher um resultado: manda para a secao com mais achados.
  const submitSearch = () => {
    const q = term.trim()
    if (!q) return
    const path = hits[0]?.path || '/produtos'
    setOpen(false)
    setTerm('')
    navigate(`${path}?q=${encodeURIComponent(q)}`)
  }

  const iconFor = (kind: SearchHit['kind']) =>
    kind === 'produto' ? <Package className="h-4 w-4" />
      : kind === 'usuario' ? <UserIcon className="h-4 w-4" />
        : <Receipt className="h-4 w-4" />

  const toggleTheme = () => {
    setIsDark(!isDark)
    document.documentElement.classList.toggle('dark')
  }

  return (
    <header className="sticky top-0 z-40 border-b bg-card">
      <div className="flex h-16 items-center gap-4 px-4 md:px-6">
        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={onMenuClick}
        >
          {isMobileMenuOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </Button>

        {/* Mobile Logo */}
        <div className="flex items-center gap-2 md:hidden">
          <Heart className="h-6 w-6 text-primary" />
          <span className="font-bold">Largô</span>
        </div>

        {/* Search */}
        <div className="flex-1">
          <div className="relative max-w-md" ref={boxRef}>
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar usuários, produtos, pedidos..."
              className="w-full pl-8"
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              onFocus={() => hits.length > 0 && setOpen(true)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') submitSearch()
                if (e.key === 'Escape') setOpen(false)
              }}
            />
            {searching && (
              <Loader2 className="absolute right-2.5 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />
            )}

            {open && term.trim().length >= 2 && (
              <div className="absolute left-0 right-0 top-11 z-50 overflow-hidden rounded-lg border bg-popover shadow-lg">
                {hits.length === 0 ? (
                  <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                    {searching ? 'Buscando...' : 'Nenhum resultado'}
                  </div>
                ) : (
                  <div className="max-h-96 overflow-auto py-1">
                    {(['produto', 'usuario', 'pedido'] as const).map(kind => {
                      const group = hits.filter(h => h.kind === kind)
                      if (group.length === 0) return null
                      return (
                        <div key={kind}>
                          <div className="px-3 py-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                            {kind === 'produto' ? 'Produtos' : kind === 'usuario' ? 'Usuários' : 'Pedidos'}
                          </div>
                          {group.map(hit => (
                            <button
                              key={`${hit.kind}-${hit.id}`}
                              onClick={() => goTo(hit)}
                              className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-accent"
                            >
                              <span className="text-muted-foreground">{iconFor(hit.kind)}</span>
                              <span className="min-w-0 flex-1">
                                <span className="block truncate text-sm font-medium">{hit.title}</span>
                                <span className="block truncate text-xs text-muted-foreground">{hit.subtitle}</span>
                              </span>
                            </button>
                          ))}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Theme Toggle */}
          <Button variant="ghost" size="icon" onClick={toggleTheme}>
            {isDark ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </Button>

          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 text-xs"
                  >
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel>Notificações</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="max-h-80 overflow-auto">
                {notifications.length === 0 ? (
                  <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                    Nenhuma notificação
                  </div>
                ) : (
                  notifications.map((n) => (
                    <DropdownMenuItem key={n.id} className="flex flex-col items-start gap-1 p-3">
                      <div className="flex w-full items-center justify-between gap-2">
                        <span className="truncate text-sm font-medium">{n.title}</span>
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {timeAgo(n.created_at)}
                        </span>
                      </div>
                      {n.message && (
                        <span className="line-clamp-2 text-xs text-muted-foreground">{n.message}</span>
                      )}
                    </DropdownMenuItem>
                  ))
                )}
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="justify-center text-primary" onClick={() => navigate('/comunicacoes')}>
                Ver todas as notificações
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={user?.avatar_url || ''} alt="Admin" />
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    AD
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{user?.name || 'Administrador'}</p>
                  <p className="text-xs text-muted-foreground">{user?.email || 'admin@largo.com.br'}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {/*
                "Meu Perfil", "Configuracoes" e "Logs de Atividade" sairam daqui:
                os tres itens nunca tiveram onClick nem rota de destino — clicar
                so fechava o menu. A tela de Configuracoes do sistema fica no menu
                lateral; perfil de admin e log de auditoria nao existem no produto.
              */}
              <DropdownMenuItem className="text-destructive" onClick={logout}>
                <LogOut className="mr-2 h-4 w-4" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
