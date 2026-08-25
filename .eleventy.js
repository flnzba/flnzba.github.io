import rssPlugin from "@11ty/eleventy-plugin-rss";
import syntaxHighlight from "@11ty/eleventy-plugin-syntaxhighlight";
import markdownIt from "markdown-it";
import markdownItAnchor from "markdown-it-anchor";
import markdownItAttrs from "markdown-it-attrs";

const OWNED_HOSTS = new Set(["fzeba.com", "www.fzeba.com"]);
const DEFAULT_SITE_URL = "https://www.fzeba.com";

function siteOrigin(siteUrl = DEFAULT_SITE_URL) {
  return String(siteUrl || "").replace(/\/+$/, "");
}

function absoluteUrl(input, siteUrl = DEFAULT_SITE_URL, currentPageUrl = "/") {
  if (currentPageUrl === "/" && String(siteUrl || "").startsWith("/")) {
    currentPageUrl = siteUrl;
    siteUrl = DEFAULT_SITE_URL;
  }

  const origin = siteOrigin(siteUrl);
  if (!input) return origin;

  let value = String(input).trim();
  if (value.startsWith("./")) {
    const basePath = String(currentPageUrl || "/").endsWith("/")
      ? String(currentPageUrl || "/")
      : `${currentPageUrl}/`;
    value = `${basePath}${value.slice(2)}`;
  }

  if (value.startsWith("//")) return `https:${value}`;

  try {
    return new URL(value, `${origin}/`).toString();
  } catch {
    return value;
  }
}

function pageAssetUrl(input, currentPageUrl = "/") {
  return absoluteUrl(input, DEFAULT_SITE_URL, currentPageUrl);
}

function pageCanonicalUrl(currentPageUrl = "/", canonicalValue) {
  return canonicalUrl(canonicalValue, DEFAULT_SITE_URL, currentPageUrl);
}

function canonicalUrl(input, siteUrl = DEFAULT_SITE_URL, currentPageUrl = "/") {
  const resolved = absoluteUrl(input || currentPageUrl || "/", siteUrl, currentPageUrl);
  try {
    const preferred = new URL(siteOrigin(siteUrl));
    const canonical = new URL(resolved);

    if (OWNED_HOSTS.has(canonical.hostname)) {
      canonical.protocol = preferred.protocol;
      canonical.hostname = preferred.hostname;
      canonical.port = preferred.port;
    }

    canonical.hash = "";
    return canonical.toString();
  } catch {
    return resolved;
  }
}

function compactKeywords(...sources) {
  const values = sources.flatMap((source) => {
    if (!source) return [];
    return Array.isArray(source) ? source : String(source).split(",");
  });

  return [...new Set(
    values
      .map((value) => String(value).trim())
      .filter(Boolean)
  )];
}

function jsonSafe(value) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

function toIsoDate(value) {
  return value ? new Date(value).toISOString() : undefined;
}

function pageTitle(title, site) {
  return title ? `${title} - ${site.title}` : site.title;
}

function imageForPage(cover, site, pageUrl) {
  if (cover?.src) return absoluteUrl(cover.src, site.url, pageUrl);
  return absoluteUrl(site.defaultImage, site.url);
}

function buildBreadcrumb(page, site, title, canonicalPageUrl) {
  let url = page?.url || "/";
  if (canonicalPageUrl) {
    try {
      url = new URL(canonicalPageUrl).pathname;
    } catch {
      url = page?.url || "/";
    }
  }
  const parts = url.split("/").filter(Boolean);
  const itemListElement = [
    {
      "@type": "ListItem",
      position: 1,
      name: "Home",
      item: `${siteOrigin(site.url)}/`,
    },
  ];

  if (parts[0] === "posts") {
    itemListElement.push({
      "@type": "ListItem",
      position: itemListElement.length + 1,
      name: "Posts",
      item: absoluteUrl("/posts/", site.url),
    });
  }

  if (url !== "/" && title) {
    itemListElement.push({
      "@type": "ListItem",
      position: itemListElement.length + 1,
      name: title,
      item: canonicalUrl(undefined, site.url, url),
    });
  }

  return {
    "@type": "BreadcrumbList",
    "@id": `${canonicalUrl(undefined, site.url, url)}#breadcrumb`,
    itemListElement,
  };
}

