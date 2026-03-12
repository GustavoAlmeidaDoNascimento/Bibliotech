import * as functions from "firebase-functions/v2";
import * as admin from "firebase-admin";
import Stripe from "stripe";
import {defineString, defineJsonSecret} from "firebase-functions/params";

admin.initializeApp();

// Usar o secret exportado do functions.config()
const functionsConfig = defineJsonSecret("FUNCTIONS_CONFIG_EXPORT");
const stripeBasicPriceId = defineString("STRIPE_BASIC_PRICE_ID", {
  default: "",
  description: "Stripe basic plan price ID (mensal)",
});
const stripeBasicAnnualPriceId = defineString("STRIPE_BASIC_ANNUAL_PRICE_ID", {
  default: "",
  description: "Stripe basic plan price ID (anual)",
});
const stripeIntermediatePriceId = defineString("STRIPE_INTERMEDIATE_PRICE_ID", {
  default: "",
  description: "Stripe intermediate plan price ID (mensal)",
});
const stripeIntermediateAnnualPriceId = defineString(
  "STRIPE_INTERMEDIATE_ANNUAL_PRICE_ID",
  {
    default: "",
    description: "Stripe intermediate plan price ID (anual)",
  }
);
const stripeAdvancedPriceId = defineString("STRIPE_ADVANCED_PRICE_ID", {
  default: "",
  description: "Stripe advanced plan price ID (mensal)",
});
const stripeAdvancedAnnualPriceId = defineString(
  "STRIPE_ADVANCED_ANNUAL_PRICE_ID",
  {
    default: "",
    description: "Stripe advanced plan price ID (anual)",
  }
);
// Webhook secret será opcional inicialmente
// (será configurado após criar webhook no Stripe)
const stripeWebhookSecret = defineString("STRIPE_WEBHOOK_SECRET", {
  default: "",
  description: "Stripe webhook secret (configure após criar webhook)",
});

// Inicializar Stripe (será configurado no runtime)
let stripe: Stripe | null = null;

const getStripe = (): Stripe => {
  if (!stripe) {
    // Ler do secret exportado
    const config = functionsConfig.value();
    const secretKey = config?.stripe?.secret_key || "";

    if (!secretKey || secretKey === "") {
      throw new Error(
        "STRIPE_SECRET_KEY não configurada. " +
        "Configure usando: firebase functions:config:set " +
        "stripe.secret_key=..."
      );
    }
    stripe = new Stripe(secretKey, {
      apiVersion: "2023-10-16",
    });
  }
  return stripe;
};

// Mapeamento de planos
const getPlanPriceId = (planId: number, isAnnual = false): string => {
  if (planId === 1) {
    let priceId = "";

    if (isAnnual) {
      // Tentar obter do novo sistema primeiro
      priceId = stripeBasicAnnualPriceId.value();

      // Se não encontrou, ler do secret exportado
      if (!priceId || priceId === "") {
        const config = functionsConfig.value();
        priceId = config?.stripe?.basic_annual_price_id || "";
      }
    } else {
      // Tentar obter do novo sistema primeiro
      priceId = stripeBasicPriceId.value();

      // Se não encontrou, ler do secret exportado
      if (!priceId || priceId === "") {
        const config = functionsConfig.value();
        priceId = config?.stripe?.basic_price_id || "";
      }
    }

    // Garantir que o price ID tenha o prefixo "price_"
    if (priceId && !priceId.startsWith("price_")) {
      priceId = `price_${priceId}`;
    }

    return priceId;
  }

  if (planId === 2) {
    let priceId = "";

    if (isAnnual) {
      priceId = stripeIntermediateAnnualPriceId.value();

      if (!priceId || priceId === "") {
        const config = functionsConfig.value();
        priceId = config?.stripe?.intermediate_annual_price_id || "";
      }
    } else {
      priceId = stripeIntermediatePriceId.value();

      if (!priceId || priceId === "") {
        const config = functionsConfig.value();
        priceId = config?.stripe?.intermediate_price_id || "";
      }
    }

    if (priceId && !priceId.startsWith("price_")) {
      priceId = `price_${priceId}`;
    }

    return priceId;
  }

  if (planId === 3) {
    let priceId = "";

    if (isAnnual) {
      priceId = stripeAdvancedAnnualPriceId.value();

      if (!priceId || priceId === "") {
        const config = functionsConfig.value();
        priceId = config?.stripe?.advanced_annual_price_id || "";
      }
    } else {
      priceId = stripeAdvancedPriceId.value();

      if (!priceId || priceId === "") {
        const config = functionsConfig.value();
        priceId = config?.stripe?.advanced_price_id || "";
      }
    }

    if (priceId && !priceId.startsWith("price_")) {
      priceId = `price_${priceId}`;
    }

    return priceId;
  }

  return "";
};

