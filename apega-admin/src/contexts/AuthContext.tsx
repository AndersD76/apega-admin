import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { checkAdminAuth } from '@/lib/api'

interface User {
  id: string
  name: string
  email: string
  is_admin: boolean
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('admin_token')

      if (!token) {
        setIsLoading(false)
        if (location.pathname !== '/login') {
          navigate('/login')
        }
        return
      }

      try {
        const response = await checkAdminAuth()

        if (response.success && response.user) {
          setUser(response.user)
          if (location.pathname === '/login') {
            navigate('/')
          }
        } else {
          localStorage.removeItem('admin_token')
          localStorage.removeItem('admin_user')
          if (location.pathname !== '/login') {
            navigate('/login')
          }
        }
      } catch (error) {
        console.error('Erro ao verificar autenticacao:', error)
        localStorage.removeItem('admin_token')
        localStorage.removeItem('admin_user')
        if (location.pathname !== '/login') {
          navigate('/login')
        }
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [])

  const logout = () => {
    localStorage.removeItem('admin_token')
    localStorage.removeItem('admin_user')
    setUser(null)
    navigate('/login')
  }

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      isAuthenticated: !!user,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
