import { defineCollection, z } from 'astro:content';

function removeDupsAndLowerCase(array: string[]) {
  if (!array.length) return array;
  const lowercaseItems = array.map((str) => str.toLowerCase());
  const distinctItems = new Set(lowercaseItems);
  return Array.from(distinctItems);
}

const post = defineCollection({
  schema: ({ image }) =>
    z.object({
      coverImage: z
        .object({
          alt: z.string(),
          src: image(),
        })
        .optional(),
      description: z.string().min(50).max(200),
      draft: z.boolean().default(false),
      ogImage: z.string().optional(),
      publishDate: z
        .string()
        .or(z.date())
        .transform((val) => new Date(val)),
      tags: z.array(z.string()).default([]).transform(removeDupsAndLowerCase),
      title: z.string().max(80), // 80 characters limit for title of posts
      updatedDate: z
        .string()
        .optional()
        .transform((str) => (str ? new Date(str) : undefined)),
    }),
  type: 'content',
});

const project = defineCollection({
  schema: ({ image }) =>
    z.object({
      coverImage: z
        .object({
          alt: z.string(),
          src: image(),
        })
        .optional(),
      description: z.string().min(50).max(200),
      draft: z.boolean().default(false),
      ogImage: z.string().optional(),
      publishDate: z
        .string()
        .or(z.date())
        .transform((val) => new Date(val)),
      tags: z.array(z.string()).default([]).transform(removeDupsAndLowerCase),
      title: z.string().max(80),
      updatedDate: z
        .string()
        .optional()
        .transform((str) => (str ? new Date(str) : undefined)),
    }),
  type: 'content',
});

const insight = defineCollection({
  schema: ({ image }) =>
    z.object({
      coverImage: z
        .object({
          alt: z.string(),
          src: image(),
        })
        .optional(),
      description: z.string().min(50).max(200),
      draft: z.boolean().default(false),
      ogImage: z.string().optional(),
      publishDate: z
        .string()
        .or(z.date())
        .transform((val) => new Date(val)),
      tags: z.array(z.string()).default([]).transform(removeDupsAndLowerCase),
      title: z.string().max(80),
      updatedDate: z
        .string()
        .optional()
        .transform((str) => (str ? new Date(str) : undefined)),
    }),
  type: 'content',
});

export const collections = { post, project, insight };
