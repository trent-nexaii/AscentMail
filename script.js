(function () {
  "use strict";

  document.documentElement.classList.add("js");

  /* Reveal on scroll */
  var reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: "0px 0px -40px 0px" });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("is-visible"); });
  }

  /* Mobile nav */
  var navToggle = document.getElementById("nav-toggle");
  var mainNav = document.getElementById("main-nav");
  function closeNav() {
    mainNav.classList.remove("is-open");
    navToggle.setAttribute("aria-expanded", "false");
  }
  navToggle.addEventListener("click", function () {
    var open = mainNav.classList.toggle("is-open");
    navToggle.setAttribute("aria-expanded", String(open));
  });
  mainNav.addEventListener("click", function (e) {
    if (e.target.tagName === "A") closeNav();
  });

  /* FAQ accordion */
  document.querySelectorAll(".acc-trigger").forEach(function (trigger) {
    trigger.addEventListener("click", function () {
      var expanded = trigger.getAttribute("aria-expanded") === "true";
      var panel = document.getElementById(trigger.getAttribute("aria-controls"));
      trigger.setAttribute("aria-expanded", String(!expanded));
      panel.hidden = expanded;
    });
  });

  /* Territory checker */
  var checker = document.getElementById("territory-checker");
  var checkerResult = document.getElementById("checker-result");
  checker.addEventListener("submit", function (e) {
    e.preventDefault();
    var location = document.getElementById("tc-location").value.trim();
    var industry = document.getElementById("tc-industry").value;
    if (!location || !industry) {
      checkerResult.hidden = false;
      checkerResult.textContent = "Please enter a suburb or postcode and choose your industry.";
      return;
    }
    checkerResult.hidden = false;
    checkerResult.textContent = "Good news — territories in " + location + " are still open for " + industry + ". Book a demo to claim yours.";
  });

  /* Modals — Book a Demo + Send Us a Message share this module */
  function setupModal(config) {
    var overlay = document.getElementById(config.overlayId);
    if (!overlay) return null;
    var formView = document.getElementById(config.formViewId);
    var successView = document.getElementById(config.successViewId);
    var doneBtn = document.getElementById(config.doneId);
    var closeBtn = overlay.querySelector(".modal-close");
    var lastFocused = null;

    function open() {
      lastFocused = document.activeElement;
      overlay.hidden = false;
      formView.hidden = false;
      successView.hidden = true;
      document.body.style.overflow = "hidden";
      var first = document.getElementById(config.firstFieldId);
      if (first) first.focus();
    }
    function close() {
      overlay.hidden = true;
      document.body.style.overflow = "";
      if (lastFocused) lastFocused.focus();
    }
    function showSuccess() {
      formView.hidden = true;
      successView.hidden = false;
      doneBtn.focus();
    }

    document.querySelectorAll(config.openSelector).forEach(function (btn) {
      btn.addEventListener("click", open);
    });
    closeBtn.addEventListener("click", close);
    doneBtn.addEventListener("click", close);
    overlay.addEventListener("click", function (e) {
      if (e.target === overlay) close();
    });

    /* Focus trap inside modal */
    overlay.addEventListener("keydown", function (e) {
      if (e.key !== "Tab") return;
      var focusables = overlay.querySelectorAll("button, input, select, textarea, a[href]");
      var visible = Array.prototype.filter.call(focusables, function (el) {
        return el.offsetParent !== null;
      });
      if (!visible.length) return;
      var first = visible[0];
      var last = visible[visible.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    });

    return { overlay: overlay, open: open, close: close, showSuccess: showSuccess };
  }

  var demoModal = setupModal({
    overlayId: "contact-modal",
    openSelector: ".js-open-modal",
    formViewId: "modal-form-view",
    successViewId: "modal-success-view",
    doneId: "modal-done",
    firstFieldId: "cf-name"
  });
  var messageModal = setupModal({
    overlayId: "message-modal",
    openSelector: ".js-open-message-modal",
    formViewId: "message-form-view",
    successViewId: "message-success-view",
    doneId: "message-done",
    firstFieldId: "mf-name"
  });

  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    [demoModal, messageModal].forEach(function (m) {
      if (m && !m.overlay.hidden) m.close();
    });
  });

  /* Form validation */
  function setError(input, message) {
    var errorEl = input.closest(".field").querySelector(".field-error");
    input.setAttribute("aria-invalid", message ? "true" : "false");
    if (errorEl) errorEl.textContent = message || "";
  }
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  var PHONE_RE = /^[\d\s+()-]{6,}$/;

  /* Deliver via FormSubmit.co with fetch so the modal never navigates away.
     NOTE: FormSubmit requires a one-time activation — the FIRST submission
     sends a confirmation email to hello@ascentmail.com.au whose link must be
     clicked before deliveries start. Upgrade path: swap the form's action URL
     for an n8n webhook to also log leads into Airtable. */
  function submitViaFormSubmit(form, errorId, idleLabel, onSuccess) {
    var submitBtn = form.querySelector('button[type="submit"]');
    var formError = document.getElementById(errorId);
    submitBtn.disabled = true;
    submitBtn.textContent = "Sending…";
    formError.hidden = true;

    fetch(form.action, {
      method: "POST",
      headers: { "Accept": "application/json" },
      body: new FormData(form)
    }).then(function (res) {
      if (!res.ok) throw new Error("FormSubmit responded " + res.status);
      onSuccess();
      form.reset();
    }).catch(function () {
      formError.hidden = false;
    }).then(function () {
      submitBtn.disabled = false;
      submitBtn.textContent = idleLabel;
    });
  }

  var contactForm = document.getElementById("contact-form");
  contactForm.addEventListener("submit", function (e) {
    e.preventDefault();
    var valid = true;
    var name = document.getElementById("cf-name");
    var email = document.getElementById("cf-email");
    var phone = document.getElementById("cf-phone");
    var industry = document.getElementById("cf-industry");
    var suburb = document.getElementById("cf-suburb");

    if (!name.value.trim()) { setError(name, "Please enter your name."); valid = false; } else setError(name, "");
    if (!EMAIL_RE.test(email.value.trim())) { setError(email, "Please enter a valid email address."); valid = false; } else setError(email, "");
    if (!PHONE_RE.test(phone.value.trim())) { setError(phone, "Please enter a valid phone number."); valid = false; } else setError(phone, "");
    if (!industry.value) { setError(industry, "Please select your industry."); valid = false; } else setError(industry, "");
    if (!suburb.value.trim()) { setError(suburb, "Please enter a suburb or territory."); valid = false; } else setError(suburb, "");

    if (!valid) return;
    submitViaFormSubmit(contactForm, "form-error", "Request My Demo", demoModal.showSuccess);
  });

  var messageForm = document.getElementById("message-form");
  messageForm.addEventListener("submit", function (e) {
    e.preventDefault();
    var valid = true;
    var name = document.getElementById("mf-name");
    var phone = document.getElementById("mf-phone");
    var email = document.getElementById("mf-email");
    var message = document.getElementById("mf-message");

    if (!name.value.trim()) { setError(name, "Please enter your name."); valid = false; } else setError(name, "");
    if (!PHONE_RE.test(phone.value.trim())) { setError(phone, "Please enter a valid phone number."); valid = false; } else setError(phone, "");
    if (!EMAIL_RE.test(email.value.trim())) { setError(email, "Please enter a valid email address."); valid = false; } else setError(email, "");
    if (!message.value.trim()) { setError(message, "Please enter your message."); valid = false; } else setError(message, "");

    if (!valid) return;
    submitViaFormSubmit(messageForm, "message-form-error", "Send Message", messageModal.showSuccess);
  });

  /* Rotating stats ticker (Why Ascent band) */
  var ticker = document.getElementById("stat-ticker");
  if (ticker) {
    var statViewport = ticker.querySelector(".stat-viewport");
    var statItems = Array.prototype.slice.call(ticker.querySelectorAll(".stat-item"));
    var statDots = Array.prototype.slice.call(ticker.querySelectorAll(".stat-dot"));
    var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    var STAT_INTERVAL = 4500;
    var STAT_RESUME_DELAY = 15000;
    var statIndex = 0;
    var statTimer = null;
    var statResumeTimer = null;
    var statInView = false;
    var statHovered = false;
    var statClickPaused = false;

    var setStatHeight = function () {
      var max = 0;
      statItems.forEach(function (item) { max = Math.max(max, item.offsetHeight); });
      statViewport.style.height = max + "px";
    };

    var showStat = function (next) {
      statItems.forEach(function (item) { item.classList.remove("is-exit"); });
      if (next !== statIndex) {
        /* the incoming stat must re-enter from below, not from a stale exit position */
        void statItems[next].offsetWidth;
        statItems[statIndex].classList.add("is-exit");
      }
      statItems.forEach(function (item, i) {
        item.classList.toggle("is-active", i === next);
        item.setAttribute("aria-hidden", i === next ? "false" : "true");
      });
      statDots.forEach(function (dot, i) {
        dot.classList.toggle("is-active", i === next);
        if (i === next) dot.setAttribute("aria-current", "true");
        else dot.removeAttribute("aria-current");
      });
      statIndex = next;
    };

    var stopStats = function () {
      if (statTimer) { clearInterval(statTimer); statTimer = null; }
    };
    var startStats = function () {
      if (statTimer || statClickPaused || reduceMotion.matches || !statInView || statHovered) return;
      statTimer = setInterval(function () {
        showStat((statIndex + 1) % statItems.length);
      }, STAT_INTERVAL);
    };

    statDots.forEach(function (dot, i) {
      dot.addEventListener("click", function () {
        showStat(i);
        stopStats();
        statClickPaused = true;
        clearTimeout(statResumeTimer);
        statResumeTimer = setTimeout(function () {
          statClickPaused = false;
          startStats();
        }, STAT_RESUME_DELAY);
      });
    });

    ticker.addEventListener("mouseenter", function () { statHovered = true; stopStats(); });
    ticker.addEventListener("mouseleave", function () { statHovered = false; startStats(); });

    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        statInView = entries[0].isIntersecting;
        if (statInView) startStats(); else stopStats();
      }, { threshold: 0.3 }).observe(ticker);
    } else {
      statInView = true;
      startStats();
    }

    setStatHeight();
    window.addEventListener("resize", setStatHeight);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(setStatHeight);
  }
})();
