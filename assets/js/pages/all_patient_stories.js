const fallbackPatients = [
  {
    title: "Muntasir Billah",
    image_url: "./assets/src/img/p_muntasir_billah.jpg",
    extra: {
      age: "Diagnosed at 12 years",
      diagnosis_year: "2022",
      status: "Wheelchair user",
      link: "muntasir_billah_story"
    }
  },
  {
    title: "Arif Rahman",
    image_url: "./assets/src/img/patients_2.jpg",
    extra: {
      age: "Diagnosed at 6 years",
      diagnosis_year: "2021",
      status: "Can walk with support",
      link: "muntasir_billah_story"
    }
  },
  {
    title: "Zihan Ahmed",
    image_url: "./assets/src/img/patients_3.jpg",
    extra: {
      age: "Diagnosed at 8 years",
      diagnosis_year: "2020",
      status: "Under physiotherapy care",
      link: "muntasir_billah_story"
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

function renderPatientStories() {
  const patients = Array.isArray(window.DMD_PATIENT_STORIES) && window.DMD_PATIENT_STORIES.length
    ? window.DMD_PATIENT_STORIES
    : fallbackPatients;

  const html = patients.map((patient) => {
    const extra = patient.extra || {};
    return `
      <div class="col-lg-6 col-md-12 scroll-reveal">
        <div class="patient-card">
          <img src="${escapePatientText(patient.image_url || "./assets/src/img/p_muntasir_billah.jpg")}" alt="${escapePatientText(patient.title)}" class="patient-img">
          <div class="patient-body">
            <h5 class="patient-name">${escapePatientText(patient.title)}</h5>
            <p class="patient-info"><i class="fa fa-child"></i> ${escapePatientText(extra.age)}</p>
            <p class="patient-info"><i class="fa fa-calendar"></i> Diagnosis Year: ${escapePatientText(extra.diagnosis_year)}</p>
            <p class="patient-info"><i class="fa fa-heartbeat"></i> Status: ${escapePatientText(extra.status || patient.summary)}</p>
            <a href="${escapePatientText(patientLink(patient))}" class="btn-view">View Details <i class="fa fa-arrow-right"></i></a>
          </div>
        </div>
      </div>
    `;
  }).join("");

  $("#patientList").html(html);
}

function revealPatientCards() {
  document.querySelectorAll(".scroll-reveal").forEach((el) => {
    if (el.getBoundingClientRect().top < window.innerHeight - 100) {
      el.classList.add("visible");
    }
  });
}

$(document).ready(function () {
  renderPatientStories();
  window.addEventListener("scroll", revealPatientCards);
  revealPatientCards();
});
