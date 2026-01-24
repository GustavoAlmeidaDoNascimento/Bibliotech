/**
 * Configuração do Stripe
 * Carrega chaves e configurações a partir de variáveis de ambiente
 */

export const getStripeConfig = () => {
  const publishableKey = process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY;
  if (!publishableKey) {
    throw new Error('REACT_APP_STRIPE_PUBLISHABLE_KEY não configurada');
  }
  return { publishableKey };
};

export const STRIPE_PRICE_IDS = {
  BASIC: process.env.REACT_APP_STRIPE_BASIC_PRICE_ID || '',
  // Futuro: INTERMEDIATE, ADVANCED
};

export const PLAN_MAPPING = {
  1: {
    name: 'Bibliotech Básico',
    price: 'R$ 94,90',
    priceId: STRIPE_PRICE_IDS.BASIC,
  },
  // Futuro:
  // 2: { name: 'Bibliotech Intermediário', price: 'R$ 157,90', priceId: STRIPE_PRICE_IDS.INTERMEDIATE },
  // 3: { name: 'Bibliotech Avançado', price: 'R$ 219,99', priceId: STRIPE_PRICE_IDS.ADVANCED },
};
