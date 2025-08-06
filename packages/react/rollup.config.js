import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';
import dts from 'rollup-plugin-dts';

export default [
  {
    input: 'src/index.ts',
    output: {
      dir: 'dist',
      format: 'esm',
      sourcemap: false,
      preserveModules: true,
      preserveModulesRoot: 'src',
    },
    plugins: [
      resolve({
        extensions: ['.js', '.ts', '.tsx'],
        browser: true,
      }),
      typescript({
        tsconfig: './tsconfig.json',
        declaration: false,
        emitDeclarationOnly: false,
        declarationDir: undefined,
        rootDir: 'src',
        exclude: ['node_modules', 'dist', '**/*.test.ts', '**/*.test.tsx', '**/__tests__/**'],
      }),
    ],
    external: ['react', 'react/jsx-runtime', '@keybindy/core'],
  },

  {
    input: 'src/index.ts',
    output: {
      file: 'dist/index.d.ts',
      format: 'es',
    },
    plugins: [dts()],
  },
];
