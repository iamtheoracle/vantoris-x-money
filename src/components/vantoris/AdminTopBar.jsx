import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, Bell, ChevronDown, LogOut, ArrowUpRight } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { getRoleLabel } from '@/lib/operationsAccess';

export default function AdminTopBar({ user, onMenuClick }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowUserMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    base44.entities.Notification.filter({ read: false }, '-created_date', 50)
      .then(items => setUnreadCount(items.length))
      .catch(() => {});
  }, []);

  const pathSegments = location.pathname.replace('/operations/', '').split('/');
  const pageTitle = pathSegments[0] === 'operations' || location.pathname === '/operations'
    ? 'Dashboard'
    : pathSegments[0].split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  function handleSearch(e) {
    if (e.key === 'Enter' && searchQuery.trim()) {
      navigate(`/operations/members?q=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
    }
  }

  function handleLogout() {
    base44.auth.logout('/login');
  }

  return (
    <header className="vantoris-glass-header sticky top-0 z-30 safe-top">
      <div className="flex items-center justify-between h-14 px-3 sm:px-4">
        {/* Left — navigation + page context */}
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {onMenuClick && (
            <button
              onClick={onMenuClick}
              className="p-2 -ml-2 text-gray hover:text-foreground hover:bg-slate-100 rounded-lg transition-colors flex-shrink-0"
              aria-label="Open navigation"
              title="Open navigation"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
          )}
          <div className="min-w-0">
            <p className="text-gray/60 text-[9px] uppercase tracking-[0.13em] font-semibold truncate">Vantoris Command</p>
            <h2 className="text-foreground font-semibold text-sm truncate">{pageTitle}</h2>
          </div>
        </div>

        {/* Center — kept available on wider phone widths */}
        <div className="hidden min-[390px]:flex flex-1 max-w-[150px] mx-2">
          <div className="relative w-full">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray/50" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={handleSearch}
              placeholder="Search"
              aria-label="Search members, accounts and transactions"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-2 py-1.5 text-foreground text-xs placeholder:text-gray/50 focus:border-navy/30 focus:bg-white focus:outline-none focus:ring-2 focus:ring-navy/8 transition-all"
            />
          </div>
        </div>

        {/* Right — notifications + user menu */}
        <div className="flex items-center gap-0.5 flex-shrink-0">
          <button
            onClick={() => navigate('/operations/notifications')}
            className="relative p-2 text-gray hover:text-foreground hover:bg-slate-100 rounded-lg transition-all"
            aria-label="Notifications"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 bg-crimson text-white text-[9px] rounded-full flex items-center justify-center font-bold">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          <div className="w-px h-6 bg-slate-200 mx-0.5" />

          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-1.5 p-1.5 pr-1.5 hover:bg-slate-100 rounded-lg transition-all"
              aria-label="Open account menu"
            >
              <div className="w-7 h-7 rounded-full bg-navy/10 border border-navy/15 flex items-center justify-center flex-shrink-0">
                <span className="text-navy text-xs font-bold">
                  {(user?.full_name || 'A').charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="hidden min-[420px]:block text-left">
                <p className="text-foreground text-xs font-medium leading-tight max-w-[78px] truncate">
                  {user?.full_name || 'Administrator'}
                </p>
                <p className="text-gray text-[9px] leading-tight">{getRoleLabel(user?.role)}</p>
              </div>
              <ChevronDown size={13} className="text-gray hidden min-[420px]:block" />
            </button>

            {showUserMenu && (
              <div className="vantoris-glass-dropdown absolute right-0 top-full mt-2 w-60 max-w-[calc(100vw-24px)] overflow-hidden p-1.5">
                <div className="p-3 border-b border-slate-200">
                  <p className="text-foreground text-sm font-medium truncate">{user?.full_name}</p>
                  <p className="text-gray text-xs truncate">{user?.email}</p>
                  <span className="inline-block mt-1.5 px-2 py-0.5 bg-navy/10 text-navy rounded text-[10px] font-semibold">
                    {getRoleLabel(user?.role)}
                  </span>
                </div>
                <button
                  onClick={() => { setShowUserMenu(false); navigate('/'); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray hover:bg-slate-100 hover:text-foreground rounded-lg transition-all mt-1"
                >
                  <ArrowUpRight size={15} className="rotate-180" />
                  Member Portal
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray hover:bg-crimson/10 hover:text-crimson rounded-lg transition-all"
                >
                  <LogOut size={15} />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
