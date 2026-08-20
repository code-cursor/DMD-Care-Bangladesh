const configuredHealthApiBase = window.DMD_API_BASE_URL?.replace(/\/$/, "");
const healthApiCandidates = [
  configuredHealthApiBase,
  location.protocol.startsWith("http") ? location.origin.replace(/\/$/, "") : null,
  "http://127.0.0.1:8002",
].filter((value, index, values) => value && values.indexOf(value) === index);
let healthApiBasePromise = null;
const teamMembersPerPage = 6;
let teamMemberItems = [];
let currentTeamPage = 1;

async function resolveHealthApiBase() {
  for (const base of healthApiCandidates) {
    try {
      const response = await fetch(`${base}/api/health`);
      if (response.ok) return base;
    } catch {}
  }
  return "http://127.0.0.1:8002";
}

function healthImageUrl(url) {
  if (!url) return "./assets/src/img/DMD_care_bd_Logo.webp";
  if (url.startsWith("/uploads/")) return `${window.__DMD_HEALTH_API_BASE__ || "http://127.0.0.1:8002"}${url}`;
  return url;
}

function healthText(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function renderTeamPage(page) {
  const grid = document.getElementById("healthTeamGrid");
  const pagination = document.getElementById("healthTeamPagination");
  if (!grid || !pagination || !teamMemberItems.length) return;

  const totalPages = Math.ceil(teamMemberItems.length / teamMembersPerPage);
  currentTeamPage = Math.min(Math.max(page, 1), totalPages);
  const start = (currentTeamPage - 1) * teamMembersPerPage;
  const end = Math.min(start + teamMembersPerPage, teamMemberItems.length);

  grid.innerHTML = teamMemberItems.slice(start, end).join("");

  const pageButtons = Array.from({ length: totalPages }, (_, index) => {
    const pageNumber = index + 1;
    return `<button class="page-button${pageNumber === currentTeamPage ? " active" : ""}" type="button" data-page="${pageNumber}" aria-label="Page ${pageNumber}"${pageNumber === currentTeamPage ? ' aria-current="page"' : ""}>${pageNumber}</button>`;
  }).join("");

  pagination.innerHTML = `
    <div class="pagination-buttons">
      <button class="page-button" type="button" data-page="${currentTeamPage - 1}"${currentTeamPage === 1 ? " disabled" : ""}>PREV</button>
      ${pageButtons}
      <button class="page-button" type="button" data-page="${currentTeamPage + 1}"${currentTeamPage === totalPages ? " disabled" : ""}>NEXT</button>
    </div>
    <p class="pagination-summary">Showing ${start + 1} to ${end} of ${teamMemberItems.length} (${totalPages} ${totalPages === 1 ? "Page" : "Pages"})</p>
  `;
}

function initializeStaticTeam() {
  const grid = document.getElementById("healthTeamGrid");
  if (!grid) return;
  teamMemberItems = Array.from(grid.children).map((item) => item.outerHTML);
  renderTeamPage(1);
}

async function loadHealthCareTeam() {
  try {
    if (!healthApiBasePromise) healthApiBasePromise = resolveHealthApiBase();
    const healthApiBase = await healthApiBasePromise;
    window.__DMD_HEALTH_API_BASE__ = healthApiBase;
    const response = await fetch(`${healthApiBase}/api/content/health_team`);
    if (!response.ok) return;
    const items = await response.json();
    if (!items.length) return;

    const row = document.getElementById("healthTeamGrid");
    if (!row) return;

    teamMemberItems = items.map((item) => {
      const bodyParts = String(item.body || "").split("\n").filter(Boolean);
      const qualifications = item.extra?.qualifications || bodyParts[0] || "";
      const jobPosition = item.extra?.job_position || bodyParts[1] || "";
      const workplace = item.extra?.workplace || bodyParts.slice(2).join(" ") || "";

      return `
        <div class="col-md-6 col-lg-4 scroll-reveal">
          <div class="doctor-card">
            <img src="${healthImageUrl(item.image_url)}" alt="${healthText(item.title)}">
            <h5>${healthText(item.title)}</h5>
            <h6>${healthText(item.summary)}</h6>
            ${qualifications ? `<p>${healthText(qualifications)}</p>` : ""}
            ${jobPosition || workplace ? `<p>${healthText([jobPosition, workplace].filter(Boolean).join(" "))}</p>` : ""}
          </div>
        </div>
      `;
    });
    renderTeamPage(1);
  } catch {}
}

document.addEventListener("DOMContentLoaded", () => {
  initializeStaticTeam();
  loadHealthCareTeam();
  document.getElementById("healthTeamPagination")?.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-page]");
    if (!button || button.disabled) return;
    renderTeamPage(Number(button.dataset.page));
    document.querySelector(".banner")?.scrollIntoView({ behavior: "smooth", block: "end" });
  });
});
