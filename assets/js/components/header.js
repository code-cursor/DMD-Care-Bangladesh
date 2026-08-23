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
    scope.querySelectorAll(".navbar-nav .dropdown").forEach((dropdown) => {
      if (dropdown.dataset.headerHoverBound === "true") return;
      dropdown.dataset.headerHoverBound = "true";
      const toggle = dropdown.querySelector(".dropdown-toggle");
      if (!toggle) return;

      dropdown.addEventListener("mouseenter", () => {
        if (window.innerWidth >= 992) {
          closeHeaderDropdowns(toggle);
          setDropdownState(toggle, true);
        }
      });

      dropdown.addEventListener("mouseleave", () => {
        if (window.innerWidth >= 992) {
          setDropdownState(toggle, false);
        }
      });

      toggle.addEventListener("focus", () => {
        if (window.innerWidth >= 992) {
          closeHeaderDropdowns(toggle);
          setDropdownState(toggle, true);
        }
      });
    });

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
      const toggle = event.target.closest("#header-container .dropdown-toggle");
      if (toggle) {
        event.preventDefault();
        event.stopPropagation();
        const open = toggle.getAttribute("aria-expanded") !== "true";
        closeHeaderDropdowns(toggle);
        setDropdownState(toggle, open);
        return;
      }

      if (!event.target.closest("#header-container .dropdown")) closeHeaderDropdowns();
    }, true);
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
    const normalizePath = (value) => {
      const rawValue = String(value || "").trim();
      if (!rawValue || rawValue === "#") return null;
      const normalized = rawValue
        .split("#")[0]
        .split("?")[0]
        .replace(/^\.?\//, "")
        .replace(/\.(html|php)$/i, "")
        .replace(/^index$/, "");
      return normalized;
    };
    const currentPage = normalizePath(window.location.pathname.split("/").pop());
    scope.querySelectorAll(".navbar-nav a[href]").forEach((link) => {
      const linkPage = normalizePath(link.getAttribute("href"));
      if (linkPage !== null && linkPage === currentPage) {
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
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => initSiteHeader());
  } else {
    initSiteHeader();
  }
})();

function initWhatsAppWidget() {
  if (document.getElementById("wa-chat-widget")) return;

  const phoneNumber = "8801914191919";
  const style = document.createElement("style");
  style.textContent = `
    #wa-chat-widget {
      position: fixed;
      bottom: 140px;
      right: 20px;
      z-index: 1050;
      font-family: 'Poppins', sans-serif;
    }
    .wa-toggle-btn {
      width: 50px;
      height: 50px;
      background-color: #25D366;
      color: #fff;
      border: 0;
      font-size: 28px;
      cursor: pointer;
      transition: transform 0.3s ease, box-shadow 0.3s ease;
    }
    .wa-toggle-btn:hover {
      transform: scale(1.1);
      box-shadow: 0 6px 20px rgba(37, 211, 102, 0.6) !important;
    }
    #wa-chat-box {
      width: min(320px, calc(100vw - 40px));
      position: absolute;
      bottom: 75px;
      right: 0;
      display: none;
      opacity: 0;
      transform: translateY(20px);
      transition: opacity 0.3s ease, transform 0.3s ease;
    }
    #wa-chat-box.show-chat {
      display: flex;
      opacity: 1;
      transform: translateY(0);
    }
    .wa-chat-body {
      min-height: 180px;
      background-color: #e5ddd5;
      background-image: url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png');
    }
    .wa-message-bubble {
      max-width: 85%;
      background-color: #fff;
      color: #333;
      padding: 12px 15px;
      border-radius: 0 15px 15px 15px;
      font-size: 0.9rem;
      line-height: 1.5;
      box-shadow: 0 1px 2px rgba(6, 155, 63, 0.1);
    }
    .wa-input-control:focus {
      box-shadow: none;
      border-color: #009966;
    }
  `;
  document.head.appendChild(style);

  const widget = document.createElement("div");
  widget.id = "wa-chat-widget";
  widget.innerHTML = `
    <div id="wa-chat-box" class="card shadow-lg border-0 rounded-4 flex-column">
      <div class="card-header d-flex justify-content-between align-items-center p-3 border-0 rounded-top-4" style="background-color: #009966;">
        <div class="d-flex align-items-center text-white">
          <i class="fa-brands fa-whatsapp fs-3 me-2"></i>
          <div>
            <h6 class="mb-0 fw-bold">DMD Care Foundation</h6>
            <small style="font-size: 0.75rem; opacity: 0.85;">Usually replies within a few minutes</small>
          </div>
        </div>
        <button id="wa-chat-close" class="btn-close btn-close-white shadow-none" aria-label="Close"></button>
      </div>
      <div class="card-body wa-chat-body p-3">
        <div class="wa-message-bubble mb-2">Hello! How can we help you?</div>
      </div>
      <div class="card-footer bg-white p-3 border-0 rounded-bottom-4">
        <div class="input-group">
          <input type="text" id="wa-message-input" class="form-control wa-input-control rounded-pill rounded-end-0 border-end-0 bg-light" placeholder="Write your message..." aria-label="Message">
          <button class="btn rounded-pill rounded-start-0 text-white px-3" id="wa-send-btn" style="background-color: #009966; border-color: #f8f9fa;">
            <i class="fa-solid fa-paper-plane"></i>
          </button>
        </div>
      </div>
    </div>
    <button id="wa-toggle-btn" class="wa-toggle-btn rounded-circle shadow-lg float-end d-flex align-items-center justify-content-center" aria-label="Open WhatsApp chat">
      <i class="fa-brands fa-whatsapp"></i>
    </button>
  `;
  document.body.appendChild(widget);

  const toggleBtn = document.getElementById("wa-toggle-btn");
  const chatBox = document.getElementById("wa-chat-box");
  const closeBtn = document.getElementById("wa-chat-close");
  const sendBtn = document.getElementById("wa-send-btn");
  const messageInput = document.getElementById("wa-message-input");

  function closeChat() {
    chatBox.classList.remove("show-chat");
    setTimeout(() => {
      chatBox.style.display = "none";
    }, 300);
  }

  function sendWhatsAppMessage() {
    const fallback = "Hello DMD Care Foundation, I want to know more about your services.";
    const message = messageInput.value.trim() || fallback;
    const whatsappUrl = `https://api.whatsapp.com/send?phone=${phoneNumber}&text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
    messageInput.value = "";
    closeChat();
  }

  toggleBtn.addEventListener("click", () => {
    if (chatBox.classList.contains("show-chat")) {
      closeChat();
      return;
    }
    chatBox.style.display = "flex";
    setTimeout(() => chatBox.classList.add("show-chat"), 10);
    messageInput.focus();
  });
  closeBtn.addEventListener("click", closeChat);
  sendBtn.addEventListener("click", sendWhatsAppMessage);
  messageInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      sendWhatsAppMessage();
    }
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initWhatsAppWidget);
} else {
  initWhatsAppWidget();
}
function googleTranslateElementInit() {
  if (window.google?.translate) {
    new google.translate.TranslateElement({ pageLanguage: "en", autoDisplay: false }, "google_translate_element");
  }
}
