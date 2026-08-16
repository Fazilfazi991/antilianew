import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { isAdminEmail } from '@/lib/queries/admin';

/** Client-side route guard that mirrors the existing Supabase admin allow-list. */
export function useAdminAccess() {
  const { session, loading: authLoading, isAuthenticated } = useAuth();
  const [access, setAccess] = useState<{ userId: string | null; isAdmin: boolean }>({ userId: null, isAdmin: false });
  const userId = session?.user.id ?? null;

  useEffect(() => {
    let active = true;

    if (authLoading || !userId) {
      return () => { active = false; };
    }

    void isAdminEmail(session?.user.email ?? '').then((allowed) => {
      if (active) setAccess({ userId, isAdmin: allowed });
    }).catch(() => {
      if (active) setAccess({ userId, isAdmin: false });
    });

    return () => { active = false; };
  }, [authLoading, userId, session?.user.email]);

  const accessResolved = !userId || access.userId === userId;
  return {
    session,
    isAuthenticated,
    isAdmin: userId !== null && accessResolved && access.isAdmin,
    loading: authLoading || !accessResolved,
  };
}
