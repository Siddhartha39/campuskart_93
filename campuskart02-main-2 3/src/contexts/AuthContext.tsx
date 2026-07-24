import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, database } from '../config/firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { ref, onValue } from 'firebase/database';
import { User } from '../types';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userData: User | null;
  loading: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let detachUserListener: (() => void) | null = null;
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      // Reset previous listener
      if (detachUserListener) {
        detachUserListener();
        detachUserListener = null;
      }

      if (user) {
        // Admin: do not load profile
        if (user.email === 'admin@campuskart.com') {
          setIsAdmin(true);
          setUserData(null);
          setLoading(false);
          return;
        }

        setIsAdmin(false);
        // Subscribe to profile so we pick it up as soon as it gets created after signup
        const userRef = ref(database, `users/${user.uid}`);
        const off = onValue(userRef, (snapshot) => {
          if (snapshot.exists()) {
            setUserData(snapshot.val());
          } else {
            setUserData(null);
          }
          setLoading(false);
        }, () => {
          // On permission/read error, still clear loading to avoid spinner lock
          setLoading(false);
        });
        detachUserListener = () => off();
      } else {
        setUserData(null);
        setIsAdmin(false);
        setLoading(false);
      }
    });

    return () => {
      unsubscribe();
      if (detachUserListener) detachUserListener();
    };
  }, []);

  const value = {
    currentUser,
    userData,
    loading,
    isAdmin
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};