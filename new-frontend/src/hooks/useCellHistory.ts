import { useCallback, useEffect, useState } from 'react';
import { getErrorMessage } from 'helpers/utils';
import { CellHistoryParams, CellReadingPoint, getCellHistory } from 'services/cells';

interface UseCellHistoryResult {
  data: CellReadingPoint[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export const useCellHistory = (
  packId: string | undefined,
  cellId: number | undefined,
  params: CellHistoryParams = {},
): UseCellHistoryResult => {
  const [data, setData] = useState<CellReadingPoint[]>([]);
  const [isLoading, setIsLoading] = useState(Boolean(packId && cellId !== undefined));
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(() => {
    if (!packId || cellId === undefined) return;
    setIsLoading(true);
    setError(null);
    getCellHistory(packId, cellId, params)
      .then((res) => setData(res.data))
      .catch((err) => setError(getErrorMessage(err, 'Gagal memuat histori cell.')))
      .finally(() => setIsLoading(false));
    // Deliberately depend on the destructured fields, not `params` itself —
    // an inline object literal from the caller would otherwise retrigger
    // this on every render.
  }, [packId, cellId, params.from, params.to, params.limit]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { data, isLoading, error, refetch };
};
