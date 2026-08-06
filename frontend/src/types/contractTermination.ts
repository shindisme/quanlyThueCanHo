import type { RentalContract } from "./contract";
import type { Invoice } from "./invoice";
import type {
  ContractTerminationType,
  ContractTerminationStatus,
  DepositPolicy,
  SettlementFinancialStatus,
} from "../constants/enums";

export type {
  ContractTerminationType,
  ContractTerminationStatus,
  DepositPolicy,
  SettlementFinancialStatus,
};

export interface ContractTerminationDamage {
  id?: number;
  termination_id?: number;
  description: string;
  amount: number;
  note?: string | null;
}

export interface ContractSettlement {
  id?: number;
  termination_id?: number;
  final_invoice_id?: number | null;
  deposit_paid: number;
  eligible_deposit: number;
  outstanding_debt: number;
  final_rent: number;
  final_electricity: number;
  final_water: number;
  final_service_fee: number;
  other_charges: number;
  damage_amount: number;
  deposit_applied: number;
  refund_amount: number;
  additional_amount_due: number;
  financial_status: SettlementFinancialStatus;
  final_invoice?: Invoice | null;
}

export interface ContractTermination {
  id: number;
  contract_id: number;
  type: ContractTerminationType;
  status: ContractTerminationStatus;
  requested_end_date: string;
  effective_end_date?: string | null;
  reason?: string | null;
  notice_days: number;
  deposit_policy: DepositPolicy;
  refund_rate: number;
  requested_by?: number | null;
  requested_at: string;
  approved_by?: number | null;
  approved_at?: string | null;
  rejected_reason?: string | null;
  completed_at?: string | null;
  inspection_note?: string | null;
  final_electricity_old?: number | null;
  final_electricity_new?: number | null;
  final_water_old?: number | null;
  final_water_new?: number | null;
  requires_maintenance: boolean;
  contract?: RentalContract;
  damages?: ContractTerminationDamage[];
  settlement?: ContractSettlement | null;
}

export interface ContractTerminationQuery {
  contract_id?: number;
  status?: ContractTerminationStatus;
  type?: ContractTerminationType;
  page?: number;
  limit?: number;
}

export interface TerminationInspectionPayload {
  final_rent?: number;
  final_electricity?: number;
  final_water?: number;
  final_service_fee?: number;
  other_charges?: number;
  final_electricity_old?: number;
  final_electricity_new?: number;
  final_water_old?: number;
  final_water_new?: number;
  requires_maintenance?: boolean;
  deposit_policy?: DepositPolicy;
  inspection_note?: string;
  damage_items?: ContractTerminationDamage[];
}

export type SettlementPayload = Pick<
  TerminationInspectionPayload,
  "final_rent" | "final_electricity" | "final_water" | "final_service_fee" | "other_charges"
>;

export interface OverdueTerminationCandidate {
  contract: RentalContract;
  overdue_amount: number;
  overdue_invoice_count?: number;
}

