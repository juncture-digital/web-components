import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// const version = '0.0.1'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  
  build: {
    rollupOptions: {
      output: {
        assetFileNames: (assetInfo) => {
          let extType = assetInfo.name?.split('.').at(1)
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(extType || '')) extType = 'img';
          // return `assets/${extType}/[name]-[hash][extname]`;
          // return `assets/${extType}/[name]-${version}[extname]`;
          return `assets/${extType}/[name][extname]`;
        },
        // entryFileNames: 'assets/js/[name]-[hash].js'
        // entryFileNames: `assets/js/[name]-${version}.js`,
        entryFileNames: `assets/js/[name].js`,
        chunkFileNames: 'assets/js/[name]-[hash].js'
      }
    }
  }

})
