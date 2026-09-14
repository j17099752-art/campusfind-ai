import clsx from 'clsx'

const sizes = {
  sm: 'w-4 h-4 border-2',
  md: 'w-7 h-7 border-2',
  lg: 'w-12 h-12 border-3',
}

export default function Spinner({ size = 'md', className = '' }) {
  return (
    <div
      className={clsx(
        'rounded-full border-[#e5e7eb] border-t-[#4f46e5] animate-spin',
        sizes[size],
        className
      )}
    />
  )
}
