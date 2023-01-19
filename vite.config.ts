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
      rollupOptions: {
        input: {
          app: './main.html',
        },
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
  }
})

/*
// https://vitejs.dev/config/
export default defineConfig(({mode})=>{

  const env = loadEnv(mode, process.cwd());

  return {

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
*/