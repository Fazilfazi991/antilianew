export function getPortalLoginErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : '';
  if (/invalid login credentials/i.test(message)) {
    return 'Incorrect email or password.';
  }

  return 'Unable to sign in right now. Please try again.';
}
