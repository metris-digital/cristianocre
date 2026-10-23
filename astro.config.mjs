// @ts-check
import { defineConfig } from 'astro/config';
import rehypePost from './scripts/rehype-post.mjs';

export default defineConfig({
  site: 'https://www.cristianocre.com',
  // Endereços sem barra no fim e sem .html (/consultoria-de-ecommerce),
  // iguais aos de antes. O build gera consultoria-de-ecommerce.html e o
  // cleanUrls do vercel.json tira o .html, como sempre foi.
  trailingSlash: 'never',
  build: { format: 'file' },
  markdown: {
    // Sem aspas curvas automáticas: o texto sai como foi escrito.
    smartypants: false,
    rehypePlugins: [rehypePost],
  },
});
