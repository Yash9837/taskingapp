'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from 'firebase/auth';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

interface UserData {
  uid: string;
  email: string;
  displayName: string;
  role: 'admin' | 'manager' | 'member';
  createdAt: string;
  photoURL?: string;
}

interface AuthContextType {
  user: User | null;
  userData: UserData | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  updateProfile: (data: { displayName?: string }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        try {
          const userDocRef = doc(db, 'users', currentUser.uid);
          const userDocSnap = await getDoc(userDocRef);

          if (userDocSnap.exists()) {
            setUserData(userDocSnap.data() as UserData);
          } else {
            // Auto-create user document for existing Firebase Auth users
            // who don't have a Firestore profile yet
            const newUserData: UserData = {
              uid: currentUser.uid,
              email: currentUser.email || '',
              displayName: currentUser.displayName || 'User',
              role: 'member',
              createdAt: new Date().toISOString(),
              photoURL: currentUser.photoURL || undefined,
            };
            await setDoc(userDocRef, newUserData);
            setUserData(newUserData);
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      } else {
        setUserData(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      throw error;
    }
  };

  const signUp = async (email: string, password: string, displayName: string) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      const newUser = result.user;

      // Update profile with display name
      await updateProfile(newUser, { displayName });

      // Create user document in Firestore
      const userDocRef = doc(db, 'users', newUser.uid);
      const userData: UserData = {
        uid: newUser.uid,
        email: newUser.email || '',
        displayName,
        role: 'member',
        createdAt: new Date().toISOString(),
        photoURL: newUser.photoURL || undefined,
      };

      await setDoc(userDocRef, userData);
      setUserData(userData);
    } catch (error) {
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      setUserData(null);
    } catch (error) {
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const newUser = result.user;

      // Check if user exists in Firestore
      const userDocRef = doc(db, 'users', newUser.uid);
      const userDocSnap = await getDoc(userDocRef);

      // If user doesn't exist, create a new document
      if (!userDocSnap.exists()) {
        const newUserData: UserData = {
          uid: newUser.uid,
          email: newUser.email || '',
          displayName: newUser.displayName || 'Google User',
          role: 'member',
          createdAt: new Date().toISOString(),
          photoURL: newUser.photoURL || undefined,
        };

        await setDoc(userDocRef, newUserData);
        setUserData(newUserData);
      } else {
        setUserData(userDocSnap.data() as UserData);
      }
    } catch (error) {
      throw error;
    }
  };

  const handleUpdateProfile = async (data: { displayName?: string }) => {
    if (!user) throw new Error('Not authenticated');
    try {
      if (data.displayName) {
        await updateProfile(user, { displayName: data.displayName });
      }
      const userDocRef = doc(db, 'users', user.uid);
      await setDoc(userDocRef, { ...data }, { merge: true });
      if (userData) {
        setUserData({ ...userData, ...data });
      }
    } catch (error) {
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    userData,
    loading,
    signIn,
    signUp,
    signOut,
    signInWithGoogle,
    updateProfile: handleUpdateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
