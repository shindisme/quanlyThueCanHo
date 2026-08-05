export const isUtilityTrackedApartment = (
  status: string | null | undefined
) => status === "RENTED" || status === "VACATING_SOON";