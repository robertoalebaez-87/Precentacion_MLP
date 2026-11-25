/**
 * ML Presentation Deck — Scaffold Controller
 * Pure Vanilla JS · Zero dependencies
 */

(() => {
  'use strict';

  // Speaker assignment:
  // Estudiante 1 (Carolina Dorado): Slides 1, 2, 3, 4, 8, 9, 10
  // Estudiante 2 (Roberto Baez): Slides 5, 6
  // Estudiante 3 (Jorge Cifuentes): Slide 7
  const SPEAKERS = {
    1: { label: 'Estudiante 1', name: 'Carolina Dorado', badgeClass: 's1' },
    2: { label: 'Estudiante 2', name: 'Roberto Baez', badgeClass: 's2' },
    3: { label: 'Estudiante 3', name: 'Jorge Cifuentes', badgeClass: 's3' }
  };

  const SLIDES_META = [
    { id: 1, title: 'Presentación', subtitle: 'Portada e integrantes', speaker: 1 },
    { id: 2, title: 'Introducción · MLP', subtitle: 'Conceptos y tareas supervisadas', speaker: 1 },
    { id: 3, title: 'Introducción · Metodología', subtitle: 'Objetivo, optimizadores y validación', speaker: 1 },
    { id: 4, title: 'Problema 3.1 · Clasificación', subtitle: 'Rice Dataset (UCI ID: 545)', speaker: 1 },
    { id: 5, title: 'Clasificación · Datos', subtitle: 'Preprocesamiento y partición estratificada', speaker: 2 },
    { id: 6, title: 'Resultados Experimentales: Clasificación de Arroz (Test Set)', subtitle: 'El modelo ligero C1 + Adam logra la mejor generalización (92.83% Accuracy)', speaker: 2 },
    { id: 7, title: 'Regresión', subtitle: 'Modelos y enfoque', speaker: 3 },
    { id: 8, title: 'Resultados y Análisis', subtitle: 'Métricas y gráficas', speaker: 1 },
    { id: 9, title: 'Conclusiones', subtitle: 'Hallazgos y cierre', speaker: 1 },
    { id: 10, title: 'Bibliografía', subtitle: 'Referencias académicas', speaker: 1 }
  ];

  const TURN_DURATION_SECONDS = 5 * 60; // 5 minutes per student

  // DOM Elements
  const slides = Array.from(document.querySelectorAll('.slide'));
  const progressTrack = document.querySelector('.progress-track');
  const progressFill = document.getElementById('progressFill');
  const slideCounter = document.getElementById('slideCounter');
  const slideSectionName = document.getElementById('slideSectionName');
  const speakerPill = document.getElementById('speakerPill');
  const speakerName = document.getElementById('speakerName');
  const speakerWindow = document.getElementById('speakerWindow');

  const navDotsContainer = document.getElementById('navDots');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');

  const timerPill = document.getElementById('timerPill');
  const timerDisplay = document.getElementById('timerDisplay');
  const timerToggleBtn = document.getElementById('timerToggleBtn');
  const timerResetBtn = document.getElementById('timerResetBtn');

  const themeToggleBtn = document.getElementById('themeToggleBtn');
  const fullscreenBtn = document.getElementById('fullscreenBtn');

  const overviewModal = document.getElementById('overviewModal');
  const overviewGrid = document.getElementById('overviewGrid');
  const openOverviewBtn = document.getElementById('openOverviewBtn');
  const slideCounterBtn = document.getElementById('slideCounterBtn');
  const closeOverviewBtn = document.getElementById('closeOverviewBtn');
  const overviewBackdrop = document.getElementById('overviewBackdrop');

  // State
  let currentSlide = 1;
  let remainingSeconds = TURN_DURATION_SECONDS;
  let timerInterval = null;
  let isTimerRunning = false;
  let timerSpeaker = null;
  let lastFocusedElement = null;

  // =========================================================================
  // Initialization
  // =========================================================================
  function init() {
    restoreTheme();
    buildNavDots();
    buildOverviewGrid();
    bindEvents();

    const initialFromHash = parseSlideFromHash();
    goToSlide(initialFromHash || 1, { updateHash: false });
    renderTimer();
  }

  function parseSlideFromHash() {
    const match = window.location.hash.match(/^#slide-(\d+)$/);
    if (!match) return null;
    const num = Number(match[1]);
    return num >= 1 && num <= slides.length ? num : null;
  }

  // =========================================================================
  // Navigation & Slide Rendering
  // =========================================================================
  function buildNavDots() {
    navDotsContainer.innerHTML = '';
    let prevSpeaker = null;

    SLIDES_META.forEach((meta) => {
      if (prevSpeaker !== null && meta.speaker !== prevSpeaker) {
        const sep = document.createElement('span');
        sep.className = 'nav-dot-sep';
        sep.setAttribute('aria-hidden', 'true');
        navDotsContainer.appendChild(sep);
      }
      prevSpeaker = meta.speaker;

      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'nav-dot';
      dot.dataset.slide = String(meta.id);
      dot.dataset.speaker = String(meta.speaker);
      dot.setAttribute('role', 'tab');
      dot.setAttribute('aria-label', `Diapositiva ${meta.id}: ${meta.title}`);
      dot.title = `${meta.id}. ${meta.title} (${SPEAKERS[meta.speaker].label})`;
      dot.addEventListener('click', () => goToSlide(meta.id));
      navDotsContainer.appendChild(dot);
    });
  }

  function buildOverviewGrid() {
    overviewGrid.innerHTML = '';
    SLIDES_META.forEach((meta) => {
      const speaker = SPEAKERS[meta.speaker];
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'overview-card';
      card.dataset.slide = String(meta.id);
      card.innerHTML = `
        <div class="overview-card-top">
          <span class="mono muted">${String(meta.id).padStart(2, '0')}</span>
          <span class="speaker-badge ${speaker.badgeClass}">${speaker.label}</span>
        </div>
        <div class="overview-card-title">${meta.title}</div>
        <div class="overview-card-desc">${meta.subtitle}</div>
      `;
      card.addEventListener('click', () => {
        goToSlide(meta.id);
        closeOverview();
      });
      overviewGrid.appendChild(card);
    });
  }

  function goToSlide(targetNumber, options = { updateHash: true }) {
    const total = slides.length;
    const clamped = Math.max(1, Math.min(total, targetNumber));
    currentSlide = clamped;

    // Update active slide visibility
    slides.forEach((slideEl) => {
      const num = Number(slideEl.dataset.slide);
      const active = num === currentSlide;
      slideEl.classList.toggle('is-active', active);
      slideEl.setAttribute('aria-hidden', String(!active));
    });

    // Update progress bar & ARIA
    const pct = (currentSlide / total) * 100;
    progressFill.style.width = `${pct}%`;
    progressTrack.setAttribute('aria-valuenow', String(currentSlide));
    progressTrack.setAttribute('aria-valuemax', String(total));

    // Update HUD counter & speaker pill
    const meta = SLIDES_META[currentSlide - 1];
    const speaker = SPEAKERS[meta.speaker];

    progressTrack.dataset.speaker = String(meta.speaker);
    slideCounter.textContent = `${String(currentSlide).padStart(2, '0')} / ${String(total).padStart(2, '0')}`;
    slideSectionName.textContent = meta.title;

    speakerPill.dataset.speaker = String(meta.speaker);
    speakerName.textContent = speaker.label;
    speakerWindow.textContent = speaker.name;

    // Reset the 5-minute turn timer whenever the active speaker block changes
    if (meta.speaker !== timerSpeaker) {
      timerSpeaker = meta.speaker;
      resetTimer();
    }

    // Update navigation buttons & dots
    prevBtn.disabled = currentSlide === 1;
    nextBtn.disabled = currentSlide === total;

    navDotsContainer.querySelectorAll('.nav-dot').forEach((dot) => {
      const active = Number(dot.dataset.slide) === currentSlide;
      dot.classList.toggle('is-active', active);
      dot.setAttribute('aria-selected', String(active));
    });

    overviewGrid.querySelectorAll('.overview-card').forEach((card) => {
      card.classList.toggle('is-current', Number(card.dataset.slide) === currentSlide);
    });

    if (options.updateHash) {
      history.replaceState(null, '', `#slide-${currentSlide}`);
    }
  }

  function nextSlide() {
    if (currentSlide < slides.length) goToSlide(currentSlide + 1);
  }

  function prevSlide() {
    if (currentSlide > 1) goToSlide(currentSlide - 1);
  }

  // =========================================================================
  // 5-Minute Turn Timer (Optional Cronómetro)
  // =========================================================================
  function toggleTimer() {
    if (isTimerRunning) {
      pauseTimer();
    } else {
      startTimer();
    }
  }

  function startTimer() {
    if (isTimerRunning) return;
    if (remainingSeconds <= 0) {
      remainingSeconds = TURN_DURATION_SECONDS;
    }
    isTimerRunning = true;
    timerPill.dataset.running = 'true';
    renderTimer();

    timerInterval = window.setInterval(() => {
      if (remainingSeconds > 0) {
        remainingSeconds -= 1;
        renderTimer();
      } else {
        pauseTimer();
        renderTimer();
      }
    }, 1000);
  }

  function pauseTimer() {
    isTimerRunning = false;
    timerPill.dataset.running = 'false';
    if (timerInterval !== null) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
    renderTimer();
  }

  function resetTimer() {
    pauseTimer();
    remainingSeconds = TURN_DURATION_SECONDS;
    renderTimer();
  }

  function renderTimer() {
    const mins = Math.floor(remainingSeconds / 60);
    const secs = remainingSeconds % 60;
    timerDisplay.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

    if (remainingSeconds === 0) {
      timerPill.dataset.state = 'expired';
    } else if (remainingSeconds <= 60) {
      timerPill.dataset.state = 'warning';
    } else if (isTimerRunning) {
      timerPill.dataset.state = 'running';
    } else {
      timerPill.dataset.state = 'idle';
    }
  }

  // =========================================================================
  // Theme, Fullscreen & Overview Modal
  // =========================================================================
  function restoreTheme() {
    try {
      const saved = localStorage.getItem('ml_deck_theme');
      if (saved === 'light' || saved === 'dark') {
        document.documentElement.setAttribute('data-theme', saved);
      }
    } catch (_) {
      // Ignore storage errors in restricted environments
    }
  }

  function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    try {
      localStorage.setItem('ml_deck_theme', next);
    } catch (_) {
      // Ignore storage errors
    }
  }

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  }

  function openOverview() {
    lastFocusedElement = document.activeElement;
    overviewModal.hidden = false;
    closeOverviewBtn.focus();
  }

  function closeOverview() {
    overviewModal.hidden = true;
    if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') {
      lastFocusedElement.focus();
    }
    lastFocusedElement = null;
  }

  function trapOverviewFocus(e) {
    const focusable = Array.from(
      overviewModal.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
    ).filter((el) => !el.disabled && el.offsetParent !== null);
    if (focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  function isOverviewOpen() {
    return !overviewModal.hidden;
  }

  // =========================================================================
  // Event Listeners (Keyboard, Click, Touch Swipe)
  // =========================================================================
  function bindEvents() {
    prevBtn.addEventListener('click', prevSlide);
    nextBtn.addEventListener('click', nextSlide);

    timerToggleBtn.addEventListener('click', toggleTimer);
    timerResetBtn.addEventListener('click', resetTimer);

    themeToggleBtn.addEventListener('click', toggleTheme);
    fullscreenBtn.addEventListener('click', toggleFullscreen);

    openOverviewBtn.addEventListener('click', openOverview);
    slideCounterBtn.addEventListener('click', openOverview);
    closeOverviewBtn.addEventListener('click', closeOverview);
    overviewBackdrop.addEventListener('click', closeOverview);

    window.addEventListener('hashchange', () => {
      const fromHash = parseSlideFromHash();
      if (fromHash && fromHash !== currentSlide) {
        goToSlide(fromHash, { updateHash: false });
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const tag = e.target?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || e.target?.isContentEditable) return;

      if (e.key === 'Escape' && isOverviewOpen()) {
        e.preventDefault();
        closeOverview();
        return;
      }

      if (isOverviewOpen()) {
        if (e.key === 'Tab') trapOverviewFocus(e);
        return;
      }

      switch (e.key) {
        case 'ArrowRight':
        case 'ArrowDown':
        case 'PageDown':
          e.preventDefault();
          nextSlide();
          break;
        case 'ArrowLeft':
        case 'ArrowUp':
        case 'PageUp':
          e.preventDefault();
          prevSlide();
          break;
        case 'Home':
          e.preventDefault();
          goToSlide(1);
          break;
        case 'End':
          e.preventDefault();
          goToSlide(slides.length);
          break;
        case 'g':
        case 'G':
          e.preventDefault();
          openOverview();
          break;
        case 't':
        case 'T':
          e.preventDefault();
          toggleTheme();
          break;
        case 'f':
        case 'F':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'p':
        case 'P':
          e.preventDefault();
          toggleTimer();
          break;
        case 'r':
        case 'R':
          e.preventDefault();
          resetTimer();
          break;
        default:
          if (/^[1-9]$/.test(e.key)) {
            e.preventDefault();
            goToSlide(Number(e.key));
          } else if (e.key === '0' && slides.length >= 10) {
            e.preventDefault();
            goToSlide(10);
          }
          break;
      }
    });

    // Touch swipe support
    let touchStartX = 0;
    let touchStartY = 0;

    document.addEventListener('touchstart', (e) => {
      if (e.touches.length !== 1) return;
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    }, { passive: true });

    document.addEventListener('touchend', (e) => {
      if (e.changedTouches.length !== 1) return;
      const dx = e.changedTouches[0].clientX - touchStartX;
      const dy = e.changedTouches[0].clientY - touchStartY;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.4) {
        if (dx < 0) nextSlide();
        else prevSlide();
      }
    }, { passive: true });
  }

  init();
})();
