const configuredApiBase = window.DMD_API_BASE_URL?.replace(/\/$/, "");
const tokenKey = "dmd_admin_token";
const healthPath = "/api/health";
const fallbackApiBases = [
  configuredApiBase,
  location.protocol.startsWith("http") ? location.origin.replace(/\/$/, "") : null,
  "http://127.0.0.1:8002",
].filter((value, index, values) => value && values.indexOf(value) === index);

let token = localStorage.getItem(tokenKey);
let currentUser = null;
let registrations = [];
let acceptedPatients = [];
let editingAttachments = {};
let contentItems = [];
let galleryKind = 'photo';
let patientStorySection = 'home';
let apiBasePromise = null;

const loginView = document.getElementById("loginView");
const appView = document.getElementById("appView");
const toast = new bootstrap.Toast(document.getElementById("appToast"));
const registrationModal = new bootstrap.Modal(document.getElementById("registrationModal"));
const patientImagesModal = new bootstrap.Modal(document.getElementById("patientImagesModal"));
const contentModal = new bootstrap.Modal(document.getElementById("contentModal"));
const smsModal = new bootstrap.Modal(document.getElementById("smsModal"));

function showToast(message, type = "info") {
  const toastElement = document.getElementById("appToast");
  toastElement.classList.toggle("text-bg-success", type === "success");
  toastElement.classList.toggle("text-bg-danger", type === "error");
  document.getElementById("toastBody").textContent = message;
  toast.show();
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatDate(value) {
  if (!value) return "";
  return new Date(value).toLocaleString();
}

function parseJsonField(id) {
  const value = document.getElementById(id).value.trim();
  if (!value) return {};
  try {
    return JSON.parse(value);
  } catch {
    throw new Error("JSON field is invalid");
  }
}
function humanizePayloadKey(key) {
  return String(key)
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function payloadValueType(value) {
  if (Array.isArray(value)) return "array";
  if (value === null) return "null";
  return typeof value;
}

function renderPayloadFields(payload = {}) {
  const container = document.getElementById("editPayloadFields");
  container.innerHTML = "";
  const entries = Object.entries(payload).filter(([key]) => key !== "attachments");

  if (!entries.length) {
    const empty = document.createElement("div");
    empty.className = "col-12 text-muted";
    empty.textContent = "No additional information available.";
    container.appendChild(empty);
    return;
  }

  entries.forEach(([key, value]) => {
    const type = payloadValueType(value);
    const wrapper = document.createElement("div");
    wrapper.className = type === "object" || type === "array" ? "col-12" : "col-md-6";

    const label = document.createElement("label");
    label.className = "form-label";
    label.textContent = humanizePayloadKey(key);

    const control = document.createElement(type === "object" || type === "array" ? "textarea" : "input");
    control.className = "form-control";
    control.dataset.payloadKey = key;
    control.dataset.payloadType = type;
    if (control instanceof HTMLTextAreaElement) control.rows = 3;
    control.value = type === "object" || type === "array" ? JSON.stringify(value, null, 2) : value ?? "";

    wrapper.append(label, control);
    container.appendChild(wrapper);
  });
}

function readPayloadFields() {
  const payload = {};
  document.querySelectorAll("#editPayloadFields [data-payload-key]").forEach((control) => {
    const key = control.dataset.payloadKey;
    const type = control.dataset.payloadType;
    const value = control.value.trim();

    if (type === "number") {
      const number = Number(value);
      if (!Number.isFinite(number)) throw new Error(`${humanizePayloadKey(key)} must be a number`);
      payload[key] = number;
    } else if (type === "boolean") {
      if (!["true", "false", "yes", "no", "1", "0"].includes(value.toLowerCase())) {
        throw new Error(`${humanizePayloadKey(key)} must be true or false`);
      }
      payload[key] = ["true", "yes", "1"].includes(value.toLowerCase());
    } else if (type === "object" || type === "array") {
      try {
        payload[key] = JSON.parse(value);
      } catch {
        throw new Error(`${humanizePayloadKey(key)} has invalid structured data`);
      }
    } else if (type === "null" && !value) {
      payload[key] = null;
    } else {
      payload[key] = value;
    }
  });
  return payload;
}

function openRegistrationEditor(registration) {
  document.getElementById("editRegistrationId").value = registration.id;
  document.getElementById("editPatientName").value = registration.patient_name;
  document.getElementById("editGuardianPhone").value = registration.guardian_phone;
  document.getElementById("editGuardianEmail").value = registration.guardian_email || "";
  document.getElementById("editStatus").value = registration.status;
  document.getElementById("editNotes").value = registration.notes || "";
  renderPayloadFields(registration.payload || {});
  renderRegistrationAttachments(registration.payload?.attachments || {});
  registrationModal.show();
}

function attachmentValue(attachment) {
  if (typeof attachment === "string") return attachment;
  return attachment?.url || "";
}

async function resolveAttachmentUrl(attachment) {
  const url = attachmentValue(attachment);
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) return url;
  if (!/^\/?uploads\//i.test(url)) return new URL(url.replace(/^\//, ""), `${location.origin}/`).href;
  if (!apiBasePromise) apiBasePromise = resolveApiBase();
  const base = await apiBasePromise;
  return `${base}/${url.replace(/^\//, "")}`;
}

async function displayPatientImage(linkId, imageId, emptyId, attachment) {
  const link = document.getElementById(linkId);
  const image = document.getElementById(imageId);
  const empty = document.getElementById(emptyId);
  const url = await resolveAttachmentUrl(attachment);
  link.classList.toggle("d-none", !url);
  empty.classList.toggle("d-none", Boolean(url));
  if (url) {
    image.onerror = () => {
      link.classList.add("d-none");
      empty.classList.remove("d-none");
    };
    link.href = url;
    image.src = url;
  } else {
    image.onerror = null;
    link.removeAttribute("href");
    image.removeAttribute("src");
  }
}

function showPatientImages(registration) {
  const attachments = registration.payload?.attachments || {};
  document.getElementById("patientImagesName").textContent = registration.patient_name;
  displayPatientImage(
    "patientImageViewerLink",
    "patientImageViewer",
    "patientImageEmpty",
    attachments.photo || attachments.patient_image,
  );
  displayPatientImage(
    "reportImageViewerLink",
    "reportImageViewer",
    "reportImageEmpty",
    attachments.genetic_report || attachments.report || attachments.report_image,
  );
  patientImagesModal.show();
}

async function displayAttachment(linkId, previewId, attachment) {
  const link = document.getElementById(linkId);
  const preview = document.getElementById(previewId);
  const url = attachmentValue(attachment);
  link.classList.toggle("d-none", !url);
  preview.classList.toggle("d-none", !url);
  if (!url) {
    link.removeAttribute("href");
    preview.removeAttribute("src");
    return;
  }

  const resolvedUrl = await resolveAttachmentUrl(attachment);
  link.href = resolvedUrl;
  preview.src = resolvedUrl;
}

function renderRegistrationAttachments(attachments = {}) {
  editingAttachments = { ...attachments };
  document.getElementById("editPatientPhoto").value = "";
  document.getElementById("editReportImage").value = "";
  displayAttachment("currentPatientPhoto", "currentPatientPhotoPreview", attachments.photo);
  displayAttachment(
    "currentReportImage",
    "currentReportImagePreview",
    attachments.genetic_report || attachments.report,
  );
}

async function uploadRegistrationImage(inputId) {
  const input = document.getElementById(inputId);
  const file = input.files[0];
  if (!file) return null;
  if (file.size > 2 * 1024 * 1024) throw new Error("Each image must be 2MB or smaller");

  const formData = new FormData();
  formData.append("file", file);
  return api("/api/admin/uploads", { method: "POST", body: formData });
}

async function buildEditedRegistrationPayload() {
  const payload = readPayloadFields();
  const [photo, report] = await Promise.all([
    uploadRegistrationImage("editPatientPhoto"),
    uploadRegistrationImage("editReportImage"),
  ]);
  const attachments = { ...editingAttachments };
  if (photo) attachments.photo = photo;
  if (report) attachments.genetic_report = report;
  if (Object.keys(attachments).length) payload.attachments = attachments;
  return payload;
}

function readErrorDetail(body) {
  if (!body) return "Request failed";
  if (typeof body.detail === "string" && body.detail.trim()) return body.detail;
  if (Array.isArray(body.detail) && body.detail.length) {
    return body.detail
      .map((item) => item?.msg || item?.message || JSON.stringify(item))
      .filter(Boolean)
      .join(", ");
  }
  if (typeof body.message === "string" && body.message.trim()) return body.message;
  return "Request failed";
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function resolveApiBase() {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    for (const base of fallbackApiBases) {
      try {
        const response = await fetch(`${base}${healthPath}`, { cache: "no-store" });
        if (response.ok) return base;
      } catch {}
    }
    await wait(700);
  }

  throw new Error(
    `Unable to reach the API server. Run run-project.bat and wait until it says DMD Care Admin is ready.`
  );
}

async function api(path, options = {}) {
  if (!apiBasePromise) apiBasePromise = resolveApiBase();
  const apiBase = await apiBasePromise;
  const headers = options.headers ? { ...options.headers } : {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (options.body && !(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(`${apiBase}${path}`, { ...options, headers });
  if (response.status === 401) {
    logout();
    throw new Error("Please login again");
  }
  if (!response.ok) {
    let detail = "Request failed";
    try {
      const body = await response.json();
      detail = readErrorDetail(body);
    } catch {}
    throw new Error(detail);
  }
  if (response.status === 204) return null;
  return response.json();
}

function badge(status) {
  return `<span class="badge-status badge-${escapeHtml(status)}">${escapeHtml(status)}</span>`;
}

function setLoggedIn(user) {
  currentUser = user;
  loginView.classList.add("d-none");
  appView.classList.remove("d-none");
  document.getElementById("currentUser").textContent = `${user.name} (${user.role})`;
  loadDashboard();
}

function logout() {
  token = null;
  currentUser = null;
  localStorage.removeItem(tokenKey);
  appView.classList.add("d-none");
  loginView.classList.remove("d-none");
}

async function bootstrapSession() {
  if (!token) return;
  try {
    const user = await api("/api/admin/me");
    setLoggedIn(user);
  } catch {
    logout();
  }
}

document.getElementById("loginForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  document.getElementById("loginError").textContent = "";
  try {
    const result = await api("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email: document.getElementById("loginEmail").value,
        password: document.getElementById("loginPassword").value,
      }),
    });
    token = result.access_token;
    localStorage.setItem(tokenKey, token);
    setLoggedIn(result.user);
  } catch (error) {
    document.getElementById("loginError").textContent = error.message;
  }
});

const adminSidebar = document.getElementById("adminSidebar");
const mobileMenuBtn = document.getElementById("mobileMenuBtn");
const mobileMenuCloseBtn = document.getElementById("mobileMenuCloseBtn");
const sidebarBackdrop = document.getElementById("sidebarBackdrop");

function setMobileMenu(open) {
  adminSidebar.classList.toggle("is-open", open);
  sidebarBackdrop.classList.toggle("is-open", open);
  document.body.classList.toggle("admin-menu-open", open);
  mobileMenuBtn.setAttribute("aria-expanded", String(open));
}

mobileMenuBtn.addEventListener("click", () => setMobileMenu(true));
mobileMenuCloseBtn.addEventListener("click", () => setMobileMenu(false));
sidebarBackdrop.addEventListener("click", () => setMobileMenu(false));
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") setMobileMenu(false);
});
window.addEventListener("resize", () => {
  if (window.innerWidth > 900) setMobileMenu(false);
});

