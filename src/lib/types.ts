export interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: 'admin' | 'manager' | 'member';
  createdAt: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'completed' | 'on-hold';
  createdBy: string;
  members: string[]; // user uids
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: 'todo' | 'in-progress' | 'review' | 'done';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignedTo: string; // uid
  assignedBy: string; // uid
  startedAt?: string;
  completedAt?: string;
  dueDate?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Issue {
  id: string;
  projectId: string;
  taskId?: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  reportedBy: string;
  assignedTo?: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
}

export interface Activity {
  id: string;
  projectId: string;
  userId: string;
  action: string; // e.g. "created task", "completed task", "reported issue"
  targetType: 'task' | 'project' | 'issue' | 'member';
  targetId: string;
  targetTitle: string;
  createdAt: string;
}

export interface TeamMember extends User {
  department?: string;
  position?: string;
  tasksCompleted: number;
  tasksInProgress: number;
}
