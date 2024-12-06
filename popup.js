// Constants
const API_URL = "https://hn.algolia.com/api/v1/search";
const HN_URL = "https://news.ycombinator.com";

// Clean URL by removing tracking parameters and normalizing
function cleanUrl(url) {
	try {
		const urlObj = new URL(url);
		const params = urlObj.searchParams;

		// Remove common tracking parameters
		["utm_", "clid", "fbclid", "gclid", "ref", "source", "_ga"].forEach(
			(param) => {
				for (const key of params.keys()) {
					if (key.includes(param)) {
						params.delete(key);
					}
				}
			}
		);

		// Rebuild URL without tracking
		urlObj.search = params.toString();
		return urlObj
			.toString()
			.replace(/^https?:\/\/(www\.)?/, "") // Remove protocol and www
			.replace(/\/$/, ""); // Remove trailing slash
	} catch (error) {
		console.error("URL cleaning error:", error);
		return url;
	}
}

// Create HTML for a single HN post
function createPostHtml(post) {
	return `
        <div class="hn-link">
            <a href="${HN_URL}/item?id=${post.objectID}" target="_blank">
                ${post.title || "HN Discussion"}
            </a>
            <div class="subtext">
                ${post.points || 0} points by 
                <a href="${HN_URL}/user?id=${post.author}" target="_blank">${
		post.author || "user"
	}</a> | 
                <a href="${HN_URL}/item?id=${post.objectID}" target="_blank">${
		post.num_comments || 0
	} comments</a>
            </div>
        </div>
    `;
}

// Render no results found message
function renderNoResults(url) {
	const submitUrl = `${HN_URL}/submitlink?u=${encodeURIComponent(url)}`;
	return `
        <div class="hn-link">
            <div style="margin-bottom: 10px">No Hacker News posts found for this URL.</div>
            <a href="${submitUrl}" target="_blank">Create new post on Hacker News</a>
        </div>
    `;
}

// Search HN and render results
async function searchHackerNews(url) {
	const content = document.getElementById("content");

	try {
		const params = new URLSearchParams({
			query: cleanUrl(url),
			restrictSearchableAttributes: "url",
			analytics: false,
		});

		const response = await fetch(`${API_URL}?${params}`);
		const data = await response.json();

		// Render results
		content.innerHTML =
			data.hits.length > 0
				? data.hits.map(createPostHtml).join("")
				: renderNoResults(url);
	} catch (error) {
		console.error("Error:", error);
		content.innerHTML =
			'<div class="error">Error loading Hacker News data. Please try again.</div>';
	}
}

// Initialize when popup opens
document.addEventListener("DOMContentLoaded", () => {
	chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
		const url = tabs[0].url;
		if (url.startsWith("http")) {
			searchHackerNews(url);
		} else {
			document.getElementById("content").innerHTML =
				'<div class="error">This page cannot be submitted to Hacker News.</div>';
		}
	});
});
