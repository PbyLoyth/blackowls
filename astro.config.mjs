import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://blackowls.net',
  output: 'static',
  trailingSlash: 'never',
  build: { format: 'file', assets: 'static', inlineStylesheets: 'always' },
  compressHTML: true,
  devToolbar: { enabled: false },
});
