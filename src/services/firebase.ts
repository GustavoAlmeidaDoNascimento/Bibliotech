import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  signOut, 
  sendPasswordResetEmail,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  User
} from 'firebase/auth';
import { 
  getFirestore, 
  doc,
  getDoc,
  setDoc,
  serverTimestamp
} from 'firebase/firestore';
import { getAuthErrorMessage } from '../utils/authErrorMessages';
import { getFirebaseConfig } from '../config/firebaseConfig';

// Initialize Firebase
const app = initializeApp(getFirebaseConfig());
export const auth = getAuth(app);
export const db = getFirestore(app);

// Auth services
export const authService = {
  login: async (email: string, password: string): Promise<User> => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      return result.user;
    } catch (error) {
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

  signup: async (email: string, password: string): Promise<User> => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      // Criar documento inicial do usuário
      await createUserDocument(result.user.uid);
      return result.user;
    } catch (error) {
      const friendlyMessage = getAuthErrorMessage(error);
      throw new Error(friendlyMessage);
    }
  },

  signInWithGoogle: async (): Promise<User> => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      // Verificar se é um novo usuário e criar documento se necessário
      const userDoc = await getDoc(doc(db, `users/${result.user.uid}/account/subscription`));
      if (!userDoc.exists()) {
        await createUserDocument(result.user.uid);
      }
      return result.user;
    } catch (error) {
      const friendlyMessage = getAuthErrorMessage(error);
      throw new Error(friendlyMessage);
    }
  },
};

// Criar documento inicial do usuário no Firestore
export const createUserDocument = async (userId: string): Promise<void> => {
  try {
    const subscriptionRef = doc(db, `users/${userId}/account/subscription`);
    const subscriptionDoc = await getDoc(subscriptionRef);
    
    // Só cria se não existir
    if (!subscriptionDoc.exists()) {
      await setDoc(subscriptionRef, {
        plan: null,
        status: 'pending',
        createdAt: serverTimestamp(),
      });
    }
  } catch (error) {
    console.error('Erro ao criar documento do usuário:', error);
    throw error;
  }
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