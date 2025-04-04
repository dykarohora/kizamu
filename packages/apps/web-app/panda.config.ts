import { defineConfig } from '@pandacss/dev'
import { createPreset } from '@park-ui/panda-preset'
import sage from '@park-ui/panda-preset/colors/sage'
import teal from '@park-ui/panda-preset/colors/teal'

export default defineConfig({
  preflight: true,
  presets: [createPreset({ accentColor: teal, grayColor: sage, radius: 'sm' })],
  include: ['./app/**/{**,.client,.server}/**/*.{js,jsx,ts,tsx}'],
  jsxFramework: 'react', // or 'solid' or 'vue'
  outdir: 'styled-system',
})
