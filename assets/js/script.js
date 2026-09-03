const frontendCacheVersion = "20260902-frontend-1";

function initCopyRestriction() {
    if (document.documentElement.dataset.copyRestrictionBound === "true") return;
    document.documentElement.dataset.copyRestrictionBound = "true";
    document.body?.classList.add("copy-restricted");

    const isEditableTarget = (target) => Boolean(target?.closest?.("input, textarea, select, [contenteditable='true']"));
    const block = (event) => {
        if (!isEditableTarget(event.target)) event.preventDefault();
    };

    ["copy", "cut", "contextmenu", "selectstart", "dragstart"].forEach((eventName) => {
        document.addEventListener(eventName, block, true);
    });
}

function setFrontendCookie(name, value, days = 365) {
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

function getFrontendCookie(name) {
    const encodedName = `${encodeURIComponent(name)}=`;
    return document.cookie
        .split(";")
        .map((item) => item.trim())
        .find((item) => item.startsWith(encodedName))
        ?.slice(encodedName.length) || "";
}

function ensureFrontendVisitorCookie() {
    if (getFrontendCookie("dmd_visitor_id")) return;
    const randomPart = window.crypto?.randomUUID ? window.crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    setFrontendCookie("dmd_visitor_id", randomPart);
}

function trackFrontendVisit() {
    const visitorKey = getFrontendCookie("dmd_visitor_id");
    if (!visitorKey) return;

    const payload = JSON.stringify({
        visitor_key: visitorKey,
        path: `${window.location.pathname}${window.location.search}`,
    });

    if (navigator.sendBeacon) {
        const blob = new Blob([payload], { type: "application/json" });
        if (navigator.sendBeacon("/api/visits", blob)) return;
    }

    fetch("/api/visits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload,
        keepalive: true,
    }).catch(() => {});
}

function ensureStylesheet(href) {
    if (document.querySelector(`link[href="${href}"]`)) return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    document.head.appendChild(link);
}

