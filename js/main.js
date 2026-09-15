// Rapid Water Heater LLC — site interactions (no build step, vanilla JS)

// Carries a prefill message from the estimator or chatbot to the contact
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

/* =====================================================================
   Chatbot widget — scripted FAQ assistant, not a live agent or real AI.
   Answers common questions from quick-reply chips or simple keyword
   matching, and always offers a path to call or request a free estimate.
   ===================================================================== */
(function () {
  var PHONE_DISPLAY = "941-876-5900";
  var PHONE_TEL = "tel:+19418765900";

  var BOOKING_NUDGE = " The fastest next step is requesting your free estimate — it only takes a minute.";

  var TOPICS = {
    pricing: {
      label: "Pricing",
      response: "Pricing depends on the type of water heater and any drain or fixture work involved. As a rough idea, tank installs, tankless installs, drain clearing, and additional fixtures are each priced individually, and smaller jobs carry a small minimum service fee. Request a free estimate and we'll give you an exact number for your property." + BOOKING_NUDGE,
      chips: [{ label: "Request an Estimate", action: "quote" }]
    },
    areas: {
      label: "Service Areas",
      response: "We regularly serve Sarasota, Venice, Bradenton, Lakewood Ranch, Wellen Park, Englewood, Nokomis, North Port, Rotonda West, Port Charlotte, Punta Gorda, Arcadia, Palmetto, and Parrish, FL. If your town isn't listed, there's a good chance we still cover it — just ask!" + BOOKING_NUDGE,
      chips: [{ label: "Request an Estimate", action: "quote" }, { label: "See All Service Areas", action: "link", url: "/service-areas.html" }]
    },
    included: {
      label: "What's Included",
      response: "Every water heater installation includes a free consultation, correct sizing for your household, code-compliant installation, and a free 1-year maintenance visit. Drain cleaning and emergency plumbing are available too — just mention it when you call." + BOOKING_NUDGE,
      chips: [{ label: "Request an Estimate", action: "quote" }, { label: "See Our Services", action: "link", url: "/services.html" }]
    },
    insurance: {
      label: "Licensed & Insured?",
      response: "Yes — Rapid Water Heater LLC is a licensed Florida plumbing contractor, and we're happy to talk through the details before any job starts." + BOOKING_NUDGE,
      chips: [{ label: "Request an Estimate", action: "quote" }, { label: "About Our Team", action: "link", url: "/about.html" }]
    },
    callback: {
      label: "Book a Callback",
      response: "Happy to help! The fastest way is to call or text us directly at " + PHONE_DISPLAY + ". Or skip the wait and request your free estimate directly — no call needed.",
      chips: [{ label: "Request an Estimate", action: "quote" }, { label: "Call " + PHONE_DISPLAY, action: "call" }, { label: "Request a Callback", action: "quote-callback" }]
    },
    quote: {
      label: "Request an Estimate",
      response: "Let's get your free estimate started — just fill out a few quick details and we'll follow up fast.",
      chips: [{ label: "Request an Estimate", action: "quote" }]
    }
  };

  var KEYWORD_MAP = [
    { topic: "pricing", words: ["price", "pricing", "cost", "how much", "rate", "estimate cost", "expensive", "cheap"] },
    { topic: "areas", words: ["area", "areas", "location", "city", "cities", "serve", "zip", "near me", "sarasota", "venice", "bradenton", "north port", "punta gorda", "port charlotte", "englewood", "nokomis"] },
    { topic: "included", words: ["include", "included", "maintenance", "warranty", "what do you do", "service include"] },
    { topic: "insurance", words: ["insur", "licens", "liability", "bonded"] },
    { topic: "callback", words: ["call back", "callback", "call me", "phone me", "talk to someone", "speak to"] },
    { topic: "quote", words: ["quote", "book", "schedule", "appointment", "estimate", "sign up", "hire you"] }
  ];

  var STORAGE_INTERACTED = "chatbotInteracted";
  var STORAGE_AUTO_SHOWN = "chatbotAutoShown";

  var panel, messagesEl, chipsEl, toggleBtn, pingEl, inputEl;
  var greeted = false;

  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html !== undefined) e.innerHTML = html;
    return e;
  }

  function scrollMessagesToBottom() {
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function addMessage(text, sender) {
    var bubble = el("div", "chatbot-msg " + sender, text);
    messagesEl.appendChild(bubble);
    scrollMessagesToBottom();
  }

  function renderChips(chips) {
    chipsEl.innerHTML = "";
    chips.forEach(function (chip) {
      var btn = el("button", "chatbot-chip" + (chip.action === "quote" || chip.action === "quote-callback" || chip.action === "call" ? " chip-cta" : ""), chip.label);
      btn.type = "button";
      btn.addEventListener("click", function () { handleChipClick(chip); });
      chipsEl.appendChild(btn);
    });
  }

  function defaultChips() {
    return [
      { label: "Request an Estimate", action: "quote" },
      { label: "Pricing", action: "topic", topic: "pricing" },
      { label: "Service Areas", action: "topic", topic: "areas" },
      { label: "What's Included", action: "topic", topic: "included" },
      { label: "Book a Callback", action: "topic", topic: "callback" }
    ];
  }

  function handleChipClick(chip) {
    if (chip.action === "topic") {
      var topic = TOPICS[chip.topic];
      addMessage(topic.label, "user");
      setTimeout(function () {
        addMessage(topic.response, "bot");
        renderChips(topic.chips.concat([{ label: "Something Else", action: "menu" }]));
      }, 350);
      return;
    }
    if (chip.action === "menu") {
      addMessage("Something else", "user");
      setTimeout(function () {
        addMessage("Sure — what would you like to know?", "bot");
        renderChips(defaultChips());
      }, 300);
      return;
    }
    if (chip.action === "call") {
      window.location.href = PHONE_TEL;
      return;
    }
    if (chip.action === "quote") {
      addMessage(chip.label || "Request an Estimate", "user");
      setTimeout(function () {
        addMessage("Great — I'm taking you to our estimate form now.", "bot");
        closePanel();
        goToQuoteForm();
      }, 300);
      return;
    }
    if (chip.action === "quote-callback") {
      addMessage("Request a Callback", "user");
      setTimeout(function () {
        addMessage("Perfect — I'm pulling up our form with a note that you'd like a callback.", "bot");
        closePanel();
        goToQuoteForm("I'd like to request a callback — please call me back at your earliest convenience.");
      }, 300);
      return;
    }
    if (chip.action === "link") {
      window.location.href = chip.url;
      return;
    }
  }

  function matchKeyword(text) {
    var lower = text.toLowerCase();
    for (var i = 0; i < KEYWORD_MAP.length; i++) {
      var entry = KEYWORD_MAP[i];
      for (var j = 0; j < entry.words.length; j++) {
        if (lower.indexOf(entry.words[j]) !== -1) return entry.topic;
      }
    }
    return null;
  }

  function handleUserText(text) {
    text = text.trim();
    if (!text) return;
    addMessage(text, "user");
    inputEl.value = "";
    var topicKey = matchKeyword(text);
    setTimeout(function () {
      if (topicKey) {
        var topic = TOPICS[topicKey];
        addMessage(topic.response, "bot");
        renderChips(topic.chips.concat([{ label: "Something Else", action: "menu" }]));
      } else {
        addMessage("I might not have that answer on hand, but our team will! Easiest way to get it sorted is to request your estimate and ask us directly.", "bot");
        renderChips([
          { label: "Request an Estimate", action: "quote" },
          { label: "Call " + PHONE_DISPLAY, action: "call" },
          { label: "Something Else", action: "menu" }
        ]);
      }
    }, 400);
  }

  function greet() {
    if (greeted) return;
    greeted = true;
    addMessage("Hi! I'm the Rapid Water Heater Assistant. I can help with quick questions or get you a free estimate — what can I help with?", "bot");
    renderChips(defaultChips());
  }

  function markInteracted() {
    try { sessionStorage.setItem(STORAGE_INTERACTED, "1"); } catch (e) { /* ignore */ }
  }

  function openPanel() {
    panel.classList.add("open");
    toggleBtn.classList.add("open");
    toggleBtn.setAttribute("aria-expanded", "true");
    if (pingEl) pingEl.classList.add("hidden");
    markInteracted();
    greet();
    inputEl.focus({ preventScroll: true });
  }

  function closePanel() {
    panel.classList.remove("open");
    toggleBtn.classList.remove("open");
    toggleBtn.setAttribute("aria-expanded", "false");
  }

  function togglePanel() {
    if (panel.classList.contains("open")) { closePanel(); } else { openPanel(); }
  }

  function buildWidget() {
    var wrap = el("div", "chatbot-widget");

    toggleBtn = el("button", "chatbot-toggle");
    toggleBtn.type = "button";
    toggleBtn.setAttribute("aria-label", "Chat with Rapid Water Heater Assistant");
    toggleBtn.setAttribute("aria-expanded", "false");
    toggleBtn.innerHTML =
      '<svg class="chatbot-icon-chat" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>' +
      '<svg class="chatbot-icon-close" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.4"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
    pingEl = el("span", "chatbot-ping");
    toggleBtn.appendChild(pingEl);

    panel = el("div", "chatbot-panel");
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-label", "Rapid Water Heater Assistant chat");

    var header = el("div", "chatbot-header");
    header.innerHTML =
      '<div class="chatbot-header-title"><span class="chatbot-status-dot"></span><span>Rapid Water Heater Assistant<span class="chatbot-header-sub">Typically replies instantly</span></span></div>';
    var closeBtn = el("button", "chatbot-close");
    closeBtn.type = "button";
    closeBtn.setAttribute("aria-label", "Close chat");
    closeBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
    closeBtn.addEventListener("click", closePanel);
    header.appendChild(closeBtn);

    messagesEl = el("div", "chatbot-messages");
    chipsEl = el("div", "chatbot-quick-replies");

    var inputRow = el("div", "chatbot-input-row");
    inputEl = document.createElement("input");
    inputEl.type = "text";
    inputEl.placeholder = "Type a question…";
    inputEl.setAttribute("aria-label", "Type a question");
    var sendBtn = el("button", "chatbot-send");
    sendBtn.type = "button";
    sendBtn.setAttribute("aria-label", "Send message");
    sendBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>';
    sendBtn.addEventListener("click", function () { handleUserText(inputEl.value); });
    inputEl.addEventListener("keydown", function (e) {
      if (e.key === "Enter") { e.preventDefault(); handleUserText(inputEl.value); }
    });
    inputRow.appendChild(inputEl);
    inputRow.appendChild(sendBtn);

    panel.appendChild(header);
    panel.appendChild(messagesEl);
    panel.appendChild(chipsEl);
    panel.appendChild(inputRow);

    wrap.appendChild(panel);
    wrap.appendChild(toggleBtn);
    document.body.appendChild(wrap);

    toggleBtn.addEventListener("click", togglePanel);
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && panel.classList.contains("open")) closePanel();
    });
  }

  function getAutoTriggerY() {
    var sections = document.querySelectorAll("main > section");
    var sectionY = Infinity;
    if (sections.length >= 3) {
      var rect3 = sections[2].getBoundingClientRect();
      sectionY = rect3.bottom + window.scrollY;
    }
    var halfwayY = document.body.scrollHeight / 2;
    return Math.min(sectionY, halfwayY);
  }

  function setupAutoTrigger() {
    var alreadyInteracted, alreadyAutoShown;
    try {
      alreadyInteracted = sessionStorage.getItem(STORAGE_INTERACTED);
      alreadyAutoShown = sessionStorage.getItem(STORAGE_AUTO_SHOWN);
    } catch (e) { alreadyInteracted = null; alreadyAutoShown = null; }
    if (alreadyInteracted || alreadyAutoShown) return;

    var threshold = getAutoTriggerY();
    if (!isFinite(threshold)) return;

    var ticking = false;
    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        ticking = false;
        var interacted;
        try { interacted = sessionStorage.getItem(STORAGE_INTERACTED); } catch (e) { interacted = null; }
        if (interacted) {
          window.removeEventListener("scroll", onScroll);
          return;
        }
        if (window.scrollY >= threshold) {
          window.removeEventListener("scroll", onScroll);
          try { sessionStorage.setItem(STORAGE_AUTO_SHOWN, "1"); } catch (e) { /* ignore */ }
          openPanel();
        }
      });
    }
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  document.addEventListener("DOMContentLoaded", function () {
    buildWidget();
    setupAutoTrigger();
  });
})();
