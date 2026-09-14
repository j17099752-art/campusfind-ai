import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth }  from '../../context/AuthContext'
import { useModal } from '../../context/ModalContext'
import { getUnreadCount, subscribeToNotifications } from '../../services/notificationService'
import { getInitials } from '../../utils/helpers'
import AuthModals from '../auth/AuthModals'
import clsx from 'clsx'

export default function Navbar() {
  const { user, profile, isLoggedIn, isAdmin, signOut } = useAuth()
  const { openModal } = useModal()
  const navigate  = useNavigate()
  const location  = useLocation()

  const [menuOpen,    setMenuOpen]    = useState(false)
  const [scrolled,    setScrolled]    = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [dropOpen,    setDropOpen]    = useState(false)
  const dropRef = useRef(null)

  // Scroll shadow
  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  // Load unread notification count
  useEffect(() => {
    if (!user) { setUnreadCount(0); return }
    getUnreadCount(user.id).then(setUnreadCount)
    const channel = subscribeToNotifications(user.id, () => {
      getUnreadCount(user.id).then(setUnreadCount)
    })
    return () => channel.unsubscribe()
  }, [user])

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => { if (dropRef.current && !dropRef.current.contains(e.target)) setDropOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const closeMenu = () => setMenuOpen(false)

  const navLink = (to, label) => (
    <Link
      to={to}
      onClick={closeMenu}
      className={clsx(
        'text-sm font-medium px-3 py-1.5 rounded-full transition-all',
        location.pathname === to
          ? 'bg-[#eef2ff] text-[#4f46e5]'
          : 'text-[#6b7280] hover:bg-[#eef2ff] hover:text-[#4f46e5]'
      )}
    >
      {label}
    </Link>
  )

  async function handleLogout() {
    setDropOpen(false)
    await signOut()
    navigate('/')
  }

  return (
    <>
      <nav
        className={clsx(
          'fixed top-0 left-0 right-0 z-40 h-[68px]',
          'bg-white/93 backdrop-blur-md border-b border-[#e5e7eb]',
          'transition-shadow duration-200',
          scrolled ? 'shadow-[0_4px_24px_rgba(79,70,229,0.15)]' : 'shadow-[0_1px_3px_rgba(0,0,0,0.08)]'
        )}
      >
        <div className="max-w-[1280px] mx-auto px-5 h-full flex items-center gap-3">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-1.5 font-extrabold text-xl flex-shrink-0" style={{ letterSpacing: '-0.5px' }}>
            <span>🎒</span>
            <span style={{ background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              CampusFind AI
            </span>
          </Link>

          {/* Desktop nav */}
          <ul className="hidden md:flex items-center gap-0.5 flex-1 ml-4">
            <li>{navLink('/', 'Home')}</li>
            <li>{navLink('/find', 'Find Items')}</li>
            <li>{navLink('/smart-match', 'Smart Match')}</li>
            <li>{navLink('/campus-map', 'Campus Map')}</li>
            <li>{navLink('/dashboard', 'Dashboard')}</li>
            {isLoggedIn && !isAdmin && (
              <li>
                <Link
                  to="/my-reports"
                  onClick={closeMenu}
                  className={clsx(
                    'relative text-sm font-medium px-3 py-1.5 rounded-full transition-all',
                    location.pathname === '/my-reports'
                      ? 'bg-[#eef2ff] text-[#4f46e5]'
                      : 'text-[#6b7280] hover:bg-[#eef2ff] hover:text-[#4f46e5]'
                  )}
                >
                  My Reports
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#ef4444] text-white text-[9px] font-bold rounded-full flex items-center justify-center animate-[pulseDot_2s_infinite]">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Link>
              </li>
            )}
            {isAdmin && (
              <li>{navLink('/admin', '👑 Admin')}</li>
            )}
          </ul>

          {/* Auth area */}
          <div className="hidden md:flex items-center gap-2 flex-shrink-0">
            {!isLoggedIn ? (
              <>
                <button
                  onClick={() => openModal('login')}
                  className="text-sm font-semibold px-4 py-1.5 rounded-full border border-[#4f46e5] text-[#4f46e5] hover:bg-[#eef2ff] transition-all"
                >
                  🎓 Student Login
                </button>
                <button
                  onClick={() => openModal('adminLogin')}
                  className="text-sm font-semibold px-4 py-1.5 rounded-full bg-[#4f46e5] text-white hover:bg-[#3730a3] transition-all"
                >
                  🔐 Admin
                </button>
              </>
            ) : (
              <div className="relative" ref={dropRef}>
                <button
                  onClick={() => setDropOpen(o => !o)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-[#eef2ff] transition-all"
                >
                  <span
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                    style={{ background: isAdmin ? 'linear-gradient(135deg,#d97706,#f59e0b)' : 'linear-gradient(135deg,#4f46e5,#7c3aed)' }}
                  >
                    {isAdmin ? '👑' : getInitials(profile?.full_name || '')}
                  </span>
                  <span className="text-sm font-semibold text-[#1e1b4b] max-w-[100px] truncate">
                    {isAdmin ? 'Admin' : profile?.full_name?.split(' ')[0]}
                  </span>
                  {unreadCount > 0 && (
                    <span className="w-5 h-5 bg-[#ef4444] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                  <span className="text-[#9ca3af] text-xs">▾</span>
                </button>

                {dropOpen && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-[14px] border border-[#e5e7eb] shadow-lg z-50 overflow-hidden animate-[fadeUp_0.2s_ease]">
                    {!isAdmin && (
                      <>
                        <Link to="/my-reports" onClick={() => setDropOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-[#eef2ff] text-[#1e1b4b]">
                          📋 My Reports
                          {unreadCount > 0 && <span className="ml-auto text-xs font-bold text-[#ef4444]">{unreadCount}</span>}
                        </Link>
                        <Link to="/report-lost"  onClick={() => setDropOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-[#eef2ff] text-[#1e1b4b]">🔴 Report Lost</Link>
                        <Link to="/report-found" onClick={() => setDropOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-[#eef2ff] text-[#1e1b4b]">🟢 Report Found</Link>
                      </>
                    )}
                    {isAdmin && (
                      <Link to="/admin" onClick={() => setDropOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-[#eef2ff] text-[#1e1b4b]">👑 Admin Panel</Link>
                    )}
                    <hr className="border-[#e5e7eb]" />
                    <button onClick={handleLogout} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-[#ef4444] hover:bg-[#fee2e2]">
                      🚪 Logout
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Hamburger */}
          <button
            className="md:hidden ml-auto flex flex-col gap-[5px] p-2 rounded-[8px] cursor-pointer"
            onClick={() => setMenuOpen(o => !o)}
            aria-label="Toggle menu"
          >
            <span className={clsx('block w-[22px] h-[2px] bg-[#1e1b4b] rounded transition-all', menuOpen && 'translate-y-[7px] rotate-45')} />
            <span className={clsx('block w-[22px] h-[2px] bg-[#1e1b4b] rounded transition-all', menuOpen && 'opacity-0')} />
            <span className={clsx('block w-[22px] h-[2px] bg-[#1e1b4b] rounded transition-all', menuOpen && '-translate-y-[7px] -rotate-45')} />
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden absolute top-[68px] left-0 right-0 bg-white border-b border-[#e5e7eb] shadow-lg z-30 animate-[fadeUp_0.2s_ease]">
            <div className="flex flex-col p-4 gap-1">
              {[
                ['/', 'Home'],
                ['/find', 'Find Items'],
                ['/smart-match', 'Smart Match'],
                ['/campus-map', 'Campus Map'],
                ['/dashboard', 'Dashboard'],
              ].map(([to, label]) => (
                <Link key={to} to={to} onClick={closeMenu}
                  className="px-4 py-2.5 rounded-[10px] text-sm font-medium text-[#1e1b4b] hover:bg-[#eef2ff] hover:text-[#4f46e5]">
                  {label}
                </Link>
              ))}
              {isLoggedIn && !isAdmin && (
                <>
                  <Link to="/my-reports"   onClick={closeMenu} className="px-4 py-2.5 rounded-[10px] text-sm font-medium text-[#1e1b4b] hover:bg-[#eef2ff]">📋 My Reports</Link>
                  <Link to="/report-lost"  onClick={closeMenu} className="px-4 py-2.5 rounded-[10px] text-sm font-medium text-[#1e1b4b] hover:bg-[#eef2ff]">🔴 Report Lost</Link>
                  <Link to="/report-found" onClick={closeMenu} className="px-4 py-2.5 rounded-[10px] text-sm font-medium text-[#1e1b4b] hover:bg-[#eef2ff]">🟢 Report Found</Link>
                </>
              )}
              {isAdmin && (
                <Link to="/admin" onClick={closeMenu} className="px-4 py-2.5 rounded-[10px] text-sm font-medium text-[#1e1b4b] hover:bg-[#eef2ff]">👑 Admin Panel</Link>
              )}
              <hr className="my-2 border-[#e5e7eb]" />
              {!isLoggedIn ? (
                <div className="flex gap-2">
                  <button onClick={() => { openModal('login'); closeMenu() }} className="flex-1 py-2 rounded-[10px] text-sm font-semibold border border-[#4f46e5] text-[#4f46e5] hover:bg-[#eef2ff]">
                    🎓 Student Login
                  </button>
                  <button onClick={() => { openModal('adminLogin'); closeMenu() }} className="flex-1 py-2 rounded-[10px] text-sm font-semibold bg-[#4f46e5] text-white hover:bg-[#3730a3]">
                    🔐 Admin
                  </button>
                </div>
              ) : (
                <button onClick={handleLogout} className="w-full py-2.5 rounded-[10px] text-sm font-semibold text-[#ef4444] border border-[#ef4444] hover:bg-[#fee2e2]">
                  🚪 Logout
                </button>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Auth modals rendered at navbar level */}
      <AuthModals />
    </>
  )
}
