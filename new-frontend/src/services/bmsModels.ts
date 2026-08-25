import api from './api';

// ⚠️ SECURITY NOTE: backend/src/routes/bmsModels.js mounts NO auth middleware
// at all on /api/bms-models — every method here is callable by anyone who
// can reach the API, authenticated or not (confirmed by reading the route
// file directly, not just the audit doc). Gating this page behind
// <ProtectedRoute roles={['admin']}> only hides the UI from non-admins; it
// does NOT stop a direct API call. This is a frontend-only mitigation — the
// real fix is adding `protect, isAdmin` middleware on the backend route,
// which is out of scope for this frontend task.
export interface BmsModel {
  _id: string;
  model_name: string;
}

export const listBmsModels = async (): Promise<BmsModel[]> => {
  const { data } = await api.get<BmsModel[]>('/bms-models');
  return data;
};

export const createBmsModel = async (modelName: string): Promise<BmsModel> => {
  const { data } = await api.post<BmsModel>('/bms-models', { model_name: modelName });
  return data;
};

export const updateBmsModel = async (id: string, modelName: string): Promise<BmsModel> => {
  const { data } = await api.put<BmsModel>(`/bms-models/${id}`, { model_name: modelName });
  return data;
};

export const deleteBmsModel = async (
  id: string,
): Promise<{ success: boolean; message: string }> => {
  const { data } = await api.delete(`/bms-models/${id}`);
  return data;
};
