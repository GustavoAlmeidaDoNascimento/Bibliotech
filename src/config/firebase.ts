import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getFirebaseConfig } from './firebaseConfig';

const app = initializeApp(getFirebaseConfig());
export const db = getFirestore(app); 