document.getElementById("logoutBtn").addEventListener("click", () => {
  setMobileMenu(false);
  logout();
});

document.querySelectorAll(".nav-btn").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".nav-btn").forEach((item) => item.classList.remove("active"));
    button.classList.add("active");

    const section = button.dataset.section;
    document.querySelectorAll(".work-section").forEach((item) => item.classList.remove("active"));
    document.getElementById(`${section}Section`).classList.add("active");
    document.getElementById("sectionTitle").textContent = button.textContent.trim();

    if (section === "dashboard") loadDashboard();
    if (section === "requests") loadRequests();
    if (section === "direct") loadDirectEntryFields();
    if (section === "accepted") loadAcceptedPatients();
    if (section === "content") {
      setContentType(button.dataset.contentType);
      resetContentForm(false);
      loadContent();
    }
    if (section === "users") loadUsers();
    if (section === "sms") loadSmsManagement();
    if (window.innerWidth <= 900) setMobileMenu(false);
  });
});

async function loadDashboard() {
  try {
    const report = await api("/api/admin/reports/summary");
    document.getElementById("metricTotal").textContent = report.registrations.total;
    document.getElementById("metricPending").textContent = report.registrations.pending;
    document.getElementById("metricTodayRegistrations").textContent = report.registrations.today ?? 0;
    document.getElementById("metricAccepted").textContent = report.registrations.accepted;
    document.getElementById("metricRejected").textContent = report.registrations.rejected;
    document.getElementById("metricVisitorsTotal").textContent = report.visitors?.total ?? 0;
    document.getElementById("metricVisitorsToday").textContent = report.visitors?.today ?? 0;
    document.getElementById("reportRows").innerHTML = report.registrations.last_30_days
      .map((row) => `<tr><td>${escapeHtml(row.date)}</td><td>${row.count}</td></tr>`)
      .join("") || `<tr><td colspan="2" class="text-muted">No recent requests</td></tr>`;
  } catch (error) {
    showToast(error.message);
  }
}

