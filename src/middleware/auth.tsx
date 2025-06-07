import { ReactNode, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { account } from '../lib/appwrite'

interface AuthMiddlewareProps {
  children: ReactNode
}

export const AuthMiddleware = ({ children }: AuthMiddlewareProps) => {
  const navigate = useNavigate()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check if user is logged in
        await account.get()
        // If this succeeds, the user is logged in
      } catch (error) {
        // If there's an error, user is not authenticated
        navigate('/login', { replace: true })
      }
    }

    checkAuth()
  }, [navigate])

  return <>{children}</>
}

export const withAuth = (Component: React.ComponentType) => {
  return function ProtectedRoute(props: any) {
    return (
      <AuthMiddleware>
        <Component {...props} />
      </AuthMiddleware>
    )
  }
} 