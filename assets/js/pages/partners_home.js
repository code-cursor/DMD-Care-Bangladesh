const homePartnersConfiguredBase = window.DMD_API_BASE_URL?.replace(/\/$/, "");
const homePartnersApiCandidates = [
  homePartnersConfiguredBase,
  location.protocol.startsWith("http") ? location.origin.replace(/\/$/, "") : null,
  "http://127.0.0.1:8002",
  "http://127.0.0.1:8001",
].filter((value, index, values) => value && values.indexOf(value) === index);

async function resolveHomePartnersApiBase() {
  for (const base of homePartnersApiCandidates) {
    try {
      const response = await fetch(`${base}/content-api/health`);
      if (response.ok) return base;
    } catch {}
  }
  return location.protocol.startsWith("http") ? location.origin.replace(/\/$/, "") : "";
}

function escapeHomePartnerText(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function homePartnerImageUrl(url, apiBase) {
  if (!url) return "assets/src/img/DMD_care_bd_Logo.webp";
  if (url.startsWith("/uploads/") || url.startsWith("uploads/")) {
    return `${apiBase}/${url.replace(/^\//, "")}`;
  }
  return url;
}

function startHomePartnersSwiper() {
  const element = document.querySelector(".partners-swiper");
  if (!element || typeof Swiper === "undefined") return;
  if (element.swiper) element.swiper.destroy(true, true);
  new Swiper(element, {
    slidesPerView: 4,
    spaceBetween: 30,
    loop: true,
    autoplay: {
      delay: 2000,
      disableOnInteraction: false,
    },
    breakpoints: {
      992: { slidesPerView: 4, spaceBetween: 30 },
      768: { slidesPerView: 3, spaceBetween: 20 },
      576: { slidesPerView: 2, spaceBetween: 15 },
      0: { slidesPerView: 2, spaceBetween: 10 },
    },
  });
}

async function fetchHomePartners(apiBase) {
  const paths = ["/content-api/content/partners", "/content-api/content/partners.php"];
  for (const path of paths) {
    try {
      const response = await fetch(`${apiBase}${path}`);
      if (response.ok) return response.json();
    } catch {}
  }
  return [];
}

async function loadHomePartners() {
  const wrapper = document.querySelector("#partners .swiper-wrapper");
  if (!wrapper) return;

  try {
    const apiBase = await resolveHomePartnersApiBase();
    const partners = await fetchHomePartners(apiBase);
    if (!Array.isArray(partners) || !partners.length) return;

    wrapper.innerHTML = partners.map((partner) => {
      const website = partner.extra?.website || partner.summary || "";
      const image = `<img src="${escapeHomePartnerText(homePartnerImageUrl(partner.image_url, apiBase))}" alt="${escapeHomePartnerText(partner.title)} Logo" class="img-fluid">`;
      return `<div class="swiper-slide">${website ? `<a href="${escapeHomePartnerText(website)}" target="_blank" rel="noopener" aria-label="${escapeHomePartnerText(partner.title)}">${image}</a>` : image}</div>`;
    }).join("");
  } catch {
    // Keep static partner logos if the API is unavailable.
  } finally {
    startHomePartnersSwiper();
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", loadHomePartners);
} else {
  loadHomePartners();
}