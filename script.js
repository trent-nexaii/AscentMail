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

  /* Contact modal */
  var modal = document.getElementById("contact-modal");
  var modalClose = document.getElementById("modal-close");
  var modalDone = document.getElementById("modal-done");
  var formView = document.getElementById("modal-form-view");
  var successView = document.getElementById("modal-success-view");
  var contactForm = document.getElementById("contact-form");
  var lastFocused = null;

  function openModal() {
    lastFocused = document.activeElement;
    modal.hidden = false;
    formView.hidden = false;
    successView.hidden = true;
    document.body.style.overflow = "hidden";
    document.getElementById("cf-name").focus();
  }
  function closeModal() {
    modal.hidden = true;
    document.body.style.overflow = "";
    if (lastFocused) lastFocused.focus();
  }

  document.querySelectorAll(".js-open-modal").forEach(function (btn) {
    btn.addEventListener("click", openModal);
  });
  modalClose.addEventListener("click", closeModal);
  modalDone.addEventListener("click", closeModal);
  modal.addEventListener("click", function (e) {
    if (e.target === modal) closeModal();
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && !modal.hidden) closeModal();
  });

  /* Focus trap inside modal */
  modal.addEventListener("keydown", function (e) {
    if (e.key !== "Tab") return;
    var focusables = modal.querySelectorAll("button, input, select, a[href]");
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

  /* Contact form validation */
  function setError(input, message) {
    var errorEl = input.closest(".field").querySelector(".field-error");
    input.setAttribute("aria-invalid", message ? "true" : "false");
    if (errorEl) errorEl.textContent = message || "";
  }

  contactForm.addEventListener("submit", function (e) {
    e.preventDefault();
    var valid = true;
    var name = document.getElementById("cf-name");
    var email = document.getElementById("cf-email");
    var phone = document.getElementById("cf-phone");
    var industry = document.getElementById("cf-industry");
    var suburb = document.getElementById("cf-suburb");

    if (!name.value.trim()) { setError(name, "Please enter your name."); valid = false; } else setError(name, "");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) { setError(email, "Please enter a valid email address."); valid = false; } else setError(email, "");
    if (!/^[\d\s+()-]{6,}$/.test(phone.value.trim())) { setError(phone, "Please enter a valid phone number."); valid = false; } else setError(phone, "");
    if (!industry.value) { setError(industry, "Please select your industry."); valid = false; } else setError(industry, "");
    if (!suburb.value.trim()) { setError(suburb, "Please enter a suburb or territory."); valid = false; } else setError(suburb, "");

    if (!valid) return;

    /* Placeholder submit — replace action with your form endpoint */
    formView.hidden = true;
    successView.hidden = false;
    modalDone.focus();
    contactForm.reset();
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
