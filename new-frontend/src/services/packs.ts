import api from './api';

export type PackChemistry = 'LiFePO4' | 'Li-ion 18650' | 'NMC' | 'LCO' | 'Custom';
export type PackState = 'normal' | 'charging' | 'discharging' | 'fault' | 'standby';

export const PACK_CHEMISTRIES: PackChemistry[] = [
  'LiFePO4',
  'Li-ion 18650',
  'NMC',
  'LCO',
  'Custom',
];

export interface PackCell {
  cell_no: number;
  cell_pos: string | null;
}

export interface Pack {
  _id: string;
  pack_id: string;
  bms_id: string;
  name: string;
  cell_count: number;
  chemistry: PackChemistry;
  cycle_count: number;
  capacity_ah: number;
  pack_num: number;
  cell_series: number;
  nominal_voltage: number;
  min_voltage: number;
  max_voltage: number;
  max_temp_celsius: number;
  max_current_amps: number;
  max_imbalance_mv: number;
  voltage_delta_mv: number;
  cells: PackCell[];
  state: PackState;
  created_at: string;
}

export interface PackPayload {
  pack_id: string;
  bms_id: string;
  name: string;
  cell_count: number;
  chemistry?: PackChemistry;
  capacity_ah?: number;
  nominal_voltage?: number;
  min_voltage?: number;
  max_voltage?: number;
  max_temp_celsius?: number;
  max_current_amps?: number;
  max_imbalance_mv?: number;
}

// bms_id can't be changed via PUT — backend strips it from the body.
export type UpdatePackPayload = Partial<Omit<PackPayload, 'bms_id'>>;

export const listPacks = async (): Promise<Pack[]> => {
  const { data } = await api.get<Pack[]>('/packs');
  return data;
};

export const getPack = async (packId: string): Promise<Pack> => {
  const { data } = await api.get<Pack>(`/packs/${packId}`);
  return data;
};

export const createPack = async (payload: PackPayload): Promise<Pack> => {
  const { data } = await api.post<Pack>('/packs', payload);
  return data;
};

export const updatePack = async (packId: string, payload: UpdatePackPayload): Promise<Pack> => {
  const { data } = await api.put<Pack>(`/packs/${packId}`, payload);
  return data;
};

export const deletePack = async (
  packId: string,
): Promise<{ success: boolean; message: string }> => {
  const { data } = await api.delete(`/packs/${packId}`);
  return data;
};
