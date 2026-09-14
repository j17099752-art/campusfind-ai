import { useNavigate } from 'react-router-dom'
import { useModal } from '../../context/ModalContext'
import { useAuth }  from '../../context/AuthContext'
import Badge   from '../ui/Badge'
import Button  from '../ui/Button'
import { formatDate, getCategoryEmoji } from '../../utils/helpers'

export default function ItemCard({ item, onClaim, showClaimBtn = true }) {
  const { openModal }  = useModal()
  const { isLoggedIn } = useAuth()
  const navigate = useNavigate()

  const isLost  = item.item_type === 'lost'
  const emoji   = getCategoryEmoji(item.category)

  function handleView() {
    openModal('itemDetail', { item })
  }

  function handleClaim(e) {
    e.stopPropagation()
    if (!isLoggedIn) {
      openModal('login')
      return
    }
    if (onClaim) onClaim(item)
    else openModal('claim', { item })
  }

  return (
    <div className="item-card">
      <div className={`card-status-bar ${item.item_type}`} />

      {item.image_url && (
        <img
          src={item.image_url}
          alt={item.item_name}
          className="card-img"
          loading="lazy"
          onError={e => { e.target.style.display = 'none' }}
        />
      )}

      <div className="card-body">
        <div className="flex justify-between items-start gap-2 mb-2">
          <span className="card-title">{emoji} {item.item_name}</span>
          <div className="flex flex-col gap-1 flex-shrink-0">
            <Badge variant={item.item_type}>{isLost ? '🔴 Lost' : '🟢 Found'}</Badge>
            {item.status !== 'active' && (
              <Badge variant={item.status}>
                {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
              </Badge>
            )}
          </div>
        </div>

        <div className="card-meta">
          <div className="card-meta-row"><span>🏷️</span><span>{item.category}</span></div>
          <div className="card-meta-row"><span>📍</span><span>{item.location}</span></div>
          <div className="card-meta-row"><span>🎨</span><span>{item.color}</span></div>
        </div>

        <p className="card-desc">{item.description}</p>
      </div>

      <div className="card-footer">
        <span className="card-date">📅 {formatDate(item.date)}</span>
        <div className="flex gap-2 flex-wrap">
          <Button size="sm" variant="outline" onClick={handleView}>View</Button>
          {showClaimBtn && !isLost && item.status === 'active' && (
            <Button size="sm" variant="warning" onClick={handleClaim}>🔐 Claim</Button>
          )}
        </div>
      </div>
    </div>
  )
}
