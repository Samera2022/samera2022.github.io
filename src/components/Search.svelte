<script lang="ts">
import I18nKey from "@i18n/i18nKey";
import { i18n } from "@i18n/translation";
import Icon from "@iconify/svelte";
import { url } from "@utils/url-utils.ts";
import { onMount } from "svelte";
import type { SearchResult } from "@/global";
import FlexSearch from "flexsearch";

let keywordDesktop = "";
let keywordMobile = "";
let result: SearchResult[] = [];
let isSearching = false;
let searchIndex: any = null;
let searchDocuments: any[] = [];
let initialized = false;

// Chunk loading state
let searchIndexMeta: any = null;
let loadedChunks: Set<string> = new Set();
let chunkCache: Map<string, any[]> = new Map();

const fakeResult: SearchResult[] = [
	{
		url: url("/"),
		meta: {
			title: "This Is a Fake Search Result",
		},
		excerpt:
			"Because the search cannot work in the <mark>dev</mark> environment.",
	},
	{
		url: url("/"),
		meta: {
			title: "If You Want to Test the Search",
		},
		excerpt: "Try running <mark>npm build && npm preview</mark> instead.",
	},
];

const togglePanel = () => {
	const panel = document.getElementById("search-panel");
	panel?.classList.toggle("float-panel-closed");
};

const setPanelVisibility = (show: boolean, isDesktop: boolean): void => {
	const panel = document.getElementById("search-panel");
	if (!panel || !isDesktop) return;

	if (show) {
		panel.classList.remove("float-panel-closed");
	} else {
		panel.classList.add("float-panel-closed");
	}
};

