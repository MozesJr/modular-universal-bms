import { useCallback, useEffect, useState } from 'react';
import { getErrorMessage } from 'helpers/utils';
import { Bms, getBms, listBms } from 'services/bms';

interface UseBmsListResult {
  data: Bms[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export const useBmsList = (): UseBmsListResult => {
  const [data, setData] = useState<Bms[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(() => {
    setIsLoading(true);
    setError(null);
    listBms()
      .then(setData)
      .catch((err) => setError(getErrorMessage(err, 'Gagal memuat daftar BMS.')))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { data, isLoading, error, refetch };
};

interface UseBmsResult {
  data: Bms | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export const useBms = (bmsId: string | undefined): UseBmsResult => {
  const [data, setData] = useState<Bms | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(bmsId));
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(() => {
    if (!bmsId) return;
    setIsLoading(true);
    setError(null);
    getBms(bmsId)
      .then(setData)
      .catch((err) => setError(getErrorMessage(err, 'Gagal memuat detail BMS.')))
      .finally(() => setIsLoading(false));
  }, [bmsId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { data, isLoading, error, refetch };
};
