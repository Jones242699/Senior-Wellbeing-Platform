import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

const DEFAULT_COUNSELING_API_BASE =
  'https://k2algu70g6.execute-api.ap-southeast-2.amazonaws.com'

const projectRoot = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, projectRoot, 'VITE_')
  let counselingProxyTarget = DEFAULT_COUNSELING_API_BASE
  let counselingPathPrefix = ''
  let discoverProxyTarget = DEFAULT_COUNSELING_API_BASE
  let discoverPathPrefix = ''
  let geocodeProxyTarget = DEFAULT_COUNSELING_API_BASE
  let geocodePathPrefix = ''
  try {
    const base = (env.VITE_COUNSELING_API_BASE || DEFAULT_COUNSELING_API_BASE).replace(/\/$/, '')
    const parsed = new URL(base)
    counselingProxyTarget = `${parsed.protocol}//${parsed.host}`
    const stagePath = parsed.pathname.replace(/\/$/, '') || ''
    counselingPathPrefix = stagePath && stagePath !== '/' ? stagePath : ''
  } catch {
    /* keep defaults */
  }
  try {
    const base = (env.VITE_DISCOVER_PLACES_API_BASE_URL || DEFAULT_COUNSELING_API_BASE).replace(
      /\/$/,
      '',
    )
    const parsed = new URL(base)
    discoverProxyTarget = `${parsed.protocol}//${parsed.host}`
    const stagePath = parsed.pathname.replace(/\/$/, '') || ''
    discoverPathPrefix = stagePath && stagePath !== '/' ? stagePath : ''
  } catch {
    /* keep defaults */
  }
  try {
    const base = (env.VITE_GEOCODE_API_BASE || DEFAULT_COUNSELING_API_BASE).replace(/\/$/, '')
    const parsed = new URL(base)
    geocodeProxyTarget = `${parsed.protocol}//${parsed.host}`
    const stagePath = parsed.pathname.replace(/\/$/, '') || ''
    geocodePathPrefix = stagePath && stagePath !== '/' ? stagePath : ''
  } catch {
    /* keep defaults */
  }

  return {
    plugins: [
      vue(),
      vueDevTools(),
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      proxy: {
        // Same-origin in dev → avoids browser CORS until API Gateway sends CORS headers.
        '/__counseling': {
          target: counselingProxyTarget,
          changeOrigin: true,
          rewrite: (proxyPath) => proxyPath.replace(/^\/__counseling/, counselingPathPrefix),
        },
        '/__social-score': {
          target: counselingProxyTarget,
          changeOrigin: true,
          rewrite: (proxyPath) => proxyPath.replace(/^\/__social-score/, counselingPathPrefix),
        },
        '/__shade-score': {
          target: counselingProxyTarget,
          changeOrigin: true,
          rewrite: (proxyPath) => proxyPath.replace(/^\/__shade-score/, counselingPathPrefix),
        },
        '/__routes': {
          target: counselingProxyTarget,
          changeOrigin: true,
          rewrite: (proxyPath) => proxyPath.replace(/^\/__routes/, counselingPathPrefix),
        },
        '/__route-facilities': {
          target: counselingProxyTarget,
          changeOrigin: true,
          rewrite: (proxyPath) => proxyPath.replace(/^\/__route-facilities/, counselingPathPrefix),
        },
        '/__discover': {
          target: discoverProxyTarget,
          changeOrigin: true,
          rewrite: (proxyPath) => proxyPath.replace(/^\/__discover/, discoverPathPrefix),
        },
        '/__geocode': {
          target: geocodeProxyTarget,
          changeOrigin: true,
          rewrite: (proxyPath) => proxyPath.replace(/^\/__geocode/, geocodePathPrefix),
        },
      },
    },
  }
})
