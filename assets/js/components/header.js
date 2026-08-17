$(document).ready(function() {
  // ===== Date & Time =====
  function updateDateTime() {
    const now = new Date();
    const date = now.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    const time = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    $("#datetime").text(`${date} ${time}`);
  }
  setInterval(updateDateTime, 1000);
  updateDateTime();

  // ===== Submenu toggle for mobile =====
    $(".dropdown-submenu > a").on("click", function(e) {
      if ($(window).width() < 992) {
        e.preventDefault();
        e.stopPropagation();
        let submenu = $(this).next(".dropdown-menu");
        $(".dropdown-submenu .dropdown-menu").not(submenu).removeClass("show");
        submenu.toggleClass("show");
      }
    });

    $(".navbar-nav .nav-link").on("click", function() {
      if (!$(this).hasClass("dropdown-toggle")) {
        $(".navbar-collapse").collapse("hide");
      }
    });

  // ===== Custom Google Translate Dropdown =====
  const translateSelect = $("#language-select");

  function setTranslateLang(lang) {
    const combo = document.querySelector(".goog-te-combo");
    if (!combo) {
      setTimeout(() => setTranslateLang(lang), 500);
      return;
    }
    combo.value = lang;
    combo.dispatchEvent(new Event('change'));
  }

  translateSelect.on("change", function() {
    const lang = $(this).val();
    setTranslateLang(lang);
  });
});

    // Add active class on current page
    $(document).ready(function () {
        let currentPage = window.location.pathname.split("/").pop(); 

        $(".navbar-nav a").each(function () {
            let linkPage = $(this).attr("href");

            if (linkPage === currentPage) {
                $(this).addClass("active");
                $(this).closest(".dropdown").find(".dropdown-toggle").addClass("active");
            }
        });
    });

// ===== Google Translate Initialization =====
function googleTranslateElementInit() {
  new google.translate.TranslateElement({ pageLanguage: 'en', autoDisplay: false }, 'google_translate_element');
}

// BOTTOM BAR: Add focus animation on click
document.querySelectorAll('.bottom-bar button').forEach(btn => {
  btn.addEventListener('click', () => {
    btn.classList.add('animate__pulse');
    setTimeout(() => btn.classList.remove('animate__pulse'), 500);
  });
  

  // Fade In Header on Page Load
  // $('header').css('opacity', 0); 
  // $('header').animate({ opacity: 1 }, 1000); 
});

