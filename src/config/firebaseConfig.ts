<<<<<<< Current (Your changes)
=======
import { FirebaseOptions } from 'firebase/app';
import { firebaseConfig } from './firebase.config';

/**
 * Carrega e valida as configurações do Firebase a partir do arquivo firebase.config.ts
 * @throws {Error} Se alguma configuração obrigatória estiver faltando ou se o arquivo não existir
 */
export const getFirebaseConfig = (): FirebaseOptions => {
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
      'Copie src/config/firebase.config.example.ts para src/config/firebase.config.ts e preencha com suas credenciais reais.'
    );
  }

  return firebaseConfig;
};

>>>>>>> Incoming (Background Agent changes)
