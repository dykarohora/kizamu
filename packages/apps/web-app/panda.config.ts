import { defineConfig } from '@pandacss/dev'
import { createPreset } from '@park-ui/panda-preset'
import orange from '@park-ui/panda-preset/colors/orange'
import sand from '@park-ui/panda-preset/colors/sand'

export default defineConfig({
  preflight: true,
  presets: [createPreset({ accentColor: orange, grayColor: sand, radius: 'sm' })],
  include: ['./app/**/{**,.client,.server}/**/*.{js,jsx,ts,tsx}'],
  jsxFramework: 'react', // or 'solid' or 'vue'
  outdir: 'styled-system',
})
