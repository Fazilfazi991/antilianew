import { supabase } from '../supabase';
import type { Profile } from '../types';

export async function agentSignIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function agentSignOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function updateAgentProfile(
  userId: string,
  updates: Partial<Pick<Profile, 'full_name' | 'phone' | 'whatsapp' | 'position' | 'bio'>>
): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();
  if (error) throw error;
  return data as Profile;
}

// Re-export shared portal queries used by agents
export {
  fetchProfile,
  fetchMyListings,
  fetchMyListingById,
  fetchMyListingCounts,
  createPortalListing,
  updatePortalListing,
  deletePortalListing,
  uploadPropertyImage,
} from './portal';
