import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut, 
  sendPasswordResetEmail,
  User
} from 'firebase/auth';
import { 
  getFirestore, 
  doc,
  getDoc
} from 'firebase/firestore';
import { getAuthErrorMessage } from '../utils/authErrorMessages';

const firebaseConfig = {
  apiKey: "AIzaSyBaukjjy1nr7HognROeHmdQADjfbvSmu64",
  authDomain: "shoollibsystem.firebaseapp.com",
  projectId: "shoollibsystem",
  storageBucket: "shoollibsystem.firebasestorage.app",
  messagingSenderId: "540876175554",
  appId: "1:540876175554:web:bada4caa3945d1a667a35b",
  measurementId: "G-CQ0JZFYRKC"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Auth services
export const authService = {
  login: async (email: string, password: string): Promise<User> => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      return result.user;
    } catch (error: any) {
      // Log detalhado do erro para diagnóstico
      console.error('Erro de login:', {
        code: error?.code,
        message: error?.message,
        email
      });
      const friendlyMessage = getAuthErrorMessage(error);
      const loginError: any = new Error(friendlyMessage);
      loginError.code = error?.code; // Preserva o código original do Firebase
      loginError.originalError = error;
      throw loginError;
    }
  },

  createUser: async (email: string, password: string): Promise<User> => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      return result.user;
    } catch (error: any) {
      console.error('Erro ao criar usuário:', {
        code: error?.code,
        message: error?.message,
        email
      });
      const friendlyMessage = getAuthErrorMessage(error);
      throw new Error(friendlyMessage);
    }
  },

  logout: async (): Promise<void> => {
    try {
      await signOut(auth);
    } catch (error) {
      const friendlyMessage = getAuthErrorMessage(error);
      throw new Error(friendlyMessage);
    }
  },

  resetPassword: async (email: string): Promise<void> => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      const friendlyMessage = getAuthErrorMessage(error);
      throw new Error(friendlyMessage);
    }
  },
};


// Settings services
export const settingsService = {
  getSchoolName: async (): Promise<string> => {
    try {
      const settingsDoc = await getDoc(doc(db, 'users', 'defaultSettings'));
      
      if (settingsDoc.exists()) {
        const settingsRef = doc(db, 'users', settingsDoc.id, 'settings', 'library');
        const librarySettingsDoc = await getDoc(settingsRef);
        
        if (librarySettingsDoc.exists()) {
          const settings = librarySettingsDoc.data();
          return settings.schoolName || 'School Library System';
        }
      }
      
      return 'School Library System';
    } catch (error) {
      console.error('Erro ao carregar nome da escola:', error);
      return 'School Library System';
    }
  },
}; 