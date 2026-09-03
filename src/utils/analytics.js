// Thin wrapper around gtag for custom events. Safe to call even before the
// visitor has accepted analytics — gtag.js is held inert (type="text/plain")
// by the cookie-consent banner until then, so window.gtag simply won't exist
// yet, and this quietly no-ops instead of throwing.
export function trackEvent(name, params = {}) {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return;
  window.gtag('event', name, params);
}
