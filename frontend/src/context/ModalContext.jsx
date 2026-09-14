import { createContext, useContext, useState, useCallback } from 'react'

const ModalContext = createContext(null)

export function ModalProvider({ children }) {
  const [modal, setModal] = useState(null) // { type: 'login'|'register'|'itemDetail'|'claim', props: {} }

  const openModal  = useCallback((type, props = {}) => setModal({ type, props }), [])
  const closeModal = useCallback(() => setModal(null), [])

  return (
    <ModalContext.Provider value={{ modal, openModal, closeModal }}>
      {children}
    </ModalContext.Provider>
  )
}

export function useModal() {
  const ctx = useContext(ModalContext)
  if (!ctx) throw new Error('useModal must be used inside ModalProvider')
  return ctx
}
