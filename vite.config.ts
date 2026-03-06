import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: {
      middlewareMode: true,
      allowedHosts: true,
    },
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.DATABASE_URL': JSON.stringify(env.DATABASE_URL),
      'process.env.SUPABASE_SERVICE_ROLE_KEY': JSON.stringify(env.SUPABASE_SERVICE_ROLE_KEY),
      'process.env.SUPABASE_PUBLISHABLE_KEY': JSON.stringify(env.SUPABASE_PUBLISHABLE_KEY),
      'process.env.SUPABASE_ANON_KEY': JSON.stringify(env.SUPABASE_ANON_KEY),

    },
    build: {
      emptyOutDir: false,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('lucide-react')) return 'lucide';
              if (id.includes('stripe')) return 'stripe';
              if (id.includes('supabase')) return 'supabase';
              if (id.includes('@google/genai')) return 'ai';
              return 'vendor';
            }
          }
        }
      }
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    }
  };
});
