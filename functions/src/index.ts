import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import Stripe from 'stripe';

admin.initializeApp();

// Usar functions.config() (sistema antigo, mas ainda funcional até março 2026)
// Para usar, execute: firebase experiments:enable legacyRuntimeConfigCommands
const getStripeConfig = () => {
  try {
    return functions.config().stripe;
  } catch (error) {
    console.error('Erro ao acessar config do Firebase:', error);
    // Fallback para variáveis de ambiente (útil para desenvolvimento local)
    return {
      secret_key: process.env.STRIPE_SECRET_KEY || '',
      basic_price_id: process.env.STRIPE_BASIC_PRICE_ID || '',
      webhook_secret: process.env.STRIPE_WEBHOOK_SECRET || '',
    };
  }
};

const config = getStripeConfig();
const stripe = new Stripe(config.secret_key, {
  apiVersion: '2023-10-16',
});

// Mapeamento de planos
const PLAN_MAPPING: Record<number, string> = {
  1: config.basic_price_id || '',
  // Futuro: 2: intermediate_price_id, 3: advanced_price_id
};

/**
 * Cria uma sessão de checkout no Stripe
 */
export const createCheckoutSession = functions.https.onRequest(async (req, res) => {
  // Habilitar CORS para todas as origens (incluindo localhost)
  const origin = req.headers.origin || '*';
  res.set('Access-Control-Allow-Origin', origin);
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS, GET');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.set('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    res.status(200).send('');
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { planId, userId } = req.body;

    if (!planId || !userId) {
      res.status(400).json({ error: 'planId e userId são obrigatórios' });
      return;
    }

    const priceId = PLAN_MAPPING[planId];
    if (!priceId) {
      res.status(400).json({ error: 'Plano inválido' });
      return;
    }

    // Criar sessão de checkout no Stripe
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${req.headers.origin || 'https://bibliotech.tech'}/checkout/${planId}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin || 'https://bibliotech.tech'}/checkout/${planId}`,
      metadata: {
        userId,
        planId: planId.toString(),
      },
      customer_email: undefined, // Será preenchido pelo Stripe se o usuário fornecer
    });

    res.json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    console.error('Erro ao criar sessão de checkout:', error);
    res.status(500).json({
      error: 'Erro ao criar sessão de checkout',
      message: error instanceof Error ? error.message : 'Erro desconhecido',
    });
  }
});

/**
 * Verifica o status de uma sessão de checkout
 */
export const verifyCheckoutSession = functions.https.onRequest(async (req, res) => {
  // Habilitar CORS para todas as origens (incluindo localhost)
  const origin = req.headers.origin || '*';
  res.set('Access-Control-Allow-Origin', origin);
  res.set('Access-Control-Allow-Methods', 'GET, OPTIONS, POST');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.set('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    res.status(200).send('');
    return;
  }

  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const sessionId = req.query.session_id as string;

    if (!sessionId) {
      res.status(400).json({ error: 'session_id é obrigatório' });
      return;
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    res.json({
      paid: session.payment_status === 'paid',
      customerId: session.customer as string | null,
      subscriptionId: session.subscription as string | null,
    });
  } catch (error) {
    console.error('Erro ao verificar sessão de checkout:', error);
    res.status(500).json({
      error: 'Erro ao verificar sessão de checkout',
      message: error instanceof Error ? error.message : 'Erro desconhecido',
    });
  }
});

/**
 * Webhook do Stripe para processar eventos de pagamento
 */
export const stripeWebhook = functions.https.onRequest(async (req, res) => {
  const sig = req.headers['stripe-signature'] as string;
  const webhookSecret = config.webhook_secret;

  if (!webhookSecret) {
    console.error('Webhook secret não configurado');
    res.status(500).send('Webhook secret não configurado');
    return;
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error('Erro ao verificar assinatura do webhook:', err);
    res.status(400).send(`Webhook Error: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
    return;
  }

  // Processar evento
  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;

      const userId = session.metadata?.userId;
      const planId = session.metadata?.planId;

      if (!userId || !planId) {
        console.error('userId ou planId não encontrado no metadata da sessão');
        res.status(400).send('Dados insuficientes no metadata');
        return;
      }

      const planIdNum = parseInt(planId, 10);
      const customerId = session.customer as string;
      const subscriptionId = session.subscription as string | null;

      // Atualizar plano no Firestore
      const subscriptionRef = admin.firestore().doc(`users/${userId}/account/subscription`);
      const now = admin.firestore.Timestamp.now();

      // Calcular próxima data de pagamento (30 dias)
      const nextPaymentDate = new Date();
      nextPaymentDate.setDate(nextPaymentDate.getDate() + 30);

      await subscriptionRef.set(
        {
          plan: planIdNum,
          status: 'active',
          stripeCustomerId: customerId,
          stripeSubscriptionId: subscriptionId || null,
          stripeSessionId: session.id,
          startDate: now,
          lastPaymentDate: now,
          nextPaymentDate: admin.firestore.Timestamp.fromDate(nextPaymentDate),
          updatedAt: now,
        },
        { merge: true }
      );

      console.log(`Plano atualizado para usuário ${userId}: plano ${planIdNum}`);
    }

    // Retornar resposta de sucesso
    res.json({ received: true });
  } catch (error) {
    console.error('Erro ao processar webhook:', error);
    res.status(500).send('Erro ao processar webhook');
  }
});
