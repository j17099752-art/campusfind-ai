import { useState } from 'react'
import { useAuth }  from '../../context/AuthContext'
import { useModal } from '../../context/ModalContext'
import { submitClaim } from '../../services/claimsService'
import { getAccessToken } from '../../utils/getToken'
import { CLAIM_QUESTIONS } from '../../utils/constants'
import Button from '../ui/Button'
import { Textarea } from '../ui/Input'
import toast from 'react-hot-toast'

export default function ClaimModal({ item, onClose }) {
  const { user, isLoggedIn } = useAuth()
  const { openModal } = useModal()

  const [answers,  setAnswers]  = useState(CLAIM_QUESTIONS.map(() => ''))
  const [loading,  setLoading]  = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error,    setError]    = useState('')

  if (!isLoggedIn) {
    return (
      <div className="text-center py-6">
        <p className="text-[#6b7280] mb-4">You need to be logged in to submit a claim.</p>
        <Button onClick={() => { onClose(); openModal('login') }}>Login</Button>
      </div>
    )
  }

  if (!item) return null

  if (submitted) {
    return (
      <div className="text-center py-8">
        <div className="text-5xl mb-4">✅</div>
        <h3 className="text-xl font-bold text-[#1e1b4b] mb-2">Claim Submitted!</h3>
        <p className="text-[#6b7280] mb-2">Your claim for <strong>{item.item_name}</strong> has been submitted.</p>
        <p className="text-sm text-[#9ca3af] mb-6">An admin will review your answers and notify you with the decision.</p>
        <Button variant="outline" onClick={onClose}>Close</Button>
      </div>
    )
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    const unfilled = answers.some(a => !a.trim())
    if (unfilled) { setError('Please answer all verification questions.'); return }

    setLoading(true)
    try {
      const token = await getAccessToken()
      const combined = CLAIM_QUESTIONS.map((q, i) => `Q: ${q}\nA: ${answers[i]}`).join('\n\n')
      await submitClaim({ itemId: item.id, claimantId: user.id, verificationAnswer: combined }, token)
      setSubmitted(true)
      toast.success('Claim submitted! Admin will review your answers.')
    } catch (err) {
      setError(err.message || 'Failed to submit claim. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      {/* Item info */}
      <div className="flex items-center gap-3 bg-[#eef2ff] rounded-[10px] p-3 mb-5">
        {item.image_url && (
          <img src={item.image_url} alt={item.item_name} className="w-14 h-14 object-cover rounded-[8px] flex-shrink-0" />
        )}
        <div>
          <p className="font-bold text-[#1e1b4b] text-sm">{item.item_name}</p>
          <p className="text-xs text-[#6b7280]">📍 {item.location} · {item.category}</p>
        </div>
      </div>

      <div className="bg-[#fef3c7] border border-[#fde68a] rounded-[10px] px-4 py-3 mb-5">
        <p className="text-xs text-[#92400e] font-medium">
          🔒 Your answers are submitted privately to admin for review. Contact info is not revealed until your claim is approved.
        </p>
      </div>

      {error && (
        <div className="bg-[#fee2e2] border border-[#fca5a5] text-[#b91c1c] text-sm rounded-[8px] px-4 py-2.5 mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {CLAIM_QUESTIONS.map((q, i) => (
          <Textarea
            key={i}
            label={`${i + 1}. ${q}`}
            required
            rows={2}
            value={answers[i]}
            onChange={e => {
              const updated = [...answers]
              updated[i] = e.target.value
              setAnswers(updated)
            }}
            placeholder="Your answer…"
          />
        ))}

        <Button type="submit" variant="warning" fullWidth loading={loading}>
          🔐 Submit Claim Request
        </Button>
      </form>
    </div>
  )
}
