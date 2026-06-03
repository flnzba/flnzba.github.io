export default {
  layout: "layouts/project.njk",
  permalink: (data) => `/projects/${data.page.fileSlug}/`,
  eleventyComputed: {
    canonical_url: (data) =>
      data.canonical_url || `https://www.fzeba.com/projects/${data.page.fileSlug}/`,
    published: (data) => !data.draft,
  },
};
