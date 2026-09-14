import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ModalProvider } from './context/ModalContext'
import Navbar from './components/layout/Navbar'
import Footer from './components/layout/Footer'
import ProtectedRoute from './components/auth/ProtectedRoute'
import AdminRoute from './components/auth/AdminRoute'

// Pages
import HomePage        from './pages/HomePage'
import FindItemsPage   from './pages/FindItemsPage'
import SmartMatchPage  from './pages/SmartMatchPage'
import ReportLostPage  from './pages/ReportLostPage'
import ReportFoundPage from './pages/ReportFoundPage'
import MyReportsPage   from './pages/MyReportsPage'
import MatchChatPage   from './pages/MatchChatPage'
import CampusMapPage   from './pages/CampusMapPage'
import DashboardPage   from './pages/DashboardPage'
import AdminPanelPage  from './pages/AdminPanelPage'
import NotFoundPage    from './pages/NotFoundPage'

export default function App() {
  return (
    <AuthProvider>
      <ModalProvider>
        <div className="flex flex-col min-h-screen bg-[#f8faff]">
          <Navbar />
          <main className="flex-1 page-wrapper">
            <Routes>
              {/* Public routes */}
              <Route path="/"           element={<HomePage />} />
              <Route path="/find"       element={<FindItemsPage />} />
              <Route path="/smart-match" element={<SmartMatchPage />} />
              <Route path="/campus-map" element={<CampusMapPage />} />
              <Route path="/dashboard"  element={<DashboardPage />} />

              {/* Protected student routes */}
              <Route path="/report-lost" element={
                <ProtectedRoute><ReportLostPage /></ProtectedRoute>
              } />
              <Route path="/report-found" element={
                <ProtectedRoute><ReportFoundPage /></ProtectedRoute>
              } />
              <Route path="/my-reports" element={
                <ProtectedRoute><MyReportsPage /></ProtectedRoute>
              } />
              <Route path="/match-chat/:matchId" element={
                <ProtectedRoute><MatchChatPage /></ProtectedRoute>
              } />

              {/* Admin-only routes */}
              <Route path="/admin" element={
                <AdminRoute><AdminPanelPage /></AdminRoute>
              } />

              {/* Fallback */}
              <Route path="/404" element={<NotFoundPage />} />
              <Route path="*"    element={<Navigate to="/404" replace />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </ModalProvider>
    </AuthProvider>
  )
}
