import clsx from 'clsx'

export default function Input({
  label,
  error,
  required,
  optional,
  hint,
  className = '',
  containerClass = '',
  ...props
}) {
  return (
    <div className={clsx('form-group', containerClass)}>
      {label && (
        <label className="block text-sm font-semibold text-[#1e1b4b] mb-1">
          {label}
          {required && <span className="text-[#ef4444] ml-1">*</span>}
          {optional && <span className="text-[#9ca3af] font-normal text-xs ml-1">(optional)</span>}
        </label>
      )}
      <input
        className={clsx(
          'w-full px-3 py-2.5 border-[1.5px] rounded-[8px] text-sm font-normal',
          'text-[#1e1b4b] bg-white outline-none transition-all duration-200',
          'placeholder:text-[#9ca3af]',
          'focus:border-[#4f46e5] focus:shadow-[0_0_0_3px_rgba(79,70,229,0.1)]',
          error
            ? 'border-[#ef4444]'
            : 'border-[#e5e7eb]',
          className
        )}
        {...props}
      />
      {hint  && !error && <p className="text-xs text-[#9ca3af] mt-1">{hint}</p>}
      {error && <p className="text-xs text-[#ef4444] font-medium mt-1">{error}</p>}
    </div>
  )
}

export function Select({ label, error, required, optional, children, className = '', containerClass = '', ...props }) {
  return (
    <div className={clsx('form-group', containerClass)}>
      {label && (
        <label className="block text-sm font-semibold text-[#1e1b4b] mb-1">
          {label}
          {required && <span className="text-[#ef4444] ml-1">*</span>}
          {optional && <span className="text-[#9ca3af] font-normal text-xs ml-1">(optional)</span>}
        </label>
      )}
      <select
        className={clsx(
          'w-full px-3 py-2.5 border-[1.5px] rounded-[8px] text-sm',
          'text-[#1e1b4b] bg-white outline-none transition-all duration-200 cursor-pointer',
          'focus:border-[#4f46e5] focus:shadow-[0_0_0_3px_rgba(79,70,229,0.1)]',
          error ? 'border-[#ef4444]' : 'border-[#e5e7eb]',
          className
        )}
        {...props}
      >
        {children}
      </select>
      {error && <p className="text-xs text-[#ef4444] font-medium mt-1">{error}</p>}
    </div>
  )
}

export function Textarea({ label, error, required, optional, className = '', containerClass = '', ...props }) {
  return (
    <div className={clsx('form-group', containerClass)}>
      {label && (
        <label className="block text-sm font-semibold text-[#1e1b4b] mb-1">
          {label}
          {required && <span className="text-[#ef4444] ml-1">*</span>}
          {optional && <span className="text-[#9ca3af] font-normal text-xs ml-1">(optional)</span>}
        </label>
      )}
      <textarea
        className={clsx(
          'w-full px-3 py-2.5 border-[1.5px] rounded-[8px] text-sm font-normal resize-y',
          'text-[#1e1b4b] bg-white outline-none transition-all duration-200 font-[inherit]',
          'placeholder:text-[#9ca3af]',
          'focus:border-[#4f46e5] focus:shadow-[0_0_0_3px_rgba(79,70,229,0.1)]',
          error ? 'border-[#ef4444]' : 'border-[#e5e7eb]',
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-[#ef4444] font-medium mt-1">{error}</p>}
    </div>
  )
}