// Highlight search terms in text
function highlightText(text: string, keyword: string): string {
	if (!keyword || !text) return text;
	const regex = new RegExp(`(${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
	return text.replace(regex, '<mark>$1</mark>');
}

// Create excerpt from content
function createExcerpt(content: string, keyword: string, length: number = 150): string {
	if (!content) return '';
	
	const lowerContent = content.toLowerCase();
	const lowerKeyword = keyword.toLowerCase();
	const index = lowerContent.indexOf(lowerKeyword);
	
	if (index === -1) {
		return highlightText(content.substring(0, length) + (content.length > length ? '...' : ''), keyword);
	}
	
	const start = Math.max(0, index - 50);
	const end = Math.min(content.length, index + keyword.length + 100);
	const excerpt = (start > 0 ? '...' : '') + content.substring(start, end) + (end < content.length ? '...' : '');
	
	return highlightText(excerpt, keyword);
}

// Load a specific chunk
async function loadChunk(chunkFile: string): Promise<any[]> {
	if (chunkCache.has(chunkFile)) {
		return chunkCache.get(chunkFile)!;
	}

	try {
		const response = await fetch(`/search/${chunkFile}`);
		const documents = await response.json();
		chunkCache.set(chunkFile, documents);
		loadedChunks.add(chunkFile);
		console.log(`Loaded chunk: ${chunkFile} (${documents.length} documents)`);
		return documents;
	} catch (error) {
		console.error(`Failed to load chunk ${chunkFile}:`, error);
		return [];
	}
}

// Index documents into FlexSearch
function indexDocuments(documents: any[]) {
	for (const doc of documents) {
		if (!searchDocuments.find(d => d.id === doc.id)) {
			searchDocuments.push(doc);
			const searchText = `${doc.title} ${doc.description} ${doc.content}`;
			searchIndex.add(doc.id, searchText);
		}
	}
}

const search = async (keyword: string, isDesktop: boolean): Promise<void> => {
	if (!keyword) {
		setPanelVisibility(false, isDesktop);
		result = [];
		return;
	}

	if (!initialized) {
		return;
	}

	isSearching = true;

	try {
		let searchResults: SearchResult[] = [];

		if (import.meta.env.PROD && searchIndex && searchIndexMeta) {
			// Load first chunk if nothing loaded yet
			if (loadedChunks.size === 0 && searchIndexMeta.chunks.length > 0) {
				const firstChunk = searchIndexMeta.chunks[0];
				const documents = await loadChunk(firstChunk.file);
				indexDocuments(documents);
			}

			// Search using FlexSearch
			const results = searchIndex.search(keyword, { limit: 10, suggest: true });
			
			searchResults = results.map((id: string) => {
				const doc = searchDocuments.find(d => d.id === id);
				if (!doc) return null;
				
				return {
					url: doc.url,
					meta: {
						title: doc.title,
					},
					excerpt: createExcerpt(doc.content, keyword),
				};
			}).filter(Boolean);

			// If results are insufficient and there are unloaded chunks, load more
			if (searchResults.length < 5 && loadedChunks.size < searchIndexMeta.chunks.length) {
				const unloadedChunks = searchIndexMeta.chunks.filter(
					(chunk: any) => !loadedChunks.has(chunk.file)
				);
				
				if (unloadedChunks.length > 0) {
					// Load next chunk
					const nextChunk = unloadedChunks[0];
					const documents = await loadChunk(nextChunk.file);
					indexDocuments(documents);
					
					// Re-search with updated index
					const newResults = searchIndex.search(keyword, { limit: 10, suggest: true });
					searchResults = newResults.map((id: string) => {
						const doc = searchDocuments.find(d => d.id === id);
						if (!doc) return null;
						
						return {
							url: doc.url,
							meta: {
								title: doc.title,
							},
							excerpt: createExcerpt(doc.content, keyword),
						};
					}).filter(Boolean);
				}
			}
		} else if (import.meta.env.DEV) {
			searchResults = fakeResult;
		} else {
			searchResults = [];
			console.error("Search is not available in production environment.");
		}

		result = searchResults;
		setPanelVisibility(result.length > 0, isDesktop);
	} catch (error) {
		console.error("Search error:", error);
		result = [];
		setPanelVisibility(false, isDesktop);
	} finally {
		isSearching = false;
	}
};

onMount(async () => {
	if (import.meta.env.DEV) {
		console.log("Search is not available in development mode. Using mock data.");
		initialized = true;
		return;
	}

	try {
		// Load search index metadata
		const response = await fetch('/search/index.json');
		searchIndexMeta = await response.json();

		// Create FlexSearch index with Chinese and English support
		searchIndex = new FlexSearch.Index({
			tokenize: "full",
			resolution: 9
		});

		console.log(`Search initialized with ${searchIndexMeta.totalDocuments} documents in ${searchIndexMeta.chunks.length} chunks`);
		initialized = true;

		// Trigger search if there's already a keyword
		if (keywordDesktop) search(keywordDesktop, true);
		if (keywordMobile) search(keywordMobile, false);
	} catch (error) {
		console.error("Failed to initialize search:", error);
		initialized = true; // Still mark as initialized to allow fallback behavior
	}
});

$: if (initialized && keywordDesktop) {
	(async () => {
		await search(keywordDesktop, true);
	})();
}

$: if (initialized && keywordMobile) {
	(async () => {
		await search(keywordMobile, false);
	})();
}
</script>

<!-- search bar for desktop view -->
<div id="search-bar" class="hidden lg:flex transition-all items-center h-11 mr-2 rounded-lg
      bg-black/[0.04] hover:bg-black/[0.06] focus-within:bg-black/[0.06]
      dark:bg-white/5 dark:hover:bg-white/10 dark:focus-within:bg-white/10
">
    <Icon icon="material-symbols:search" class="absolute text-[1.25rem] pointer-events-none ml-3 transition my-auto text-black/30 dark:text-white/30"></Icon>
    <input placeholder="{i18n(I18nKey.search)}" bind:value={keywordDesktop} on:focus={() => search(keywordDesktop, true)}
           class="transition-all pl-10 text-sm bg-transparent outline-0
         h-full w-40 active:w-60 focus:w-60 text-black/50 dark:text-white/50"
    >
</div>

<!-- toggle btn for phone/tablet view -->
<button on:click={togglePanel} aria-label="Search Panel" id="search-switch"
        class="btn-plain scale-animation lg:!hidden rounded-lg w-11 h-11 active:scale-90">
    <Icon icon="material-symbols:search" class="text-[1.25rem]"></Icon>
</button>

<!-- search panel -->
<div id="search-panel" class="float-panel float-panel-closed search-panel absolute md:w-[30rem]
top-20 left-4 md:left-[unset] right-4 shadow-2xl rounded-2xl p-2">

    <!-- search bar inside panel for phone/tablet -->
    <div id="search-bar-inside" class="flex relative lg:hidden transition-all items-center h-11 rounded-xl
      bg-black/[0.04] hover:bg-black/[0.06] focus-within:bg-black/[0.06]
      dark:bg-white/5 dark:hover:bg-white/10 dark:focus-within:bg-white/10
  ">
        <Icon icon="material-symbols:search" class="absolute text-[1.25rem] pointer-events-none ml-3 transition my-auto text-black/30 dark:text-white/30"></Icon>
        <input placeholder="Search" bind:value={keywordMobile}
               class="pl-10 absolute inset-0 text-sm bg-transparent outline-0
               focus:w-60 text-black/50 dark:text-white/50"
        >
    </div>

    <!-- search results -->
    {#each result as item}
        <a href={item.url}
           class="transition first-of-type:mt-2 lg:first-of-type:mt-0 group block
       rounded-xl text-lg px-3 py-2 hover:bg-[var(--btn-plain-bg-hover)] active:bg-[var(--btn-plain-bg-active)]">
            <div class="transition text-90 inline-flex font-bold group-hover:text-[var(--primary)]">
                {item.meta.title}<Icon icon="fa6-solid:chevron-right" class="transition text-[0.75rem] translate-x-1 my-auto text-[var(--primary)]"></Icon>
            </div>
            <div class="transition text-sm text-50">
                {@html item.excerpt}
            </div>
        </a>
    {/each}
</div>

<style>
  input:focus {
    outline: 0;
  }
  .search-panel {
    max-height: calc(100vh - 100px);
    overflow-y: auto;
  }
</style>
