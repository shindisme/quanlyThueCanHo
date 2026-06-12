import type { MaintenanceRequest } from "../types";

// Du lieu gia yeu cau sua chua
export const mockMaintenanceRequests: MaintenanceRequest[] = [
  { id: 1, tenant_id: 1, apartment_id: 1, title: "May lanh khong mat", description: "May lanh phong ngu chinh khong lanh, da ve sinh nhung van khong cai thien.", image_url: null, priority: "HIGH", status: "PROCESSING", created_at: "2026-06-05T08:00:00Z", updated_at: "2026-06-06T10:00:00Z" },
  { id: 2, tenant_id: 2, apartment_id: 2, title: "Ro ri nuoc nha tam", description: "Ong nuoc duoi bon rua mat bi ro ri, nuoc chay ra san nha tam.", image_url: null, priority: "HIGH", status: "PENDING", created_at: "2026-06-07T14:30:00Z", updated_at: "2026-06-07T14:30:00Z" },
  { id: 3, tenant_id: 3, apartment_id: 4, title: "Bong den hanh lang bi chay", description: "Bong den truoc cua can ho bi chay, toi vao ban dem.", image_url: null, priority: "LOW", status: "DONE", created_at: "2026-06-01T09:00:00Z", updated_at: "2026-06-03T15:00:00Z" },
  { id: 4, tenant_id: 5, apartment_id: 9, title: "Cua so khong dong duoc", description: "Cua so phong khach bi ket, khong dong lai duoc. Mua vao se bi uot.", image_url: null, priority: "MEDIUM", status: "PENDING", created_at: "2026-06-08T16:00:00Z", updated_at: "2026-06-08T16:00:00Z" },
  { id: 5, tenant_id: 6, apartment_id: 11, title: "Bon cau bi nghet", description: "Bon cau bi nghet nuoc, khong xa duoc.", image_url: null, priority: "HIGH", status: "PROCESSING", created_at: "2026-06-06T07:00:00Z", updated_at: "2026-06-07T08:00:00Z" },
  { id: 6, tenant_id: 7, apartment_id: 12, title: "Binh nong lanh hong", description: "Binh nong lanh khong nong nuoc, da thu reset nhung khong duoc.", image_url: null, priority: "MEDIUM", status: "DONE", created_at: "2026-05-28T11:00:00Z", updated_at: "2026-05-30T14:00:00Z" },
  { id: 7, tenant_id: 9, apartment_id: 15, title: "Tuong bi tham nuoc", description: "Tuong phong ngu bi tham nuoc, co dau hieu am moc.", image_url: null, priority: "MEDIUM", status: "PENDING", created_at: "2026-06-09T09:00:00Z", updated_at: "2026-06-09T09:00:00Z" },
];
