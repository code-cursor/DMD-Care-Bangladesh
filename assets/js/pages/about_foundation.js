// Tabs functionality
const tabs = document.querySelectorAll(".tab");
const tabContents = document.querySelectorAll(".tab-content");

// Scroll reveal animation
window.addEventListener("scroll", () => {
  document.querySelectorAll(".scroll-reveal").forEach((el) => {
    const rect = el.getBoundingClientRect().top;
    if (rect < window.innerHeight - 100) {
      el.classList.add("visible");
    }
  });
});

tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    // Remove active from all tabs
    tabs.forEach((t) => {
      t.classList.remove("active");
      t.setAttribute("aria-selected", "false");
    });
    // Hide all tab contents
    tabContents.forEach((tc) => (tc.hidden = true));

    // Activate clicked tab
    tab.classList.add("active");
    tab.setAttribute("aria-selected", "true");
    // Show corresponding tab content
    const target = tab.getAttribute("aria-controls");
    const content = document.getElementById(target);
    if (content) content.hidden = false;
  });
});

// Count-up animation for stats
function animateCounters() {
  const counters = document.querySelectorAll(".stat-number");
  counters.forEach((counter) => {
    const updateCount = () => {
      const target = +counter.getAttribute("data-target");
      const count = +counter.innerText;
      const increment = target / 200; // Adjust speed here

      if (count < target) {
        counter.innerText = Math.ceil(count + increment);
        requestAnimationFrame(updateCount);
      } else {
        counter.innerText = target;
      }
    };
    updateCount();
  });
}

// Trigger animation when stats section is in viewport
function isInViewport(element) {
  const rect = element.getBoundingClientRect();
  return rect.top < window.innerHeight && rect.bottom >= 0;
}

const statsSection = document.querySelector(".stats-section");
let statsAnimated = false;

window.addEventListener("scroll", () => {
  if (!statsAnimated && isInViewport(statsSection)) {
    animateCounters();
    statsAnimated = true;
  }
});
