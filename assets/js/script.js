function ensureHeaderStylesheet() {
    const href = "./assets/css/components/header.css";
    if (document.querySelector(`link[href="${href}"]`)) return;

    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    document.head.appendChild(link);
}

function ensureHeaderScript(callback) {
    if (window.initSiteHeader) {
        callback();
        return;
    }

    const headerScript = document.querySelector('script[src*="assets/js/components/header.js"]');
    if (headerScript) {
        headerScript.addEventListener("load", callback, { once: true });
        return;
    }

    const script = document.createElement("script");
    script.src = "./assets/js/components/header.js?v=20260823-2";
    script.onload = callback;
    document.body.appendChild(script);
}

function initLoadedHeader(container) {
    ensureHeaderScript(function () {
        if (window.initSiteHeader) {
            window.initSiteHeader(container);
        }
    });
}

$(document).ready(function() {
    // Load header, footer, banner
    ensureHeaderStylesheet();
    $("#header-container").load("header header", function () {
        initLoadedHeader(this);
    });
    $("#footer-container").load("footer");
    $("#banner-container").load("banner");

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
