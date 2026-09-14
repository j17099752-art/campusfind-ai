import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useModal } from '../../context/ModalContext'
import Modal from '../ui/Modal'
import LoginForm from './LoginForm'
import RegisterForm from './RegisterForm'
import ItemDetailModal from '../items/ItemDetailModal'
import ClaimModal from '../items/ClaimModal'

// Central modal dispatcher — rendered once inside Navbar
export default function AuthModals() {
  const { modal, openModal, closeModal } = useModal()
  const location = useLocation()

  // If a protected route redirected here with openLogin state, auto-open login
  useEffect(() => {
    if (location.state?.openLogin) {
      openModal('login', { redirectTo: location.state?.from })
    }
  }, []) // eslint-disable-line

  if (!modal) return null

  switch (modal.type) {
    case 'login':
      return (
        <Modal isOpen onClose={closeModal} size="sm">
          <LoginForm
            onClose={closeModal}
            onSwitchToRegister={() => openModal('register', modal.props)}
            onSwitchToAdmin={() => openModal('adminLogin', modal.props)}
            redirectTo={modal.props?.redirectTo}
          />
        </Modal>
      )

    case 'adminLogin':
      return (
        <Modal isOpen onClose={closeModal} size="sm">
          <LoginForm
            onClose={closeModal}
            onSwitchToRegister={() => openModal('register', modal.props)}
            onSwitchToAdmin={() => openModal('adminLogin', modal.props)}
            redirectTo={modal.props?.redirectTo}
            defaultRole="admin"
          />
        </Modal>
      )

    case 'register':
      return (
        <Modal isOpen onClose={closeModal} size="sm">
          <RegisterForm
            onClose={closeModal}
            onSwitchToLogin={() => openModal('login', modal.props)}
            redirectTo={modal.props?.redirectTo}
          />
        </Modal>
      )

    case 'itemDetail':
      return (
        <Modal isOpen onClose={closeModal} size="lg">
          <ItemDetailModal item={modal.props?.item} onClose={closeModal} />
        </Modal>
      )

    case 'claim':
      return (
        <Modal isOpen onClose={closeModal} size="md" title="🔐 Claim Item">
          <ClaimModal item={modal.props?.item} onClose={closeModal} />
        </Modal>
      )

    default:
      return null
  }
}
