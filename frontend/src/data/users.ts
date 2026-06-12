import type { User } from "../types";

// Du lieu gia nguoi dung he thong
// Mat khau gia: "password123" (hash gia)
export const mockUsers: User[] = [
  // Admin
  {
    id: 1,
    email: "admin@dukihome.vn",
    phone: "0901000001",
    password_hash: "$mock_hash_admin",
    role: "ADMIN",
    status: "ACTIVE",
    created_at: "2025-01-01T00:00:00Z",
    updated_at: "2025-01-01T00:00:00Z",
  },
  // Manager - quan ly Toa A
  {
    id: 2,
    email: "manager.a@dukihome.vn",
    phone: "0901000002",
    password_hash: "$mock_hash_manager",
    role: "MANAGER",
    status: "ACTIVE",
    created_at: "2025-01-10T00:00:00Z",
    updated_at: "2025-01-10T00:00:00Z",
    managedBuildingId: 1,
  },
  // Manager - quan ly Toa B
  {
    id: 3,
    email: "manager.b@dukihome.vn",
    phone: "0901000003",
    password_hash: "$mock_hash_manager",
    role: "MANAGER",
    status: "ACTIVE",
    created_at: "2025-02-01T00:00:00Z",
    updated_at: "2025-02-01T00:00:00Z",
    managedBuildingId: 3,
  },
  // Tenant users (user_id 4-13 lien ket voi tenant_id 1-10)
  { id: 4, email: "an.nguyen@gmail.com", phone: "0912000001", password_hash: "$mock_hash", role: "TENANT", status: "ACTIVE", created_at: "2025-02-10T00:00:00Z", updated_at: "2025-02-10T00:00:00Z" },
  { id: 5, email: "bich.tran@gmail.com", phone: "0912000002", password_hash: "$mock_hash", role: "TENANT", status: "ACTIVE", created_at: "2025-03-05T00:00:00Z", updated_at: "2025-03-05T00:00:00Z" },
  { id: 6, email: "cuong.le@gmail.com", phone: "0912000003", password_hash: "$mock_hash", role: "TENANT", status: "ACTIVE", created_at: "2025-04-12T00:00:00Z", updated_at: "2025-04-12T00:00:00Z" },
  { id: 7, email: "duc.pham@gmail.com", phone: "0912000004", password_hash: "$mock_hash", role: "TENANT", status: "ACTIVE", created_at: "2025-05-20T00:00:00Z", updated_at: "2025-05-20T00:00:00Z" },
  { id: 8, email: "em.vo@gmail.com", phone: "0912000005", password_hash: "$mock_hash", role: "TENANT", status: "ACTIVE", created_at: "2025-06-08T00:00:00Z", updated_at: "2025-06-08T00:00:00Z" },
  { id: 9, email: "phuc.hoang@gmail.com", phone: "0912000006", password_hash: "$mock_hash", role: "TENANT", status: "ACTIVE", created_at: "2025-07-15T00:00:00Z", updated_at: "2025-07-15T00:00:00Z" },
  { id: 10, email: "giang.do@gmail.com", phone: "0912000007", password_hash: "$mock_hash", role: "TENANT", status: "ACTIVE", created_at: "2025-08-22T00:00:00Z", updated_at: "2025-08-22T00:00:00Z" },
  { id: 11, email: "hai.bui@gmail.com", phone: "0912000008", password_hash: "$mock_hash", role: "TENANT", status: "INACTIVE", created_at: "2025-09-30T00:00:00Z", updated_at: "2025-09-30T00:00:00Z" },
  { id: 12, email: "huong.ly@gmail.com", phone: "0912000009", password_hash: "$mock_hash", role: "TENANT", status: "ACTIVE", created_at: "2025-11-01T00:00:00Z", updated_at: "2025-11-01T00:00:00Z" },
  { id: 13, email: "khanh.ngo@gmail.com", phone: "0912000010", password_hash: "$mock_hash", role: "TENANT", status: "ACTIVE", created_at: "2026-01-10T00:00:00Z", updated_at: "2026-01-10T00:00:00Z" },
];

// Tim user theo email va password (cho mock login)
export function findUserByCredentials(email: string, _password: string): User | null {
  // Mock: chap nhan bat ky password nao, chi can email dung
  return mockUsers.find((u) => u.email === email && u.status === "ACTIVE") || null;
}
