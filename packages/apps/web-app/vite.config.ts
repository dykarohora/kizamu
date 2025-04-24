import { cloudflare } from '@cloudflare/vite-plugin'
import pandacss from '@pandacss/dev/postcss'
import { reactRouter } from '@react-router/dev/vite'
import autoprefixer from 'autoprefixer'
import { defineConfig } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'
import path from 'node:path'

const configPath = path.resolve(__dirname, `./wrangler.${process.env.WEB_APP_CONFIG_ENV}.toml`)

export default defineConfig({
  css: {
    postcss: {
      //@ts-expect-error
      plugins: [pandacss, autoprefixer],
    },
  },
  plugins: [cloudflare({ viteEnvironment: { name: 'ssr' }, configPath }), reactRouter(), tsconfigPaths()],
})
