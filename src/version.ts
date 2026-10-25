// Version shown in the bottom-right corner of every screen. Both values are filled in by
// vite.config.ts at build time: package.json version (minor = build step) and git commit.
declare const __APP_VERSION__: string
declare const __APP_COMMIT__: string

export const VERSION_LABEL = `v${__APP_VERSION__} · ${__APP_COMMIT__}`