async function exportPatientReport() {
  try {
    if (!apiBasePromise) apiBasePromise = resolveApiBase();
    const apiBase = await apiBasePromise;
    const response = await fetch(`${apiBase}/api/admin/reports/patients/export?status_filter=accepted`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error(readErrorDetail(await response.json().catch(() => null)));
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const stamp = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.download = `accepted_patients_${stamp}.xls`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  } catch (error) {
    showToast(error.message);
  }
}

async function downloadPatientExcel(registration) {
  try {
    if (!apiBasePromise) apiBasePromise = resolveApiBase();
    const apiBase = await apiBasePromise;
    const response = await fetch(`${apiBase}/api/admin/registrations/${registration.id}/export`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error(readErrorDetail(await response.json().catch(() => null)));
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const safeName = String(registration.patient_name || "patient").replace(/[^a-z0-9]+/gi, "_").replace(/^_+|_+$/g, "");
    const link = document.createElement("a");
    link.href = url;
    link.download = `${safeName || "patient"}_${registration.id}_details.xls`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    showToast("Patient Excel downloaded", "success");
  } catch (error) {
    showToast(error.message, "error");
  }
}
async function loadRequests() {
  const status = document.getElementById("requestStatusFilter").value;
  const q = document.getElementById("requestSearch").value.trim();
  const params = new URLSearchParams();
  if (status) params.set("status_filter", status);
  if (q) params.set("q", q);
  try {
    registrations = await api(`/api/admin/registrations?${params.toString()}`);
    document.getElementById("requestsRows").innerHTML = registrations.map((item) => `
      <tr>
        <td>${item.id}</td>
        <td>${escapeHtml(item.patient_name)}</td>
        <td>${escapeHtml(item.guardian_phone)}</td>
        <td>${badge(item.status)}</td>
        <td>${escapeHtml(item.source)}</td>
        <td>${formatDate(item.created_at)}</td>
        <td class="text-end">
          <button class="btn btn-sm btn-outline-success" type="button" data-action="download-patient-excel" data-id="${item.id}" title="Download Excel" aria-label="Download patient Excel"><i class="bi bi-file-earmark-excel"></i><span class="d-none d-xl-inline ms-1">Excel</span></button>
          <button class="btn btn-sm btn-outline-secondary" data-action="edit-registration" data-id="${item.id}"><i class="bi bi-pencil"></i></button>
          <button class="btn btn-sm btn-outline-success" data-action="accept-registration" data-id="${item.id}"><i class="bi bi-check2"></i></button>
          <button class="btn btn-sm btn-outline-danger" data-action="reject-registration" data-id="${item.id}"><i class="bi bi-x-lg"></i></button>
        </td>
      </tr>
    `).join("") || `<tr><td colspan="7" class="text-muted">No requests found</td></tr>`;
  } catch (error) {
    showToast(error.message);
  }
}

async function loadAcceptedPatients() {
  const q = document.getElementById("acceptedSearch").value.trim();
  const params = new URLSearchParams({ status_filter: "accepted" });
  if (q) params.set("q", q);

  try {
    acceptedPatients = await api(`/api/admin/registrations?${params.toString()}`);
    document.getElementById("acceptedRows").innerHTML = acceptedPatients.map((item) => `
      <tr>
        <td>${item.id}</td>
        <td>${escapeHtml(item.patient_name)}</td>
        <td>${escapeHtml(item.guardian_phone)}</td>
        <td>${escapeHtml(item.guardian_email || "")}</td>
        <td>${escapeHtml(item.source)}</td>
        <td>${formatDate(item.updated_at)}</td>
        <td class="text-end">
          <button class="btn btn-sm btn-outline-success" type="button" data-action="download-patient-excel" data-id="${item.id}" title="Download Excel" aria-label="Download patient Excel"><i class="bi bi-file-earmark-excel"></i><span class="d-none d-xl-inline ms-1">Excel</span></button>
          <button class="btn btn-sm btn-outline-success" type="button" data-action="view-attachments" data-id="${item.id}" title="View images" aria-label="View images"><i class="bi bi-images"></i></button>
          <button class="btn btn-sm btn-outline-secondary" data-action="edit-accepted" data-id="${item.id}"><i class="bi bi-pencil"></i></button>
        </td>
      </tr>
    `).join("") || `<tr><td colspan="7" class="text-muted">No accepted patients found</td></tr>`;
  } catch (error) {
    showToast(error.message);
  }
}
document.getElementById("refreshAcceptedBtn").addEventListener("click", loadAcceptedPatients);
document.getElementById("acceptedSearch").addEventListener("input", () => {
  clearTimeout(window.acceptedSearchTimer);
  window.acceptedSearchTimer = setTimeout(loadAcceptedPatients, 350);
});

document.getElementById("acceptedRows").addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  const registration = acceptedPatients.find((item) => item.id === Number(button.dataset.id));
  if (!registration) return;

  if (button.dataset.action === "download-patient-excel") downloadPatientExcel(registration);
  if (button.dataset.action === "view-attachments") showPatientImages(registration);
  if (button.dataset.action === "edit-accepted") openRegistrationEditor(registration);
});
document.getElementById("refreshRequestsBtn").addEventListener("click", loadRequests);
document.getElementById("requestStatusFilter").addEventListener("change", loadRequests);
document.getElementById("requestSearch").addEventListener("input", () => {
  clearTimeout(window.requestSearchTimer);
  window.requestSearchTimer = setTimeout(loadRequests, 350);
});

