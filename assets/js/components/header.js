(function (window, $) {
  if (!$) return;

  let dateTimer = null;

  function initSiteHeader(root) {
    const scope = root || document;

  // ===== Date & Time =====
  function updateDateTime() {
    const now = new Date();
    const date = now.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    const time = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    $("#datetime").text(`${date} ${time}`);
  }
  if (dateTimer) clearInterval(dateTimer);
  dateTimer = setInterval(updateDateTime, 1000);
  updateDateTime();

  // ===== Submenu toggle for mobile =====
    $(document).off("click.siteHeaderSubmenu", ".dropdown-submenu > a").on("click.siteHeaderSubmenu", ".dropdown-submenu > a", function(e) {
      if ($(window).width() < 992) {
        e.preventDefault();
        e.stopPropagation();
        let submenu = $(this).next(".dropdown-menu");
        $(".dropdown-submenu .dropdown-menu").not(submenu).removeClass("show");
        submenu.toggleClass("show");
      }
    });

    $(document).off("click.siteHeaderDropdown", "#header-container .dropdown-toggle").on("click.siteHeaderDropdown", "#header-container .dropdown-toggle", function(e) {
      if (window.bootstrap?.Dropdown) return;

      e.preventDefault();
      e.stopPropagation();

      const parent = this.closest(".dropdown");
      const menu = parent?.querySelector(".dropdown-menu");
      if (!menu) return;

      const shouldShow = !menu.classList.contains("show");
      document.querySelectorAll("#header-container .dropdown-menu.show").forEach((openMenu) => {
        if (openMenu !== menu) openMenu.classList.remove("show");
      });
      document.querySelectorAll("#header-container .dropdown-toggle[aria-expanded='true']").forEach((toggle) => {
        if (toggle !== this) toggle.setAttribute("aria-expanded", "false");
      });

      menu.classList.toggle("show", shouldShow);
      this.setAttribute("aria-expanded", shouldShow ? "true" : "false");
    });

    $(document).off("click.siteHeaderDropdownClose").on("click.siteHeaderDropdownClose", function(e) {
      if (window.bootstrap?.Dropdown || e.target.closest("#header-container .dropdown")) return;

      document.querySelectorAll("#header-container .dropdown-menu.show").forEach((menu) => menu.classList.remove("show"));
      document.querySelectorAll("#header-container .dropdown-toggle[aria-expanded='true']").forEach((toggle) => {
        toggle.setAttribute("aria-expanded", "false");
      });
    });

    $(document).off("click.siteHeaderNav", ".navbar-nav .nav-link").on("click.siteHeaderNav", ".navbar-nav .nav-link", function() {
      if (!$(this).hasClass("dropdown-toggle")) {
        const nav = document.querySelector("#header-container .navbar-collapse");
        if (nav && window.bootstrap?.Collapse) {
          bootstrap.Collapse.getOrCreateInstance(nav).hide();
        } else {
          nav?.classList.remove("show");
        }
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

  translateSelect.off("change.siteHeaderTranslate").on("change.siteHeaderTranslate", function() {
    const lang = $(this).val();
    setTranslateLang(lang);
  });

    // Add active class on current page
        let currentPage = window.location.pathname.split("/").pop(); 

        $(scope).find(".navbar-nav a").each(function () {
            let linkPage = $(this).attr("href");

            if (linkPage === currentPage) {
                $(this).addClass("active");
                $(this).closest(".dropdown").find(".dropdown-toggle").addClass("active");
            }
        });

    // BOTTOM BAR: Add focus animation on click
    $(document).off("click.siteHeaderBottomBar", ".bottom-bar button").on("click.siteHeaderBottomBar", ".bottom-bar button", function () {
      this.classList.add("animate__pulse");
      setTimeout(() => this.classList.remove("animate__pulse"), 500);
    });
  }

  window.initSiteHeader = initSiteHeader;

  $(document).ready(function() {
    initSiteHeader(document);
  });
})(window, window.jQuery);

// ===== Google Translate Initialization =====
function googleTranslateElementInit() {
  new google.translate.TranslateElement({ pageLanguage: 'en', autoDisplay: false }, 'google_translate_element');
}


