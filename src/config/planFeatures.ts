import { SubscriptionPlanTier } from '../services/subscriptionService';

export const FEATURE_BLOCK_KEYS = {
  BlockClassDashboard: 'blockClassDashboard',
  BlockStudentSideClassDashboard: 'blockStudentSideClassDashboard'
} as const;

export type FeatureBlockKey = (typeof FEATURE_BLOCK_KEYS)[keyof typeof FEATURE_BLOCK_KEYS];

type PlanFeatureBlocks = Record<SubscriptionPlanTier, FeatureBlockKey[]>;

const PLAN_FEATURE_BLOCKS: PlanFeatureBlocks = {
  basic: [
    FEATURE_BLOCK_KEYS.BlockClassDashboard,
    FEATURE_BLOCK_KEYS.BlockStudentSideClassDashboard
  ],
  intermediate: [],
  advanced: [],
  unknown: [
    FEATURE_BLOCK_KEYS.BlockClassDashboard,
    FEATURE_BLOCK_KEYS.BlockStudentSideClassDashboard
  ]
};

export const isFeatureBlockedForPlan = (tier: SubscriptionPlanTier, feature: FeatureBlockKey): boolean => {
  const features = PLAN_FEATURE_BLOCKS[tier] ?? PLAN_FEATURE_BLOCKS.unknown;
  return features.includes(feature);
};


