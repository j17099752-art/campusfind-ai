import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import Spinner from '../ui/Spinner'

export default function AdminRoute({ children }) {
  const { isLoggedIn, isAdmin, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!isLoggedIn || !isAdmin) {
    return <Navigate to="/" replace />
  }

  return children
}
