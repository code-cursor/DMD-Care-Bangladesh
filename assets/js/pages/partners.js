const partnersConfiguredBase = window.DMD_API_BASE_URL?.replace(/\/$/, "");
const partnersApiCandidates = [
  partnersConfiguredBase,
  location.protocol.startsWith("http") ? location.origin.replace(/\/$/, "") : null,
  "http://127.0.0.1:8002",
  "http://127.0.0.1:8001",
].filter((value, index, values) => value && values.indexOf(value) === index);

async function resolvePartnersApiBase() {
  for (const base of partnersApiCandidates) {
    try {
      const response = await fetch(`${base}/content-api/health`);
      if (response.ok) return base;
    } catch {}
  }
  return location.protocol.startsWith("http") ? location.origin.replace(/\/$/, "") : "";
}

function escapePartnerText(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function partnerImageUrl(url, apiBase) {
  if (!url) return "assets/src/img/DMD_care_bd_Logo.webp";
  if (url.startsWith("/uploads/") || url.startsWith("uploads/")) return `${apiBase}/${url.replace(/^\//, "")}`;
  return url;
}

function renderPartners(partners, apiBase) {
  const grid = document.getElementById("partnerGrid");
  if (!grid) return;
  grid.innerHTML = partners.map((partner, index) => {
    const website = partner.extra?.website || partner.summary || "";
    const card = `<div class="partner-card"><img src="${escapePartnerText(partnerImageUrl(partner.image_url, apiBase))}" alt="${escapePartnerText(partner.title)} Logo"></div>`;
    return `<div class="col reveal delay-${Math.min(index % 4, 3)}">${website ? `<a href="${escapePartnerText(website)}" target="_blank" rel="noopener" aria-label="${escapePartnerText(partner.title)}">${card}</a>` : card}</div>`;
  }).join("");
  grid.querySelectorAll(".reveal").forEach((item) => item.classList.add("active"));
}

async function fetchPartners(apiBase) {
  const paths = ["/content-api/content/partners", "/content-api/content/partners.php"];
  for (const path of paths) {
    try {
      const response = await fetch(`${apiBase}${path}`);
      if (response.ok) return response.json();
    } catch {}
  }
  return [];
}

async function loadPartners() {
  try {
    const apiBase = await resolvePartnersApiBase();
    const partners = await fetchPartners(apiBase);
    if (Array.isArray(partners)) renderPartners(partners, apiBase);
  } catch {}
}
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", loadPartners);
} else {
  loadPartners();
}
