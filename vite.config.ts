import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: 'react-vendor',
              test: /node_modules[\\/](react|react-dom)[\\/]/,
              priority: 30,
            },
            {
              name: 'antd-vendor',
              test: /node_modules[\\/](antd|@ant-design|@rc-component|rc-[^\\/]+)[\\/]/,
              priority: 20,
              entriesAware: true,
              entriesAwareMergeThreshold: 16 * 1024,
            },
            {
              name: 'auth-vendor',
              test: /node_modules[\\/](@auth0|axios)[\\/]/,
              priority: 15,
            },
            {
              name: 'table-vendor',
              test: /node_modules[\\/]@tanstack[\\/]/,
              priority: 10,
              entriesAware: true,
            },
          ],
        },
      },
    },
  },
})
