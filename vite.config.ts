import { defineConfig, loadEnv } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  // 환경변수 로드 (.env.local 포함)
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [
      // The React and Tailwind plugins are both required for Make, even if
      // Tailwind is not being actively used – do not remove them
      react(),
      tailwindcss(),
    ],
    resolve: {
      alias: {
        // Alias @ to the src directory
        '@': path.resolve(__dirname, './src'),
      },
    },
    // 로컬 개발용 Notion API 프록시 설정
    // Vercel 배포 없이 CORS 우회하여 Notion API 테스트 가능
    server: {
      proxy: {
        '/api/notion': {
          target: 'https://api.notion.com/v1',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/notion/, ''),
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq) => {
              // Notion API 인증 헤더 추가
              proxyReq.setHeader('Authorization', `Bearer ${env.VITE_NOTION_API_KEY || ''}`);
              proxyReq.setHeader('Notion-Version', '2022-06-28');
            });
          },
        },
      },
    },
  }
})
