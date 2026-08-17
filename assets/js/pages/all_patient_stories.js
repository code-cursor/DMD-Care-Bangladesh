const patients = [
  {
    name: "Muntasir Billah",
    age: "Diagnosed at 12 years",
    year: "2022",
    status: "Wheelchair user",
    photo: "./assets/src/img/p_muntasir_billah.jpg",
    link: "patient_story.html"
  },
  {
    name: "Arif Rahman",
    age: "Diagnosed at 6 years",
    year: "2021",
    status: "Can walk with support",
    photo: "./assets/src/img/patients_2.jpg",
    link: "patient_story.html"
  },
  {
    name: "Zihan Ahmed",
    age: "Diagnosed at 8 years",
    year: "2020",
    status: "Under physiotherapy care",
    photo: "./assets/src/img/patients_3.jpg",
    link: "patient_story.html"
  },
  {
    name: "Samiul Hasan",
    age: "Diagnosed at 7 years",
    year: "2023",
    status: "Uses wheelchair",
    photo: "https://i.ibb.co/Dg7QyC5/child4.jpg",
    link: "patient_story.html"
  }
];

$(document).ready(function () {
  let html = "";
  patients.forEach(p => {
    html += `
      <div class="col-lg-6 col-md-12 scroll-reveal">
        <div class="patient-card">
          <img src="${p.photo}" alt="${p.name}" class="patient-img">
          <div class="patient-body">
            <h5 class="patient-name">${p.name}</h5>
            <p class="patient-info"><i class="fa fa-child"></i> ${p.age}</p>
            <p class="patient-info"><i class="fa fa-calendar"></i> Diagnosis Year: ${p.year}</p>
            <p class="patient-info"><i class="fa fa-heartbeat"></i> Status: ${p.status}</p>
            <a href="#" class="btn-view">View Details <i class="fa fa-arrow-right"></i></a>
          </div>
        </div>
      </div>
    `;
  });

  $("#patientList").html(html);

  // Change link dynamically after cards are added to DOM
  $("#patientList .patient-card").each(function(index){
    $(this).find(".btn-view").attr("href", patients[index].link);
  });

  // Scroll reveal animation
  function revealCards() {
    document.querySelectorAll(".scroll-reveal").forEach(el => {
      const rect = el.getBoundingClientRect().top;
      if(rect < window.innerHeight - 100){
        el.classList.add("visible");
      }
    });
  }

  window.addEventListener("scroll", revealCards);
  revealCards(); // trigger animation on load
});
