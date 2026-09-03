/**
 * The mocked Okta Verify sign-in session (Round 1.1) that used to gate the
 * Coach Training Portal, then just the Coach Delivery Portal, was removed
 * entirely — no portal in this app has a sign-in gate anymore. This function
 * remains only because the header's "Sign out" menu item (every portal)
 * still calls it as a generic "clear session, return to the switcher"
 * affordance.
 */
const TRAINING_AUTH_KEY = 'care2sleep.trainingAuth'

export function signOutOfTraining(): void {
  sessionStorage.removeItem(TRAINING_AUTH_KEY)
}
