"use client";

import { useCallback } from "react";
import { usePremiumModal } from "@/lib/premium-modal-context";
import { isAtPlanLimit, isUpgradeRequiredError, hasPlanFeature } from "@/lib/plan-limit";

export function usePlanUpgrade() {
  const { openPremium } = usePremiumModal();

  const promptUpgradeIfAtLimit = useCallback(
    (used: number, limit: number | null | undefined) => {
      if (isAtPlanLimit(used, limit)) {
        openPremium();
        return true;
      }
      return false;
    },
    [openPremium],
  );

  const promptUpgradeIfFeatureDisabled = useCallback(
    (features: Record<string, unknown> | undefined, key: string) => {
      if (!hasPlanFeature(features, key)) {
        openPremium();
        return true;
      }
      return false;
    },
    [openPremium],
  );

  const handleUpgradeError = useCallback(
    (error: unknown, onBlocked?: () => void) => {
      if (isUpgradeRequiredError(error)) {
        onBlocked?.();
        openPremium();
        return true;
      }
      return false;
    },
    [openPremium],
  );

  return { promptUpgradeIfAtLimit, promptUpgradeIfFeatureDisabled, handleUpgradeError, openPremium };
}
