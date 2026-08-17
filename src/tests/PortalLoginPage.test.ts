import { describe, expect, it } from 'vitest';
import { getPortalLoginErrorMessage } from '@/lib/portalLogin';

describe('broker portal login errors', () => {
  it('does not expose Supabase invalid-credential wording', () => {
    expect(getPortalLoginErrorMessage(new Error('Invalid login credentials'))).toBe('Incorrect email or password.');
  });

  it('uses a safe fallback for other authentication failures', () => {
    expect(getPortalLoginErrorMessage(new Error('unexpected upstream response'))).toBe('Unable to sign in right now. Please try again.');
  });
});
