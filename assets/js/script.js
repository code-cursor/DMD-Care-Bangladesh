function trackVisitor() {
  const configuredBase = window.DMD_API_BASE_URL?.replace(/\/$/, "");
  const apiBases = [
    configuredBase,
    location.protocol.startsWith("http") ? location.origin.replace(/\/$/, "") : null,
    "http://127.0.0.1:8002",
  ].filter((value, index, values) => value && values.indexOf(value) === index);

  let visitorKey = localStorage.getItem("dmd_visitor_key");
  if (!visitorKey) {
    visitorKey = window.crypto?.randomUUID ? window.crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    localStorage.setItem("dmd_visitor_key", visitorKey);
  }

  const sessionKey = `dmd_visit_tracked_${new Date().toISOString().slice(0, 10)}`;
  if (sessionStorage.getItem(sessionKey)) return;

  const payload = JSON.stringify({ visitor_key: visitorKey, path: `${location.pathname}${location.search}` });
  const send = async () => {
    for (const base of apiBases) {
      try {
        const response = await fetch(`${base}/api/visits`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: payload,
        });
        if (response.ok) {
          sessionStorage.setItem(sessionKey, "1");
          return;
        }
      } catch {}
    }
  };

  send();
}
function ensureHeaderStylesheet() {
  const href = "./assets/css/components/header.css";
  if (document.querySelector(`link[href="${href}"]`)) return;

  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = href;
  document.head.appendChild(link);
}

function ensureHeaderScript() {
  const src = "./assets/js/components/header.js";
  if (typeof window.initSiteHeader === "function") return Promise.resolve();

  const existingScript = document.querySelector(`script[src="${src}"]`);
  if (existingScript) {
    return new Promise((resolve) => {
      existingScript.addEventListener("load", resolve, { once: true });
      existingScript.addEventListener("error", resolve, { once: true });
      if (typeof window.initSiteHeader === "function") resolve();
    });
  }

  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = src;
    script.onload = resolve;
    script.onerror = resolve;
    document.body.appendChild(script);
  });
}

function ensureBootstrapScript() {
  if (window.bootstrap?.Dropdown) return Promise.resolve();

  const existingScript = document.querySelector('script[src*="bootstrap"][src*="bundle"]');
  if (existingScript) {
    return new Promise((resolve) => {
      const fallbackTimer = setTimeout(resolve, 1500);
      const finish = () => {
        clearTimeout(fallbackTimer);
        resolve();
      };
      existingScript.addEventListener("load", finish, { once: true });
      existingScript.addEventListener("error", finish, { once: true });
      if (window.bootstrap?.Dropdown) finish();
    });
  }

  return new Promise((resolve) => {
    const fallbackTimer = setTimeout(resolve, 3000);
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js";
    script.onload = () => {
      clearTimeout(fallbackTimer);
      resolve();
    };
    script.onerror = () => {
      clearTimeout(fallbackTimer);
      resolve();
    };
    document.body.appendChild(script);
  });
}

function ensureGoogleTranslateScript() {
  const src = "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
  if (document.querySelector(`script[src="${src}"]`)) return;

  const script = document.createElement("script");
  script.src = src;
  document.body.appendChild(script);
}

function initLoadedHeader() {
  if (typeof window.initSiteHeader === "function") {
    window.initSiteHeader(document.getElementById("header-container"));
  }

  if (window.bootstrap) {
    document.querySelectorAll("#header-container [data-bs-toggle='dropdown']").forEach((toggle) => {
      bootstrap.Dropdown.getOrCreateInstance(toggle);
    });
  }
}

$(document).ready(function () {
  trackVisitor();
  ensureHeaderStylesheet();
  $("#header-container").load("header.html header", function () {
    Promise.all([ensureHeaderScript(), ensureBootstrapScript()]).then(function () {
      initLoadedHeader();
      ensureGoogleTranslateScript();
    });
  });
  $("#footer-container").load("footer.html");
  $("#banner-container").load("banner.html");

  function revealScrollItems() {
    document.querySelectorAll(".scroll-reveal").forEach((el) => {
      if (el.getBoundingClientRect().top < window.innerHeight - 100) {
        el.classList.add("visible");
      }
    });
  }

  function animateOnScroll() {
    document.querySelectorAll(".animate-on-scroll").forEach((el) => {
      if (el.getBoundingClientRect().top <= window.innerHeight - 50) {
        el.classList.add("active");
      }
    });
  }

  revealScrollItems();
  animateOnScroll();
  window.addEventListener("scroll", revealScrollItems);
  window.addEventListener("scroll", animateOnScroll);

  if (typeof Swiper !== "undefined" && document.querySelector(".partners-swiper")) {
    new Swiper(".partners-swiper", {
      slidesPerView: 4,
      spaceBetween: 30,
      loop: true,
      autoplay: {
        delay: 2000,
        disableOnInteraction: false,
      },
      breakpoints: {
        992: { slidesPerView: 4, spaceBetween: 30 },
        768: { slidesPerView: 3, spaceBetween: 20 },
        576: { slidesPerView: 2, spaceBetween: 15 },
        0: { slidesPerView: 2, spaceBetween: 10 },
      },
    });
  }


});
