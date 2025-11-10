import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';

export type SubscriptionPlanTier = 'basic' | 'intermediate' | 'advanced' | 'unknown';

export interface SubscriptionPlanInfo {
  rawPlan: string | null;
  numericPlan: number | null;
  tier: SubscriptionPlanTier;
}

const planCache = new Map<string, SubscriptionPlanInfo>();

const removeDiacritics = (value: string) =>
  value.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

const inferTierFromValue = (planValue: string | number | null | undefined): SubscriptionPlanTier => {
  if (planValue === null || planValue === undefined) {
    return 'unknown';
  }

  if (typeof planValue === 'number') {
    if (planValue === 1) return 'basic';
    if (planValue === 2) return 'intermediate';
    if (planValue === 3) return 'advanced';
    return 'unknown';
  }

  const normalized = removeDiacritics(planValue.toString().trim()).toLowerCase();

  if (!normalized) {
    return 'unknown';
  }

  if (
    normalized === '1' ||
    normalized === 'plano 1' ||
    normalized.includes('basico') ||
    normalized.includes('basic')
  ) {
    return 'basic';
  }

  if (
    normalized === '2' ||
    normalized === 'plano 2' ||
    normalized.includes('intermediario') ||
    normalized.includes('intermediate')
  ) {
    return 'intermediate';
  }

  if (
    normalized === '3' ||
    normalized === 'plano 3' ||
    normalized.includes('avancado') ||
    normalized.includes('advanced')
  ) {
    return 'advanced';
  }

  return 'unknown';
};

const normalizeRawPlan = (planValue: unknown): { rawPlan: string | null; numericPlan: number | null } => {
  if (typeof planValue === 'number') {
    return {
      rawPlan: planValue.toString(),
      numericPlan: planValue
    };
  }

  if (typeof planValue === 'string') {
    const trimmed = planValue.trim();
    if (!trimmed) {
      return { rawPlan: null, numericPlan: null };
    }

    const maybeNumber = Number(trimmed);
    return {
      rawPlan: trimmed,
      numericPlan: Number.isFinite(maybeNumber) ? maybeNumber : null
    };
  }

  return { rawPlan: null, numericPlan: null };
};

export const subscriptionService = {
  async getSubscriptionPlan(userId: string, options?: { forceRefresh?: boolean }): Promise<SubscriptionPlanInfo> {
    const forceRefresh = options?.forceRefresh ?? false;

    if (!forceRefresh && planCache.has(userId)) {
      return planCache.get(userId)!;
    }

    try {
      const subscriptionRef = doc(db, `users/${userId}/account/subscription`);
      const subscriptionSnapshot = await getDoc(subscriptionRef);

      if (!subscriptionSnapshot.exists()) {
        const fallback: SubscriptionPlanInfo = {
          rawPlan: null,
          numericPlan: null,
          tier: 'unknown'
        };
        planCache.set(userId, fallback);
        return fallback;
      }

      const subscriptionData = subscriptionSnapshot.data();
      const planCandidate =
        subscriptionData?.plan ??
        subscriptionData?.planName ??
        subscriptionData?.name ??
        subscriptionData?.tier ??
        null;

      const { rawPlan, numericPlan } = normalizeRawPlan(planCandidate);
      const tier = inferTierFromValue(numericPlan ?? rawPlan);

      const result: SubscriptionPlanInfo = {
        rawPlan,
        numericPlan,
        tier
      };

      planCache.set(userId, result);
      return result;
    } catch (error) {
      console.warn('Erro ao buscar plano de assinatura:', error);
      const fallback: SubscriptionPlanInfo = {
        rawPlan: null,
        numericPlan: null,
        tier: 'unknown'
      };
      planCache.set(userId, fallback);
      return fallback;
    }
  },

  invalidateCache(userId?: string) {
    if (userId) {
      planCache.delete(userId);
      return;
    }
    planCache.clear();
  }
};

export const formatPlanTierLabel = (tier: SubscriptionPlanTier): string => {
  switch (tier) {
    case 'basic':
      return 'Básico';
    case 'intermediate':
      return 'Intermediário';
    case 'advanced':
      return 'Avançado';
    default:
      return 'Plano não definido';
  }
};

export const formatPlanDisplayName = (rawPlan: string | null): string => {
  if (!rawPlan) {
    return 'Plano não definido';
  }

  const normalized = rawPlan
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');

  if (!normalized) {
    return 'Plano não definido';
  }

  if (/^\d+$/.test(normalized)) {
    return `Plano ${normalized}`;
  }

  return normalized;
};

export const inferTierFromPlanValue = inferTierFromValue;


