import { build } from 'esbuild';
import { cpSync, mkdirSync } from 'node:fs';

const watch = process.argv.includes('--watch');
mkdirSync('dist', { recursive: true });
cpSync('public', 'dist/public', { recursive: true });
cpSync('config', 'dist/config', { recursive: true });
cpSync('data', 'dist/data', { recursive: true });
cpSync('manifest.json', 'dist/manifest.json');

const ctx = {
  entryPoints: [
    'src/background/main.ts',
    'src/debug/debug.ts',
    'src/overlay/overlay.ts'
  ],
  outdir: 'dist',
  bundle: true,
  format: 'iife',
  sourcemap: true,
  target: 'es2020'
};

if (watch) {
  const result = await build({ ...ctx, watch: true });
  console.log('Watching...', result);
} else {
  await build(ctx);
  console.log('Build completed');
}
