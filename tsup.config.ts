import { defineConfig } from 'tsup'

export default defineConfig({
  entry: [
    'src/index.ts',
    'src/beacon/index.ts',
    'src/auth/index.ts',
    'src/id/index.ts',
    'src/verify/index.ts',
    'src/brand/index.ts',
    'src/canon/index.ts',
    'src/registry/index.ts',
    'src/chittychat/index.ts'
  ],
  format: ['cjs', 'esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  shims: true,
  minify: false
})