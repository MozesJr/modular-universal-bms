import { ChipProps } from '@mui/material';
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

// Single source of truth for how `PackState` renders — shared by
// PackReadoutStrip (Pack Detail) and PacksList so the same state never
// shows two different colors/labels depending on which page you're on.
// Keyed as Record<string, ...> (not Record<PackState, ...>) because Pack
// Detail also indexes this with the live socket event's `state` field,
// which is a plain string, not guaranteed to match the PackState union.
export const PACK_STATE_LABEL: Record<string, string> = {
  charging: 'Charging',
  discharging: 'Discharging',
  fault: 'Fault',
  standby: 'Standby',
  normal: 'Normal',
};

export const PACK_STATE_CHIP_COLOR: Record<string, ChipProps['color']> = {
  charging: 'info',
  discharging: 'warning',
  fault: 'error',
  standby: 'default',
  normal: 'success',
};

export const PACK_STATE_ICON: Record<string, string> = {
  charging: 'mdi:battery-charging-outline',
  discharging: 'mdi:battery-arrow-down-outline',
  fault: 'mdi:alert-circle-outline',
  standby: 'mdi:battery-outline',
  normal: 'mdi:battery-outline',
};

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
