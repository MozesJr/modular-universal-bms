import api from './api';

// All routes under /api/admin/users require `protect, isAdmin` on the
// backend (router.use(protect, isAdmin) — see adminUsers.js:10).
export type UserRole = 'admin' | 'user';

export interface AdminUser {
  _id: string;
  username: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  // Computed server-side: count of Bms devices this user owns.
  bmsCount: number;
}

export interface CreateAdminUserPayload {
  username: string;
  email: string;
  password: string;
  role?: UserRole;
}

export interface UpdateAdminUserPayload {
  role?: UserRole;
  isActive?: boolean;
}

export const listAdminUsers = async (): Promise<AdminUser[]> => {
  const { data } = await api.get<AdminUser[]>('/admin/users');
  return data;
};

export const createAdminUser = async (payload: CreateAdminUserPayload): Promise<AdminUser> => {
  const { data } = await api.post<AdminUser>('/admin/users', payload);
  return data;
};

// Backend blocks self-edit (400 "Tidak bisa mengubah akun sendiri") when
// :id matches the requesting admin's own id.
export const updateAdminUser = async (
  id: string,
  payload: UpdateAdminUserPayload,
): Promise<AdminUser> => {
  const { data } = await api.patch<AdminUser>(`/admin/users/${id}`, payload);
  return data;
};

// Unlike updateAdminUser, the backend does NOT block resetting your own
// password via this endpoint.
export const resetAdminUserPassword = async (
  id: string,
  newPassword: string,
): Promise<{ message: string }> => {
  const { data } = await api.patch<{ message: string }>(`/admin/users/${id}/reset-password`, {
    newPassword,
  });
  return data;
};

// Backend blocks self-delete and reassigns the target's owned Bms devices
// to the deleting admin — not wired into the UI yet, kept for contract
// completeness.
export const deleteAdminUser = async (id: string): Promise<{ message: string }> => {
  const { data } = await api.delete<{ message: string }>(`/admin/users/${id}`);
  return data;
};
