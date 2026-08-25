import { useCallback, useEffect, useState } from 'react';
import { getErrorMessage } from 'helpers/utils';
import { AlertLog, ListAlertsParams, listAlerts } from 'services/alerts';

interface UseAlertsResult {
  data: AlertLog[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export const useAlerts = (params: ListAlertsParams = {}): UseAlertsResult => {
  const [data, setData] = useState<AlertLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(() => {
    setIsLoading(true);
    setError(null);
    listAlerts(params)
      .then(setData)
      .catch((err) => setError(getErrorMessage(err, 'Gagal memuat daftar alert.')))
      .finally(() => setIsLoading(false));
  }, [params.packId, params.limit]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { data, isLoading, error, refetch };
};
