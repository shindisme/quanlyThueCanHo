import type { Tenant } from "../types";
import api from "../lib/api";

export interface LoginResponse {
  token: string;
  role: string;
}
export interface UserData {
  id: number;
  username: string;
  role: string;
  status: string;
  created_at: string;
  tenant?: Tenant | null;
  tenant_profile?: Tenant | null;
  managed_building?: {
    id: number;
    branch_name: string;
    address_new: string;
  } | null;
}

export interface CreateUserResponse extends UserData {
  initial_password?: string;
}

export async function login(username: string, password: string): Promise<LoginResponse> {
  const res = await api.post<{ data: LoginResponse }>("/auth/login", { username, password });
  return res.data.data;
}

export async function getAllUsers(): Promise<UserData[]> {
  const res = await api.get<{ data: UserData[] }>("/auth/users");
  return res.data.data;
}

export async function createUser(data: {
  username: string;
  role: string;
}): Promise<CreateUserResponse> {
  const res = await api.post<{ data: CreateUserResponse }>("/auth/create-user", data);
  return res.data.data;
}

export async function updateUser(
  id: number,
  data: { username?: string; role?: string; status?: string }
) {
  const res = await api.put(`/auth/users/${id}`, data);
  return res.data.data;
}

export async function deleteUser(id: number) {
  const res = await api.delete(`/auth/delete-user/${id}`);
  return res.data.data;
}

export async function resetPassword(id: number) {
  const res = await api.post(`/auth/reset-password/${id}`);
  return res.data.data;
}

export async function changePassword(oldPass: string, newPass: string) {
  const res = await api.post("/auth/change-password", { oldPass, newPass });
  return res.data.data;
}
