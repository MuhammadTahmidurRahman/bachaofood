import React, { createContext, useContext, useState, useEffect } from 'react';
import { authHelpers } from '../lib/supabase';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check active sessions
    authHelpers.getCurrentUser().then(user => {
      setUser(user);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = authHelpers.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email, password, userData) => {
    const { data, error } = await authHelpers.signUp(email, password, userData);
    return { data, error };
  };

  const signIn = async (email, password) => {
    const { data, error } = await authHelpers.signIn(email, password);
    return { data, error };
  };

  const signOut = async () => {
    const { error } = await authHelpers.signOut();
    if (!error) setUser(null);
    return { error };
  };

  const value = {
    user,
    loading,
    signUp,
    signIn,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
