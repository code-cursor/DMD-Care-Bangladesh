// Scroll reveal animation
window.addEventListener("scroll", () => {
  document.querySelectorAll(".scroll-reveal").forEach((el) => {
    const rect = el.getBoundingClientRect().top;
    if (rect < window.innerHeight - 100) {
      el.classList.add("visible");
    }
  });
});

// Show/hide "Other" details input
$(document).ready(function () {
  $("#otherDetails").hide();
  $("#otherOption").on("change", function () {
    if ($(this).is(":checked")) {
      $("#otherDetails").slideDown(300);
    } else {
      $("#otherDetails").slideUp(300);
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

// Show/hide "Other" input field
$(document).ready(function () {
  $("#otherDetails").hide();
  $("#otherOption").on("change", function () {
    if ($(this).is(":checked")) {
      $("#otherDetails").slideDown(300);
    } else {
      $("#otherDetails").slideUp(300);
    }
  });

  // ✅ Confirmation Modal on Form Submit
  $("#registrationForm").on("submit", function (e) {
    e.preventDefault(); // prevent page reload

    // Simulate form submission delay (optional)
    setTimeout(() => {
      const modal = new bootstrap.Modal(document.getElementById("confirmationModal"));
      modal.show();

      // Reset form after showing modal
      this.reset();
      $("#otherDetails").hide();
    }, 400);
  });
});

// -------------------- 
// photo upload validation & check
// ----------------------------------

function validateImage() {
    const fileInput = document.getElementById('photoUpload');
    const file = fileInput.files[0];

    // Check file size (max 2MB)
    if (file.size > 2 * 512 * 512) {  // 2MB in bytes
      alert('File is too large. Maximum size is 1MB.');
      fileInput.value = '';  // Clear the file input
      return;
    }

    // Check file type (JPG, PNG, JPEG only)
    const validFileTypes = ['image/jpeg', 'image/png'];
    if (!validFileTypes.includes(file.type)) {
      alert('Invalid file type. Please upload a JPG or PNG image.');
      fileInput.value = '';  // Clear the file input
      return;
    }

    // Optionally, check dimensions (max 2000px wide)
    const img = new Image();
    img.onload = function() {
      if (img.width > 1000) {
        alert('Image width is too large. Maximum width is 2000px.');
        fileInput.value = '';  // Clear the file input
      }
    };
    img.src = URL.createObjectURL(file);
  }

  function showImagePreview() {
    const fileInput = document.getElementById('photoUpload');
    const previewContainer = document.getElementById('photoPreview');
    const file = fileInput.files[0];

    if (file) {
      const reader = new FileReader();

      reader.onload = function(e) {
        const img = document.createElement('img');
        img.src = e.target.result;
        img.style.maxWidth = '200px'; // Limit preview size
        img.style.maxHeight = '200px';
        previewContainer.innerHTML = ''; // Clear previous preview
        previewContainer.appendChild(img);
      };

      reader.readAsDataURL(file);
    }
  }


// Run on page load and scroll
  revealStatsBox();
  $(window).on('scroll', revealStatsBox);
