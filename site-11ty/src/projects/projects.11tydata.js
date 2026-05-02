export default {
  layout: "layouts/project.njk",
  tags: ["project"],
  permalink: (data) => `/projects/${data.page.fileSlug}/`,
};
