import { useState, useCallback, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { RentalContract } from "../../../../types";
import { invoiceService, utilityService } from "../../../../services";
import { generateMonthlyInvoices } from "../../../../services/invoiceService";
import { useAuthStore } from "../../../../stores/auth.store";

// Giới hạn đồng hồ điện nước
const MAX_METER_VALUE = 100000;
const MAX_INPUT_METER = 99999;
const ROLLOVER_LOWER_BOUND = 10000;
const ROLLOVER_UPPER_BOUND = 90000;
const HIGH_ELECTRIC_THRESHOLD = 1000;
const HIGH_WATER_THRESHOLD = 100;

export const CheckoutStep = {
  UTILITY: 1, // Bước 1: Chốt điện nước
  INVOICE: 2, // Bước 2: Tạo hóa đơn tháng cuối
  DEPOSIT: 3, // Bước 3: Đối trừ công nợ và hoàn cọc
  CONFIRM: 4, // Bước 4: Xác nhận hoàn tất trả phòng
} as const;

export type CheckoutStep = (typeof CheckoutStep)[keyof typeof CheckoutStep];

interface UseCheckoutOptions {
  contract: RentalContract | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmCheckout: () => Promise<void> | void;
}

// Lấy ngày hết hạn hóa đơn sau N ngày
function getDueDateAfter(days: number): string {
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + days);
  return dueDate.toISOString().split("T")[0];
}

// Tính sản lượng tiêu thụ điện nước
function calculateConsumption(oldVal: number, newVal: number): number {
  if (newVal >= oldVal) {
    return newVal - oldVal;
  }
  if (oldVal > ROLLOVER_UPPER_BOUND && newVal < ROLLOVER_LOWER_BOUND) {
    return MAX_METER_VALUE - oldVal + newVal;
  }
  return 0;
}

// Sanitize giá trị nhập vào công tơ điện nước
function sanitizeMeterInput(val: number): number {
  if (isNaN(val) || val < 0) return 0;
  if (val > MAX_INPUT_METER) return MAX_INPUT_METER;
  return Math.floor(val);
}

// Helper kiểm tra lỗi hóa đơn đã tồn tại từ API
function isInvoiceAlreadyExistsError(err: unknown): boolean {
  const error = err as { response?: { status?: number; data?: { message?: string } }; message?: string };
  const errorMessage = error.response?.data?.message || error.message || "";
  return (
    error.response?.status === 400 ||
    errorMessage.toLowerCase().includes("tồn tại") ||
    errorMessage.toLowerCase().includes("already exists")
  );
}

// Hàm lấy dữ liệu khởi tạo điện nước và công nợ ban đầu
async function fetchCheckoutInitialData(contract: RentalContract | null, currentMonth: number, currentYear: number) {
  if (!contract) return { electricOld: 0, waterOld: 0, electricNew: 0, waterNew: 0, unpaidAmount: 0, existingReading: null };

  const [readingsRes, invoicesRes] = await Promise.all([
    utilityService.getAll({
      apartment_id: contract.apartment_id,
      limit: 20,
    }).catch((err) => {
      if (import.meta.env.DEV) console.error("Lỗi khi lấy chỉ số điện nước:", err);
      return { data: [] };
    }),
    invoiceService.getAllPage({
      tenant_id: contract.tenant_id,
      status: "UNPAID",
    }).catch((err) => {
      if (import.meta.env.DEV) console.error("Lỗi khi lấy hóa đơn chưa trả:", err);
      return { data: [] };
    }),
  ]);

  const rawReadings = readingsRes.data || [];
  const readings = [...rawReadings].sort((a, b) => {
    if (b.year !== a.year) return b.year - a.year;
    return b.month - a.month;
  });

  const currentReading = readings.find(
    (r) => r.month === currentMonth && r.year === currentYear
  );
  const previousReading = readings.find(
    (r) => !(r.month === currentMonth && r.year === currentYear)
  );

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

  const unpaidInvoices = invoicesRes.data || [];
  const unpaidAmount = unpaidInvoices.reduce(
    (sum: number, inv) => sum + Number(inv.total_amount),
    0
  );

  return {
    electricOld,
    waterOld,
    electricNew,
    waterNew,
    existingReading: currentReading || null,
    unpaidAmount,
  };
}

