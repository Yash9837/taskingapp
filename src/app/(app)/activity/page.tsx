'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import EmptyState from '@/components/EmptyState';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useAuth } from '@/contexts/AuthContext';
import { getActivities, getProjects } from '@/lib/firestore';
import { Activity, Project } from '@/lib/types';

// Helper function for relative time formatting
function getRelativeTime(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return 'Just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// Helper function for date grouping label
function getDateGroupLabel(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);

  const isToday = date.toDateString() === now.toDateString();
  const isYesterday = date.toDateString() === yesterday.toDateString();

  if (isToday) return 'Today';
  if (isYesterday) return 'Yesterday';

  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
}

// Helper function to group activities by date
function groupActivitiesByDate(activities: Activity[]): Record<string, Activity[]> {
  const grouped: Record<string, Activity[]> = {};

  activities.forEach((activity) => {
    const date = new Date(activity.createdAt).toDateString();
    if (!grouped[date]) {
      grouped[date] = [];
    }
    grouped[date].push(activity);
  });

  return grouped;
}

// Icon components for different action types
function getActionIcon(targetType: string): React.ReactNode {
  switch (targetType) {
    case 'task':
      return (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    case 'project':
      return (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
        </svg>
      );
    case 'issue':
      return (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    case 'member':
      return (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 12a4 4 0 100-8 4 4 0 000 8zm0 2c-2.667 0-8 1.337-8 4v2h16v-2c0-2.663-5.333-4-8-4z" />
        </svg>
      );
    default:
      return (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
  }
}

// Badge component for target type
function TargetTypeBadge({ type }: { type: string }) {
  const colors: Record<string, string> = {
    task: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    project: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    issue: 'bg-red-500/20 text-red-300 border-red-500/30',
    member: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  };

  return (
    <span className={`inline-block px-2.5 py-1 text-xs font-medium rounded border ${colors[type] || 'bg-gray-500/20 text-gray-300 border-gray-500/30'}`}>
      {type.charAt(0).toUpperCase() + type.slice(1)}
    </span>
  );
}

export default function ActivityPage() {
  const { userData } = useAuth();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [displayCount, setDisplayCount] = useState(20);

  // Filters
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [selectedActionType, setSelectedActionType] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [activitiesData, projectsData] = await Promise.all([
          getActivities(undefined, 100),
          getProjects(userData?.uid),
        ]);
        setActivities(activitiesData);
        setProjects(projectsData);
      } catch (error) {
        console.error('Error fetching activity data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (userData?.uid) {
      fetchData();
    }
  }, [userData?.uid]);

  // Filter activities
  let filteredActivities = activities;

  if (selectedProject !== 'all') {
    filteredActivities = filteredActivities.filter((a) => a.projectId === selectedProject);
  }

  if (selectedActionType !== 'all') {
    filteredActivities = filteredActivities.filter((a) => a.targetType === selectedActionType);
  }

  if (startDate) {
    const start = new Date(startDate);
    filteredActivities = filteredActivities.filter((a) => new Date(a.createdAt) >= start);
  }

  if (endDate) {
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    filteredActivities = filteredActivities.filter((a) => new Date(a.createdAt) <= end);
  }

  const displayedActivities = filteredActivities.slice(0, displayCount);
  const groupedActivities = groupActivitiesByDate(displayedActivities);
  const dateKeys = Object.keys(groupedActivities).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  // Empty state icon
  const emptyIcon = (
    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)]">
        <Header title="Activity Log" userName={userData?.displayName || 'User'} />
        <div className="flex items-center justify-center py-32">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <Header title="Activity Log" userName={userData?.displayName || 'User'} />

      <main className="max-w-5xl mx-auto px-8 py-8">
        {/* Filter Bar */}
        <div className="bg-[var(--bg-card-solid)] border border-[var(--border-color)] rounded-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Project Filter */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Project</label>
              <select
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                className="w-full px-4 py-2.5 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:border-indigo-500/50 focus:bg-[var(--bg-input)] transition-all duration-200"
              >
                <option value="all">All Projects</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Action Type Filter */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Action Type</label>
              <select
                value={selectedActionType}
                onChange={(e) => setSelectedActionType(e.target.value)}
                className="w-full px-4 py-2.5 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:border-indigo-500/50 focus:bg-[var(--bg-input)] transition-all duration-200"
              >
                <option value="all">All Types</option>
                <option value="task">Tasks</option>
                <option value="project">Projects</option>
                <option value="issue">Issues</option>
                <option value="member">Members</option>
              </select>
            </div>

            {/* Start Date Filter */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">From</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-2.5 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:border-indigo-500/50 focus:bg-[var(--bg-input)] transition-all duration-200"
              />
            </div>

            {/* End Date Filter */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">To</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-4 py-2.5 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:border-indigo-500/50 focus:bg-[var(--bg-input)] transition-all duration-200"
              />
            </div>
          </div>

          {/* Clear Filters Button */}
          {(selectedProject !== 'all' || selectedActionType !== 'all' || startDate || endDate) && (
            <button
              onClick={() => {
                setSelectedProject('all');
                setSelectedActionType('all');
                setStartDate('');
                setEndDate('');
              }}
              className="mt-4 text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              Clear filters
            </button>
          )}
        </div>

        {/* Timeline View */}
        {filteredActivities.length === 0 ? (
          <EmptyState
            icon={emptyIcon}
            title="No activities found"
            description="There are no activities matching your filters. Try adjusting your criteria."
          />
        ) : (
          <div className="relative">
            {/* Vertical Timeline Line */}
            <div className="absolute left-[11px] top-0 bottom-0 w-0.5 bg-gradient-to-b from-indigo-500/50 via-indigo-500/30 to-transparent"></div>

            {/* Timeline Events */}
            <div className="space-y-8">
              {dateKeys.map((dateKey) => (
                <div key={dateKey}>
                  {/* Date Group Header */}
                  <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-4 ml-12">
                    {getDateGroupLabel(dateKey)}
                  </h3>

                  {/* Activity Cards for this date */}
                  <div className="space-y-4">
                    {groupedActivities[dateKey].map((activity) => (
                      <div key={activity.id} className="relative pl-12">
                        {/* Timeline Dot */}
                        <div className="absolute left-0 top-2 w-6 h-6 bg-[var(--bg-primary)] border-2 border-indigo-500 rounded-full flex items-center justify-center">
                          <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                        </div>

                        {/* Activity Card */}
                        <div className="bg-[var(--bg-card-solid)] border border-[var(--border-color)] rounded-lg p-5 hover:border-indigo-500/50 hover:shadow-lg hover:shadow-indigo-500/20 transition-all duration-200 group">
                          <div className="flex items-start justify-between gap-4">
                            {/* Left Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3 mb-2">
                                {/* Action Icon */}
                                <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center flex-shrink-0 text-indigo-400 group-hover:bg-indigo-500/30 transition-colors">
                                  {getActionIcon(activity.targetType)}
                                </div>

                                {/* User and Action */}
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-semibold text-[var(--text-primary)]">
                                    {activity.targetTitle}
                                  </p>
                                  <p className="text-xs text-[var(--text-tertiary)] truncate">
                                    {activity.action}
                                  </p>
                                </div>
                              </div>

                              {/* Target Type Badge */}
                              <div className="flex items-center gap-2 mt-3">
                                <TargetTypeBadge type={activity.targetType} />
                              </div>
                            </div>

                            {/* Right Content - Time */}
                            <div className="flex flex-col items-end gap-1 flex-shrink-0">
                              <time className="text-xs font-medium text-indigo-400 whitespace-nowrap">
                                {getRelativeTime(activity.createdAt)}
                              </time>
                              <time className="text-xs text-[var(--text-tertiary)] whitespace-nowrap">
                                {new Date(activity.createdAt).toLocaleTimeString('en-US', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  hour12: true,
                                })}
                              </time>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Load More Button */}
            {displayCount < filteredActivities.length && (
              <div className="flex justify-center mt-12">
                <button
                  onClick={() => setDisplayCount((prev) => prev + 20)}
                  className="px-8 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-[var(--text-primary)] rounded-lg font-medium transition-all duration-200 hover:shadow-lg hover:shadow-indigo-500/30"
                >
                  Load More Activities
                </button>
              </div>
            )}

            {/* Load More Status */}
            {displayCount >= filteredActivities.length && filteredActivities.length > 0 && (
              <div className="flex justify-center mt-12">
                <p className="text-sm text-[var(--text-tertiary)]">
                  Showing all {filteredActivities.length} activit{filteredActivities.length !== 1 ? 'ies' : 'y'}
                </p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
