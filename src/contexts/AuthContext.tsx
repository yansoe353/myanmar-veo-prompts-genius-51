import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { User as SupabaseUser, Session } from '@supabase/supabase-js';
import { toast } from 'sonner';

export interface User {
  id: string;
  email: string;
  name: string;
  membershipTier: 'free' | 'pro' | 'premium';
  membershipExpiry?: Date;
  promptsUsed: number;
  promptsLimit: number;
  createdAt: Date;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (email: string, password: string, name: string) => Promise<boolean>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<User>) => Promise<void>;
  canUsePrompts: () => boolean;
  incrementPromptUsage: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Convert Supabase profile to User type
  const convertProfile = (profile: any): User => ({
    id: profile.id,
    email: profile.email,
    name: profile.name,
    membershipTier: profile.membership_tier,
    membershipExpiry: profile.membership_expiry ? new Date(profile.membership_expiry) : undefined,
    promptsUsed: profile.prompts_used,
    promptsLimit: profile.prompts_limit,
    createdAt: new Date(profile.created_at)
  });

  // Fetch user profile from Supabase
  const fetchUserProfile = async (userId: string) => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        return null;
      }

      return convertProfile(profile);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  };

  // Initialize auth state
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchUserProfile(session.user.id).then(setUser);
      }
      setIsLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          const profile = await fetchUserProfile(session.user.id);
          setUser(profile);
        } else {
          setUser(null);
        }
        setIsLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast.error(error.message);
        return false;
      }

      if (data.user) {
        const profile = await fetchUserProfile(data.user.id);
        setUser(profile);
        toast.success('Login successful!');
        return true;
      }

      return false;
    } catch (error: any) {
      toast.error('Login failed. Please try again.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (email: string, password: string, name: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name,
          },
        },
      });

      if (error) {
        toast.error(error.message);
        return false;
      }

      if (data.user) {
        // Profile will be created automatically by the trigger
        toast.success('Account created successfully!');
        return true;
      }

      return false;
    } catch (error: any) {
      toast.error('Signup failed. Please try again.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        toast.error('Error logging out');
      } else {
        setUser(null);
        toast.success('Logged out successfully');
      }
    } catch (error) {
      toast.error('Error logging out');
    }
  };

  const updateUser = async (updates: Partial<User>) => {
    if (!user) return;

    try {
      const updateData: any = {};
      
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.membershipTier !== undefined) updateData.membership_tier = updates.membershipTier;
      if (updates.membershipExpiry !== undefined) updateData.membership_expiry = updates.membershipExpiry?.toISOString();
      if (updates.promptsUsed !== undefined) updateData.prompts_used = updates.promptsUsed;
      if (updates.promptsLimit !== undefined) updateData.prompts_limit = updates.promptsLimit;

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id);

      if (error) {
        console.error('Error updating profile:', error);
        toast.error('Failed to update profile');
        return;
      }

      // Update local state
      setUser(prev => prev ? { ...prev, ...updates } : null);
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error('Failed to update profile');
    }
  };

  const canUsePrompts = (): boolean => {
    if (!user) return false;
    return user.promptsUsed < user.promptsLimit;
  };

  const incrementPromptUsage = async () => {
    if (!user || user.promptsUsed >= user.promptsLimit) return;

    try {
      const newUsage = user.promptsUsed + 1;
      
      const { error } = await supabase
        .from('profiles')
        .update({ prompts_used: newUsage })
        .eq('id', user.id);

      if (error) {
        console.error('Error updating prompt usage:', error);
        return;
      }

      setUser(prev => prev ? { ...prev, promptsUsed: newUsage } : null);
    } catch (error) {
      console.error('Error incrementing prompt usage:', error);
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    login,
    signup,
    logout,
    updateUser,
    canUsePrompts,
    incrementPromptUsage
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};