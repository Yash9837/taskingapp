'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Modal from '@/components/Modal';
import StatusBadge from '@/components/StatusBadge';
import EmptyState from '@/components/EmptyState';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useAuth } from '@/contexts/AuthContext';
import { getTeamMembers, updateMemberProfile } from '@/lib/firestore';
import { TeamMember } from '@/lib/types';
import { canViewTeam } from '@/lib/rbac';

type ModalState = 'invite' | 'edit' | null;

export default function TeamPage() {
  const { user, userData } = useAuth();
  const userRole = userData?.role || 'member';

  // Access control: Members cannot view team page
  if (!canViewTeam(userRole)) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)]">
        <Header title="Team" />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/10 flex items-center justify-center">
              <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-1">Access Denied</h3>
            <p className="text-sm text-[var(--text-secondary)]">You don't have permission to view the team page.</p>
          </div>
        </div>
      </div>
    );
  }

  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [modalState, setModalState] = useState<ModalState>(null);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);

  // Invite form state
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'manager' | 'member'>('member');
  const [inviteDepartment, setInviteDepartment] = useState('');
  const [invitePosition, setInvitePosition] = useState('');

  // Edit form state
  const [editRole, setEditRole] = useState<'admin' | 'manager' | 'member'>('member');
  const [editDepartment, setEditDepartment] = useState('');
  const [editPosition, setEditPosition] = useState('');
  const [editSubmitting, setEditSubmitting] = useState(false);

  // Fetch team members (for now, fetch all users as team)
  useEffect(() => {
    const fetchTeamMembers = async () => {
      try {
        setLoading(true);
        // TODO: Replace with actual project team fetching when projects are available
        // For now, we'll show a placeholder
        setTeamMembers([]);
        setFilteredMembers([]);
      } catch (err) {
        console.error('Error fetching team members:', err);
        setError('Failed to load team members');
      } finally {
        setLoading(false);
      }
    };

    fetchTeamMembers();
  }, []);

  // Filter members based on search query
  useEffect(() => {
    const query = searchQuery.toLowerCase();
    const filtered = teamMembers.filter(
      (member) =>
        member.displayName.toLowerCase().includes(query) ||
        member.email.toLowerCase().includes(query) ||
        member.department?.toLowerCase().includes(query) ||
        member.position?.toLowerCase().includes(query)
    );
    setFilteredMembers(filtered);
  }, [searchQuery, teamMembers]);

  // Generate gradient based on name
  const getGradientFromName = (name: string): string => {
    const colors = [
      'from-indigo-500 to-purple-600',
      'from-blue-500 to-cyan-600',
      'from-emerald-500 to-teal-600',
      'from-orange-500 to-red-600',
      'from-pink-500 to-rose-600',
      'from-violet-500 to-indigo-600',
      'from-cyan-500 to-blue-600',
      'from-green-500 to-emerald-600',
    ];

    const code = name.charCodeAt(0) + (name.charCodeAt(name.length - 1) || 0);
    return colors[code % colors.length];
  };

  // Get initials from name
  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Handle invite modal open
  const openInviteModal = () => {
    setInviteEmail('');
    setInviteRole('member');
    setInviteDepartment('');
    setInvitePosition('');
    setModalState('invite');
  };

  // Handle edit modal open
  const openEditModal = (member: TeamMember) => {
    setSelectedMember(member);
    setEditRole(member.role);
    setEditDepartment(member.department || '');
    setEditPosition(member.position || '');
    setModalState('edit');
  };

  // Handle invite submit
  const handleInviteSubmit = () => {
    if (!inviteEmail.trim()) {
      setError('Please enter an email address');
      return;
    }

    // For now, show a coming soon message
    alert(
      'Invite feature coming soon!\n\nEmail: ' +
      inviteEmail +
      '\nRole: ' +
      inviteRole +
      '\nDepartment: ' +
      (inviteDepartment || 'Not set') +
      '\nPosition: ' +
      (invitePosition || 'Not set')
    );

    // TODO: Implement actual invite functionality
    // - Send invitation email
    // - Create user record in Firestore
    // - Add to team/project

    setModalState(null);
  };

  // Handle edit submit
  const handleEditSubmit = async () => {
    if (!selectedMember) return;

    try {
      setEditSubmitting(true);
      await updateMemberProfile(selectedMember.uid, {
        role: editRole,
        department: editDepartment || undefined,
        position: editPosition || undefined,
      });

      // Update local state
      setTeamMembers(
        teamMembers.map((member) =>
          member.uid === selectedMember.uid
            ? {
              ...member,
              role: editRole,
              department: editDepartment || undefined,
              position: editPosition || undefined,
            }
            : member
        )
      );

      setModalState(null);
      setError(null);
    } catch (err) {
      console.error('Error updating member:', err);
      setError('Failed to update member profile');
    } finally {
      setEditSubmitting(false);
    }
  };

  // Handle modal close
  const closeModal = () => {
    setModalState(null);
    setSelectedMember(null);
    setError(null);
  };

  // Calculate task progress percentage
  const getTaskProgress = (member: TeamMember): number => {
    const total = member.tasksCompleted + member.tasksInProgress;
    if (total === 0) return 0;
    return Math.round((member.tasksCompleted / total) * 100);
  };

  // Get role color
  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'manager':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)]">
        <Header title="Team" userName={userData?.displayName || 'User'} />
        <div className="flex items-center justify-center h-96">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <Header title="Team" userName={userData?.displayName || 'User'} />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Top Bar */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              placeholder="Search members..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2.5 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:border-indigo-500/50 focus:bg-[var(--bg-input)] transition-all duration-200"
            />
            <svg
              className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[var(--text-tertiary)]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>

          {/* Invite Button */}
          <button
            onClick={openInviteModal}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-[var(--text-primary)] rounded-lg font-medium transition-all duration-200 hover:shadow-lg hover:shadow-indigo-500/30 whitespace-nowrap"
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
            Invite Member
          </button>
        </div>

        {/* Team Grid */}
        {filteredMembers.length === 0 ? (
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
                  d="M12 4.354a4 4 0 110 5.292M15 12H9m6 0a6 6 0 11-12 0 6 6 0 0112 0z"
                />
              </svg>
            }
            title="No team members yet"
            description="Start by inviting team members to collaborate on projects and tasks."
            actionLabel="Invite Member"
            onAction={openInviteModal}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredMembers.map((member) => {
              const progress = getTaskProgress(member);
              const gradient = getGradientFromName(member.displayName);
              const initials = getInitials(member.displayName);

              return (
                <div
                  key={member.uid}
                  className="group bg-[var(--bg-input)] border border-[var(--border-color)] rounded-xl p-6 hover:border-indigo-500/30 hover:bg-[var(--bg-hover)] transition-all duration-200 hover:shadow-lg hover:shadow-indigo-500/10"
                >
                  {/* Header with Avatar */}
                  <div className="flex items-start justify-between mb-4">
                    {/* Avatar & Name */}
                    <div className="flex-1">
                      <div
                        className={`w-16 h-16 rounded-full bg-gradient-to-r ${gradient} flex items-center justify-center mb-3 text-xl font-bold text-[var(--text-primary)] shadow-lg`}
                      >
                        {initials}
                      </div>
                      <h3 className="text-lg font-bold text-[var(--text-primary)] mb-1 truncate">
                        {member.displayName}
                      </h3>
                      <p className="text-sm text-[var(--text-secondary)] truncate mb-3">
                        {member.email}
                      </p>

                      {/* Role Badge */}
                      <div className="mb-3">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getRoleColor(member.role)} transition-colors capitalize`}
                        >
                          {member.role}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Department & Position */}
                  {(member.department || member.position) && (
                    <div className="space-y-1 mb-4 pb-4 border-b border-[var(--border-color)]">
                      {member.department && (
                        <p className="text-xs text-[var(--text-secondary)]">
                          <span className="font-medium text-[var(--text-secondary)]">Department:</span>{' '}
                          {member.department}
                        </p>
                      )}
                      {member.position && (
                        <p className="text-xs text-[var(--text-secondary)]">
                          <span className="font-medium text-[var(--text-secondary)]">Position:</span>{' '}
                          {member.position}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Stats */}
                  <div className="mb-4 pb-4 border-b border-[var(--border-color)]">
                    <div className="space-y-3">
                      {/* Completed Tasks */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-[var(--text-secondary)]">
                            Completed: {member.tasksCompleted}
                          </span>
                        </div>
                        <div className="h-1.5 bg-[var(--bg-input)] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-300"
                            style={{
                              width: `${progress}%`,
                            }}
                          />
                        </div>
                      </div>

                      {/* In Progress Tasks */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-[var(--text-secondary)]">
                            In Progress: {member.tasksInProgress}
                          </span>
                        </div>
                        <div className="h-1.5 bg-[var(--bg-input)] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-300"
                            style={{
                              width: `${Math.round((member.tasksInProgress / (member.tasksCompleted + member.tasksInProgress || 1)) * 100)}%`,
                            }}
                          />
                        </div>
                      </div>

                      {/* Total Tasks */}
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[var(--text-secondary)]">
                          Total: {member.tasksCompleted + member.tasksInProgress}
                        </span>
                        <span className="text-[var(--text-secondary)] font-medium">
                          {progress}% done
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => openEditModal(member)}
                      className="flex-1 px-3 py-2 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 hover:text-indigo-200 rounded-lg font-medium text-sm transition-all duration-200 border border-indigo-500/30 hover:border-indigo-500/50"
                    >
                      Edit Role
                    </button>
                    <button className="flex-1 px-3 py-2 bg-[var(--bg-input)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] rounded-lg font-medium text-sm transition-all duration-200 border border-[var(--border-hover)] hover:border-white/30">
                      View Profile
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Invite Member Modal */}
      <Modal
        isOpen={modalState === 'invite'}
        onClose={closeModal}
        title="Invite Team Member"
        size="md"
      >
        <div className="space-y-4">
          {/* Coming Soon Notice */}
          <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <p className="text-blue-300 text-sm">
              Email invitations are coming soon! For now, you can add members directly or share the project invite link.
            </p>
          </div>

          {/* Email Input */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
              Email Address
            </label>
            <input
              type="email"
              placeholder="user@example.com"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              className="w-full px-4 py-2.5 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:border-indigo-500/50 focus:bg-[var(--bg-input)] transition-all duration-200"
            />
          </div>

          {/* Role Select */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
              Role
            </label>
            <select
              value={inviteRole}
              onChange={(e) =>
                setInviteRole(e.target.value as 'admin' | 'manager' | 'member')
              }
              className="w-full px-4 py-2.5 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-indigo-500/50 transition-all duration-200"
            >
              <option value="member" className="bg-[var(--bg-card-solid)]">
                Member
              </option>
              <option value="manager" className="bg-[var(--bg-card-solid)]">
                Manager
              </option>
              <option value="admin" className="bg-[var(--bg-card-solid)]">
                Admin
              </option>
            </select>
          </div>

          {/* Department Input */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
              Department (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g., Engineering, Design, Marketing"
              value={inviteDepartment}
              onChange={(e) => setInviteDepartment(e.target.value)}
              className="w-full px-4 py-2.5 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:border-indigo-500/50 focus:bg-[var(--bg-input)] transition-all duration-200"
            />
          </div>

          {/* Position Input */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
              Position (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g., Senior Developer, Product Manager"
              value={invitePosition}
              onChange={(e) => setInvitePosition(e.target.value)}
              className="w-full px-4 py-2.5 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:border-indigo-500/50 focus:bg-[var(--bg-input)] transition-all duration-200"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={closeModal}
              className="flex-1 px-4 py-2.5 bg-[var(--bg-input)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] rounded-lg font-medium transition-all duration-200 border border-[var(--border-hover)]"
            >
              Cancel
            </button>
            <button
              onClick={handleInviteSubmit}
              className="flex-1 px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-[var(--text-primary)] rounded-lg font-medium transition-all duration-200"
            >
              Send Invite
            </button>
          </div>
        </div>
      </Modal>

      {/* Edit Member Modal */}
      <Modal
        isOpen={modalState === 'edit'}
        onClose={closeModal}
        title={`Edit ${selectedMember?.displayName}`}
        size="md"
      >
        <div className="space-y-4">
          {/* Email Display */}
          <div className="p-4 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg">
            <p className="text-xs text-[var(--text-secondary)] mb-1">Email</p>
            <p className="text-[var(--text-primary)] font-medium">{selectedMember?.email}</p>
          </div>

          {/* Role Select */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
              Role
            </label>
            <select
              value={editRole}
              onChange={(e) =>
                setEditRole(e.target.value as 'admin' | 'manager' | 'member')
              }
              className="w-full px-4 py-2.5 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-indigo-500/50 transition-all duration-200"
            >
              <option value="member" className="bg-[var(--bg-card-solid)]">
                Member
              </option>
              <option value="manager" className="bg-[var(--bg-card-solid)]">
                Manager
              </option>
              <option value="admin" className="bg-[var(--bg-card-solid)]">
                Admin
              </option>
            </select>
          </div>

          {/* Department Input */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
              Department (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g., Engineering, Design, Marketing"
              value={editDepartment}
              onChange={(e) => setEditDepartment(e.target.value)}
              className="w-full px-4 py-2.5 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:border-indigo-500/50 focus:bg-[var(--bg-input)] transition-all duration-200"
            />
          </div>

          {/* Position Input */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
              Position (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g., Senior Developer, Product Manager"
              value={editPosition}
              onChange={(e) => setEditPosition(e.target.value)}
              className="w-full px-4 py-2.5 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:border-indigo-500/50 focus:bg-[var(--bg-input)] transition-all duration-200"
            />
          </div>

          {/* Task Stats (Read-only) */}
          <div className="p-4 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg">
            <p className="text-xs text-[var(--text-secondary)] mb-3 font-medium">Task Statistics</p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-[var(--text-secondary)]">Completed Tasks:</span>
                <span className="text-[var(--text-primary)] font-medium">
                  {selectedMember?.tasksCompleted || 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-secondary)]">In Progress:</span>
                <span className="text-[var(--text-primary)] font-medium">
                  {selectedMember?.tasksInProgress || 0}
                </span>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={closeModal}
              disabled={editSubmitting}
              className="flex-1 px-4 py-2.5 bg-[var(--bg-input)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] rounded-lg font-medium transition-all duration-200 border border-[var(--border-hover)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={handleEditSubmit}
              disabled={editSubmitting}
              className="flex-1 px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-[var(--text-primary)] rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {editSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
