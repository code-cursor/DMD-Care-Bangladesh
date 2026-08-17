  // Fade-up animation when scrolling
  $(window).on("scroll", function() {
    $(".gallery-item scroll-reveal").each(function() {
      const position = $(this).offset().top;
      const scroll = $(window).scrollTop();
      const windowHeight = $(window).height();
      if (scroll + windowHeight > position + 100) {
        $(this).addClass("show");
      }
    });
  });

  // Scroll reveal animation
    window.addEventListener("scroll", () => {
    document.querySelectorAll(".scroll-reveal").forEach((el) => {
        const rect = el.getBoundingClientRect().top;
        if (rect < window.innerHeight - 100) {
        el.classList.add("visible");
        }
    });
    });