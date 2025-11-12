import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { Profile } from '../types';
import { getSession, getUserProfile, signOutUser } from '../services/api';
import { supabase } from '../services/supabaseClient';
import { isDatabaseSetupError } from '../services/errorUtils';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  dbSetupError: boolean;
  logout: () => Promise<void>;
  isAuthModalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [dbSetupError, setDbSetupError] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  useEffect(() => {
    const fetchSessionAndProfile = async (sessionToProcess: Session) => {
        try {
            const userProfile = await getUserProfile(sessionToProcess.user.id);
            setProfile(userProfile);
            setDbSetupError(false); // Clear error on success
        } catch (error) {
            console.error("AuthProvider failed to get user profile:", error);
            if (isDatabaseSetupError(error)) {
                setDbSetupError(true);
            }
            setProfile(null);
        }
    }

    const fetchInitialSession = async () => {
      try {
        setLoading(true);
        const currentSession = await getSession();
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        if (currentSession?.user) {
            await fetchSessionAndProfile(currentSession);
        }
      } catch (error) {
        console.error("Error fetching session:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchInitialSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        // No need to set loading to true here, causes flicker.
        // Let the main loading state handle the initial load.
        await fetchSessionAndProfile(session);
      } else {
        setProfile(null);
      }
      // Only stop loading after the first auth state has been determined.
      if (loading) setLoading(false);
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);
  
  const logout = async () => {
    await signOutUser();
    setSession(null);
    setUser(null);
    setProfile(null);
  };

  const openAuthModal = () => setIsAuthModalOpen(true);
  const closeAuthModal = () => setIsAuthModalOpen(false);

  const value = {
    session,
    user,
    profile,
    loading,
    dbSetupError,
    logout,
    isAuthModalOpen,
    openAuthModal,
    closeAuthModal,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};