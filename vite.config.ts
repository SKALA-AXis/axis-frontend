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
  server: {
    proxy: {
      '/api': {
        target: process.env.VITE_API_PROXY_TARGET || 'http://127.0.0.1:8080',
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
