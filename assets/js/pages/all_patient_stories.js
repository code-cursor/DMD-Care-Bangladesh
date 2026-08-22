const fallbackPatients = [
  { name: "Muntasir Billah", age: "Diagnosed at 12 years", year: "2022", status: "Wheelchair user", photo: "./assets/src/img/p_muntasir_billah.jpg", link: "muntasir_billah_story.html" },
  { name: "Arif Rahman", age: "Diagnosed at 6 years", year: "2021", status: "Can walk with support", photo: "./assets/src/img/patients_2.jpg", link: "muntasir_billah_story.html" },
  { name: "Zihan Ahmed", age: "Diagnosed at 8 years", year: "2020", status: "Under physiotherapy care", photo: "./assets/src/img/patients_3.jpg", link: "muntasir_billah_story.html" },
  { name: "Samiul Hasan", age: "Diagnosed at 7 years", year: "2023", status: "Uses wheelchair", photo: "https://i.ibb.co/Dg7QyC5/child4.jpg", link: "muntasir_billah_story.html" },
];

function escapeStoryText(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function storyImageUrl(url) {
  if (!url) return "./assets/src/img/DMD_care_bd_Logo.webp";
  if (url.startsWith("/uploads/")) return `.${url}`;
  if (url.startsWith("uploads/")) return `./${url}`;
  return url;
}

function getPatients() {
  const stories = Array.isArray(window.DMD_PATIENT_STORIES) ? window.DMD_PATIENT_STORIES : [];
  if (!stories.length) return fallbackPatients;
  return stories.map((item) => ({
    name: item.title,
    age: item.extra?.age || item.summary || "",
    year: item.extra?.diagnosis_year || "",
    status: item.extra?.status || item.summary || "",
    photo: storyImageUrl(item.image_url),
    link: item.extra?.link || `muntasir_billah_story.html?id=${encodeURIComponent(item.id)}`,
  }));
}

const PATIENTS_PER_PAGE = 10;

function patientCardHtml(patient) {
  return `
    <div class="col-lg-6 col-md-12 scroll-reveal visible">
      <div class="patient-card h-100">
        <img src="${escapeStoryText(patient.photo)}" alt="${escapeStoryText(patient.name)}" class="patient-img" loading="lazy">
        <div class="patient-body">
          <h5 class="patient-name">${escapeStoryText(patient.name)}</h5>
          <p class="patient-info"><i class="fa fa-child"></i> ${escapeStoryText(patient.age)}</p>
          <p class="patient-info"><i class="fa fa-calendar"></i> Diagnosis Year: ${escapeStoryText(patient.year)}</p>
          <p class="patient-info"><i class="fa fa-heartbeat"></i> Status: ${escapeStoryText(patient.status)}</p>
          <a href="${escapeStoryText(patient.link)}" class="btn-view">View Details <i class="fa fa-arrow-right"></i></a>
        </div>
      </div>
    </div>`;
}

function renderPatientPagination(totalPatients, currentPage) {
  const pagination = document.getElementById("patientPagination");
  const buttons = document.getElementById("patientPageButtons");
  const summary = document.getElementById("patientPageSummary");
  const totalPages = Math.ceil(totalPatients / PATIENTS_PER_PAGE);
  pagination.classList.toggle("d-none", totalPages <= 1);
  if (totalPages <= 1) return;

  let html = `<button class="patient-page-button" type="button" data-page="${currentPage - 1}" ${currentPage === 1 ? "disabled" : ""} aria-label="Previous page"><i class="bi bi-chevron-left"></i></button>`;
  for (let page = 1; page <= totalPages; page += 1) {
    html += `<button class="patient-page-button ${page === currentPage ? "active" : ""}" type="button" data-page="${page}" ${page === currentPage ? 'aria-current="page"' : ""}>${page}</button>`;
  }
  html += `<button class="patient-page-button" type="button" data-page="${currentPage + 1}" ${currentPage === totalPages ? "disabled" : ""} aria-label="Next page"><i class="bi bi-chevron-right"></i></button>`;
  buttons.innerHTML = html;
  const first = (currentPage - 1) * PATIENTS_PER_PAGE + 1;
  const last = Math.min(currentPage * PATIENTS_PER_PAGE, totalPatients);
  summary.textContent = `Showing ${first}–${last} of ${totalPatients} stories`;
}

function initializePatientStories() {
  const patients = getPatients();
  let currentPage = 1;
  function renderPage(page) {
    const totalPages = Math.max(1, Math.ceil(patients.length / PATIENTS_PER_PAGE));
    currentPage = Math.min(Math.max(page, 1), totalPages);
    const start = (currentPage - 1) * PATIENTS_PER_PAGE;
    document.getElementById("patientList").innerHTML = patients.slice(start, start + PATIENTS_PER_PAGE).map(patientCardHtml).join("");
    renderPatientPagination(patients.length, currentPage);
  }
  document.getElementById("patientPageButtons").addEventListener("click", (event) => {
    const button = event.target.closest("button[data-page]");
    if (!button || button.disabled) return;
    renderPage(Number(button.dataset.page));
    document.querySelector(".patient-section").scrollIntoView({ behavior: "smooth", block: "start" });
  });
  renderPage(currentPage);
}

document.addEventListener("DOMContentLoaded", initializePatientStories);