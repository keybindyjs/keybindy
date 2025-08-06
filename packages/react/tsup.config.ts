import { defineConfig } from 'tsup';

export default defineConfig(() => ({
  tsconfig: './tsconfig.json',
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  outDir: 'dist',
  dts: true,
  bundle: true,
  splitting: true,
  sourcemap: false,
  clean: true,
  target: 'esnext',
  skipNodeModulesBundle: true,
  external: ['react', 'react-dom'],
  onSuccess: async () => {
    console.log('Build completed successfully!');
  },
  esbuildOptions(options) {
    options.banner = {
      js: `'use client';`,
    };
  },
  outExtension({ format }) {
    return {
      js: format === 'cjs' ? '.cjs' : '.mjs',
    };
  },
}));
