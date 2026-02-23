'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { canManageUsers, getRoleLabel, getRoleBadgeColor, UserRole } from '@/lib/rbac';
import { getAllUsers, updateMemberProfile } from '@/lib/firestore';
import { TeamMember } from '@/lib/types';

export default function SettingsPage() {
    const { user, userData, updateProfile, signOut } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const userRole = (userData?.role || 'member') as UserRole;

    const [displayName, setDisplayName] = useState(user?.displayName || '');
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState('');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    // Admin user management state
    const [allUsers, setAllUsers] = useState<TeamMember[]>([]);
    const [usersLoading, setUsersLoading] = useState(false);
    const [roleUpdating, setRoleUpdating] = useState<string | null>(null);
    const [roleUpdateSuccess, setRoleUpdateSuccess] = useState<string | null>(null);

    // Load all users if admin
    useEffect(() => {
        if (canManageUsers(userRole)) {
            loadUsers();
        }
    }, [userRole]);

    const loadUsers = async () => {
        try {
            setUsersLoading(true);
            const users = await getAllUsers();
            setAllUsers(users);
        } catch {
            console.error('Failed to load users');
        } finally {
            setUsersLoading(false);
        }
    };

    const handleRoleChange = async (uid: string, newRole: UserRole) => {
        try {
            setRoleUpdating(uid);
            await updateMemberProfile(uid, { role: newRole });
            setAllUsers(allUsers.map(u => u.uid === uid ? { ...u, role: newRole } : u));
            setRoleUpdateSuccess(uid);
            setTimeout(() => setRoleUpdateSuccess(null), 2000);
        } catch {
            setError('Failed to update user role');
        } finally {
            setRoleUpdating(null);
        }
    };

    const handleSaveProfile = async () => {
        if (!displayName.trim()) {
            setError('Display name cannot be empty');
            return;
        }
        try {
            setSaving(true);
            setError('');
            await updateProfile({ displayName: displayName.trim() });
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch {
            setError('Failed to update profile');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-[var(--bg-primary)]">
            <Header title="Settings" userName={userData?.displayName || user?.displayName || 'User'} />

            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
                {/* Profile Section */}
                <section className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-6">
                    <h3 className="text-lg font-bold text-[var(--text-primary)] mb-6 flex items-center gap-2">
                        <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        Profile
                    </h3>

                    {/* Avatar & Info */}
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center text-xl font-bold text-[var(--text-primary)] flex-shrink-0">
                            {(user?.displayName || 'U').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                        </div>
                        <div>
                            <p className="text-sm text-[var(--text-secondary)]">Email</p>
                            <p className="text-[var(--text-primary)] font-medium">{user?.email || 'Not set'}</p>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs text-[var(--text-tertiary)]">Role:</span>
                                <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${getRoleBadgeColor(userRole).bg} ${getRoleBadgeColor(userRole).text}`}>
                                    {getRoleLabel(userRole)}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Display Name */}
                    <div className="space-y-2 mb-4">
                        <label className="block text-sm font-medium text-[var(--text-secondary)]">Display Name</label>
                        <input
                            type="text"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            className="w-full px-4 py-2.5 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                            placeholder="Your display name"
                        />
                    </div>

                    {error && (
                        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    {saved && (
                        <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400 text-sm flex items-center gap-2">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            Profile updated successfully
                        </div>
                    )}

                    <button
                        onClick={handleSaveProfile}
                        disabled={saving}
                        className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-[var(--text-primary)] rounded-lg font-medium text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {saving ? 'Saving...' : 'Save Profile'}
                    </button>
                </section>

                {/* Admin User Management Section */}
                {canManageUsers(userRole) && (
                    <section className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-6">
                        <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2 flex items-center gap-2">
                            <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                            User Management
                            <span className="ml-2 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-red-500/20 text-red-400">
                                Admin Only
                            </span>
                        </h3>
                        <p className="text-sm text-[var(--text-secondary)] mb-6">
                            Manage user roles across the platform. Changes take effect immediately.
                        </p>

                        {usersLoading ? (
                            <div className="flex items-center justify-center py-8">
                                <div className="w-6 h-6 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
                            </div>
                        ) : allUsers.length === 0 ? (
                            <p className="text-sm text-[var(--text-tertiary)] text-center py-8">No users found</p>
                        ) : (
                            <div className="space-y-3">
                                {allUsers.map((u) => {
                                    const isCurrentUser = u.uid === user?.uid;
                                    const badge = getRoleBadgeColor(u.role as UserRole);
                                    return (
                                        <div
                                            key={u.uid}
                                            className="flex items-center justify-between p-4 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg hover:border-[var(--border-color)] transition-colors"
                                        >
                                            <div className="flex items-center gap-3 min-w-0 flex-1">
                                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                                                    <span className="text-[11px] font-bold text-white">
                                                        {(u.displayName || 'U').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                                                    </span>
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                                                        {u.displayName}
                                                        {isCurrentUser && (
                                                            <span className="ml-2 text-[10px] text-[var(--text-tertiary)]">(you)</span>
                                                        )}
                                                    </p>
                                                    <p className="text-xs text-[var(--text-tertiary)] truncate">{u.email}</p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3 flex-shrink-0">
                                                {roleUpdateSuccess === u.uid && (
                                                    <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                    </svg>
                                                )}
                                                {roleUpdating === u.uid ? (
                                                    <div className="w-5 h-5 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
                                                ) : (
                                                    <select
                                                        value={u.role}
                                                        onChange={(e) => handleRoleChange(u.uid, e.target.value as UserRole)}
                                                        disabled={isCurrentUser}
                                                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors focus:outline-none focus:ring-1 focus:ring-indigo-500 ${isCurrentUser
                                                                ? 'opacity-50 cursor-not-allowed bg-[var(--bg-card)] border-[var(--border-color)] text-[var(--text-tertiary)]'
                                                                : `${badge.bg} ${badge.text} border-transparent hover:border-[var(--border-color)] cursor-pointer`
                                                            }`}
                                                        title={isCurrentUser ? "You can't change your own role" : `Change role for ${u.displayName}`}
                                                    >
                                                        <option value="admin">Admin</option>
                                                        <option value="manager">Manager</option>
                                                        <option value="member">Member</option>
                                                    </select>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </section>
                )}

                {/* Appearance Section */}
                <section className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-6">
                    <h3 className="text-lg font-bold text-[var(--text-primary)] mb-6 flex items-center gap-2">
                        <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                        </svg>
                        Appearance
                    </h3>

                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-[var(--text-primary)] font-medium">Theme</p>
                            <p className="text-sm text-[var(--text-secondary)]">
                                Switch between dark and light mode
                            </p>
                        </div>

                        {/* Toggle */}
                        <button
                            onClick={toggleTheme}
                            className="relative w-16 h-8 rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                            style={{ background: theme === 'dark' ? 'linear-gradient(to right, #4f46e5, #7c3aed)' : '#d1d5db' }}
                            aria-label="Toggle theme"
                        >
                            <span
                                className="absolute top-1 w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-300 flex items-center justify-center"
                                style={{ transform: theme === 'dark' ? 'translateX(34px)' : 'translateX(4px)' }}
                            >
                                {theme === 'dark' ? (
                                    <svg className="w-3.5 h-3.5 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                                    </svg>
                                ) : (
                                    <svg className="w-3.5 h-3.5 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                                    </svg>
                                )}
                            </span>
                        </button>
                    </div>
                </section>

                {/* Account Section */}
                <section className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-6">
                    <h3 className="text-lg font-bold text-[var(--text-primary)] mb-6 flex items-center gap-2">
                        <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Account
                    </h3>

                    <div className="space-y-4">
                        {/* Sign Out */}
                        <div className="flex items-center justify-between py-3 border-b border-[var(--border-color)]">
                            <div>
                                <p className="text-[var(--text-primary)] font-medium">Sign Out</p>
                                <p className="text-sm text-[var(--text-secondary)]">Sign out of your account on this device</p>
                            </div>
                            <button
                                onClick={signOut}
                                className="px-4 py-2 bg-[var(--bg-input)] hover:bg-[var(--bg-hover)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-lg text-sm font-medium transition-colors"
                            >
                                Sign Out
                            </button>
                        </div>

                        {/* Delete Account */}
                        <div className="flex items-center justify-between py-3">
                            <div>
                                <p className="text-red-400 font-medium">Delete Account</p>
                                <p className="text-sm text-[var(--text-secondary)]">Permanently delete your account and all data</p>
                            </div>
                            {!showDeleteConfirm ? (
                                <button
                                    onClick={() => setShowDeleteConfirm(true)}
                                    className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 rounded-lg text-sm font-medium transition-colors"
                                >
                                    Delete
                                </button>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-red-400">Are you sure?</span>
                                    <button
                                        onClick={() => setShowDeleteConfirm(false)}
                                        className="px-3 py-1.5 bg-[var(--bg-input)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-lg text-xs font-medium transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={() => {
                                            alert('Account deletion is not implemented in this demo.');
                                            setShowDeleteConfirm(false);
                                        }}
                                        className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-[var(--text-primary)] rounded-lg text-xs font-medium transition-colors"
                                    >
                                        Confirm Delete
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}
