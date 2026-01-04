import { defineCollection, z } from "astro:content";

const postsCollection = defineCollection({
	schema: z.object({
		title: z.string(),
		published: z
			.union([z.date(), z.string()])
			.transform((val) => (typeof val === "string" ? new Date(val) : val)),
		updated: z
			.union([z.date(), z.string()])
			.transform((val) => (typeof val === "string" ? new Date(val) : val))
			.optional(),
		draft: z.boolean().optional().default(false),
		description: z.string().optional().default(""),
		image: z.string().optional().default(""),
		tags: z.array(z.string()).optional().default([]),
		category: z.string().optional().nullable().default(""),
		lang: z.string().optional().default(""),

		/* For internal use */
		prevTitle: z.string().default(""),
		prevSlug: z.string().default(""),
		nextTitle: z.string().default(""),
		nextSlug: z.string().default(""),
	}),
});
const specCollection = defineCollection({
	schema: z.object({}),
});
const categoriesCollection = defineCollection({
	schema: z.object({
		title: z.string(),
		description: z.string().optional().default(""),
		image: z.string().optional().default(""),
	}),
});
export const collections = {
	posts: postsCollection,
	spec: specCollection,
	categories: categoriesCollection,
};
