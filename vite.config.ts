import {defineConfig} from 'vite';

export default defineConfig({
  esbuild: {
    target: 'es2022',
  },
  build: {
    target: 'es2022',
    lib: {
      formats: ['es'],
      entry: {
        inject: 'src/inject.ts',
        extension: 'src/extension.ts',
      },
    },
    rollupOptions: {
      output: {
        entryFileNames: '[name].js',
      },
    },
  },
});
