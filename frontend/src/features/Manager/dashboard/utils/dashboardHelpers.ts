import type { RentalContract, Invoice } from "../../../../types";
import { getInvoiceType } from "../../../../utils/invoiceDisplay";

export interface MonthlyRevenueItem {
  name: string;
  "Doanh thu": number;
  "Năm trước"?: number;
  invoiceCount?: number;
}

export interface YearlyRevenueItem {
  name: string;
  "Doanh thu": number;
  invoiceCount?: number;
}

export interface RevenueStatsResult {
  monthly: MonthlyRevenueItem[];
  yearly: YearlyRevenueItem[];
  currentMonthRevenue: number;
  previousMonthRevenue: number;
  revenueTrend?: "up" | "down";
  revenueTrendValue?: string;
  unpaidRevenue: number;
  unpaidInvoicesCount: number;
}

export function formatDashboardCurrency(amount: number): string {
  if (amount >= 1000000000) {
    return (amount / 1000000000).toFixed(2) + " tỷ";
  }
  if (amount >= 1000000) {
    return (amount / 1000000).toFixed(0) + " tr";
  }
  return new Intl.NumberFormat("vi-VN").format(amount) + " đ";
}

export function calculateRevenueStats(
  invoices: Invoice[],
  currentYear: number,
  currentMonth: number
): RevenueStatsResult {
  const months = ["T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8", "T9", "T10", "T11", "T12"];
  const monthly: MonthlyRevenueItem[] = months.map((m) => ({
    name: m,
    "Doanh thu": 0,
    "Năm trước": 0,
  }));

  const yearlyMap = new Map<number, number>();
  let currentMonthRevenue = 0;
  let previousMonthRevenue = 0;
  let unpaidRevenue = 0;
  let unpaidInvoicesCount = 0;

  const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
  const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
  const settledContractIds = new Set(
    invoices
      .filter((invoice) => getInvoiceType(invoice) === "FINAL_SETTLEMENT" && invoice.contract_id !== null)
      .map((invoice) => invoice.contract_id)
  );

  for (const invoice of invoices) {
    const amount = Number(invoice.total_amount) || 0;
    const invoiceType = getInvoiceType(invoice);
    const isCoveredBySettlement = invoice.contract_id !== null
      && invoiceType !== "FINAL_SETTLEMENT"
      && invoiceType !== "REFUND"
      && settledContractIds.has(invoice.contract_id);

    if (invoice.status === "UNPAID") {
      if (invoiceType !== "REFUND" && !isCoveredBySettlement) {
        unpaidRevenue += amount;
        unpaidInvoicesCount += 1;
      }
      continue;
    }

    if (invoice.status !== "PAID") continue;

    const paidDate = new Date(invoice.paid_at || invoice.created_at);
    if (Number.isNaN(paidDate.getTime())) continue;

    const yr = paidDate.getFullYear();
    const mo = paidDate.getMonth();

    if (yr === currentYear) {
      if (mo >= 0 && mo < 12) {
        monthly[mo]["Doanh thu"] += amount;
      }
      if (mo === currentMonth) {
        currentMonthRevenue += amount;
      }
    } else if (yr === currentYear - 1) {
      if (mo >= 0 && mo < 12) {
        monthly[mo]["Năm trước"] = (monthly[mo]["Năm trước"] || 0) + amount;
      }
    }

    if (yr === lastMonthYear && mo === lastMonth) {
      previousMonthRevenue += amount;
    }

    yearlyMap.set(yr, (yearlyMap.get(yr) ?? 0) + amount);
  }

  // Tính tỷ lệ tăng trưởng trend doanh thu
  let revenueTrend: "up" | "down" | undefined = undefined;
  let revenueTrendValue: string | undefined = undefined;

  if (previousMonthRevenue > 0) {
    const diff = currentMonthRevenue - previousMonthRevenue;
    const pct = Math.abs(Number(((diff / previousMonthRevenue) * 100).toFixed(1)));
    revenueTrend = diff >= 0 ? "up" : "down";
    revenueTrendValue = `${diff >= 0 ? "+" : "-"}${pct}% so với tháng trước`;
  } else if (currentMonthRevenue > 0) {
    revenueTrend = "up";
    revenueTrendValue = "+100% so với tháng trước";
  }

  const yearly: YearlyRevenueItem[] = [currentYear - 2, currentYear - 1, currentYear].map((yr) => ({
    name: String(yr),
    "Doanh thu": yearlyMap.get(yr) ?? 0,
  }));

  return {
    monthly,
    yearly,
    currentMonthRevenue,
    previousMonthRevenue,
    revenueTrend,
    revenueTrendValue,
    unpaidRevenue,
    unpaidInvoicesCount,
  };
}

export interface ContractExpirationsResult {
  expiredCount: number;
  expiring30Count: number;
  expiring60Count: number;
  expiring90Count: number;
}

export function calculateContractExpirations(
  contracts: Array<Pick<RentalContract, "status" | "end_date">>,
  now: Date
): ContractExpirationsResult {
  const thirtyDaysLater = new Date(now);
  thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);

  const sixtyDaysLater = new Date(now);
  sixtyDaysLater.setDate(sixtyDaysLater.getDate() + 60);

  const ninetyDaysLater = new Date(now);
  ninetyDaysLater.setDate(ninetyDaysLater.getDate() + 90);

  let expiredCount = 0;
  let expiring30Count = 0;
  let expiring60Count = 0;
  let expiring90Count = 0;

  for (const c of contracts) {
    if (c.status !== "ACTIVE") continue;
    const endDate = new Date(c.end_date);
    if (Number.isNaN(endDate.getTime())) continue;

    if (endDate < now) {
      expiredCount++;
    } else if (endDate <= thirtyDaysLater) {
      expiring30Count++;
    } else if (endDate <= sixtyDaysLater) {
      expiring60Count++;
    } else if (endDate <= ninetyDaysLater) {
      expiring90Count++;
    }
  }

  return {
    expiredCount,
    expiring30Count,
    expiring60Count,
    expiring90Count,
  };
}

export interface RoomStatusItem {
  name: string;
  value: number;
  percentage: number;
  color: string;
}

export function calculateRoomStatusData(
  rentedCount: number,
  availableCount: number,
  maintenanceCount: number,
  totalCount: number
): { roomStatusData: RoomStatusItem[]; occupancyRate: number } {
  const occupancyRate = totalCount > 0 ? Math.round((rentedCount / totalCount) * 100) : 0;

  const roomStatusData: RoomStatusItem[] = [
    {
      name: "Đang thuê",
      value: rentedCount,
      percentage: totalCount > 0 ? Math.round((rentedCount / totalCount) * 100) : 0,
      color: "#7C3AED",
    },
    {
      name: "Còn trống",
      value: availableCount,
      percentage: totalCount > 0 ? Math.round((availableCount / totalCount) * 100) : 0,
      color: "#10B981",
    },
    {
      name: "Bảo trì",
      value: maintenanceCount,
      percentage: totalCount > 0 ? Math.round((maintenanceCount / totalCount) * 100) : 0,
      color: "#F59E0B",
    },
  ];

  return { roomStatusData, occupancyRate };
}
