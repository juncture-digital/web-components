import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig(({mode})=> {
  const processEnvValues = {
    'process.env': {version: process.env.npm_package_version}
  }
  return {    
    define: processEnvValues,
    plugins: [vue({
      template: {
        compilerOptions: {
          isCustomElement: (tag) => {
            return tag.startsWith('ve-') || tag.startsWith('sl-')
          }
        }
      }
    }
    )],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      }
    },
    
    build: {
      cssCodeSplit: false,
      rollupOptions: {
        input: {
          index: './index.html',
        },
        output: {
          dir: 'docs',
          inlineDynamicImports: true,
          entryFileNames: `js/index.js`,
          assetFileNames: (assetInfo) => {
            const ext = assetInfo.name?.split('.').pop()?.toLowerCase()
            if (ext === 'css') return 'css/index.css'
            if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext || '')) return `img/[name][extname]`
            return `assets/[name][extname]`
          }
        }
      }
    }
  }
})
