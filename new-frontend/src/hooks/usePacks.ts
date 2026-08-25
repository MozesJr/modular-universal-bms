import { useCallback, useEffect, useState } from 'react';
import { getErrorMessage } from 'helpers/utils';
import { Pack, getPack, listPacks } from 'services/packs';

interface UsePacksListResult {
  data: Pack[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export const usePacksList = (): UsePacksListResult => {
  const [data, setData] = useState<Pack[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(() => {
    setIsLoading(true);
    setError(null);
    listPacks()
      .then(setData)
      .catch((err) => setError(getErrorMessage(err, 'Gagal memuat daftar pack.')))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { data, isLoading, error, refetch };
};

interface UsePackResult {
  data: Pack | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export const usePack = (packId: string | undefined): UsePackResult => {
  const [data, setData] = useState<Pack | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(packId));
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(() => {
    if (!packId) return;
    setIsLoading(true);
    setError(null);
    getPack(packId)
      .then(setData)
      .catch((err) => setError(getErrorMessage(err, 'Gagal memuat detail pack.')))
      .finally(() => setIsLoading(false));
  }, [packId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { data, isLoading, error, refetch };
};
