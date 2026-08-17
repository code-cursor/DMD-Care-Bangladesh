$(document).ready(function() {
    // Load header, footer, banner
    $("#header-container").load("header.html");
    $("#footer-container").load("footer.html");
    $("#banner-container").load("banner.html");

    // Scroll reveal animation
    window.addEventListener("scroll", () => {
    document.querySelectorAll(".scroll-reveal").forEach((el) => {
        const rect = el.getBoundingClientRect().top;
        if (rect < window.innerHeight - 100) {
        el.classList.add("visible");
        }
    });
    });

    // Initialize Swiper after DOM is ready
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
  revealStatsBox();
  $(window).on('scroll', revealStatsBox);

// Patient story- Auto-slide with fade effect and pause on hover
    $('#patientStoriesCarousel').carousel({
      interval: 5000,
      pause: "hover"
    });