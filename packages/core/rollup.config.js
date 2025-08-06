import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';
import dts from 'rollup-plugin-dts';

export default [
  // ESM build
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
      resolve(),
      typescript({
        tsconfig: './tsconfig.json',
        declaration: false,
        emitDeclarationOnly: false,
        declarationDir: undefined,
        rootDir: 'src',
        exclude: ['node_modules', 'dist', '**/*.test.ts', '**/*.test.tsx', '**/__tests__/**'],
      }),
    ],
  },

  // CJS build
  {
    input: 'src/index.ts',
    output: {
      dir: 'dist',
      format: 'esm',
      sourcemap: false,
      preserveModules: true,
      preserveModulesRoot: 'src',
      entryFileNames: '[name].cjs',
    },
    plugins: [
      resolve(),
      typescript({
        tsconfig: './tsconfig.json',
        declaration: false,
        emitDeclarationOnly: false,
        declarationDir: undefined,
        rootDir: 'src',
        exclude: ['node_modules', 'dist', '**/*.test.ts', '**/*.test.tsx', '**/__tests__/**'],
      }),
    ],
  },

  // CDN build
  //   {
  //     input: 'src/index.ts',
  //     output: {
  //       file: 'dist/keybindy.min.js',
  //       format: 'iife',
  //       name: 'Keybindy',
  //       sourcemap: false,
  //     },
  //     plugins: [
  //       resolve(),
  //       typescript({
  //         tsconfig: './tsconfig.json',
  //         declaration: false,
  //         emitDeclarationOnly: false,
  //       }),
  //       terser(),
  //     ],
  //   },

  // Bundle .d.ts entry file
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/index.d.ts',
      format: 'es',
    },
    plugins: [dts()],
  },
];
