const configuredPhotoApiBase = window.DMD_API_BASE_URL?.replace(/\/$/, "");
const photoApiCandidates = [
  configuredPhotoApiBase,
  location.protocol.startsWith("http") ? location.origin.replace(/\/$/, "") : null,
  "http://127.0.0.1:8002",
].filter((value, index, values) => value && values.indexOf(value) === index);
let photoApiBasePromise = null;
const photosPerPage = 12;
let photoItems = [];
let currentPhotoPage = 1;

async function resolvePhotoApiBase() {
  for (const base of photoApiCandidates) {
    try {
      const response = await fetch(`${base}/content-api/health`);
      if (response.ok) return base;
    } catch {}
  }
  return "http://127.0.0.1:8002";
}

function photoImageUrl(url) {
  if (!url) return "./assets/src/img/DMD_care_bd_Logo.webp";
  if (url.startsWith("/uploads/")) return `${window.__DMD_PHOTO_API_BASE__ || "http://127.0.0.1:8002"}${url}`;
  return url;
}

function photoText(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function renderPhotoPage(page) {
  const grid = document.querySelector(".gallery-grid");
  const pagination = document.getElementById("photoPagination");
  if (!grid || !pagination || !photoItems.length) return;

  const totalPages = Math.ceil(photoItems.length / photosPerPage);
  currentPhotoPage = Math.min(Math.max(page, 1), totalPages);
  const start = (currentPhotoPage - 1) * photosPerPage;
  const end = Math.min(start + photosPerPage, photoItems.length);

  grid.innerHTML = photoItems.slice(start, end).join("");

  const pageButtons = Array.from({ length: totalPages }, (_, index) => {
    const pageNumber = index + 1;
    return `<button class="page-button${pageNumber === currentPhotoPage ? " active" : ""}" type="button" data-page="${pageNumber}" aria-label="Page ${pageNumber}"${pageNumber === currentPhotoPage ? ' aria-current="page"' : ""}>${pageNumber}</button>`;
  }).join("");

  pagination.innerHTML = `
    <div class="pagination-buttons">
      <button class="page-button" type="button" data-page="${currentPhotoPage - 1}"${currentPhotoPage === 1 ? " disabled" : ""}>PREV</button>
      ${pageButtons}
      <button class="page-button" type="button" data-page="${currentPhotoPage + 1}"${currentPhotoPage === totalPages ? " disabled" : ""}>NEXT</button>
    </div>
    <p class="pagination-summary">Showing ${start + 1} to ${end} of ${photoItems.length} (${totalPages} ${totalPages === 1 ? "Page" : "Pages"})</p>
  `;
}

function initializeStaticPhotos() {
  const grid = document.querySelector(".gallery-grid");
  if (!grid) return;
  photoItems = Array.from(grid.children).map((item) => item.outerHTML);
  renderPhotoPage(1);
}

async function loadGalleryContent() {
  try {
    if (!photoApiBasePromise) photoApiBasePromise = resolvePhotoApiBase();
    const photoApiBase = await photoApiBasePromise;
    window.__DMD_PHOTO_API_BASE__ = photoApiBase;
    const response = await fetch(`${photoApiBase}/content-api/content/gallery`);
    if (!response.ok) return;
    const allItems = await response.json();
    const items = allItems.filter((item) => (item.extra?.media_type || "photo") === "photo");
    if (!items.length) return;

    const grid = document.querySelector(".gallery-grid");
    if (!grid) return;

    photoItems = items.map((item) => `
      <div class="gallery-item scroll-reveal visible">
        <img src="${photoImageUrl(item.image_url)}" alt="${photoText(item.title)}">
        <div class="overlay"><span>${photoText(item.summary || item.title)}</span></div>
      </div>
    `);
    renderPhotoPage(1);
  } catch {}
}

document.addEventListener("DOMContentLoaded", () => {
  initializeStaticPhotos();
  loadGalleryContent();
  document.getElementById("photoPagination")?.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-page]");
    if (!button || button.disabled) return;
    renderPhotoPage(Number(button.dataset.page));
    document.querySelector(".gallery-section")?.scrollIntoView({ behavior: "smooth", block: "start" });
  });
});
