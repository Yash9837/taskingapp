'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import Modal from '@/components/Modal';
import StatusBadge from '@/components/StatusBadge';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useAuth } from '@/contexts/AuthContext';
import { getTasks, getTasksByUser, getProjects, addTask, updateTask, deleteTask, getAllUsers } from '@/lib/firestore';
import { Task, Project, TeamMember } from '@/lib/types';
import { canCreateTask, canEditTask, canDeleteTask } from '@/lib/rbac';

type TaskStatus = 'todo' | 'in-progress' | 'review' | 'done';
type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

interface TaskFormData {
  title: string;
  description: string;
  projectId: string;
  status: 'todo' | 'in-progress' | 'review' | 'done';
  priority: TaskPriority;
  assignedTo: string;
  dueDate: string;
  tags: string[];
}

const COLUMN_CONFIG = {
  'todo': { label: 'To Do', accentClass: 'border-gray-500', bgAccent: 'bg-gray-500/10' },
  'in-progress': { label: 'In Progress', accentClass: 'border-blue-500', bgAccent: 'bg-blue-500/10' },
  'review': { label: 'In Review', accentClass: 'border-yellow-500', bgAccent: 'bg-yellow-500/10' },
  'done': { label: 'Done', accentClass: 'border-green-500', bgAccent: 'bg-green-500/10' },
};

const PRIORITY_COLORS: Record<TaskPriority, { border: string; badge: string }> = {
  low: { border: 'border-gray-500', badge: 'bg-gray-500/20 text-gray-300' },
  medium: { border: 'border-blue-500', badge: 'bg-blue-500/20 text-blue-300' },
  high: { border: 'border-orange-500', badge: 'bg-orange-500/20 text-orange-300' },
  urgent: { border: 'border-red-500', badge: 'bg-red-500/20 text-red-300' },
};