function buildStructuredData(page, site, options = {}) {
  const title = options.title || site.title;
  const description = options.description || site.description;
  const pageUrl = page?.url || "/";
  const canonical = canonicalUrl(options.canonicalUrl, site.url, pageUrl);
  const image = imageForPage(options.cover, site, pageUrl);
  const keywords = compactKeywords(site.keywords, options.tags);
  const personId = `${siteOrigin(site.url)}/#person`;
  const websiteId = `${siteOrigin(site.url)}/#website`;
  const webpageId = `${canonical}#webpage`;
  const breadcrumb = buildBreadcrumb(page, site, options.title, canonical);
  const sameAs = (site.social || []).map((profile) => profile.url);

  const graph = [
    {
      "@type": "Person",
      "@id": personId,
      name: site.author.name,
      url: siteOrigin(site.url),
      email: site.author.email || undefined,
      image: absoluteUrl(site.author.image, site.url),
      jobTitle: site.author.jobTitle,
      description: site.description,
      sameAs,
      knowsAbout: site.topics,
    },
    {
      "@type": "WebSite",
      "@id": websiteId,
      url: siteOrigin(site.url),
      name: site.title,
      alternateName: site.shortTitle,
      description: site.description,
      inLanguage: site.language,
      publisher: { "@id": personId },
    },
    {
      "@type": "WebPage",
      "@id": webpageId,
      url: canonical,
      name: pageTitle(options.title, site),
      description,
      isPartOf: { "@id": websiteId },
      about: { "@id": personId },
      author: { "@id": personId },
      inLanguage: site.language,
      primaryImageOfPage: {
        "@type": "ImageObject",
        url: image,
      },
      breadcrumb: { "@id": breadcrumb["@id"] },
      datePublished: toIsoDate(options.date),
      dateModified: toIsoDate(options.updated || options.date),
    },
    breadcrumb,
  ];

  if (options.contentType === "post") {
    graph.push({
      "@type": ["BlogPosting", "TechArticle"],
      "@id": `${canonical}#article`,
      mainEntityOfPage: canonical,
      headline: title,
      description,
      image,
      author: { "@id": personId },
      publisher: { "@id": personId },
      datePublished: toIsoDate(options.date),
      dateModified: toIsoDate(options.updated || options.date),
      keywords,
      articleSection: options.tags,
      inLanguage: site.language,
    });
  }


  return `<script type="application/ld+json">${jsonSafe({
    "@context": "https://schema.org",
    "@graph": graph,
  })}</script>`;
}

function contentIndex(site, posts = []) {
  const siteUrl = siteOrigin(site.url);
  const mapItem = (item, type) => {
    const data = item.data || {};
    return {
      "@type": "DataFeedItem",
      dateCreated: toIsoDate(data.date),
      dateModified: toIsoDate(data.updated || data.date),
      item: {
        "@type": type === "post" ? "BlogPosting" : "CreativeWork",
        name: data.title,
        headline: data.title,
        description: data.description,
        url: canonicalUrl(data.canonical_url, site.url, item.url),
        image: data.cover?.src ? absoluteUrl(data.cover.src, site.url, item.url) : undefined,
        keywords: compactKeywords(data.tags),
        author: {
          "@type": "Person",
          name: site.author.name,
          url: siteUrl,
        },
      },
    };
  };

  return jsonSafe({
    "@context": "https://schema.org",
    "@type": "DataFeed",
    name: `${site.title} content index`,
    description: "Machine-readable index of posts for search engines and AI answer engines.",
    url: `${siteUrl}/ai.json`,
    author: {
      "@type": "Person",
      name: site.author.name,
      url: siteUrl,
    },
    dataFeedElement: [
      ...posts.map((post) => mapItem(post, "post")),
    ],
  });
}