/**
 * Retorna o planId (1, 2 ou 3) a partir do Stripe price ID, ou 1 como fallback.
 * @param {string} priceId - ID do preço no Stripe (ex: price_xxx).
 * @return {number} 1 (básico), 2 (intermediário) ou 3 (avançado).
 */
const getPlanIdFromPriceId = (priceId: string): number => {
  const normalized =
    priceId.startsWith("price_") ? priceId : `price_${priceId}`;
  const config = functionsConfig.value();
  const basic =
    stripeBasicPriceId.value() || config?.stripe?.basic_price_id || "";
  const basicAnnual =
    stripeBasicAnnualPriceId.value() ||
    config?.stripe?.basic_annual_price_id || "";
  const inter =
    stripeIntermediatePriceId.value() ||
    config?.stripe?.intermediate_price_id || "";
  const interAnnual =
    stripeIntermediateAnnualPriceId.value() ||
    config?.stripe?.intermediate_annual_price_id || "";
  const adv =
    stripeAdvancedPriceId.value() || config?.stripe?.advanced_price_id || "";
  const advAnnual =
    stripeAdvancedAnnualPriceId.value() ||
    config?.stripe?.advanced_annual_price_id || "";
  const ids = [
    [basic, basicAnnual],
    [inter, interAnnual],
    [adv, advAnnual],
  ];
  for (let i = 0; i < ids.length; i++) {
    if (ids[i].some((id) => id && (id === normalized || id === priceId))) {
      return i + 1;
    }
  }
  return 1;
};

/**
 * Sincroniza assinatura e faturas do Stripe com o Firestore e retorna
 * as faturas. Requer Authorization: Bearer <Firebase ID Token>.
 */
export const syncSubscriptionFromStripe = functions.https.onRequest(
  {
    secrets: [functionsConfig],
  },
  async (req, res) => {
    const origin = req.headers.origin || "*";
    res.set("Access-Control-Allow-Origin", origin);
    res.set("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");

    if (req.method === "OPTIONS") {
      res.status(204).send("");
      return;
    }

    if (req.method !== "POST" && req.method !== "GET") {
      res.status(405).json({error: "Method not allowed"});
      return;
    }


    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        res.status(401).json({error: "Token de autenticação obrigatório"});
        return;
      }
      const idToken = authHeader.slice(7);
      const decoded = await admin.auth().verifyIdToken(idToken);
      const uid = decoded.uid;
      const email = (decoded.email as string) || "";

      if (!email) {
        res.status(400).json({
          synced: false,
          error: "E-mail do usuário não disponível",
          invoices: [],
        });
        return;
      }

      const stripeInstance = getStripe();
      const customers = await stripeInstance.customers.list({
        email,
        limit: 1,
      });

      if (!customers.data.length) {
        res.json({synced: false, invoices: []});
        return;
      }

      const customer = customers.data[0];
      const subs = await stripeInstance.subscriptions.list({
        customer: customer.id,
        status: "active",
        limit: 1,
      });

      const subscription = subs.data[0] || null;
      const planIdNum = subscription ?
        getPlanIdFromPriceId(
          subscription.items.data[0]?.price?.id || ""
        ) :
        null;

      const invoicesRes = await stripeInstance.invoices.list({
        customer: customer.id,
        limit: 24,
      });

      const invoices = (invoicesRes.data || []).map((inv) => ({
        id: inv.id,
        created: inv.created,
        amount_paid: inv.amount_paid,
        currency: inv.currency,
        status: inv.status,
        invoice_pdf: inv.invoice_pdf || null,
        hosted_invoice_url: inv.hosted_invoice_url || null,
      }));

      if (subscription && planIdNum) {
        const subscriptionRef = admin
          .firestore()
          .doc(`users/${uid}/account/subscription`);
        const now = admin.firestore.Timestamp.now();
        const periodEnd = subscription.current_period_end;
        const nextPaymentDate = periodEnd ?
          admin.firestore.Timestamp.fromDate(new Date(periodEnd * 1000)) :
          null;
        const lastInvoice = invoices[0];
        const lastPaymentDate =
          lastInvoice && typeof lastInvoice.created === "number" ?
            admin.firestore.Timestamp.fromDate(
              new Date(lastInvoice.created * 1000)
            ) :
            now;

        await subscriptionRef.set(
          {
            plan: planIdNum,
            status: "active",
            stripeCustomerId: customer.id,
            stripeSubscriptionId: subscription.id,
            lastPaymentDate,
            nextPaymentDate,
            updatedAt: now,
          },
          {merge: true}
        );
      }

      res.json({
        synced: !!subscription,
        planId: planIdNum,
        invoices,
      });
    } catch (error) {
      console.error("Erro ao sincronizar assinatura do Stripe:", error);
      res.status(500).json({
        synced: false,
        error:
          error instanceof Error ? error.message : "Erro ao sincronizar",
        invoices: [],
      });
    }
  }
);

