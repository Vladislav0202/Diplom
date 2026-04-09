import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ErrorBoundary from './ErrorBoundary';
import {
  LayoutDashboard, Wallet, Gauge, Wrench, Vote, Newspaper,
  ShieldCheck, Users, User, LogOut, Menu, X, ChevronDown,
  Home
} from 'lucide-react';

const allResidentRoles = ['resident', 'admin', 'owner', 'tenant'];
const residentOnlyRoles = ['resident', 'owner', 'tenant'];

const navItems = [
  { to: '/admin', icon: Users, label: 'Адмін', roles: ['admin'] },
  { to: '/', icon: LayoutDashboard, label: 'Головна', roles: residentOnlyRoles },
  { to: '/finance', icon: Wallet, label: 'Фінанси', roles: allResidentRoles },
  { to: '/meters', icon: Gauge, label: 'Лічильники', roles: allResidentRoles },
  { to: '/tickets', icon: Wrench, label: 'Заявки', roles: allResidentRoles },
  { to: '/voting', icon: Vote, label: 'Голосування', roles: allResidentRoles },
  { to: '/news', icon: Newspaper, label: 'Новини', roles: allResidentRoles },
  { to: '/security', icon: ShieldCheck, label: 'Безпека', roles: allResidentRoles },
];

export default function Layout() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const filteredNav = navItems.filter(item => item.roles.includes(currentUser?.role));

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const roleLabels = {
    resident: 'Мешканець',
    admin: 'Адміністратор',
    owner: 'Власник',
    tenant: 'Орендар',
  };



  return (
    <div className="flex h-screen overflow-hidden bg-[var(--color-surface-alt)]">
    
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-[260px] bg-gradient-to-b from-[#0f172a] via-[#1e293b] to-[#0f172a] text-white
        flex flex-col transition-transform duration-300 ease-in-out
        lg:translate-x-0 lg:static lg:z-auto
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
       
        <div className="flex items-center gap-3 px-6 py-5 border-b border-white/10">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Home size={22} />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight">Smart House</h1>
            <p className="text-xs text-white/40">проспект Дмитра Яворницького, 19</p>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden ml-auto p-1 hover:bg-white/10 rounded-lg">
            <X size={20} />
          </button>
        </div>

      
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {filteredNav.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) => `
                flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200
                ${isActive
                  ? 'bg-gradient-to-r from-blue-500/20 to-indigo-500/10 text-white border-l-2 border-blue-400 shadow-lg shadow-blue-500/5'
                  : 'text-white/50 hover:text-white hover:bg-white/5'
                }
              `}
            >
              <item.icon size={20} />
              {item.label}
            </NavLink>
          ))}
        </nav>

       
        <div className="px-4 py-4 border-t border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-3 px-2">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 via-indigo-500 to-purple-600 flex items-center justify-center text-sm font-bold shadow-md shadow-indigo-500/20">
              {currentUser?.name?.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{currentUser?.name}</p>
              <p className="text-xs text-white/35">{roleLabels[currentUser?.role]}</p>
            </div>
          </div>
        </div>
      </aside>

     
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

    
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      
        <header className="h-16 bg-white border-b border-[var(--color-border)] flex items-center justify-between px-4 lg:px-8 shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 hover:bg-[var(--color-surface-hover)] rounded-xl transition-colors">
              <Menu size={22} className="text-[var(--color-text-secondary)]" />
            </button>
            <div className="hidden sm:block">
              <p className="text-sm text-[var(--color-text-secondary)]">
                Квартира <span className="font-semibold text-[var(--color-text-primary)]">{currentUser?.apartment || '—'}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
       
            
            <div className="relative">
              <button
                onClick={() => { setShowUserMenu(!showUserMenu); }}
                className="flex items-center gap-2 px-3 py-2 hover:bg-[var(--color-surface-hover)] rounded-xl transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                  {currentUser?.name?.charAt(0)}
                </div>
                <span className="hidden sm:block text-sm font-medium">{currentUser?.name?.split(' ')[0]}</span>
                <ChevronDown size={14} className="text-[var(--color-text-muted)]" />
              </button>
              {showUserMenu && (
                <div className="absolute right-0 top-12 w-56 bg-white rounded-2xl shadow-2xl border border-[var(--color-border)] z-50 overflow-hidden fade-in">
                  <div className="px-4 py-3 border-b border-[var(--color-border)]">
                    <p className="text-sm font-semibold">{currentUser?.name}</p>
                    <p className="text-xs text-[var(--color-text-muted)]">{roleLabels[currentUser?.role]}</p>
                  </div>
                  <div className="py-1">
                    <NavLink to="/profile" onClick={() => setShowUserMenu(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-[var(--color-surface-hover)] transition-colors">
                      <User size={16} /> Профіль
                    </NavLink>
                    <div className="border-t border-[var(--color-border)] my-1" />
                    <button onClick={handleLogout} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-[var(--color-danger)] hover:bg-red-50 transition-colors">
                      <LogOut size={16} /> Вийти
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

       
        <main className="flex-1 overflow-y-auto p-4 lg:p-8" onClick={() => { setShowUserMenu(false); }}>
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </main>

       
        <nav className="lg:hidden flex items-center justify-around bg-white border-t border-[var(--color-border)] px-2 py-1 shrink-0">
          {filteredNav.slice(0, 5).map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) => `
                flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl text-[10px] font-medium transition-all
                ${isActive ? 'text-[var(--color-active-blue)]' : 'text-[var(--color-text-muted)]'}
              `}
            >
              <item.icon size={20} />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
}
