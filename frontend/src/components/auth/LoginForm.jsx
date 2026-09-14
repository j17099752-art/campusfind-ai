import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'
import Button from '../ui/Button'
import Input from '../ui/Input'

export default function LoginForm({ onClose, onSwitchToRegister, onSwitchToAdmin, redirectTo, defaultRole = 'student' }) {
  const { signIn } = useAuth()
  const navigate   = useNavigate()

  const [role,     setRole]     = useState(defaultRole) // 'student' | 'admin'
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!email.trim())    { setError('Please enter your email.');    return }
    if (!password.trim()) { setError('Please enter your password.'); return }

    setLoading(true)
    const { error: err } = await signIn({ email: email.trim(), password })
    setLoading(false)

    if (err) {
      setError(err.message || 'Invalid email or password.')
      return
    }

    toast.success('Welcome back! 👋')
    onClose()
    if (redirectTo) navigate(redirectTo)
  }

  return (
    <div>
      {/* Role toggle */}
      <div className="flex rounded-[10px] border border-[#e5e7eb] overflow-hidden mb-6">
        <button
          type="button"
          onClick={() => { setRole('student'); setError('') }}
          className={`flex-1 py-2.5 text-sm font-semibold transition-all ${
            role === 'student' ? 'bg-[#4f46e5] text-white' : 'bg-white text-[#6b7280] hover:bg-[#eef2ff]'
          }`}
        >
          🎓 Student
        </button>
        <button
          type="button"
          onClick={() => { setRole('admin'); setError('') }}
          className={`flex-1 py-2.5 text-sm font-semibold transition-all ${
            role === 'admin' ? 'bg-[#d97706] text-white' : 'bg-white text-[#6b7280] hover:bg-[#eef2ff]'
          }`}
        >
          👑 Admin
        </button>
      </div>

      <div className="text-center mb-6">
        <h3 className="text-xl font-extrabold text-[#1e1b4b]">
          {role === 'admin' ? '👑 Admin Login' : '🎓 Student Login'}
        </h3>
        <p className="text-sm text-[#6b7280] mt-1">
          {role === 'admin' ? 'Enter your admin credentials.' : 'Login with your email and password.'}
        </p>
      </div>

      {error && (
        <div className="bg-[#fee2e2] border border-[#fca5a5] text-[#b91c1c] text-sm rounded-[8px] px-4 py-2.5 mb-4 font-medium">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Email"
          type="email"
          placeholder={role === 'admin' ? 'admin@campusfind.dev' : 'student@college.edu'}
          value={email}
          onChange={e => setEmail(e.target.value)}
          autoComplete="email"
          required
        />
        <Input
          label="Password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={e => setPassword(e.target.value)}
          autoComplete="current-password"
          required
        />

        <Button type="submit" variant={role === 'admin' ? 'gold' : 'primary'} fullWidth loading={loading}>
          {role === 'admin' ? '🔐 Login as Admin' : '🎓 Login'}
        </Button>
      </form>

      {role === 'student' && (
        <p className="text-center text-sm text-[#6b7280] mt-4">
          Don't have an account?{' '}
          <button onClick={onSwitchToRegister} className="text-[#4f46e5] font-semibold hover:underline">
            Register here
          </button>
        </p>
      )}
    </div>
  )
}
