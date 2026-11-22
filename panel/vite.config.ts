import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// GitHub Pages'te alt klasörde yayınlanır: PANEL_BASE=/hamour-app/
export default defineConfig({ plugins: [react()], base: process.env.PANEL_BASE ?? '/' });
