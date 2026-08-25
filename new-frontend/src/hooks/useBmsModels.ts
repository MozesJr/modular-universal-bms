import { useCallback, useEffect, useState } from 'react';
import { getErrorMessage } from 'helpers/utils';
import { BmsModel, listBmsModels } from 'services/bmsModels';

interface UseBmsModelsResult {
  data: BmsModel[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export const useBmsModels = (): UseBmsModelsResult => {
  const [data, setData] = useState<BmsModel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(() => {
    setIsLoading(true);
    setError(null);
    listBmsModels()
      .then(setData)
      .catch((err) => setError(getErrorMessage(err, 'Gagal memuat daftar BMS model.')))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { data, isLoading, error, refetch };
};
