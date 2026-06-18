// jest-dom 매처(toBeInTheDocument 등)의 vitest Assertion 타입 보강을 tsc 에 전역 로드.
// (vitest.setup.ts 는 런타임 등록, 이 d.ts 는 타입 인식용 — 루트 setup 은 tsc include 밖이라 필요)
import '@testing-library/jest-dom/vitest';
