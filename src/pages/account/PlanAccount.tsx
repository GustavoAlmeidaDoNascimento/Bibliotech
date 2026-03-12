import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CircleStackIcon, CreditCardIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import {
  getSubscriptionData,
  syncSubscriptionFromStripe,
  type SubscriptionData,
  type StripeInvoiceItem,
} from '../../services/paymentService';
import { subscriptionService } from '../../services/subscriptionService';
import { ROUTES } from '../../constants';
import styles from './PlanAccount.module.css';

const PLAN_LABELS: Record<number, { name: string; price: string }> = {
  1: { name: 'Bibliotech Básico', price: 'R$ 94,90' },
  2: { name: 'Bibliotech Intermediário', price: 'R$ 157,90' },
  3: { name: 'Bibliotech Avançado', price: 'R$ 219,99' },
};

type BillingInterval = 'monthly' | 'annual';

function formatDate(value: Date | { toDate?: () => Date } | number | undefined): string {
  if (value == null) return '—';
  let d: Date;
  if (typeof value === 'number') {
    d = new Date(value * 1000);
  } else if (value instanceof Date) {
    d = value;
  } else if (typeof (value as { toDate?: () => Date }).toDate === 'function') {
    d = (value as { toDate: () => Date }).toDate();
  } else {
    d = new Date();
  }
  return d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatStripeAmount(cents: number, currency: string): string {
  const value = cents / 100;
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: currency.toUpperCase() === 'BRL' ? 'BRL' : currency,
  }).format(value);
}

function invoiceStatusLabel(status: string | null): string {
  if (!status) return '—';
  const map: Record<string, string> = {
    paid: 'Pago',
    open: 'Aberto',
    draft: 'Rascunho',
    uncollectible: 'Inadimplente',
    void: 'Cancelado',
  };
  return map[status] || status;
}

