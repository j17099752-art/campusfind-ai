import { useAuth }  from '../../context/AuthContext'
import { useModal } from '../../context/ModalContext'
import Badge  from '../ui/Badge'
import Button from '../ui/Button'
import { formatDate, getCategoryEmoji, maskContact } from '../../utils/helpers'

export default function ItemDetailModal({ item, onClose }) {
  const { user, isAdmin } = useAuth()
  const { openModal } = useModal()

  if (!item) return null

  const isLost   = item.item_type === 'lost'
  const emoji    = getCategoryEmoji(item.category)
  const isOwner  = user && item.user_id === user.id
  const showContact = isAdmin || isOwner

  return (
    <div>
      {/* Color bar */}
      <div className={`h-1.5 -mx-6 -mt-6 mb-5 ${isLost ? 'bg-gradient-to-r from-[#ef4444] to-[#f87171]' : 'bg-gradient-to-r from-[#10b981] to-[#34d399]'}`} />

      {/* Header */}
      <div className="flex justify-between items-start gap-3 mb-4">
        <h2 className="text-xl font-extrabold text-[#1e1b4b] leading-tight">
          {emoji} {item.item_name}
        </h2>
        <div className="flex flex-col gap-1.5 flex-shrink-0">
          <Badge variant={item.item_type}>{isLost ? '🔴 Lost' : '🟢 Found'}</Badge>
          {item.status !== 'active' && (
            <Badge variant={item.status}>
              {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
            </Badge>
          )}
        </div>
      </div>

      {/* Image */}
      {item.image_url && (
        <img
          src={item.image_url}
          alt={item.item_name}
          className="w-full max-h-64 object-cover rounded-[12px] mb-5 border border-[#e5e7eb]"
          onError={e => { e.target.style.display = 'none' }}
        />
      )}

      {/* Details grid */}
      <dl className="grid grid-cols-2 gap-3 mb-5">
        {[
          { label: 'Category',    value: `${emoji} ${item.category}` },
          { label: 'Color',       value: item.color },
          { label: 'Location',    value: `📍 ${item.location}` },
          { label: 'Date',        value: formatDate(item.date) },
          { label: 'Reported by', value: item.profiles?.full_name || '—' },
          { label: 'Status',      value: item.status?.charAt(0).toUpperCase() + item.status?.slice(1) },
        ].map(d => (
          <div key={d.label} className="bg-[#f8faff] rounded-[8px] p-3">
            <dt className="text-xs font-bold text-[#9ca3af] uppercase tracking-wide mb-0.5">{d.label}</dt>
            <dd className="text-sm font-semibold text-[#1e1b4b]">{d.value}</dd>
          </div>
        ))}
      </dl>

      {/* Description */}
      <div className="bg-[#f8faff] rounded-[12px] p-4 mb-5">
        <h4 className="text-xs font-bold text-[#9ca3af] uppercase tracking-wide mb-2">Description</h4>
        <p className="text-sm text-[#374151] leading-relaxed">{item.description}</p>
      </div>

      {/* Contact */}
      <div className="bg-[#eef2ff] rounded-[12px] p-4 mb-5">
        <h4 className="text-xs font-bold text-[#9ca3af] uppercase tracking-wide mb-2">
          Contact {isLost ? 'Owner' : 'Finder'}
        </h4>
        {showContact ? (
          <p className="text-sm font-semibold text-[#4f46e5]">📞 {item.contact_information}</p>
        ) : (
          <div className="flex items-center gap-3">
            <p className="text-sm text-[#6b7280]">
              🔒 {maskContact(item.contact_information)}
            </p>
            <span className="text-xs text-[#9ca3af]">(Login to see full contact)</span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3 flex-wrap">
        {!isLost && item.status === 'active' && (
          <Button
            variant="warning"
            onClick={() => { onClose(); openModal('claim', { item }) }}
          >
            🔐 Claim This Item
          </Button>
        )}
        <Button variant="outline" onClick={onClose}>Close</Button>
      </div>
    </div>
  )
}
