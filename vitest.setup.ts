import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// 테스트 간 렌더 결과 정리(globals 미사용이라 RTL auto-cleanup 대신 명시적 등록).
afterEach(() => {
  cleanup();
});
