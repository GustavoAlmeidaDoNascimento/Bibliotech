import { loadStripe, Stripe } from '@stripe/stripe-js';
import { getStripeConfig } from '../config/stripeConfig';

let stripePromise: Promise<Stripe | null> | null = null;

/**
 * Inicializa e retorna uma instância do Stripe
 */
export const getStripe = async (): Promise<Stripe | null> => {
  if (!stripePromise) {
    const { publishableKey } = getStripeConfig();
    stripePromise = loadStripe(publishableKey);
  }
  return stripePromise;
};

/**
 * Obtém a URL base da Cloud Function baseado no ambiente
 */
const getCloudFunctionUrl = (functionName: string): string => {
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  if (isDevelopment) {
    // Para desenvolvimento local com emulador
    // Use: firebase emulators:start --only functions
    const emulatorUrl = process.env.REACT_APP_FIREBASE_FUNCTIONS_EMULATOR_URL;
    if (emulatorUrl) {
      return `${emulatorUrl}/${functionName}`;
    }
    // Se não estiver usando emulador, usar produção mesmo
    console.warn('⚠️ Usando Cloud Function de produção. Para desenvolvimento local, configure REACT_APP_FIREBASE_FUNCTIONS_EMULATOR_URL');
  }
  
  // URLs das Cloud Functions (2ª geração - Cloud Run)
  const functionUrls: Record<string, string> = {
    createCheckoutSession: 'https://createcheckoutsession-znybjudnpq-uc.a.run.app',
    verifyCheckoutSession: 'https://verifycheckoutsession-znybjudnpq-uc.a.run.app',
  };
  
  return functionUrls[functionName] || `https://us-central1-shoollibsystem.cloudfunctions.net/${functionName}`;
};

/**
 * Cria uma sessão de checkout no Stripe via Cloud Function
 */
export const createCheckoutSession = async (
  planId: number,
  userId: string,
  isAnnual: boolean = false
): Promise<{ sessionId: string; url: string }> => {
  try {
    const url = getCloudFunctionUrl('createCheckoutSession');
    
    // Chamar Cloud Function para criar sessão de checkout
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        planId,
        userId,
        isAnnual,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Erro ao criar sessão de checkout' }));
      throw new Error(error.message || error.error || 'Erro ao criar sessão de checkout');
    }

    const data = await response.json();
    return {
      sessionId: data.sessionId,
      url: data.url,
    };
  } catch (error) {
    console.error('Erro ao criar sessão de checkout:', error);
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      throw new Error('Não foi possível conectar ao servidor. Verifique se as Cloud Functions estão deployadas e acessíveis.');
    }
    throw error;
  }
};
