const registrationSubmitUrl = "/registration_submit.php";

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
function readableFieldName(field) {
  const label = fieldLabel(field)
    .replace(/\s*\([^)]*\)/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return label || field.placeholder || field.name || "This field";
}

function validationMessageFor(field) {
  const fieldName = readableFieldName(field);
  if (field.validity.valueMissing) return `${fieldName} is required.`;
  if (field.validity.typeMismatch) return `Please enter a valid ${fieldName.toLowerCase()}.`;
  if (field.validity.rangeUnderflow || field.validity.rangeOverflow) return `${fieldName} is outside the allowed range.`;
  if (field.validity.stepMismatch || field.validity.badInput) return `Please enter a valid numeric value for ${fieldName}.`;
  if (field.validity.patternMismatch) return field.title || `Please enter ${fieldName} in the correct format.`;
  return field.validationMessage || `Please check ${fieldName}.`;
}

function showFieldPopup(field, message) {
  alert(message);
  field.scrollIntoView({ behavior: "smooth", block: "center" });
  field.focus({ preventScroll: true });
}

function digitsOnly(value) {
  return String(value || "").replace(/\D/g, "");
}

function isValidDigitLength(value, lengths) {
  const digits = digitsOnly(value);
  return lengths.includes(digits.length) && digits === String(value || "").trim();
}

function isValidProviderEmail(value) {
  const email = String(value || "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return false;
  return /@(?:gmail\.com|yahoo\.(?:com|co\.[a-z]{2})|ymail\.com|rocketmail\.com|outlook\.com|hotmail\.com|live\.com|msn\.com|icloud\.com|me\.com|protonmail\.com|aol\.com)$/.test(email);
}

function setFieldValidity(field, message) {
  field.setCustomValidity(message);
  field.classList.toggle("is-invalid", Boolean(message));
}

function validateRegistrationForm(form) {
  form.classList.add("was-validated");
  form.querySelectorAll("input, select, textarea").forEach((field) => setFieldValidity(field, ""));

  ["birth_certificate_no"].forEach((name) => {
    const field = form.elements[name];
    if (field && field.value.trim() && !isValidDigitLength(field.value, [17])) {
      setFieldValidity(field, "Birth certificate number must be exactly 17 digits.");
    }
  });

  ["nid", "fathers_nid", "mothers_nid"].forEach((name) => {
    const field = form.elements[name];
    if (field && field.value.trim() && !isValidDigitLength(field.value, [10, 17])) {
      setFieldValidity(field, "NID must be exactly 10 or 17 digits.");
    }
  });

  ["contact_no", "emergency_contact_no"].forEach((name) => {
    const field = form.elements[name];
    if (field && field.value.trim() && !isValidPhone(field.value)) {
      setFieldValidity(field, "Mobile number must be exactly 11 digits.");
    }
  });

  const contact = form.elements.contact_no;
  const emergency = form.elements.emergency_contact_no;
  if (contact?.value.trim() && emergency?.value.trim() && digitsOnly(contact.value) === digitsOnly(emergency.value)) {
    setFieldValidity(emergency, "Emergency contact number must be different from mobile number.");
  }

  const email = form.elements.email_address;
  if (email?.value.trim() && !isValidProviderEmail(email.value)) {
    setFieldValidity(email, "Enter a valid email address from Gmail, Yahoo, Outlook, Hotmail, iCloud, ProtonMail, or similar providers.");
  }

  ["age_at_diagnosis", "class_lavel"].forEach((name) => {
    const field = form.elements[name];
    if (field && field.value.trim() && (!Number.isFinite(Number(field.value)) || Number(field.value) < 0)) {
      setFieldValidity(field, `${readableFieldName(field)} must be numeric.`);
    }
  });

  const firstInvalidField = form.querySelector("input:invalid, select:invalid, textarea:invalid");
  if (firstInvalidField) {
    firstInvalidField.classList.add("is-invalid");
    showFieldPopup(firstInvalidField, validationMessageFor(firstInvalidField));
    return false;
  }

  return true;
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
  return isValidDigitLength(value, [11]);
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
  const files = Array.from(fileInput.files || []);
  const isValid = files.every((file) => validateFile(file, {
    maxSize: file.type === "application/pdf" ? 5 * 1024 * 1024 : 2 * 1024 * 1024,
    types: ["application/pdf", "image/jpeg", "image/png", "image/webp"],
    sizeMessage: "Each PDF report must be 5MB or smaller; each image report must be 2MB or smaller.",
    typeMessage: "Invalid report type. Please upload PDF, JPG, PNG, or WEBP.",
  }));
  fileInput.classList.toggle("is-invalid", !isValid || (fileInput.required && files.length === 0));
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
  const reports = Array.from(document.getElementById("reportUpload").files || []);
  if (photo) formData.append("photo", photo);
  reports.forEach((report) => formData.append("genetic_report[]", report));

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
    const response = await fetch(registrationSubmitUrl, {
      method: "POST",
      body: buildRegistrationFormData(form),
    });
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      if (response.status === 409 && body.code === "duplicate_patient_health_issue") {
        showDuplicateRegistration(body.message);
        return;
      }
      throw new Error(body.message || "Registration submission failed.");
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

  document.querySelectorAll("#registrationForm input, #registrationForm select, #registrationForm textarea").forEach((field) => {
    field.addEventListener("input", () => {
      field.setCustomValidity("");
      field.classList.remove("is-invalid");
    });
    field.addEventListener("change", () => {
      field.setCustomValidity("");
      field.classList.remove("is-invalid");
    });
  });
  document.getElementById("photoUpload").addEventListener("change", showImagePreview);
  document.getElementById("reportUpload").addEventListener("change", validateReport);

  document.getElementById("registrationForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!validateRegistrationForm(form)) return;
    if (!validateImage() || !validateReport()) return;
    submitRegistration(form);
  });
});

window.validateImage = validateImage;
window.showImagePreview = showImagePreview;
