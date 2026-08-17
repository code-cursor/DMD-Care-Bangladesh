$(document).ready(function() {
  // Wait for both hero content and image animation to finish
  function startStatsAnimation() {
    setTimeout(function() {
      $('.stats-box').addClass('animated');
    }, 500); // .5s delay (depends on animate__fadeInLeft & Right duration)
  }

  // Trigger when visible in viewport
  function revealStatsBox() {
    $('.stats-box').each(function() {
      var elementTop = $(this).offset().top;
      var windowBottom = $(window).scrollTop() + $(window).height();

      if (windowBottom > elementTop + 50 && !$(this).hasClass('animated')) {
        startStatsAnimation();
      }
    });
  }


// Count-up animation when element is visible
function animateCountUp(el) {
  const target = +el.getAttribute('data-target');
  const suffix = el.getAttribute('data-suffix') || '';
  const duration = 1500; // total duration in ms
  const stepTime = Math.max(Math.floor(duration / target), 10);
  let count = 0;

  const timer = setInterval(() => {
    count += 1;
    el.textContent = count + suffix;
    if (count >= target) {
      clearInterval(timer);
      el.textContent = target + suffix;
    }
  }, stepTime);
}

// Intersection Observer to detect visibility
const counters = document.querySelectorAll('.count');
const options = { threshold: 0.5 };

const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      // Add delay (e.g., 1000ms = 1 second)
      setTimeout(() => {
        animateCountUp(entry.target);
      }, 500); // ← Change this number to adjust delay (in ms)
      
      observer.unobserve(entry.target); // Run once
    }
  });
}, options);

counters.forEach(counter => observer.observe(counter));

  // Run on page load and scroll
  revealStatsBox();
  $(window).on('scroll', revealStatsBox);
});
