export default {
  layout: "layouts/post.njk",
  tags: ["post"],
  permalink: (data) => `/posts/${data.page.fileSlug}/`,
  eleventyComputed: {
    canonical_url: (data) =>
      data.canonical_url || `https://fzeba.com/posts/${data.page.fileSlug}/`,
    published: (data) => !data.draft,
  },
};
