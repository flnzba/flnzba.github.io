#!/usr/bin/env node
/**
 * One-off migration: rewrite Astro frontmatter into the new 11ty schema
 * and copy each post/project folder (markdown + sibling images) into
 * site-11ty/src/{posts,projects}/<slug>/.
 *
 * Run from site-11ty/:  npm run migrate
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";
import slugify from "slugify";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT  = path.resolve(__dirname, "..", "..");
const SRC_BASE   = path.join(REPO_ROOT, "src", "content");
const DEST_BASE  = path.join(REPO_ROOT, "site-11ty", "src");
const SITE_URL   = "https://fzeba.com";

const COLLECTIONS = [
  { name: "post",    srcDir: "post",    destDir: "posts",    canonicalBase: "/posts" },
  { name: "project", srcDir: "project", destDir: "projects", canonicalBase: "/projects" },
];

function makeSlug(folderName) {
  // Strip leading "NN_" or "N-" numeric prefix. Convert remaining underscores to hyphens.
  const stripped = folderName.replace(/^\d+[_\-]/, "").replace(/_/g, "-");
  return slugify(stripped, { lower: true, strict: true });
}

function extractNumberPrefix(folderName, title) {
  // "30_oetv-..." → 30 ; titles like "#30 OETV..." → also 30
  const m1 = folderName.match(/^(\d+)/);
  const m2 = title && title.match(/^#?\s*(\d+)\s+/);
  return (m1 && parseInt(m1[1], 10)) || (m2 && parseInt(m2[1], 10)) || null;
}

function cleanTitle(title) {
  if (!title) return title;
  // Strip leading "#NN", "#NN.M", "NN.", "#NN: ", with optional trailing punctuation/space
  return title.replace(/^#?\s*\d+(?:\.\d+)?\s*[.:]?\s*/, "").trim();
}

function toIsoDate(value) {
  if (!value) return undefined;
  const d = new Date(value);
  if (isNaN(d)) return value;
  return d.toISOString().slice(0, 10);
}

function rewriteData(old, slug, canonicalBase, folderName) {
  const cleaned = cleanTitle(old.title);
  const number  = extractNumberPrefix(folderName, old.title);

  const out = {
    title: cleaned,
    description: old.description,
    date: toIsoDate(old.publishDate || old.date),
  };
  if (old.updatedDate || old.updated) out.updated = toIsoDate(old.updatedDate || old.updated);
  if (Array.isArray(old.tags) && old.tags.length) {
    out.tags = [...new Set(old.tags.map((t) => String(t).toLowerCase()))];
  }
  if (old.coverImage && old.coverImage.src) {
    let src = old.coverImage.src;
    if (!src.startsWith("./") && !src.startsWith("/")) src = "./" + src;
    out.cover = { src, alt: old.coverImage.alt || "" };
  }
  if (old.draft === true) out.draft = true;
  if (number != null) out.number = number;
  out.canonical_url = `${SITE_URL}${canonicalBase}/${slug}/`;
  out.published = old.draft === true ? false : true;
  return out;
}

function copyDir(srcDir, destDir) {
  fs.mkdirSync(destDir, { recursive: true });
  for (const entry of fs.readdirSync(srcDir, { withFileTypes: true })) {
    if (entry.name === "index.md") continue;
    const s = path.join(srcDir, entry.name);
    const d = path.join(destDir, entry.name);
    if (entry.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

let total = 0, errors = 0;
const usedSlugs = new Set();

for (const col of COLLECTIONS) {
  const srcRoot = path.join(SRC_BASE, col.srcDir);
  if (!fs.existsSync(srcRoot)) continue;

  const entries = fs.readdirSync(srcRoot, { withFileTypes: true });

  for (const entry of entries) {
    let folderName, mdPath, isFolder;
    if (entry.isDirectory()) {
      folderName = entry.name;
      mdPath = path.join(srcRoot, folderName, "index.md");
      isFolder = true;
    } else if (entry.name.endsWith(".md")) {
      folderName = entry.name.replace(/\.md$/, "");
      mdPath = path.join(srcRoot, entry.name);
      isFolder = false;
    } else continue;

    if (!fs.existsSync(mdPath)) continue;

    const slug = makeSlug(folderName);
    if (usedSlugs.has(`${col.destDir}/${slug}`)) {
      console.error(`  ⚠ slug collision in ${col.destDir}: ${slug} (folder ${folderName})`);
      errors++;
      continue;
    }
    usedSlugs.add(`${col.destDir}/${slug}`);

    try {
      const raw = fs.readFileSync(mdPath, "utf8");
      const parsed = matter(raw);
      const newData = rewriteData(parsed.data, slug, col.canonicalBase, folderName);

      const destDir = path.join(DEST_BASE, col.destDir, slug);
      fs.mkdirSync(destDir, { recursive: true });

      if (isFolder) copyDir(path.join(srcRoot, folderName), destDir);

      const newFile = matter.stringify(parsed.content, newData);
      fs.writeFileSync(path.join(destDir, "index.md"), newFile, "utf8");

      total++;
      console.log(`  ✔ ${col.destDir}/${slug}`);
    } catch (err) {
      errors++;
      console.error(`  ✗ ${folderName}: ${err.message}`);
    }
  }
}

console.log(`\nMigrated ${total} files; ${errors} errors.`);
process.exit(errors ? 1 : 0);
