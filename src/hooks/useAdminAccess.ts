import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { isAdminEmail } from '@/lib/queries/admin';

/** Client-side route guard that mirrors the existing Supabase admin allow-list. */
export function useAdminAccess() {
  const { session, loading: authLoading, isAuthenticated } = useAuth();
  const [checking, setChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let active = true;
    if (!session?.user.email) {
      setIsAdmin(false);
      setChecking(false);
      return () => { active = false; };
    }

    setChecking(true);
    isAdminEmail(session.user.email).then((allowed) => {
      if (active) {
        setIsAdmin(allowed);
        setChecking(false);
      }
    });
    return () => { active = false; };
  }, [session?.user.email]);

  return { session, isAuthenticated, isAdmin, loading: authLoading || checking };
}
