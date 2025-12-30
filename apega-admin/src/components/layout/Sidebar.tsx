import { NavLink, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { useAuth } from '@/contexts/AuthContext'
import {
  LayoutDashboard,
  Users,
  ShoppingBag,
  Package,
  Truck,
  DollarSign,
  BarChart3,
  MessageSquare,
  Settings,
  ShoppingCart,
  Calculator,
  AlertTriangle,
  LogOut,
  Heart,
} from 'lucide-react'

interface NavItem {
  title: string
  href: string
  icon: React.ReactNode
  badge?: number
}

const mainNavItems: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/',
    icon: <LayoutDashboard className="h-5 w-5" />,
  },
  {
    title: 'Usuarios',
    href: '/usuarios',
    icon: <Users className="h-5 w-5" />,
  },
  {
    title: 'Produtos',
    href: '/produtos',
    icon: <ShoppingBag className="h-5 w-5" />,
  },
  {
    title: 'Pedidos',
    href: '/pedidos',
    icon: <Package className="h-5 w-5" />,
  },
  {
    title: 'Carrinhos Abandonados',
    href: '/carrinhos',
    icon: <ShoppingCart className="h-5 w-5" />,
  },
]

const secondaryNavItems: NavItem[] = [
  {
    title: 'Envios',
    href: '/envios',
    icon: <Truck className="h-5 w-5" />,
  },
  {
    title: 'Financeiro',
    href: '/financeiro',
    icon: <DollarSign className="h-5 w-5" />,
  },
  {
    title: 'Analytics',
    href: '/analytics',
    icon: <BarChart3 className="h-5 w-5" />,
  },
  {
    title: 'Simulador',
    href: '/simulador',
    icon: <Calculator className="h-5 w-5" />,
  },
]

const managementNavItems: NavItem[] = [
  {
    title: 'Comunicações',
    href: '/comunicacoes',
    icon: <MessageSquare className="h-5 w-5" />,
  },
  {
    title: 'Denúncias',
    href: '/denuncias',
    icon: <AlertTriangle className="h-5 w-5" />,
  },
  {
    title: 'Configurações',
    href: '/configuracoes',
    icon: <Settings className="h-5 w-5" />,
  },
]

export function Sidebar() {
  const location = useLocation()
  const { logout } = useAuth()

  const NavItemComponent = ({ item }: { item: NavItem }) => {
    const isActive = location.pathname === item.href

    return (
      <NavLink
        to={item.href}
        className={cn(
          'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent',
          isActive
            ? 'bg-primary text-primary-foreground hover:bg-primary/90'
            : 'text-muted-foreground hover:text-foreground'
        )}
      >
        {item.icon}
        <span>{item.title}</span>
        {item.badge && (
          <span className="ml-auto rounded-full bg-destructive px-2 py-0.5 text-xs text-destructive-foreground">
            {item.badge}
          </span>
        )}
      </NavLink>
    )
  }

  return (
    <div className="hidden border-r bg-card md:block md:w-64">
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center gap-2 border-b px-6">
          <Heart className="h-8 w-8 text-primary" />
          <div className="flex flex-col">
            <span className="text-lg font-bold">Apega Admin</span>
            <span className="text-xs text-muted-foreground">Painel de Controle</span>
          </div>
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 px-3 py-4">
          <div className="space-y-4">
            {/* Main Navigation */}
            <div className="space-y-1">
              <p className="px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Principal
              </p>
              {mainNavItems.map((item) => (
                <NavItemComponent key={item.href} item={item} />
              ))}
            </div>

            <Separator />

            {/* Secondary Navigation */}
            <div className="space-y-1">
              <p className="px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Operações
              </p>
              {secondaryNavItems.map((item) => (
                <NavItemComponent key={item.href} item={item} />
              ))}
            </div>

            <Separator />

            {/* Management Navigation */}
            <div className="space-y-1">
              <p className="px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Gestão
              </p>
              {managementNavItems.map((item) => (
                <NavItemComponent key={item.href} item={item} />
              ))}
            </div>
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="border-t p-4">
          <button
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-all hover:bg-accent hover:text-foreground"
          >
            <LogOut className="h-5 w-5" />
            <span>Sair</span>
          </button>
        </div>
      </div>
    </div>
  )
}
