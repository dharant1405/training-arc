import { create } from 'zustand';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

type AuthStatus = 'checking' | 'signedOut' | 'signedIn';

type AuthState = {
  status: AuthStatus;
  session: Session | null;
  user: User | null;
  error: string | null;
  isSubmitting: boolean;
  restoreSession: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<boolean>;
  signUp: (email: string, password: string, warriorName: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  clearError: () => void;
};

export const useAuthStore = create<AuthState>((set) => {
  supabase.auth.onAuthStateChange((_event, session) => {
    set({
      session,
      user: session?.user ?? null,
      status: session ? 'signedIn' : 'signedOut',
    });
  });

  return {
    status: 'checking',
    session: null,
    user: null,
    error: null,
    isSubmitting: false,

    restoreSession: async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        set({ status: 'signedOut', error: error.message });
        return;
      }
      set({
        session: data.session,
        user: data.session?.user ?? null,
        status: data.session ? 'signedIn' : 'signedOut',
      });
    },

    signIn: async (email, password) => {
      set({ isSubmitting: true, error: null });
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        set({ isSubmitting: false, error: error.message });
        return false;
      }
      set({
        isSubmitting: false,
        session: data.session,
        user: data.user,
        status: 'signedIn',
      });
      return true;
    },

    signUp: async (email, password, warriorName) => {
      set({ isSubmitting: true, error: null });
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { warrior_name: warriorName } },
      });
      if (error) {
        set({ isSubmitting: false, error: error.message });
        return false;
      }
      set({
        isSubmitting: false,
        session: data.session,
        user: data.user,
        status: data.session ? 'signedIn' : 'signedOut',
      });
      return true;
    },

    signOut: async () => {
      await supabase.auth.signOut();
      set({ session: null, user: null, status: 'signedOut' });
    },

    clearError: () => set({ error: null }),
  };
});
