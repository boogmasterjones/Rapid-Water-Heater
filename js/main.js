// Rapid Water Heater LLC — site interactions (no build step, vanilla JS)

// Carries a prefill message from the estimator to the contact
// page's message field across a full page navigation.
function applyQuotePrefill() {
  try {
    var msg = sessionStorage.getItem("quotePrefill");
    if (msg) {
      var field = document.getElementById("message");
      if (field) {
        field.value = msg;
        sessionStorage.removeItem("quotePrefill");
      }
    }
  } catch (e) { /* sessionStorage unavailable, ignore */ }
}

function goToQuoteForm(prefillMessage) {
  try {
    if (prefillMessage) sessionStorage.setItem("quotePrefill", prefillMessage);
  } catch (e) { /* ignore */ }
  var quoteSection = document.getElementById("quote");
  if (quoteSection) {
    quoteSection.scrollIntoView({ behavior: "smooth", block: "start" });
    setTimeout(applyQuotePrefill, 350);
  } else {
    window.location.href = "/contact.html#quote";
  }
}

document.addEventListener("DOMContentLoaded", function () {
  "use strict";

  applyQuotePrefill();

  // ---- Homepage: reveal the header only after the user scrolls past the hero ----
  if (document.body.classList.contains("home")) {
    var header = document.querySelector(".site-header");
    if (header) {
      var revealThreshold = 60;
      var updateHeader = function () {
        if (window.scrollY > revealThreshold) {
          header.classList.add("header-visible");
        } else {
          header.classList.remove("header-visible");
        }
      };
      window.addEventListener("scroll", updateHeader, { passive: true });
      updateHeader();
    }
  }

  // ---- Header menu dropdown ----
  var menuToggle = document.querySelector(".menu-toggle");
  var mainNav = document.querySelector(".main-nav");
  if (menuToggle && mainNav) {
    var closeNav = function () {
      mainNav.classList.remove("open");
      menuToggle.setAttribute("aria-expanded", "false");
    };
    menuToggle.addEventListener("click", function (e) {
      e.stopPropagation();
      var isOpen = mainNav.classList.toggle("open");
      menuToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });
    mainNav.addEventListener("click", function (e) {
      if (e.target.tagName === "A") closeNav();
    });
    document.addEventListener("click", function (e) {
      if (!mainNav.contains(e.target) && !menuToggle.contains(e.target)) closeNav();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeNav();
    });
  }

  // ---- FAQ accordion ----
  document.querySelectorAll(".faq-item").forEach(function (item) {
    var btn = item.querySelector(".faq-q");
    var panel = item.querySelector(".faq-a");
    if (!btn || !panel) return;
    btn.addEventListener("click", function () {
      var isOpen = item.classList.contains("open");
      item.closest(".faq-list").querySelectorAll(".faq-item.open").forEach(function (el) {
        if (el !== item) {
          el.classList.remove("open");
          el.querySelector(".faq-a").style.maxHeight = null;
          el.querySelector(".faq-q").setAttribute("aria-expanded", "false");
        }
      });
      if (isOpen) {
        item.classList.remove("open");
        panel.style.maxHeight = null;
        btn.setAttribute("aria-expanded", "false");
      } else {
        item.classList.add("open");
        panel.style.maxHeight = panel.scrollHeight + "px";
        btn.setAttribute("aria-expanded", "true");
      }
    });
  });

  // ---- Current year in footer ----
  document.querySelectorAll(".cur-year").forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });

  // ---- Mobile sticky call bar: slides in once the user scrolls past the hero's own buttons ----
  if (document.querySelector(".sticky-call-mobile")) {
    var heroEl = document.querySelector(".hero, .page-hero");
    var updateStickyBar = function () {
      var threshold = heroEl ? heroEl.offsetHeight * 0.5 : 300;
      document.body.classList.toggle("sticky-bar-visible", window.scrollY > threshold);
    };
    window.addEventListener("scroll", updateStickyBar, { passive: true });
    updateStickyBar();
  }

  // ---- Quote form: require phone OR email, not both ----
  var quoteForm = document.querySelector(".quote-form");
  if (quoteForm) {
    var phoneInput = quoteForm.querySelector('input[name="phone"]');
    var emailInput = quoteForm.querySelector('input[name="email"]');
    if (phoneInput && emailInput) {
      var clearContactValidity = function () {
        phoneInput.setCustomValidity("");
        emailInput.setCustomValidity("");
      };
      quoteForm.addEventListener("submit", function (e) {
        if (!phoneInput.value.trim() && !emailInput.value.trim()) {
          e.preventDefault();
          var msg = "Please enter a phone number or an email so we can reach you.";
          phoneInput.setCustomValidity(msg);
          phoneInput.reportValidity();
        }
      });
      phoneInput.addEventListener("input", clearContactValidity);
      emailInput.addEventListener("input", clearContactValidity);
    }

    // Mobile: the rest of the form stays collapsed until name + contact are filled (CSS only collapses it on mobile)
    var nameInput = quoteForm.querySelector('input[name="name"]');
    var continueBtn = quoteForm.querySelector(".form-continue");
    if (quoteForm.querySelector("[data-form-more]") && nameInput && phoneInput) {
      var expandForm = function () { quoteForm.classList.add("is-expanded"); };
      var checkReady = function () {
        if (nameInput.value.trim().length > 1 && phoneInput.value.replace(/\D/g, "").length >= 10) expandForm();
      };
      nameInput.addEventListener("input", checkReady);
      phoneInput.addEventListener("input", checkReady);
      phoneInput.addEventListener("blur", function () {
        if (nameInput.value.trim() && phoneInput.value.trim()) expandForm();
      });
      quoteForm.addEventListener("invalid", expandForm, true);
      if (continueBtn) {
        continueBtn.addEventListener("click", function () {
          if (!nameInput.value.trim()) { nameInput.reportValidity(); return; }
          expandForm();
          if (!phoneInput.value.trim() && emailInput) setTimeout(function () { emailInput.focus(); }, 300);
        });
      }
    }
  }

  // ---- Review carousel ----
  document.querySelectorAll("[data-carousel]").forEach(function (carousel) {
    var track = carousel.querySelector("[data-track]");
    if (!track) return;
    var slides = Array.prototype.slice.call(track.children);
    var prevBtn = carousel.querySelector(".carousel-prev");
    var nextBtn = carousel.querySelector(".carousel-next");
    var dotsWrap = carousel.parentElement.querySelector("[data-dots]");
    var dots = [];

    function buildDots() {
      if (!dotsWrap || !slides.length) return;
      dotsWrap.innerHTML = "";
      dots = [];
      var slideW = slides[0].offsetWidth;
      var perView = slideW > 0 ? Math.max(1, Math.round(track.offsetWidth / slideW)) : 1;
      var pageCount = Math.max(1, slides.length - perView + 1);
      for (var i = 0; i < pageCount; i++) {
        (function (idx) {
          var dot = document.createElement("button");
          dot.type = "button";
          dot.className = "carousel-dot" + (idx === 0 ? " active" : "");
          dot.setAttribute("aria-label", "Go to review " + (idx + 1));
          dot.addEventListener("click", function () {
            track.scrollTo({ left: slides[idx].offsetLeft - track.offsetLeft, behavior: "smooth" });
          });
          dotsWrap.appendChild(dot);
          dots.push(dot);
        })(i);
      }
    }

    function updateDots() {
      if (!dots.length) return;
      var trackLeft = track.scrollLeft;
      var closest = 0, min = Infinity;
      slides.forEach(function (slide, i) {
        var d = Math.abs(slide.offsetLeft - track.offsetLeft - trackLeft);
        if (d < min) { min = d; closest = i; }
      });
      closest = Math.min(closest, dots.length - 1);
      dots.forEach(function (dot, i) { dot.classList.toggle("active", i === closest); });
    }

    buildDots();

    var resizeTimer;
    window.addEventListener("resize", function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () { buildDots(); updateDots(); }, 150);
    });

    var ticking = false;
    track.addEventListener("scroll", function () {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(function () { updateDots(); ticking = false; });
    }, { passive: true });

    if (prevBtn) prevBtn.addEventListener("click", function () { track.scrollBy({ left: -track.clientWidth * 0.92, behavior: "smooth" }); });
    if (nextBtn) nextBtn.addEventListener("click", function () { track.scrollBy({ left: track.clientWidth * 0.92, behavior: "smooth" }); });
  });
});

