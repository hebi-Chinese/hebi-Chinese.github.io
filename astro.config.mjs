import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://hebi-chinese.github.io',
  output: 'static',
  // Preserve existing inline spacing across Astro 7's new JSX whitespace default.
  // https://docs.astro.build/en/guides/upgrade-to/v7/#new-default-whitespace-handling-compresshtml-jsx
  compressHTML: true,
});
