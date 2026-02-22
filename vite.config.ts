import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, '.', '');

  // Filter only VITE_ variables to expose to the client via process.env
  const clientEnv = Object.keys(env).reduce((acc, key) => {
    if (key.startsWith('VITE_')) {
      acc[key] = env[key];
    }
    return acc;
  }, {} as Record<string, string>);

  // Add generic API_KEY if available (for Google GenAI or others)
  if (env.API_KEY || env.VITE_GOOGLE_MAPS_API_KEY) {
    clientEnv['API_KEY'] = env.API_KEY || env.VITE_GOOGLE_MAPS_API_KEY;
  }

  return {
    plugins: [react()],
    define: {
      // Polyfill process.env for robust access.
      // We must JSON.stringify the object so Vite inserts it as an object literal code fragment.
      'process.env': JSON.stringify(clientEnv),
    }
  }
})