'use client';

import { useState, useEffect, useMemo } from 'react';
import Header from '@/components/Header';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useAuth } from '@/contexts/AuthContext';
import { getTasks, getProjects } from '@/lib/firestore';
import { Task, Project } from '@/lib/types';

export default function CalendarPage() {
    const { user, userData } = useAuth();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            if (!user) return;
            try {
                setLoading(true);
                const [tasksData, projectsData] = await Promise.all([
                    getTasks(),
                    getProjects(user.uid),
                ]);
                setTasks(tasksData);
                setProjects(projectsData);
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [user]);

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December',
    ];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // Build calendar grid
    const calendarDays = useMemo(() => {
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const prevMonthDays = new Date(year, month, 0).getDate();

        const days: { date: Date; isCurrentMonth: boolean }[] = [];

        // Previous month tail
        for (let i = firstDay - 1; i >= 0; i--) {
            days.push({
                date: new Date(year, month - 1, prevMonthDays - i),
                isCurrentMonth: false,
            });
        }

        // Current month
        for (let i = 1; i <= daysInMonth; i++) {
            days.push({
                date: new Date(year, month, i),
                isCurrentMonth: true,
            });
        }

        // Next month head
        const remaining = 42 - days.length;
        for (let i = 1; i <= remaining; i++) {
            days.push({
                date: new Date(year, month + 1, i),
                isCurrentMonth: false,
            });
        }

        return days;
    }, [year, month]);

    // Map tasks to dates
    const tasksByDate = useMemo(() => {
        const map: Record<string, Task[]> = {};
        tasks.forEach((task) => {
            if (task.dueDate) {
                const dateKey = new Date(task.dueDate).toISOString().split('T')[0];
                if (!map[dateKey]) map[dateKey] = [];
                map[dateKey].push(task);
            }
        });
        return map;
    }, [tasks]);

    const getProjectName = (projectId: string) =>
        projects.find((p) => p.id === projectId)?.name || 'Unknown';

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'urgent': return 'bg-red-500';
            case 'high': return 'bg-orange-500';
            case 'medium': return 'bg-blue-500';
            case 'low': return 'bg-gray-500';
            default: return 'bg-indigo-500';
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'done': return 'text-green-400';
            case 'in-progress': return 'text-blue-400';
            case 'review': return 'text-yellow-400';
            default: return 'text-gray-400';
        }
    };

    const today = new Date();
    const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
    const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
    const goToToday = () => setCurrentDate(new Date());

    const selectedTasks = selectedDate ? tasksByDate[selectedDate] || [] : [];

    if (loading) {
        return (
            <div className="min-h-screen bg-[var(--bg-primary)]">
                <Header title="Calendar" userName={userData?.displayName || 'User'} />
                <div className="flex items-center justify-center py-32">
                    <LoadingSpinner />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[var(--bg-primary)]">
            <Header title="Calendar" userName={userData?.displayName || 'User'} />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex flex-col lg:flex-row gap-6">
                    {/* Calendar Grid */}
                    <div className="flex-1">
                        {/* Month Navigation */}
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-4">
                                <h2 className="text-2xl font-bold text-[var(--text-primary)]">
                                    {monthNames[month]} {year}
                                </h2>
                                <button
                                    onClick={goToToday}
                                    className="px-3 py-1.5 text-xs font-medium bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded-lg hover:bg-indigo-500/30 transition-colors"
                                >
                                    Today
                                </button>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={prevMonth}
                                    className="p-2 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] hover:bg-[var(--bg-hover)] transition-colors text-[var(--text-primary)]"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                    </svg>
                                </button>
                                <button
                                    onClick={nextMonth}
                                    className="p-2 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] hover:bg-[var(--bg-hover)] transition-colors text-[var(--text-primary)]"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        {/* Day Headers */}
                        <div className="grid grid-cols-7 mb-1">
                            {dayNames.map((day) => (
                                <div
                                    key={day}
                                    className="p-2 text-center text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider"
                                >
                                    {day}
                                </div>
                            ))}
                        </div>

                        {/* Calendar Grid */}
                        <div className="grid grid-cols-7 border border-[var(--border-color)] rounded-xl overflow-hidden">
                            {calendarDays.map((day, idx) => {
                                const dateKey = `${day.date.getFullYear()}-${String(day.date.getMonth() + 1).padStart(2, '0')}-${String(day.date.getDate()).padStart(2, '0')}`;
                                const dayTasks = tasksByDate[dateKey] || [];
                                const isToday = dateKey === todayKey;
                                const isSelected = dateKey === selectedDate;

                                return (
                                    <button
                                        key={idx}
                                        onClick={() => setSelectedDate(dateKey === selectedDate ? null : dateKey)}
                                        className={`min-h-[90px] p-2 border-b border-r border-[var(--border-color)] text-left transition-all duration-150 hover:bg-[var(--bg-hover)] ${!day.isCurrentMonth ? 'opacity-40' : ''
                                            } ${isSelected ? 'bg-indigo-500/10 ring-1 ring-indigo-500/40' : 'bg-[var(--bg-card)]'}`}
                                    >
                                        <div className={`text-sm font-medium mb-1 ${isToday
                                                ? 'w-7 h-7 bg-indigo-500 text-[var(--text-primary)] rounded-full flex items-center justify-center'
                                                : 'text-[var(--text-primary)]'
                                            }`}>
                                            {day.date.getDate()}
                                        </div>

                                        {/* Task indicators */}
                                        <div className="space-y-0.5">
                                            {dayTasks.slice(0, 3).map((task) => (
                                                <div
                                                    key={task.id}
                                                    className={`flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded ${getPriorityColor(task.priority)}/20 text-[var(--text-primary)] truncate`}
                                                >
                                                    <span className={`w-1.5 h-1.5 rounded-full ${getPriorityColor(task.priority)} flex-shrink-0`}></span>
                                                    <span className="truncate">{task.title}</span>
                                                </div>
                                            ))}
                                            {dayTasks.length > 3 && (
                                                <div className="text-[10px] text-indigo-400 px-1.5">
                                                    +{dayTasks.length - 3} more
                                                </div>
                                            )}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Side Panel — Selected Date Tasks */}
                    <div className="lg:w-80">
                        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-5 sticky top-24">
                            <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4">
                                {selectedDate
                                    ? new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-US', {
                                        weekday: 'long',
                                        month: 'short',
                                        day: 'numeric',
                                    })
                                    : 'Select a date'}
                            </h3>

                            {!selectedDate ? (
                                <p className="text-sm text-[var(--text-tertiary)]">
                                    Click on a date to see tasks due that day.
                                </p>
                            ) : selectedTasks.length === 0 ? (
                                <div className="text-center py-8">
                                    <svg className="w-12 h-12 mx-auto text-[var(--text-tertiary)] mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                    </svg>
                                    <p className="text-sm text-[var(--text-tertiary)]">No tasks due this day</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {selectedTasks.map((task) => (
                                        <div
                                            key={task.id}
                                            className="p-3 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg hover:border-indigo-500/30 transition-colors"
                                        >
                                            <div className="flex items-start gap-2">
                                                <span className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${getPriorityColor(task.priority)}`}></span>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                                                        {task.title}
                                                    </p>
                                                    <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
                                                        {getProjectName(task.projectId)}
                                                    </p>
                                                    <div className="flex items-center gap-2 mt-2">
                                                        <span className={`text-xs font-medium capitalize ${getStatusColor(task.status)}`}>
                                                            {task.status.replace('-', ' ')}
                                                        </span>
                                                        <span className="text-xs text-[var(--text-tertiary)] capitalize">
                                                            • {task.priority}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
