/*
 * 작성일: 2026-06-17
 * 작성자: 최종민
 * 변경이력:
 *   2026-06-17 최종민 — vitest 설정 추가 (P0 안전망, node 환경 characterization 테스트용)
 *   2026-06-18 최종민 — Vite 설정 병합 및 jsdom 컴포넌트 테스트 환경 적용
 */
import { defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config';

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
