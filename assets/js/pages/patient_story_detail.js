const detailConfiguredBase = window.DMD_API_BASE_URL?.replace(/\/$/, "");
const detailApiCandidates = [
  detailConfiguredBase,
  location.protocol.startsWith("http") ? location.origin.replace(/\/$/, "") : null,
  "http://127.0.0.1:8002",
].filter((value, index, values) => value && values.indexOf(value) === index);

async function resolveDetailApiBase() {
  for (const base of detailApiCandidates) {
    try {
      const response = await fetch(`${base}/content-api/health`);
      if (response.ok) return base;
    } catch {}
  }
  return "http://127.0.0.1:8002";
}

function detailImageUrl(url, apiBase) {
  if (!url) return "assets/src/img/DMD_care_bd_Logo.webp";
  if (url.startsWith("/uploads/")) return `${apiBase}${url}`;
  return url;
}

function youtubeEmbedUrl(url) {
  const value = String(url || "").trim();
  if (!value) return "";
  if (value.includes("/embed/")) return value;
  const watchMatch = value.match(/[?&]v=([^&]+)/);
  if (watchMatch) return `https://www.youtube.com/embed/${watchMatch[1]}`;
  const shortMatch = value.match(/youtu\.be\/([^?&]+)/);
  if (shortMatch) return `https://www.youtube.com/embed/${shortMatch[1]}`;
  return value;
}

function renderStoryBody(container, text) {
  const blocks = String(text || "").split(/\n{2,}/).map((part) => part.trim()).filter(Boolean);
  if (!blocks.length) return;
  const title = container.querySelector("h2");
  container.innerHTML = "";
  if (title) container.appendChild(title);
  blocks.forEach((block) => {
    const isHeading = block.length < 90 && !/[।.!?]$/.test(block);
    const element = document.createElement("p");
    if (isHeading) {
      const strong = document.createElement("strong");
      strong.textContent = block;
      element.appendChild(strong);
    } else {
      element.textContent = block;
    }
    container.appendChild(element);
  });
}

function normalizePhoneLink(value) {
  const phone = String(value || "").trim();
  if (!phone) return "";
  return phone.startsWith("tel:") ? phone : `tel:${phone}`;
}

function normalizeWhatsAppLink(value) {
  const link = String(value || "").trim();
  if (!link) return "";
  if (link.startsWith("http") || link.startsWith("https://wa.me/")) return link;
  return `https://wa.me/${link.replace(/[^0-9]/g, "")}`;
}

async function loadPatientStoryDetail() {
  const params = new URLSearchParams(window.location.search);
  const requestedId = Number(params.get("id"));
  try {
    const apiBase = await resolveDetailApiBase();
    const response = await fetch(`${apiBase}/content-api/content/patient_story`);
    if (!response.ok) return;
    const items = await response.json();
    const item = items.find((story) => story.id === requestedId) || items[0];
    if (!item) return;

    const extra = item.extra || {};
    const mediaImage = document.querySelector(".patient-media img");
    if (mediaImage) {
      mediaImage.src = detailImageUrl(item.image_url, apiBase);
      mediaImage.alt = item.title || "Patient";
    }

    const iframe = document.querySelector(".video-container iframe");
    const embedUrl = youtubeEmbedUrl(extra.detail_video_url);
    if (iframe && embedUrl) iframe.src = embedUrl;
    if (iframe && !embedUrl) iframe.closest(".video-container")?.classList.add("d-none");

    const info = document.querySelector(".patient-info");
    const heading = info?.querySelector("h2");
    if (heading) heading.textContent = extra.detail_title || item.title || "Patient Story";
    if (info) renderStoryBody(info, extra.detail_body || item.body || "");

    const phoneLink = document.querySelector('.social-links a[title="Call Guardian"]');
    const whatsappLink = document.querySelector('.social-links a[title="Chat on WhatsApp"]');
    const facebookLink = document.querySelector('.social-links a[title="Facebook Page"]');
    const phoneHref = normalizePhoneLink(extra.phone);
    const whatsappHref = normalizeWhatsAppLink(extra.whatsapp);
    if (phoneLink && phoneHref) phoneLink.href = phoneHref;
    if (whatsappLink && whatsappHref) whatsappLink.href = whatsappHref;
    if (facebookLink && extra.facebook) facebookLink.href = extra.facebook;
  } catch {}
}

document.addEventListener("DOMContentLoaded", loadPatientStoryDetail);
