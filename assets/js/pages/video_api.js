const configuredVideoApiBase = window.DMD_API_BASE_URL?.replace(/\/$/, "");
const videoApiCandidates = [
  configuredVideoApiBase,
  location.protocol.startsWith("http") ? location.origin.replace(/\/$/, "") : null,
  "http://127.0.0.1:8002",
].filter((value, index, values) => value && values.indexOf(value) === index);
let videoApiBasePromise = null;
const videosPerPage = 12;
let videoItems = [];
let currentVideoPage = 1;

async function resolveVideoApiBase() {
  for (const base of videoApiCandidates) {
    try {
      const response = await fetch(`${base}/api/health`);
      if (response.ok) return base;
    } catch {}
  }
  return "http://127.0.0.1:8002";
}

function videoText(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function embedVideoUrl(url) {
  const value = String(url || "").trim();
  const watchMatch = value.match(/youtube\.com\/watch\?v=([^&]+)/);
  if (watchMatch) return `https://www.youtube.com/embed/${watchMatch[1]}`;
  const shortMatch = value.match(/youtu\.be\/([^?&]+)/);
  if (shortMatch) return `https://www.youtube.com/embed/${shortMatch[1]}`;
  return value;
}

function renderVideoPage(page) {
  const grid = document.querySelector(".gallery-grid");
  const pagination = document.getElementById("videoPagination");
  if (!grid || !pagination || !videoItems.length) return;

  const totalPages = Math.ceil(videoItems.length / videosPerPage);
  currentVideoPage = Math.min(Math.max(page, 1), totalPages);
  const start = (currentVideoPage - 1) * videosPerPage;
  const end = Math.min(start + videosPerPage, videoItems.length);

  grid.innerHTML = videoItems.slice(start, end).join("");

  const pageButtons = Array.from({ length: totalPages }, (_, index) => {
    const pageNumber = index + 1;
    return `<button class="page-button${pageNumber === currentVideoPage ? " active" : ""}" type="button" data-page="${pageNumber}" aria-label="Page ${pageNumber}"${pageNumber === currentVideoPage ? ' aria-current="page"' : ""}>${pageNumber}</button>`;
  }).join("");

  pagination.innerHTML = `
    <div class="pagination-buttons">
      <button class="page-button" type="button" data-page="${currentVideoPage - 1}"${currentVideoPage === 1 ? " disabled" : ""}>PREV</button>
      ${pageButtons}
      <button class="page-button" type="button" data-page="${currentVideoPage + 1}"${currentVideoPage === totalPages ? " disabled" : ""}>NEXT</button>
    </div>
    <p class="pagination-summary">Showing ${start + 1} to ${end} of ${videoItems.length} (${totalPages} ${totalPages === 1 ? "Page" : "Pages"})</p>
  `;
}

function initializeStaticVideos() {
  const grid = document.querySelector(".gallery-grid");
  if (!grid) return;
  videoItems = Array.from(grid.children).map((item) => item.outerHTML);
  renderVideoPage(1);
}

async function loadVideoGalleryContent() {
  try {
    if (!videoApiBasePromise) videoApiBasePromise = resolveVideoApiBase();
    const videoApiBase = await videoApiBasePromise;
    const response = await fetch(`${videoApiBase}/api/content/gallery`);
    if (!response.ok) return;
    const allItems = await response.json();
    const items = allItems.filter((item) => item.extra?.media_type === "video" && (item.extra?.video_url || item.body));
    if (!items.length) return;

    const grid = document.querySelector(".gallery-grid");
    if (!grid) return;

    videoItems = items.map((item) => `
      <div class="gallery-item scroll-reveal visible">
        <iframe src="${embedVideoUrl(item.extra?.video_url || item.body)}" title="${videoText(item.title)}" allowfullscreen></iframe>
        <div class="video-title">${videoText(item.summary || item.title)}</div>
      </div>
    `);
    renderVideoPage(1);
  } catch {}
}

document.addEventListener("DOMContentLoaded", () => {
  initializeStaticVideos();
  loadVideoGalleryContent();
  document.getElementById("videoPagination")?.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-page]");
    if (!button || button.disabled) return;
    renderVideoPage(Number(button.dataset.page));
    document.querySelector(".gallery-section")?.scrollIntoView({ behavior: "smooth", block: "start" });
  });
});
