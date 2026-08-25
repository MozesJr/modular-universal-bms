import api from './api';

export type BmsStatus = 'pending_verification' | 'active' | 'rejected' | 'suspended';
export type CollaboratorPermission = 'view' | 'maintain';

export const BMS_STATUSES: BmsStatus[] = [
  'active',
  'pending_verification',
  'suspended',
  'rejected',
];

export const BMS_STATUS_CHIP_COLOR: Record<BmsStatus, 'success' | 'warning' | 'error' | 'default'> =
  {
    active: 'success',
    pending_verification: 'warning',
    suspended: 'error',
    rejected: 'default',
  };

export interface BmsOwner {
  _id: string;
  username: string;
  email: string;
  role: string;
}

export interface BmsCollaborator {
  // GET /api/bms(/:bmsId) never populates this — it's a raw user ObjectId.
  user: string;
  permission: CollaboratorPermission;
  added_at?: string;
}

export interface BmsTransferEntry {
  from: string;
  to: string;
  transferred_at: string;
  note?: string;
}

export interface Bms {
  _id: string;
  bms_id: string;
  name: string;
  bms_sernum: string | null;
  bms_model_id: string | null;
  bms_model_name: string | null;
  // GET /api/bms populates this (BmsOwner); GET /api/bms/:bmsId does not
  // (raw ObjectId string) — see getBmsOwnerId/getBmsOwnerLabel below.
  owner: BmsOwner | string;
  status: BmsStatus;
  verified_by: string | null;
  verified_at: string | null;
  collaborators: BmsCollaborator[];
  transfer_history: BmsTransferEntry[];
  created_at: string;
}

export interface BmsPayload {
  bms_id: string;
  name: string;
  bms_sernum?: string | null;
  bms_model_id?: string | null;
  bms_model_name?: string | null;
}

export type UpdateBmsPayload = Partial<BmsPayload>;

export const listBms = async (): Promise<Bms[]> => {
  const { data } = await api.get<Bms[]>('/bms');
  return data;
};

export const getBms = async (bmsId: string): Promise<Bms> => {
  const { data } = await api.get<Bms>(`/bms/${bmsId}`);
  return data;
};

export const createBms = async (payload: BmsPayload): Promise<Bms> => {
  const { data } = await api.post<Bms>('/bms', payload);
  return data;
};

export const updateBms = async (bmsId: string, payload: UpdateBmsPayload): Promise<Bms> => {
  const { data } = await api.put<Bms>(`/bms/${bmsId}`, payload);
  return data;
};

export const deleteBms = async (bmsId: string): Promise<{ success: boolean; message: string }> => {
  const { data } = await api.delete(`/bms/${bmsId}`);
  return data;
};

export const addOrUpdateCollaborator = async (
  bmsId: string,
  collaboratorId: string,
  permission: CollaboratorPermission,
): Promise<{ message: string; bms: Bms }> => {
  const { data } = await api.post(`/bms/${bmsId}/collaborators`, {
    collaboratorId,
    permission,
  });
  return data;
};

export const removeCollaborator = async (
  bmsId: string,
  collaboratorId: string,
): Promise<{ message: string; bms: Bms }> => {
  const { data } = await api.delete(`/bms/${bmsId}/collaborators`, {
    data: { collaboratorId },
  });
  return data;
};

export const getBmsOwnerId = (bms: Bms): string =>
  typeof bms.owner === 'string' ? bms.owner : bms.owner._id;

export const getBmsOwnerLabel = (bms: Bms): string =>
  typeof bms.owner === 'string' ? bms.owner : bms.owner.username;

export type BmsAccessLevel = 'admin' | 'owner' | CollaboratorPermission | 'none';

// Mirrors backend/src/middleware/auth.js#canAccessBms — a global "admin" role
// always resolves to "admin" here, even on a device it doesn't own, which is
// why collaborator-management actions (owner-only on the backend) must check
// for "owner" specifically rather than just "admin or owner".
export const getBmsAccessLevel = (
  bms: Bms,
  currentUser: { id: string; role: string } | null,
): BmsAccessLevel => {
  if (!currentUser) return 'none';
  if (currentUser.role === 'admin') return 'admin';
  if (getBmsOwnerId(bms) === currentUser.id) return 'owner';
  const collaborator = bms.collaborators.find((c) => c.user === currentUser.id);
  return collaborator ? collaborator.permission : 'none';
};

export interface BmsActionResult {
  message: string;
  bms: Bms;
}

// All three below are admin-only on the backend (protect + isAdmin).

export const verifyBms = async (
  bmsId: string,
  decision: 'approve' | 'reject',
): Promise<BmsActionResult> => {
  const { data } = await api.patch(`/bms/${bmsId}/verify`, { decision });
  return data;
};

export const assignBms = async (bmsId: string, userId: string): Promise<BmsActionResult> => {
  const { data } = await api.patch(`/bms/${bmsId}/assign`, { userId });
  return data;
};

// Toggles active <-> suspended (backend rejects the call from any other
// status — see bms.js's `/:bmsId/suspend` handler).
export const toggleSuspendBms = async (bmsId: string): Promise<BmsActionResult> => {
  const { data } = await api.patch(`/bms/${bmsId}/suspend`);
  return data;
};