document.getElementById("requestsRows").addEventListener("click", async (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  const id = Number(button.dataset.id);
  const registration = registrations.find((item) => item.id === id);
  if (!registration) return;

  if (button.dataset.action === "download-patient-excel") {
    downloadPatientExcel(registration);
    return;
  }

  if (button.dataset.action === "edit-registration") {
    openRegistrationEditor(registration);

  }

  if (button.dataset.action === "accept-registration" || button.dataset.action === "reject-registration") {
    const nextStatus = button.dataset.action === "accept-registration" ? "accepted" : "rejected";
    try {
      await api(`/api/admin/registrations/${id}/decision`, {
        method: "POST",
        body: JSON.stringify({ status: nextStatus }),
      });
      showToast(`Registration ${nextStatus}`);
      loadRequests();
      loadDashboard();
    } catch (error) {
      showToast(error.message);
    }
  }
});

document.getElementById("registrationEditForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    const id = document.getElementById("editRegistrationId").value;
    const payload = await buildEditedRegistrationPayload();
    await api(`/api/admin/registrations/${id}`, {
      method: "PATCH",
      body: JSON.stringify({
        patient_name: document.getElementById("editPatientName").value,
        guardian_phone: document.getElementById("editGuardianPhone").value,
        guardian_email: document.getElementById("editGuardianEmail").value || null,
        status: document.getElementById("editStatus").value,
        notes: document.getElementById("editNotes").value,
        payload,
      }),
    });
    registrationModal.hide();
    showToast("Registration saved");
    loadRequests();
    loadAcceptedPatients();
    loadDashboard();
  } catch (error) {
    showToast(error.message);
  }
});

document.getElementById("manualSmsBtn").addEventListener("click", () => {
  const id = document.getElementById("editRegistrationId").value;
  document.getElementById("smsRegistrationId").value = id;
  document.getElementById("smsMessage").value = `DMD Care Bangladesh update for registration #${id}.`;
  smsModal.show();
});

document.getElementById("smsForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    const id = document.getElementById("smsRegistrationId").value;
    const result = await api(`/api/admin/registrations/${id}/send-sms`, {
      method: "POST",
      body: JSON.stringify({
        recipient_type: document.getElementById("smsRecipientType").value,
        recipient_phone: document.getElementById("smsPhone").value || null,
        message: document.getElementById("smsMessage").value,
      }),
    });
    smsModal.hide();
    if (result.status === "sent") {
      showToast("SMS sent successfully", "success");
    } else {
      showToast(`SMS denied: ${String(result.response || result.status).slice(0, 180)}`, "error");
    }
    loadSmsLogs();
  } catch (error) {
    showToast(`SMS denied: ${error.message}`, "error");
  }
});

let directEntryLoaded = false;

