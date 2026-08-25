import api from './api';

export interface UserSummary {
  // GET /api/users?search= only .select()s username/email, but Mongoose
  // always includes _id unless explicitly excluded — it's there in practice.
  _id: string;
  username: string;
  email: string;
}

export const searchUsers = async (search: string): Promise<UserSummary[]> => {
  const { data } = await api.get<UserSummary[]>('/users', { params: { search } });
  return data;
};
