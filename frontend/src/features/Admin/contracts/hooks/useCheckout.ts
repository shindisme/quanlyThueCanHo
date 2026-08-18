import { useState, useCallback, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type {
  TerminationSettlementPreview,
  ContractTermination,
  TerminationDamageItem,
  DepositPolicy,
  RentalContract,
  TerminationInspectionPayload,
} from "../../../../types";
import { contractTerminationService, invoiceService, utilityService } from "../../../../services";
import { queryKeys } from "../../../../constants/queryKeys";

const MAX_METER_VALUE = 100000;
const MAX_INPUT_METER = 99999;
const ROLLOVER_LOWER_BOUND = 10000;
const ROLLOVER_UPPER_BOUND = 90000;
const HIGH_ELECTRIC_THRESHOLD = 1000;
const HIGH_WATER_THRESHOLD = 100;

export const CheckoutStep = {
  UTILITY: 1,
  INVOICE: 2,
  DEPOSIT: 3,
  CONFIRM: 4,
} as const;

export type CheckoutStep = (typeof CheckoutStep)[keyof typeof CheckoutStep];

interface UseCheckoutOptions {
  contract: RentalContract | null;
  termination: ContractTermination | null;
  isOpen: boolean;
  onClose: (options?: { completed?: boolean }) => void;
}

function calculateConsumption(oldVal: number, newVal: number): number {
  if (newVal >= oldVal) return newVal - oldVal;
  if (oldVal > ROLLOVER_UPPER_BOUND && newVal < ROLLOVER_LOWER_BOUND) {
    return MAX_METER_VALUE - oldVal + newVal;
  }
  return 0;
}

function sanitizeMeterInput(val: number): number {
  if (Number.isNaN(val) || val < 0) return 0;
  if (val > MAX_INPUT_METER) return MAX_INPUT_METER;
  return Math.floor(val);
}

async function fetchCheckoutInitialData(contract: RentalContract | null, currentMonth: number, currentYear: number) {
  if (!contract) {
    return { electricOld: 0, waterOld: 0, electricNew: 0, waterNew: 0, unpaidAmount: 0, unpaidInvoices: [], existingReading: null };
  }

  const [readingsRes, invoicesContractRes] = await Promise.all([
    utilityService.getAll({
      apartment_id: contract.apartment_id,
      limit: 20,
    }).catch((err) => {
      if (import.meta.env.DEV) console.error("Lỗi khi lấy chỉ số điện nước:", err);
      return { data: [] };
    }),
    invoiceService.getAllPage({
      contract_id: contract.id,
      status: "UNPAID",
    }).catch((err) => {
      if (import.meta.env.DEV) console.error("Lỗi khi lấy hóa đơn chưa trả theo hợp đồng:", err);
      return { data: [] };
    }),
  ]);

  const readings = [...(readingsRes.data || [])].sort((a, b) => {
    if (b.year !== a.year) return b.year - a.year;
    return b.month - a.month;
  });

  const currentReading = readings.find((r) => r.month === currentMonth && r.year === currentYear);
  const previousReading = readings.find((r) => !(r.month === currentMonth && r.year === currentYear));

  let electricOld = 0;
  let waterOld = 0;
  let electricNew = 0;
  let waterNew = 0;

  if (currentReading) {
    electricOld = currentReading.electric_old;
    electricNew = currentReading.electric_new;
    waterOld = currentReading.water_old;
    waterNew = currentReading.water_new;
  } else if (previousReading) {
    electricOld = previousReading.electric_new;
    waterOld = previousReading.water_new;
    electricNew = electricOld;
    waterNew = waterOld;
  }

  const unpaidInvoices = invoicesContractRes.data || [];
  const unpaidAmount = unpaidInvoices.reduce((sum, inv) => sum + Number(inv.total_amount), 0);

  return {
    electricOld,
    waterOld,
    electricNew,
    waterNew,
    existingReading: currentReading || null,
    unpaidAmount,
    unpaidInvoices,
  };
}

export function useCheckout({ contract, termination, isOpen, onClose }: UseCheckoutOptions) {
  const queryClient = useQueryClient();
  const [step, setStep] = useState<CheckoutStep>(CheckoutStep.UTILITY);
  const [settlementPreview, setSettlementPreview] = useState<TerminationSettlementPreview | null>(null);
  const [damageItems, setDamageItems] = useState<TerminationDamageItem[]>([]);
  const [depositPolicy, setDepositPolicy] = useState<DepositPolicy>("REFUNDABLE");

  const [utilityInputs, setUtilityInputs] = useState<{
    electricOld: string | null;
    electricNew: string | null;
    waterOld: string | null;
    waterNew: string | null;
  }>({
    electricOld: null,
    electricNew: null,
    waterOld: null,
    waterNew: null,
  });

  const [dialogs, setDialogs] = useState({
    skipInvoice: false,
    highConsumption: false,
    terminateConfirm: false,
  });

  const [checkoutMeta, setCheckoutMeta] = useState({
    utilitySaved: false,
    hasSkippedInvoice: false,
    hasGeneratedInvoice: false,
  });

  const currentDate = useMemo(() => new Date(), []);
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();

  const resetState = useCallback(() => {
    setStep(CheckoutStep.UTILITY);
    setSettlementPreview(null);
    setUtilityInputs({ electricOld: null, electricNew: null, waterOld: null, waterNew: null });
    setDamageItems([]);
    setDepositPolicy(termination?.deposit_policy ?? "REFUNDABLE");
    setCheckoutMeta({ utilitySaved: false, hasSkippedInvoice: false, hasGeneratedInvoice: false });
    setDialogs({ skipInvoice: false, highConsumption: false, terminateConfirm: false });
  }, [termination]);

  useEffect(() => {
    if (isOpen) resetState();
  }, [isOpen, resetState]);

  const { data: initialData, isLoading: loadingData } = useQuery({
    queryKey: queryKeys.terminations.checkout(contract?.id),
    queryFn: () => fetchCheckoutInitialData(contract, currentMonth, currentYear),
    enabled: isOpen && !!contract,
  });

  const electricOld = useMemo(() => {
    if (utilityInputs.electricOld !== null) return utilityInputs.electricOld === "" ? 0 : sanitizeMeterInput(Number(utilityInputs.electricOld));
    return initialData?.electricOld ?? 0;
  }, [utilityInputs.electricOld, initialData?.electricOld]);

  const waterOld = useMemo(() => {
    if (utilityInputs.waterOld !== null) return utilityInputs.waterOld === "" ? 0 : sanitizeMeterInput(Number(utilityInputs.waterOld));
    return initialData?.waterOld ?? 0;
  }, [utilityInputs.waterOld, initialData?.waterOld]);

  const electricNew = useMemo(() => {
    if (utilityInputs.electricNew !== null) return utilityInputs.electricNew === "" ? 0 : sanitizeMeterInput(Number(utilityInputs.electricNew));
    return Math.max(electricOld, initialData?.electricNew ?? 0);
  }, [utilityInputs.electricNew, electricOld, initialData?.electricNew]);

  const waterNew = useMemo(() => {
    if (utilityInputs.waterNew !== null) return utilityInputs.waterNew === "" ? 0 : sanitizeMeterInput(Number(utilityInputs.waterNew));
    return Math.max(waterOld, initialData?.waterNew ?? 0);
  }, [utilityInputs.waterNew, waterOld, initialData?.waterNew]);

  const electricConsumption = useMemo(() => calculateConsumption(electricOld, electricNew), [electricOld, electricNew]);
  const waterConsumption = useMemo(() => calculateConsumption(waterOld, waterNew), [waterOld, waterNew]);
  const isElectricRollover = electricOld > ROLLOVER_UPPER_BOUND && electricNew < ROLLOVER_LOWER_BOUND;
  const isWaterRollover = waterOld > ROLLOVER_UPPER_BOUND && waterNew < ROLLOVER_LOWER_BOUND;

  const electricError = useMemo(
    () => (electricNew < electricOld && !isElectricRollover ? "Chỉ số điện mới không được nhỏ hơn chỉ số cũ." : null),
    [electricNew, electricOld, isElectricRollover]
  );

  const waterError = useMemo(
    () => (waterNew < waterOld && !isWaterRollover ? "Chỉ số nước mới không được nhỏ hơn chỉ số cũ." : null),
    [waterNew, waterOld, isWaterRollover]
  );

  const isUtilityValid = !electricError && !waterError;
  const activeDamageItems = useMemo(
    () => damageItems
      .filter((item) => item.description.trim() || Number(item.amount) > 0)
      .map((item) => ({
        description: item.description.trim(),
        amount: Number(item.amount || 0),
        note: item.note ?? undefined,
      })),
    [damageItems]
  );

  const damageError = useMemo(() => {
    const invalid = damageItems.find((item) => {
      const hasName = item.description.trim().length > 0;
      const amount = Number(item.amount || 0);
      return (hasName && amount <= 0) || (!hasName && amount > 0);
    });

    if (!invalid) return null;
    return "Vui lòng nhập đủ tên cơ sở vật chất và số tiền đền bù lớn hơn 0.";
  }, [damageItems]);

  const buildSettlementPayload = useCallback((policy = depositPolicy): TerminationInspectionPayload => ({
    final_electricity_old: electricOld,
    final_electricity_new: electricNew,
    final_water_old: waterOld,
    final_water_new: waterNew,
    requires_maintenance: false,
    deposit_policy: policy,
    damage_items: activeDamageItems,
  }), [activeDamageItems, depositPolicy, electricOld, electricNew, waterOld, waterNew]);

  const markUtilityDone = useCallback(async () => {
    setCheckoutMeta((prev) => ({ ...prev, utilitySaved: true }));
    setStep(CheckoutStep.INVOICE);
  }, []);

  const previewMutation = useMutation({
    mutationFn: async (policy?: DepositPolicy) => {
      if (!termination) throw new Error("Không tìm thấy yêu cầu thanh lý để quyết toán.");
      const payload = buildSettlementPayload(policy);
      return contractTerminationService.previewSettlement(termination.id, payload);
    },
    onSuccess: (settlement) => {
      setSettlementPreview(settlement);
      setCheckoutMeta((prev) => ({ ...prev, hasGeneratedInvoice: true, hasSkippedInvoice: false }));
      setStep(CheckoutStep.DEPOSIT);
    },
    onError: (err: unknown) => {
      const error = err as { response?: { data?: { message?: string; error?: string } }; message?: string };
      toast.error(error.response?.data?.message || error.response?.data?.error || error.message || "Không thể tính quyết toán.");
    },
  });

  const completeMutation = useMutation({
    mutationFn: async () => {
      if (!termination) throw new Error("Không tìm thấy yêu cầu thanh lý để hoàn tất bàn giao.");
      return contractTerminationService.completeHandover(termination.id, buildSettlementPayload());
    },
    onSuccess: async () => {
      toast.success("Hoàn tất bàn giao và thanh lý hợp đồng thành công!");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.terminations.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.contracts.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.apartments.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.invoices.all }),
      ]);
      onClose({ completed: true });
    },
    onError: (err: unknown) => {
      const error = err as { response?: { data?: { message?: string; error?: string } }; message?: string };
      toast.error(error.response?.data?.message || error.response?.data?.error || error.message || "Không thể hoàn tất bàn giao.");
    },
  });

  const handleSaveUtility = useCallback(async () => {
    if (!contract || !isUtilityValid) return;
    if (electricConsumption > HIGH_ELECTRIC_THRESHOLD || waterConsumption > HIGH_WATER_THRESHOLD) {
      setDialogs((prev) => ({ ...prev, highConsumption: true }));
      return;
    }
    await markUtilityDone();
  }, [contract, isUtilityValid, electricConsumption, waterConsumption, markUtilityDone]);

  const handleSkipInvoice = useCallback(async () => {
    setCheckoutMeta((prev) => ({ ...prev, hasSkippedInvoice: true }));
    setDialogs((prev) => ({ ...prev, skipInvoice: false }));
    setStep(CheckoutStep.DEPOSIT);
  }, []);

  const setDamageDescription = useCallback((index: number, description: string) => {
    setDamageItems((prev) => prev.map((item, itemIndex) => itemIndex === index ? { ...item, description } : item));
  }, []);

  const setDamageAmount = useCallback((index: number, amount: number | string) => {
    const value = Math.max(Number(amount || 0), 0);
    setDamageItems((prev) => prev.map((item, itemIndex) => itemIndex === index ? { ...item, amount: value } : item));
  }, []);

  const addDamageItem = useCallback(() => {
    setDamageItems((prev) => [...prev, { description: "", amount: 0 }]);
  }, []);

  const removeDamageItem = useCallback((index: number) => {
    setDamageItems((prev) => prev.filter((_, itemIndex) => itemIndex !== index));
  }, []);

  const handleDepositPolicyChange = useCallback((policy: DepositPolicy) => {
    setDepositPolicy(policy);
    if (settlementPreview && termination) {
      previewMutation.mutateAsync(policy).catch(() => undefined);
    }
  }, [previewMutation, settlementPreview, termination]);

  const deposit = Number(settlementPreview?.deposit_paid ?? contract?.deposit_amount ?? 0);
  const unpaidAmount = Number(settlementPreview?.outstanding_debt ?? initialData?.unpaidAmount ?? 0);
  const unpaidInvoices = initialData?.unpaidInvoices ?? [];
  const netRefund = settlementPreview
    ? Number(settlementPreview.refund_amount) > 0
      ? Number(settlementPreview.refund_amount)
      : -Number(settlementPreview.additional_amount_due)
    : deposit - unpaidAmount;
  const totalDeductions = settlementPreview ? Math.max(deposit - netRefund, 0) : unpaidAmount;

  return {
    step,
    setStep,
    loadingData,
    isProcessing: previewMutation.isPending || completeMutation.isPending,
    utilityForm: {
      electricOld,
      electricOldInput: utilityInputs.electricOld,
      setElectricOldInput: (val: string | null) => setUtilityInputs((prev) => ({ ...prev, electricOld: val })),
      electricNew,
      electricNewInput: utilityInputs.electricNew,
      setElectricNewInput: (val: string | null) => setUtilityInputs((prev) => ({ ...prev, electricNew: val })),
      waterOld,
      waterOldInput: utilityInputs.waterOld,
      setWaterOldInput: (val: string | null) => setUtilityInputs((prev) => ({ ...prev, waterOld: val })),
      waterNew,
      waterNewInput: utilityInputs.waterNew,
      setWaterNewInput: (val: string | null) => setUtilityInputs((prev) => ({ ...prev, waterNew: val })),
      electricConsumption,
      waterConsumption,
      isUtilitySaved: checkoutMeta.utilitySaved,
      electricError,
      waterError,
      isUtilityValid,
    },
    financial: {
      deposit,
      unpaidAmount,
      unpaidInvoices,
      totalDeductions,
      netRefund,
      settlementPreview,
      depositPolicy,
    },
    damageForm: {
      damageItems,
      damageError,
      setDamageDescription,
      setDamageAmount,
      addDamageItem,
      removeDamageItem,
    },
    dialogs: {
      skipInvoice: {
        isOpen: dialogs.skipInvoice,
        setIsOpen: (val: boolean) => setDialogs((prev) => ({ ...prev, skipInvoice: val })),
      },
      highConsumption: {
        isOpen: dialogs.highConsumption,
        setIsOpen: (val: boolean) => setDialogs((prev) => ({ ...prev, highConsumption: val })),
      },
      terminateConfirm: {
        isOpen: dialogs.terminateConfirm,
        setIsOpen: (val: boolean) => setDialogs((prev) => ({ ...prev, terminateConfirm: val })),
      },
    },
    actions: {
      executeSaveUtility: markUtilityDone,
      handleSaveUtility,
      handleGenerateInvoice: () => previewMutation.mutateAsync(depositPolicy),
      handleSkipInvoice,
      handleDepositPolicyChange,
      handleCompleteHandover: () => completeMutation.mutateAsync(),
    },
    meta: {
      currentMonth,
      currentYear,
      hasSkippedInvoice: checkoutMeta.hasSkippedInvoice,
      hasGeneratedInvoice: checkoutMeta.hasGeneratedInvoice,
      savingUtility: false,
      generatingInvoice: previewMutation.isPending,
      completingHandover: completeMutation.isPending,
    },
  };
}
