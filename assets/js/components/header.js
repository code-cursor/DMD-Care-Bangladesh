$(document).ready(function() {
  // ===== Date & Time =====
  function updateDateTime() {
    const now = new Date();
    const date = now.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    const time = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    $("#datetime").text(`${date} ${time}`);
  }
  setInterval(updateDateTime, 1000);
  updateDateTime();

  // ===== Submenu toggle for mobile =====
    $(".dropdown-submenu > a").on("click", function(e) {
      if ($(window).width() < 992) {
        e.preventDefault();
        e.stopPropagation();
        let submenu = $(this).next(".dropdown-menu");
        $(".dropdown-submenu .dropdown-menu").not(submenu).removeClass("show");
        submenu.toggleClass("show");
      }
    });

    $(".navbar-nav .nav-link").on("click", function() {
      if (!$(this).hasClass("dropdown-toggle")) {
        $(".navbar-collapse").collapse("hide");
      }
    });

  // ===== Custom Google Translate Dropdown =====
  const translateSelect = $("#language-select");

  function setTranslateLang(lang) {
    const combo = document.querySelector(".goog-te-combo");
    if (!combo) {
      setTimeout(() => setTranslateLang(lang), 500);
      return;
    }
    combo.value = lang;
    combo.dispatchEvent(new Event('change'));
  }

  translateSelect.on("change", function() {
    const lang = $(this).val();
    setTranslateLang(lang);
  });
});

    // Add active class on current page
    $(document).ready(function () {
        let currentPage = window.location.pathname.split("/").pop(); 

        $(".navbar-nav a").each(function () {
            let linkPage = $(this).attr("href");

            if (linkPage === currentPage) {
                $(this).addClass("active");
                $(this).closest(".dropdown").find(".dropdown-toggle").addClass("active");
            }
        });
    });

// ===== Google Translate Initialization =====
function googleTranslateElementInit() {
  new google.translate.TranslateElement({ pageLanguage: 'en', autoDisplay: false }, 'google_translate_element');
}

// BOTTOM BAR: Add focus animation on click
document.querySelectorAll('.bottom-bar button').forEach(btn => {
  btn.addEventListener('click', () => {
    btn.classList.add('animate__pulse');
    setTimeout(() => btn.classList.remove('animate__pulse'), 500);
  });
  

  // Fade In Header on Page Load
  // $('header').css('opacity', 0); 
  // $('header').animate({ opacity: 1 }, 1000); 
});

