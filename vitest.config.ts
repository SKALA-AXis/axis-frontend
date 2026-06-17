/// <reference types="vitest/config" />
import { defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config';

// vite.config 의 plugins(react/tailwind)·alias 를 그대로 재사용하고 test 블록만 추가.
export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: 'jsdom',
      setupFiles: ['./vitest.setup.ts'],
      include: ['src/**/*.{test,spec}.{ts,tsx}'],
      css: false,
    },
  }),
);
