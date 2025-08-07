import React, { createContext, useContext, useState, useEffect } from 'react';
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
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
  canUsePrompts: () => boolean;
  incrementPromptUsage: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Mock API functions - replace with real API calls
const mockLogin = async (email: string, password: string): Promise<User | null> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Mock validation
  if (email === 'demo@example.com' && password === 'demo123') {
    return {
      id: '1',
      email: 'demo@example.com',
      name: 'Demo User',
      membershipTier: 'pro',
      membershipExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      promptsUsed: 5,
      promptsLimit: 100,
      createdAt: new Date('2024-01-01')
    };
  }
  
  // Check localStorage for existing users
  const users = JSON.parse(localStorage.getItem('veo_users') || '[]');
  const user = users.find((u: any) => u.email === email && u.password === password);
  
  if (user) {
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
  
  return null;
};

const mockSignup = async (email: string, password: string, name: string): Promise<User | null> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Check if user already exists
  const users = JSON.parse(localStorage.getItem('veo_users') || '[]');
  if (users.find((u: any) => u.email === email)) {
    throw new Error('User already exists');
  }
  
  const newUser = {
    id: Date.now().toString(),
    email,
    password, // In real app, this would be hashed
    name,
    membershipTier: 'free' as const,
    promptsUsed: 0,
    promptsLimit: 5,
    createdAt: new Date()
  };
  
  users.push(newUser);
  localStorage.setItem('veo_users', JSON.stringify(users));
  
  const { password: _, ...userWithoutPassword } = newUser;
  return userWithoutPassword;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored user session
    const storedUser = localStorage.getItem('veo_current_user');
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setUser(userData);
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem('veo_current_user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      const userData = await mockLogin(email, password);
      
      if (userData) {
        setUser(userData);
        localStorage.setItem('veo_current_user', JSON.stringify(userData));
        toast.success('Login successful!');
        return true;
      } else {
        toast.error('Invalid email or password');
        return false;
      }
    } catch (error) {
      toast.error('Login failed. Please try again.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (email: string, password: string, name: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      const userData = await mockSignup(email, password, name);
      
      if (userData) {
        setUser(userData);
        localStorage.setItem('veo_current_user', JSON.stringify(userData));
        toast.success('Account created successfully!');
        return true;
      }
      return false;
    } catch (error: any) {
      toast.error(error.message || 'Signup failed. Please try again.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('veo_current_user');
    toast.success('Logged out successfully');
  };

  const updateUser = (updates: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
      localStorage.setItem('veo_current_user', JSON.stringify(updatedUser));
      
      // Update in users list too
      const users = JSON.parse(localStorage.getItem('veo_users') || '[]');
      const userIndex = users.findIndex((u: any) => u.id === user.id);
      if (userIndex !== -1) {
        users[userIndex] = { ...users[userIndex], ...updates };
        localStorage.setItem('veo_users', JSON.stringify(users));
      }
    }
  };

  const canUsePrompts = (): boolean => {
    if (!user) return false;
    return user.promptsUsed < user.promptsLimit;
  };

  const incrementPromptUsage = () => {
    if (user && user.promptsUsed < user.promptsLimit) {
      updateUser({ promptsUsed: user.promptsUsed + 1 });
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