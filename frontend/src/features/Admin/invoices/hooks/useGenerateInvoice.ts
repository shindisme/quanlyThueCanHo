import { useState, useEffect, useMemo, useCallback } from "react";
import { toast } from "sonner";
import { useFeeSettings } from "./useFeeSettings";
import { formatDateToISO } from "../../../../utils/date";
import type { GenerateMonthlyInvoicesPayload } from "../../../../types";

interface UseGenerateInvoiceOptions {
  isOpen?: boolean;
  role?: string | null;
  managedBuildingId?: number | null;
  onGenerate: (payload: GenerateMonthlyInvoicesPayload) => void;
}

export function useGenerateInvoice({ isOpen, role, managedBuildingId, onGenerate }: UseGenerateInvoiceOptions) {
  const currentMonth = useMemo(() => new Date().getMonth() + 1, []);
  const currentYear = useMemo(() => new Date().getFullYear(), []);

  const [month, setMonth] = useState(String(currentMonth));
  const [year, setYear] = useState(String(currentYear));
  const [buildingId, setBuildingId] = useState(
    role === "MANAGER" && managedBuildingId ? String(managedBuildingId) : ""
  );

  const getDefaultDueDate = useCallback(() => {
    const d = new Date();
    d.setDate(d.getDate() + 10);
    return formatDateToISO(d);
  }, []);

  const [dueDate, setDueDate] = useState(getDefaultDueDate());
  const [notify, setNotify] = useState(true);

  const { feeSettings } = useFeeSettings();
  const [managementFeePerM2, setManagementFeePerM2] = useState(() => String(feeSettings.managementFeePerM2));
  const [internetFee, setInternetFee] = useState(() => String(feeSettings.internetRate));

  useEffect(() => {
    if (isOpen) {
      setMonth(String(currentMonth));
      setYear(String(currentYear));
      setBuildingId(role === "MANAGER" && managedBuildingId ? String(managedBuildingId) : "");
      setDueDate(getDefaultDueDate());
      setNotify(true);
    }
  }, [isOpen, role, managedBuildingId, currentMonth, currentYear, getDefaultDueDate]);

  const handleDateChange = (date: Date | null) => {
    setDueDate(formatDateToISO(date));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!buildingId) {
      toast.error("Vui lòng chọn tòa nhà!");
      return;
    }

    const payload: GenerateMonthlyInvoicesPayload = {
      month: Number(month),
      year: Number(year),
      building_id: Number(buildingId),
      due_date: new Date(dueDate).toISOString(),
      management_fee_per_m2: Number(managementFeePerM2),
      electric_tier_prices: feeSettings.electricityRates,
      water_tier_prices: feeSettings.waterRates,
      internet_fee: Number(internetFee),
      notify,
    };
    onGenerate(payload);
  };

  const monthOptions = useMemo(
    () => Array.from({ length: 12 }, (_, i) => ({ value: String(i + 1), label: `Tháng ${i + 1}` })),
    []
  );

  const yearOptions = useMemo(
    () =>
      Array.from({ length: 5 }, (_, i) => {
        const y = currentYear - 2 + i;
        return { value: String(y), label: `Năm ${y}` };
      }),
    [currentYear]
  );

  return {
    month,
    setMonth,
    year,
    setYear,
    buildingId,
    setBuildingId,
    dueDate,
    handleDateChange,
    notify,
    setNotify,
    managementFeePerM2,
    setManagementFeePerM2,
    internetFee,
    setInternetFee,
    feeSettings,
    handleSubmit,
    monthOptions,
    yearOptions,
  };
}
