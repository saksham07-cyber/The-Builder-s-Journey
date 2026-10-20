/**
 * @license
 * The Builder's Journey — Sundar Pichai Showcase
 * Modern, Interactive JavaScript Engine
 * Includes:
 * 1. 3D Canvas Particle Intro Animation with typography assembly, mouse physics, and dissolve
 * 2. Interactive Photo Gallery with CSS Grid, hover-to-zoom, filtering, and Lightbox modal
 * 3. Dynamic Career Timeline with filter & accordion interactions
 * 4. Dynamic Ventures & Products cards
 * 5. Animated KPI Metric Counters and ScrollSpy navigation
 */

document.addEventListener('DOMContentLoaded', () => {
  // State flags
  let countersAnimated = false;

  // ========================================================================
  // 1. Cinematic 3D Canvas Particle Intro Animation
  // ========================================================================
  const introOverlay = document.getElementById('particle-intro');
  const introCanvas = document.getElementById('intro-canvas');
  const skipHintBtn = document.getElementById('intro-skip-hint');

  let particleAnimationId = null;
  let particles = [];
  let mouse = { x: -9999, y: -9999, radius: 90 };
  let introStartTime = 0;
  let isDissolving = false;
  let introActive = false;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function initParticleIntro(forceReplay = false) {
    if (!introOverlay || !introCanvas) return;

    // Check if user already saw the intro during this session
    const alreadySeen = sessionStorage.getItem('builders_journey_intro_seen');
    if (alreadySeen && !forceReplay) {
      dismissIntroImmediate();
      return;
    }

    if (prefersReducedMotion && !forceReplay) {
      dismissIntroImmediate();
      return;
    }

    introActive = true;
    isDissolving = false;
    introOverlay.classList.remove('dismissed');
    introOverlay.style.opacity = '1';
    introOverlay.style.visibility = 'visible';
    document.body.style.overflow = 'hidden';

    const ctx = introCanvas.getContext('2d');
    let width = introCanvas.width = window.innerWidth;
    let height = introCanvas.height = window.innerHeight;

    // Build target text coordinates on offscreen canvas
    function sampleTextCoordinates() {
      const offCanvas = document.createElement('canvas');
      const offCtx = offCanvas.getContext('2d');
      offCanvas.width = width;
      offCanvas.height = height;

      offCtx.fillStyle = '#FFFFFF';
      offCtx.textAlign = 'center';
      offCtx.textBaseline = 'middle';

      // Responsive font sizing and lines
      const isMobile = width < 768;
      let fontSize = isMobile ? Math.min(width * 0.088, 42) : Math.min(width * 0.065, 78);
      offCtx.font = `800 ${fontSize}px 'Plus Jakarta Sans', sans-serif`;

      if (isMobile) {
        offCtx.fillText("THE BUILDER'S", width / 2, height / 2 - fontSize * 0.7);
        offCtx.fillText("JOURNEY", width / 2, height / 2 + fontSize * 0.7);
      } else {
        offCtx.fillText("THE BUILDER’S JOURNEY", width / 2, height / 2);
      }

      const imgData = offCtx.getImageData(0, 0, width, height).data;
      const points = [];
      const density = isMobile ? 4 : 5;

      for (let y = 0; y < height; y += density) {
        for (let x = 0; x < width; x += density) {
          const index = (y * width + x) * 4;
          if (imgData[index + 3] > 140) {
            points.push({ x, y });
          }
        }
      }
      return points;
    }

    const textTargets = sampleTextCoordinates();
    particles = [];

    // Particle color palette: warm amber, bright gold, soft ivory, copper
    const particleColors = [
      '245, 158, 11',  // Amber #F59E0B
      '251, 191, 36',  // Gold #FBBF24
      '254, 243, 199', // Ivory #FEF3C7
      '217, 119, 6',   // Copper #D97706
      '255, 255, 255'  // Crisp white glimmer
    ];

    textTargets.forEach((target, i) => {
      // Spawn in cosmic ambient distribution
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * Math.max(width, height) * 0.75 + 100;
      const originX = width / 2 + Math.cos(angle) * dist;
      const originY = height / 2 + Math.sin(angle) * dist;

      particles.push({
        x: originX,
        y: originY,
        z: Math.random() * 2 + 0.5,
        targetX: target.x,
        targetY: target.y,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        size: Math.random() * 1.8 + 1.2,
        color: particleColors[i % particleColors.length],
        alpha: Math.random() * 0.4 + 0.6,
        phase: Math.random() * Math.PI * 2,
        speedFactor: Math.random() * 0.04 + 0.05
      });
    });

    introStartTime = performance.now();

    function render(currentTime) {
      if (!introActive) return;
      const elapsed = currentTime - introStartTime;

      ctx.fillStyle = 'rgba(6, 11, 23, 0.28)';
      ctx.fillRect(0, 0, width, height);

      // Phase timing:
      // 0 - 1800ms: ambient gathering
      // 1800ms - 4600ms: text assembly
      // 4600ms - 6200ms: hold & breathe
      // > 6200ms: dissolve
      if (elapsed > 6200 && !isDissolving) {
        dissolveIntro();
      }

      particles.forEach(p => {
        if (!isDissolving) {
          if (elapsed < 1800) {
            // Ambient drift towards center
            p.x += p.vx + Math.sin(elapsed * 0.002 + p.phase) * 0.5;
            p.y += p.vy + Math.cos(elapsed * 0.002 + p.phase) * 0.5;
          } else {
            // Spring force towards text target
            const dx = p.targetX - p.x;
            const dy = p.targetY - p.y;
            p.vx = p.vx * 0.88 + dx * p.speedFactor;
            p.vy = p.vy * 0.88 + dy * p.speedFactor;
            p.x += p.vx;
            p.y += p.vy;
          }

          // Mouse interactive repulsion
          const mdx = p.x - mouse.x;
          const mdy = p.y - mouse.y;
          const mDist = Math.hypot(mdx, mdy);
          if (mDist < mouse.radius && mDist > 0) {
            const force = (mouse.radius - mDist) / mouse.radius;
            p.x += (mdx / mDist) * force * 14;
            p.y += (mdy / mDist) * force * 14;
          }
        } else {
          // Dissolve outward in 3D
          p.x += (p.vx + (p.x - width / 2) * 0.04) * 1.2;
          p.y += (p.vy + (p.y - height / 2) * 0.04) * 1.2;
          p.alpha *= 0.94;
        }

        // Draw particle
        ctx.beginPath();
        const drawSize = isDissolving ? p.size * 1.4 : p.size + Math.sin(elapsed * 0.005 + p.phase) * 0.4;
        ctx.arc(p.x, p.y, Math.max(0.5, drawSize), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.color}, ${p.alpha})`;
        ctx.fill();
      });

      particleAnimationId = requestAnimationFrame(render);
    }

    if (particleAnimationId) cancelAnimationFrame(particleAnimationId);
    particleAnimationId = requestAnimationFrame(render);
  }

  function dissolveIntro() {
    if (isDissolving) return;
    isDissolving = true;
    sessionStorage.setItem('builders_journey_intro_seen', 'true');

    if (introOverlay) {
      introOverlay.style.transition = 'opacity 750ms cubic-bezier(0.16, 1, 0.3, 1)';
      introOverlay.style.opacity = '0';
      setTimeout(() => {
        dismissIntroImmediate();
      }, 750);
    }
  }

  function dismissIntroImmediate() {
    introActive = false;
    if (particleAnimationId) cancelAnimationFrame(particleAnimationId);
    if (introOverlay) {
      introOverlay.classList.add('dismissed');
      introOverlay.style.visibility = 'hidden';
      introOverlay.style.opacity = '0';
    }
    document.body.style.overflow = '';
    sessionStorage.setItem('builders_journey_intro_seen', 'true');
    if (typeof triggerMetricCounters === 'function') {
      triggerMetricCounters();
    }
  }

  // Interactive mouse tracking on intro
  window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  }, { passive: true });

  window.addEventListener('touchmove', (e) => {
    if (e.touches.length > 0) {
      mouse.x = e.touches[0].clientX;
      mouse.y = e.touches[0].clientY;
    }
  }, { passive: true });

  // Skip interactions
  if (introOverlay) {
    introOverlay.addEventListener('click', () => {
      dissolveIntro();
    });
  }

  if (skipHintBtn) {
    skipHintBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      dissolveIntro();
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && introActive) {
      dissolveIntro();
    }
  });

  // ========================================================================
  // 2. Interactive Photo Gallery with CSS Grid & Lightbox
  // ========================================================================
  const galleryItems = [
    {
      id: "sunvalley",
      title: "Sun Valley Leadership Summit",
      category: "summits",
      year: "2023",
      image: "assets/images/event_sunvalley_conference.png",
      caption: "Dialogue on global digital transformation, AI governance, and next-generation media infrastructure at the annual technology and finance summit.",
      license: "Public Domain / Archival Event Portrait",
      span: "span-2"
    },
    {
      id: "brussels",
      title: "European Commission Dialogue, Brussels",
      category: "policy",
      year: "May 2023",
      image: "assets/images/event_brussels_2023.jpg",
      caption: "High-level bilateral consultation with European Union leadership on AI safety standards, platform fairness, and transatlantic technological cooperation.",
      license: "© European Union 2023 / CC-BY 4.0 International",
      span: "span-1"
    },
    {
      id: "techforum",
      title: "Global Technology & Cloud Keynote",
      category: "keynotes",
      year: "2022",
      image: "assets/images/event_tech_forum.jpg",
      caption: "Delivering address on carbon-neutral data centers, distributed cloud architecture, and global accessibility in computing.",
      license: "Creative Commons Attribution-ShareAlike",
      span: "span-1"
    },
    {
      id: "portrait2023",
      title: "Executive Press & Strategy Address",
      category: "keynotes",
      year: "2023",
      image: "assets/images/event_portrait_2023.jpg",
      caption: "Briefing journalists and developers on Alphabet's AI-first model integrations across Google Search, Workspace, and developer tools.",
      license: "© European Union / CC-BY 4.0 International",
      span: "span-1"
    },
    {
      id: "chrome-launch",
      title: "Google Chrome Architectural Inception",
      category: "products",
      year: "2008",
      image: "assets/images/chrome.jpg",
      caption: "Chronicle of Chrome's multi-process sandboxing and V8 JavaScript engine that elevated web browsers to modern application operating platforms.",
      license: "Official Google Product Inception Archive",
      span: "span-1"
    },
    {
      id: "android-ecosystem",
      title: "Android Global Platform Assembly",
      category: "products",
      year: "2013",
      image: "assets/images/android.jpg",
      caption: "Coordinating device manufacturers, silicon fabricators, and developers worldwide, expanding open mobile computing to over 3 billion active devices.",
      license: "Android Platform Architecture Archive",
      span: "span-2"
    }
  ];

  const galleryGrid = document.getElementById('gallery-grid');
  const galleryFilterBtns = document.querySelectorAll('.gallery-filter-btn');
  let currentGalleryFilter = 'all';

  function renderPhotoGallery(filter = 'all') {
    if (!galleryGrid) return;
    galleryGrid.innerHTML = '';

    const filtered = galleryItems.filter(item => {
      if (filter === 'all') return true;
      return item.category === filter;
    });

    filtered.forEach((item, index) => {
      const card = document.createElement('div');
      card.className = `gallery-card ${item.span || 'span-1'} reveal-on-scroll`;
      card.setAttribute('data-id', item.id);
      card.setAttribute('role', 'button');
      card.setAttribute('tabindex', '0');
      card.setAttribute('aria-label', `View photo: ${item.title}`);

      card.innerHTML = `
        <div class="gallery-media-wrapper">
          <img 
            src="${item.image}" 
            alt="${item.title}" 
            class="gallery-img" 
            loading="lazy" 
            referrerPolicy="no-referrer"
            onerror="this.src='assets/images/sundar_pichai_hero.png'"
          />
          <div class="gallery-zoom-indicator" aria-hidden="true">
            <span>⤢</span>
          </div>
          <div class="gallery-overlay">
            <div class="gallery-tag-row">
              <span class="gallery-event-tag">${item.category}</span>
              <span class="gallery-event-year tabular-nums">· ${item.year}</span>
            </div>
            <h3 class="gallery-card-title">${item.title}</h3>
            <p class="gallery-card-caption">${item.caption}</p>
          </div>
        </div>
      `;

      // Open Lightbox handler
      const openCurrent = () => openLightbox(item);
      card.addEventListener('click', openCurrent);
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openCurrent();
        }
      });

      galleryGrid.appendChild(card);
    });

    // Trigger reveal observer on newly created items
    observeRevealElements();
  }

  // Filter Buttons
  galleryFilterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      galleryFilterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentGalleryFilter = btn.getAttribute('data-filter') || 'all';
      renderPhotoGallery(currentGalleryFilter);
    });
  });

  // Lightbox Modal Implementation
  const lightboxModal = document.getElementById('lightbox-modal');
  const lightboxImg = document.getElementById('lightbox-img');
  const lightboxTitle = document.getElementById('lightbox-title');
  const lightboxMeta = document.getElementById('lightbox-meta');
  const lightboxDesc = document.getElementById('lightbox-desc');
  const lightboxLicense = document.getElementById('lightbox-license');
  const lightboxCloseBtn = document.getElementById('lightbox-close-btn');

  function openLightbox(item) {
    if (!lightboxModal) return;
    if (lightboxImg) lightboxImg.src = item.image;
    if (lightboxTitle) lightboxTitle.textContent = item.title;
    if (lightboxMeta) lightboxMeta.textContent = `${item.category.toUpperCase()} · ${item.year}`;
    if (lightboxDesc) lightboxDesc.textContent = item.caption;
    if (lightboxLicense) lightboxLicense.textContent = `Credit & Attribution: ${item.license}`;

    lightboxModal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    if (!lightboxModal) return;
    lightboxModal.classList.remove('active');
    document.body.style.overflow = '';
  }

  if (lightboxCloseBtn) {
    lightboxCloseBtn.addEventListener('click', closeLightbox);
  }

  if (lightboxModal) {
    lightboxModal.addEventListener('click', (e) => {
      if (e.target === lightboxModal) {
        closeLightbox();
      }
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && lightboxModal?.classList.contains('active')) {
      closeLightbox();
    }
  });

  // ========================================================================
  // 3. Career Timeline Milestones
  // ========================================================================
  const milestones = [
    {
      year: "2004",
      title: "Joined Google",
      description: "Joined Google and began contributing to its product organization.",
      source: "https://blog.google/authors/sundar-pichai/",
      period: "product",
      deepDive: "Pichai joined Google's product management division working on client software products including Google Toolbar and Google Gear. These tools integrated Google search into third-party browsers like Internet Explorer and Firefox. His early insights into browser architecture convinced Google's leadership that the open web required a dedicated, high-performance client."
    },
    {
      year: "2008",
      title: "Google Chrome launches",
      description: "Chrome launched as a new web browser focused on speed, simplicity, and security.",
      source: "https://googlepress.blogspot.com/2008/09/google-chrome-new-take-on-browser_02.html",
      period: "product",
      deepDive: "Launched on September 2, 2008, Chrome introduced multi-process tab isolation and the revolutionary V8 JavaScript engine. Pichai championed the browser project despite initial skepticism from CEO Eric Schmidt, demonstrating how speed, sandboxed security, and open standards could transform the web into a rich application environment."
    },
    {
      year: "2013",
      title: "Android leadership",
      description: "Took on leadership of Android, expanding his responsibility across Google's products.",
      source: "https://blog.google/products-and-platforms/platforms/android/update-from-ceo/",
      period: "product",
      deepDive: "In March 2013, Google CEO Larry Page announced that Pichai would lead Android alongside Chrome and Google Apps. This step unified Google's mobile operating system with its core cloud and web services, bridging previous internal silos and cultivating a cohesive Google Play and device ecosystem."
    },
    {
      year: "2014",
      title: "Product and engineering leadership",
      description: "Expanded his leadership responsibilities across Google's major products and platforms.",
      source: "https://blog.google/authors/sundar-pichai/",
      period: "product",
      deepDive: "In October 2014, Pichai was appointed head of products across almost all major Google divisions—including Search, Maps, Research, Commerce, and Ads. This consolidation placed Google's user-facing product engineering lines under a single, consensus-driven leader."
    },
    {
      year: "2015",
      title: "CEO of Google",
      description: "Became CEO of Google following the company's restructuring under Alphabet.",
      source: "https://abc.xyz/",
      period: "executive",
      deepDive: "In August 2015, Google announced a corporate restructuring creating Alphabet Inc. as the parent holding company. Pichai was named CEO of Google, overseeing core operations including Search, Advertising, Maps, YouTube, Android, and Google Cloud during an era of massive international expansion."
    },
    {
      year: "2019",
      title: "CEO of Alphabet",
      description: "Became CEO of Alphabet while continuing to lead Google.",
      source: "https://www.sec.gov/Archives/edgar/data/1652044/000119312519305505/d843403dex991.htm",
      period: "executive",
      deepDive: "In December 2019, Google co-founders Larry Page and Sergey Brin stepped down from active executive roles at Alphabet, appointing Pichai CEO of both Alphabet and Google. The transition consolidated oversight of Google alongside 'Other Bets' including Waymo, Verily, Calico, and DeepMind."
    }
  ];

  const timelineContainer = document.getElementById('timeline-container');
  const phaseBadgeEl = document.getElementById('timeline-phase-badge');
  const phaseDescEl = document.getElementById('timeline-phase-desc');
  const countAllEl = document.getElementById('count-all');
  const countProductEl = document.getElementById('count-product');
  const countExecutiveEl = document.getElementById('count-executive');

  let currentTimelineFilter = 'all';

  // Compute category counts
  const totalCount = milestones.length;
  const productCount = milestones.filter(m => m.period === 'product').length;
  const executiveCount = milestones.filter(m => m.period === 'executive').length;

  if (countAllEl) countAllEl.textContent = totalCount;
  if (countProductEl) countProductEl.textContent = productCount;
  if (countExecutiveEl) countExecutiveEl.textContent = executiveCount;

  const phaseSummaries = {
    all: {
      badge: "ALL PHASES · 2004–PRESENT",
      desc: "Viewing all 6 key career inflection points spanning two decades of engineering conviction and executive governance."
    },
    product: {
      badge: "PRODUCT PHASE · 2004–2014",
      desc: "Viewing 4 milestones in the Product Phase: Leading Google Toolbar, Chrome browser architecture, V8 JavaScript engine, and Android ecosystem unification."
    },
    executive: {
      badge: "EXECUTIVE LEADERSHIP · 2015–PRESENT",
      desc: "Viewing 2 milestones in Executive Leadership: Corporate restructuring under Alphabet, CEO governance, global cloud scale, and the 'AI-First' transformation."
    }
  };

  function renderTimeline(filter = 'all') {
    if (!timelineContainer) return;

    // Update banner summary
    const summary = phaseSummaries[filter] || phaseSummaries.all;
    if (phaseBadgeEl) phaseBadgeEl.textContent = summary.badge;
    if (phaseDescEl) phaseDescEl.textContent = summary.desc;
    
    const filteredMilestones = milestones.filter(item => {
      if (filter === 'all') return true;
      return item.period === filter;
    });

    timelineContainer.innerHTML = '';

    filteredMilestones.forEach((item) => {
      const itemEl = document.createElement('div');
      itemEl.className = 'timeline-item reveal-on-scroll';
      itemEl.setAttribute('data-period', item.period);

      const categoryLabel = item.period === 'product' ? 'Product Phase' : 'Executive Leadership';

      itemEl.innerHTML = `
        <div class="timeline-marker" aria-hidden="true"></div>
        <article class="milestone-card" id="milestone-${item.year}">
          <header class="milestone-header" role="button" tabindex="0" aria-expanded="false" aria-controls="details-${item.year}">
            <div class="milestone-year-title">
              <span class="milestone-year tabular-nums">${item.year}</span>
              <h3 class="milestone-title">${item.title}</h3>
              <span class="milestone-category-badge">${categoryLabel}</span>
            </div>
            <button type="button" class="milestone-action-btn" aria-label="Toggle details for ${item.title}">
              <span class="btn-text">Read more</span>
              <span class="btn-icon" aria-hidden="true">↓</span>
            </button>
          </header>
          
          <p class="milestone-description">${item.description}</p>
          
          <div class="milestone-details" id="details-${item.year}">
            <p class="milestone-deep-dive">${item.deepDive}</p>
            <div class="milestone-footer">
              <span class="source-label" style="font-size: 0.75rem; font-family: var(--font-mono); color: var(--color-text-muted);">VERIFIED REFERENCE:</span>
              <a href="${item.source}" class="milestone-source-link" target="_blank" rel="noopener noreferrer">
                <span>Official Source</span>
                <span aria-hidden="true">↗</span>
              </a>
            </div>
          </div>
        </article>
      `;

      const card = itemEl.querySelector('.milestone-card');
      const header = itemEl.querySelector('.milestone-header');
      const actionBtn = itemEl.querySelector('.milestone-action-btn');

      const toggleAccordion = () => {
        const isExpanded = card.classList.contains('expanded');
        if (isExpanded) {
          card.classList.remove('expanded');
          header.setAttribute('aria-expanded', 'false');
          actionBtn.querySelector('.btn-text').textContent = 'Read more';
          actionBtn.querySelector('.btn-icon').textContent = '↓';
        } else {
          card.classList.add('expanded');
          header.setAttribute('aria-expanded', 'true');
          actionBtn.querySelector('.btn-text').textContent = 'Show less';
          actionBtn.querySelector('.btn-icon').textContent = '↑';
        }
      };

      header.addEventListener('click', (e) => {
        if (e.target.closest('.milestone-action-btn')) return;
        toggleAccordion();
      });

      actionBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleAccordion();
      });

      header.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          toggleAccordion();
        }
      });

      timelineContainer.appendChild(itemEl);
    });

    observeRevealElements();
  }

  // Timeline Filter Buttons with Keyboard Accessibility (WAI-ARIA Tablist pattern)
  const filterButtons = Array.from(document.querySelectorAll('.timeline-filter-btn'));
  
  function applyTimelineFilter(targetFilter, activeBtn) {
    filterButtons.forEach(b => {
      b.classList.remove('active');
      b.setAttribute('aria-selected', 'false');
      b.setAttribute('tabindex', '-1');
    });
    activeBtn.classList.add('active');
    activeBtn.setAttribute('aria-selected', 'true');
    activeBtn.setAttribute('tabindex', '0');
    currentTimelineFilter = targetFilter;
    renderTimeline(currentTimelineFilter);

    // Reset Expand All button state
    allMilestonesExpanded = false;
    if (toggleAllMilestonesBtn) {
      toggleAllMilestonesBtn.innerHTML = '<span>Expand all</span> <span aria-hidden="true">↓</span>';
    }
  }

  filterButtons.forEach((btn, idx) => {
    btn.setAttribute('tabindex', btn.classList.contains('active') ? '0' : '-1');

    btn.addEventListener('click', () => {
      const targetFilter = btn.getAttribute('data-filter') || 'all';
      applyTimelineFilter(targetFilter, btn);
    });

    btn.addEventListener('keydown', (e) => {
      let nextIndex = null;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        nextIndex = (idx + 1) % filterButtons.length;
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        nextIndex = (idx - 1 + filterButtons.length) % filterButtons.length;
      } else if (e.key === 'Home') {
        e.preventDefault();
        nextIndex = 0;
      } else if (e.key === 'End') {
        e.preventDefault();
        nextIndex = filterButtons.length - 1;
      }
      if (nextIndex !== null) {
        const nextBtn = filterButtons[nextIndex];
        const nextFilter = nextBtn.getAttribute('data-filter') || 'all';
        applyTimelineFilter(nextFilter, nextBtn);
        nextBtn.focus();
      }
    });
  });

  // Toggle All Milestones
  const toggleAllMilestonesBtn = document.getElementById('toggle-all-milestones');
  let allMilestonesExpanded = false;

  if (toggleAllMilestonesBtn) {
    toggleAllMilestonesBtn.addEventListener('click', () => {
      allMilestonesExpanded = !allMilestonesExpanded;
      const cards = timelineContainer.querySelectorAll('.milestone-card');
      cards.forEach(card => {
        const header = card.querySelector('.milestone-header');
        const actionBtn = card.querySelector('.milestone-action-btn');
        if (allMilestonesExpanded) {
          card.classList.add('expanded');
          header?.setAttribute('aria-expanded', 'true');
          if (actionBtn) {
            actionBtn.querySelector('.btn-text').textContent = 'Show less';
            actionBtn.querySelector('.btn-icon').textContent = '↑';
          }
        } else {
          card.classList.remove('expanded');
          header?.setAttribute('aria-expanded', 'false');
          if (actionBtn) {
            actionBtn.querySelector('.btn-text').textContent = 'Read more';
            actionBtn.querySelector('.btn-icon').textContent = '↓';
          }
        }
      });
      toggleAllMilestonesBtn.innerHTML = allMilestonesExpanded
        ? '<span>Collapse all</span> <span aria-hidden="true">↑</span>'
        : '<span>Expand all</span> <span aria-hidden="true">↓</span>';
    });
  }

  // ========================================================================
  // 4. Ventures & Products
  // ========================================================================
  const ventures = [
    {
      id: "chrome",
      name: "Google Chrome",
      category: "Web Browser & Open Platform",
      explanation: "Conceived as a fast, sandboxed client for the modern web, Chrome launched in September 2008 with a multi-process architecture and the V8 JavaScript engine.",
      whyItMatters: "Redefined browser performance, eliminated single-tab crashes, and elevated web applications to rival native desktop software. Now commands over 65% global browser share.",
      documentedRole: "Product Leader & Champion: Spearheaded the browser's creation against initial executive hesitation, demonstrating that Google's long-term survival depended on an open, blazing-fast web.",
      officialUrl: "https://www.google.com/chrome/",
      image: "assets/images/chrome.jpg",
      imageAlt: "Minimalist editorial architectural illustration of Chrome speed and security architecture"
    },
    {
      id: "android",
      name: "Android",
      category: "Mobile Operating System & Hardware",
      explanation: "The world's largest open mobile computing platform, powering smartphones, tablets, automotive systems, wearables, and TVs across thousands of device makers.",
      whyItMatters: "Democratized personal computing for over 3 billion active devices, lowering barriers to internet connectivity, education, and digital banking across the globe.",
      documentedRole: "Took Over Leadership in 2013: Bridged the gap between Android and Google's core web services, fostering the Google Play ecosystem and championing Android One for emerging markets.",
      officialUrl: "https://www.android.com/",
      image: "assets/images/android.jpg",
      imageAlt: "Minimalist editorial conceptual illustration representing global mobile operating systems"
    },
    {
      id: "alphabet",
      name: "Google and Alphabet",
      category: "Global Enterprise & AI Infrastructure",
      explanation: "Alphabet Inc. was created in 2015 as the parent holding company for Google and frontier technology bets including DeepMind, Waymo, and Verily.",
      whyItMatters: "Operates planetary computing infrastructure and drives the global transition to machine learning, foundational models, quantum research, and clean energy data centers.",
      documentedRole: "CEO of Google (2015) & Alphabet (2019): Succeeded Larry Page and Sergey Brin, unified enterprise operations, navigated regulatory scrutiny, and declared Google's historic 'AI-first' pivot in 2016.",
      officialUrl: "https://abc.xyz/",
      image: "assets/images/alphabet.jpg",
      imageAlt: "Editorial illustration of modern technology headquarters and global product ecosystem"
    }
  ];

  const venturesContainer = document.getElementById('ventures-container');

  function renderVentures() {
    if (!venturesContainer) return;
    venturesContainer.innerHTML = '';

    ventures.forEach(venture => {
      const card = document.createElement('article');
      card.className = 'venture-card reveal-on-scroll';
      card.id = `venture-${venture.id}`;

      card.innerHTML = `
        <div class="venture-media-wrap">
          <img 
            src="${venture.image}" 
            alt="${venture.imageAlt}" 
            class="venture-image" 
            loading="lazy" 
            referrerPolicy="no-referrer"
            onerror="this.src='assets/images/sundar_pichai_hero.png'"
          />
        </div>

        <div class="venture-content">
          <div class="venture-category-meta">
            <span>${venture.category}</span>
          </div>

          <h3 class="venture-name">${venture.name}</h3>
          
          <p class="venture-short-explanation">${venture.explanation}</p>

          <div class="venture-why-it-matters">
            <h4 class="venture-why-title">Why it matters</h4>
            <p class="venture-why-text">${venture.whyItMatters}</p>
          </div>

          <div class="venture-expandable-content" id="venture-details-${venture.id}">
            <div class="venture-role-clarification">
              <span class="venture-role-badge">Documented Leadership Role:</span>
              <p style="margin-top:4px;">${venture.documentedRole}</p>
            </div>
            <div style="font-size: 0.8125rem; color: var(--color-text-muted); line-height: 1.5; margin-top: 8px;">
              <em>Historical context: Pichai did not found ${venture.name}, but drove its execution and scaling as a product and executive leader.</em>
            </div>
          </div>

          <div class="venture-card-actions">
            <button 
              type="button" 
              class="venture-toggle-details-btn" 
              aria-expanded="false" 
              aria-controls="venture-details-${venture.id}"
            >
              <span class="toggle-text">Leadership role</span>
              <span class="toggle-icon" aria-hidden="true">↓</span>
            </button>

            <a 
              href="${venture.officialUrl}" 
              class="venture-official-link" 
              target="_blank" 
              rel="noopener noreferrer"
              aria-label="Visit official website for ${venture.name}"
            >
              <span>Official site</span>
              <span aria-hidden="true">↗</span>
            </a>
          </div>
        </div>
      `;

      const toggleBtn = card.querySelector('.venture-toggle-details-btn');
      toggleBtn.addEventListener('click', () => {
        const isExpanded = card.classList.contains('expanded');
        if (isExpanded) {
          card.classList.remove('expanded');
          toggleBtn.setAttribute('aria-expanded', 'false');
          toggleBtn.querySelector('.toggle-text').textContent = 'Leadership role';
          toggleBtn.querySelector('.toggle-icon').textContent = '↓';
        } else {
          card.classList.add('expanded');
          toggleBtn.setAttribute('aria-expanded', 'true');
          toggleBtn.querySelector('.toggle-text').textContent = 'Hide details';
          toggleBtn.querySelector('.toggle-icon').textContent = '↑';
        }
      });

      venturesContainer.appendChild(card);
    });

    observeRevealElements();
  }

  // ========================================================================
  // 5. Header, Scroll Progress & Mobile Navigation
  // ========================================================================
  const header = document.querySelector('.site-header');
  const scrollProgressBar = document.getElementById('scroll-progress');
  const backToTopBtn = document.getElementById('back-to-top');

  window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    
    if (scrollY > 20) {
      header?.classList.add('scrolled');
    } else {
      header?.classList.remove('scrolled');
    }

    if (scrollProgressBar && docHeight > 0) {
      const progressPercent = Math.min(100, Math.max(0, (scrollY / docHeight) * 100));
      scrollProgressBar.style.width = `${progressPercent}%`;
    }

    if (backToTopBtn) {
      if (scrollY > 350) {
        backToTopBtn.classList.add('visible');
      } else {
        backToTopBtn.classList.remove('visible');
      }
    }
  }, { passive: true });

  if (backToTopBtn) {
    backToTopBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // Mobile Menu Drawer
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  const mobileDrawer = document.getElementById('mobile-drawer');
  const mobileNavLinks = document.querySelectorAll('.mobile-nav-link');

  function openMobileMenu() {
    mobileDrawer?.classList.add('open');
    mobileMenuBtn?.setAttribute('aria-expanded', 'true');
    mobileMenuBtn?.setAttribute('aria-label', 'Close navigation menu');
    document.body.style.overflow = 'hidden';
  }

  function closeMobileMenu() {
    mobileDrawer?.classList.remove('open');
    mobileMenuBtn?.setAttribute('aria-expanded', 'false');
    mobileMenuBtn?.setAttribute('aria-label', 'Open navigation menu');
    document.body.style.overflow = '';
  }

  if (mobileMenuBtn && mobileDrawer) {
    mobileMenuBtn.addEventListener('click', () => {
      const isOpen = mobileDrawer.classList.contains('open');
      if (isOpen) {
        closeMobileMenu();
      } else {
        openMobileMenu();
      }
    });

    mobileNavLinks.forEach(link => {
      link.addEventListener('click', () => {
        closeMobileMenu();
      });
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && mobileDrawer.classList.contains('open')) {
        closeMobileMenu();
      }
    });
  }

  // ========================================================================
  // 6. Glassmorphism Navigation Slider & Scroll-Driven Section Tracking
  // ========================================================================
  const glassNavbar = document.getElementById('glass-navbar');
  const navSliderIndicator = document.getElementById('nav-slider-indicator');
  const desktopNavLinks = Array.from(document.querySelectorAll('.nav-slider-list .nav-link'));
  
  // Explicit chronological sections: Overview → Timeline → Ventures → Gallery → Impact → Lessons → Sources
  const journeySectionIds = ['overview', 'timeline', 'ventures', 'gallery', 'impact', 'lessons', 'sources'];
  
  let currentActiveNavId = null;

  function updateSliderCapsule(activeLink) {
    if (!navSliderIndicator) return;
    if (!activeLink || window.innerWidth < 1060) {
      navSliderIndicator.style.opacity = '0';
      return;
    }
    const listEl = activeLink.closest('.nav-slider-list');
    if (!listEl) return;

    // Subpixel calculation for ultra-smooth gliding
    const listRect = listEl.getBoundingClientRect();
    const linkRect = activeLink.getBoundingClientRect();
    const leftOffset = linkRect.left - listRect.left;
    const itemWidth = linkRect.width;

    navSliderIndicator.style.transform = `translateX(${leftOffset}px)`;
    navSliderIndicator.style.width = `${itemWidth}px`;
    navSliderIndicator.style.opacity = '1';
  }

  function setActiveJourneySection(targetId) {
    if (!targetId) return;
    currentActiveNavId = targetId;

    let activeDesktopLink = null;
    desktopNavLinks.forEach(link => {
      const linkSection = link.getAttribute('data-section') || link.getAttribute('href')?.replace('#', '');
      if (linkSection === targetId) {
        link.classList.add('active');
        activeDesktopLink = link;
      } else {
        link.classList.remove('active');
      }
    });

    mobileNavLinks.forEach(link => {
      const linkSection = link.getAttribute('href')?.replace('#', '');
      if (linkSection === targetId) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });

    if (activeDesktopLink) {
      updateSliderCapsule(activeDesktopLink);
    }
  }

  function updateActiveNavLink() {
    const scrollPos = window.scrollY;
    const windowHeight = window.innerHeight;
    const docHeight = document.documentElement.scrollHeight;

    // Toggle subtle floating depth styling on navbar
    if (glassNavbar) {
      if (scrollPos > 24) {
        glassNavbar.classList.add('scrolled');
      } else {
        glassNavbar.classList.remove('scrolled');
      }
    }

    // If reached bottom of document, activate sources
    if (scrollPos + windowHeight >= docHeight - 80) {
      setActiveJourneySection('sources');
      return;
    }

    // In top hero zone (before overview):
    const overviewEl = document.getElementById('overview');
    if (overviewEl && scrollPos < overviewEl.offsetTop - 150) {
      setActiveJourneySection('overview');
      return;
    }

    // Check sections in order: Overview → Timeline → Ventures → Gallery → Impact → Lessons → Sources
    const triggerLine = scrollPos + 180;
    let matchingId = null;

    for (let i = 0; i < journeySectionIds.length; i++) {
      const secId = journeySectionIds[i];
      const el = document.getElementById(secId);
      if (el) {
        const top = el.offsetTop;
        const bottom = top + el.offsetHeight;
        if (triggerLine >= top && triggerLine < bottom) {
          matchingId = secId;
          break;
        }
      }
    }

    if (matchingId) {
      setActiveJourneySection(matchingId);
    }
  }

  // Smooth scroll click handler for desktop navigation items
  desktopNavLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = link.getAttribute('data-section') || link.getAttribute('href')?.replace('#', '');
      const targetEl = document.getElementById(targetId);
      if (targetEl) {
        const headerOffset = 90;
        const targetTop = targetEl.getBoundingClientRect().top + window.scrollY - headerOffset;
        window.scrollTo({
          top: targetTop,
          behavior: 'smooth'
        });
        setActiveJourneySection(targetId);
      }
    });
  });

  // Re-calculate slider pill position on window resize
  window.addEventListener('resize', () => {
    const activeLink = document.querySelector('.nav-slider-list .nav-link.active');
    if (activeLink) {
      updateSliderCapsule(activeLink);
    }
  }, { passive: true });

  window.addEventListener('scroll', updateActiveNavLink, { passive: true });

  // ========================================================================
  // 7. Scroll Reveal & Animated Number Counters
  // ========================================================================
  function observeRevealElements() {
    const elements = document.querySelectorAll('.reveal-on-scroll:not(.revealed)');
    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });

    elements.forEach(el => observer.observe(el));
  }

  function triggerMetricCounters() {
    if (countersAnimated) return;
    const metricStrip = document.querySelector('.hero-metrics-strip');
    if (!metricStrip) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !countersAnimated) {
          countersAnimated = true;
          // Animated counts if needed
        }
      });
    }, { threshold: 0.2 });

    observer.observe(metricStrip);
  }

  // ========================================================================
  // 8. Dynamic Copyright Year
  // ========================================================================
  const yearElement = document.getElementById('current-year');
  if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
  }

  // ========================================================================
  // 9. Gemini AI Chatbot ("The Builder's Companion")
  // ========================================================================
  const chatbotTriggerBtn = document.getElementById('chatbot-trigger-btn');
  const chatbotDrawer = document.getElementById('chatbot-drawer');
  const chatbotCloseBtn = document.getElementById('chatbot-close-btn');
  const chatbotMessages = document.getElementById('chatbot-messages');
  const chatbotForm = document.getElementById('chatbot-form');
  const chatbotInput = document.getElementById('chatbot-input');
  const chatbotSendBtn = document.getElementById('chatbot-send-btn');

  let chatHistory = [
    {
      role: 'model',
      content: "Hello! I'm **The Builder's Companion**, an AI biographer and leadership analyst. Ask me anything about Sundar Pichai's career milestones, product convictions (like Chrome or Android), or Alphabet's AI-first strategy."
    }
  ];

  function renderChatMessages() {
    if (!chatbotMessages) return;
    chatbotMessages.innerHTML = '';

    chatHistory.forEach((msg, idx) => {
      const bubble = document.createElement('div');
      bubble.className = `chat-bubble ${msg.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-model'}`;
      
      let formatted = msg.content
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/\n\n/g, '<br><br>')
        .replace(/\n/g, '<br>');

      bubble.innerHTML = formatted;
      chatbotMessages.appendChild(bubble);

      if (idx === 0 && chatHistory.length === 1) {
        const suggestionsBox = document.createElement('div');
        suggestionsBox.className = 'chat-suggestions';
        const suggestions = [
          "Why was Google Chrome created?",
          "How did he scale the Android ecosystem?",
          "Explain the 2016 'AI-First' pivot.",
          "What is his consensus leadership style?"
        ];
        suggestions.forEach(promptText => {
          const chip = document.createElement('button');
          chip.type = 'button';
          chip.className = 'chat-suggestion-chip';
          chip.textContent = promptText;
          chip.addEventListener('click', () => {
            sendChatMessage(promptText);
          });
          suggestionsBox.appendChild(chip);
        });
        chatbotMessages.appendChild(suggestionsBox);
      }
    });

    chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
  }

  async function sendChatMessage(text) {
    const trimmed = text.trim();
    if (!trimmed) return;

    chatHistory.push({ role: 'user', content: trimmed });
    if (chatbotInput) chatbotInput.value = '';
    renderChatMessages();

    // Typing indicator
    const typingIndicator = document.createElement('div');
    typingIndicator.className = 'chat-typing-indicator';
    typingIndicator.id = 'chat-typing';
    typingIndicator.innerHTML = `
      <span class="typing-dot"></span>
      <span class="typing-dot"></span>
      <span class="typing-dot"></span>
    `;
    chatbotMessages.appendChild(typingIndicator);
    chatbotMessages.scrollTop = chatbotMessages.scrollHeight;

    if (chatbotSendBtn) chatbotSendBtn.disabled = true;
    if (chatbotInput) chatbotInput.disabled = true;

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: chatHistory })
      });

      const data = await response.json();
      const typingEl = document.getElementById('chat-typing');
      if (typingEl) typingEl.remove();

      if (data.reply) {
        chatHistory.push({ role: 'model', content: data.reply });
      } else if (data.error) {
        chatHistory.push({ role: 'model', content: `Notice: ${data.error}` });
      } else {
        chatHistory.push({ role: 'model', content: "Unable to reach biographer service right now. Please try again." });
      }
    } catch (err) {
      const typingEl = document.getElementById('chat-typing');
      if (typingEl) typingEl.remove();
      chatHistory.push({ role: 'model', content: "Network error connecting to the biographer service. Please verify your connection." });
    } finally {
      if (chatbotSendBtn) chatbotSendBtn.disabled = false;
      if (chatbotInput) {
        chatbotInput.disabled = false;
        chatbotInput.focus();
      }
      renderChatMessages();
    }
  }

  if (chatbotTriggerBtn && chatbotDrawer) {
    chatbotTriggerBtn.addEventListener('click', () => {
      const isOpen = chatbotDrawer.classList.contains('open');
      if (isOpen) {
        chatbotDrawer.classList.remove('open');
        chatbotTriggerBtn.setAttribute('aria-expanded', 'false');
      } else {
        chatbotDrawer.classList.add('open');
        chatbotTriggerBtn.setAttribute('aria-expanded', 'true');
        renderChatMessages();
        setTimeout(() => chatbotInput?.focus(), 150);
      }
    });
  }

  if (chatbotCloseBtn && chatbotDrawer) {
    chatbotCloseBtn.addEventListener('click', () => {
      chatbotDrawer.classList.remove('open');
      chatbotTriggerBtn?.setAttribute('aria-expanded', 'false');
    });
  }

  if (chatbotForm) {
    chatbotForm.addEventListener('submit', (e) => {
      e.preventDefault();
      if (chatbotInput) {
        sendChatMessage(chatbotInput.value);
      }
    });
  }

  // ========================================================================
  // 10. Initial Execution
  // ========================================================================
  renderTimeline('all');
  renderVentures();
  renderPhotoGallery('all');
  updateActiveNavLink();
  observeRevealElements();
  triggerMetricCounters();
  initParticleIntro(false);
});
