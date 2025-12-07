// vite.config.js - 优化版本
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';
import { compression } from 'vite-plugin-compression2';

export default defineConfig(({ mode }) => {
  const isDev = mode === 'development';
  const isProd = mode === 'production';

  return {
    plugins: [
      // React 插件
      react({
        // 使用 Babel 进行 JSX 转换
        babel: {
          plugins: [
            // 生产环境移除 console
            isProd && ['transform-remove-console', { exclude: ['error', 'warn'] }]
          ].filter(Boolean)
        }
      }),

      // Gzip 压缩
      isProd && compression({
        algorithm: 'gzip',
        threshold: 10240, // 10KB 以上的文件才压缩
        deleteOriginFile: false
      }),

      // Brotli 压缩
      isProd && compression({
        algorithm: 'brotliCompress',
        threshold: 10240,
        deleteOriginFile: false
      }),

      // Bundle 分析
      isProd && visualizer({
        filename: 'dist/stats.html',
        open: false,
        gzipSize: true,
        brotliSize: true
      })
    ].filter(Boolean),

    // 开发服务器配置
    server: {
      port: 5173,
      host: true,
      open: true,
      cors: true,
      // 代理配置
      proxy: {
        '/api': {
          target: 'http://localhost:4000',
          changeOrigin: true,
          secure: false,
          // rewrite: (path) => path.replace(/^\/api/, '')
        }
      },
      // HMR 配置
      hmr: {
        overlay: true
      }
    },

    // 构建优化
    build: {
      target: 'es2020',
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: !isProd,
      minify: isProd ? 'terser' : false,
      
      // Terser 压缩配置
      terserOptions: isProd ? {
        compress: {
          drop_console: true,
          drop_debugger: true,
          pure_funcs: ['console.log'],
          passes: 2
        },
        format: {
          comments: false
        }
      } : undefined,

      // Rollup 配置
      rollupOptions: {
        output: {
          // 分块策略
          manualChunks: (id) => {
            // 将 node_modules 中的代码单独打包
            if (id.includes('node_modules')) {
              // React 核心库
              if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
                return 'react-vendor';
              }
              // Lucide 图标库
              if (id.includes('lucide-react')) {
                return 'icons';
              }
              // Axios
              if (id.includes('axios')) {
                return 'axios';
              }
              // 其他第三方库
              return 'vendor';
            }
          },
          
          // 文件命名
          chunkFileNames: 'js/[name]-[hash].js',
          entryFileNames: 'js/[name]-[hash].js',
          assetFileNames: (assetInfo) => {
            // 根据文件类型分类
            const info = assetInfo.name.split('.');
            const extType = info[info.length - 1];
            
            if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(extType)) {
              return `images/[name]-[hash][extname]`;
            }
            if (/woff|woff2|eot|ttf|otf/i.test(extType)) {
              return `fonts/[name]-[hash][extname]`;
            }
            return `assets/[name]-[hash][extname]`;
          }
        }
      },

      // 分块大小警告配置
      chunkSizeWarningLimit: 1000,
      
      // CSS 代码分割
      cssCodeSplit: true,
      
      // 关闭 CSS 压缩（由 PostCSS 处理）
      cssMinify: true,

      // 清空输出目录
      emptyOutDir: true,

      // 报告压缩后的大小
      reportCompressedSize: true
    },

    // 优化依赖预构建
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react-router-dom',
        'axios',
        'lucide-react'
      ],
      // 强制重新构建优化缓存
      force: false
    },

    // CSS 预处理器配置
    css: {
      devSourcemap: isDev,
      preprocessorOptions: {
        // 如果使用 SCSS
        scss: {
          additionalData: `@import "@/styles/variables.scss";`
        }
      },
      modules: {
        // CSS Modules 配置
        localsConvention: 'camelCase'
      }
    },

    // 解析配置
    resolve: {
      alias: {
        '@': '/src',
        '@components': '/src/components',
        '@utils': '/src/utils',
        '@hooks': '/src/hooks',
        '@pages': '/src/pages',
        '@assets': '/src/assets',
        '@styles': '/src/styles'
      },
      extensions: ['.mjs', '.js', '.jsx', '.json', '.ts', '.tsx']
    },

    // 环境变量前缀
    envPrefix: 'VITE_',

    // 日志级别
    logLevel: isDev ? 'info' : 'warn',

    // 清除控制台
    clearScreen: false,

    // 预览服务器配置
    preview: {
  port: 4173,
  host: true,
  cors: true,

  // ✨ 新增，允许 Railway 的前端域名访问
  allowedHosts: [
    'supply-dashboard-production.up.railway.app'
  ]
    }
,
    // Esbuild 配置
    esbuild: {
      drop: isProd ? ['console', 'debugger'] : [],
      legalComments: 'none'
    },

    // 定义全局常量
    define: {
      __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
      __BUILD_TIME__: JSON.stringify(new Date().toISOString())
    }
  };
});
