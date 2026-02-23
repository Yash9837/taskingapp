// Role-Based Access Control (RBAC) utilities

export type UserRole = 'admin' | 'manager' | 'member';

// ==================== Permission Checks ====================

export function canCreateProject(role: UserRole): boolean {
    return role === 'admin' || role === 'manager';
}

export function canEditProject(role: UserRole): boolean {
    return role === 'admin' || role === 'manager';
}

export function canDeleteProject(role: UserRole): boolean {
    return role === 'admin' || role === 'manager';
}

export function canCreateTask(role: UserRole): boolean {
    return role === 'admin' || role === 'manager';
}

export function canDeleteTask(role: UserRole): boolean {
    return role === 'admin' || role === 'manager';
}

export function canEditTask(role: UserRole): boolean {
    return role === 'admin' || role === 'manager';
}

/** Members can only update the status of their own tasks */
export function canUpdateTaskStatus(role: UserRole): boolean {
    return true; // all roles can update status on assigned tasks
}

export function canViewTeam(role: UserRole): boolean {
    return role === 'admin' || role === 'manager';
}

export function canManageUsers(role: UserRole): boolean {
    return role === 'admin';
}

export function canAccessFullSettings(role: UserRole): boolean {
    return role === 'admin';
}

// ==================== Navigation Filtering ====================

export interface NavItem {
    name: string;
    href: string;
    icon: string;
}

const allNavItems: NavItem[] = [
    { name: 'Dashboard', href: '/dashboard', icon: 'dashboard' },
    { name: 'Projects', href: '/projects', icon: 'projects' },
    { name: 'Tasks', href: '/tasks', icon: 'tasks' },
    { name: 'Calendar', href: '/calendar', icon: 'calendar' },
    { name: 'Team', href: '/team', icon: 'team' },
    { name: 'Issues', href: '/issues', icon: 'issues' },
    { name: 'Activity', href: '/activity', icon: 'activity' },
];

const allBottomNavItems: NavItem[] = [
    { name: 'Settings', href: '/settings', icon: 'settings' },
];

export function getNavItemsForRole(role: UserRole): NavItem[] {
    if (role === 'admin') return allNavItems;
    if (role === 'manager') return allNavItems; // managers see everything in nav
    // members: hide Team
    return allNavItems.filter(item => item.name !== 'Team');
}

export function getBottomNavItemsForRole(role: UserRole): NavItem[] {
    // Settings is accessible to all for profile/theme, but admin gets extra user mgmt section
    return allBottomNavItems;
}

// ==================== Role Display ====================

export function getRoleLabel(role: UserRole): string {
    const labels: Record<UserRole, string> = {
        admin: 'Admin',
        manager: 'Manager',
        member: 'Member',
    };
    return labels[role] || 'Member';
}

export function getRoleBadgeColor(role: UserRole): { bg: string; text: string } {
    const colors: Record<UserRole, { bg: string; text: string }> = {
        admin: { bg: 'bg-red-500/20', text: 'text-red-400' },
        manager: { bg: 'bg-amber-500/20', text: 'text-amber-400' },
        member: { bg: 'bg-blue-500/20', text: 'text-blue-400' },
    };
    return colors[role] || colors.member;
}