// Floating WhatsApp Widget
(function () {
    // ==========================================
    const phoneNumber = "8801914191919"; 
    // ==========================================

    // CSS
    const style = document.createElement('style');
    style.innerHTML = `
        #wa-chat-widget {
            position: fixed;
            bottom: 20px;
            right: 30px;
            z-index: 1050;
            font-family: 'Poppins', sans-serif;
        }
        .wa-toggle-btn {
            width: 60px;
            height: 60px;
            background-color: #25D366;
            color: white;
            border: none;
            font-size: 32px;
            cursor: pointer;
            transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        .wa-toggle-btn:hover {
            transform: scale(1.1);
            box-shadow: 0 6px 20px rgba(37, 211, 102, 0.6) !important;
        }
        #wa-chat-box {
            width: 320px;
            position: absolute;
            bottom: 75px;
            right: 0;
            display: none;
            opacity: 0;
            transform: translateY(20px);
            transition: opacity 0.3s ease, transform 0.3s ease;
        }
        #wa-chat-box.show-chat {
            display: flex;
            opacity: 1;
            transform: translateY(0);
        }
        .wa-chat-body {
            height: 250px;
            background-color: #e5ddd5;
            background-image: url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png');
            overflow-y: auto;
        }
        .wa-message-bubble {
            background-color: #ffffff;
            color: #333;
            padding: 12px 15px;
            border-radius: 0px 15px 15px 15px;
            font-size: 0.9rem;
            max-width: 85%;
            line-height: 1.5;
            box-shadow: 0 1px 2px rgba(6, 155, 63, 0.1);
        }
        .wa-input-control:focus {
            box-shadow: none;
            border-color: #009966;
        }
    `;
    document.head.appendChild(style);

    // HTML
    const widget = document.createElement('div');
    widget.id = 'wa-chat-widget';
    widget.innerHTML = `
        <!-- Chat Box -->
        <div id="wa-chat-box" class="card shadow-lg border-0 rounded-4 flex-column">
            <!-- Header -->
            <div class="card-header d-flex justify-content-between align-items-center p-3 border-0 rounded-top-4" style="background-color: #009966;">
                <div class="d-flex align-items-center text-white">
                    <i class="bi bi-whatsapp fs-3 me-2"></i>
                    <div>
                        <h6 class="mb-0 fw-bold">DMD Care Foundation</h6>
                        <small style="font-size: 0.75rem; opacity: 0.85;">সাধারণত কয়েক মিনিটের মধ্যে উত্তর দিই</small>
                    </div>
                </div>
                <button id="wa-chat-close" class="btn-close btn-close-white shadow-none" aria-label="Close"></button>
            </div>
            
            <!-- Body -->
            <div class="card-body wa-chat-body p-3">
                <div class="wa-message-bubble mb-2">
                    আসসালামু আলাইকুম! 👋<br>আমরা আপনাকে কীভাবে সাহায্য করতে পারি?<br>Hello!👋 How can we help you?
                </div>
            </div>
            
            <!-- Footer -->
            <div class="card-footer bg-white p-3 border-0 rounded-bottom-4">
                <div class="input-group">
                    <input type="text" id="wa-message-input" class="form-control wa-input-control rounded-pill rounded-end-0 border-end-0 bg-light" placeholder="আপনার মেসেজ লিখুন..." aria-label="Message">
                    <button class="btn rounded-pill rounded-start-0 text-white px-3" id="wa-send-btn" style="background-color: #009966; border-color: #f8f9fa;">
                        <i class="bi bi-send-fill"></i>
                    </button>
                </div>
            </div>
        </div>

        <!-- Floating Toggle Button -->
        <button id="wa-toggle-btn" class="wa-toggle-btn rounded-circle shadow-lg float-end d-flex align-items-center justify-content-center">
            <i class="bi bi-whatsapp"></i>
        </button>
    `;
    document.body.appendChild(widget);

    // event listener
    const toggleBtn = document.getElementById("wa-toggle-btn");
    const chatBox = document.getElementById("wa-chat-box");
    const closeBtn = document.getElementById("wa-chat-close");
    const sendBtn = document.getElementById("wa-send-btn");
    const messageInput = document.getElementById("wa-message-input");

    // Open/Close
    toggleBtn.addEventListener("click", () => {
        if (chatBox.classList.contains("show-chat")) {
            closeChat();
        } else {
            chatBox.style.display = "flex";
            setTimeout(() => chatBox.classList.add("show-chat"), 10);
            messageInput.focus();
        }
    });

    closeBtn.addEventListener("click", closeChat);

    function closeChat() {
        chatBox.classList.remove("show-chat");
        setTimeout(() => chatBox.style.display = "none", 300);
    }

    // Send Message Function
    function sendWhatsAppMessage() {
        let message = messageInput.value.trim();
        
        if (message === "") {
            message = "হ্যালো DMD Care Foundation, আমি আপনাদের কার্যক্রম সম্পর্কে বিস্তারিত জানতে চাই।"; 
        }
        
        const whatsappUrl = `https://api.whatsapp.com/send?phone=${phoneNumber}&text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
        
        messageInput.value = "";
        closeChat();
    }

    // Trigger send on click and Enter key
    sendBtn.addEventListener("click", sendWhatsAppMessage);
    messageInput.addEventListener("keypress", function (e) {
        if (e.key === "Enter") {
            e.preventDefault();
            sendWhatsAppMessage();
        }
    });

})();
