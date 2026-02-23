import {
  collection,
  doc,
  addDoc,
  getDocs,
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  QueryConstraint,
} from 'firebase/firestore';
import { db } from './firebase';
import { User, Project, Task, Issue, Activity, TeamMember } from './types';

// ==================== ACTIVITY LOGGING ====================

export async function logActivity(
  projectId: string,
  userId: string,
  action: string,
  targetType: 'task' | 'project' | 'issue' | 'member',
  targetId: string,
  targetTitle: string
): Promise<string> {
  try {
    const activitiesRef = collection(db, 'activities');
    const activity = {
      projectId,
      userId,
      action,
      targetType,
      targetId,
      targetTitle,
      createdAt: new Date().toISOString(),
    };

    const docRef = await addDoc(activitiesRef, activity);
    return docRef.id;
  } catch (error) {
    console.error('Error logging activity:', error);
    throw error;
  }
}

export async function getActivities(
  projectId?: string,
  limitCount: number = 50
): Promise<Activity[]> {
  try {
    const activitiesRef = collection(db, 'activities');
    const constraints: QueryConstraint[] = [
      orderBy('createdAt', 'desc'),
      limit(limitCount),
    ];

    if (projectId) {
      constraints.unshift(where('projectId', '==', projectId));
    }

    const q = query(activitiesRef, ...constraints);
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Activity[];
  } catch (error) {
    console.error('Error getting activities:', error);
    throw error;
  }
}

export async function getActivitiesByProject(projectId: string): Promise<Activity[]> {
  return getActivities(projectId);
}

// ==================== PROJECTS ====================

