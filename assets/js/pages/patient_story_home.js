const patientStoryConfiguredBase = window.DMD_API_BASE_URL?.replace(/\/$/, "");
const patientStoryApiCandidates = [
  patientStoryConfiguredBase,
  location.protocol.startsWith("http") ? location.origin.replace(/\/$/, "") : null,
  "http://127.0.0.1:8002",
].filter((value, index, values) => value && values.indexOf(value) === index);

async function resolvePatientStoryApiBase() {
  for (const base of patientStoryApiCandidates) {
    try {
      const response = await fetch(`${base}/api/health`);
      if (response.ok) return base;
    } catch {}
  }
  return "http://127.0.0.1:8002";
}

function escapePatientStoryText(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function patientStoryImageUrl(url, apiBase) {
  if (!url) return "assets/src/img/DMD_care_bd_Logo.webp";
  if (url.startsWith("/uploads/")) return `${apiBase}${url}`;
  return url;
}

function patientStoryDetailLink(item) {
  return item.extra?.link || `muntasir_billah_story.html?id=${encodeURIComponent(item.id)}`;
}

function startPatientStoryCarousel(carousel) {
  if (!carousel || !window.bootstrap) return;
  bootstrap.Carousel.getInstance(carousel)?.dispose();
  const instance = new bootstrap.Carousel(carousel, {
    interval: 3500,
    pause: false,
    ride: "carousel",
    touch: true,
    wrap: true,
  });
  instance.cycle();
}

async function loadHomePatientStories() {
  const carousel = document.getElementById("patientStoriesCarousel");
  const inner = carousel?.querySelector(".carousel-inner");
  if (!inner) return;

  try {
    const apiBase = await resolvePatientStoryApiBase();
    const response = await fetch(`${apiBase}/api/content/patient_story`);
    if (!response.ok) return;
    const items = await response.json();
    if (!items.length) return;

    inner.innerHTML = items.map((item, index) => {
      const extra = item.extra || {};
      const text = extra.home_text || item.body || item.summary || "";
      const linkText = extra.home_link_text || "Click for more stories about me";
      const author = extra.author || item.title || "";
      return `
        <div class="carousel-item${index === 0 ? " active" : ""}">
          <div class="story-card">
            <div class="story-content">
              <img src="${escapePatientStoryText(patientStoryImageUrl(item.image_url, apiBase))}" alt="${escapePatientStoryText(item.title)}" class="story-img">
              <div>
                <p class="story-text">${escapePatientStoryText(text)}<br>
                  <a href="${escapePatientStoryText(patientStoryDetailLink(item))}" style="text-decoration:none; color:var(--color-primary, #2e7d32); font-weight:500;">
                    ${escapePatientStoryText(linkText)}
                  </a>
                </p>
                <p class="story-author">- ${escapePatientStoryText(author)}</p>
              </div>
            </div>
          </div>
        </div>
      `;
    }).join("");
  } catch {
    // Keep the static fallback stories when the API is unavailable.
  } finally {
    startPatientStoryCarousel(carousel);
  }
}

document.addEventListener("DOMContentLoaded", loadHomePatientStories);
