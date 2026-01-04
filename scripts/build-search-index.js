/* This script builds a FlexSearch index from all HTML files in the dist directory */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { JSDOM } from "jsdom";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const distDir = path.join(__dirname, "../dist");
const outputFile = path.join(distDir, "search-index.json");

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

// Build the search index
async function buildSearchIndex() {
	console.log("Building search index...");

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
	console.log(`Writing search index to ${outputFile}`);

	fs.writeFileSync(outputFile, JSON.stringify(documents, null, 2), "utf-8");

	console.log("Search index built successfully!");
}

buildSearchIndex().catch((error) => {
	console.error("Failed to build search index:", error);
	process.exit(1);
});
