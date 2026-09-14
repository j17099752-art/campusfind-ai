import clsx from 'clsx'
import Spinner from './Spinner'

const variants = {
  primary:  'bg-[#4f46e5] text-white hover:bg-[#3730a3] focus:ring-[#4f46e5]',
  danger:   'bg-[#ef4444] text-white hover:bg-[#b91c1c] focus:ring-[#ef4444]',
  success:  'bg-[#10b981] text-white hover:bg-[#047857] focus:ring-[#10b981]',
  warning:  'bg-[#f59e0b] text-white hover:bg-[#d97706] focus:ring-[#f59e0b]',
  outline:  'bg-transparent text-[#4f46e5] border border-[#4f46e5] hover:bg-[#eef2ff] focus:ring-[#4f46e5]',
  ghost:    'bg-transparent text-[#6b7280] hover:bg-[#eef2ff] hover:text-[#4f46e5] focus:ring-[#4f46e5]',
  gold:     'bg-[#d97706] text-white hover:bg-[#b45309] focus:ring-[#d97706]',
}

const sizes = {
  xs: 'px-2.5 py-1 text-xs rounded-lg',
  sm: 'px-3.5 py-1.5 text-sm rounded-[10px]',
  md: 'px-5 py-2.5 text-sm rounded-[14px]',
  lg: 'px-7 py-3 text-base rounded-[14px]',
}

export default function Button({
  children,
  variant  = 'primary',
  size     = 'md',
  loading  = false,
  disabled = false,
  fullWidth = false,
  className = '',
  type = 'button',
  onClick,
  ...props
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={clsx(
        'inline-flex items-center justify-center gap-2 font-semibold',
        'transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        fullWidth && 'w-full',
        className
      )}
      {...props}
    >
      {loading && <Spinner size="sm" />}
      {children}
    </button>
  )
}
