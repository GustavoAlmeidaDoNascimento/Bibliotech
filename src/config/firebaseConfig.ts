import { FirebaseOptions } from 'firebase/app';

/**
 * Carrega e valida as configurações do Firebase a partir de variáveis de ambiente
 * @throws {Error} Se alguma configuração obrigatória estiver faltando
 */
export const getFirebaseConfig = (): FirebaseOptions => {
  // Usar variáveis de ambiente (compatível com Vercel e outras plataformas)
  const firebaseConfig: FirebaseOptions = {
    apiKey: process.env.REACT_APP_FIREBASE_API_KEY || '',
    authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || '',
    projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || '',
    storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || '',
    appId: process.env.REACT_APP_FIREBASE_APP_ID || '',
  };

  // Adicionar measurementId se estiver definido (opcional)
  if (process.env.REACT_APP_FIREBASE_MEASUREMENT_ID) {
    firebaseConfig.measurementId = process.env.REACT_APP_FIREBASE_MEASUREMENT_ID;
  }

  // Validar configuração obrigatória
  const requiredFields: (keyof FirebaseOptions)[] = [
    'apiKey',
    'authDomain',
    'projectId',
    'storageBucket',
    'messagingSenderId',
    'appId',
  ];

  const missingFields = requiredFields.filter(field => !firebaseConfig[field]);

  if (missingFields.length > 0) {
    throw new Error(
      `Configuração do Firebase incompleta. Campos faltando: ${missingFields.join(', ')}. ` +
      'Configure as variáveis de ambiente REACT_APP_FIREBASE_* na Vercel ou no arquivo .env.local.'
    );
  }

  return firebaseConfig;
};
