import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
/**
 * Rewrites public/ asset paths so they respect Vite's `base`.
 *
 * GitHub Pages serves this app from a sub-path, not a domain root. Source
 * code refers to public assets absolutely (`/illustrations/wave.svg`), which
 * a browser resolves against the DOMAIN root — so every one of them 404s once
 * the app is not at `/`. Vite rewrites such paths in index.html but NOT in
 * string literals inside JS/TS/JSX or in CSS url(), which is where ~65 of
 * them live here.
 *
 * Rewriting at build time rather than editing every call site keeps the
 * source portable: the app still works unchanged at a domain root, and a
 * new asset added tomorrow is handled without anyone remembering this rule.
 */
function publicAssetBase(base: string) {
  // Only the real top-level folders inside public/. Deliberately narrow, so
  // route paths like "/research/schedule" are never touched.
  const PUBLIC_DIRS = /(["'`(])\/(avatars|illustrations|logos)\//g
  return {
    name: 'public-asset-base',
    enforce: 'pre' as const,
    transform(code: string, id: string) {
      if (base === '/') return null
      if (!/\.(tsx?|jsx?|css)($|\?)/.test(id)) return null
      if (id.includes('node_modules')) return null
      if (!PUBLIC_DIRS.test(code)) return null
      PUBLIC_DIRS.lastIndex = 0
      return { code: code.replace(PUBLIC_DIRS, `$1${base}$2/`), map: null }
    },
  }
}

export default defineConfig({
  // Served from a sub-path on GitHub Pages, not a domain root.
  base: '/care2sleep-prototypes/researcher-dashboard-v2/',
  plugins: [publicAssetBase('/care2sleep-prototypes/researcher-dashboard-v2/'), react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
