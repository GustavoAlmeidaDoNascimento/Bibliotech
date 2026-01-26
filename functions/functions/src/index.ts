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

  // Futuro: 3: advanced_price_id
  return "";
};

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

      res.json({
        paid: session.payment_status === "paid",
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