function directSlugifyKey(value) {
  return String(value || "")
    .split("(")[0]
    .trim()
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function directFieldLabel(field) {
  const wrapper = field.closest(".col-md-2, .col-md-3, .col-md-4, .col-md-6, .col-md-8, .col-md-10, .col-12, .mb-3, .mb-4");
  return wrapper?.querySelector("label")?.textContent || "";
}

function collectDirectEntryFields(form) {
  const fields = {};
  form.querySelectorAll("input, select, textarea").forEach((field, index) => {
    if (["submit", "button", "file"].includes(field.type)) return;
    if (["radio", "checkbox"].includes(field.type) && !field.checked) return;

    const baseKey = directSlugifyKey(field.name || field.id || directFieldLabel(field)) || `field_${index + 1}`;
    let key = baseKey;
    let suffix = 2;
    while (Object.prototype.hasOwnProperty.call(fields, key)) {
      key = `${baseKey}_${suffix}`;
      suffix += 1;
    }
    fields[key] = field.type === "checkbox" ? "Yes" : field.value;
  });
  return fields;
}

function validateDirectFile(file, allowedTypes, maxSize, message) {
  if (!file) return;
  if (!allowedTypes.includes(file.type)) throw new Error(message);
  if (file.size > maxSize) throw new Error(`File must be ${maxSize / 1024 / 1024}MB or smaller`);
}

function initializeDirectEntryInteractions(form) {
  form.querySelectorAll('[id="otherDetails"]').forEach((field) => {
    field.style.display = "none";
  });
  form.querySelectorAll('[id="otherOption"]').forEach((option) => {
    option.addEventListener("change", () => {
      const details = option.closest(".form-check")?.querySelector('[id="otherDetails"]');
      if (details) details.style.display = option.checked ? "block" : "none";
    });
  });

  const photoInput = form.querySelector("#photoUpload");
  photoInput?.removeAttribute("onchange");
  photoInput?.addEventListener("change", () => {
    const file = photoInput.files[0];
    const preview = form.querySelector("#photoPreview");
    if (preview) preview.innerHTML = "";
    try {
      validateDirectFile(file, ["image/jpeg", "image/png", "image/webp"], 2 * 1024 * 1024, "Patient photo must be JPG, PNG, or WEBP");
    } catch (error) {
      photoInput.value = "";
      showToast(error.message);
      return;
    }
    if (file && preview) {
      const image = document.createElement("img");
      image.src = URL.createObjectURL(file);
      image.alt = "Selected patient";
      image.onload = () => URL.revokeObjectURL(image.src);
      preview.appendChild(image);
    }
  });

  form.querySelector("#reportUpload")?.addEventListener("change", (event) => {
    const input = event.currentTarget;
    const file = input.files[0];
    try {
      const imageTypes = ["image/jpeg", "image/png", "image/webp"];
      const maxSize = file?.type === "application/pdf" ? 5 * 1024 * 1024 : 2 * 1024 * 1024;
      validateDirectFile(file, [...imageTypes, "application/pdf"], maxSize, "Genetic report must be PDF, JPG, PNG, or WEBP");
    } catch (error) {
      input.value = "";
      showToast(error.message);
    }
  });
}

async function loadDirectEntryFields() {
  if (directEntryLoaded) return;
  const host = document.getElementById("directRegistrationFields");
  const submitButton = document.getElementById("directRegistrationSubmit");
  try {
    const response = await fetch("./registration.html", { cache: "no-store" });
    if (!response.ok) throw new Error("Unable to load the registration form");
    const source = new DOMParser().parseFromString(await response.text(), "text/html");
    const sourceForm = source.getElementById("registrationForm");
    if (!sourceForm) throw new Error("Registration form was not found");
    sourceForm.querySelector("button[type='submit']")?.closest(".text-center")?.remove();
    host.innerHTML = sourceForm.innerHTML;
    host.querySelectorAll(".scroll-reveal").forEach((element) => element.classList.add("visible"));
    initializeDirectEntryInteractions(document.getElementById("directRegistrationForm"));
    directEntryLoaded = true;
    submitButton.disabled = false;
  } catch (error) {
    host.innerHTML = `<p class="text-danger mb-0">${escapeHtml(error.message)}</p>`;
    showToast(error.message);
  }
}

async function uploadDirectAttachment(file, attachmentType) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("attachment_type", attachmentType);
  return api("/api/admin/registration-attachments", { method: "POST", body: formData });
}

document.getElementById("directRegistrationForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  if (!directEntryLoaded || !form.checkValidity()) {
    form.reportValidity();
    return;
  }

  const submitButton = document.getElementById("directRegistrationSubmit");
  submitButton.disabled = true;
  submitButton.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Saving...';
  try {
    const fields = collectDirectEntryFields(form);
    const patientName = fields.patient_full_name || fields.full_name;
    const guardianPhone = fields.contact_no || fields.emergency_contact_no;
    const guardianEmail = fields.email_address || fields.email || null;
    if (!patientName) throw new Error("Patient full name is required");
    if (!/^\+?[0-9]{8,15}$/.test(String(guardianPhone || "").replace(/\s+/g, ""))) {
      throw new Error("A valid contact number is required");
    }

    const photo = form.querySelector("#photoUpload")?.files[0];
    const report = form.querySelector("#reportUpload")?.files[0];
    const [photoAttachment, reportAttachment] = await Promise.all([
      uploadDirectAttachment(photo, "photo"),
      uploadDirectAttachment(report, "genetic_report"),
    ]);
    fields.attachments = { photo: photoAttachment, genetic_report: reportAttachment };

    await api("/api/admin/registrations", {
      method: "POST",
      body: JSON.stringify({
        patient_name: patientName,
        guardian_phone: guardianPhone,
        guardian_email: guardianEmail,
        payload: fields,
      }),
    });
    form.reset();
    form.querySelector("#photoPreview").innerHTML = "";
    form.querySelectorAll('[id="otherDetails"]').forEach((field) => { field.style.display = "none"; });
    showToast("Registration saved");
    loadRequests();
    loadDashboard();
  } catch (error) {
    showToast(error.message);
  } finally {
    submitButton.disabled = false;
    submitButton.innerHTML = '<i class="bi bi-save"></i> Save Registration';
  }
});

function currentContentType() {
  return document.getElementById("contentType").value || "health_team";
}

