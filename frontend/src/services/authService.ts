import api from "../lib/api";
import type {
  LoginResponse,
  UserData,
  CreateUserResponse,
  CreateUserRequest,
  UpdateUserRequest,
} from "../types";

export type { LoginResponse, UserData, CreateUserResponse, CreateUserRequest, UpdateUserRequest };

export interface LogoutResponse {
  logged_out: boolean;
  banned: boolean;
}

const AUTH_API = "/auth";

export async function login(username: string, password: string): Promise<LoginResponse> {
  const res = await api.post<{ data: LoginResponse }>(`${AUTH_API}/login`, { username, password });
  return res.data.data;
}

export async function logout(token: string): Promise<LogoutResponse> {
  const res = await api.post<{ data: LogoutResponse }>(
    `${AUTH_API}/logout`,
    {},
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.data.data;
}

export async function getAllUsers(): Promise<UserData[]> {
  const res = await api.get<{ data: UserData[] }>(`${AUTH_API}/users`);
  return res.data.data;
}

export async function getAllUsersPage(): Promise<{ data: UserData[] }> {
  const users = await getAllUsers();
  return { data: users };
}

export async function createUser(data: CreateUserRequest): Promise<CreateUserResponse> {
  const res = await api.post<{ data: CreateUserResponse }>(`${AUTH_API}/create-user`, data);
  return res.data.data;
}

export async function updateUser(id: number, data: UpdateUserRequest): Promise<UserData> {
  const res = await api.put<{ data: UserData }>(`${AUTH_API}/users/${id}`, data);
  return res.data.data;
}

export async function deleteUser(id: number): Promise<UserData> {
  const res = await api.delete<{ data: UserData }>(`${AUTH_API}/delete-user/${id}`);
  return res.data.data;
}

export async function resetPassword(id: number): Promise<unknown> {
  const res = await api.post(`${AUTH_API}/reset-password/${id}`);
  return res.data.data;
}

export async function changePassword(oldPass: string, newPass: string): Promise<unknown> {
  const res = await api.post(`${AUTH_API}/change-password`, { oldPass, newPass });
  return res.data.data;
}

export const authService = {
  login,
  logout,
  getAllUsers,
  getAllUsersPage,
  createUser,
  updateUser,
  deleteUser,
  resetPassword,
  changePassword,
};
