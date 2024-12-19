---
title: '#11 Import JSON Data in Astro (with Typescript)'
description: 'Refactoring Code for Enhanced Maintainability: From In-file Data Object to JSON-Data Import in Astro (with Typescript)'
publishDate: '19 December 2024'
updatedDate: '19 December 2024'
coverImage:
  src: './cover-data.webp'
  alt: 'Guy working on a laptop'
tags: ['JSON', 'Typescript', 'Astro']
---

# Refactoring Code for Enhanced Maintainability: From In-file Data Objects to JSON

## The Original Approach: In-file Data Object

Initially, the technology stack data for the front page of [fzeba.com](https://fzeba.com) was embedded directly within the React component using a constant array `cactusTech`. This array held multiple technology entries, each described by properties like `desc`, `href`, and `title`. The array was directly used in the component to render the technology stack section.

While this approach worked, a better solution (for me) was to separate the data from the component code. Then load the data from a JSON file, which would make the code more maintainable and scalable.

Here's a snippet of the original (React) component using the in-file data object:

```html
<section class="mt-16">
  <h2 class="title mb-4 text-xl">Technology Stack</h2>
  <dl class="space-y-4">
    {cactusTech.map(({ desc, href, title }) => (
    <div class="flex flex-col gap-2 sm:flex-row">
      <dt>
        <span class="flex">
          <a class="cactus-link" href="{href}" rel="noreferrer" target="_blank">
            {title} </a
          >:
        </span>
      </dt>
      <dd>{desc}</dd>
    </div>
    ))}
  </dl>
</section>
```

## The Improved Approach: JSON Data File

To address these issues, I refactored the code to load the technology stack data from a separate JSON file. This change provided several benefits:

- **Improved Maintainability**: Separating the data from the component code makes the system easier to maintain and modify.
- **Enhanced Scalability**: With data in a separate file, adding or updating technology stack entries is simpler and does not require modifications to the component code.
- **Better Organization**: The separation adheres to modern development practices, keeping the codebase cleaner and more organized.

The refactored code now loads the technology data from a JSON file, as shown below:

```html
<!-- Loads TechStack data via json file -->
<section class="mt-16">
  <h2 class="title mb-4 text-xl">Tech Stack</h2>
  <dl class="space-y-4">
    {techStack.map(techPoint => (
    <div class="flex flex-col gap-2 sm:flex-row">
      <span class="flex">
        <a
          class="cactus-link"
          href="{techPoint.href}"
          rel="noreferrer"
          target="_blank"
        >
          {techPoint.title} </a
        >:
      </span>
      <h2>{techPoint.title}</h2>
      <p>{techPoint.desc}</p>
    </div>
    ))}
  </dl>
</section>
```

The data file `techStack.json` looks like this:

```json
[
  {
    "desc": "OOP and so on...",
    "href": "#",
    "title": "Java"
  },
  {
    "desc": "Website stuff and so on...",
    "href": "#",
    "title": "Javascript"
  }
  // Other technologies and so on...
]
```

## Outcome and Benefits

The migration to a JSON-based data handling approach has made the codebase more flexible and maintainable. It simplifies updates and ensures that the application can scale more effectively as new technologies are added to the stack. This refactor not only improves the current state of the project but also aligns it with best practices for future development and maintenance.

## Conclusion

Refactoring might require some upfront effort but is often worth it for the benefits it brings in terms of maintainability and scalability. By separating concerns and extracting the data layer from the presentation layer, applications can grow more seamlessly and remain manageable even as they evolve (totally not written by a AI - trust me).
