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
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
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