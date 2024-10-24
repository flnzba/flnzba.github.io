import { defineConfig } from 'astro/config';
import tailwind from "@astrojs/tailwind";
import sitemap from "@astrojs/sitemap";
import theRemarkPlugin from "src/remark/the-remark-plugin";
import astroRemark from '@astrojs/markdown-remark';
import mdx from "@astrojs/mdx";

// https://astro.build/config
export default defineConfig({
  integrations: [tailwind({applyBaseStyles: false},), sitemap(), mdx({remarkPlugins: [theRemarkPlugin]})],
  site: 'https://www.fzeba.com',
});