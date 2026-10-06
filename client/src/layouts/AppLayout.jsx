import { useEffect, useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { LogOut, Menu, X } from 'lucide-react'
import GaneshaLogo from '../components/GaneshaLogo'
import { useAuth } from '../hooks/useAuth'
import { useGroup } from '../hooks/useGroup'
import { GroupProvider } from '../context/GroupContext'
import { roleLabel } from '../utils/roles'

// Shared page frame used by both AdminLayout and MemberLayout.
// Desktop: fixed sidebar on the left. Mobile: top bar with a menu button.
export default function AppLayout({ navItems }) {
  return (
    <GroupProvider>
      <Frame navItems={navItems} />
    </GroupProvider>
  )
}

function Frame({ navItems }) {
  const group = useGroup()
  const groupName = group.data?.groupName
  const { user, logout } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)

  // Close the mobile menu with the Escape key.
  useEffect(() => {
    if (!menuOpen) return
    const onKey = (e) => e.key === 'Escape' && setMenuOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [menuOpen])

  const nav = (
    <nav aria-label="Main" className="flex flex-col gap-1">
      {navItems.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          onClick={() => setMenuOpen(false)} // closes the mobile menu after choosing a page
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500
            ${isActive ? 'bg-primary-50 text-primary-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`
          }
        >
          <Icon size={18} aria-hidden="true" />
          {label}
        </NavLink>
      ))}
    </nav>
  )

  const userBox = (
    <div className="flex items-center justify-between gap-2 border-t border-slate-200 pt-4">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-slate-900">{user.name}</p>
        <p className="text-xs text-slate-500">{roleLabel(user.role)}</p>
      </div>
      <button
        type="button"
        onClick={() => {
          setMenuOpen(false)
          logout()
        }}
        className="flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm text-slate-600 hover:bg-slate-100 hover:text-slate-900
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
      >
        <LogOut size={16} aria-hidden="true" />
        Logout
      </button>
    </div>
  )

  const brand = (
    <div className="flex min-w-0 items-center gap-2.5">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-primary-700 to-primary-600 text-white shadow-sm shadow-primary-600/30">
        <GaneshaLogo size={20} />
      </span>
      <span className="min-w-0 leading-tight">
        <span className="block font-bold tracking-tight text-slate-900">SiddhiBoys</span>
        {/* group name from Settings; blank until loaded */}
        <span className="block truncate text-xs text-slate-500">{groupName ?? '\u00a0'}</span>
      </span>
    </div>
  )

  return (
    <div className="min-h-screen md:flex">
      {/* Desktop sidebar */}
      <aside className="hidden md:fixed md:inset-y-0 md:flex md:w-60 md:flex-col md:justify-between md:border-r md:border-slate-200 md:bg-white md:p-4">
        <div className="space-y-6">
          <div className="px-1 pt-1">{brand}</div>
          {nav}
        </div>
        {userBox}
      </aside>

      {/* Mobile top bar + dropdown menu */}
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white md:hidden">
        <div className="flex h-14 items-center justify-between px-4">
          {brand}
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
        {menuOpen && (
          <div id="mobile-menu" className="space-y-4 border-t border-slate-200 px-4 pb-4 pt-3">
            {nav}
            {userBox}
          </div>
        )}
      </header>

      {/* min-w-0: a wide child can never push the page wider than the screen */}
      <main className="min-w-0 flex-1 px-4 py-6 md:ml-60 md:px-8 md:py-8">
        <div className="mx-auto max-w-6xl">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
