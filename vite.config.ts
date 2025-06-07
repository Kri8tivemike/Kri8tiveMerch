import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '');
  
  // Check if required environment variables exist
  const requiredEnvVars = [
    'VITE_APPWRITE_ENDPOINT',
    'VITE_APPWRITE_PROJECT_ID'
  ];
  
  requiredEnvVars.forEach(varName => {
    if (!env[varName]) {
      console.warn(`Warning: ${varName} environment variable is not set. This may cause issues.`);
    }
  });
  
  // Check if running through ngrok
  const isNgrok = env.VITE_NGROK_MODE === 'true' || 
                  process.env.NODE_ENV === 'development';
  
  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port: 5173,
      strictPort: false,
      open: !isNgrok, // Don't auto-open when using ngrok
      host: '0.0.0.0', // Allow external connections for ngrok
      hmr: isNgrok ? {
        port: 5173,
        overlay: false, // Disable overlay for ngrok
        clientPort: 5173,
      } : {
        overlay: true,
        port: 5173,
      },
      watch: {
        usePolling: isNgrok, // Enable polling for ngrok
        interval: 1000,
      },
      cors: true, // Enable CORS for external connections
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, ngrok-skip-browser-warning',
        'ngrok-skip-browser-warning': 'true',
      },
    },
    build: {
      outDir: 'dist',
      sourcemap: true,
      rollupOptions: {
        output: {
          manualChunks: {
            react: ['react', 'react-dom'],
            router: ['react-router-dom'],
            ui: ['@radix-ui/react-tabs', '@radix-ui/react-toast'],
          },
        },
      },
    },
    optimizeDeps: {
      include: ['react', 'react-dom', 'react-router-dom'],
    },
  };
});