function setContentType(type) {
  document.getElementById("contentType").value = type;
  const isHealthTeam = type === "health_team";
  const isPatientStory = type === "patient_story";
  const isGallery = type === "gallery";
  const isVideo = isGallery && galleryKind === "video";
  document.getElementById("healthTeamFields").classList.toggle("d-none", !isHealthTeam);
  document.getElementById("patientStoryFields").classList.toggle("d-none", !isPatientStory);
  document.getElementById("genericContentFields").classList.toggle("d-none", isHealthTeam || isPatientStory);
  document.getElementById("galleryTabs").classList.toggle("d-none", !isGallery);
  document.getElementById("patientStoryTabs").classList.toggle("d-none", !isPatientStory);
  document.getElementById("genericBodyField").classList.toggle("d-none", isGallery);
  document.getElementById("videoUrlField").classList.toggle("d-none", !isVideo);
  document.getElementById("contentImageFileField").classList.toggle("d-none", isVideo);
  document.getElementById("galleryPhotoTab").classList.toggle("active", galleryKind === "photo");
  document.getElementById("galleryVideoTab").classList.toggle("active", galleryKind === "video");
  document.getElementById("storyHomeTab").classList.toggle("active", patientStorySection === "home");
  document.getElementById("storyListTab").classList.toggle("active", patientStorySection === "list");
  document.getElementById("storyDetailTab").classList.toggle("active", patientStorySection === "detail");
  document.getElementById("storyHomeSection").classList.toggle("d-none", patientStorySection !== "home");
  document.getElementById("storyListSection").classList.toggle("d-none", patientStorySection !== "list");
  document.getElementById("storyDetailSection").classList.toggle("d-none", patientStorySection !== "detail");
  document.querySelector("#contentSection .section-card-title h3").textContent = isHealthTeam ? "Health Team" : isGallery ? "Gallery" : isPatientStory ? "Patient Stories" : "Website Content";
  document.querySelector("#contentSection .section-card-title span").textContent = isHealthTeam
    ? "Add or edit doctor profiles shown on the health team page."
    : isGallery
      ? `Maintain ${galleryKind} gallery records.`
      : "Manage the home card, story list card, and full patient story page.";
}

function splitHealthBody(body) {
  const lines = String(body || "").split("\n").filter(Boolean);
  return {
    qualifications: lines[0] || "",
    job_position: lines[1] || "",
    workplace: lines.slice(2).join(" ") || "",
  };
}

function fillHealthTeamFields(item = {}) {
  const fallback = splitHealthBody(item.body);
  document.getElementById("doctorName").value = item.title || "";
  document.getElementById("doctorSpecialty").value = item.summary || "";
  document.getElementById("doctorQualifications").value = item.extra?.qualifications || fallback.qualifications;
  document.getElementById("doctorJobPosition").value = item.extra?.job_position || fallback.job_position;
  document.getElementById("doctorWorkplace").value = item.extra?.workplace || fallback.workplace;
}

function fillGenericContentFields(item = {}) {
  document.getElementById("contentTitle").value = item.title || "";
  document.getElementById("contentSummary").value = item.summary || "";
  document.getElementById("contentBody").value = item.body || "";
  document.getElementById("contentVideoUrl").value = item.extra?.video_url || item.body || "";
}

function fillPatientStoryFields(item = {}) {
  const extra = item.extra || {};
  document.getElementById("storyName").value = item.title || "";
  document.getElementById("storyAuthor").value = extra.author || item.title || "";
  document.getElementById("storyHomeText").value = extra.home_text || "";
  document.getElementById("storyHomeLinkText").value = extra.home_link_text || "Click for more stories about me";
  document.getElementById("storyAge").value = extra.age || "";
  document.getElementById("storyDiagnosisYear").value = extra.diagnosis_year || "";
  document.getElementById("storyStatus").value = extra.status || item.summary || "";
  document.getElementById("storyDetailTitle").value = extra.detail_title || item.title || "";
  document.getElementById("storyVideoUrl").value = extra.detail_video_url || "";
  document.getElementById("storyDetailBody").value = extra.detail_body || item.body || "";
  document.getElementById("storyPhone").value = extra.phone || "";
  document.getElementById("storyWhatsapp").value = extra.whatsapp || "";
  document.getElementById("storyFacebook").value = extra.facebook || "";
}

function buildPatientStoryPayload() {
  const name = document.getElementById("storyName").value.trim();
  const status = document.getElementById("storyStatus").value.trim();
  const detailBody = document.getElementById("storyDetailBody").value.trim();
  const extra = {
    author: document.getElementById("storyAuthor").value.trim(),
    home_text: document.getElementById("storyHomeText").value.trim(),
    home_link_text: document.getElementById("storyHomeLinkText").value.trim(),
    age: document.getElementById("storyAge").value.trim(),
    diagnosis_year: document.getElementById("storyDiagnosisYear").value.trim(),
    status,
    detail_title: document.getElementById("storyDetailTitle").value.trim(),
    detail_video_url: document.getElementById("storyVideoUrl").value.trim(),
    detail_body: detailBody,
    phone: document.getElementById("storyPhone").value.trim(),
    whatsapp: document.getElementById("storyWhatsapp").value.trim(),
    facebook: document.getElementById("storyFacebook").value.trim(),
  };
  return {
    title: name,
    summary: status || null,
    body: detailBody || null,
    extra,
  };
}
function buildHealthTeamPayload() {
  const qualifications = document.getElementById("doctorQualifications").value.trim();
  const jobPosition = document.getElementById("doctorJobPosition").value.trim();
  const workplace = document.getElementById("doctorWorkplace").value.trim();
  return {
    title: document.getElementById("doctorName").value.trim(),
    summary: document.getElementById("doctorSpecialty").value.trim() || null,
    body: [qualifications, jobPosition, workplace].filter(Boolean).join("\n") || null,
    extra: { qualifications, job_position: jobPosition, workplace },
  };
}

