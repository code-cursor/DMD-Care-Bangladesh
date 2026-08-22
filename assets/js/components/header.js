(() => {
  let dateTimer = null;

  function setDropdownState(toggle, open) {
    const menu = toggle.nextElementSibling;
    if (!menu?.classList.contains("dropdown-menu")) return;
    toggle.closest(".dropdown")?.classList.toggle("show", open);
    toggle.classList.toggle("show", open);
    menu.classList.toggle("show", open);
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
  }

  function closeHeaderDropdowns(exceptToggle = null) {
    document.querySelectorAll("#header-container .dropdown-toggle").forEach((toggle) => {
      if (toggle !== exceptToggle) setDropdownState(toggle, false);
    });
  }

  function bindDropdowns(scope) {
    scope.querySelectorAll(".dropdown-toggle").forEach((toggle) => {
      if (toggle.dataset.headerDropdownBound === "true") return;
      toggle.dataset.headerDropdownBound = "true";
      toggle.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        const open = toggle.getAttribute("aria-expanded") !== "true";
        closeHeaderDropdowns(toggle);
        setDropdownState(toggle, open);
      });
      toggle.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
          setDropdownState(toggle, false);
          toggle.focus();
        }
      });
    });
  }

  function bindGlobalClose() {
    if (document.documentElement.dataset.headerGlobalCloseBound === "true") return;
    document.documentElement.dataset.headerGlobalCloseBound = "true";
    document.addEventListener("click", (event) => {
      if (!event.target.closest("#header-container .dropdown")) closeHeaderDropdowns();
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeHeaderDropdowns();
    });
  }

  function bindNavbar(scope) {
    const toggler = scope.querySelector(".navbar-toggler");
    const nav = scope.querySelector(".navbar-collapse");
    if (toggler && nav && toggler.dataset.headerNavbarBound !== "true") {
      toggler.dataset.headerNavbarBound = "true";
      toggler.addEventListener("click", (event) => {
        if (window.bootstrap?.Collapse) return;
        event.preventDefault();
        const open = !nav.classList.contains("show");
        nav.classList.toggle("show", open);
        toggler.setAttribute("aria-expanded", open ? "true" : "false");
      });
    }
    scope.querySelectorAll(".navbar-nav .nav-link:not(.dropdown-toggle), .dropdown-item:not(.disabled)").forEach((link) => {
      link.addEventListener("click", () => {
        closeHeaderDropdowns();
        if (window.innerWidth < 992) {
          if (window.bootstrap?.Collapse) bootstrap.Collapse.getOrCreateInstance(nav).hide();
          else nav?.classList.remove("show");
        }
      }, { once: true });
    });
  }

  function bindTranslation(scope) {
    const select = scope.querySelector("#language-select");
    if (!select || select.dataset.headerTranslateBound === "true") return;
    select.dataset.headerTranslateBound = "true";
    select.addEventListener("change", () => {
      const applyLanguage = () => {
        const combo = document.querySelector(".goog-te-combo");
        if (!combo) return setTimeout(applyLanguage, 500);
        combo.value = select.value;
        combo.dispatchEvent(new Event("change"));
      };
      applyLanguage();
    });
  }

  function markActivePage(scope) {
    const currentPage = window.location.pathname.split("/").pop() || "index.html";
    scope.querySelectorAll(".navbar-nav a[href]").forEach((link) => {
      if (link.getAttribute("href") === currentPage) {
        link.classList.add("active");
        link.closest(".dropdown")?.querySelector(".dropdown-toggle")?.classList.add("active");
      }
    });
  }

  function updateDateTime(scope) {
    const output = scope.querySelector("#datetime");
    if (!output) return;
    const now = new Date();
    output.textContent = `${now.toLocaleDateString(undefined, { month: "short", day: "numeric" })} ${now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  }

  function initSiteHeader(root) {
    const scope = root || document.getElementById("header-container") || document;
    bindDropdowns(scope);
    bindGlobalClose();
    bindNavbar(scope);
    bindTranslation(scope);
    markActivePage(scope);
    if (dateTimer) clearInterval(dateTimer);
    updateDateTime(scope);
    dateTimer = setInterval(() => updateDateTime(scope), 1000);
  }

  window.initSiteHeader = initSiteHeader;
  document.addEventListener("DOMContentLoaded", () => initSiteHeader());
})();

function googleTranslateElementInit() {
  if (window.google?.translate) {
    new google.translate.TranslateElement({ pageLanguage: "en", autoDisplay: false }, "google_translate_element");
  }
}