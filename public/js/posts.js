// src/lib/posts.js
import { bundleMDX } from '@astrojs/mdx';

export async function getPost(slug) {
  const url = new URL(`../pages/blog/${slug}.mdx`, import.meta.url);
  const mdxSource = await fetch(url).then(res => res.text());
  const { code } = await bundleMDX({ source: mdxSource });
  return { content: code };
}
