const members = [
        {
            name: "Al Razi",
            role: "President",
            img: "./assets/src/img/1_abu_raihan.webp",
            desc: "Providing visionary leadership and guiding the foundation’s mission to improve the lives of individuals affected by DMD across Bangladesh."
          },
          {
            name: "Mohammad Feroze",
            role: "Vice-President",
            img: "./assets/src/img/2_feroze_ahammad.webp",
            desc: "Supporting the President in strategic decision-making and fostering collaboration to strengthen community outreach and care initiatives."
          },
          {
            name: "Mohammad Parvez (Sajid)",
            role: "General Secretary",
            img: "./assets/src/img/3_mohammad_parvez.webp",
            desc: "Overseeing organizational activities, documentation, and communication to ensure smooth operation of all foundation programs and events."
          },
          {
            name: "Aivy Akter",
            role: "Joint Secretary",
            img: "./assets/src/img/4_aivy_akter.webp",
            desc: "Assisting in administrative coordination and promoting awareness campaigns for patients and families impacted by Duchenne Muscular Dystrophy."
          },
          {
            name: "Mohammad Jasim",
            role: "Treasurer",
            img: "./assets/src/img/5_jasim_uddin_khan.webp",
            desc: "Managing financial resources responsibly to support the foundation’s ongoing medical, educational, and community assistance projects."
          },
          {
            name: "Arifur Rahaman",
            role: "Executive Member",
            img: "./assets/src/img/6_arifur_rahaman.webp",
            desc: "Contributing to strategic planning and policy development to advance care and support for individuals living with DMD."
          },
          {
            name: "Apel Mahmud",
            role: "Executive Member",
            img: "./assets/src/img/7_apel_mahmud.webp",
            desc: "Actively engaging in outreach programs and representing the foundation’s values through advocacy and community involvement."
          },
          {
            name: "Md. Rakhabul Alam (Sayem)",
            role: "Executive Member",
            img: "./assets/src/img/8_rekhabul Alam.webp",
            desc: "Providing insight and leadership to strengthen partnerships and expand the foundation’s impact within the healthcare community."
          },
          {
            name: "Md. Ayub Khan",
            role: "Executive Member",
            img: "./assets/src/img/9_ayub_khan.webp",
            desc: "Collaborating with the committee to implement initiatives that raise awareness and improve quality of life for DMD patients and their families."
          }
      ];


$(document).ready(function() {
      const row = $(".row");
      members.forEach((m, i) => {
        row.append(`
          <div class="col-12 col-sm-6 col-lg-4">
            <div class="team-card" style="animation-delay:${i * 0.15}s">
              <div class="member-img">
                <img src="${m.img}" alt="${m.name}">
              </div>
              <h5 class="member-name">${m.name}</h5>
              <p class="member-role">${m.role}</p>
              <p class="member-desc">${m.desc}</p>
            </div>
          </div>
        `);
      });

      // Scroll effect
      $(window).on("scroll", function() {
        $(".team-card").each(function() {
          const elementPos = $(this).offset().top;
          const topOfWindow = $(window).scrollTop();
          const windowHeight = $(window).height();
          if (elementPos < topOfWindow + windowHeight - 80) {
            $(this).addClass("visible");
          }
        });
      }).trigger("scroll");
    });