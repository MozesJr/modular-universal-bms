import { useCallback, useEffect, useState } from 'react';
import { getErrorMessage } from 'helpers/utils';
import { AdminUser, listAdminUsers } from 'services/adminUsers';

interface UseAdminUsersResult {
  data: AdminUser[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export const useAdminUsers = (): UseAdminUsersResult => {
  const [data, setData] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(() => {
    setIsLoading(true);
    setError(null);
    listAdminUsers()
      .then(setData)
      .catch((err) => setError(getErrorMessage(err, 'Gagal memuat daftar user.')))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { data, isLoading, error, refetch };
};