function ensureScript(src, callback) {
    const scriptPath = src.replace(/^\.\//, "").split("?")[0];
    const existing = Array.from(document.querySelectorAll("script[src]")).find((script) => {
        const currentSrc = (script.getAttribute("src") || "").replace(/^\.\//, "");
        return currentSrc.includes(scriptPath) && !script.closest("#header-container, #footer-container, #banner-container");
    });
    if (existing) {
        if (callback) {
            if (existing.dataset.loaded === "true") callback();
            else existing.addEventListener("load", callback, { once: true });
        }
        return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.onload = () => {
        script.dataset.loaded = "true";
        callback?.();
    };
    document.body.appendChild(script);
}
function ensureHeaderStylesheet() {
    ensureStylesheet("./assets/css/components/header.css?v=20260902-2");
}

function ensureIconStylesheet() {
    ensureStylesheet("https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css");
}

function ensureHeaderScript(callback) {
    if (window.initSiteHeader) {
        callback();
        return;
    }

    ensureScript("./assets/js/components/header.js?v=20260831-1", function () {
        if (window.initSiteHeader) callback();
    });
}

function initLoadedHeader(container) {
    ensureHeaderScript(function () {
        if (window.initSiteHeader) {
            window.initSiteHeader(container);
        }
    });
}

function extractHtmlPart(html, selector) {
    if (!selector) return html;
    const parsed = new DOMParser().parseFromString(html, "text/html");
    const nodes = parsed.querySelectorAll(selector);
    return Array.from(nodes).map((node) => {
        const clone = node.cloneNode(true);
        if (clone.matches?.("script")) return "";
        clone.querySelectorAll?.("script").forEach((script) => script.remove());
        return clone.outerHTML;
    }).join("");
}

function loadCachedFragment(containerId, url, selector, afterLoad) {
    const container = document.getElementById(containerId);
    if (!container) {
        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", () => loadCachedFragment(containerId, url, selector, afterLoad), { once: true });
        } else {
            setTimeout(() => loadCachedFragment(containerId, url, selector, afterLoad), 0);
        }
        return;
    }

    const cacheKey = `dmd_fragment_${containerId}`;
    const versionCookie = `dmd_${containerId}_version`;
    const cookieVersion = getFrontendCookie(versionCookie);
    const cached = cookieVersion === frontendCacheVersion ? localStorage.getItem(cacheKey) : "";

    if (cached) {
        container.innerHTML = cached;
        afterLoad?.(container);
    }

    fetch(url, { cache: "no-cache" })
        .then((response) => response.ok ? response.text() : Promise.reject(new Error(`Unable to load ${url}`)))
        .then((html) => {
            const fragment = extractHtmlPart(html, selector);
            if (!fragment || fragment === cached) return;
            container.innerHTML = fragment;
            localStorage.setItem(cacheKey, fragment);
            setFrontendCookie(versionCookie, frontendCacheVersion);
            afterLoad?.(container);
        })
        .catch(() => {
            if (!cached && window.jQuery) {
                const target = selector ? `${url} ${selector}` : url;
                $(`#${containerId}`).load(target, function () { afterLoad?.(this); });
            }
        });
}

function initLoadedFooter() {
    ensureStylesheet("./assets/css/components/footer.css");
    ensureScript("./assets/js/components/footer.js?v=20260824-1");
}

function initLoadedBanner() {
    ensureStylesheet("./assets/css/components/banner.css?v=20260902-1");
    ensureScript("./assets/js/components/banner.js?v=20260827-1");
}

function initSharedFragments() {
    initCopyRestriction();
    ensureFrontendVisitorCookie();
    trackFrontendVisit();
    ensureIconStylesheet();
    ensureHeaderStylesheet();
    loadCachedFragment("header-container", "header", "header", initLoadedHeader);
    loadCachedFragment("footer-container", "footer", "#topUpBtn, .social-sidebar, footer.footer", initLoadedFooter);
    loadCachedFragment("banner-container", "banner.html", ".hero-section", initLoadedBanner);
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initSharedFragments, { once: true });
} else {
    initSharedFragments();
}

$(document).ready(function() {

    // Scroll reveal animation
    function revealScrollItems() {
        document.querySelectorAll(".scroll-reveal").forEach((el) => {
            const rect = el.getBoundingClientRect().top;
            if (rect < window.innerHeight - 100) {
                el.classList.add("visible");
            }
        });
    }
    window.addEventListener("scroll", revealScrollItems);
    revealScrollItems();

    // Initialize Swiper after DOM is ready
    if (typeof Swiper !== "undefined" && document.querySelector('.partners-swiper')) {
        const swiper = new Swiper('.partners-swiper', {
            slidesPerView: 4, // default for large screens
            spaceBetween: 30,
            loop: true,
            autoplay: {
                delay: 2000,
                disableOnInteraction: false,
            },
            breakpoints: {
                992: { slidesPerView: 4, spaceBetween: 30 }, // desktop
                768: { slidesPerView: 3, spaceBetween: 20 }, // tablet landscape
                576: { slidesPerView: 2, spaceBetween: 15 }, // tablet portrait
                0: { slidesPerView: 2, spaceBetween: 10 },   // mobile
            },
        });
    }


    // Animate on scroll
    function animateOnScroll() {
        const elements = document.querySelectorAll('.animate-on-scroll');
        const windowHeight = window.innerHeight;

        elements.forEach(el => {
            const rect = el.getBoundingClientRect();
            if (rect.top <= windowHeight - 50) {
                el.classList.add('active');
            }
        });
    }

    window.addEventListener('scroll', animateOnScroll);
    animateOnScroll(); // initial run
});

// Run on page load and scroll
if (typeof revealStatsBox === "function") {
  revealStatsBox();
  $(window).on('scroll', revealStatsBox);
}

// Patient story- Auto-slide with fade effect and pause on hover
if ($.fn.carousel) {
    $('#patientStoriesCarousel').carousel({
      interval: 5000,
      pause: "hover"
    });
}


