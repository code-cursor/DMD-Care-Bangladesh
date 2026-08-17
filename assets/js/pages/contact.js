$(document).ready(function() {
    // Scroll reveal animation
    window.addEventListener("scroll", () => {
    document.querySelectorAll(".scroll-reveal").forEach((el) => {
        const rect = el.getBoundingClientRect().top;
        if (rect < window.innerHeight - 100) {
        el.classList.add("visible");
        }
    });
    });

    // Fade in header on page load
    $('header').css('opacity', 0).animate({ opacity: 1 }, 1000);

    // Function to detect if element is in viewport
    function isInViewport(element) {
        const rect = element.getBoundingClientRect();
        return (
            rect.top <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.bottom >= 0
        );
    }

    // Animate elements when they come into view
    function animateOnScroll() {
        const animElements = document.querySelectorAll('.animate-on-scroll');
        animElements.forEach(el => {
            if (isInViewport(el) && !el.classList.contains('animate__animated')) {
                el.classList.add('animate__animated', 'animate__fadeInUp');
            }
        });
    }

    // Trigger animation on scroll and on page load
    $(window).on('scroll load', animateOnScroll);

    // Initial trigger in case elements are already in viewport
    animateOnScroll();
});
