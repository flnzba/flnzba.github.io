// Words per minute used for the reading-time estimate shown on post rows.
const WPM = 200;

// `page.rawInput` is the front-matter-stripped Markdown body. Fenced code
// blocks are stripped before counting, otherwise code-heavy posts read as far
// longer than they are.
const readingMinutes = (raw) => {
  if (typeof raw !== "string" || raw.length === 0) return 1;
  const prose = raw
    .replace(/^```[\s\S]*?^```/gm, " ")
    .replace(/`[^`\n]*`/g, " ")
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/<[^>]+>/g, " ");
  const words = prose.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / WPM));
};

export default {
  layout: "layouts/post.njk",
  permalink: (data) => `/posts/${data.page.fileSlug}/`,
  eleventyComputed: {
    // Derived from the resolved URL, not the file slug: this directory data
    // also applies to src/posts/index.njk, whose fileSlug is "posts" — the old
    // form canonicalised the archive page to the non-existent /posts/posts/.
    canonical_url: (data) =>
      data.canonical_url || `https://www.fzeba.com${data.page.url}`,
    published: (data) => !data.draft,
    readingTime: (data) => readingMinutes(data.page && data.page.rawInput),
  },
};
