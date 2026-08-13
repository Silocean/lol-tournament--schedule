import { defineConfig } from 'vite'
import { LOLESPORTS_API_KEY, LOLESPORTS_ORIGIN } from './lib/lolesports.js'

export default defineConfig({
  server: {
    port: 5173,
    proxy: {
      '/api/lol': {
        target: LOLESPORTS_ORIGIN,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/lol/, '/persisted/gw'),
        headers: {
          'x-api-key': LOLESPORTS_API_KEY,
        },
      },
    },
  },
})