export default function TasksPage() {
  const router = useRouter();
  const { user, userData } = useAuth();
  const userRole = userData?.role || 'member';
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<TaskFormData>({
    title: '',
    description: '',
    projectId: '',
    status: 'todo',
    priority: 'medium',
    assignedTo: '',
    dueDate: '',
    tags: [],
  });

  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      try {
        setLoading(true);
        // Members only see tasks assigned to them
        const tasksPromise = userRole === 'member'
          ? getTasksByUser(user.uid)
          : getTasks();
        const [tasksData, projectsData, usersData] = await Promise.all([
          tasksPromise,
          getProjects(userRole === 'member' ? user.uid : undefined),
          getAllUsers(),
        ]);
        setTasks(tasksData);
        setProjects(projectsData);
        setMembers(usersData);
        if (projectsData.length > 0 && selectedProjectId === 'all') {
          // keep 'all' as default
        }
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user, userRole]);

  // Get member display name from uid
  const getMemberName = (uid?: string): string => {
    if (!uid) return 'Unassigned';
    const member = members.find(m => m.uid === uid);
    return member?.displayName || uid;
  };

  const handleNewTask = () => {
    setSelectedTask(null);
    setFormData({
      title: '',
      description: '',
      projectId: selectedProjectId === 'all' ? projects[0]?.id || '' : selectedProjectId,
      status: 'todo',
      priority: 'medium',
      assignedTo: '',
      dueDate: '',
      tags: [],
    });
    setShowModal(true);
  };

  const handleEditTask = (task: Task) => {
    console.log('Opening task detail for:', task.id, 'Role:', userRole);
    try {
      setSelectedTask(task);

      let formattedDueDate = '';
      if (task.dueDate) {
        try {
          const d = new Date(task.dueDate);
          if (!isNaN(d.getTime())) {
            formattedDueDate = d.toISOString().split('T')[0];
          }
        } catch (e) {
          console.warn('Invalid due date format:', task.dueDate);
        }
      }

      setFormData({
        title: task.title,
        description: task.description || '',
        projectId: task.projectId,
        status: task.status as TaskStatus,
        priority: task.priority as TaskPriority,
        assignedTo: task.assignedTo || '',
        dueDate: formattedDueDate,
        tags: task.tags || [],
      });
      setShowModal(true);
      console.log('Modal state set to true');
    } catch (err) {
      console.error('Error in handleEditTask:', err);
    }
  };

  const handleQuickStatusChange = async (task: Task, newStatus: TaskStatus) => {
    try {
      const updates: Partial<Task> = { status: newStatus };
      if (newStatus === 'in-progress' && !task.startedAt) {
        updates.startedAt = new Date().toISOString();
      }
      if (newStatus === 'done' && !task.completedAt) {
        updates.completedAt = new Date().toISOString();
      }
      await updateTask(task.id, task.projectId, updates);
      setTasks(tasks.map(t => t.id === task.id ? { ...t, ...updates } : t));
    } catch (error) {
      console.error('Failed to update task status:', error);
    }
  };

  const handleSaveTask = async () => {
    if (!formData.title.trim()) {
      alert('Title is required');
      return;
    }

    try {
      setIsSubmitting(true);
      const taskData = {
        title: formData.title,
        description: formData.description,
        projectId: formData.projectId,
        status: formData.status,
        priority: formData.priority,
        assignedTo: formData.assignedTo,
        dueDate: formData.dueDate || undefined,
        tags: formData.tags.filter(t => t.trim()),
      };

      if (selectedTask) {
        await updateTask(selectedTask.id, selectedTask.projectId, taskData);
        setTasks(tasks.map(t => t.id === selectedTask.id ? { ...t, ...taskData } : t));
      } else {
        await addTask(
          formData.projectId,
          formData.title,
          formData.description,
          formData.assignedTo || '',
          user!.uid,
          formData.priority,
          formData.dueDate || undefined,
          formData.tags
        );
        // Refresh tasks
        const updatedTasks = userRole === 'member'
          ? await getTasksByUser(user!.uid)
          : await getTasks();
        setTasks(updatedTasks);
      }

      setShowModal(false);
    } catch (error) {
      console.error('Failed to save task:', error);
      alert('Failed to save task. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTask = async () => {
    if (!selectedTask) return;
    if (!confirm('Are you sure you want to delete this task?')) return;

    try {
      setIsSubmitting(true);
      await deleteTask(selectedTask.id);
      setTasks(tasks.filter(t => t.id !== selectedTask.id));
      setShowModal(false);
    } catch (error) {
      console.error('Failed to delete task:', error);
      alert('Failed to delete task. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredTasks =
    selectedProjectId === 'all'
      ? tasks
      : tasks.filter(t => t.projectId === selectedProjectId);

  const tasksByStatus: Record<TaskStatus, Task[]> = {
    'todo': filteredTasks.filter(t => t.status === 'todo'),
    'in-progress': filteredTasks.filter(t => t.status === 'in-progress'),
    'review': filteredTasks.filter(t => t.status === 'review'),
    'done': filteredTasks.filter(t => t.status === 'done'),
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getNextStatus = (status: TaskStatus): TaskStatus => {
    const statuses: TaskStatus[] = ['todo', 'in-progress', 'review', 'done'];
    const currentIndex = statuses.indexOf(status);
    return statuses[currentIndex + 1] || status;
  };

  const getStatusButtonLabel = (status: TaskStatus): string => {
    const labels: Record<TaskStatus, string> = {
      'todo': 'Start',
      'in-progress': 'Review',
      'review': 'Complete',
      'done': 'Done',
    };
    return labels[status];
  };

  // Filter members to only show members (not admin/manager) for assignment
  const assignableMembers = members.filter(m => m.role === 'member');

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)]">
        <Header title="Task Board" />
        <div className="flex items-center justify-center h-96">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <Header title="Task Board" />

      <div className="p-6">
        {/* Top Bar */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8 items-start sm:items-center justify-between">
          <div className="flex items-center gap-4">
            <select
              value={selectedProjectId}
              onChange={e => setSelectedProjectId(e.target.value)}
              className="px-4 py-2 rounded-lg bg-[var(--bg-input)] border border-[var(--border-color)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)] focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Projects</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>

            {/* Task count summary */}
            <div className="hidden sm:flex items-center gap-3 text-sm text-[var(--text-tertiary)]">
              <span>{filteredTasks.length} tasks</span>
              <span>•</span>
              <span className="text-emerald-400">{tasksByStatus.done.length} done</span>
              <span>•</span>
              <span className="text-blue-400">{tasksByStatus['in-progress'].length} in progress</span>
            </div>
          </div>

          {canCreateTask(userRole) && (
            <button
              onClick={handleNewTask}
              className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-[var(--text-primary)] rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Task
            </button>
          )}
        </div>

        {/* Member info bar for Members */}
        {userRole === 'member' && (
          <div className="mb-6 p-4 bg-blue-500/5 border border-blue-500/20 rounded-lg">
            <p className="text-sm text-blue-300">
              <span className="font-medium">Your Tasks</span> — Showing tasks assigned to you. Use the status buttons to update progress.
            </p>
          </div>
        )}

        {/* Kanban Board */}
        <div className="overflow-x-auto pb-6">
          <div className="flex gap-6 min-w-max">
            {(Object.keys(COLUMN_CONFIG) as TaskStatus[]).map(status => (
              <div
                key={status}
                className="w-80 flex-shrink-0"
              >
                {/* Column Header */}
                <div className="mb-4">
                  <div className={`flex items-center gap-3 pb-3 border-b-4 ${COLUMN_CONFIG[status].accentClass}`}>
                    <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                      {COLUMN_CONFIG[status].label}
                    </h2>
                    <span className="px-3 py-1 text-sm font-medium text-gray-300 bg-[var(--bg-input)] rounded-full">
                      {tasksByStatus[status].length}
                    </span>
                  </div>
                </div>

                {/* Tasks List */}
                <div className="space-y-3 min-h-64">
                  {tasksByStatus[status].length > 0 ? (
                    tasksByStatus[status].map(task => (
                      <div
                        key={task.id}
                        className={`p-4 rounded-lg bg-[var(--bg-card-solid)] hover:bg-[var(--bg-hover)] cursor-pointer transition-all border-l-4 ${PRIORITY_COLORS[task.priority as TaskPriority]?.border || 'border-gray-500'}`}
                        onClick={() => {
                          if (userRole === 'member') {
                            router.push(`/tasks/${task.id}`);
                          } else {
                            handleEditTask(task);
                          }
                        }}
                      >
                        {/* Task Title */}
                        <h3 className="font-semibold text-[var(--text-primary)] mb-2 line-clamp-2">
                          {task.title}
                        </h3>

                        {/* Task Description */}
                        {task.description && (
                          <p className="text-sm text-gray-400 mb-3 line-clamp-1">
                            {task.description}
                          </p>
                        )}

                        {/* Project Name */}
                        {(() => {
                          const project = projects.find(p => p.id === task.projectId);
                          return project ? (
                            <span className="inline-block text-xs text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded mb-3">
                              {project.name}
                            </span>
                          ) : null;
                        })()}

                        {/* Tags */}
                        {task.tags && task.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-3">
                            {task.tags.slice(0, 2).map(tag => (
                              <span
                                key={tag}
                                className="px-2 py-1 text-xs bg-[var(--bg-input)] text-gray-300 rounded-md"
                              >
                                {tag}
                              </span>
                            ))}
                            {task.tags.length > 2 && (
                              <span className="px-2 py-1 text-xs bg-[var(--bg-input)] text-gray-400 rounded-md">
                                +{task.tags.length - 2}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Metadata Row */}
                        <div className="flex items-center justify-between mb-3">
                          {/* Assignee */}
                          <div className="flex items-center gap-2">
                            {task.assignedTo ? (
                              <>
                                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                                  <span className="text-[9px] font-semibold text-white">
                                    {getInitials(getMemberName(task.assignedTo))}
                                  </span>
                                </div>
                                <span className="text-xs text-gray-400 truncate max-w-[120px]">
                                  {getMemberName(task.assignedTo)}
                                </span>
                              </>
                            ) : (
                              <>
                                <div className="w-6 h-6 rounded-full bg-gray-600 flex items-center justify-center flex-shrink-0 border border-dashed border-gray-400">
                                  <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                  </svg>
                                </div>
                                <span className="text-xs text-gray-500 italic">Unassigned</span>
                              </>
                            )}
                          </div>

                          {/* Due Date */}
                          {task.dueDate && (
                            <span className="text-xs text-gray-400">
                              {new Date(task.dueDate).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                              })}
                            </span>
                          )}
                        </div>

                        {/* Priority Badge */}
                        <div className="mb-3">
                          <StatusBadge
                            status={task.priority}
                            type="priority"
                          />
                        </div>

                        {/* Quick Status Change Button */}
                        {status !== 'done' && (
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              handleQuickStatusChange(task, getNextStatus(status));
                            }}
                            className="w-full mt-2 py-2 px-3 text-sm font-medium text-center rounded-md bg-[var(--bg-input)] hover:bg-[var(--bg-hover)] text-gray-300 hover:text-[var(--text-primary)] transition-colors"
                          >
                            {getStatusButtonLabel(status)}
                          </button>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="flex items-center justify-center h-64 border-2 border-dashed border-[var(--border-color)] rounded-lg">
                      <div className="text-center">
                        <svg
                          className="w-12 h-12 mx-auto mb-2 text-gray-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                          />
                        </svg>
                        <p className="text-gray-500 text-sm font-medium">No tasks yet</p>
                        <p className="text-gray-600 text-xs mt-1">
                          {canCreateTask(userRole) ? 'Click "+ New Task" to create one' : 'Tasks will appear here when assigned to you'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Task Detail/Edit Modal — only for Admin/Manager */}
      {canEditTask(userRole) && (
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title={selectedTask ? 'Edit Task' : 'Create New Task'}
        >
          <div className="space-y-4">
            {/* Title Input */}
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">
                Title {userRole !== 'member' && <span className="text-red-400">*</span>}
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                readOnly={userRole === 'member'}
                className={`w-full px-4 py-2 rounded-lg bg-[var(--bg-input)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 ${userRole === 'member' ? 'opacity-70 cursor-default' : ''}`}
                placeholder="Enter task title"
              />
            </div>

            {/* Description Textarea */}
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                readOnly={userRole === 'member'}
                rows={3}
                className={`w-full px-4 py-2 rounded-lg bg-[var(--bg-input)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none ${userRole === 'member' ? 'opacity-70 cursor-default' : ''}`}
                placeholder="Enter task description"
              />
            </div>

            {/* Project Select */}
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">
                Project {userRole !== 'member' && <span className="text-red-400">*</span>}
              </label>
              <select
                value={formData.projectId}
                onChange={e => setFormData({ ...formData, projectId: e.target.value })}
                disabled={userRole === 'member'}
                className={`w-full px-4 py-2 rounded-lg bg-[var(--bg-input)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500 ${userRole === 'member' ? 'opacity-70 cursor-default' : ''}`}
              >
                <option value="">Select a project</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Assign To — Dropdown of Members */}
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">
                Assign To (Optional)
              </label>
              <select
                value={formData.assignedTo}
                onChange={e => setFormData({ ...formData, assignedTo: e.target.value })}
                disabled={userRole === 'member'}
                className={`w-full px-4 py-2 rounded-lg bg-[var(--bg-input)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500 ${userRole === 'member' ? 'opacity-70 cursor-default' : ''}`}
              >
                <option value="">Leave Unassigned</option>
                {assignableMembers.map(m => (
                  <option key={m.uid} value={m.uid}>
                    {m.displayName} ({m.email})
                  </option>
                ))}
              </select>
              {assignableMembers.length === 0 && userRole !== 'member' && (
                <p className="text-xs text-amber-400 mt-1">No members found. Add members first via Settings.</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Priority Select */}
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">
                  Priority
                </label>
                <select
                  value={formData.priority}
                  onChange={e => setFormData({ ...formData, priority: e.target.value as TaskPriority })}
                  disabled={userRole === 'member'}
                  className={`w-full px-4 py-2 rounded-lg bg-[var(--bg-input)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500 ${userRole === 'member' ? 'opacity-70 cursor-default' : ''}`}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

              {/* Due Date Input */}
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">
                  Due Date
                </label>
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
                  readOnly={userRole === 'member'}
                  className={`w-full px-4 py-2 rounded-lg bg-[var(--bg-input)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500 ${userRole === 'member' ? 'opacity-70 cursor-default' : ''}`}
                />
              </div>
            </div>

            {/* Status Select (only for editing or view) */}
            {selectedTask && (
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={e =>
                    setFormData({ ...formData, status: e.target.value as TaskStatus })
                  }
                  disabled={userRole === 'member'}
                  className={`w-full px-4 py-2 rounded-lg bg-[var(--bg-input)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500 ${userRole === 'member' ? 'opacity-70 cursor-default' : ''}`}
                >
                  <option value="todo">To Do</option>
                  <option value="in-progress">In Progress</option>
                  <option value="review">In Review</option>
                  <option value="done">Done</option>
                </select>
              </div>
            )}

            {/* Tags Input */}
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">
                Tags (comma-separated)
              </label>
              <input
                type="text"
                value={formData.tags.join(', ')}
                onChange={e =>
                  setFormData({
                    ...formData,
                    tags: e.target.value.split(',').map(t => t.trim()),
                  })
                }
                readOnly={userRole === 'member'}
                className={`w-full px-4 py-2 rounded-lg bg-[var(--bg-input)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 ${userRole === 'member' ? 'opacity-70 cursor-default' : ''}`}
                placeholder="e.g. frontend, bug, urgent"
              />
            </div>

            {/* Modal Actions */}
            <div className="flex gap-3 pt-4 border-t border-[var(--border-color)]">
              {selectedTask && canDeleteTask(userRole) && (
                <button
                  onClick={handleDeleteTask}
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 hover:text-red-300 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Delete
                </button>
              )}
              <button
                onClick={() => setShowModal(false)}
                disabled={isSubmitting}
                className={`flex-1 px-4 py-2 rounded-lg border border-[var(--border-color)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)] font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${userRole === 'member' ? 'w-full' : ''}`}
              >
                {userRole === 'member' ? 'Close' : 'Cancel'}
              </button>
              {userRole !== 'member' && selectedTask && (
                <Link
                  href={`/tasks/${selectedTask.id}`}
                  className="flex-1 px-4 py-2 rounded-lg border border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/10 font-medium transition-colors flex items-center justify-center"
                >
                  View Full Details
                </Link>
              )}
              {userRole !== 'member' && (
                <button
                  onClick={handleSaveTask}
                  disabled={isSubmitting || !formData.title.trim() || !formData.projectId}
                  className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-[var(--text-primary)] rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Saving...
                    </>
                  ) : selectedTask ? (
                    'Update Task'
                  ) : (
                    'Create Task'
                  )}
                </button>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
