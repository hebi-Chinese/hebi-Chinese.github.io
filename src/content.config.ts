import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const generateContentId = ({ entry }: { entry: string }) => {
  const pathWithoutExtension = entry.replace(/\.(md|mdx)$/, '');
  return pathWithoutExtension.endsWith('/index')
    ? pathWithoutExtension.slice(0, -'/index'.length)
    : pathWithoutExtension;
};

const notes = defineCollection({
  loader: glob({
    base: './src/content/notes',
    pattern: '**/*.{md,mdx}',
    generateId: generateContentId,
  }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    tags: z.array(z.string()).optional(),
    draft: z.boolean().optional().default(false),
  }),
});

const essays = defineCollection({
  loader: glob({
    base: './src/content/essays',
    pattern: '**/*.{md,mdx}',
    generateId: generateContentId,
  }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    description: z.string().optional(),
    tags: z.array(z.string()).optional(),
    draft: z.boolean().optional().default(false),
  }),
});

export const collections = { notes, essays };
