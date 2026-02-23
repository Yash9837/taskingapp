'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getActivities } from '@/lib/firestore';
import { Activity } from '@/lib/types';

interface NotificationDropdownProps {
    onClose: () => void;
}

function getRelativeTime(dateString: string): string {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getActionIcon(targetType: string) {
    switch (targetType) {
        case 'task':
            return (
                <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
            );
        case 'project':
            return (
                <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-purple-400" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                    </svg>
                </div>
            );
        case 'issue':
            return (
                <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-red-400" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
            );
        default:
            return (
                <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-indigo-400" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
            );
    }
}

export default function NotificationDropdown({ onClose }: NotificationDropdownProps) {
    const router = useRouter();
    const [activities, setActivities] = useState<Activity[]>([]);
    const [loading, setLoading] = useState(true);
    const [readIds, setReadIds] = useState<Set<string>>(new Set());

    useEffect(() => {
        const savedRead = localStorage.getItem('taskflow-read-notifications');
        if (savedRead) {
            try {
                setReadIds(new Set(JSON.parse(savedRead)));
            } catch { }
        }
    }, []);

    useEffect(() => {
        const loadActivities = async () => {
            try {
                const data = await getActivities(undefined, 10);
                setActivities(data);
            } catch (err) {
                console.error('Error loading notifications:', err);
            } finally {
                setLoading(false);
            }
        };
        loadActivities();
    }, []);

    const markAsRead = (id: string) => {
        const newReadIds = new Set(readIds);
        newReadIds.add(id);
        setReadIds(newReadIds);
        localStorage.setItem(
            'taskflow-read-notifications',
            JSON.stringify(Array.from(newReadIds))
        );
    };

    const markAllAsRead = () => {
        const allIds = new Set(activities.map((a) => a.id));
        setReadIds(allIds);
        localStorage.setItem(
            'taskflow-read-notifications',
            JSON.stringify(Array.from(allIds))
        );
    };

    const unreadCount = activities.filter((a) => !readIds.has(a.id)).length;

    return (
        <div className="absolute top-full right-0 mt-2 w-96 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl shadow-2xl overflow-hidden z-50">
            {/* Header */}
            <div className="px-4 py-3 border-b border-[var(--border-color)] flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-[var(--text-primary)]">Notifications</h3>
                    {unreadCount > 0 && (
                        <span className="px-1.5 py-0.5 text-[10px] font-bold bg-indigo-500 text-white rounded-full">
                            {unreadCount}
                        </span>
                    )}
                </div>
                {unreadCount > 0 && (
                    <button
                        onClick={markAllAsRead}
                        className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                    >
                        Mark all read
                    </button>
                )}
            </div>

            {/* Notifications List */}
            <div className="max-h-80 overflow-y-auto">
                {loading ? (
                    <div className="p-8 text-center">
                        <div className="w-6 h-6 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto"></div>
                    </div>
                ) : activities.length === 0 ? (
                    <div className="p-8 text-center text-sm text-[var(--text-tertiary)]">
                        No notifications yet
                    </div>
                ) : (
                    activities.map((activity) => {
                        const isRead = readIds.has(activity.id);
                        return (
                            <button
                                key={activity.id}
                                onClick={() => {
                                    markAsRead(activity.id);
                                    router.push('/activity');
                                    onClose();
                                }}
                                className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-[var(--bg-hover)] ${!isRead ? 'bg-indigo-500/5' : ''
                                    }`}
                            >
                                {getActionIcon(activity.targetType)}
                                <div className="flex-1 min-w-0">
                                    <p className={`text-sm ${!isRead ? 'font-semibold' : 'font-medium'} text-[var(--text-primary)] truncate`}>
                                        {activity.targetTitle}
                                    </p>
                                    <p className="text-xs text-[var(--text-tertiary)] truncate">
                                        {activity.action}
                                    </p>
                                </div>
                                <span className="text-[10px] text-[var(--text-tertiary)] whitespace-nowrap flex-shrink-0 mt-0.5">
                                    {getRelativeTime(activity.createdAt)}
                                </span>
                                {!isRead && (
                                    <span className="w-2 h-2 rounded-full bg-indigo-500 flex-shrink-0 mt-1.5"></span>
                                )}
                            </button>
                        );
                    })
                )}
            </div>

            {/* Footer */}
            <div className="px-4 py-2.5 border-t border-[var(--border-color)]">
                <button
                    onClick={() => {
                        router.push('/activity');
                        onClose();
                    }}
                    className="w-full text-center text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                    View All Activity
                </button>
            </div>
        </div>
    );
}
