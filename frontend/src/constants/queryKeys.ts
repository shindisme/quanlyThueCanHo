
export const QUERY_KEYS = {
  USERS: ["users"],
  TENANTS: ["tenants"],
  STAFF: ["staff"],
  CONTRACTS: ["contracts"],
  TERMINATIONS: ["contract-terminations"],
  BUILDINGS: ["buildings"],
  APARTMENTS: ["apartments"],
  INVOICES: ["invoices"],
  PAYMENTS: ["payments"],
  MAINTENANCE: ["maintenance"],
  SCHEDULES: ["schedules"],
  UTILITIES: ["utilities"],
  NOTIFICATIONS: ["notifications"],
} as const;

export const queryKeys = {
  users: {
    all: ["users"] as const,
    list: (filters?: Record<string, unknown>) => ["users", "list", filters] as const,
    detail: (id: string | number) => ["users", "detail", id] as const,
  },
  tenants: {
    all: ["tenants"] as const,
    list: (filters?: Record<string, unknown>) => ["tenants", "list", filters] as const,
    detail: (id: string | number) => ["tenants", "detail", id] as const,
  },
  staff: {
    all: ["staff"] as const,
    list: (filters?: Record<string, unknown>) => ["staff", "list", filters] as const,
    detail: (id: string | number) => ["staff", "detail", id] as const,
  },
  buildings: {
    all: ["buildings"] as const,
    list: (filters?: Record<string, unknown>) => ["buildings", "list", filters] as const,
    detail: (id: string | number) => ["buildings", "detail", id] as const,
  },
  apartments: {
    all: ["apartments"] as const,
    list: (filters?: Record<string, unknown>) => ["apartments", "list", filters] as const,
    detail: (id: string | number) => ["apartments", "detail", id] as const,
  },
  contracts: {
    all: ["contracts"] as const,
    list: (filters?: Record<string, unknown>) => ["contracts", "list", filters] as const,
    detail: (id: string | number) => ["contracts", "detail", id] as const,
  },
  terminations: {
    all: ["contract-terminations"] as const,
    list: (filters?: Record<string, unknown>) => ["contract-terminations", "list", filters] as const,
    detail: (id: string | number) => ["contract-terminations", "detail", id] as const,
  },
  invoices: {
    all: ["invoices"] as const,
    list: (filters?: Record<string, unknown>) => ["invoices", "list", filters] as const,
    detail: (id: string | number) => ["invoices", "detail", id] as const,
  },
  payments: {
    all: ["payments"] as const,
    list: (filters?: Record<string, unknown>) => ["payments", "list", filters] as const,
    detail: (id: string | number) => ["payments", "detail", id] as const,
  },
  maintenance: {
    all: ["maintenance"] as const,
    list: (filters?: Record<string, unknown>) => ["maintenance", "list", filters] as const,
    detail: (id: string | number) => ["maintenance", "detail", id] as const,
  },
  schedules: {
    all: ["schedules"] as const,
    list: (filters?: Record<string, unknown>) => ["schedules", "list", filters] as const,
    detail: (id: string | number) => ["schedules", "detail", id] as const,
  },
  utilities: {
    all: ["utilities"] as const,
    list: (filters?: Record<string, unknown>) => ["utilities", "list", filters] as const,
    detail: (id: string | number) => ["utilities", "detail", id] as const,
  },
  notifications: {
    all: ["notifications"] as const,
    list: (filters?: Record<string, unknown>) => ["notifications", "list", filters] as const,
    detail: (id: string | number) => ["notifications", "detail", id] as const,
  },
} as const;


