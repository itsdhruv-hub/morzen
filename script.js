/* ==========================================================================
   MORZEN INDUSTRIES — Interactive Engine
   ========================================================================== */

document.documentElement.classList.remove("no-js");

(() => {
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ------------------------------------------------------------------------
     0. Preloader Failsafe / Offline Canvas2D + CSS 3D Engine
     Activates automatically if R3F + GSAP ESM CDN is unavailable or offline.
     ------------------------------------------------------------------------ */
  const preloaderEl = document.getElementById("morzen-preloader");
  if (preloaderEl) {
    setTimeout(() => {
      if (window.__MORZEN_R3F_ACTIVE__) return;

      const host = document.getElementById("preloaderCanvasHost");
      const fallbackEmblem = document.getElementById("preloaderFallbackEmblem");
      const wordmarkWrap = document.getElementById("preloaderWordmarkWrap");
      const ringProgress = document.getElementById("preloaderRingProgress");
      const percentEl = document.getElementById("preloaderPercent");
      const statusEl = document.getElementById("preloaderStatus");
      const skipBtn = document.getElementById("preloaderSkip");

      const canvas = document.createElement("canvas");
      host?.appendChild(canvas);
      const ctx = canvas.getContext("2d");

      function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }
      resizeCanvas();
      window.addEventListener("resize", resizeCanvas, { passive: true });

      const particles = Array.from({ length: 140 }, () => {
        const angle = Math.random() * Math.PI * 2;
        const dist = 160 + Math.random() * Math.max(window.innerWidth, window.innerHeight) * 0.55;
        return {
          angle,
          dist,
          speed: 0.7 + Math.random() * 0.8,
          size: 1.2 + Math.random() * 2.4,
          alpha: 0.4 + Math.random() * 0.6
        };
      });

      const CIRC = 2 * Math.PI * 100;
      const totalMs = prefersReducedMotion ? 450 : 2300;
      const startTime = performance.now();
      let done = false;
      let rafId = 0;

      fallbackEmblem?.classList.add("is-active");

      function finishFallback() {
        if (done) return;
        done = true;
        cancelAnimationFrame(rafId);
        window.removeEventListener("resize", resizeCanvas);
        preloaderEl.classList.add("is-glowing");
        document.body.classList.remove("is-preloading");
        setTimeout(() => {
          preloaderEl.classList.add("is-done");
          setTimeout(() => preloaderEl.remove(), 850);
        }, 240);
      }

      skipBtn?.addEventListener("click", () => {
        if (percentEl) percentEl.textContent = "100%";
        if (ringProgress) ringProgress.style.strokeDashoffset = "0";
        wordmarkWrap?.classList.add("is-revealed");
        finishFallback();
      });

      function tick(now) {
        if (done) return;
        const elapsed = now - startTime;
        const t = Math.min(1, elapsed / totalMs);
        const eased = 1 - Math.pow(1 - t, 2.5);
        const pct = Math.min(100, Math.round(eased * 100));

        if (percentEl) percentEl.textContent = `${pct}%`;
        if (ringProgress) ringProgress.style.strokeDashoffset = String(CIRC * (1 - pct / 100));

        if (pct >= 35 && statusEl && !fallbackEmblem?.classList.contains("is-sweeping")) {
          statusEl.textContent = "ASSEMBLING METALLIC SEAL";
          fallbackEmblem?.classList.add("is-sweeping");
        }
        if (pct >= 72 && wordmarkWrap && !wordmarkWrap.classList.contains("is-revealed")) {
          if (statusEl) statusEl.textContent = "MORZEN INDUSTRIES";
          wordmarkWrap.classList.add("is-revealed");
        }

        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          const cx = canvas.width / 2;
          const cy = canvas.height / 2 - 44;
          for (const p of particles) {
            const prog = Math.min(1, eased * p.speed * 1.15);
            const r = p.dist * (1 - prog * 0.78);
            const a = p.angle + (1 - prog) * 1.4;
            const x = cx + Math.cos(a) * r;
            const y = cy + Math.sin(a) * r * 0.78;
            ctx.beginPath();
            ctx.arc(x, y, p.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(239, 196, 99, ${(p.alpha * (0.35 + prog * 0.65)).toFixed(2)})`;
            ctx.fill();
          }
        }

        if (t < 1) {
          rafId = requestAnimationFrame(tick);
        } else {
          finishFallback();
        }
      }

      rafId = requestAnimationFrame(tick);
    }, 450);
  }

  /* ------------------------------------------------------------------------
     1. Footer Year & Toast Helper
     ------------------------------------------------------------------------ */
  const yearNow = document.getElementById("yearNow");
  if (yearNow) yearNow.textContent = new Date().getFullYear();

  const toast = document.getElementById("toast");
  const toastText = document.getElementById("toastText");
  let toastTimer = null;

  function showToast(message) {
    if (!toast || !toastText) return;
    toastText.textContent = message;
    toast.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 2400);
  }

  /* ------------------------------------------------------------------------
     2. Navbar Scroll State, Progress Bar & Active Section Highlight
     ------------------------------------------------------------------------ */
  const navbar = document.getElementById("navbar");
  const scrollProgressBar = document.getElementById("scrollProgressBar");
  const navLinks = Array.from(document.querySelectorAll(".nav-link"));
  const sections = Array.from(document.querySelectorAll("main section[id]"));
  const revealEls = Array.from(document.querySelectorAll(".reveal-up"));
  const counterEls = Array.from(document.querySelectorAll(".counter"));

  function animateCounter(el) {
    if (el.dataset.counted === "1") return;
    el.dataset.counted = "1";
    const target = Number(el.dataset.target || 0);
    if (prefersReducedMotion) {
      el.textContent = String(target);
      return;
    }
    const duration = 950;
    const start = performance.now();
    function tick(now) {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = String(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  function revealVisibleInViewport() {
    const vh = window.innerHeight || 900;
    revealEls.forEach((el) => {
      if (el.classList.contains("is-visible")) return;
      const rect = el.getBoundingClientRect();
      if (rect.top <= vh * 0.96) {
        el.classList.add("is-visible");
        el.querySelectorAll(".counter").forEach(animateCounter);
      }
    });
    counterEls.forEach((el) => {
      if (el.dataset.counted === "1") return;
      if (el.getBoundingClientRect().top <= vh * 0.96) {
        animateCounter(el);
      }
    });
  }

  function onScroll() {
    const y = window.scrollY;
    if (navbar) {
      navbar.classList.toggle("is-scrolled", y > 28);
    }
    if (scrollProgressBar) {
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const pct = docHeight > 0 ? Math.min(100, (y / docHeight) * 100) : 0;
      scrollProgressBar.style.width = `${pct.toFixed(2)}%`;
    }

    // Active nav link tracking
    let activeId = "";
    const triggerY = y + 140;
    for (const sec of sections) {
      if (triggerY >= sec.offsetTop) {
        activeId = sec.id;
      }
    }
    navLinks.forEach((link) => {
      const target = link.getAttribute("href")?.replace("#", "");
      link.classList.toggle("is-active", target === activeId);
    });

    revealVisibleInViewport();
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("hashchange", () => setTimeout(onScroll, 60));
  window.addEventListener("load", () => {
    if (window.location.hash) {
      const target = document.querySelector(window.location.hash);
      if (target) {
        document.documentElement.style.scrollBehavior = "auto";
        window.scrollTo(0, Math.max(0, target.offsetTop - 76));
        document.documentElement.style.scrollBehavior = "";
      }
    }
    onScroll();
  });
  onScroll();

  /* ------------------------------------------------------------------------
     3. Mobile Navigation Drawer
     ------------------------------------------------------------------------ */
  const hamburgerBtn = document.getElementById("hamburgerBtn");
  const mobileDrawer = document.getElementById("mobileDrawer");
  const drawerBackdrop = document.getElementById("drawerBackdrop");
  const drawerCloseBtn = document.getElementById("drawerCloseBtn");
  const mobileNavLinks = Array.from(document.querySelectorAll(".mobile-nav-link"));

  function setDrawerOpen(open) {
    if (!mobileDrawer || !hamburgerBtn) return;
    mobileDrawer.classList.toggle("is-open", open);
    mobileDrawer.setAttribute("aria-hidden", String(!open));
    hamburgerBtn.setAttribute("aria-expanded", String(open));
    document.body.style.overflow = open ? "hidden" : "";
  }

  hamburgerBtn?.addEventListener("click", () => setDrawerOpen(true));
  drawerBackdrop?.addEventListener("click", () => setDrawerOpen(false));
  drawerCloseBtn?.addEventListener("click", () => setDrawerOpen(false));
  mobileNavLinks.forEach((link) => link.addEventListener("click", () => setDrawerOpen(false)));

  /* ------------------------------------------------------------------------
     4. Hero Video Toggle & Ambient Gold Mote Particles
     ------------------------------------------------------------------------ */
  const heroVideo = document.getElementById("heroVideo");
  const videoToggleBtn = document.getElementById("videoToggleBtn");
  const videoToggleIcon = document.getElementById("videoToggleIcon");
  const videoToggleLabel = document.getElementById("videoToggleLabel");

  if (heroVideo && videoToggleBtn) {
    if (prefersReducedMotion) {
      heroVideo.pause();
      if (videoToggleIcon) videoToggleIcon.textContent = "▶";
      if (videoToggleLabel) videoToggleLabel.textContent = "Motion Paused";
    }

    videoToggleBtn.addEventListener("click", () => {
      if (heroVideo.paused) {
        heroVideo.play().catch(() => {});
        videoToggleIcon.textContent = "❚❚";
        videoToggleLabel.textContent = "Motion On";
        videoToggleBtn.setAttribute("aria-label", "Pause background video");
      } else {
        heroVideo.pause();
        videoToggleIcon.textContent = "▶";
        videoToggleLabel.textContent = "Motion Off";
        videoToggleBtn.setAttribute("aria-label", "Play background video");
      }
    });
  }

  const heroParticles = document.getElementById("heroParticles");
  if (heroParticles && !prefersReducedMotion) {
    const moteCount = window.innerWidth < 640 ? 12 : 24;
    for (let i = 0; i < moteCount; i += 1) {
      const mote = document.createElement("span");
      mote.className = "mote";
      const size = (Math.random() * 3.5 + 1.8).toFixed(1);
      mote.style.width = `${size}px`;
      mote.style.height = `${size}px`;
      mote.style.left = `${(Math.random() * 100).toFixed(1)}%`;
      mote.style.top = `${(Math.random() * 90 + 10).toFixed(1)}%`;
      mote.style.animationDuration = `${(Math.random() * 8 + 7).toFixed(1)}s`;
      mote.style.animationDelay = `${(Math.random() * -12).toFixed(1)}s`;
      heroParticles.appendChild(mote);
    }
  }

  /* ------------------------------------------------------------------------
     5. IntersectionObserver: Scroll Reveals & KPI Counters
     ------------------------------------------------------------------------ */
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            entry.target.querySelectorAll(".counter").forEach(animateCounter);
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -20px 0px" }
    );
    revealEls.forEach((el) => io.observe(el));

    const counterIo = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            animateCounter(entry.target);
            counterIo.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.25 }
    );
    counterEls.forEach((el) => counterIo.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("is-visible"));
    counterEls.forEach(animateCounter);
  }

  /* ------------------------------------------------------------------------
     6. Hover Physics: Spotlight Cards, 3D Tilt & Magnetic Buttons
     ------------------------------------------------------------------------ */
  if (!prefersReducedMotion && window.matchMedia("(pointer: fine)").matches) {
    document.querySelectorAll(".spotlight-card").forEach((card) => {
      card.addEventListener("mousemove", (e) => {
        const rect = card.getBoundingClientRect();
        card.style.setProperty("--mx", `${e.clientX - rect.left}px`);
        card.style.setProperty("--my", `${e.clientY - rect.top}px`);
      });
    });

    document.querySelectorAll("[data-tilt]").forEach((card) => {
      card.addEventListener("mousemove", (e) => {
        const rect = card.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        card.style.transform = `perspective(900px) rotateX(${(-y * 7).toFixed(2)}deg) rotateY(${(x * 8).toFixed(2)}deg) translateY(-4px)`;
      });
      card.addEventListener("mouseleave", () => {
        card.style.transform = "";
      });
    });

    document.querySelectorAll(".magnetic").forEach((btn) => {
      btn.addEventListener("mousemove", (e) => {
        const rect = btn.getBoundingClientRect();
        const dx = (e.clientX - (rect.left + rect.width / 2)) * 0.16;
        const dy = (e.clientY - (rect.top + rect.height / 2)) * 0.22;
        btn.style.transform = `translate(${dx.toFixed(1)}px, ${dy.toFixed(1)}px)`;
      });
      btn.addEventListener("mouseleave", () => {
        btn.style.transform = "";
      });
    });
  }

  /* ------------------------------------------------------------------------
     7. Product Filter Chips & Dock Jump
     ------------------------------------------------------------------------ */
  const filterChips = Array.from(document.querySelectorAll(".filter-chip"));
  const productCards = Array.from(document.querySelectorAll(".product-card"));

  function applyProductFilter(filter) {
    filterChips.forEach((c) => c.classList.toggle("is-active", c.dataset.filter === filter));
    productCards.forEach((card) => {
      const match = filter === "all" || card.dataset.category === filter;
      card.classList.toggle("is-hidden", !match);
    });
  }

  filterChips.forEach((chip) => {
    chip.addEventListener("click", () => applyProductFilter(chip.dataset.filter || "all"));
  });

  document.querySelectorAll("[data-jump-category]").forEach((dockLink) => {
    dockLink.addEventListener("click", () => {
      applyProductFilter("all");
    });
  });

  /* ------------------------------------------------------------------------
     8. Product Technical Specification Modal
     ------------------------------------------------------------------------ */
  const PRODUCT_DATA = {
    fasteners: {
      badge: "DIV // 01 · FASTENERS",
      eyebrow: "DIN · ISO · ASTM · BS & CUSTOM FABRICATION",
      title: "Industrial Fasteners",
      image: "gallery/fasteners-hero.jpg",
      desc: "High-integrity industrial fasteners supplied across austenitic stainless, high-tensile structural, duplex, and alloy steel grades for heavy engineering, process plants, and structural fabrication.",
      items: ["Hex Bolts", "Nuts", "Allen Cap Screws", "Washers", "Studs"],
      meta: [
        "Grades: SS 304, SS 316, SS 316L",
        "High-Tensile: 8.8, 10.9, 12.9",
        "Specialty: Duplex Steel & Alloy Steel",
        "Standards: DIN, ISO, ASTM, BS",
        "Customized fabrication to print"
      ],
      rfqCategory: "Fasteners"
    },
    fittings: {
      badge: "DIV // 02 · FITTINGS",
      eyebrow: "PRECISION FLUID POWER & INSTRUMENTATION",
      title: "Hydraulic & Stainless Steel Fittings",
      image: "gallery/fittings-hero.jpg",
      desc: "Precision-machined hydraulic adapters, crimp terminations, stainless steel fittings, and hydraulic pipe fittings engineered to maintain seal integrity under thermal cycling and pressure spikes.",
      items: ["Hydraulic Adapters", "Crimp Fittings", "Stainless Steel Fittings", "Hydraulic Pipe Fittings"],
      meta: [
        "CNC machined metallic sealing cones",
        "SS 304 / SS 316 / Carbon & Alloy finishes",
        "Vibration-resistant thread engagement",
        "Compatible with high-pressure hydraulic lines"
      ],
      rfqCategory: "Fittings"
    },
    connectors: {
      badge: "DIV // 03 · CONNECTORS",
      eyebrow: "HIGH-PRESSURE HYDRAULIC & PNEUMATIC SEALING",
      title: "Industrial Connectors & Couplings",
      image: "gallery/connectors-hero.jpg",
      desc: "Designed for high-pressure hydraulic and pneumatic systems requiring leak-proof, precision-engineered sealing, rapid tool-free line changeovers, and minimal pressure drop.",
      items: ["Hydraulic Connectors", "Pneumatic Connectors", "Quick-Disconnect Couplings", "Industrial Connectors"],
      meta: [
        "Application: High-pressure hydraulic & pneumatic systems",
        "Leak-proof, precision-engineered sealing",
        "Positive ball-lock quick-disconnect sleeves",
        "High impulse & burst pressure durability"
      ],
      rfqCategory: "Connectors"
    },
    frp: {
      badge: "DIV // 04 · FRP CABLE TRAYS",
      eyebrow: "PULTRUDED FIBERGLASS REINFORCED PLASTIC",
      title: "FRP Cable Trays & Profiles",
      image: "gallery/frp-trays-hero.jpg",
      desc: "Lightweight, corrosion-resistant, fire-retardant Fiberglass Reinforced Plastic (FRP) cable management and structural support systems built for chemical, coastal, power, and pharmaceutical plants.",
      items: ["Ladder-Type Cable Trays", "Perforated Cable Trays", "Strut Support Profiles"],
      meta: [
        "Fiberglass Reinforced Plastic composition",
        "100% Corrosion-resistant in acid/alkali zones",
        "Fire-retardant & electrically non-conductive",
        "Lightweight for fast elevated installation"
      ],
      rfqCategory: "FRP Cable Trays & Profiles"
    }
  };

  const specModal = document.getElementById("specModal");
  const specModalBackdrop = document.getElementById("specModalBackdrop");
  const specModalClose = document.getElementById("specModalClose");
  const specModalImg = document.getElementById("specModalImg");
  const specModalBadge = document.getElementById("specModalBadge");
  const specModalEyebrow = document.getElementById("specModalEyebrow");
  const specModalTitle = document.getElementById("specModalTitle");
  const specModalDesc = document.getElementById("specModalDesc");
  const specModalItems = document.getElementById("specModalItems");
  const specModalMeta = document.getElementById("specModalMeta");
  const specModalQuoteBtn = document.getElementById("specModalQuoteBtn");
  let activeModalCategory = "Fasteners";

  function openSpecModal(key) {
    const data = PRODUCT_DATA[key];
    if (!data || !specModal) return;
    activeModalCategory = data.rfqCategory;
    specModalImg.src = data.image;
    specModalImg.alt = data.title;
    specModalBadge.textContent = data.badge;
    specModalEyebrow.textContent = data.eyebrow;
    specModalTitle.textContent = data.title;
    specModalDesc.textContent = data.desc;
    specModalItems.innerHTML = data.items.map((item) => `<li>${item}</li>`).join("");
    specModalMeta.innerHTML = data.meta.map((item) => `<li>${item}</li>`).join("");
    specModal.hidden = false;
    document.body.style.overflow = "hidden";
  }

  function closeSpecModal() {
    if (!specModal) return;
    specModal.hidden = true;
    document.body.style.overflow = "";
  }

  document.querySelectorAll(".open-spec-btn").forEach((btn) => {
    btn.addEventListener("click", () => openSpecModal(btn.dataset.product));
  });

  specModalBackdrop?.addEventListener("click", closeSpecModal);
  specModalClose?.addEventListener("click", closeSpecModal);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (specModal && !specModal.hidden) closeSpecModal();
      if (mobileDrawer?.classList.contains("is-open")) setDrawerOpen(false);
    }
  });

  specModalQuoteBtn?.addEventListener("click", () => {
    closeSpecModal();
    preselectRfqCategory(activeModalCategory);
    document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" });
  });

  /* ------------------------------------------------------------------------
     9. Interactive Metallurgy & Standards Configurator
     ------------------------------------------------------------------------ */
  const GRADE_DATA = {
    ss304: {
      code: "AUSTENITIC STAINLESS · GRADE 304",
      title: "SS 304 — All-Purpose Corrosion Resistance",
      std: "DIN / ISO / ASTM",
      desc: "18-8 chromium-nickel austenitic stainless steel delivering clean oxidation resistance, weldability, and dependable mechanical strength across general industrial assemblies, Hex Bolts, Nuts, Washers, and Struts.",
      corr: 84,
      tens: 76,
      env: 80,
      fit: "Hex Bolts, Nuts, Allen Cap Screws, Washers, Studs & General Process Piping",
      rfq: "SS 304 Grade Components"
    },
    ss316: {
      code: "MARINE-GRADE STAINLESS · GRADE 316",
      title: "SS 316 — Molybdenum Chloride Protection",
      std: "DIN / ISO / ASTM / BS",
      desc: "Molybdenum-alloyed stainless steel engineered for superior pitting and crevice corrosion resistance in coastal, chemical, pharmaceutical, and high-pressure hydraulic environments.",
      corr: 94,
      tens: 79,
      env: 92,
      fit: "Stainless Steel Fittings, Hydraulic Adapters, Marine & Chemical Fasteners",
      rfq: "SS 316 Grade Components"
    },
    ss316l: {
      code: "LOW-CARBON STAINLESS · GRADE 316L",
      title: "SS 316L — Ultra-Pure Weld & Acid Stability",
      std: "ASTM / DIN / ISO",
      desc: "Extra-low carbon variant of 316 minimizing carbide precipitation during heavy fabrication and welding, ideal for corrosive fluid transfer lines and cleanroom process equipment.",
      corr: 96,
      tens: 77,
      env: 95,
      fit: "Welded Studs, Sanitary & Chemical Fittings, High-Purity Fluid Connectors",
      rfq: "SS 316L Grade Components"
    },
    ht: {
      code: "HIGH-TENSILE STRUCTURAL · 8.8 / 10.9 / 12.9",
      title: "High-Tensile (8.8, 10.9, 12.9) — Extreme Shear & Torque",
      std: "DIN 931 / 933 / 912 · ISO 898-1",
      desc: "Quenched and tempered medium-carbon & alloy structural fasteners built for heavy machinery, cranes, flanged high-pressure joints, and high-vibration torque loads.",
      corr: 68,
      tens: 98,
      env: 86,
      fit: "Allen Cap Screws, Heavy Hex Bolts, Structural Studs & High-Load Flanges",
      rfq: "High-Tensile (8.8 / 10.9 / 12.9) Fasteners"
    },
    duplex: {
      code: "FERRITIC-AUSTENITIC · DUPLEX STEEL",
      title: "Duplex Steel — Dual Strength & Stress-Corrosion Defense",
      std: "ASTM A182 / A276 · DIN",
      desc: "Combines roughly twice the yield strength of standard austenitic stainless with exceptional resistance to chloride stress-corrosion cracking in oil, gas, and offshore service.",
      corr: 98,
      tens: 95,
      env: 98,
      fit: "High-Pressure Studs, Offshore Hydraulic Couplings & Severe Chemical Plants",
      rfq: "Duplex Steel Components"
    },
    alloy: {
      code: "HEAT-TREATED CHROME-MOLY · ALLOY STEEL",
      title: "Alloy Steel — High-Temperature & Fatigue Endurance",
      std: "ASTM A193 B7 / B16 · BS",
      desc: "Chromium-molybdenum alloy steel designed for sustained elevated temperature, pressure vessel bolting, and heavy hydraulic manifolds requiring high creep resistance.",
      corr: 72,
      tens: 96,
      env: 90,
      fit: "Refinery Flange Studs, Heavy Hydraulic Adapters & Industrial Connectors",
      rfq: "Alloy Steel Fasteners & Fittings"
    },
    frp: {
      code: "PULTRUDED COMPOSITE · FIBERGLASS REINFORCED PLASTIC",
      title: "FRP Composite — Corrosion-Proof, Fire-Retardant & Light",
      std: "CUSTOM FABRICATION & INDUSTRIAL SPEC",
      desc: "Fiberglass Reinforced Plastic matrix engineered for zero rust, electrical insulation, flame retardancy, and effortless high-span installation in corrosive process zones.",
      corr: 100,
      tens: 82,
      env: 97,
      fit: "Ladder-Type Cable Trays, Perforated Cable Trays & Strut Support Profiles",
      rfq: "FRP Cable Trays & Profiles"
    }
  };

  const gradeButtons = Array.from(document.querySelectorAll(".grade-pill"));
  const gradeCode = document.getElementById("gradeCode");
  const gradeTitle = document.getElementById("gradeTitle");
  const gradeStandard = document.getElementById("gradeStandard");
  const gradeDesc = document.getElementById("gradeDesc");
  const mCorrVal = document.getElementById("mCorrVal");
  const mCorrBar = document.getElementById("mCorrBar");
  const mTensVal = document.getElementById("mTensVal");
  const mTensBar = document.getElementById("mTensBar");
  const mEnvVal = document.getElementById("mEnvVal");
  const mEnvBar = document.getElementById("mEnvBar");
  const gradeFit = document.getElementById("gradeFit");
  const gradeRfqBtn = document.getElementById("gradeRfqBtn");

  gradeButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const g = GRADE_DATA[btn.dataset.grade];
      if (!g) return;
      gradeButtons.forEach((b) => b.classList.toggle("is-active", b === btn));
      gradeCode.textContent = g.code;
      gradeTitle.textContent = g.title;
      gradeStandard.textContent = g.std;
      gradeDesc.textContent = g.desc;
      mCorrVal.textContent = `${g.corr}%`;
      mCorrBar.style.width = `${g.corr}%`;
      mTensVal.textContent = `${g.tens}%`;
      mTensBar.style.width = `${g.tens}%`;
      mEnvVal.textContent = `${g.env}%`;
      mEnvBar.style.width = `${g.env}%`;
      gradeFit.textContent = g.fit;
      if (gradeRfqBtn) gradeRfqBtn.dataset.rfqTrigger = g.rfq;
    });
  });

  /* ------------------------------------------------------------------------
     10. Copy-to-Clipboard Buttons
     ------------------------------------------------------------------------ */
  document.querySelectorAll("[data-copy]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const value = btn.dataset.copy;
      if (!value) return;
      try {
        await navigator.clipboard.writeText(value);
        showToast(`Copied: ${value}`);
      } catch {
        showToast(value);
      }
    });
  });

  /* ------------------------------------------------------------------------
     11. RFQ Builder, Pre-Selection, Email & WhatsApp Dispatch
     ------------------------------------------------------------------------ */
  const rfqForm = document.getElementById("rfqForm");
  const rfqSpecs = document.getElementById("rfqSpecs");
  const rfqConfirmation = document.getElementById("rfqConfirmation");
  const rfqConfirmationMsg = document.getElementById("rfqConfirmationMsg");
  const sendWhatsappBtn = document.getElementById("sendWhatsappBtn");

  function preselectRfqCategory(label) {
    const checkboxes = Array.from(document.querySelectorAll('#rfqChips input[type="checkbox"]'));
    const lower = label.toLowerCase();
    let matched = false;
    checkboxes.forEach((cb) => {
      if (lower.includes(cb.value.toLowerCase()) || cb.value.toLowerCase().includes(lower)) {
        cb.checked = true;
        matched = true;
      }
    });
    if (!matched && rfqSpecs && !rfqSpecs.value.includes(label)) {
      rfqSpecs.value = `Inquiry regarding: ${label}\n${rfqSpecs.value}`.trim();
    }
  }

  document.querySelectorAll("[data-rfq-trigger]").forEach((trigger) => {
    trigger.addEventListener("click", () => {
      const label = trigger.dataset.rfqTrigger;
      if (label && label !== "General Inquiry" && label !== "General Industrial Quote") {
        preselectRfqCategory(label);
      }
    });
  });

  function buildRfqPayload() {
    const name = document.getElementById("rfqName")?.value.trim() || "";
    const company = document.getElementById("rfqCompany")?.value.trim() || "Not specified";
    const contact = document.getElementById("rfqContact")?.value.trim() || "";
    const grade = document.getElementById("rfqGrade")?.value || "";
    const specs = rfqSpecs?.value.trim() || "Please share catalog & quotation.";
    const cats = Array.from(document.querySelectorAll('#rfqChips input:checked')).map((c) => c.value);

    if (!name || !contact) {
      showToast("Please enter your name and phone or email.");
      return null;
    }

    const body = [
      "RFQ Inquiry — Morzen Industries",
      `Name: ${name}`,
      `Company: ${company}`,
      `Contact: ${contact}`,
      `Categories: ${cats.length ? cats.join(", ") : "General"}`,
      `Grade / Standard: ${grade}`,
      `Specifications: ${specs}`
    ].join("\n");

    return { name, cats, body };
  }

  rfqForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    const payload = buildRfqPayload();
    if (!payload) return;

    const subject = encodeURIComponent(`RFQ Inquiry (${payload.cats.join(", ") || "Industrial Supply"}) — ${payload.name}`);
    const body = encodeURIComponent(payload.body);
    window.location.href = `mailto:morzen.industries@gmail.com?subject=${subject}&body=${body}`;

    if (rfqConfirmation && rfqConfirmationMsg) {
      rfqConfirmation.hidden = false;
      rfqConfirmationMsg.textContent = `Opening your mail client to send this inquiry to morzen.industries@gmail.com. You can also reach Neel Mistry directly at +91 90338 68727.`;
    }
    showToast("Opening Email Inquiry for Morzen Industries");
  });

  sendWhatsappBtn?.addEventListener("click", () => {
    const payload = buildRfqPayload();
    if (!payload) return;

    const waUrl = `https://wa.me/919033868727?text=${encodeURIComponent(payload.body)}`;
    window.open(waUrl, "_blank", "noopener,noreferrer");

    if (rfqConfirmation && rfqConfirmationMsg) {
      rfqConfirmation.hidden = false;
      rfqConfirmationMsg.textContent = "WhatsApp inquiry prepared for Neel Mistry (+91 90338 68727).";
    }
    showToast("Launching WhatsApp Inquiry");
  });
})();