/**
 * Cria uma sessão de checkout no Stripe
 */
export const createCheckoutSession = functions.https.onRequest(
  {
    secrets: [functionsConfig],
  },
  async (req, res) => {
  // Habilitar CORS para todas as origens (incluindo localhost)
    const origin = req.headers.origin || "*";
    res.set("Access-Control-Allow-Origin", origin);
    res.set("Access-Control-Allow-Methods", "POST, OPTIONS, GET");
    res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.set("Access-Control-Allow-Credentials", "true");

    if (req.method === "OPTIONS") {
      res.status(200).send("");
      return;
    }

    if (req.method !== "POST") {
      res.status(405).json({error: "Method not allowed"});
      return;
    }

    try {
      const {planId, userId, isAnnual} = req.body;

      if (!planId || !userId) {
        res.status(400).json({error: "planId e userId são obrigatórios"});
        return;
      }

      const priceId = getPlanPriceId(planId, isAnnual === true);
      if (!priceId) {
        res.status(400).json({error: "Plano inválido"});
        return;
      }

      // Criar sessão de checkout no Stripe
      const stripeInstance = getStripe();
      const session = await stripeInstance.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: "subscription",
        success_url: `${
          req.headers.origin || "https://bibliotech.tech"
        }/checkout/${planId}?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url:
        `${req.headers.origin || "https://bibliotech.tech"}/checkout/${planId}`,
        metadata: {
          userId,
          planId: planId.toString(),
        },
        // Será preenchido pelo Stripe se o usuário fornecer
        customer_email: undefined,
      });

      res.json({
        sessionId: session.id,
        url: session.url,
      });
    } catch (error) {
      console.error("Erro ao criar sessão de checkout:", error);
      res.status(500).json({
        error: "Erro ao criar sessão de checkout",
        message: error instanceof Error ? error.message : "Erro desconhecido",
      });
    }
  });

/**
 * Verifica o status de uma sessão de checkout
 */
export const verifyCheckoutSession = functions.https.onRequest(
  {
    secrets: [functionsConfig],
  },
  async (req, res) => {
  // Habilitar CORS para todas as origens (incluindo localhost)
    const origin = req.headers.origin || "*";
    res.set("Access-Control-Allow-Origin", origin);
    res.set("Access-Control-Allow-Methods", "GET, OPTIONS, POST");
    res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.set("Access-Control-Allow-Credentials", "true");

    if (req.method === "OPTIONS") {
      res.status(200).send("");
      return;
    }

    if (req.method !== "GET") {
      res.status(405).json({error: "Method not allowed"});
      return;
    }

    try {
      const sessionId = req.query.session_id as string;

      if (!sessionId) {
        res.status(400).json({error: "session_id é obrigatório"});
        return;
      }

      const stripeInstance = getStripe();
      const session = await stripeInstance.checkout.sessions.retrieve(
        sessionId
      );

      const paid = session.payment_status === "paid";

      // Se pagamento confirmado, garantir que o plano está no Firestore
      // (evita depender só do webhook e garante acesso imediato ao plano)
      if (paid) {
        const userId = session.metadata?.userId;
        const planId = session.metadata?.planId;
        if (userId && planId) {
          const planIdNum = parseInt(planId, 10);
          const customerId = session.customer as string;
          const subscriptionId = session.subscription as string | null;
          const subscriptionRef = admin
            .firestore()
            .doc(`users/${userId}/account/subscription`);
          const now = admin.firestore.Timestamp.now();

          let isAnnual = false;
          if (subscriptionId) {
            try {
              const subscription =
                await stripeInstance.subscriptions.retrieve(subscriptionId);
              const interval =
                subscription.items.data[0]?.price?.recurring?.interval;
              if (interval === "year") {
                isAnnual = true;
              }
            } catch (err) {
              console.error("Erro ao buscar subscription:", err);
            }
          }

          const nextPaymentDate = new Date();
          if (isAnnual) {
            nextPaymentDate.setDate(nextPaymentDate.getDate() + 365);
          } else {
            nextPaymentDate.setDate(nextPaymentDate.getDate() + 30);
          }

          await subscriptionRef.set(
            {
              plan: planIdNum,
              status: "active",
              stripeCustomerId: customerId,
              stripeSubscriptionId: subscriptionId || null,
              stripeSessionId: session.id,
              startDate: now,
              lastPaymentDate: now,
              nextPaymentDate: admin.firestore.Timestamp.fromDate(
                nextPaymentDate
              ),
              updatedAt: now,
            },
            {merge: true}
          );
          console.log(
            "[verifyCheckoutSession] Plano ativado para usuário",
            userId,
            "plano",
            planIdNum
          );
        }
      }

      res.json({
        paid,
        customerId: session.customer as string | null,
        subscriptionId: session.subscription as string | null,
      });
    } catch (error) {
      console.error("Erro ao verificar sessão de checkout:", error);
      res.status(500).json({
        error: "Erro ao verificar sessão de checkout",
        message: error instanceof Error ? error.message : "Erro desconhecido",
      });
    }
  });

/**
 * Webhook do Stripe para processar eventos de pagamento
 */
export const stripeWebhook = functions.https.onRequest(
  {
    secrets: [functionsConfig],
  },
  async (req, res) => {
    const sig = req.headers["stripe-signature"] as string;
    // Tentar obter do novo sistema primeiro
    let webhookSecret = stripeWebhookSecret.value();

    // Se não encontrou, ler do secret exportado
    if (!webhookSecret || webhookSecret === "") {
      const config = functionsConfig.value();
      webhookSecret = config?.stripe?.webhook_secret || "";
    }

    if (!webhookSecret || webhookSecret === "") {
      console.error(
        "Webhook secret não configurado. " +
      "Configure usando: firebase functions:config:set " +
      "stripe.webhook_secret=..."
      );
      res.status(500).json({
        error: "Webhook secret não configurado",
        message: "Configure o webhook secret no Firebase antes de usar.",
      });
      return;
    }

    let event: Stripe.Event;

    const stripeInstance = getStripe();
    try {
      event = stripeInstance.webhooks.constructEvent(
        req.body,
        sig,
        webhookSecret
      );
    } catch (err) {
      console.error("Erro ao verificar assinatura do webhook:", err);
      const errorMsg = err instanceof Error ? err.message : "Erro desconhecido";
      res.status(400).send(`Webhook Error: ${errorMsg}`);
      return;
    }

    // Processar evento
    try {
      if (event.type === "checkout.session.completed") {
        const session = event.data.object as Stripe.Checkout.Session;

        const userId = session.metadata?.userId;
        const planId = session.metadata?.planId;

        if (!userId || !planId) {
          console.error(
            "userId ou planId não encontrado no metadata da sessão"
          );
          res.status(400).send("Dados insuficientes no metadata");
          return;
        }

        const planIdNum = parseInt(planId, 10);
        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string | null;

        // Atualizar plano no Firestore
        const subscriptionRef = admin
          .firestore()
          .doc(`users/${userId}/account/subscription`);
        const now = admin.firestore.Timestamp.now();

        // Determinar se é anual baseado no subscription do Stripe
        // Buscar subscription para verificar o intervalo
        let isAnnual = false;
        if (subscriptionId) {
          try {
            const stripeInstance = getStripe();
            const subscription =
              await stripeInstance.subscriptions.retrieve(subscriptionId);
            // Se o interval for 'year', é anual
            const interval =
              subscription.items.data[0]?.price?.recurring?.interval;
            if (interval === "year") {
              isAnnual = true;
            }
          } catch (err) {
            console.error("Erro ao buscar subscription:", err);
          }
        }

        // Calcular próxima data de pagamento
        // (365 dias para anual, 30 para mensal)
        const nextPaymentDate = new Date();
        if (isAnnual) {
          nextPaymentDate.setDate(nextPaymentDate.getDate() + 365);
        } else {
          nextPaymentDate.setDate(nextPaymentDate.getDate() + 30);
        }

        await subscriptionRef.set(
          {
            plan: planIdNum,
            status: "active",
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscriptionId || null,
            stripeSessionId: session.id,
            startDate: now,
            lastPaymentDate: now,
            nextPaymentDate: admin.firestore.Timestamp.fromDate(
              nextPaymentDate
            ),
            updatedAt: now,
          },
          {merge: true}
        );

        console.log(
          `Plano atualizado para usuário ${userId}: plano ${planIdNum}`
        );
      }

      // Retornar resposta de sucesso
      res.json({received: true});
    } catch (error) {
      console.error("Erro ao processar webhook:", error);
      res.status(500).send("Erro ao processar webhook");
    }
  });