const PlanAccount: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [billingInterval, setBillingInterval] = useState<BillingInterval>('monthly');
  const [invoices, setInvoices] = useState<StripeInvoiceItem[]>([]);
  const [syncLoading, setSyncLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!currentUser) {
        navigate(ROUTES.LOGIN);
        return;
      }
      try {
        const subData = await getSubscriptionData(currentUser.uid);
        setSubscription(subData ?? null);
        setBillingInterval('monthly');

        setSyncLoading(true);
        try {
          const token = await currentUser.getIdToken();
          const result = await syncSubscriptionFromStripe(token);
          if (result.invoices.length > 0) {
            setInvoices(result.invoices);
          }
          if (result.synced) {
            const updated = await getSubscriptionData(currentUser.uid);
            setSubscription(updated ?? subData);
            subscriptionService.invalidateCache(currentUser.uid);
          }
        } catch (e) {
          console.error('Erro ao sincronizar com Stripe:', e);
        } finally {
          setSyncLoading(false);
        }
      } catch (e) {
        console.error('Erro ao carregar assinatura:', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [currentUser, navigate]);

  const planId = subscription?.plan ?? null;
  const planLabel = planId && PLAN_LABELS[planId] ? PLAN_LABELS[planId].name : planId ? `Plano ${planId}` : 'Nenhum plano';
  const planPrice = planId && PLAN_LABELS[planId] ? PLAN_LABELS[planId].price : '—';
  const nextBilling = subscription?.nextPaymentDate;
  const lastPayment = subscription?.lastPaymentDate;

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Carregando...</div>
      </div>
    );
  }

  const statusActive =
    typeof subscription?.status === 'string' &&
    subscription.status.toLowerCase() === 'active';
  const hasPaymentEvidence =
    statusActive ||
    subscription?.lastPaymentDate != null ||
    (subscription?.stripeCustomerId != null && subscription.stripeCustomerId !== '');
  const hasPlan =
    subscription?.plan != null && hasPaymentEvidence;
  const isFreeBeta =
    subscription?.plan != null && !subscription?.lastPaymentDate && !subscription?.stripeCustomerId;

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        {isFreeBeta && (
          <div className={styles.betaBanner} role="status">
            <p className={styles.betaBannerText}>
              Aproveite! Você está usando o Bibliotech de graça! E por isso, você é um beta-tester, está sujeito a bugs de novas funcionalidades, mas por outro lado, vai recebê-las primeiro!
            </p>
          </div>
        )}
        {/* Seção Plano */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <div className={styles.planTitleRow}>
              <span className={styles.planIcon} aria-hidden>
                <CircleStackIcon className={styles.planIconSvg} />
              </span>
              <div>
                <h2 className={styles.planName}>
                  {hasPlan ? planLabel : isFreeBeta ? planLabel : 'Sem plano ativo'}
                </h2>
                <p className={styles.planMeta}>
                  {hasPlan ? (billingInterval === 'annual' ? 'Anual' : 'Mensal') : isFreeBeta ? 'Beta (grátis)' : '—'}
                </p>
                {hasPlan && nextBilling && (
                  <p className={styles.renewalText}>
                    Sua assinatura será renovada automaticamente em {formatDate(nextBilling)}.
                  </p>
                )}
              </div>
            </div>
            {(hasPlan || isFreeBeta) && (
              <Link to={ROUTES.PLANS} className={styles.btnSecondary} aria-label="Ajustar plano">
                Ajustar plano
              </Link>
            )}
          </div>
        </section>

        {/* Seção Pagamento */}
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Pagamento</h3>
          <div className={styles.paymentRow}>
            <CreditCardIcon className={styles.cardIcon} aria-hidden />
            <span className={styles.cardLabel}>
              {hasPlan ? 'Mastercard •••• 4949' : isFreeBeta ? 'Nenhum pagamento necessário (beta)' : 'Nenhum método de pagamento'}
            </span>
            {hasPlan && (
              <button type="button" className={styles.btnSecondary} disabled aria-label="Atualizar pagamento">
                Atualizar
              </button>
            )}
          </div>
        </section>

        {/* Seção Faturas */}
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>
            Faturas
            {syncLoading && <span className={styles.syncHint}> (sincronizando…)</span>}
          </h3>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {invoices.length > 0 ? (
                  invoices.map((inv) => (
                    <tr key={inv.id}>
                      <td>{formatDate(inv.created)}</td>
                      <td>{formatStripeAmount(inv.amount_paid, inv.currency)}</td>
                      <td>
                        <span className={inv.status === 'paid' ? styles.statusPaid : undefined}>
                          {invoiceStatusLabel(inv.status)}
                        </span>
                      </td>
                      <td>
                        {(inv.hosted_invoice_url || inv.invoice_pdf) ? (
                          <a
                            href={inv.hosted_invoice_url || inv.invoice_pdf || '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.linkAction}
                          >
                            Ver
                          </a>
                        ) : (
                          <span className={styles.linkAction}>—</span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : hasPlan && lastPayment ? (
                  <tr>
                    <td>{formatDate(lastPayment)}</td>
                    <td>{planPrice}</td>
                    <td>
                      <span className={styles.statusPaid}>Pago</span>
                    </td>
                    <td>
                      <span className={styles.linkAction}>—</span>
                    </td>
                  </tr>
                ) : (
                  <tr>
                    <td colSpan={4} className={styles.emptyRow}>
                      Nenhuma fatura encontrada.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Seção Cancelamento */}
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Cancelamento</h3>
          <p className={styles.cancelLabel}>Cancelar plano</p>
          <button
            type="button"
            className={styles.btnCancel}
            disabled={!hasPlan}
            aria-label="Cancelar assinatura"
          >
            Cancelar
          </button>
          {isFreeBeta && (
            <p className={styles.betaCancelHint}>Como beta-tester gratuito, você não precisa cancelar nenhuma assinatura.</p>
          )}
        </section>
      </div>
    </div>
  );
};

export default PlanAccount;
