const configuredRegApiBase = window.DMD_API_BASE_URL?.replace(/\/$/, "");
const regApiCandidates = [
  configuredRegApiBase,
  location.protocol.startsWith("http") ? location.origin.replace(/\/$/, "") : null,
  "http://127.0.0.1:8002",
].filter((value, index, values) => value && values.indexOf(value) === index);
let regApiBasePromise = null;

async function resolveRegApiBase() {
  for (const base of regApiCandidates) {
    try {
      const response = await fetch(`${base}/api/health`);
      if (response.ok) return base;
    } catch {}
  }
  return "http://127.0.0.1:8002";
}

function revealOnScroll() {
  document.querySelectorAll(".scroll-reveal").forEach((el) => {
    if (el.getBoundingClientRect().top < window.innerHeight - 100) {
      el.classList.add("visible");
    }
  });
}

function slugifyKey(value) {
  return String(value || "")
    .split("(")[0]
    .trim()
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function fieldLabel(field) {
  const wrapper = field.closest(".col-md-2, .col-md-3, .col-md-4, .col-md-6, .col-md-8, .col-md-10, .col-12, .mb-3, .mb-4");
  const label = wrapper ? wrapper.querySelector("label") : null;
  return label ? label.textContent : "";
}

function setFieldValue(fields, key, value) {
  if (!key) return;
  let finalKey = key;
  let index = 2;
  while (Object.prototype.hasOwnProperty.call(fields, finalKey)) {
    finalKey = `${key}_${index}`;
    index += 1;
  }
  fields[finalKey] = value;
}

function collectFields(form) {
  const fields = {};
  const controls = form.querySelectorAll("input, select, textarea");

  controls.forEach((field, index) => {
    if (field.type === "submit" || field.type === "button" || field.type === "file") return;
    if ((field.type === "radio" || field.type === "checkbox") && !field.checked) return;

    const key = field.name || field.id || slugifyKey(fieldLabel(field)) || `field_${index + 1}`;
    const value = field.type === "checkbox" ? "Yes" : field.value;
    setFieldValue(fields, slugifyKey(key), value);
  });

  return fields;
}

function isValidPhone(value) {
  return /^\+?[0-9]{8,15}$/.test(String(value || "").replace(/\s+/g, ""));
}

function validateFile(file, options) {
  if (!file) return true;
  if (file.size > options.maxSize) {
    alert(options.sizeMessage);
    return false;
  }
  if (!options.types.includes(file.type)) {
    alert(options.typeMessage);
    return false;
  }
  return true;
}

function validateImage() {
  const fileInput = document.getElementById("photoUpload");
  const file = fileInput.files[0];
  const isValid = validateFile(file, {
    maxSize: 2 * 1024 * 1024,
    types: ["image/jpeg", "image/png", "image/webp"],
    sizeMessage: "Photo is too large. Maximum size is 2MB.",
    typeMessage: "Invalid photo type. Please upload JPG, PNG, or WEBP.",
  });
  if (!isValid) fileInput.value = "";
  return isValid;
}

function validateReport() {
  const fileInput = document.getElementById("reportUpload");
  const file = fileInput.files[0];
  const isValid = validateFile(file, {
    maxSize: 5 * 1024 * 1024,
    types: ["application/pdf", "image/jpeg", "image/png", "image/webp"],
    sizeMessage: "Report is too large. Maximum size is 5MB.",
    typeMessage: "Invalid report type. Please upload PDF, JPG, PNG, or WEBP.",
  });
  if (!isValid) fileInput.value = "";
  return isValid;
}

function showImagePreview() {
  if (!validateImage()) return;

  const fileInput = document.getElementById("photoUpload");
  const previewContainer = document.getElementById("photoPreview");
  const file = fileInput.files[0];
  previewContainer.innerHTML = "";

  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    const img = document.createElement("img");
    img.src = event.target.result;
    img.alt = "Selected patient photo";
    img.style.maxWidth = "200px";
    img.style.maxHeight = "200px";
    previewContainer.appendChild(img);
  };
  reader.readAsDataURL(file);
}

function buildRegistrationFormData(form) {
  const fields = collectFields(form);
  const patientName = fields.patient_full_name || fields.full_name;
  const guardianPhone = fields.contact_no || fields.emergency_contact_no;
  const guardianEmail = fields.email_address || fields.email;

  if (!patientName) throw new Error("Patient full name is required.");
  if (!isValidPhone(guardianPhone)) throw new Error("A valid contact number is required.");

  const formData = new FormData();
  formData.append("patient_name", patientName);
  formData.append("guardian_phone", guardianPhone);
  if (guardianEmail) formData.append("guardian_email", guardianEmail);
  formData.append("payload", JSON.stringify(fields));

  const photo = document.getElementById("photoUpload").files[0];
  const report = document.getElementById("reportUpload").files[0];
  if (photo) formData.append("photo", photo);
  if (report) formData.append("genetic_report", report);

  return formData;
}

function showRegistrationSuccess(form) {
  const modal = new bootstrap.Modal(document.getElementById("confirmationModal"));
  modal.show();

  form.reset();
  document.getElementById("photoPreview").innerHTML = "";
  document.querySelectorAll("#otherDetails").forEach((field) => {
    field.style.display = "none";
  });
}

function showDuplicateRegistration(message) {
  document.getElementById("duplicateRegistrationMessage").textContent = message;
  new bootstrap.Modal(document.getElementById("duplicateRegistrationModal")).show();
}

async function submitRegistration(form) {
  const submitButton = form.querySelector("button[type='submit']");
  submitButton.disabled = true;
  submitButton.innerHTML = '<i class="fa-solid fa-spinner fa-spin me-2"></i>Submitting...';

  try {
    if (!regApiBasePromise) regApiBasePromise = resolveRegApiBase();
    const regApiBase = await regApiBasePromise;
    const response = await fetch(`${regApiBase}/api/registrations`, {
      method: "POST",
      body: buildRegistrationFormData(form),
    });
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      if (response.status === 409 && body.detail?.code === "duplicate_patient_health_issue") {
        showDuplicateRegistration(body.detail.message);
        return;
      }
      const detail = typeof body.detail === "string" ? body.detail : body.detail?.message;
      throw new Error(detail || "Registration submission failed.");
    }

    showRegistrationSuccess(form);
  } catch (error) {
    alert(error.message);
  } finally {
    submitButton.disabled = false;
    submitButton.innerHTML = '<i class="fa-solid fa-paper-plane me-2"></i> Submit Registration';
  }
}

document.addEventListener("DOMContentLoaded", () => {
  revealOnScroll();
  window.addEventListener("scroll", revealOnScroll);

  document.querySelectorAll("#otherDetails").forEach((field) => {
    field.style.display = "none";
  });
  document.querySelectorAll("#otherOption").forEach((option) => {
    option.addEventListener("change", () => {
      const detailField = option.closest(".form-check").querySelector("#otherDetails");
      if (detailField) detailField.style.display = option.checked ? "block" : "none";
    });
  });

  document.getElementById("photoUpload").addEventListener("change", showImagePreview);
  document.getElementById("reportUpload").addEventListener("change", validateReport);

  document.getElementById("registrationForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    if (!validateImage() || !validateReport()) return;
    submitRegistration(form);
  });
});

window.validateImage = validateImage;
window.showImagePreview = showImagePreview;
