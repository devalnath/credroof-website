(function () {
  "use strict";

  var cfg = window.CREDROOF_CONFIG || {};
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- helpers ---------- */

  function inr(value) {
    var n = Math.max(0, Math.round(value));
    return "\u20B9" + n.toLocaleString("en-IN");
  }

  function clamp(n, min, max) {
    return Math.min(max, Math.max(min, n));
  }

  function $(sel, root) {
    return (root || document).querySelector(sel);
  }

  function $$(sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  }

  function param(name) {
    try {
      return new URLSearchParams(window.location.search).get(name) || "";
    } catch (err) {
      return "";
    }
  }

  /* ---------- sticky header ---------- */

  (function initHeader() {
    var head = $(".site-head") || $(".navpill");
    if (!head) return;
    var ticking = false;

    function apply() {
      head.classList.toggle("is-stuck", window.scrollY > 24);
      ticking = false;
    }

    window.addEventListener(
      "scroll",
      function () {
        if (ticking) return;
        ticking = true;
        window.requestAnimationFrame(apply);
      },
      { passive: true }
    );
    apply();
  })();

  (function initYear() {
    $$("[data-year]").forEach(function (el) {
      el.textContent = String(new Date().getFullYear());
    });
  })();

  /* ---------- calculator ---------- */

  function initCalculator(root) {
    var price = $('[data-calc="price"]', root);
    var share = $('[data-calc="share"]', root);
    var rate = $('[data-calc="rate"]', root);
    var years = $('[data-calc="years"]', root);
    var resetShare = $('[data-calc="reset-share"]', root);
    var assumptions = {
      stamp: $('[data-assume="stamp"]', root),
      reg: $('[data-assume="reg"]', root),
      repairs: $('[data-assume="repairs"]', root),
      contingency: $('[data-assume="contingency"]', root),
      upfront: $('[data-assume="upfront"]', root)
    };

    if (!price || !share || !rate || !years) return;

    var autoShare = true;
    var state = {
      priceLabel: $('[data-out="price-label"]', root),
      priceEcho: $('[data-out="price-echo"]', root),
      shareLabel: $('[data-out="share-label"]', root),
      shareHint: $('[data-out="share-hint"]', root),
      loan: $('[data-out="loan"]', root),
      down: $('[data-out="down"]', root),
      stamp: $('[data-out="stamp"]', root),
      repairs: $('[data-out="repairs"]', root),
      contingency: $('[data-out="contingency"]', root),
      total: $('[data-out="total"]', root),
      upfront: $('[data-out="upfront"]', root),
      emi: $('[data-out="emi"]', root),
      meterLoan: $('[data-meter="loan"]', root),
      meterCash: $('[data-meter="cash"]', root),
      meterCosts: $('[data-meter="costs"]', root)
    };

    function bandCeiling(p) {
      if (p <= 3000000) return 0.9;
      if (p <= 7500000) return 0.8;
      return 0.75;
    }

    function bandText(p) {
      if (p <= 3000000) return "up to 90% for loans up to \u20B930 lakh";
      if (p <= 7500000) return "up to 80% for loans of \u20B930 lakh to \u20B975 lakh";
      return "up to 75% for loans above \u20B975 lakh";
    }

    function num(el, fallback) {
      var v = parseFloat(el && el.value);
      return isFinite(v) ? v : fallback;
    }

    function animate(el, to, fmt) {
      if (!el) return;
      var from = typeof el._value === "number" ? el._value : to;
      el._value = to;
      var generation = (el._generation = (el._generation || 0) + 1);
      if (reduceMotion || from === to || document.hidden) {
        el.textContent = fmt(to);
        return;
      }
      var start = performance.now();
      var duration = 220;
      function step(now) {
        if (el._generation !== generation) return;
        var t = Math.min(1, (now - start) / duration);
        var eased = 1 - Math.pow(1 - t, 3);
        el.textContent = fmt(from + (to - from) * eased);
        if (t < 1) window.requestAnimationFrame(step);
      }
      window.requestAnimationFrame(step);
      // Background tabs and low-power mode throttle rAF, which would freeze a
      // figure mid-count. Settle on the true value regardless.
      window.setTimeout(function () {
        if (el._generation === generation) el.textContent = fmt(to);
      }, duration + 60);
    }

    function compute() {
      var p = clamp(parseFloat(price.value) || 0, 500000, 20000000);
      if (autoShare) share.value = String(Math.round(bandCeiling(p) * 100));

      var sharePct = clamp(parseFloat(share.value) || 0, 40, 90);
      var r = clamp(num(rate, 8.75), 5, 16) / 100 / 12;
      var n = clamp(parseInt(years.value, 10) || 20, 5, 35) * 12;

      var loan = p * (sharePct / 100);
      var down = p - loan;
      var stampPct = clamp(num(assumptions.stamp, 8), 0, 15);
      var regPct = clamp(num(assumptions.reg, 2), 0, 10);
      var statutory = p * ((stampPct + regPct) / 100);
      var repairs = p * (clamp(num(assumptions.repairs, 2), 0, 20) / 100);
      var contingency = p * (clamp(num(assumptions.contingency, 1.5), 0, 10) / 100);
      var costs = statutory + repairs + contingency;
      var totalCash = down + costs;
      var upfront = p * (clamp(num(assumptions.upfront, 10), 0, 25) / 100);

      var emi = 0;
      if (r > 0 && n > 0) {
        var f = Math.pow(1 + r, n);
        emi = (loan * r * f) / (f - 1);
      }

      if (state.priceLabel) state.priceLabel.textContent = inr(p);
      if (state.priceEcho) state.priceEcho.textContent = inr(p);
      if (state.shareLabel) state.shareLabel.textContent = sharePct + "%";
      if (state.shareHint) {
        state.shareHint.textContent = autoShare
          ? "Using the RBI ceiling for this price: " + bandText(p) + ". Confirm with the lender."
          : "Manual share. The RBI ceiling for this price is " + bandText(p) + ".";
      }
      if (resetShare) resetShare.hidden = autoShare;

      animate(state.loan, loan, inr);
      animate(state.down, down, inr);
      animate(state.stamp, statutory, inr);
      animate(state.repairs, repairs, inr);
      animate(state.contingency, contingency, inr);
      animate(state.total, totalCash, inr);
      animate(state.upfront, upfront, inr);
      animate(state.emi, emi, inr);

      var scale = loan + down + costs || 1;
      if (state.meterLoan) state.meterLoan.style.flexGrow = String(loan / scale);
      if (state.meterCash) state.meterCash.style.flexGrow = String(down / scale);
      if (state.meterCosts) state.meterCosts.style.flexGrow = String(costs / scale);
    }

    price.addEventListener("input", compute);
    share.addEventListener("input", function () {
      autoShare = false;
      compute();
    });
    rate.addEventListener("input", compute);
    years.addEventListener("change", compute);
    Object.keys(assumptions).forEach(function (key) {
      if (assumptions[key]) assumptions[key].addEventListener("input", compute);
    });
    if (resetShare) {
      resetShare.addEventListener("click", function () {
        autoShare = true;
        compute();
      });
    }

    compute();
  }

  $$("[data-calc-root]").forEach(initCalculator);

  /* ---------- lead forms ---------- */

  function buildMessage(form) {
    var get = function (name) {
      var el = form.elements[name];
      if (!el) return "";
      if (el.tagName === "SELECT") {
        var option = el.options[el.selectedIndex];
        return option && option.value ? String(option.textContent).trim() : "";
      }
      return el.value ? String(el.value).trim() : "";
    };
    var page = document.body.getAttribute("data-page") || "site";
    var lines = ["New CredRoof enquiry (" + page + " page)"];

    lines.push("Name: " + get("name"));
    lines.push("Mobile: " + get("phone"));
    if (get("district")) lines.push("District: " + get("district"));
    if (get("area")) lines.push("Area: " + get("area"));
    if (get("calltime")) lines.push("Best time to call: " + get("calltime"));
    if (get("ptype")) lines.push("Property type: " + get("ptype"));
    if (get("budget")) lines.push("Budget: " + get("budget"));
    if (get("timeline")) lines.push("Timeline: " + get("timeline"));
    if (get("purpose")) lines.push("Purpose: " + get("purpose"));
    if (get("notes")) lines.push("Notes: " + get("notes"));

    var src = [param("utm_source"), param("utm_campaign")].filter(Boolean).join(" / ");
    if (src) lines.push("Came from: " + src);

    return lines.join("\n");
  }

  function handleSubmit(event) {
    var form = event.target;
    if (!form.matches("[data-lead-form]")) return;
    event.preventDefault();

    var stepCount = form.querySelectorAll(".form-step").length;
    if (stepCount > 1) {
      if (!validateStep(form, stepCount - 1)) return;
    } else if (!form.reportValidity()) {
      return;
    }

    var message = buildMessage(form);
    var sent = $("[data-sent]", form.parentNode) || $("[data-sent]", document);
    var sentText = sent ? $("[data-sent-text]", sent) : null;
    var demo = sent ? $("[data-demo]", sent) : null;
    var sentHeadline = sent ? $("[data-sent-headline]", sent) : null;

    var number = String(cfg.whatsapp || "").replace(/\D/g, "");
    if (number) {
      var url = "https://wa.me/" + number + "?text=" + encodeURIComponent(message);
      var win = window.open(url, "_blank", "noopener");
      if (!win) window.location.href = url;
      if (demo) demo.hidden = true;
      if (sentText) sentText.textContent = cfg.responsePromise || "";
      if (sentHeadline) sentHeadline.textContent = "Thank you. Your request is with our team.";
    } else {
      if (sentHeadline) sentHeadline.textContent = "Preview only. Nothing was sent.";
      if (demo) {
        demo.hidden = false;
        var box = $("[data-demo-text]", demo);
        if (box) box.textContent = message;
        if (sentText) sentText.textContent = "";
      }
    }

    if (sent) {
      var card = form.closest(".form-card");
      if (card) card.classList.add("is-sent");
      form.hidden = true;
      sent.hidden = false;
      sent.focus();
      sent.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
    }

    if (cfg.formEndpoint) {
      try {
        fetch(cfg.formEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: message,
            page: document.body.getAttribute("data-page") || "site",
            source: param("utm_source"),
            campaign: param("utm_campaign"),
            at: new Date().toISOString()
          })
        }).catch(function () {
          /* the human handoff is the primary path; endpoint failures are non-fatal */
        });
      } catch (err) {
        /* the WhatsApp handoff is the primary path; endpoint failures are non-fatal */
      }
    }
  }

  document.addEventListener("submit", handleSubmit);

  /* ---------- link prefills from ad URLs ---------- */

  (function initPrefill() {
    var area = param("area");
    var budget = param("budget");
    if (!area && !budget) return;
    $$("[data-lead-form]").forEach(function (form) {
      if (area && form.elements.area && !form.elements.area.value) form.elements.area.value = area;
      if (budget && form.elements.budget) {
        var match = $$("option", form.elements.budget).some(function (opt) {
          return opt.value === budget;
        });
        if (match) form.elements.budget.value = budget;
      }
    });
  })();

  /* ---------- call buttons ---------- */

  /* ---------- field validation (two-step form) ---------- */

  function digitsOnly(value) {
    return String(value || "").replace(/\D/g, "");
  }

  function validMobile(value) {
    var d = digitsOnly(value);
    if (d.length === 12 && d.slice(0, 2) === "91") d = d.slice(2);
    return /^[6-9]\d{9}$/.test(d);
  }

  function fieldError(form, name, message) {
    var slot = $('[data-error-for="' + name + '"]', form);
    var input = form.elements[name];
    if (slot) {
      slot.textContent = message || "";
      slot.hidden = !message;
    }
    if (input && input.classList && input.type !== "radio") {
      input.classList.toggle("is-invalid", Boolean(message));
    }
    return !message;
  }

  function validateStep(form, index) {
    var step = form.querySelectorAll(".form-step")[index];
    if (!step) return true;
    var valid = true;
    Array.prototype.forEach.call(step.querySelectorAll("input, select, textarea"), function (el) {
      var name = el.getAttribute("name");
      if (!name || el.type === "radio") return;
      var value = (el.value || "").trim();

      if (el.type === "checkbox") {
        if (el.required && !el.checked) {
          valid = fieldError(form, name, "Please tick this so we are allowed to contact you.") && valid;
        } else {
          valid = fieldError(form, name, "") && valid;
        }
        return;
      }
      if (el.required && !value) {
        valid = fieldError(form, name, "This one is needed.") && valid;
        return;
      }
      if (name === "phone" && value && !validMobile(value)) {
        valid = fieldError(form, name, "Enter a 10 digit Indian mobile number.") && valid;
        return;
      }
      valid = fieldError(form, name, "") && valid;
    });
    return valid;
  }

  /* ---------- two-step form ---------- */

  (function initSteps() {
    $$("[data-lead-form]").forEach(function (form) {
      var steps = $$(".form-step", form);
      if (steps.length < 2) return;
      var dots = $$(".steptrack__dot", form);

      function show(index) {
        steps.forEach(function (step, i) {
          step.hidden = i !== index;
          step.classList.toggle("is-active", i === index);
        });
        dots.forEach(function (dot, i) {
          dot.classList.toggle("is-active", i <= index);
        });
      }

      var next = $("[data-step-next]", form);
      var back = $("[data-step-back]", form);
      if (next) {
        next.addEventListener("click", function () {
          if (!validateStep(form, 0)) return;
          show(1);
          var first = steps[1].querySelector("select, input");
          if (first) first.focus({ preventScroll: true });
        });
      }
      if (back) {
        back.addEventListener("click", function () {
          show(0);
        });
      }
      show(0);
    });

    // Mobile number: keep it to 10 digits and space it as they type.
    $$('input[name="phone"]').forEach(function (input) {
      input.addEventListener("input", function () {
        var d = digitsOnly(input.value);
        if (d.length > 10 && d.slice(0, 2) === "91") d = d.slice(2);
        d = d.slice(0, 10);
        input.value = d.length > 5 ? d.slice(0, 5) + " " + d.slice(5) : d;
        if (input.classList.contains("is-invalid") && validMobile(d)) {
          fieldError(input.form, "phone", "");
        }
      });
      input.addEventListener("blur", function () {
        if (input.value) fieldError(input.form, "phone", validMobile(input.value) ? "" : "Enter a 10 digit Indian mobile number.");
      });
    });

    $$('input[name="name"]').forEach(function (input) {
      input.addEventListener("blur", function () {
        if (input.value.trim()) fieldError(input.form, "name", "");
      });
    });
  })();

  /* ---------- EMI preview ---------- */

  (function initEmi() {
    var slider = $("[data-emi-slider]");
    var output = $("[data-emi-out]");
    var valueLabel = $("[data-emi-value]");
    var payLabel = $("[data-emi-pay]");
    var rateInput = $("[data-emi-rate]");
    var yearsInput = $("[data-emi-years]");
    if (!slider || !output) return;

    // The public calculator must not embed the suspended discount. The slider
    // value is used as the price for the illustration.
    var DISCOUNT = 0;
    var DEFAULT_RATE = 8.75;
    var DEFAULT_YEARS = 20;

    function rupees(value) {
      return "\u20B9" + Math.round(value).toLocaleString("en-IN");
    }

    function update() {
      var marketValue = parseFloat(slider.value) || 0;
      var price = marketValue * (1 - DISCOUNT);

      // Paint the filled part of the track.
      var min = parseFloat(slider.min) || 0;
      var max = parseFloat(slider.max) || 100;
      var share = max > min ? (marketValue - min) / (max - min) : 0;
      slider.style.setProperty("--fill", Math.round(share * 100) + "%");

      // Rates and tenure differ person to person, so both are inputs.
      var annualRate = rateInput ? parseFloat(rateInput.value) : DEFAULT_RATE;
      if (!isFinite(annualRate) || annualRate <= 0) annualRate = DEFAULT_RATE;
      annualRate = Math.min(20, Math.max(1, annualRate));

      var years = yearsInput ? parseFloat(yearsInput.value) : DEFAULT_YEARS;
      if (!isFinite(years) || years <= 0) years = DEFAULT_YEARS;

      var monthlyRate = annualRate / 100 / 12;
      var months = Math.round(years * 12);
      var factor = Math.pow(1 + monthlyRate, months);
      var emi = (price * monthlyRate * factor) / (factor - 1);

      if (valueLabel) valueLabel.textContent = rupees(marketValue);
      if (payLabel) payLabel.textContent = rupees(price);
      output.innerHTML = rupees(emi) + '<span class="emi-out__per">/month</span>';
    }

    slider.addEventListener("input", update);
    if (rateInput) rateInput.addEventListener("input", update);
    if (yearsInput) yearsInput.addEventListener("change", update);
    update();
  })();

  /* ---------- district picker ---------- */

  (function initDistricts() {
    var pickers = $$("[data-district-picker]");
    var select = $("[data-district-select]");
    if (!pickers.length && !select) return;
    var chips = [];
    pickers.forEach(function (picker) {
      chips = chips.concat($$(".districtpick__chip", picker));
    });
    var note = $("[data-district-note]");
    var chosen = $("[data-district-chosen]");

    function choose(name) {
      if (!name) return;
      chips.forEach(function (other) {
        other.classList.toggle("is-picked", other.getAttribute("data-district") === name);
      });
      var leadForm = $("[data-lead-form]");
      $$("[data-lead-form]").forEach(function (form) {
        var field = form.elements.district;
        if (!field) return;
        var hasOption = $$("option", field).some(function (option) {
          return option.value === name;
        });
        if (hasOption) field.value = name;
      });
      if (note && chosen) {
        chosen.textContent = name.replace(" (first branch)", "");
        note.hidden = false;
      }

      /* Picking a district is the funnel: take the visitor to the form
         instead of leaving them to find it. A short beat lets the picked
         state render first. Desktop pointer gets focus in the name field;
         touch devices are not forced into the keyboard. */
      if (!leadForm) return;
      var card = leadForm.closest(".form-card") || document.getElementById("callback");
      if (!card) return;
      window.setTimeout(function () {
        var fits = card.getBoundingClientRect().height <= window.innerHeight * 0.75;
        card.scrollIntoView({
          behavior: reduceMotion ? "auto" : "smooth",
          block: fits ? "center" : "start"
        });
        if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
          var first = leadForm.querySelector('input[name="name"]');
          if (first) first.focus({ preventScroll: true });
        }
      }, 140);
    }

    chips.forEach(function (chip) {
      chip.addEventListener("click", function () {
        choose(chip.getAttribute("data-district"));
      });
    });

    if (select) {
      select.addEventListener("change", function () {
        choose(select.value);
      });
    }
  })();

  /* Count-up was removed on purpose. Animating 0 to 100% meant the page
     displayed a false figure ("up to 42% funding") for about a second on every
     load, and this page makes numeric promises. The ribbon now reveals as a
     whole instead. */

  /* ---------- calculator fold, phones only ----------

     The calculator is useful but it is not the funnel, and unfolded it costs a
     full screen of scrolling on a phone. JS adds the classes, so without JS the
     panel simply stays visible. Above 720px the CSS ignores the fold. */

  (function initCalcFold() {
    var section = $("[data-calc]");
    if (!section) return;
    var toggle = $("[data-calc-toggle]", section);
    var label = $("[data-calc-toggle-label]", section);
    if (!toggle) return;
    section.classList.add("is-foldable", "is-collapsed");
    toggle.addEventListener("click", function () {
      var collapsed = section.classList.toggle("is-collapsed");
      toggle.setAttribute("aria-expanded", collapsed ? "false" : "true");
      if (label) label.textContent = collapsed ? "Open the calculator" : "Hide the calculator";
    });
  })();

  /* ---------- reveal sections as they enter ----------

     Content is visible by default. The script only arms elements that start
     below the fold, so a failed script, a headless renderer or reduced motion
     never leaves a section blank. One observer, unhurried ease, small stagger
     per group set in CSS. */

  (function initReveal() {
    var nodes = $$("[data-reveal]");
    if (!nodes.length) return;
    if (!("IntersectionObserver" in window) || reduceMotion) return;

    var viewport = window.innerHeight || 800;
    var armed = [];

    nodes.forEach(function (node) {
      var rect = node.getBoundingClientRect();
      if (rect.top < viewport * 0.92) return;
      node.classList.add("is-armed");
      armed.push(node);
    });

    if (!armed.length) return;

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.remove("is-armed");
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
    );

    armed.forEach(function (node) {
      observer.observe(node);
    });

    // Safety net: after a moment nothing may be left hidden, whatever happens.
    window.setTimeout(function () {
      armed.forEach(function (node) {
        node.classList.remove("is-armed");
      });
    }, 3000);
  })();

  /* ---------- desktop floating call button ---------- */

  (function initFab() {
    var fab = $(".fab");
    if (!fab) return;
    var ticking = false;
    function apply() {
      fab.classList.toggle("is-shown", window.scrollY > window.innerHeight * 0.6);
      ticking = false;
    }
    window.addEventListener(
      "scroll",
      function () {
        if (ticking) return;
        ticking = true;
        window.requestAnimationFrame(apply);
      },
      { passive: true }
    );
    apply();
  })();

  (function initPhone() {
    var digits = String(cfg.phone || "").replace(/\D/g, "");
    var pretty = String(cfg.phone || "").trim();

    $$("[data-phone-text]").forEach(function (el) {
      el.textContent = digits ? "Call or WhatsApp us on " + pretty : "";
      if (!digits) el.hidden = true;
    });

    $$("[data-phone-link]").forEach(function (el) {
      el.href = digits ? "tel:+" + digits : "#lead";
    });

    $$("[data-call-label]").forEach(function (el) {
      // With no number set the button cannot place a call, so it must not
      // promise one. It reads as the second conversion instead: leave a number.
      el.textContent = digits ? "Call now" : "Get a callback";
    });

    var wa = String(cfg.whatsapp || "").replace(/\D/g, "");
    $$("[data-whatsapp-link]").forEach(function (el) {
      if (!wa) {
        // Preview mode: the channel stays visible so the design can be
        // reviewed, but the tap goes to the callback form rather than to a
        // chat that cannot answer.
        el.hidden = false;
        el.href = "#lead";
        return;
      }
      el.hidden = false;
      el.href =
        "https://wa.me/" +
        wa +
        "?text=" +
        encodeURIComponent("Hello CredRoof, I would like to talk about finding a home in the area I choose.");
    });
  })();

  /* ---------- preview label ----------

     The label is written into the page markup so it is visible even without
     JavaScript. It is hidden only when a real contact route exists. */

  (function initPreviewFlag() {
    var flag = $("[data-preview-flag]");
    if (!flag) return;
    var route =
      String(cfg.whatsapp || "").replace(/\D/g, "") || String(cfg.phone || "").replace(/\D/g, "");
    if (route) flag.hidden = true;
  })();

  /* ---------- phone menu ---------- */

  (function initMenu() {
    var openBtn = $("[data-menu-open]");
    var menu = $("[data-menu]");
    if (!openBtn || !menu) return;

    var panel = $(".menu__panel", menu);
    var lastFocus = null;

    function focusables() {
      return $$("a[href], button:not([disabled])", panel);
    }

    function openMenu() {
      lastFocus = document.activeElement;
      menu.hidden = false;
      document.body.classList.add("menu-open");
      openBtn.setAttribute("aria-expanded", "true");
      var first = focusables()[0];
      if (first) first.focus({ preventScroll: true });
    }

    function closeMenu() {
      menu.hidden = true;
      document.body.classList.remove("menu-open");
      openBtn.setAttribute("aria-expanded", "false");
      if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
    }

    openBtn.addEventListener("click", function () {
      if (menu.hidden) openMenu();
      else closeMenu();
    });

    $$("[data-menu-close], [data-menu-link]", menu).forEach(function (el) {
      el.addEventListener("click", closeMenu);
    });

    document.addEventListener("keydown", function (event) {
      if (menu.hidden) return;
      if (event.key === "Escape") {
        closeMenu();
        return;
      }
      if (event.key !== "Tab") return;
      var items = focusables();
      if (!items.length) return;
      var first = items[0];
      var last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });

    // Switching to the desktop layout clears the sheet.
    window.addEventListener("resize", function () {
      if (!menu.hidden && window.innerWidth >= 820) closeMenu();
    });

    // Belt and braces for the pill. The stylesheet hides its call button on
    // phones, but a stale cached stylesheet on iOS can win that fight, so the
    // hidden attribute (display:none !important) is applied here as well.
    var pillCta = $(".navpill__cta");
    if (pillCta) {
      var syncPillCta = function () {
        pillCta.hidden = window.innerWidth < 820;
      };
      syncPillCta();
      window.addEventListener("resize", syncPillCta);
    }
  })();
})();
