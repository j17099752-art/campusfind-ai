import clsx from 'clsx'

const variants = {
  lost:      'badge-lost',
  found:     'badge-found',
  active:    'badge-active',
  matched:   'badge-matched',
  claimed:   'badge-claimed',
  recovered: 'badge-recovered',
  closed:    'badge-closed',
  pending:   'badge-pending',
  approved:  'badge-approved',
  rejected:  'badge-rejected',
  admin:     'badge-admin',
  under_review: 'badge-matched',
}

export default function Badge({ children, variant = 'active', className = '' }) {
  return (
    <span className={clsx('badge', variants[variant] || variants.active, className)}>
      {children}
    </span>
  )
}
