import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="bg-[#1e1b4b] text-white">
      <div className="max-w-[1200px] mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 text-xl font-extrabold mb-3">
              🎒 <span>CampusFind AI</span>
            </div>
            <p className="text-[#818cf8] text-sm leading-relaxed max-w-sm">
              Smart AI-powered campus lost &amp; found system. Helping students recover their belongings through intelligent matching and secure communication.
            </p>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="font-bold text-sm uppercase tracking-wider text-[#818cf8] mb-4">Quick Links</h4>
            <ul className="space-y-2">
              {[
                ['/', 'Home'],
                ['/find', 'Find Items'],
                ['/smart-match', 'Smart Match'],
                ['/campus-map', 'Campus Map'],
                ['/dashboard', 'Dashboard'],
              ].map(([to, label]) => (
                <li key={to}>
                  <Link to={to} className="text-sm text-[#c7d2fe] hover:text-white transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Report */}
          <div>
            <h4 className="font-bold text-sm uppercase tracking-wider text-[#818cf8] mb-4">Report</h4>
            <ul className="space-y-2">
              {[
                ['/report-lost',  '🔴 Report Lost Item'],
                ['/report-found', '🟢 Report Found Item'],
                ['/my-reports',   '📋 My Reports'],
              ].map(([to, label]) => (
                <li key={to}>
                  <Link to={to} className="text-sm text-[#c7d2fe] hover:text-white transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-[#3730a3] pt-6 flex flex-col md:flex-row justify-between items-center gap-3">
          <p className="text-sm text-[#818cf8]">
            🎒 CampusFind AI © {new Date().getFullYear()} — All rights reserved.
          </p>
          <p className="text-xs text-[#6b7280]">
            Built with React · Supabase · Node.js
          </p>
        </div>
      </div>
    </footer>
  )
}
