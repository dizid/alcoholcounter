import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/


export default defineConfig({
  plugins: [vue()],
  assetsInclude: ['**/*.jpg', '**/*.png', '**/*.jpeg'], // Explicitly include image types
  resolve: {
    alias: {
      '@': '/src', // Confirm @ alias
    },
  },
});
