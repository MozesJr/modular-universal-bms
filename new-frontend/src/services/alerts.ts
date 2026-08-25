import api from './api';

export type AlertType =
  'overcharge' | 'over_discharge' | 'thermal_runaway' | 'over_current' | 'fault' | 'imbalance';

export interface AlertLog {
  _id: string;
  pack_id: string;
  // 0 = pack-level alert (e.g. "imbalance"), not a specific cell — see
  // backend/src/services/mqttService.js's `cell_id: 0` comment.
  cell_id: number;
  type: AlertType;
  timestamp: string;
  resolved: boolean;
  resolved_at: string | null;
}

export interface ListAlertsParams {
  packId?: string;
  limit?: number;
}

export const listAlerts = async (params: ListAlertsParams = {}): Promise<AlertLog[]> => {
  const { data } = await api.get<AlertLog[]>('/alerts', {
    params: { packId: params.packId, limit: params.limit },
  });
  return data;
};

export const acknowledgeAlert = async (id: string): Promise<AlertLog> => {
  const { data } = await api.put<AlertLog>(`/alerts/${id}/acknowledge`);
  return data;
};

export const ALERT_TYPE_LABELS: Record<AlertType, string> = {
  overcharge: 'Overcharge',
  over_discharge: 'Over Discharge',
  thermal_runaway: 'Thermal Runaway',
  over_current: 'Over Current',
  fault: 'Fault',
  imbalance: 'Imbalance',
};

// AlertLog has no stored severity field on the backend — this is a
// client-side heuristic grouping of `type` used only for chip coloring.
export const ALERT_TYPE_CHIP_COLOR: Record<AlertType, 'error' | 'warning'> = {
  thermal_runaway: 'error',
  fault: 'error',
  overcharge: 'warning',
  over_discharge: 'warning',
  over_current: 'warning',
  imbalance: 'warning',
};