export async function addProject(
  name: string,
  description: string,
  createdBy: string,
  members: string[] = []
): Promise<string> {
  try {
    const projectsRef = collection(db, 'projects');
    const now = new Date().toISOString();

    const project: Omit<Project, 'id'> = {
      name,
      description,
      status: 'active',
      createdBy,
      members: [createdBy, ...members.filter((m) => m !== createdBy)],
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await addDoc(projectsRef, project);

    // Log activity
    await logActivity(
      docRef.id,
      createdBy,
      'created project',
      'project',
      docRef.id,
      name
    );

    return docRef.id;
  } catch (error) {
    console.error('Error adding project:', error);
    throw error;
  }
}

export async function getProjects(userUid?: string): Promise<Project[]> {
  try {
    const projectsRef = collection(db, 'projects');
    const constraints: QueryConstraint[] = [orderBy('createdAt', 'desc')];

    if (userUid) {
      constraints.unshift(where('members', 'array-contains', userUid));
    }

    const q = query(projectsRef, ...constraints);
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Project[];
  } catch (error) {
    console.error('Error getting projects:', error);
    throw error;
  }
}

export async function getProject(projectId: string): Promise<Project | null> {
  try {
    const projectRef = doc(db, 'projects', projectId);
    const snapshot = await getDoc(projectRef);

    if (!snapshot.exists()) {
      return null;
    }

    return {
      id: snapshot.id,
      ...snapshot.data(),
    } as Project;
  } catch (error) {
    console.error('Error getting project:', error);
    throw error;
  }
}

export async function updateProject(
  projectId: string,
  updates: Partial<Omit<Project, 'id' | 'createdAt' | 'createdBy'>>
): Promise<void> {
  try {
    const projectRef = doc(db, 'projects', projectId);
    const updateData = {
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    await updateDoc(projectRef, updateData);
  } catch (error) {
    console.error('Error updating project:', error);
    throw error;
  }
}

export async function deleteProject(projectId: string): Promise<void> {
  try {
    const projectRef = doc(db, 'projects', projectId);
    await deleteDoc(projectRef);
  } catch (error) {
    console.error('Error deleting project:', error);
    throw error;
  }
}

// ==================== TASKS ====================

export async function addTask(
  projectId: string,
  title: string,
  description: string,
  assignedTo: string,
  assignedBy: string,
  priority: 'low' | 'medium' | 'high' | 'urgent' = 'medium',
  dueDate?: string,
  tags: string[] = []
): Promise<string> {
  try {
    const tasksRef = collection(db, 'tasks');
    const now = new Date().toISOString();

    const task: Omit<Task, 'id'> = {
      projectId,
      title,
      description,
      status: 'todo',
      priority,
      assignedTo,
      assignedBy,
      dueDate,
      tags,
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await addDoc(tasksRef, task);

    // Log activity
    await logActivity(
      projectId,
      assignedBy,
      'created task',
      'task',
      docRef.id,
      title
    );

    return docRef.id;
  } catch (error) {
    console.error('Error adding task:', error);
    throw error;
  }
}

export async function getTasks(): Promise<Task[]> {
  try {
    const tasksRef = collection(db, 'tasks');
    const q = query(tasksRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Task[];
  } catch (error) {
    console.error('Error getting tasks:', error);
    throw error;
  }
}

export async function getTasksByProject(projectId: string): Promise<Task[]> {
  try {
    const tasksRef = collection(db, 'tasks');
    const q = query(
      tasksRef,
      where('projectId', '==', projectId),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Task[];
  } catch (error) {
    console.error('Error getting tasks by project:', error);
    throw error;
  }
}

export async function getTasksByUser(userUid: string): Promise<Task[]> {
  try {
    const tasksRef = collection(db, 'tasks');
    const q = query(
      tasksRef,
      where('assignedTo', '==', userUid),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Task[];
  } catch (error) {
    console.error('Error getting tasks by user:', error);
    throw error;
  }
}

export async function updateTask(
  taskId: string,
  projectId: string,
  updates: Partial<Omit<Task, 'id' | 'projectId' | 'createdAt'>>,
  userId?: string
): Promise<void> {
  try {
    const taskRef = doc(db, 'tasks', taskId);
    const updateData = {
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    // If task is being marked as done, set completedAt
    if (updates.status === 'done' && !updates.completedAt) {
      updateData.completedAt = new Date().toISOString();
    }

    // If task is being started, set startedAt
    if (
      updates.status === 'in-progress' &&
      !updates.startedAt &&
      updateData.startedAt === undefined
    ) {
      updateData.startedAt = new Date().toISOString();
    }

    await updateDoc(taskRef, updateData);

    // Log activity if userId is provided
    if (userId) {
      const taskData = await getDoc(taskRef);
      if (taskData.exists()) {
        const task = taskData.data() as Task;
        await logActivity(
          projectId,
          userId,
          `updated task status to ${updates.status || 'unknown'}`,
          'task',
          taskId,
          task.title
        );
      }
    }
  } catch (error) {
    console.error('Error updating task:', error);
    throw error;
  }
}

export async function deleteTask(taskId: string): Promise<void> {
  try {
    const taskRef = doc(db, 'tasks', taskId);
    await deleteDoc(taskRef);
  } catch (error) {
    console.error('Error deleting task:', error);
    throw error;
  }
}

// ==================== ISSUES ====================

export async function addIssue(
  projectId: string,
  title: string,
  description: string,
  severity: 'low' | 'medium' | 'high' | 'critical',
  reportedBy: string,
  taskId?: string,
  assignedTo?: string
): Promise<string> {
  try {
    const issuesRef = collection(db, 'issues');
    const now = new Date().toISOString();

    const issue: Omit<Issue, 'id'> = {
      projectId,
      taskId,
      title,
      description,
      severity,
      status: 'open',
      reportedBy,
      assignedTo,
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await addDoc(issuesRef, issue);

    // Log activity
    await logActivity(
      projectId,
      reportedBy,
      'reported issue',
      'issue',
      docRef.id,
      title
    );

    return docRef.id;
  } catch (error) {
    console.error('Error adding issue:', error);
    throw error;
  }
}

export async function getIssues(): Promise<Issue[]> {
  try {
    const issuesRef = collection(db, 'issues');
    const q = query(issuesRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Issue[];
  } catch (error) {
    console.error('Error getting issues:', error);
    throw error;
  }
}

export async function getIssuesByProject(projectId: string): Promise<Issue[]> {
  try {
    const issuesRef = collection(db, 'issues');
    const q = query(
      issuesRef,
      where('projectId', '==', projectId),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Issue[];
  } catch (error) {
    console.error('Error getting issues by project:', error);
    throw error;
  }
}

export async function updateIssue(
  issueId: string,
  projectId: string,
  updates: Partial<Omit<Issue, 'id' | 'projectId' | 'createdAt'>>,
  userId?: string
): Promise<void> {
  try {
    const issueRef = doc(db, 'issues', issueId);
    const updateData = {
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    // If issue is being resolved/closed, set resolvedAt
    if (
      (updates.status === 'resolved' || updates.status === 'closed') &&
      !updates.resolvedAt
    ) {
      updateData.resolvedAt = new Date().toISOString();
    }

    await updateDoc(issueRef, updateData);

    // Log activity if userId is provided
    if (userId) {
      const issueData = await getDoc(issueRef);
      if (issueData.exists()) {
        const issue = issueData.data() as Issue;
        await logActivity(
          projectId,
          userId,
          `updated issue status to ${updates.status || 'unknown'}`,
          'issue',
          issueId,
          issue.title
        );
      }
    }
  } catch (error) {
    console.error('Error updating issue:', error);
    throw error;
  }
}

export async function deleteIssue(issueId: string): Promise<void> {
  try {
    const issueRef = doc(db, 'issues', issueId);
    await deleteDoc(issueRef);
  } catch (error) {
    console.error('Error deleting issue:', error);
    throw error;
  }
}

// ==================== TEAM MEMBERS ====================

export async function getTeamMembers(projectId: string): Promise<TeamMember[]> {
  try {
    const projectRef = doc(db, 'projects', projectId);
    const projectSnapshot = await getDoc(projectRef);

    if (!projectSnapshot.exists()) {
      return [];
    }

    const project = projectSnapshot.data() as Project;
    const memberIds = project.members;

    // Fetch user documents for each member
    const teamMembers: TeamMember[] = [];

    for (const uid of memberIds) {
      const userRef = doc(db, 'users', uid);
      const userSnapshot = await getDoc(userRef);

      if (userSnapshot.exists()) {
        const userData = userSnapshot.data() as User;

        // Get task stats for this user in the project
        const tasksRef = collection(db, 'tasks');
        const completedQuery = query(
          tasksRef,
          where('projectId', '==', projectId),
          where('assignedTo', '==', uid),
          where('status', '==', 'done')
        );
        const inProgressQuery = query(
          tasksRef,
          where('projectId', '==', projectId),
          where('assignedTo', '==', uid),
          where('status', '==', 'in-progress')
        );

        const completedSnapshot = await getDocs(completedQuery);
        const inProgressSnapshot = await getDocs(inProgressQuery);

        teamMembers.push({
          ...userData,
          tasksCompleted: completedSnapshot.size,
          tasksInProgress: inProgressSnapshot.size,
        } as TeamMember);
      }
    }

    return teamMembers;
  } catch (error) {
    console.error('Error getting team members:', error);
    throw error;
  }
}

export async function updateMemberProfile(
  uid: string,
  updates: Partial<Omit<TeamMember, 'uid' | 'createdAt'>>
): Promise<void> {
  try {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, updates);
  } catch (error) {
    console.error('Error updating member profile:', error);
    throw error;
  }
}

export async function getAllUsers(): Promise<TeamMember[]> {
  try {
    const usersRef = collection(db, 'users');
    const usersSnap = await getDocs(usersRef);
    return usersSnap.docs.map((doc) => ({
      uid: doc.id,
      ...doc.data(),
      tasksCompleted: 0,
      tasksInProgress: 0,
    })) as TeamMember[];
  } catch (error) {
    console.error('Error getting all users:', error);
    throw error;
  }
}

