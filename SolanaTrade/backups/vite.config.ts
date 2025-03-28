import { NodeGlobalsPolyfillPlugin } from '@esbuild-plugins/node-globals-polyfill'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import viteTsconfigPaths from 'vite-tsconfig-paths' // https://vitejs.dev/config/
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          coral: ['@coral-xyz/anchor'],
          jotai: ['jotai'],
          react: ['react', 'react-dom'],
          reactHotToast: ['react-hot-toast'],
          reactRouter: ['react-router', 'react-router-dom'],
          solanaWalletAdapters: [
            '@solana/wallet-adapter-base',
            '@solana/wallet-adapter-react',
            '@solana/wallet-adapter-react-ui',
          ],
          tabler: ['@tabler/icons-react'],
          tanstack: ['@tanstack/react-query'],
        },
      },
    },
  },
  define: {
    'global': 'globalThis',
    'process.env': {},
  },
  resolve: {
    alias: {
      'eventemitter3': path.resolve(__dirname, 'src/shims/eventemitter3.ts'),
      'ws': path.resolve(__dirname, 'src/shims/ws.ts'),
      'rpc-websockets/dist/index.browser': path.resolve(__dirname, 'src/shims/index.browser.mjs'),
      'rpc-websockets/dist/index.browser.mjs': path.resolve(__dirname, 'src/shims/index.browser.mjs'),
    },
  },
  optimizeDeps: {
    esbuildOptions: {
      plugins: [
        NodeGlobalsPolyfillPlugin({
          process: true,
          buffer: true,
        }),
      ],
      define: {
        WebSocket: 'globalThis.WebSocket',
        global: 'globalThis',
      },
    },
  },
  plugins: [
    viteTsconfigPaths(), 
    react(), 
    nodePolyfills({
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
      protocolImports: true,
    }),
  ],
})