function buildGenericContentPayload() {
  if (currentContentType() === "gallery") {
    const videoUrl = document.getElementById("contentVideoUrl").value.trim();
    const extra = galleryKind === "video"
      ? { media_type: "video", video_url: videoUrl }
      : { media_type: "photo" };
    return {
      title: document.getElementById("contentTitle").value.trim(),
      summary: document.getElementById("contentSummary").value || null,
      body: galleryKind === "video" ? videoUrl : null,
      extra,
    };
  }

  return {
    title: document.getElementById("contentTitle").value.trim(),
    summary: document.getElementById("contentSummary").value || null,
    body: document.getElementById("contentBody").value || null,
    extra: parseJsonField("contentExtra"),
  };
}

async function uploadContentImageIfSelected() {
  const input = document.getElementById("contentImageFile");
  const file = input.files[0];
  if (!file) return document.getElementById("contentImage").value || null;

  const formData = new FormData();
  formData.append("file", file);
  const uploaded = await api("/api/admin/uploads", { method: "POST", body: formData });
  document.getElementById("contentImage").value = uploaded.url;
  input.value = "";
  return uploaded.url;
}

function moveContentFormToModal() {
  document.getElementById("contentModalFormHost").appendChild(document.getElementById("contentForm"));
}

function moveContentFormInline() {
  const form = document.getElementById("contentForm");
  const inlineHost = document.getElementById("contentFormInlineHost");
  if (form.parentElement !== inlineHost) inlineHost.appendChild(form);
}

function openContentEditModal(item) {
  document.getElementById("contentId").value = item.id;
  if (item.type === "gallery") galleryKind = item.extra?.media_type || "photo";
  setContentType(item.type);
  if (item.type === "health_team") {
    fillHealthTeamFields(item);
  } else if (item.type === "patient_story") {
    fillPatientStoryFields(item);
  } else {
    fillGenericContentFields(item);
  }
  document.getElementById("contentImage").value = item.image_url || "";
  document.getElementById("contentImageFile").value = "";
  document.getElementById("contentPosition").value = item.position;
  document.getElementById("contentPublished").checked = item.is_published;
  document.getElementById("contentExtra").value = JSON.stringify(item.extra || {}, null, 2);
  document.querySelector("#contentModal .modal-title").textContent = `Edit ${item.type === "health_team" ? "Doctor" : item.type === "patient_story" ? "Patient Story" : "Content"}`;
  moveContentFormToModal();
  contentModal.show();
}
function resetContentForm(clearType = true) {
  const type = currentContentType();
  document.getElementById("contentForm").reset();
  document.getElementById("contentId").value = "";
  document.getElementById("contentExtra").value = "{}";
  document.getElementById("contentPosition").value = "0";
  document.getElementById('contentImageFile').value = '';
  document.getElementById("contentPublished").checked = true;
  fillHealthTeamFields();
  fillPatientStoryFields();
  fillGenericContentFields();
  setContentType(clearType ? "health_team" : type);
}

document.getElementById("exportPatientsBtn").addEventListener("click", exportPatientReport);
document.getElementById("resetContentBtn").addEventListener("click", () => resetContentForm(false));
document.querySelectorAll("#galleryTabs .content-tab").forEach((button) => {
  button.addEventListener("click", () => {
    galleryKind = button.dataset.galleryKind;
    resetContentForm(false);
    loadContent();
  });
});
document.querySelectorAll("#patientStoryTabs .content-tab").forEach((button) => {
  button.addEventListener("click", () => {
    patientStorySection = button.dataset.storySection;
    setContentType("patient_story");
  });
});
document.getElementById("contentModal").addEventListener("hidden.bs.modal", () => {
  moveContentFormInline();
  resetContentForm(false);
});


async function loadContent() {
  const type = document.getElementById("contentType").value;
  try {
    const allItems = await api(`/api/admin/content?type_filter=${encodeURIComponent(type)}`);
    contentItems = type === "gallery"
      ? allItems.filter((item) => (item.extra?.media_type || "photo") === galleryKind)
      : allItems;
    document.getElementById("contentRows").innerHTML = contentItems.map((item) => `
      <tr>
        <td>${escapeHtml(item.title)}</td>
        <td>${escapeHtml(item.type)}</td>
        <td>${item.is_published ? "Yes" : "No"}</td>
        <td class="text-end">
          <button class="btn btn-sm btn-outline-secondary" data-action="edit-content" data-id="${item.id}"><i class="bi bi-pencil"></i></button>
          <button class="btn btn-sm btn-outline-danger" data-action="delete-content" data-id="${item.id}"><i class="bi bi-trash"></i></button>
        </td>
      </tr>
    `).join("") || `<tr><td colspan="4" class="text-muted">No content found</td></tr>`;
  } catch (error) {
    showToast(error.message);
  }
}

document.getElementById("contentRows").addEventListener("click", async (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  const item = contentItems.find((content) => content.id === Number(button.dataset.id));
  if (!item) return;

  if (button.dataset.action === "edit-content") {
    openContentEditModal(item);
  }

  if (button.dataset.action === "delete-content") {
    try {
      await api(`/api/admin/content/${item.id}`, { method: "DELETE" });
      showToast("Content deleted");
      loadContent();
    } catch (error) {
      showToast(error.message);
    }
  }
});

