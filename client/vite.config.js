import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import postcss from 'postcss'; // Import your PostCSS config

export default defineConfig({
  base: '/',
  plugins: [react(), postcss()], // Add postcss plugin to the plugins array
});
