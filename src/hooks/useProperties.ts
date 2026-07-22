import { useEffect, useState } from 'react';
import { fetchProperties } from '@/lib/queries/properties';
import type { Property } from '@/lib/types';

export function useProperties() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    fetchProperties()
      .then(setProperties)
      .catch((e: unknown) => setError(e instanceof Error ? e : new Error(String(e))))
      .finally(() => setLoading(false));
  }, []);

  return { properties, loading, error };
}
