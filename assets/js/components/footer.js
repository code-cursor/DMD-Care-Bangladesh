$('.footer-link').on('click', function(e) {
  const target = $(this).attr('href');

  // If link starts with "#" (same-page link), do smooth scroll
  if (target.startsWith("#")) {
    e.preventDefault();
    $('html, body').animate({
      scrollTop: $(target).offset().top
    }, 1000);
  }
  // Otherwise (normal link like contact.html), let it work normally
});

  // Social Media Icon Animation: Hover Effect
  $('.social-icon').hover(
    function() {
      $(this).animate({ 
        opacity: 0.7, 
        transform: 'scale(1.3)' 
      }, 300);
    },
    function() {
      $(this).animate({ 
        opacity: 1, 
        transform: 'scale(1)' 
      }, 300);
    }
  );

  // Fade In Footer on Page Load
  $('footer').css('opacity', 0); // Start with hidden footer
  $('footer').animate({ opacity: 1 }, 1000); // Fade it in when page loads

  // Show button when user scrolls down 100px
  window.onscroll = function() {
    const btn = document.getElementById("topUpBtn");
    if (document.body.scrollTop > 100 || document.documentElement.scrollTop > 100) {
      btn.style.display = "block";
    } else {
      btn.style.display = "none";
    }
  };

  // Scroll smoothly to top when button clicked
  document.getElementById("topUpBtn").addEventListener("click", function() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  // social sidebar
  $(document).ready(function(){
    $('.social-sidebar').css({opacity: 0, left: '-60px'});
    $('.social-sidebar').animate({opacity: 1, left: '0'}, 800);
  });
