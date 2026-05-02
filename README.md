# flnzba.github.io

Florian Zeba's personal site — built with [Eleventy](https://www.11ty.dev/) and styled with [Pico CSS](https://picocss.com/). Deployed to GitHub Pages at [fzeba.com](https://fzeba.com).

## Stack

- **Eleventy 3** static site generator
- **Pico CSS** (classless) + a thin custom layer
- **Nunjucks** templates
- **Pagefind** for full-text search
- **Crier** (Python) for cross-posting to DEV.to and Hashnode via GitHub Actions

## Local development

```bash
cd site-11ty
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
canonical_url: https://fzeba.com/posts/post-slug/
published: true                # set false to skip cross-posting
---
```

4. Commit and push to `main` — the deploy workflow builds + publishes the site, and the cross-post workflow posts to DEV.to and Hashnode (see below).

## Authoring a project

Same shape, but in `src/projects/<slug>/index.md`. Projects are not cross-posted.

## Cross-posting (Crier)

Cross-posting is automated via `.github/workflows/crosspost.yml`. After a push to `main` that touches `src/posts/**/*.md`:

1. The workflow installs Crier (`pip install crier`).
2. Runs `crier audit --publish --batch --long-form` — Crier compares each post against `.crier/registry.yaml` and publishes anything missing/changed to the platforms in the `blogs` profile.
3. Commits the updated `.crier/registry.yaml` back with `[skip ci]`.

### Required repo secrets

| Secret                       | Format                                      |
|------------------------------|---------------------------------------------|
| `DEVTO_API_KEY`              | DEV.to API key                              |
| `HASHNODE_API_KEY`           | `<token>:<publication_id>`                  |

> **Medium**: Medium retired their public API in January 2025 and no longer issues new integration tokens. The cross-post workflow only targets DEV.to and Hashnode. If you already have a pre-2025 Medium token, re-add `- medium` to `.crier/config.yaml` (under `profiles.blogs`), uncomment `MEDIUM_INTEGRATION_TOKEN` in `.env.example`, and re-add the `CRIER_MEDIUM_API_KEY` env var to `.github/workflows/crosspost.yml`.

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

- **Medium is unsupported** — Medium retired their public API in January 2025 and stopped issuing integration tokens. Programmatic publishing is not possible without a pre-2025 token. Manual cross-posting via Medium's "Import a story" feature is still available.
- **canonical_url** is required for SEO — it tells DEV.to and Hashnode that fzeba.com is the original source.
- The `[skip ci]` marker in the registry-update commit prevents an infinite loop with the deploy workflow.

## License

Content © Florian Zeba. Code MIT.
