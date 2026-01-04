/* This script builds a FlexSearch index from all HTML files in the dist directory */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { JSDOM } from "jsdom";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const distDir = path.join(__dirname, "../dist");
const _outputFile = path.join(distDir, "search-index.json");

// Recursively find all HTML files
/**
 * @param {string} dir
 * @param {string[]} fileList
 * @returns {string[]}
 */
function findHtmlFiles(dir, fileList = []) {
	const files = fs.readdirSync(dir);

	for (const file of files) {
		const filePath = path.join(dir, file);
		const stat = fs.statSync(filePath);

		if (stat.isDirectory()) {
			findHtmlFiles(filePath, fileList);
		} else if (file.endsWith(".html")) {
			fileList.push(filePath);
		}
	}

	return fileList;
}

// Extract text content from HTML
/**
 * @param {string} htmlPath
 */
function extractContent(htmlPath) {
	try {
		const html = fs.readFileSync(htmlPath, "utf-8");
		const dom = new JSDOM(html);
		const doc = dom.window.document;

		// Find the main content area (with data-pagefind-body or fallback to body)
		const contentElement =
			doc.querySelector("[data-pagefind-body]") || doc.body;

		// Remove script, style, and ignored elements
		const excludeSelectors = [
			"script",
			"style",
			"nav",
			"header",
			"footer",
			".search-panel",
			"#search-panel",
			"[data-pagefind-ignore]",
			".katex",
			".katex-display",
		];

		for (const selector of excludeSelectors) {
			const elements = contentElement.querySelectorAll(selector);
			for (const el of elements) {
				el.remove();
			}
		}

		// Extract title
		const title = doc.querySelector("title")?.textContent || "";

		// Extract meta description
		const description =
			doc.querySelector('meta[name="description"]')?.getAttribute("content") ||
			"";

		// Extract main content text
		const content = contentElement.textContent.replace(/\s+/g, " ").trim();

		// Get relative URL
		const relativeUrl =
			"/" +
			path
				.relative(distDir, htmlPath)
				.replace(/\\/g, "/")
				.replace(/index\.html$/, "");

		return {
			id: relativeUrl,
			url: relativeUrl,
			title: title,
			description: description,
			content: content,
		};
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		console.error(`Error processing ${htmlPath}:`, errorMessage);
		return null;
	}
}

// Build the search index with chunking
async function buildSearchIndex() {
	console.log("Building search index with chunking...");

	if (!fs.existsSync(distDir)) {
		console.error(`Error: dist directory not found at ${distDir}`);
		console.error('Please run "pnpm build" first.');
		process.exit(1);
	}

	const htmlFiles = findHtmlFiles(distDir);
	console.log(`Found ${htmlFiles.length} HTML files`);

	const documents = [];

	for (const file of htmlFiles) {
		const doc = extractContent(file);
		if (doc?.content) {
			documents.push(doc);
			console.log(`Indexed: ${doc.url}`);
		}
	}

	console.log(`\nIndexed ${documents.length} pages`);

	// Group documents into chunks by path
	/** @type {{ posts: any[], pages: any[] }} */
	const chunks = {
		posts: [],
		pages: [],
	};

	for (const doc of documents) {
		if (doc.url.startsWith("/posts/")) {
			chunks.posts.push(doc);
		} else {
			chunks.pages.push(doc);
		}
	}

	// Create search directory
	const searchDir = path.join(distDir, "search");
	if (!fs.existsSync(searchDir)) {
		fs.mkdirSync(searchDir, { recursive: true });
	}

	// Write chunk files
	const chunkFiles = [];

	if (chunks.posts.length > 0) {
		const postsFile = "chunk-posts.json";
		fs.writeFileSync(
			path.join(searchDir, postsFile),
			JSON.stringify(chunks.posts, null, 2),
			"utf-8",
		);
		chunkFiles.push({
			file: postsFile,
			count: chunks.posts.length,
			category: "posts",
		});
		console.log(`Created ${postsFile} with ${chunks.posts.length} posts`);
	}

	if (chunks.pages.length > 0) {
		const pagesFile = "chunk-pages.json";
		fs.writeFileSync(
			path.join(searchDir, pagesFile),
			JSON.stringify(chunks.pages, null, 2),
			"utf-8",
		);
		chunkFiles.push({
			file: pagesFile,
			count: chunks.pages.length,
			category: "pages",
		});
		console.log(`Created ${pagesFile} with ${chunks.pages.length} pages`);
	}

	// Write index file
	const indexData = {
		version: 1,
		totalDocuments: documents.length,
		chunks: chunkFiles,
		timestamp: new Date().toISOString(),
	};

	fs.writeFileSync(
		path.join(searchDir, "index.json"),
		JSON.stringify(indexData, null, 2),
		"utf-8",
	);

	console.log("\nCreated search index:");
	console.log(`  - Total documents: ${indexData.totalDocuments}`);
	console.log(`  - Chunks: ${chunkFiles.length}`);
	console.log(`  - Location: ${searchDir}`);
	console.log("Search index built successfully!");
}

buildSearchIndex().catch((error) => {
	console.error("Failed to build search index:", error);
	process.exit(1);
});
