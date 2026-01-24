import { doc, setDoc, getDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from './firebase';

export interface SubscriptionData {
  plan: number | null;
  status: 'pending' | 'active' | 'canceled' | 'past_due';
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  stripeSessionId?: string;
  startDate?: Timestamp | any;
  lastPaymentDate?: Timestamp | any;
  nextPaymentDate?: Timestamp | any;
  createdAt?: Timestamp | any;
}

/**
 * Atualiza o plano de assinatura do usuário no Firestore
 * Chamado pelo webhook do Stripe após pagamento bem-sucedido
 */
export const updateSubscriptionPlan = async (
  userId: string,
  planId: number,
  stripeData: {
    customerId: string;
    subscriptionId?: string;
    sessionId?: string;
  }
): Promise<void> => {
  try {
    const subscriptionRef = doc(db, `users/${userId}/account/subscription`);
    const now = serverTimestamp();

    const subscriptionData: SubscriptionData = {
      plan: planId,
      status: 'active',
      stripeCustomerId: stripeData.customerId,
      ...(stripeData.subscriptionId && { stripeSubscriptionId: stripeData.subscriptionId }),
      ...(stripeData.sessionId && { stripeSessionId: stripeData.sessionId }),
      startDate: now,
      lastPaymentDate: now,
      createdAt: now,
    };

    // Calcular próxima data de pagamento (30 dias a partir de agora)
    const nextPaymentDate = new Date();
    nextPaymentDate.setDate(nextPaymentDate.getDate() + 30);
    subscriptionData.nextPaymentDate = nextPaymentDate;

    await setDoc(subscriptionRef, subscriptionData, { merge: true });
  } catch (error) {
    console.error('Erro ao atualizar plano de assinatura:', error);
    throw error;
  }
};

/**
 * Obtém a URL base da Cloud Function baseado no ambiente
 */
const getCloudFunctionUrl = (functionName: string): string => {
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  if (isDevelopment) {
    const emulatorUrl = process.env.REACT_APP_FIREBASE_FUNCTIONS_EMULATOR_URL;
    if (emulatorUrl) {
      return `${emulatorUrl}/${functionName}`;
    }
  }
  
  // URLs das Cloud Functions (2ª geração - Cloud Run)
  const functionUrls: Record<string, string> = {
    verifyCheckoutSession: 'https://verifycheckoutsession-znybjudnpq-uc.a.run.app',
  };
  
  return functionUrls[functionName] || `https://us-central1-shoollibsystem.cloudfunctions.net/${functionName}`;
};

/**
 * Verifica o status de uma sessão de checkout
 */
export const verifyPaymentSession = async (
  sessionId: string
): Promise<{ paid: boolean; customerId?: string }> => {
  try {
    const url = getCloudFunctionUrl('verifyCheckoutSession');
    const response = await fetch(`${url}?sessionId=${sessionId}`);

    if (!response.ok) {
      throw new Error('Erro ao verificar sessão de pagamento');
    }

    const data = await response.json();
    return {
      paid: data.paid || false,
      customerId: data.customerId,
    };
  } catch (error) {
    console.error('Erro ao verificar sessão de pagamento:', error);
    throw error;
  }
};

/**
 * Obtém dados da assinatura do usuário
 */
export const getSubscriptionData = async (
  userId: string
): Promise<SubscriptionData | null> => {
  try {
    const subscriptionRef = doc(db, `users/${userId}/account/subscription`);
    const subscriptionDoc = await getDoc(subscriptionRef);

    if (subscriptionDoc.exists()) {
      return subscriptionDoc.data() as SubscriptionData;
    }

    return null;
  } catch (error) {
    console.error('Erro ao obter dados da assinatura:', error);
    throw error;
  }
};
