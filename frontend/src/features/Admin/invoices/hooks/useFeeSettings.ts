import { useState, useCallback } from "react";
import { readFeeSettings, saveFeeSettings, type FeeSettings } from "../../../../utils/feeSettings";

export function useFeeSettings() {
  const [feeSettings, setFeeSettings] = useState<FeeSettings>(() => readFeeSettings());

  const updateFeeSettings = useCallback((newSettings: Partial<FeeSettings>) => {
    setFeeSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      saveFeeSettings(updated);
      return updated;
    });
  }, []);

  return {
    feeSettings,
    updateFeeSettings,
  };
}
