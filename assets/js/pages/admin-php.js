(() => {
  const body = document.body;
  const sidebar = document.getElementById("adminSidebar");
  const openButton = document.getElementById("mobileMenuBtn");
  const closeButton = document.getElementById("mobileMenuCloseBtn");
  const backdrop = document.getElementById("sidebarBackdrop");

  function setSidebar(open) {
    sidebar?.classList.toggle("open", open);
    backdrop?.classList.toggle("show", open);
    body.classList.toggle("sidebar-open", open);
    openButton?.setAttribute("aria-expanded", open ? "true" : "false");
  }

  openButton?.addEventListener("click", () => setSidebar(true));
  closeButton?.addEventListener("click", () => setSidebar(false));
  backdrop?.addEventListener("click", () => setSidebar(false));

  document.querySelectorAll("form[data-confirm]").forEach((form) => {
    form.addEventListener("submit", (event) => {
      if (!window.confirm(form.dataset.confirm)) event.preventDefault();
    });
  });

  const message = document.getElementById("smsMessage");
  const count = document.getElementById("smsCount");
  const updateCount = () => { if (count) count.textContent = String(message?.value.length || 0); };
  message?.addEventListener("input", updateCount);
  updateCount();

  document.querySelectorAll("#patientStoryTabs [data-story-section]").forEach((button) => {
    button.addEventListener("click", () => {
      const section = button.dataset.storySection;
      document.querySelectorAll("#patientStoryTabs [data-story-section]").forEach((tab) => {
        tab.classList.toggle("active", tab === button);
      });
      ["home", "list", "detail"].forEach((name) => {
        document.getElementById(`story${name[0].toUpperCase()}${name.slice(1)}Section`)?.classList.toggle("d-none", name !== section);
      });
    });
  });

  const acceptedSearch = document.getElementById("acceptedSearch");
  const acceptedRows = document.querySelectorAll("#acceptedTable tbody tr[data-search]");
  acceptedSearch?.addEventListener("input", () => {
    const term = acceptedSearch.value.trim().toLowerCase();
    acceptedRows.forEach((row) => {
      row.hidden = term !== "" && !row.dataset.search.includes(term);
    });
  });
})();