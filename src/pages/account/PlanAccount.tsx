import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CircleStackIcon, CreditCardIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import { getSubscriptionData, type SubscriptionData } from '../../services/paymentService';
import { ROUTES } from '../../constants';
import styles from './PlanAccount.module.css';

const PLAN_LABELS: Record<number, { name: string; price: string }> = {
  1: { name: 'Bibliotech Básico', price: 'R$ 94,90' },
  2: { name: 'Bibliotech Intermediário', price: 'R$ 157,90' },
  3: { name: 'Bibliotech Avançado', price: 'R$ 219,99' },
};

type BillingInterval = 'monthly' | 'annual';

function formatDate(value: Date | { toDate?: () => Date } | undefined): string {
  if (!value) return '—';
  const d = value instanceof Date ? value : typeof (value as { toDate?: () => Date }).toDate === 'function' ? (value as { toDate: () => Date }).toDate() : new Date();
  return d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' });
}

const PlanAccount: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [billingInterval, setBillingInterval] = useState<BillingInterval>('monthly');

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

  const hasPlan = subscription?.plan != null && subscription?.status === 'active';
  const isFreeBeta =
    subscription?.plan != null && !subscription?.lastPaymentDate;

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
          <h3 className={styles.sectionTitle}>Faturas</h3>
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
                {hasPlan && lastPayment ? (
                  <tr>
                    <td>{formatDate(lastPayment)}</td>
                    <td>{planPrice}</td>
                    <td>
                      <span className={styles.statusPaid}>Pago</span>
                    </td>
                    <td>
                      <button type="button" className={styles.linkAction} disabled>
                        Ver
                      </button>
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
