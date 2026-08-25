import api from './api';

export interface CellReadingMetrics {
  voltage: number;
  current: number;
  temperature: number | null;
  soc: number | null;
  soh: number | null;
}

export interface PackReadingMetrics {
  voltage: number | null;
  current: number | null;
  temperature: number | null;
  soc: number | null;
  soh: number | null;
}

// One row from CellReading (backend/src/models/CellReading.js), as returned
// by GET /api/cells/:packId/:cellId/history.
export interface CellReadingPoint {
  timestamp: string;
  metrics: CellReadingMetrics;
  pack_metrics: PackReadingMetrics;
  state: string;
  alerts: string[];
}

export interface CellHistoryParams {
  from?: string; // ISO date string
  to?: string; // ISO date string
  limit?: number; // backend caps at 2000, defaults to 500
}

export interface CellHistoryResponse {
  pack_id: string;
  cell_id: number;
  from: string;
  to: string;
  data: CellReadingPoint[];
}

// Raw, high-resolution readings — backend defaults to the last 1 hour when
// no from/to is given (backend/src/routes/cells.js:47-74), which is exactly
// the "recent window" this chart wants.
export const getCellHistory = async (
  packId: string,
  cellId: number,
  params: CellHistoryParams = {},
): Promise<CellHistoryResponse> => {
  const { data } = await api.get<CellHistoryResponse>(`/cells/${packId}/${cellId}/history`, {
    params,
  });
  return data;
};
