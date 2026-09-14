export function SkeletonCard() {
  return (
    <div className="item-card">
      <div className="card-status-bar skeleton" />
      <div className="card-body">
        <div className="skeleton h-40 w-full rounded-[8px] mb-3" />
        <div className="skeleton h-5 w-3/4 rounded mb-2" />
        <div className="skeleton h-4 w-1/2 rounded mb-1" />
        <div className="skeleton h-4 w-2/3 rounded mb-1" />
        <div className="skeleton h-4 w-1/2 rounded mb-4" />
        <div className="skeleton h-10 w-full rounded-[10px]" />
      </div>
    </div>
  )
}

export function SkeletonGrid({ count = 6 }) {
  return (
    <div className="items-grid">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  )
}
