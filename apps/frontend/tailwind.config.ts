import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{ts,tsx,js,jsx}'],
  plugins: [require('daisyui')],
  daisyui: { themes: ['light', 'dark', 'cupcake'] },
}

export default config
