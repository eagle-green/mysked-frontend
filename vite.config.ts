import path from 'path';
import { readFileSync, writeFileSync } from 'fs';
import checker from 'vite-plugin-checker';
import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react-swc';

// ----------------------------------------------------------------------

const PORT = 8081;

// Plugin to generate meta.json before build
function generateMetaPlugin(): Plugin {
  return {
    name: 'generate-meta',
    buildStart() {
      // Read version from package.json
      const packageJsonPath = path.resolve(process.cwd(), 'package.json');
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));

      const meta = {
        version: packageJson.version || '1.0.0',
        buildTime: new Date().toISOString(),
      };

      const metaPath = path.resolve(process.cwd(), 'public/meta.json');
      writeFileSync(metaPath, JSON.stringify(meta, null, 2));

      console.log('✅ Vite plugin generated meta.json:', meta);
    },
  };
}

export default defineConfig({
  plugins: [
    generateMetaPlugin(),
    react(),
    checker({
      typescript: true,
      eslint: {
        useFlatConfig: true,
        lintCommand: 'eslint "./src/**/*.{js,jsx,ts,tsx}"',
        dev: { logLevel: ['error'] },
      },
      overlay: {
        position: 'tl',
        initialIsOpen: false,
      },
    }),
  ],
  resolve: {
    alias: [
      {
        find: /^src(.+)/,
        replacement: path.resolve(process.cwd(), 'src/$1'),
      },
    ],
  },
  server: { 
    port: PORT, 
    host: true,
    // HTTPS disabled for easier development
    // Camera will use file upload fallback on HTTP
    // Disable caching for meta.json in dev mode
    headers: {
      'Cache-Control': 'no-cache',
    },
  },
  preview: { 
    port: PORT, 
    host: true,
    headers: {
      'Cache-Control': 'no-cache',
    },
  },
  build: {
    rollupOptions: {
      output: {
        // Ensure meta.json is not cached
        manualChunks: undefined,
      },
    },
  },
});
