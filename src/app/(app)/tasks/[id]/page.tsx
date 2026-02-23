'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Header from '@/components/Header';
import LoadingSpinner from '@/components/LoadingSpinner';
import StatusBadge from '@/components/StatusBadge';
import EmptyState from '@/components/EmptyState';
import { useAuth } from '@/contexts/AuthContext';
import { getTask, updateTask, getProject, getAllUsers } from '@/lib/firestore';
import { Task, Project, TeamMember } from '@/lib/types';
import Link from 'next/link';

export default function TaskDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { user, userData } = useAuth();
    const taskId = params.id as string;
    const userRole = userData?.role || 'member';

    const [task, setTask] = useState<Task | null>(null);
    const [project, setProject] = useState<Project | null>(null);
    const [members, setMembers] = useState<TeamMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            if (!taskId) return;
            try {
                setLoading(true);
                const taskData = await getTask(taskId);
                if (taskData) {
                    setTask(taskData);
                    const [projectData, usersData] = await Promise.all([
                        getProject(taskData.projectId),
                        getAllUsers(),
                    ]);
                    setProject(projectData);
                    setMembers(usersData);
                }
            } catch (error) {
                console.error('Error fetching task details:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [taskId]);

    const handleStatusUpdate = async (newStatus: Task['status']) => {
        if (!task || !user) return;
        try {
            setIsUpdating(true);
            const updates: Partial<Task> = { status: newStatus };
            if (newStatus === 'in-progress' && !task.startedAt) {
                updates.startedAt = new Date().toISOString();
            }
            if (newStatus === 'done' && !task.completedAt) {
                updates.completedAt = new Date().toISOString();
            }

            await updateTask(task.id, task.projectId, updates);
            setTask({ ...task, ...updates });
        } catch (error) {
            console.error('Failed to update status:', error);
            alert('Failed to update status. Please try again.');
        } finally {
            setIsUpdating(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[var(--bg-primary)]">
                <Header title="Task Details" userName={userData?.displayName || 'User'} />
                <div className="flex items-center justify-center py-32">
                    <LoadingSpinner />
                </div>
            </div>
        );
    }

    if (!task) {
        return (
            <div className="min-h-screen bg-[var(--bg-primary)]">
                <Header title="Task Not Found" userName={userData?.displayName || 'User'} />
                <div className="max-w-3xl mx-auto px-4 py-16">
                    <EmptyState
                        title="Task Not Found"
                        description="This task doesn't exist or you don't have access to it."
                        actionLabel="Back to Tasks"
                        onAction={() => router.push('/tasks')}
                    />
                </div>
            </div>
        );
    }

    const getAssigneeName = (uid: string) => {
        const member = members.find(m => m.uid === uid);
        return member?.displayName || uid;
    };

    const getSubmitterName = (uid: string) => {
        const member = members.find(m => m.uid === uid);
        return member?.displayName || 'System';
    };

    return (
        <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
            <Header title="Task Details" userName={userData?.displayName || 'User'} />

            <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
                {/* Navigation & Actions */}
                <div className="flex items-center justify-between mb-8">
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-2 text-sm text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors group"
                    >
                        <svg className="w-5 h-5 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Back
                    </button>

                    <div className="flex gap-2">
                        <StatusBadge status={task.priority} type="priority" />
                        <StatusBadge status={task.status} type="task" />
                    </div>
                </div>

                {/* Task Content */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Info */}
                    <div className="lg:col-span-2 space-y-8">
                        <div className="bg-[var(--bg-card-solid)] border border-[var(--border-color)] rounded-2xl p-8 shadow-sm">
                            <h1 className="text-3xl font-bold mb-6">{task.title}</h1>

                            <div className="prose prose-invert max-w-none">
                                <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-tertiary)] mb-3">Description</h3>
                                <p className="text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap">
                                    {task.description || 'No description provided.'}
                                </p>
                            </div>

                            {task.tags && task.tags.length > 0 && (
                                <div className="mt-8 pt-8 border-t border-[var(--border-color)]">
                                    <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-tertiary)] mb-4">Tags</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {task.tags.map(tag => (
                                            <span key={tag} className="px-3 py-1 rounded-full bg-[var(--bg-input)] text-xs font-medium text-[var(--accent-light)] border border-[var(--accent-glow)]">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Quick Actions (For the assigned user or managers) */}
                        {(task.assignedTo === user?.uid || userRole !== 'member') && task.status !== 'done' && (
                            <div className="bg-indigo-600/5 border border-indigo-500/20 rounded-2xl p-8">
                                <h3 className="text-lg font-bold mb-4">Update Task Status</h3>
                                <div className="flex flex-wrap gap-3">
                                    {task.status === 'todo' && (
                                        <button
                                            onClick={() => handleStatusUpdate('in-progress')}
                                            disabled={isUpdating}
                                            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg font-bold transition-all disabled:opacity-50"
                                        >
                                            Start Progress
                                        </button>
                                    )}
                                    {task.status === 'in-progress' && (
                                        <button
                                            onClick={() => handleStatusUpdate('review')}
                                            disabled={isUpdating}
                                            className="px-6 py-2 bg-amber-600 hover:bg-amber-700 rounded-lg font-bold transition-all disabled:opacity-50"
                                        >
                                            Move to Review
                                        </button>
                                    )}
                                    {task.status === 'review' && (
                                        <button
                                            onClick={() => handleStatusUpdate('done')}
                                            disabled={isUpdating}
                                            className="px-6 py-2 bg-green-600 hover:bg-green-700 rounded-lg font-bold transition-all disabled:opacity-50"
                                        >
                                            Mark as Completed
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Sidebar Info */}
                    <div className="space-y-6">
                        <div className="bg-[var(--bg-card-solid)] border border-[var(--border-color)] rounded-2xl p-6 shadow-sm">
                            <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-tertiary)] mb-6">Details</h3>

                            <div className="space-y-6">
                                <div>
                                    <p className="text-xs text-[var(--text-tertiary)] uppercase font-bold mb-2">Project</p>
                                    {project ? (
                                        <Link href={`/projects/${project.id}`} className="text-sm font-medium text-indigo-400 hover:text-indigo-300 transition-colors">
                                            {project.name}
                                        </Link>
                                    ) : (
                                        <span className="text-sm text-[var(--text-primary)]">Loading project...</span>
                                    )}
                                </div>

                                <div>
                                    <p className="text-xs text-[var(--text-tertiary)] uppercase font-bold mb-2">Assignee</p>
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-[10px] font-bold">
                                            {task.assignedTo ? getAssigneeName(task.assignedTo).slice(0, 2).toUpperCase() : 'U'}
                                        </div>
                                        <p className="text-sm font-medium">{task.assignedTo ? getAssigneeName(task.assignedTo) : 'Unassigned'}</p>
                                    </div>
                                </div>

                                <div>
                                    <p className="text-xs text-[var(--text-tertiary)] uppercase font-bold mb-2">Due Date</p>
                                    <div className="flex items-center gap-2 text-sm">
                                        <svg className="w-4 h-4 text-[var(--text-tertiary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                        <span>{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date'}</span>
                                    </div>
                                </div>

                                <div>
                                    <p className="text-xs text-[var(--text-tertiary)] uppercase font-bold mb-2">Created By</p>
                                    <p className="text-sm text-[var(--text-secondary)]">{getSubmitterName(task.assignedBy)}</p>
                                </div>

                                <div className="pt-4 border-t border-[var(--border-color)]">
                                    <p className="text-xs text-[var(--text-tertiary)] italic">Created {new Date(task.createdAt).toLocaleDateString()}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
