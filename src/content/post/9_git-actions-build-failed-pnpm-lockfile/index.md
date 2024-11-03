---
title: "#9 When GitHub Actions Build Fails Due to pnpm-lockfile"
description: "What to do when GitHub Actions build fails due to pnpm-lockfile and github suggests to run pnpm no frozen-lockfile"
publishDate: "04 November 2024"
updatedDate: "04 November 2024"
coverImage:
  src: "./github-build-failed-pnpm-lockfile.webp"
  alt: "Screenshot Github Build Failed"
tags: ["Github Actions", "yml", "pnpm"]
---

# How to Resolve GitHub Actions Build Failures for Astro Sites

## Introduction
When deploying projects using GitHub Actions, encountering errors can be a common but frustrating setback. Recently, I faced an issue with a mismatch in package versions and outdated dependencies, which typically suggests running a specific command. However, in my case, the typical solution didn’t work. This post details a successful workaround.

**The Problem**
While attempting to deploy an Astro site via GitHub Actions, I encountered an error indicating that my project's lockfile was outdated in relation to the `package.json` file, preventing the build process. The error specifically stated:

```
ERR_PNPM_OUTDATED_LOCKFILE Cannot install with 'frozen-lockfile' because pnpm-lock.yaml is not up to date with package.json
```

Common advice suggests using `pnpm install --no-frozen-lockfile` to resolve such issues, but this did not work for me.

## Step-by-Step Solution
Here's how I successfully resolved the error:

1. **Analyze the Error**: Start by closely reading the error message provided during the build process. It often points directly to the nature of the issue, which is typically related to dependency management.

2. **Synchronize Your Lockfile**:
   - First, ensure your local development environment is set up correctly. Run `pnpm install` to update all dependencies and synchronize the lockfile (`pnpm-lock.yaml`) with your `package.json`.

3. **Update the GitHub Workflow**:
   - Modify your GitHub Actions workflow file to include the `pnpm install` command (optional) without the `--frozen-lockfile` flag. This allows pnpm to update the lockfile during the CI/CD process if necessary.
   - I personally prefer to run the `pnpm install` command locally and the run the build process in the CI/CD pipeline. I don't include the `pnpm install` command in the workflow file to avoid package conflicts when running the build process.
   - Here’s a snippet to include in your `.github/workflows/build.yml`:

     ```yaml
     - name: Install Dependencies
       run: pnpm install
     ```

4. **Test Locally**:
   - Before pushing your changes, test the build process locally. Run `pnpm run build` to ensure everything compiles without errors.

5. **Push Changes and Rebuild**:
   - Commit your updated `pnpm-lock.yaml` and workflow files to your repository and push them to GitHub. Monitor the Actions tab to see if the build passes.

## Conclusion

```bash
pnpm install
pnpm run build
```

***... can do wonders!***
