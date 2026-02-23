"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Sidebar from '@/components/Sidebar';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, userData, loading, signOut } = useAuth();
  const router = useRouter();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="app-layout bg-[var(--bg-primary)]">
      <Sidebar
        user={{ displayName: user.displayName || 'User', email: user.email || '' }}
        userRole={userData?.role || 'member'}
        onSignOut={signOut}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      {/* Spacer div that matches sidebar width — prevents content from going under fixed sidebar */}
      <div
        className="flex-shrink-0 transition-all duration-250 ease-[cubic-bezier(0.4,0,0.2,1)]"
        style={{ width: sidebarCollapsed ? 'var(--sidebar-collapsed-width)' : 'var(--sidebar-width)' }}
      />
      <main className="main-content">
        {children}
      </main>
    </div>
  );
}

