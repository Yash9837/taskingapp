'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Modal from '@/components/Modal';
import StatusBadge from '@/components/StatusBadge';
import EmptyState from '@/components/EmptyState';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useAuth } from '@/contexts/AuthContext';
import {
  getIssues,
  getProjects,
  addIssue,
  updateIssue,
  deleteIssue,
} from '@/lib/firestore';
import { Issue, Project } from '@/lib/types';

interface FormData {
  title: string;
  description: string;
  projectId: string;
  taskId?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  assignedTo?: string;
  status?: 'open' | 'in-progress' | 'resolved' | 'closed';
}

export default function IssuesPage() {
  const { user } = useAuth();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    projectId: '',
    severity: 'medium',
  });

  // Filters
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [projectFilter, setProjectFilter] = useState<string>('all');

  // Load issues and projects
  useEffect(() => {
    const loadData = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const [issuesData, projectsData] = await Promise.all([
          getIssues(),
          getProjects(),
        ]);
        setIssues(issuesData);
        setProjects(projectsData);
      } catch (error) {
        console.error('Error loading issues:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user]);

  // Filter issues
  const filteredIssues = issues.filter((issue) => {
    if (severityFilter !== 'all' && issue.severity !== severityFilter)
      return false;
    if (statusFilter !== 'all' && issue.status !== statusFilter) return false;
    if (projectFilter !== 'all' && issue.projectId !== projectFilter)
      return false;
    return true;
  });

  // Calculate stats
  const stats = {
    total: issues.length,
    open: issues.filter((i) => i.status === 'open').length,
    inProgress: issues.filter((i) => i.status === 'in-progress').length,
    resolved: issues.filter((i) => i.status === 'resolved').length,
  };

  const handleReportIssue = async () => {
    if (!user || !formData.title || !formData.projectId) return;

    try {
      await addIssue(
        formData.projectId,
        formData.title,
        formData.description,
        formData.severity,
        user.displayName || user.email || 'Anonymous',
        formData.taskId,
        formData.assignedTo
      );

      const updatedIssues = await getIssues();
      setIssues(updatedIssues);
      setShowReportModal(false);
      resetForm();
    } catch (error) {
      console.error('Error reporting issue:', error);
    }
  };

  const handleEditIssue = async () => {
    if (!selectedIssue) return;

    try {
      await updateIssue(
        selectedIssue.id,
        selectedIssue.projectId,
        {
          title: formData.title,
          description: formData.description,
          severity: formData.severity,
          assignedTo: formData.assignedTo,
          status: formData.status as 'open' | 'in-progress' | 'resolved' | 'closed',
        }
      );

      const updatedIssues = await getIssues();
      setIssues(updatedIssues);
      setShowEditModal(false);
      setSelectedIssue(null);
      resetForm();
    } catch (error) {
      console.error('Error updating issue:', error);
    }
  };

  const handleDeleteIssue = async (issueId: string) => {
    if (!confirm('Are you sure you want to delete this issue?')) return;

    try {
      await deleteIssue(issueId);
      const updatedIssues = await getIssues();
      setIssues(updatedIssues);
    } catch (error) {
      console.error('Error deleting issue:', error);
    }
  };

  const openEditModal = (issue: Issue) => {
    setSelectedIssue(issue);
    setFormData({
      title: issue.title,
      description: issue.description || '',
      projectId: issue.projectId,
      taskId: issue.taskId,
      severity: issue.severity,
      assignedTo: issue.assignedTo,
      status: issue.status,
    });
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      projectId: '',
      severity: 'medium',
    });
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-500';
      case 'high':
        return 'bg-orange-500';
      case 'medium':
        return 'bg-blue-500';
      case 'low':
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getProjectName = (projectId: string) => {
    return projects.find((p) => p.id === projectId)?.name || 'Unknown';
  };

  const truncateText = (text: string, length: number) => {
    return text.length > length ? text.substring(0, length) + '...' : text;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <Header title="Issues" />

      <div className="p-8">
        {/* Stats Bar */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-[#1a1a2e] rounded-lg p-4 border border-[#2a2a4e]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium">Total Issues</p>
                <p className="text-[var(--text-primary)] text-2xl font-bold mt-1">{stats.total}</p>
              </div>
              <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-purple-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M3 2a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V2zM3 7a1 1 0 011-1h12a1 1 0 011 1v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-[#1a1a2e] rounded-lg p-4 border border-[#2a2a4e]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium">Open</p>
                <p className="text-[var(--text-primary)] text-2xl font-bold mt-1">{stats.open}</p>
              </div>
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-blue-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9 11a1 1 0 112 0 1 1 0 01-2 0zm4-3H7v2h6V8z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-[#1a1a2e] rounded-lg p-4 border border-[#2a2a4e]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium">In Progress</p>
                <p className="text-[var(--text-primary)] text-2xl font-bold mt-1">
                  {stats.inProgress}
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-orange-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 100-2 1 1 0 000 2zm6 0a1 1 0 100-2 1 1 0 000 2z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-[#1a1a2e] rounded-lg p-4 border border-[#2a2a4e]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium">Resolved</p>
                <p className="text-[var(--text-primary)] text-2xl font-bold mt-1">
                  {stats.resolved}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-green-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Top Bar */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <button
            onClick={() => {
              resetForm();
              setShowReportModal(true);
            }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-[var(--text-primary)] rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <svg
              className="w-5 h-5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z"
                clipRule="evenodd"
              />
            </svg>
            Report Issue
          </button>

          <div className="flex items-center gap-3">
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="px-3 py-2 bg-[#1a1a2e] border border-[#2a2a4e] text-gray-200 rounded-lg text-sm hover:border-[#3a3a5e] focus:outline-none focus:border-blue-500"
            >
              <option value="all">All Severities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-[#1a1a2e] border border-[#2a2a4e] text-gray-200 rounded-lg text-sm hover:border-[#3a3a5e] focus:outline-none focus:border-blue-500"
            >
              <option value="all">All Statuses</option>
              <option value="open">Open</option>
              <option value="in-progress">In Progress</option>
              <option value="resolved">Resolved</option>
            </select>

            <select
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              className="px-3 py-2 bg-[#1a1a2e] border border-[#2a2a4e] text-gray-200 rounded-lg text-sm hover:border-[#3a3a5e] focus:outline-none focus:border-blue-500"
            >
              <option value="all">All Projects</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Issues Table */}
        {filteredIssues.length === 0 ? (
          <EmptyState
            icon={
              <svg
                className="w-full h-full"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            }
            title="No issues found"
            description={
              severityFilter !== 'all' ||
              statusFilter !== 'all' ||
              projectFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Create your first issue to get started'
            }
            action={{
              label: 'Report Issue',
              onClick: () => {
                resetForm();
                setShowReportModal(true);
              },
            }}
          />
        ) : (
          <div className="border border-[#2a2a4e] rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-[#1a1a2e] border-b border-[#2a2a4e]">
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Severity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Title
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Project
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Reported By
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Assigned To
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredIssues.map((issue, index) => (
                    <tr
                      key={issue.id}
                      className={`border-b border-[#2a2a4e] hover:bg-[#1a1a2e] transition-colors ${
                        index % 2 === 0 ? 'bg-[#0f0f1a]' : 'bg-[#131320]'
                      }`}
                    >
                      <td className="px-6 py-4">
                        <div
                          className={`w-3 h-3 rounded-full ${getSeverityColor(
                            issue.severity
                          )}`}
                          title={issue.severity}
                        />
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-[var(--text-primary)]">
                        {issue.title}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-400">
                        {truncateText(issue.description || '', 50)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-300">
                        {getProjectName(issue.projectId)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-300">
                        {issue.reportedBy}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-300">
                        {issue.assignedTo || (
                          <span className="text-gray-500">Unassigned</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge type="issue" status={issue.status} />
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-400">
                        {formatDate(issue.createdAt)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openEditModal(issue)}
                            className="p-1.5 hover:bg-[#2a2a4e] rounded-lg transition-colors text-blue-400 hover:text-blue-300"
                            title="Edit"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDeleteIssue(issue.id)}
                            className="p-1.5 hover:bg-[#2a2a4e] rounded-lg transition-colors text-red-400 hover:text-red-300"
                            title="Delete"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Report Issue Modal */}
      <Modal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        title="Report Issue"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              className="w-full px-3 py-2 bg-[#1a1a2e] border border-[#2a2a4e] text-[var(--text-primary)] rounded-lg focus:outline-none focus:border-blue-500"
              placeholder="Brief issue title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows={4}
              className="w-full px-3 py-2 bg-[#1a1a2e] border border-[#2a2a4e] text-[var(--text-primary)] rounded-lg focus:outline-none focus:border-blue-500 resize-none"
              placeholder="Detailed description of the issue"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Project *
            </label>
            <select
              value={formData.projectId}
              onChange={(e) =>
                setFormData({ ...formData, projectId: e.target.value })
              }
              className="w-full px-3 py-2 bg-[#1a1a2e] border border-[#2a2a4e] text-[var(--text-primary)] rounded-lg focus:outline-none focus:border-blue-500"
            >
              <option value="">Select a project</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Severity *
            </label>
            <select
              value={formData.severity}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  severity: e.target.value as
                    | 'low'
                    | 'medium'
                    | 'high'
                    | 'critical',
                })
              }
              className="w-full px-3 py-2 bg-[#1a1a2e] border border-[#2a2a4e] text-[var(--text-primary)] rounded-lg focus:outline-none focus:border-blue-500"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Assign To
            </label>
            <input
              type="text"
              value={formData.assignedTo || ''}
              onChange={(e) =>
                setFormData({ ...formData, assignedTo: e.target.value })
              }
              className="w-full px-3 py-2 bg-[#1a1a2e] border border-[#2a2a4e] text-[var(--text-primary)] rounded-lg focus:outline-none focus:border-blue-500"
              placeholder="Team member name or email"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={handleReportIssue}
              disabled={!formData.title || !formData.projectId}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-[var(--text-primary)] rounded-lg font-medium transition-colors"
            >
              Report Issue
            </button>
            <button
              onClick={() => setShowReportModal(false)}
              className="flex-1 px-4 py-2 bg-[#1a1a2e] hover:bg-[#2a2a4e] text-gray-300 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>

      {/* Edit Issue Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Issue"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              className="w-full px-3 py-2 bg-[#1a1a2e] border border-[#2a2a4e] text-[var(--text-primary)] rounded-lg focus:outline-none focus:border-blue-500"
              placeholder="Brief issue title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows={4}
              className="w-full px-3 py-2 bg-[#1a1a2e] border border-[#2a2a4e] text-[var(--text-primary)] rounded-lg focus:outline-none focus:border-blue-500 resize-none"
              placeholder="Detailed description of the issue"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  status: e.target.value as 'open' | 'in-progress' | 'resolved',
                })
              }
              className="w-full px-3 py-2 bg-[#1a1a2e] border border-[#2a2a4e] text-[var(--text-primary)] rounded-lg focus:outline-none focus:border-blue-500"
            >
              <option value="open">Open</option>
              <option value="in-progress">In Progress</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Severity *
            </label>
            <select
              value={formData.severity}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  severity: e.target.value as
                    | 'low'
                    | 'medium'
                    | 'high'
                    | 'critical',
                })
              }
              className="w-full px-3 py-2 bg-[#1a1a2e] border border-[#2a2a4e] text-[var(--text-primary)] rounded-lg focus:outline-none focus:border-blue-500"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Assign To
            </label>
            <input
              type="text"
              value={formData.assignedTo || ''}
              onChange={(e) =>
                setFormData({ ...formData, assignedTo: e.target.value })
              }
              className="w-full px-3 py-2 bg-[#1a1a2e] border border-[#2a2a4e] text-[var(--text-primary)] rounded-lg focus:outline-none focus:border-blue-500"
              placeholder="Team member name or email"
            />
          </div>

          {/* Resolution notes can be added when the Issue type supports it */}

          <div className="flex gap-3 pt-4">
            <button
              onClick={handleEditIssue}
              disabled={!formData.title}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-[var(--text-primary)] rounded-lg font-medium transition-colors"
            >
              Save Changes
            </button>
            <button
              onClick={() => setShowEditModal(false)}
              className="flex-1 px-4 py-2 bg-[#1a1a2e] hover:bg-[#2a2a4e] text-gray-300 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
