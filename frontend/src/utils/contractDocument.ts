import type { Apartment, RentalContract } from "../types";

export function getContractDurationText(startDate?: string, endDate?: string): string {
  if (!startDate || !endDate) return "12 tháng";

  const start = new Date(startDate);
  const end = new Date(endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return "-";

  const totalDays = Math.round((end.getTime() - start.getTime()) / 86_400_000);
  const months = Math.round(totalDays / 30.4375);

  if (months <= 0) return `${Math.max(totalDays, 0)} ngày`;
  if (months % 12 === 0) return `${months / 12} năm`;
  if (months < 12) return `${months} tháng`;

  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;
  return `${years} năm ${remainingMonths} tháng`;
}

export function getContractOccupancyPricing(
  contract: RentalContract,
  apartment?: Apartment | null
) {
  const maxOccupants = contract.max_occupants ?? (
    apartment ? Math.max(2, apartment.bedrooms * 2) : 2
  );
  const actualOccupants = contract.actual_occupants ?? 1;
  const excessOccupants = Math.max(actualOccupants - maxOccupants, 0);
  const excessSurcharge = excessOccupants * 1_000_000;
  const baseRent = apartment?.rental_price
    ?? Math.max(Number(contract.monthly_rent) - excessSurcharge, 0);

  return {
    maxOccupants,
    actualOccupants,
    excessOccupants,
    excessSurcharge,
    baseRent,
  };
}

export function getContractSignedDate(contract: RentalContract): Date {
  const signedDate = new Date(contract.signedAt || contract.created_at || Date.now());
  return Number.isNaN(signedDate.getTime()) ? new Date() : signedDate;
}
