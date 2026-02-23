"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/Header';
import StatusBadge from '@/components/StatusBadge';
import LoadingSpinner from '@/components/LoadingSpinner';
import { getProjects, getTasks, getTasksByUser, getIssues, getActivities } from '@/lib/firestore';
import { Project, Task, Issue, Activity } from '@/lib/types';
import { UserRole, getRoleLabel } from '@/lib/rbac';

function getRelativeTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return `${Math.floor(days / 7)}w ago`;
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function DashboardPage() {
  const { user, userData } = useAuth();
  const userRole = (userData?.role || 'member') as UserRole;
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (!user?.uid) return;
      try {
        setLoading(true);
        // Members only see their own tasks; Admin/Manager see all
        const tasksPromise = userRole === 'member'
          ? getTasksByUser(user.uid)
          : getTasks();
        const [p, t, i, a] = await Promise.all([
          getProjects(user.uid),
          tasksPromise,
          getIssues(),
          getActivities(),
        ]);
        setProjects(p);
        setTasks(t);
        setIssues(i);
        setActivities(a);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [user?.uid, userRole]);

  const displayName = userData?.displayName || user?.displayName || 'User';
  const activeTasks = tasks.filter(t => t.status !== 'done').length;
  const openIssues = issues.filter(i => i.status !== 'resolved').length;
  const completedTasks = tasks.filter(t => t.status === 'done').length;
  const completionRate = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)]">
        <Header title="Dashboard" userName={displayName} />
        <div className="flex items-center justify-center h-96">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  const stats = [
    {
      label: 'Total Projects',
      value: projects.length,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
        </svg>
      ),
      color: 'text-indigo-400',
      bgColor: 'bg-indigo-500/10',
    },
    {
      label: 'Active Tasks',
      value: activeTasks,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10',
    },
    {
      label: 'Completion Rate',
      value: `${completionRate}%`,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
    },
    {
      label: 'Open Issues',
      value: openIssues,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      ),
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10',
    },
  ];

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <Header title="Dashboard" userName={displayName} />

      <div className="p-6 max-w-[1400px] mx-auto space-y-6">
        {/* Greeting */}
        <div>
          <h2 className="text-xl font-semibold text-[var(--text-primary)]">
            {getGreeting()}, {displayName.split(' ')[0]} 👋
          </h2>
          <p className="text-[13px] text-[var(--text-tertiary)] mt-0.5">
            {userRole === 'admin'
              ? 'Here\'s what\'s happening across your entire workspace.'
              : userRole === 'manager'
                ? 'Here\'s what\'s happening across your projects.'
                : 'Here\'s a summary of your assigned work.'}
          </p>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <div key={stat.label} className="stat-card">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <span className={stat.color}>{stat.icon}</span>
                </div>
                <div>
                  <p className="text-[22px] font-bold text-[var(--text-primary)] leading-tight">{stat.value}</p>
                  <p className="text-[11px] text-[var(--text-tertiary)] font-medium">{stat.label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left Column - Recent Tasks */}
          <div className="lg:col-span-2 card p-0 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-color)]">
              <h3 className="text-[14px] font-semibold text-[var(--text-primary)]">Recent Tasks</h3>
              <a href="/tasks" className="text-[12px] font-medium text-[var(--accent-light)] hover:text-[var(--accent)] transition-colors">
                View all →
              </a>
            </div>
            {tasks.length > 0 ? (
              <div className="divide-y divide-[var(--border-color)]">
                {tasks.slice(0, 6).map((task) => {
                  const project = projects.find(p => p.id === task.projectId);
                  return (
                    <div key={task.id} className="flex items-center gap-3 px-5 py-3 hover:bg-[var(--bg-hover)] transition-colors">
                      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${task.status === 'done' ? 'bg-emerald-500' :
                        task.status === 'in-progress' ? 'bg-blue-500' :
                          task.status === 'review' ? 'bg-amber-500' : 'bg-zinc-500'
                        }`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-medium text-[var(--text-primary)] truncate">{task.title}</p>
                        <p className="text-[11px] text-[var(--text-tertiary)]">{project?.name || 'No project'}</p>
                      </div>
                      <StatusBadge status={task.status} type="task" />
                      <span className={`text-[11px] font-medium px-1.5 py-0.5 rounded ${task.priority === 'urgent' ? 'bg-red-500/10 text-red-400' :
                        task.priority === 'high' ? 'bg-orange-500/10 text-orange-400' :
                          task.priority === 'medium' ? 'bg-blue-500/10 text-blue-400' :
                            'bg-zinc-500/10 text-zinc-400'
                        }`}>
                        {task.priority}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-16 text-center">
                <svg className="w-10 h-10 text-[var(--text-tertiary)] mx-auto mb-3 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p className="text-[13px] text-[var(--text-tertiary)]">No tasks yet. Create your first task to get started.</p>
              </div>
            )}
          </div>

          {/* Right Column - Project Progress */}
          <div className="card p-0 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-color)]">
              <h3 className="text-[14px] font-semibold text-[var(--text-primary)]">Project Progress</h3>
              <a href="/projects" className="text-[12px] font-medium text-[var(--accent-light)] hover:text-[var(--accent)] transition-colors">
                View all →
              </a>
            </div>
            {projects.length > 0 ? (
              <div className="p-5 space-y-4">
                {projects.slice(0, 5).map((project) => {
                  const projectTasks = tasks.filter(t => t.projectId === project.id);
                  const done = projectTasks.filter(t => t.status === 'done').length;
                  const pct = projectTasks.length > 0 ? Math.round((done / projectTasks.length) * 100) : 0;
                  return (
                    <div key={project.id}>
                      <div className="flex items-center justify-between mb-1.5">
                        <a href={`/projects/${project.id}`} className="text-[13px] font-medium text-[var(--text-primary)] hover:text-[var(--accent-light)] transition-colors truncate">
                          {project.name}
                        </a>
                        <span className="text-[11px] text-[var(--text-tertiary)] ml-2 tabular-nums">{pct}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-[var(--bg-input)] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-[var(--text-tertiary)] mt-1">{done} of {projectTasks.length} tasks complete</p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-16 text-center">
                <svg className="w-10 h-10 text-[var(--text-tertiary)] mx-auto mb-3 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
                <p className="text-[13px] text-[var(--text-tertiary)]">No projects yet.</p>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Activity Feed */}
          <div className="lg:col-span-2 card p-0 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-color)]">
              <h3 className="text-[14px] font-semibold text-[var(--text-primary)]">Activity</h3>
              <a href="/activity" className="text-[12px] font-medium text-[var(--accent-light)] hover:text-[var(--accent)] transition-colors">
                View all →
              </a>
            </div>
            {activities.length > 0 ? (
              <div className="divide-y divide-[var(--border-color)]">
                {activities.slice(0, 5).map((activity, idx) => (
                  <div key={idx} className="flex items-start gap-3 px-5 py-3 hover:bg-[var(--bg-hover)] transition-colors">
                    <div className="w-7 h-7 rounded-full bg-[var(--accent-glow)] flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-3.5 h-3.5 text-[var(--accent-light)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] text-[var(--text-primary)]">
                        {activity.action}{' '}
                        <span className="font-medium text-[var(--accent-light)]">{activity.targetTitle}</span>
                      </p>
                      <p className="text-[11px] text-[var(--text-tertiary)] mt-0.5">{getRelativeTime(new Date(activity.createdAt))}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center">
                <p className="text-[13px] text-[var(--text-tertiary)]">No activity yet.</p>
              </div>
            )}
          </div>

          {/* Priority Breakdown */}
          <div className="card p-5">
            <h3 className="text-[14px] font-semibold text-[var(--text-primary)] mb-4">Priority Breakdown</h3>
            {tasks.length > 0 ? (
              <div className="space-y-3">
                {[
                  { label: 'Urgent', key: 'urgent', color: 'bg-red-500', textColor: 'text-red-400' },
                  { label: 'High', key: 'high', color: 'bg-orange-500', textColor: 'text-orange-400' },
                  { label: 'Medium', key: 'medium', color: 'bg-blue-500', textColor: 'text-blue-400' },
                  { label: 'Low', key: 'low', color: 'bg-zinc-500', textColor: 'text-zinc-400' },
                ].map((p) => {
                  const count = tasks.filter(t => t.priority === p.key).length;
                  const pct = Math.round((count / tasks.length) * 100);
                  return (
                    <div key={p.key}>
                      <div className="flex justify-between mb-1">
                        <span className={`text-[12px] font-medium ${p.textColor}`}>{p.label}</span>
                        <span className="text-[11px] text-[var(--text-tertiary)] tabular-nums">{count}</span>
                      </div>
                      <div className="w-full h-1.5 bg-[var(--bg-input)] rounded-full overflow-hidden">
                        <div className={`h-full ${p.color} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}

                <div className="pt-4 mt-3 border-t border-[var(--border-color)] grid grid-cols-2 gap-3">
                  <div className="text-center p-2.5 bg-[var(--bg-input)] rounded-lg">
                    <p className="text-[18px] font-bold text-emerald-400 leading-tight">{completedTasks}</p>
                    <p className="text-[10px] text-[var(--text-tertiary)] uppercase font-medium mt-0.5">Done</p>
                  </div>
                  <div className="text-center p-2.5 bg-[var(--bg-input)] rounded-lg">
                    <p className="text-[18px] font-bold text-blue-400 leading-tight">{tasks.filter(t => t.status === 'in-progress').length}</p>
                    <p className="text-[10px] text-[var(--text-tertiary)] uppercase font-medium mt-0.5">In Progress</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-10 text-center">
                <p className="text-[13px] text-[var(--text-tertiary)]">No tasks yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
