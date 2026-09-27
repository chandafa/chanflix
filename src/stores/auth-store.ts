import { create } from 'zustand';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  GoogleAuthProvider, 
  signInWithPopup,
  signOut as firebaseSignOut,
  updateProfile,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { FirebaseError } from 'firebase/app';

interface AuthState {
  user: User | null;
  loading: boolean;
  initialized: boolean;
  error: string | null;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, name?: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  initAuth: () => () => void;
}

const mapFirebaseErrorToIndonesian = (errorCode: string): string => {
  switch (errorCode) {
    case 'auth/user-not-found':
      return 'Email tidak terdaftar';
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Kata sandi salah';
    case 'auth/email-already-in-use':
      return 'Email sudah digunakan';
    case 'auth/weak-password':
      return 'Kata sandi terlalu lemah (minimal 6 karakter)';
    case 'auth/invalid-email':
      return 'Format email tidak valid';
    case 'auth/too-many-requests':
      return 'Terlalu banyak percobaan, coba lagi nanti';
    case 'auth/popup-closed-by-user':
      return 'Jendela Google ditutup sebelum masuk selesai';
    default:
      return 'Terjadi kesalahan, silakan coba lagi';
  }
};

const messageFromError = (error: unknown) => mapFirebaseErrorToIndonesian(error instanceof FirebaseError ? error.code : '');

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  initialized: false,
  error: null,
  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),

  signInWithEmail: async (email: string, password: string) => {
    set({ loading: true, error: null });
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      set({ user: result.user, loading: false, error: null });
    } catch (error: unknown) {
      const errorMessage = messageFromError(error);
      set({ error: errorMessage, loading: false });
      throw error; // Re-throw so caller knows about failure
    }
  },

  signUpWithEmail: async (email: string, password: string, name?: string) => {
    set({ loading: true, error: null });
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      if (name) {
        await updateProfile(result.user, { displayName: name });
      }
      set({ user: result.user, loading: false, error: null });
    } catch (error: unknown) {
      const errorMessage = messageFromError(error);
      set({ error: errorMessage, loading: false });
      throw error; // Re-throw so caller knows about failure
    }
  },

  signInWithGoogle: async () => {
    set({ loading: true, error: null });
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      set({ user: result.user, loading: false, error: null });
    } catch (error: unknown) {
      const errorMessage = messageFromError(error);
      set({ error: errorMessage, loading: false });
      throw error; // Re-throw so caller knows about failure
    }
  },

  signOut: async () => {
    set({ loading: true });
    try {
      await firebaseSignOut(auth);
      set({ user: null, loading: false, error: null });
    } catch (error: unknown) {
      set({ error: 'Gagal keluar dari akun', loading: false });
      throw error;
    }
  },

  initAuth: () => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      set({ user: firebaseUser, loading: false, initialized: true });
    });
    return unsubscribe;
  },
}));
