import { defineConfig } from 'vitest/config';

// P0 안전망: 리팩토링 characterization 테스트용 최소 설정.
// 순수 로직(util·mapper) 테스트는 node 환경으로 충분하다. 컴포넌트 렌더 테스트를
// 추가할 때 jsdom + @testing-library + react plugin 으로 확장한다(P0 후속).
export default defineConfig({
  test: {
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    environment: 'node',
    passWithNoTests: false,
  },
});
