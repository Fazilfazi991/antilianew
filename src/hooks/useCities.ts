import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export function useCities() {
  const [cities, setCities] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('cities')
      .select('name')
      .order('name', { ascending: true })
      .then(({ data }) => {
        setCities((data ?? []).map((r: { name: string }) => r.name));
        setLoading(false);
      });
  }, []);

  return { cities, loading };
}
