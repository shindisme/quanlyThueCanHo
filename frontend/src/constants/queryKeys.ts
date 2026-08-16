
type QueryKeyId = string | number | null | undefined;

export const queryKeys = {
  users: {
    all: ["users"] as const,
    list: (filters?: Record<string, unknown>) => ["users", "list", filters] as const,
    detail: (id: QueryKeyId) => ["users", "detail", id] as const,
  },
  tenants: {
    all: ["tenants"] as const,
    list: (filters?: Record<string, unknown>) => ["tenants", "list", filters] as const,
    detail: (id: QueryKeyId) => ["tenants", "detail", id] as const,
    profile: () => ["tenants", "profile"] as const,
    byUser: (userId?: number) => ["tenants", "by-user", userId] as const,
  },
  staff: {
    all: ["staff"] as const,
    list: (filters?: Record<string, unknown>) => ["staff", "list", filters] as const,
    detail: (id: QueryKeyId) => ["staff", "detail", id] as const,
    byUser: (userId?: number) => ["staff", "by-user", userId] as const,
    technicians: (buildingId?: number | null) => ["staff", "technicians", buildingId] as const,
  },
  buildings: {
    all: ["buildings"] as const,
    list: (filters?: Record<string, unknown>) => ["buildings", "list", filters] as const,
    detail: (id: QueryKeyId) => ["buildings", "detail", id] as const,
  },
  apartments: {
    all: ["apartments"] as const,
    list: (filters?: Record<string, unknown>) => ["apartments", "list", filters] as const,
    detail: (id: QueryKeyId) => ["apartments", "detail", id] as const,
  },
  contracts: {
    all: ["contracts"] as const,
    list: (filters?: Record<string, unknown>) => ["contracts", "list", filters] as const,
    detail: (id: QueryKeyId) => ["contracts", "detail", id] as const,
  },
  terminations: {
    all: ["contract-terminations"] as const,
    list: (filters?: Record<string, unknown>) => ["contract-terminations", "list", filters] as const,
    detail: (id: QueryKeyId) => ["contract-terminations", "detail", id] as const,
    checkout: (contractId?: number) => ["contract-terminations", "checkout", contractId] as const,
  },
  reviews: {
    all: ["reviews"] as const,
    apartment: (id: string | number) => ["reviews", "apartment", id] as const,
  },
  invoices: {
    all: ["invoices"] as const,
    list: (filters?: Record<string, unknown>) => ["invoices", "list", filters] as const,
    tenantList: (filters?: Record<string, unknown>) => ["invoices", "tenant", filters] as const,
    detail: (id: QueryKeyId) => ["invoices", "detail", id] as const,
    byCode: (code?: string | null) => ["invoices", "by-code", code] as const,
  },
  payments: {
    all: ["payments"] as const,
    list: (filters?: Record<string, unknown>) => ["payments", "list", filters] as const,
    tenantList: (filters?: Record<string, unknown>) => ["payments", "tenant", filters] as const,
    detail: (id: QueryKeyId) => ["payments", "detail", id] as const,
  },
  maintenance: {
    all: ["maintenance"] as const,
    list: (filters?: Record<string, unknown>) => ["maintenance", "list", filters] as const,
    tenantList: (filters?: Record<string, unknown>) => ["maintenance", "tenant", filters] as const,
    detail: (id: QueryKeyId) => ["maintenance", "detail", id] as const,
    fallback: () => ["maintenance", "fallback"] as const,
  },
  schedules: {
    all: ["schedules"] as const,
    list: (filters?: Record<string, unknown>) => ["schedules", "list", filters] as const,
    detail: (id: QueryKeyId) => ["schedules", "detail", id] as const,
    availability: (apartmentId?: number, date?: string) => ["schedules", "availability", apartmentId, date] as const,
  },
  utilities: {
    all: ["utilities"] as const,
    list: (filters?: Record<string, unknown>) => ["utilities", "list", filters] as const,
    tenantList: (filters?: Record<string, unknown>) => ["utilities", "tenant", filters] as const,
    detail: (id: QueryKeyId) => ["utilities", "detail", id] as const,
    previousReading: (apartmentId?: number | null, month?: number, year?: number) =>
      ["utilities", "previous-reading", apartmentId, month, year] as const,
  },
  occupants: {
    all: ["occupants"] as const,
    tenantList: () => ["occupants", "tenant"] as const,
    byTenant: (tenantId?: number) => ["occupants", "by-tenant", tenantId] as const,
  },
  reservations: {
    all: ["reservations"] as const,
    list: (filters?: Record<string, unknown>) => ["reservations", "list", filters] as const,
    detail: (id: QueryKeyId) => ["reservations", "detail", id] as const,
    apartment: (apartmentId?: string | number) => ["reservations", "apartment", apartmentId] as const,
  },
  notifications: {
    all: ["notifications"] as const,
    list: (filters?: Record<string, unknown>) => ["notifications", "list", filters] as const,
    detail: (id: QueryKeyId) => ["notifications", "detail", id] as const,
    header: () => ["notifications", "header"] as const,
  },
} as const;
