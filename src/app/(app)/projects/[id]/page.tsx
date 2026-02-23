'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Header from '@/components/Header';
import LoadingSpinner from '@/components/LoadingSpinner';
import StatusBadge from '@/components/StatusBadge';
import EmptyState from '@/components/EmptyState';
import { useAuth } from '@/contexts/AuthContext';
import { getProject, getTasksByProject, getIssuesByProject, getTeamMembers } from '@/lib/firestore';
import { Project, Task, Issue, TeamMember } from '@/lib/types';

type Tab = 'overview' | 'tasks' | 'issues' | 'members';

export default function ProjectDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { user, userData } = useAuth();
    const projectId = params.id as string;

    const [project, setProject] = useState<Project | null>(null);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [issues, setIssues] = useState<Issue[]>([]);
    const [members, setMembers] = useState<TeamMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<Tab>('overview');

    useEffect(() => {
        const fetchProject = async () => {
            if (!projectId) return;
            try {
                setLoading(true);
                const [projectData, tasksData, issuesData, membersData] = await Promise.all([
                    getProject(projectId),
                    getTasksByProject(projectId),
                    getIssuesByProject(projectId),
                    getTeamMembers(projectId),
                ]);
                setProject(projectData);
                setTasks(tasksData);
                setIssues(issuesData);
                setMembers(membersData);
            } catch (error) {
                console.error('Error fetching project:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchProject();
    }, [projectId]);

    if (loading) {
        return (
            <div className="min-h-screen bg-[var(--bg-primary)]">
                <Header title="Project" userName={userData?.displayName || 'User'} />
                <div className="flex items-center justify-center py-32">
                    <LoadingSpinner />
                </div>
            </div>
        );
    }

    if (!project) {
        return (
            <div className="min-h-screen bg-[var(--bg-primary)]">
                <Header title="Project Not Found" userName={userData?.displayName || 'User'} />
                <div className="max-w-7xl mx-auto px-4 py-16">
                    <EmptyState
                        title="Project Not Found"
                        description="This project doesn't exist or you don't have access to it."
                        actionLabel="Back to Projects"
                        onAction={() => router.push('/projects')}
                    />
                </div>
            </div>
        );
    }

    const taskStats = {
        total: tasks.length,
        todo: tasks.filter((t) => t.status === 'todo').length,
        inProgress: tasks.filter((t) => t.status === 'in-progress').length,
        review: tasks.filter((t) => t.status === 'review').length,
        done: tasks.filter((t) => t.status === 'done').length,
    };

    const completionPercent = taskStats.total > 0
        ? Math.round((taskStats.done / taskStats.total) * 100)
        : 0;

    const tabs: { key: Tab; label: string; count: number }[] = [
        { key: 'overview', label: 'Overview', count: 0 },
        { key: 'tasks', label: 'Tasks', count: tasks.length },
        { key: 'issues', label: 'Issues', count: issues.length },
        { key: 'members', label: 'Members', count: members.length },
    ];

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'urgent': return 'text-red-400';
            case 'high': return 'text-orange-400';
            case 'medium': return 'text-blue-400';
            case 'low': return 'text-gray-400';
            default: return 'text-gray-400';
        }
    };

    return (
        <div className="min-h-screen bg-[var(--bg-primary)]">
            <Header title={project.name} userName={userData?.displayName || 'User'} />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Back button + Status */}
                <div className="flex items-center gap-4 mb-6">
                    <button
                        onClick={() => router.push('/projects')}
                        className="p-2 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] hover:bg-[var(--bg-hover)] transition-colors text-[var(--text-primary)]"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <div className="flex-1">
                        <p className="text-sm text-[var(--text-tertiary)]">{project.description || 'No description'}</p>
                    </div>
                    <StatusBadge status={project.status} type="project" />
                </div>

                {/* Tabs */}
                <div className="flex border-b border-[var(--border-color)] mb-6 gap-1 overflow-x-auto">
                    {tabs.map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`px-4 py-3 text-sm font-medium transition-all whitespace-nowrap border-b-2 ${activeTab === tab.key
                                    ? 'border-indigo-500 text-indigo-400'
                                    : 'border-transparent text-[var(--text-tertiary)] hover:text-[var(--text-primary)]'
                                }`}
                        >
                            {tab.label}
                            {tab.count > 0 && (
                                <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-[var(--bg-input)] text-[var(--text-secondary)]">
                                    {tab.count}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                {activeTab === 'overview' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Progress Card */}
                        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-6">
                            <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4">Progress</h3>
                            <div className="flex items-end gap-4 mb-4">
                                <span className="text-4xl font-bold text-indigo-400">{completionPercent}%</span>
                                <span className="text-sm text-[var(--text-tertiary)] pb-1">complete</span>
                            </div>
                            <div className="w-full h-3 bg-[var(--bg-input)] rounded-full overflow-hidden mb-4">
                                <div
                                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full transition-all duration-500"
                                    style={{ width: `${completionPercent}%` }}
                                />
                            </div>
                            <div className="grid grid-cols-4 gap-2 text-center">
                                <div>
                                    <p className="text-lg font-bold text-[var(--text-primary)]">{taskStats.todo}</p>
                                    <p className="text-[10px] text-gray-500 uppercase">To Do</p>
                                </div>
                                <div>
                                    <p className="text-lg font-bold text-blue-400">{taskStats.inProgress}</p>
                                    <p className="text-[10px] text-gray-500 uppercase">In Progress</p>
                                </div>
                                <div>
                                    <p className="text-lg font-bold text-yellow-400">{taskStats.review}</p>
                                    <p className="text-[10px] text-gray-500 uppercase">Review</p>
                                </div>
                                <div>
                                    <p className="text-lg font-bold text-green-400">{taskStats.done}</p>
                                    <p className="text-[10px] text-gray-500 uppercase">Done</p>
                                </div>
                            </div>
                        </div>

                        {/* Details Card */}
                        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-6">
                            <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4">Details</h3>
                            <div className="space-y-4">
                                <div className="flex justify-between">
                                    <span className="text-sm text-[var(--text-secondary)]">Status</span>
                                    <StatusBadge status={project.status} type="project" />
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-[var(--text-secondary)]">Created</span>
                                    <span className="text-sm text-[var(--text-primary)]">
                                        {new Date(project.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-[var(--text-secondary)]">Members</span>
                                    <span className="text-sm text-[var(--text-primary)]">{members.length}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-[var(--text-secondary)]">Open Issues</span>
                                    <span className="text-sm text-red-400">{issues.filter((i) => i.status === 'open').length}</span>
                                </div>
                            </div>
                        </div>

                        {/* Recent Tasks */}
                        <div className="md:col-span-2 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-6">
                            <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4">Recent Tasks</h3>
                            {tasks.length === 0 ? (
                                <p className="text-sm text-[var(--text-tertiary)]">No tasks yet</p>
                            ) : (
                                <div className="space-y-2">
                                    {tasks.slice(0, 5).map((task) => (
                                        <div key={task.id} className="flex items-center gap-3 p-3 bg-[var(--bg-primary)] rounded-lg border border-[var(--border-color)]">
                                            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${task.status === 'done' ? 'bg-green-500' : task.status === 'in-progress' ? 'bg-blue-500' : 'bg-gray-500'
                                                }`}></span>
                                            <span className="flex-1 text-sm text-[var(--text-primary)] truncate">{task.title}</span>
                                            <span className={`text-xs font-medium capitalize ${getPriorityColor(task.priority)}`}>{task.priority}</span>
                                            <StatusBadge status={task.status} type="task" />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'tasks' && (
                    <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl overflow-hidden">
                        {tasks.length === 0 ? (
                            <EmptyState title="No Tasks" description="This project doesn't have any tasks yet." />
                        ) : (
                            <div className="divide-y divide-[var(--border-color)]">
                                {tasks.map((task) => (
                                    <div key={task.id} className="flex items-center gap-4 px-6 py-4 hover:bg-[var(--bg-hover)] transition-colors">
                                        <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${task.status === 'done' ? 'bg-green-500' : task.status === 'in-progress' ? 'bg-blue-500' : task.status === 'review' ? 'bg-yellow-500' : 'bg-gray-500'
                                            }`}></span>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-[var(--text-primary)] truncate">{task.title}</p>
                                            {task.description && <p className="text-xs text-[var(--text-tertiary)] truncate mt-0.5">{task.description}</p>}
                                        </div>
                                        <span className={`text-xs font-medium capitalize ${getPriorityColor(task.priority)}`}>{task.priority}</span>
                                        <StatusBadge status={task.status} type="task" />
                                        {task.dueDate && (
                                            <span className="text-xs text-[var(--text-tertiary)]">
                                                Due {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'issues' && (
                    <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl overflow-hidden">
                        {issues.length === 0 ? (
                            <EmptyState title="No Issues" description="No issues have been reported for this project." />
                        ) : (
                            <div className="divide-y divide-[var(--border-color)]">
                                {issues.map((issue) => (
                                    <div key={issue.id} className="flex items-center gap-4 px-6 py-4 hover:bg-[var(--bg-hover)] transition-colors">
                                        <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${issue.severity === 'critical' ? 'bg-red-500' : issue.severity === 'high' ? 'bg-orange-500' : issue.severity === 'medium' ? 'bg-yellow-500' : 'bg-gray-500'
                                            }`}></span>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-[var(--text-primary)] truncate">{issue.title}</p>
                                            {issue.description && <p className="text-xs text-[var(--text-tertiary)] truncate mt-0.5">{issue.description}</p>}
                                        </div>
                                        <span className="text-xs capitalize text-[var(--text-tertiary)]">{issue.severity}</span>
                                        <StatusBadge status={issue.status} type="issue" />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'members' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {members.length === 0 ? (
                            <div className="col-span-full">
                                <EmptyState title="No Members" description="No team members assigned to this project yet." />
                            </div>
                        ) : (
                            members.map((member) => (
                                <div
                                    key={member.uid}
                                    className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-5 hover:border-indigo-500/30 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center text-sm font-bold text-[var(--text-primary)] flex-shrink-0">
                                            {(member.displayName || 'U').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium text-[var(--text-primary)] truncate">{member.displayName}</p>
                                            <p className="text-xs text-[var(--text-tertiary)] truncate">{member.email}</p>
                                        </div>
                                    </div>
                                    <div className="mt-3 flex items-center gap-2">
                                        <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 capitalize">
                                            {member.role || 'member'}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
