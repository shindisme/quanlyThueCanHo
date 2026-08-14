type ReservationTenantSource = {
  tenant_id?: number | null;
  tenant?: {
    id?: number | null;
  } | null;
} | null | undefined;

export function getReservationTenantId(reservation: ReservationTenantSource) {
  return reservation?.tenant_id ?? reservation?.tenant?.id ?? undefined;
}
