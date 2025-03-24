import adapter from '@hono/vite-dev-server/cloudflare'
import pandacss from '@pandacss/dev/postcss'
import { reactRouter } from '@react-router/dev/vite'
import { cloudflareDevProxy } from '@react-router/dev/vite/cloudflare'
import autoprefixer from 'autoprefixer'
import serverAdapter from 'hono-react-router-adapter/vite'
import { defineConfig } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'
import { getLoadContext } from './load-context'

export default defineConfig({
  css: {
    postcss: {
      //@ts-expect-error
      plugins: [pandacss, autoprefixer],
    },
  },
  plugins: [
    cloudflareDevProxy(),
    reactRouter(),
    serverAdapter({
      adapter,
      getLoadContext,
      entry: 'server/index.ts',
    }),
    tsconfigPaths(),
  ],
})