export function useCheckout({
  contract,
  isOpen,
}: UseCheckoutOptions) {
  const queryClient = useQueryClient();
  const { role } = useAuthStore();
  const [step, setStep] = useState<CheckoutStep>(CheckoutStep.UTILITY);

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
    setUtilityInputs({
      electricOld: null,
      electricNew: null,
      waterOld: null,
      waterNew: null,
    });
    setCheckoutMeta({
      utilitySaved: false,
      hasSkippedInvoice: false,
      hasGeneratedInvoice: false,
    });
    setDialogs({
      skipInvoice: false,
      highConsumption: false,
      terminateConfirm: false,
    });
  }, []);

  // Sync reset state và thông báo khi mở modal
  useEffect(() => {
    if (isOpen) {
      if (role === "ADMIN") {
        toast.error("Tài khoản Admin không có hồ sơ nhân viên để chốt điện nước. Vui lòng sử dụng tài khoản Quản lý tòa nhà.");
      } else if (contract && contract.status !== "ACTIVE") {
        toast.error("Chỉ có thể trả phòng khi hợp đồng đang ở trạng thái Hiệu lực.");
      }
      resetState();
    }
  }, [isOpen, contract, role, resetState]);

  // Query lấy dữ liệu điện nước và công nợ ban đầu
  const { data: initialData, isLoading: loadingData } = useQuery({
    queryKey: ["checkout-initial-data", contract?.id],
    queryFn: () => fetchCheckoutInitialData(contract, currentMonth, currentYear),
    enabled: isOpen && !!contract,
  });

  // Tính số điện nước từ đầu vào
  const electricOld = useMemo(() => {
    if (utilityInputs.electricOld !== null) {
      return utilityInputs.electricOld === "" ? 0 : sanitizeMeterInput(Number(utilityInputs.electricOld));
    }
    return initialData?.electricOld ?? 0;
  }, [utilityInputs.electricOld, initialData?.electricOld]);

  const waterOld = useMemo(() => {
    if (utilityInputs.waterOld !== null) {
      return utilityInputs.waterOld === "" ? 0 : sanitizeMeterInput(Number(utilityInputs.waterOld));
    }
    return initialData?.waterOld ?? 0;
  }, [utilityInputs.waterOld, initialData?.waterOld]);

  const electricNew = useMemo(() => {
    if (utilityInputs.electricNew !== null) {
      return utilityInputs.electricNew === "" ? 0 : sanitizeMeterInput(Number(utilityInputs.electricNew));
    }
    return Math.max(electricOld, initialData?.electricNew ?? 0);
  }, [utilityInputs.electricNew, electricOld, initialData?.electricNew]);

  const waterNew = useMemo(() => {
    if (utilityInputs.waterNew !== null) {
      return utilityInputs.waterNew === "" ? 0 : sanitizeMeterInput(Number(utilityInputs.waterNew));
    }
    return Math.max(waterOld, initialData?.waterNew ?? 0);
  }, [utilityInputs.waterNew, waterOld, initialData?.waterNew]);

  const unpaidAmount = initialData?.unpaidAmount ?? 0;

  const electricConsumption = useMemo(
    () => calculateConsumption(electricOld, electricNew),
    [electricOld, electricNew]
  );

  const waterConsumption = useMemo(
    () => calculateConsumption(waterOld, waterNew),
    [waterOld, waterNew]
  );

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

  const saveUtilityMutation = useMutation({
    mutationFn: async () => {
      if (!contract) return;
      if (initialData?.existingReading) {
        return utilityService.update(initialData.existingReading.id, {
          apartment_id: contract.apartment_id,
          month: currentMonth,
          year: currentYear,
          electric_old: electricOld,
          electric_new: electricNew,
          water_old: waterOld,
          water_new: waterNew,
        });
      }
      return utilityService.create({
        apartment_id: contract.apartment_id,
        month: currentMonth,
        year: currentYear,
        electric_old: electricOld,
        electric_new: electricNew,
        water_old: waterOld,
        water_new: waterNew,
      });
    },
    onSuccess: () => {
      toast.success(initialData?.existingReading ? "Cập nhật chỉ số điện nước thành công!" : "Chốt điện nước phòng thành công!");
      setCheckoutMeta((prev) => ({ ...prev, utilitySaved: true }));
      queryClient.invalidateQueries({ queryKey: ["checkout-initial-data", contract?.id] });
      setStep(CheckoutStep.INVOICE);
    },
    onError: (err: unknown) => {
      const error = err as { response?: { data?: { message?: string } }; message?: string };
      toast.error(error.response?.data?.message || error.message || "Không thể lưu chỉ số điện nước.");
    },
  });

  const generateInvoiceMutation = useMutation({
    mutationFn: async () => {
      if (!contract) return;
      const dueDateString = getDueDateAfter(7);
      return generateMonthlyInvoices({
        month: currentMonth,
        year: currentYear,
        building_id: contract.apartment?.building_id || 0,
        due_date: dueDateString,
        notify: true,
      });
    },
    onSuccess: () => {
      toast.success("Khởi tạo hóa đơn tháng thành công!");
      setCheckoutMeta((prev) => ({ ...prev, hasGeneratedInvoice: true, hasSkippedInvoice: false }));
      queryClient.invalidateQueries({ queryKey: ["checkout-initial-data", contract?.id] });
      setStep(CheckoutStep.DEPOSIT);
    },
    onError: (err: unknown) => {
      if (isInvoiceAlreadyExistsError(err)) {
        toast.info("Đã có hóa đơn cho tháng này.");
        setCheckoutMeta((prev) => ({ ...prev, hasGeneratedInvoice: true, hasSkippedInvoice: false }));
        queryClient.invalidateQueries({ queryKey: ["checkout-initial-data", contract?.id] });
        setStep(CheckoutStep.DEPOSIT);
      } else {
        const error = err as { response?: { data?: { message?: string } }; message?: string };
        toast.error(error.response?.data?.message || error.message || "Khởi tạo hóa đơn tháng cuối thất bại.");
      }
    },
  });

  // Chốt điện nước
  const handleSaveUtility = useCallback(async () => {
    if (!contract || !isUtilityValid) return;

    if (electricConsumption > HIGH_ELECTRIC_THRESHOLD || waterConsumption > HIGH_WATER_THRESHOLD) {
      setDialogs((prev) => ({ ...prev, highConsumption: true }));
      return;
    }

    await saveUtilityMutation.mutateAsync();
  }, [contract, isUtilityValid, electricConsumption, waterConsumption, saveUtilityMutation]);

  // Thực hiện bỏ qua tạo hóa đơn
  const handleSkipInvoice = useCallback(() => {
    setCheckoutMeta((prev) => ({ ...prev, hasSkippedInvoice: true }));
    setDialogs((prev) => ({ ...prev, skipInvoice: false }));
    setStep(CheckoutStep.DEPOSIT);
  }, []);

  // Tính toán tiền hoàn trả cọc và công nợ
  const deposit = Number(contract?.deposit_amount || 0);
  const totalDeductions = unpaidAmount;
  const netRefund = useMemo(() => deposit - totalDeductions, [deposit, totalDeductions]);
  const isUtilitySaved = checkoutMeta.utilitySaved || !!initialData?.existingReading;

  return {
    step,
    setStep,
    loadingData,
    isProcessing: saveUtilityMutation.isPending || generateInvoiceMutation.isPending,
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
      isUtilitySaved,
      electricError,
      waterError,
      isUtilityValid,
    },
    financial: {
      deposit,
      unpaidAmount,
      totalDeductions,
      netRefund,
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
      executeSaveUtility: () => saveUtilityMutation.mutateAsync(),
      handleSaveUtility,
      handleGenerateInvoice: () => generateInvoiceMutation.mutateAsync(),
      handleSkipInvoice,
    },
    meta: {
      currentMonth,
      currentYear,
      hasSkippedInvoice: checkoutMeta.hasSkippedInvoice,
      hasGeneratedInvoice: checkoutMeta.hasGeneratedInvoice,
      savingUtility: saveUtilityMutation.isPending,
      generatingInvoice: generateInvoiceMutation.isPending,
    },
  };
}