export default function (eleventyConfig) {
  // Plugins
  eleventyConfig.addPlugin(rssPlugin);
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
  eleventyConfig.addPassthroughCopy({ "src/css/site.css": "css/site.css" });
  eleventyConfig.addPassthroughCopy({ "src/js": "js" });
  eleventyConfig.addPassthroughCopy("src/image-store/**/*.{webp,png,jpg,jpeg,gif,svg,avif,ico}");
  eleventyConfig.addPassthroughCopy("src/posts/**/*.{webp,png,jpg,jpeg,gif,svg}");
  eleventyConfig.addPassthroughCopy({ "./CNAME": "CNAME" });

  // Watch CSS/JS so eleventy --serve reloads on changes
  eleventyConfig.addWatchTarget("src/css/");
  eleventyConfig.addWatchTarget("src/js/");
  eleventyConfig.addWatchTarget("src/image-store/");

  // Filters

  eleventyConfig.addFilter("htmlDateString", (date) =>
    new Date(date).toISOString().slice(0, 10)
  );

  eleventyConfig.addFilter("rfc3339", (date) =>
    new Date(date).toISOString()
  );

  eleventyConfig.addFilter("absoluteUrl", absoluteUrl);
  eleventyConfig.addFilter("pageAssetUrl", pageAssetUrl);
  eleventyConfig.addFilter("pageCanonicalUrl", pageCanonicalUrl);
  eleventyConfig.addFilter("compactKeywords", compactKeywords);
  eleventyConfig.addFilter("jsonValue", (value) => jsonSafe(value));

  eleventyConfig.addFilter("head", (array, n) => {
    if (!Array.isArray(array) || array.length === 0) return [];
    return n < 0 ? array.slice(n) : array.slice(0, n);
  });

  eleventyConfig.addFilter("byTag", (posts, tag) =>
    (posts || []).filter((p) => (p.data.tags || []).includes(tag))
  );

  // -- Citations -----------------------------------------------------------
  // Both filters take a paper from src/_data/research.js and derive the
  // citation from the fields already on the card, so the two can never
  // disagree. A paper without a `citation` block renders no citation at all
  // rather than a half-built one.
  //
  // Dates are formatted in UTC. "2026-06-29" parses as UTC midnight, so
  // reading it with local getters lands on the 28th anywhere west of
  // Greenwich — which would print the wrong date in a citation.
  const CITE_PAD = 14;

  // BibTeX splits an author list on the literal " and ", and expects
  // "Surname, Given" per name.
  const bibtexName = (name) => {
    const parts = String(name).trim().split(/\s+/);
    if (parts.length < 2) return String(name).trim();
    const surname = parts.pop();
    return `${surname}, ${parts.join(" ")}`;
  };

  // APA orders this "2026, June 29" — deliberately not the en-GB "29 June
  // 2026" used elsewhere on the site. A citation follows the citation style,
  // not the page's locale, and this matches the co-author's canonical entry.
  const citeDate = (iso) => {
    const d = new Date(`${iso}T00:00:00Z`);
    const month = d.toLocaleDateString("en-GB", {
      month: "long",
      timeZone: "UTC",
    });
    return `${d.getUTCFullYear()}, ${month} ${d.getUTCDate()}`;
  };

  eleventyConfig.addFilter("bibtex", (paper) => {
    const c = paper && paper.citation;
    if (!c) return "";
    const fields = [
      ["author", (paper.authors || []).map(bibtexName).join(" and ")],
      ["title", c.bibtexTitle || paper.title],
      ["institution", c.institution],
      ["howpublished", c.howpublished],
      ["year", paper.year],
      ["date", paper.date],
      ["pagetotal", paper.pages],
      ["url", c.url],
    ].filter(([, v]) => v !== undefined && v !== null && v !== "");

    const body = fields
      .map(([k, v]) => `  ${k.padEnd(CITE_PAD)}= {${v}},`)
      .join("\n");
    return `@${c.type || "misc"}{${c.key},\n${body}\n}`;
  });

  eleventyConfig.addFilter("plainCitation", (paper) => {
    const c = paper && paper.citation;
    if (!c) return "";
    const who = (paper.authors || []).join(", ");
    const when = paper.date ? `(${citeDate(paper.date)})` : `(${paper.year})`;
    const parts = [`${who}. ${when}. ${paper.title}.`];
    if (c.howpublished) parts.push(`${c.howpublished}.`);
    if (paper.pages) parts.push(`${paper.pages} pages.`);
    return parts.join(" ");
  });

  eleventyConfig.addShortcode("seoJsonLd", function (
    page,
    site,
    title,
    description,
    contentType,
    ogType,
    date,
    updated,
    tags,
    cover,
    canonicalUrlValue
  ) {
    return buildStructuredData(page, site, {
      title,
      description,
      contentType,
      ogType,
      date,
      updated,
      tags,
      cover,
      canonicalUrl: canonicalUrlValue,
    });
  });

  eleventyConfig.addShortcode("aiContentIndex", contentIndex);

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
