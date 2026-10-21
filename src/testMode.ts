// Test helpers (e.g. the temporary "+100" coin button in the shop) are only shown during
// local development (`npm run dev`) or with `?test` in the URL – never for Leni by default.
export const TEST_MODE =
  import.meta.env.DEV || new URLSearchParams(window.location.search).has('test')
