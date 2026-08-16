export type ReservationDepositBlockReason =
    | "ACTIVE_CONTRACT"
    | "ACTIVE_RESERVATION"
    | "EXISTING_TENANT";

type ReservationDepositRuleInput = {
    isNewTenantPayload: boolean;
    tenantExists: boolean;
    hasActiveContract: boolean;
    hasActiveReservation: boolean;
};

export const getReservationDepositBlockReason = (
    input: ReservationDepositRuleInput
): ReservationDepositBlockReason | null => {
    if (input.hasActiveContract) {
        return "ACTIVE_CONTRACT";
    }

    if (input.hasActiveReservation) {
        return "ACTIVE_RESERVATION";
    }

    if (input.isNewTenantPayload && input.tenantExists) {
        return "EXISTING_TENANT";
    }

    return null;
};
