(() => {
  const body = document.body;
  const sidebar = document.getElementById("adminSidebar");
  const openButton = document.getElementById("mobileMenuBtn");
  const closeButton = document.getElementById("mobileMenuCloseBtn");
  const backdrop = document.getElementById("sidebarBackdrop");

  function setSidebar(open) {
    sidebar?.classList.toggle("is-open", open);
    backdrop?.classList.toggle("is-open", open);
    body.classList.toggle("admin-menu-open", open);
    openButton?.setAttribute("aria-expanded", open ? "true" : "false");
  }

  openButton?.addEventListener("click", () => setSidebar(true));
  closeButton?.addEventListener("click", () => setSidebar(false));
  backdrop?.addEventListener("click", () => setSidebar(false));

  document.querySelectorAll("form[data-confirm]").forEach((form) => {
    form.addEventListener("submit", (event) => {
      if (form.dataset.submitting === "true") {
        event.preventDefault();
        return;
      }

      if (form.dataset.confirm && !window.confirm(form.dataset.confirm)) {
        event.preventDefault();
        return;
      }

      form.dataset.submitting = "true";
      const submitter = event.submitter || form.querySelector("button[type='submit'], button:not([type]), input[type='submit']");
      if (submitter) {
        submitter.disabled = true;
        if (submitter.tagName === "BUTTON") {
          submitter.dataset.originalHtml = submitter.innerHTML;
          submitter.innerHTML = '<span class="spinner-border spinner-border-sm" aria-hidden="true"></span> Working...';
        }
      }
    });
  });


  function adminFieldLabel(field) {
    const wrapper = field.closest(".col-md-4, .col-md-6, .col-md-8, .col-12, .story-editor-group");
    const label = wrapper ? wrapper.querySelector("label") : null;
    return (label?.textContent || field.placeholder || field.name || "This field").replace(/\s+/g, " ").trim();
  }

  function adminValidPhone(value) {
    return /^\+?[0-9]{8,15}$/.test(String(value || "").replace(/\s+/g, ""));
  }

  function adminValidationMessage(field) {
    const name = adminFieldLabel(field);
    if (field.validity.valueMissing) return `${name} is required.`;
    if (field.validity.typeMismatch) return `Please enter a valid ${name.toLowerCase()}.`;
    if (field.validity.badInput || field.validity.stepMismatch) return `Please enter a valid value for ${name}.`;
    if (field.validity.customError) return field.validationMessage;
    return field.validationMessage || `Please check ${name}.`;
  }

  function showAdminFieldPopup(field, message) {
    alert(message);
    field.scrollIntoView({ behavior: "smooth", block: "center" });
    field.focus({ preventScroll: true });
  }

  function validateDirectEntryForm(form) {
    form.querySelectorAll("input[type='tel']").forEach((field) => {
      const value = field.value.trim();
      field.setCustomValidity(value && !adminValidPhone(value) ? "Enter a valid phone number using 8 to 15 digits. Example: +8801XXXXXXXXX" : "");
    });

    const firstInvalid = form.querySelector("input:invalid, select:invalid, textarea:invalid");
    if (firstInvalid) {
      showAdminFieldPopup(firstInvalid, adminValidationMessage(firstInvalid));
      return false;
    }
    return true;
  }

  document.getElementById("directEntryForm")?.addEventListener("submit", (event) => {
    if (!validateDirectEntryForm(event.currentTarget)) {
      event.preventDefault();
    }
  });

  const smsPatientSelect = document.querySelector('select[name="registration_id"]');
  const smsCustomNumbers = document.querySelector('input[name="phones"]');
  function syncSmsCustomNumbers() {
    if (!smsPatientSelect || !smsCustomNumbers) return;
    const patientSelected = smsPatientSelect.value !== "0";
    smsCustomNumbers.disabled = patientSelected;
    smsCustomNumbers.required = !patientSelected;
    if (patientSelected) smsCustomNumbers.value = "";
    smsCustomNumbers.placeholder = patientSelected ? "Disabled when patient is selected" : "+8801..., +8801...";
  }
  smsPatientSelect?.addEventListener("change", syncSmsCustomNumbers);
  syncSmsCustomNumbers();
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