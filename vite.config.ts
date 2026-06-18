/*
 * 작성일: 2026-04-21
 * 작성자: 최종민
 * 변경이력:
 *   2026-04-21 최종민 — axis-frontend 베이스라인에 vite 설정 추가, 이후 라우트별 lazy 청크 분할/캐시 헤더 및 manualChunks 함수 전환
 *   2026-04-23 안가은 — 프론트 초기 셋업 및 키워드 트렌드 관련 설정 반영
 *   2026-05-21 박진 — 로그인 기능 구현에 맞춰 설정 반영
 *   2026-06-11 심유정 — 카드뉴스 텍스트 파일 공유 기능 관련 설정 반영
 */
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

type ProxyErrorResponse = {
  headersSent?: boolean;
  writeHead?: (statusCode: number, headers: Record<string, string>) => void;
  end?: (chunk?: string) => void;
};

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        // react 코어를 별도 청크로 고정 — 앱 코드만 바뀌는 배포에서 vendor 청크 해시가
        // 유지되어 브라우저 캐시(nginx /assets/ immutable)가 살아있게 한다.
        // 함수 형태로 작성: vite 8(rolldown)은 객체형 manualChunks 를 거부하고
        // 함수만 허용. vite 6(rollup)도 함수형을 지원하므로 둘 다 호환.
        manualChunks: (id) => {
          if (id.includes('node_modules/react-dom') || id.includes('node_modules/react/')) {
            return 'react-vendor';
          }
          // 대형 시각화/3D/UI 라이브러리도 각자 벤더 청크로 고정 — 앱 코드만 바뀌는
          // 배포에서 이들 청크 해시가 유지돼 브라우저 캐시 적중률이 올라간다 (#115).
          if (id.includes('node_modules/recharts')) {
            return 'recharts-vendor';
          }
          if (id.includes('node_modules/three')) {
            return 'three-vendor';
          }
          if (id.includes('node_modules/@radix-ui')) {
            return 'radix-vendor';
          }
        },
      },
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8080',
        changeOrigin: true,
        configure: (proxy) => {
          proxy.on('error', (_error, _request, response) => {
            const res = response as ProxyErrorResponse | undefined;
            if (!res?.writeHead || !res.end || res.headersSent) return;
            res.writeHead(503, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify({
              success: false,
              error: {
                code: 'BACKEND_UNAVAILABLE',
                message: '백엔드 서버에 연결할 수 없습니다. axis-infra에서 make pf-backend를 실행하세요.',
              },
              timestamp: new Date().toISOString(),
            }));
          });
        },
      },
    },
  },
});