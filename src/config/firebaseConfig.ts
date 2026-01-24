import { FirebaseOptions } from 'firebase/app';

/**
 * Carrega e valida as configurações do Firebase
 * Tenta carregar de variáveis de ambiente primeiro, depois de firebase.config.ts como fallback
 * @throws {Error} Se alguma configuração obrigatória estiver faltando
 */
export const getFirebaseConfig = (): FirebaseOptions => {
  // Tentar carregar de variáveis de ambiente primeiro
  let firebaseConfig: FirebaseOptions = {
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

  // Se não encontrou nas variáveis de ambiente, tentar carregar de firebase.config.ts
  const hasAllEnvVars = firebaseConfig.apiKey && 
    firebaseConfig.authDomain && 
    firebaseConfig.projectId && 
    firebaseConfig.storageBucket && 
    firebaseConfig.messagingSenderId && 
    firebaseConfig.appId;

  if (!hasAllEnvVars) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const localConfig = require('./firebase.config');
      if (localConfig && localConfig.firebaseConfig) {
        firebaseConfig = localConfig.firebaseConfig;
      }
    } catch (error) {
      // Arquivo firebase.config.ts não existe, continuar com validação
    }
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
      'Configure as variáveis de ambiente REACT_APP_FIREBASE_* na Vercel ou crie o arquivo ' +
      'src/config/firebase.config.ts (copie de firebase.config.example.ts).'
    );
  }

  return firebaseConfig;
};
