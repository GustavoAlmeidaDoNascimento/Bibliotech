import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  subscriptionService,
  SubscriptionPlanInfo,
  SubscriptionPlanTier,
  formatPlanDisplayName,
  formatPlanTierLabel
} from '../services/subscriptionService';
import { FeatureBlockKey, isFeatureBlockedForPlan } from '../config/planFeatures';

interface UseFeatureBlockOptions {
  forceRefresh?: boolean;
}

interface FeatureBlockState {
  loading: boolean;
  isBlocked: boolean;
  planInfo: SubscriptionPlanInfo | null;
  planTierLabel: string;
  planDisplayName: string;
}

const defaultState: FeatureBlockState = {
  loading: true,
  isBlocked: false,
  planInfo: null,
  planTierLabel: formatPlanTierLabel('unknown'),
  planDisplayName: formatPlanDisplayName(null)
};

export const useFeatureBlock = (
  featureKey: FeatureBlockKey,
  options?: UseFeatureBlockOptions
): FeatureBlockState => {
  const { currentUser } = useAuth();
  const [state, setState] = useState<FeatureBlockState>(defaultState);

  useEffect(() => {
    let isMounted = true;

    const loadFeatureState = async () => {
      if (!currentUser) {
        if (isMounted) {
          setState({
            loading: false,
            isBlocked: false,
            planInfo: null,
            planTierLabel: formatPlanTierLabel('unknown'),
            planDisplayName: formatPlanDisplayName(null)
          });
        }
        return;
      }

      if (isMounted) {
        setState((prev) => ({
          ...prev,
          loading: true
        }));
      }

      const planInfo = await subscriptionService.getSubscriptionPlan(currentUser.uid, {
        forceRefresh: options?.forceRefresh
      });

      if (!isMounted) {
        return;
      }

      const planTier: SubscriptionPlanTier = planInfo.tier;

      setState({
        loading: false,
        isBlocked: isFeatureBlockedForPlan(planTier, featureKey),
        planInfo,
        planTierLabel: formatPlanTierLabel(planTier),
        planDisplayName: formatPlanDisplayName(planInfo.rawPlan)
      });
    };

    loadFeatureState();

    return () => {
      isMounted = false;
    };
  }, [currentUser, featureKey, options?.forceRefresh]);

  return state;
};


