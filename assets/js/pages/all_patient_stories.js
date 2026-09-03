const allStoriesConfiguredBase = window.DMD_API_BASE_URL?.replace(/\/$/, "");
const allStoriesApiCandidates = [
  allStoriesConfiguredBase,
  location.protocol.startsWith("http") ? location.origin.replace(/\/$/, "") : null,
  "http://127.0.0.1:8002",
  "http://127.0.0.1:8001",
].filter((value, index, values) => value && values.indexOf(value) === index);

async function resolveAllStoriesApiBase() {
  for (const base of allStoriesApiCandidates) {
    try {
      const response = await fetch(`${base}/content-api/health`);
      if (response.ok) return base;
    } catch {}
  }
  return location.protocol.startsWith("http") ? location.origin.replace(/\/$/, "") : "";
}

const fallbackPatients = [
  {
    id: 6,
    title: "Muntasir Billah",
    image_url: "./assets/src/img/p_muntasir_billah.jpg",
    extra: {
      age: "Diagnosed at 12 years",
      diagnosis_year: "2022",
      status: "Wheelchair user",
      link: "muntasir_billah_story?id=6",
      show_on_list: true,
      show_detail_page: true
    }
  }
];

function escapePatientText(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function patientLink(patient) {
  return patient.extra?.link || `muntasir_billah_story?id=${encodeURIComponent(patient.id || "")}`;
}

function patientStoryImageUrl(url) {
  if (!url) return "./assets/src/img/p_muntasir_billah.jpg";
  return url;
}

function renderPatientListHtml(patients) {
  const html = patients.map((patient) => {
    const extra = patient.extra || {};
    return `
      <div class="col-lg-6 col-md-12 scroll-reveal">
        <div class="patient-card">
          <img src="${escapePatientText(patientStoryImageUrl(patient.image_url))}" alt="${escapePatientText(patient.title)}" class="patient-img">
          <div class="patient-body">
            <h5 class="patient-name">${escapePatientText(patient.title)}</h5>
            <p class="patient-info"><i class="fa fa-child"></i> ${escapePatientText(extra.age || "—")}</p>
            <p class="patient-info"><i class="fa fa-calendar"></i> Diagnosis Year: ${escapePatientText(extra.diagnosis_year || "—")}</p>
            <p class="patient-info"><i class="fa fa-heartbeat"></i> Status: ${escapePatientText(extra.status || patient.summary || "Living with DMD")}</p>
            ${extra.show_detail_page === true ? `<a href="${escapePatientText(patientLink(patient))}" class="btn-view">View Details <i class="fa fa-arrow-right"></i></a>` : ""}
          </div>
        </div>
      </div>
    `;
  }).join("");

  $("#patientList").html(html);
  revealPatientCards();
}

async function loadAndRenderAllStories() {
  // First render immediately with static/preloaded window.DMD_PATIENT_STORIES
  const initialPatients = Array.isArray(window.DMD_PATIENT_STORIES) && window.DMD_PATIENT_STORIES.length
    ? window.DMD_PATIENT_STORIES.filter((item) => item.extra?.show_on_list === true)
    : fallbackPatients;
  renderPatientListHtml(initialPatients);

  // Then fetch fresh data from API
  try {
    const apiBase = await resolveAllStoriesApiBase();
    const response = await fetch(`${apiBase}/content-api/content/patient_story`);
    if (response.ok) {
      const items = await response.json();
      if (Array.isArray(items) && items.length) {
        renderPatientListHtml(items.filter((item) => item.extra?.show_on_list === true));
      }
    }
  } catch {}
}

function revealPatientCards() {
  document.querySelectorAll(".scroll-reveal").forEach((el) => {
    if (el.getBoundingClientRect().top < window.innerHeight - 50) {
      el.classList.add("visible");
    }
  });
}

$(document).ready(function () {
  loadAndRenderAllStories();
  window.addEventListener("scroll", revealPatientCards);
  revealPatientCards();
});

