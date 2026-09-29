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
  // True only while the current session came from a password-recovery deep
  // link (Supabase's PASSWORD_RECOVERY event), not a normal sign-in. Lets
  // the reset-password screen distinguish "user tapped a valid recovery
  // link" from "user is just already logged in." Cleared on the next normal
  // sign-in/sign-out so it never lingers.
  isPasswordRecovery: boolean;
  restoreSession: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<boolean>;
  signUp: (email: string, password: string, warriorName: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  clearError: () => void;
};

export const useAuthStore = create<AuthState>((set) => {
  supabase.auth.onAuthStateChange((event, session) => {
    if (__DEV__ && event === 'PASSWORD_RECOVERY') {
      console.log('[AUTH-RESET] recovery session available');
    }
    set({
      session,
      user: session?.user ?? null,
      status: session ? 'signedIn' : 'signedOut',
      isPasswordRecovery: event === 'PASSWORD_RECOVERY',
    });
  });

  return {
    status: 'checking',
    session: null,
    user: null,
    error: null,
    isSubmitting: false,
    isPasswordRecovery: false,

    restoreSession: async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          if (__DEV__) console.log(`[AUTH-DEBUG] restoreSession error message="${error.message}"`);
          set({ status: 'signedOut', error: error.message });
          return;
        }
        if (__DEV__) console.log(`[AUTH-DEBUG] restoreSession session=${Boolean(data.session)}`);
        set({
          session: data.session,
          user: data.session?.user ?? null,
          status: data.session ? 'signedIn' : 'signedOut',
        });
      } catch (err) {
        // getSession() can throw (not just return {error}) if the underlying
        // storage read fails — e.g. a corrupted SecureStore entry. Without
        // this catch, status would stay 'checking' forever and the splash
        // screen would never navigate anywhere.
        if (__DEV__) {
          console.log(
            `[AUTH-DEBUG] restoreSession threw: ${err instanceof Error ? err.message : String(err)}`
          );
        }
        set({ status: 'signedOut' });
      }
    },

    signIn: async (email, password) => {
      set({ isSubmitting: true, error: null });
      if (__DEV__) {
        console.log(`[AUTH-DEBUG] normalized email=${email}`);
        console.log(`[AUTH-DEBUG] signIn started (password length=${password.length})`);
      }
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (__DEV__) console.log(`[AUTH-DEBUG] signIn response received`);
      if (error) {
        if (__DEV__) {
          console.log(`[AUTH-DEBUG] error code=${error.code}`);
          console.log(`[AUTH-DEBUG] error message=${error.message}`);
          console.log(`[AUTH-DEBUG] session=false`);
        }
        set({ isSubmitting: false, error: error.message });
        return false;
      }
      if (__DEV__) console.log(`[AUTH-DEBUG] session=${Boolean(data.session)}`);
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
      if (__DEV__) {
        console.log(`[AUTH-DEBUG] normalized email=${email}`);
        console.log(`[AUTH-DEBUG] signUp started (password length=${password.length})`);
      }
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { warrior_name: warriorName } },
      });
      if (__DEV__) console.log(`[AUTH-DEBUG] signUp response received`);
      if (error) {
        if (__DEV__) {
          console.log(`[AUTH-DEBUG] error code=${error.code}`);
          console.log(`[AUTH-DEBUG] error message=${error.message}`);
          console.log(`[AUTH-DEBUG] session=false`);
        }
        set({ isSubmitting: false, error: error.message });
        return false;
      }
      if (__DEV__) console.log(`[AUTH-DEBUG] session=${Boolean(data.session)}`);
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
