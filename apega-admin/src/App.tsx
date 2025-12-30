import { Routes, Route, Navigate } from 'react-router-dom'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Layout } from '@/components/layout'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { Loader2 } from 'lucide-react'

// Pages
import Login from '@/pages/Login'
import Dashboard from '@/pages/Dashboard'
import Users from '@/pages/Users'
import Products from '@/pages/Products'
import Orders from '@/pages/Orders'
import Carts from '@/pages/Carts'
import Shipping from '@/pages/Shipping'
import Finance from '@/pages/Finance'
import Analytics from '@/pages/Analytics'
import Simulator from '@/pages/Simulator'
import Communications from '@/pages/Communications'
import Reports from '@/pages/Reports'
import Settings from '@/pages/Settings'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-pink-500" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="usuarios" element={<Users />} />
        <Route path="produtos" element={<Products />} />
        <Route path="pedidos" element={<Orders />} />
        <Route path="carrinhos" element={<Carts />} />
        <Route path="envios" element={<Shipping />} />
        <Route path="financeiro" element={<Finance />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="simulador" element={<Simulator />} />
        <Route path="comunicacoes" element={<Communications />} />
        <Route path="denuncias" element={<Reports />} />
        <Route path="configuracoes" element={<Settings />} />
      </Route>
    </Routes>
  )
}

function App() {
  return (
    <TooltipProvider>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </TooltipProvider>
  )
}

export default App
