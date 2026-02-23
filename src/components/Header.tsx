'use client';

import { useState, useRef, useEffect } from 'react';
import SearchDropdown from './SearchDropdown';
import NotificationDropdown from './NotificationDropdown';

interface HeaderProps {
  title: string;
  userName?: string;
}

export default function Header({ title, userName }: HeaderProps) {
  const [showSearch, setShowSearch] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  const userInitials = userName
    ? userName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowSearch(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotifications(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header
      className="sticky top-0 z-30 border-b border-[var(--border-color)]"
      style={{ background: 'var(--header-bg)', backdropFilter: 'blur(12px)' }}
    >
      <div className="flex items-center justify-between h-[60px] px-6 gap-4">
        {/* Title */}
        <h1 className="text-[15px] font-semibold text-[var(--text-primary)] truncate">{title}</h1>

        {/* Right side */}
        <div className="flex items-center gap-2 ml-auto">
          {/* Search */}
          <div ref={searchRef} className="relative hidden md:block">
            <button
              onClick={() => setShowSearch(!showSearch)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[var(--border-color)] bg-[var(--bg-input)] hover:border-[var(--border-hover)] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-all text-[13px] min-w-[200px]"
            >
              <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span>Search...</span>
              <kbd className="ml-auto text-[10px] font-medium bg-[var(--bg-hover)] px-1.5 py-0.5 rounded text-[var(--text-tertiary)] border border-[var(--border-color)]">⌘K</kbd>
            </button>
            {showSearch && <SearchDropdown onClose={() => setShowSearch(false)} />}
          </div>

          {/* Notifications */}
          <div ref={notifRef} className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-lg hover:bg-[var(--bg-hover)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
              aria-label="Notifications"
            >
              <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full"></span>
            </button>
            {showNotifications && <NotificationDropdown onClose={() => setShowNotifications(false)} />}
          </div>

          {/* Divider */}
          <div className="h-5 w-px bg-[var(--border-color)] mx-1" />

          {/* User */}
          <div className="flex items-center gap-2.5">
            {userName && (
              <span className="text-[13px] font-medium text-[var(--text-primary)] hidden sm:block">{userName}</span>
            )}
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-sm">
              <span className="text-[11px] font-bold text-white">{userInitials}</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
