import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'
import Button from '../ui/Button'
import Input from '../ui/Input'

const DEPARTMENTS = [
  'Computer Science', 'Information Technology', 'Electronics',
  'Mechanical Engineering', 'Civil Engineering', 'Business Administration',
  'Commerce', 'Arts', 'Science', 'Other',
]

export default function RegisterForm({ onClose, onSwitchToLogin, redirectTo }) {
  const { signUp } = useAuth()
  const navigate   = useNavigate()

  const [form,    setForm]    = useState({ fullName: '', email: '', password: '', confirmPassword: '', studentId: '', department: '' })
  const [errors,  setErrors]  = useState({})
  const [loading, setLoading] = useState(false)

  function validate() {
    const e = {}
    if (!form.fullName.trim())          e.fullName = 'Full name is required.'
    if (!form.email.trim())             e.email = 'Email is required.'
    if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email.'
    if (!form.password)                 e.password = 'Password is required.'
    if (form.password.length < 6)       e.password = 'Password must be at least 6 characters.'
    if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match.'
    if (!form.studentId.trim())         e.studentId = 'Student ID is required.'
    if (!form.department)               e.department = 'Please select your department.'
    return e
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    setErrors(errs)
    if (Object.keys(errs).length) return

    setLoading(true)
    const { error } = await signUp({
      email:      form.email.trim(),
      password:   form.password,
      fullName:   form.fullName.trim(),
      studentId:  form.studentId.trim(),
      department: form.department,
    })
    setLoading(false)

    if (error) {
      setErrors({ general: error.message || 'Registration failed. Try again.' })
      return
    }

    toast.success('Account created! Please check your email to confirm, then log in.')
    onClose()
    if (redirectTo) navigate(redirectTo)
  }

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }))

  return (
    <div>
      <div className="text-center mb-6">
        <h3 className="text-xl font-extrabold text-[#1e1b4b]">🎓 Create Account</h3>
        <p className="text-sm text-[#6b7280] mt-1">Join CampusFind AI as a student</p>
      </div>

      {errors.general && (
        <div className="bg-[#fee2e2] border border-[#fca5a5] text-[#b91c1c] text-sm rounded-[8px] px-4 py-2.5 mb-4 font-medium">
          {errors.general}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        <Input label="Full Name" placeholder="Your full name" value={form.fullName} onChange={set('fullName')} error={errors.fullName} required />
        <Input label="Email" type="email" placeholder="student@college.edu" value={form.email} onChange={set('email')} error={errors.email} autoComplete="email" required />
        <Input label="Student ID" placeholder="e.g. CS2024001" value={form.studentId} onChange={set('studentId')} error={errors.studentId} required />

        <div className="form-group">
          <label className="block text-sm font-semibold text-[#1e1b4b] mb-1">
            Department <span className="text-[#ef4444]">*</span>
          </label>
          <select
            value={form.department}
            onChange={set('department')}
            className="w-full px-3 py-2.5 border-[1.5px] rounded-[8px] text-sm text-[#1e1b4b] bg-white outline-none transition-all border-[#e5e7eb] focus:border-[#4f46e5] cursor-pointer"
          >
            <option value="">-- Select Department --</option>
            {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          {errors.department && <p className="text-xs text-[#ef4444] font-medium mt-1">{errors.department}</p>}
        </div>

        <Input label="Password" type="password" placeholder="Min. 6 characters" value={form.password} onChange={set('password')} error={errors.password} autoComplete="new-password" required />
        <Input label="Confirm Password" type="password" placeholder="Repeat password" value={form.confirmPassword} onChange={set('confirmPassword')} error={errors.confirmPassword} autoComplete="new-password" required />

        <Button type="submit" variant="primary" fullWidth loading={loading}>
          🎓 Create Account
        </Button>
      </form>

      <p className="text-center text-sm text-[#6b7280] mt-4">
        Already have an account?{' '}
        <button onClick={onSwitchToLogin} className="text-[#4f46e5] font-semibold hover:underline">Login here</button>
      </p>
    </div>
  )
}
