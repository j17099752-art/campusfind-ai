export default function EmptyState({ icon = '📋', title = 'Nothing here yet', description = '', action }) {
  return (
    <div className="empty-state">
      <span className="empty-icon">{icon}</span>
      <p className="font-semibold text-[#374151] mb-1">{title}</p>
      {description && <p className="text-sm text-[#9ca3af] mb-4">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
