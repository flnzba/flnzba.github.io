import rssPlugin from "@11ty/eleventy-plugin-rss";
import navigationPlugin from "@11ty/eleventy-navigation";
import syntaxHighlight from "@11ty/eleventy-plugin-syntaxhighlight";
import markdownIt from "markdown-it";
import markdownItAnchor from "markdown-it-anchor";
import markdownItAttrs from "markdown-it-attrs";

export default function (eleventyConfig) {
  // Plugins
  eleventyConfig.addPlugin(rssPlugin);
  eleventyConfig.addPlugin(navigationPlugin);
  eleventyConfig.addPlugin(syntaxHighlight);

  // Markdown engine — anchor links + image attributes
  const md = markdownIt({ html: true, linkify: true, typographer: true })
    .use(markdownItAnchor, {
      permalink: markdownItAnchor.permalink.headerLink({ safariReaderFix: true }),
      level: [2, 3, 4],
    })
    .use(markdownItAttrs);
  eleventyConfig.setLibrary("md", md);

  // Passthrough copy
  eleventyConfig.addPassthroughCopy({ "src/assets": "assets" });
  eleventyConfig.addPassthroughCopy({ "src/css": "css" });
  eleventyConfig.addPassthroughCopy({ "src/js": "js" });
  eleventyConfig.addPassthroughCopy("src/posts/**/*.{webp,png,jpg,jpeg,gif,svg}");
  eleventyConfig.addPassthroughCopy("src/projects/**/*.{webp,png,jpg,jpeg,gif,svg}");
  eleventyConfig.addPassthroughCopy({ "./CNAME": "CNAME" });

  // Watch CSS/JS so eleventy --serve reloads on changes
  eleventyConfig.addWatchTarget("src/css/");
  eleventyConfig.addWatchTarget("src/js/");

  // Filters
  eleventyConfig.addFilter("readableDate", (date) =>
    new Date(date).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })
  );

  eleventyConfig.addFilter("htmlDateString", (date) =>
    new Date(date).toISOString().slice(0, 10)
  );

  eleventyConfig.addFilter("rfc3339", (date) =>
    new Date(date).toISOString()
  );

  eleventyConfig.addFilter("head", (array, n) => {
    if (!Array.isArray(array) || array.length === 0) return [];
    return n < 0 ? array.slice(n) : array.slice(0, n);
  });

  eleventyConfig.addFilter("byTag", (posts, tag) =>
    (posts || []).filter((p) => (p.data.tags || []).includes(tag))
  );

  eleventyConfig.addFilter("excludeFrom", (collection, slug) =>
    (collection || []).filter((item) => item.fileSlug !== slug)
  );

  // Collections
  const isPublished = (item) => {
    if (process.env.NODE_ENV === "production" && item.data.draft === true) return false;
    return true;
  };

  eleventyConfig.addCollection("posts", (api) =>
    api
      .getFilteredByGlob("src/posts/**/index.md")
      .filter(isPublished)
      .sort((a, b) => new Date(b.data.date) - new Date(a.data.date))
  );

  eleventyConfig.addCollection("projects", (api) =>
    api
      .getFilteredByGlob("src/projects/**/index.md")
      .filter(isPublished)
      .sort((a, b) => new Date(b.data.date) - new Date(a.data.date))
  );

  eleventyConfig.addCollection("tagList", (api) => {
    // Dedupe by slugified value to avoid permalink collisions like
    // "machine learning" and "machine-learning" both → /tags/machine-learning/
    const slugify = (s) =>
      String(s).toLowerCase().trim().replace(/[^\w]+/g, "-").replace(/^-|-$/g, "");
    const seen = new Map();
    api.getFilteredByGlob("src/posts/**/index.md").forEach((item) => {
      (item.data.tags || []).forEach((t) => {
        const key = slugify(t);
        if (key && !seen.has(key)) seen.set(key, t);
      });
    });
    return [...seen.values()].sort();
  });

  return {
    dir: {
      input: "src",
      output: "_site",
      includes: "_includes",
      data: "_data",
    },
    markdownTemplateEngine: false,
    htmlTemplateEngine: "njk",
    templateFormats: ["njk", "md", "html", "11ty.js"],
  };
}
