# flnzba.github.io

Florian Zeba's personal site — built with [Eleventy](https://www.11ty.dev/) and styled with [Tailwind CSS](https://tailwindcss.com/). Deployed to GitHub Pages at [www.fzeba.com](https://www.fzeba.com).

## Stack

- **Eleventy 3** static site generator
- **Tailwind CSS 4** generated with the official CLI
- **Nunjucks** templates
- **Pagefind** for full-text search
- **Crier** (Python) for cross-posting to DEV.to and Hashnode via GitHub Actions

## Local development

```bash
npm install
npm run serve              # http://localhost:8080
npm run build              # outputs _site/
npm run search             # build pagefind index after build
```

## Authoring a new post

1. Create `src/posts/<slug>/index.md`. Use kebab-case for the slug — it becomes the URL: `/posts/<slug>/`.
2. Drop any cover/inline images alongside `index.md` (they're passthrough-copied).
3. Use this frontmatter template:

```yaml
---
title: "Post title"
description: "1–2 sentence description (used as RSS summary and OG description)."
date: 2026-05-01
updated: 2026-05-01            # optional
tags: [data-engineering, python]
cover:
  src: ./cover.webp
  alt: "Cover image alt text"
draft: false
canonical_url: https://www.fzeba.com/posts/post-slug/
published: true                # set false to skip cross-posting
---
```

4. Commit and push to `main` — the deploy workflow builds + publishes the site, and the cross-post workflow posts to DEV.to and Hashnode (see below).

## Authoring a project

Same shape, but in `src/projects/<slug>/index.md`. Projects are not cross-posted.

## Image store

Paste standalone images into `src/image-store/`. On build, supported image files are copied to `/image-store/<filename>`, preserving subfolders. For example, `src/image-store/report/chart.webp` is available at `https://www.fzeba.com/image-store/report/chart.webp`.

## Cross-posting (Crier)

Cross-posting is automated via `.github/workflows/crosspost.yml`. After a push to `main` that touches `src/posts/**/*.md`:

1. The workflow installs the pinned Crier version from `requirements.txt`.
2. `scripts/prepare_crosspost.py` finds newly added `src/posts/*/index.md` files and writes sanitized staging files under `/tmp/flnzba-crosspost`.
3. The staged files keep only Crier metadata in front matter; the API body is frontmatter-free Markdown with relative links resolved and indented code blocks fenced for DEV.to/Hashnode rendering.
4. Runs `crier audit <staged-dir> --publish --batch --long-form` against DEV.to and Hashnode.
5. Commits the updated SQLite registry `.crier/crier.db` back with `[skip ci]`.

### Required repo secrets

| Secret                       | Format                                      |
|------------------------------|---------------------------------------------|
| `DEVTO_API_KEY`              | DEV.to API key                              |
| `HASHNODE_API_KEY`           | `<token>:<publication_id>`                  |

#### Setting them

Either one secret at a time:

```bash
gh secret set DEVTO_API_KEY            --repo flnzba/flnzba.github.io
gh secret set HASHNODE_API_KEY         --repo flnzba/flnzba.github.io
```

…or in bulk from a local `.env` file:

```bash
cp .env.example .env       # fill in real values
npm run secrets:push       # uploads each KEY=VALUE as a repo Actions secret
gh secret list --repo flnzba/flnzba.github.io   # verify
```

`.env` is gitignored — it never reaches the repo. The helper script (`scripts/sync-secrets.sh`) only pushes the values into GitHub's encrypted secret store, which the workflow reads at run time via `${{ secrets.* }}`.

### Caveats

- **canonical_url** is required for SEO — it tells DEV.to and Hashnode that www.fzeba.com is the original source.
- The workflow only publishes newly added post files from the triggering commit or the optional manual `post` input, so enabling the registry does not publish the entire archive at once.
- The `[skip ci]` marker in the registry-update commit prevents an infinite loop with the deploy workflow.

## License

Content © Florian Zeba. Code MIT.
