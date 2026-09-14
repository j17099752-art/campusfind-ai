import { useEffect, useCallback } from 'react'
import clsx from 'clsx'

export default function Modal({ isOpen, onClose, children, size = 'md', title }) {
  const sizes = { sm: 'max-w-md', md: 'max-w-xl', lg: 'max-w-3xl', xl: 'max-w-5xl' }

  const handleKey = useCallback((e) => {
    if (e.key === 'Escape') onClose()
  }, [onClose])

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKey)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = ''
    }
  }, [isOpen, handleKey])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Box */}
      <div
        className={clsx(
          'relative w-full bg-white rounded-[22px] shadow-[0_20px_60px_rgba(0,0,0,0.2)]',
          'animate-[fadeUp_0.3s_ease] max-h-[90vh] overflow-y-auto',
          sizes[size]
        )}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-[#eef2ff] text-[#6b7280] hover:bg-[#e0e7ff] hover:text-[#4f46e5] transition-colors text-lg z-10"
        >
          ✕
        </button>

        {title && (
          <div className="px-6 pt-6 pb-4 border-b border-[#e5e7eb]">
            <h2 className="text-xl font-bold text-[#1e1b4b]">{title}</h2>
          </div>
        )}

        <div className={clsx(!title && 'pt-6', 'px-6 pb-6')}>
          {children}
        </div>
      </div>
    </div>
  )
}
