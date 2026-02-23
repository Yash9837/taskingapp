'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getProjects, addProject, updateProject, deleteProject } from '@/lib/firestore';
import { Project } from '@/lib/types';
import Header from '@/components/Header';
import Modal from '@/components/Modal';
import StatusBadge from '@/components/StatusBadge';
import EmptyState from '@/components/EmptyState';
import LoadingSpinner from '@/components/LoadingSpinner';
import { canCreateProject, canEditProject, canDeleteProject } from '@/lib/rbac';

interface ProjectFormData {
  name: string;
  description: string;
  status: 'active' | 'completed' | 'on-hold';
}

export default function ProjectsPage() {
  const { user, userData } = useAuth();
  const userRole = userData?.role || 'member';
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [formData, setFormData] = useState<ProjectFormData>({
    name: '',
    description: '',
    status: 'active',
  });

  // Fetch projects on mount
  useEffect(() => {
    fetchProjects();
  }, [user]);

  const fetchProjects = async () => {
    if (!user) return;
    try {
      setLoading(true);
      setError(null);
      const fetchedProjects = await getProjects(user.uid);
      setProjects(fetchedProjects);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch projects');
      console.error('Error fetching projects:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (project?: Project) => {
    if (project) {
      setEditingProject(project);
      setFormData({
        name: project.name,
        description: project.description || '',
        status: project.status as 'active' | 'completed' | 'on-hold',
      });
    } else {
      setEditingProject(null);
      setFormData({
        name: '',
        description: '',
        status: 'active',
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingProject(null);
    setFormData({
      name: '',
      description: '',
      status: 'active',
    });
  };

  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSaveProject = async () => {
    if (!user || !formData.name.trim()) {
      setError('Project name is required');
      return;
    }

    try {
      setError(null);
      if (editingProject) {
        await updateProject(editingProject.id, {
          name: formData.name,
          description: formData.description,
          status: formData.status,
        });
      } else {
        await addProject(
          formData.name,
          formData.description,
          user.uid
        );
      }
      handleCloseModal();
      await fetchProjects();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save project');
      console.error('Error saving project:', err);
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    try {
      setError(null);
      await deleteProject(projectId);
      setDeleteConfirm(null);
      await fetchProjects();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete project');
      console.error('Error deleting project:', err);
    }
  };

  const navigateToProject = (projectId: string) => {
    // Navigate to project detail page
    window.location.href = `/projects/${projectId}`;
  };

  // Format date to readable string
  const formatDate = (date: any) => {
    if (!date) return '';
    const d = date instanceof Date ? date : date.toDate?.() || new Date(date);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Truncate text to 2 lines
  const truncateText = (text: string, lines: number = 2) => {
    const lineArray = text.split('\n').slice(0, lines);
    return lineArray.join('\n').substring(0, 150) + (text.length > 150 ? '...' : '');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[var(--bg-primary)]">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
      {/* Header */}
      <Header title="Projects" />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Top Bar with New Project Button */}
        <div className="flex justify-between items-center mb-8">
          <div />
          {canCreateProject(userRole) && (
            <button
              onClick={() => handleOpenModal()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              New Project
            </button>
          )}
        </div>

        {/* Empty State */}
        {projects.length === 0 ? (
          <EmptyState
            title="No projects yet"
            description="Create your first project to get started"
            action={{
              label: 'Create Project',
              onClick: () => handleOpenModal(),
            }}
          />
        ) : (
          /* Projects Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map(project => (
              <div
                key={project.id}
                className="bg-[var(--bg-card-solid)] border border-[var(--border-color)] rounded-lg p-6 hover:border-[var(--border-color)] transition-all duration-200 hover:shadow-lg hover:shadow-indigo-500/10 group"
              >
                {/* Header with Actions */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="font-bold text-lg text-[var(--text-primary)] mb-2 group-hover:text-indigo-400 transition-colors">
                      {project.name}
                    </h3>
                  </div>
                  {canDeleteProject(userRole) && (
                    <div className="relative">
                      <button
                        onClick={() => setDeleteConfirm(deleteConfirm === project.id ? null : project.id)}
                        className="p-2 hover:bg-[var(--bg-hover)] rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <svg
                          className="w-5 h-5 text-gray-400 hover:text-red-400"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M6 18L18 6M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>

                {/* Delete Confirmation */}
                {deleteConfirm === project.id && (
                  <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded text-red-400 text-sm space-y-2">
                    <p>Delete this project?</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDeleteProject(project.id)}
                        className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-[var(--text-primary)] text-xs font-medium transition-colors"
                      >
                        Delete
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(null)}
                        className="px-3 py-1 bg-[var(--bg-input)] hover:bg-[var(--bg-hover)] rounded text-gray-300 text-xs font-medium transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Description */}
                {project.description && (
                  <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                    {truncateText(project.description)}
                  </p>
                )}

                {/* Status Badge */}
                <div className="mb-4">
                  <StatusBadge type="project" status={project.status} />
                </div>

                {/* Stats Row */}
                <div className="flex items-center justify-between text-xs text-gray-500 mb-4 py-3 border-t border-b border-[var(--border-color)]">
                  {/* Members Count */}
                  <div className="flex items-center gap-2">
                    <div className="flex -space-x-2">
                      {project.members && project.members.length > 0 ? (
                        project.members.slice(0, 3).map((_, idx) => (
                          <div
                            key={idx}
                            className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-600 border border-[#0a0a0f] flex items-center justify-center text-xs font-bold"
                          >
                            {String.fromCharCode(65 + idx)}
                          </div>
                        ))
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-[var(--bg-input)] border border-[var(--border-color)] flex items-center justify-center">
                          <svg
                            className="w-3 h-3 text-gray-500"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                          </svg>
                        </div>
                      )}
                      {project.members && project.members.length > 3 && (
                        <div className="w-6 h-6 rounded-full bg-[var(--bg-input)] border border-[var(--border-color)] flex items-center justify-center text-xs font-bold">
                          +{project.members.length - 3}
                        </div>
                      )}
                    </div>
                    <span>{project.members?.length || 0} members</span>
                  </div>

                  {/* Members Badge */}
                  <div className="flex items-center gap-1">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4.354a4 4 0 110 5.292M15 21H3v-2a6 6 0 0112 0v2zm0 0h6v-2a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                      />
                    </svg>
                    <span>{project.members?.length || 0} members</span>
                  </div>
                </div>

                {/* Created Date */}
                <div className="text-xs text-gray-500 mb-4">
                  Created {formatDate(project.createdAt)}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={() => navigateToProject(project.id)}
                    className="flex-1 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg font-medium text-sm transition-colors"
                  >
                    View
                  </button>
                  {canEditProject(userRole) && (
                    <button
                      onClick={() => handleOpenModal(project)}
                      className="flex-1 px-3 py-2 bg-[var(--bg-input)] hover:bg-[var(--bg-hover)] rounded-lg font-medium text-sm transition-colors"
                    >
                      Edit
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Project Modal */}
      <Modal
        isOpen={showModal}
        onClose={handleCloseModal}
        title={editingProject ? 'Edit Project' : 'Create New Project'}
      >
        <div className="space-y-4">
          {/* Project Name */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Project Name
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleFormChange}
              placeholder="Enter project name"
              className="w-full px-4 py-2 bg-[var(--bg-card-solid)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleFormChange}
              placeholder="Enter project description"
              rows={4}
              className="w-full px-4 py-2 bg-[var(--bg-card-solid)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors resize-none"
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Status
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleFormChange}
              className="w-full px-4 py-2 bg-[var(--bg-card-solid)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
            >
              <option value="active">Active</option>
              <option value="on-hold">On Hold</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={handleCloseModal}
              className="flex-1 px-4 py-2 bg-[var(--bg-input)] hover:bg-[var(--bg-hover)] rounded-lg font-medium text-sm transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveProject}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 rounded-lg font-medium text-sm transition-all duration-200"
            >
              {editingProject ? 'Update Project' : 'Create Project'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