document.getElementById("contentForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const id = document.getElementById("contentId").value;
  const type = currentContentType();
  const contentPayload = type === "health_team" ? buildHealthTeamPayload() : type === "patient_story" ? buildPatientStoryPayload() : buildGenericContentPayload();
  const payload = {
    type,
    ...contentPayload,
    image_url: await uploadContentImageIfSelected(),
    is_published: document.getElementById("contentPublished").checked,
  };
  if (!payload.title) {
    showToast(type === "health_team" ? "Doctor's name is required" : type === "patient_story" ? "Patient name is required" : "Title is required");
    return;
  }
  if (type === "gallery" && galleryKind === "video" && !payload.extra.video_url) {
    showToast("Video URL is required");
    return;
  }

  try {
    if (id) {
      const { type: _type, ...updates } = payload;
      updates.position = Number(document.getElementById("contentPosition").value || 0);
      await api(`/api/admin/content/${id}`, { method: "PATCH", body: JSON.stringify(updates) });
    } else {
      await api("/api/admin/content", { method: "POST", body: JSON.stringify(payload) });
    }
    if (id) contentModal.hide();
    resetContentForm(false);
    showToast(type === "health_team" ? "Doctor profile saved" : type === "patient_story" ? "Patient story saved" : "Content saved");
    loadContent();
  } catch (error) {
    showToast(error.message);
  }
});

async function loadUsers() {
  try {
    const users = await api("/api/admin/users");
    document.getElementById("userRows").innerHTML = users.map((user) => `
      <tr>
        <td>${escapeHtml(user.name)}</td>
        <td>${escapeHtml(user.email)}</td>
        <td>${escapeHtml(user.role)}</td>
        <td>${user.is_active ? "Yes" : "No"}</td>
      </tr>
    `).join("");
  } catch (error) {
    showToast(error.message);
  }
}

document.getElementById("userForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  try {
    await api("/api/admin/users", {
      method: "POST",
      body: JSON.stringify(Object.fromEntries(form.entries())),
    });
    event.currentTarget.reset();
    showToast("User added");
    loadUsers();
  } catch (error) {
    showToast(error.message);
  }
});

async function loadSmsLogs() {
  try {
    const logs = await api("/api/admin/sms-logs");
    document.getElementById("smsRows").innerHTML = logs.map((log) => `
      <tr>
        <td>${log.id}</td>
        <td>${log.registration_id || ""}</td>
        <td>${escapeHtml(log.recipient_phone)}</td>
        <td>${escapeHtml(log.status)}</td>
        <td>${escapeHtml(log.message)}</td>
        <td>${formatDate(log.created_at)}</td>
      </tr>
    `).join("") || `<tr><td colspan="6" class="text-muted">No SMS logs found</td></tr>`;
  } catch (error) {
    showToast(error.message);
  }
}

async function loadSmsPatients() {
  try {
    const patients = await api("/api/admin/registrations?status_filter=accepted");
    const select = document.getElementById("adminSmsPatient");
    select.innerHTML = `<option value="">Select a patient</option>${patients.map((patient) =>
      `<option value="${patient.id}">${escapeHtml(patient.patient_name)} — ${escapeHtml(patient.guardian_phone)}</option>`
    ).join("")}`;
  } catch (error) {
    showToast(error.message, "error");
  }
}

function loadSmsManagement() {
  loadSmsPatients();
  loadSmsLogs();
}

function setAdminSmsRecipientType() {
  const isGuardian = document.getElementById("adminSmsRecipientType").value === "guardian";
  document.getElementById("adminSmsPatientField").classList.toggle("d-none", !isGuardian);
  document.getElementById("adminSmsCustomField").classList.toggle("d-none", isGuardian);
  document.getElementById("adminSmsPatient").required = isGuardian;
  document.getElementById("adminSmsPhones").required = !isGuardian;
}

document.getElementById("adminSmsRecipientType").addEventListener("change", setAdminSmsRecipientType);
document.getElementById("adminSmsMessage").addEventListener("input", (event) => {
  document.getElementById("adminSmsCharacterCount").textContent = event.currentTarget.value.length;
});

document.getElementById("adminSmsForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const sendButton = document.getElementById("adminSmsSendBtn");
  const recipientType = document.getElementById("adminSmsRecipientType").value;
  sendButton.disabled = true;
  try {
    const result = await api("/api/admin/sms/send", {
      method: "POST",
      body: JSON.stringify({
        recipient_type: recipientType,
        registration_id: recipientType === "guardian" ? Number(document.getElementById("adminSmsPatient").value) : null,
        recipient_phones: recipientType === "custom" ? document.getElementById("adminSmsPhones").value : null,
        message: document.getElementById("adminSmsMessage").value,
      }),
    });
    const denied = result.failed + result.skipped;
    if (!denied) {
      showToast(`SMS sent successfully to ${result.sent} recipient(s)`, "success");
      event.currentTarget.reset();
      setAdminSmsRecipientType();
      document.getElementById("adminSmsCharacterCount").textContent = "0";
    } else if (!result.sent) {
      const reason = String(result.logs[0]?.response || "Gateway denied the request").slice(0, 180);
      showToast(`SMS denied for ${denied} recipient(s): ${reason}`, "error");
    } else {
      showToast(`${result.sent} SMS sent; ${denied} denied`, "error");
    }
    loadSmsLogs();
  } catch (error) {
    showToast(`SMS denied: ${error.message}`, "error");
  } finally {
    sendButton.disabled = false;
  }
});

document.getElementById("smsIpForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const updateButton = document.getElementById("smsIpUpdateBtn");
  updateButton.disabled = true;
  try {
    const result = await api("/api/admin/sms/ip-update", {
      method: "POST",
      body: JSON.stringify({ ip_address: document.getElementById("smsIpAddress").value }),
    });
    showToast(`SMS gateway IP updated successfully: ${result.ip_address}`, "success");
  } catch (error) {
    showToast(error.message, "error");
  } finally {
    updateButton.disabled = false;
  }
});

bootstrapSession();






