import { useNavigate } from 'react-router-dom'
import Button from '../components/ui/Button'

export default function NotFoundPage() {
  const navigate = useNavigate()
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
      <div className="text-8xl mb-6">🎒</div>
      <h1 className="text-4xl font-extrabold text-[#1e1b4b] mb-3">Page Not Found</h1>
      <p className="text-[#6b7280] mb-8 max-w-sm">
        Looks like this page got lost on campus. Let's find our way back.
      </p>
      <div className="flex gap-4 flex-wrap justify-center">
        <Button variant="primary" onClick={() => navigate('/')}>🏠 Go Home</Button>
        <Button variant="outline" onClick={() => navigate('/find')}>🔍 Find Items</Button>
      </div>
    </div>
  )
}
