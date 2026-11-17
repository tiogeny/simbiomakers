const { EDITION_CONFIG, PERU_MAP_DATA } = window;

// Global App State
const state = {
  theme: localStorage.getItem('simbiomakers_theme') || 'light',
  viewMode: 'map', // 'map' | 'grid'
  macroFilter: 'all', // 'all' | 'Norte' | 'Centro' | 'Sur' | 'Oriente'
  sponsorFilter: 'all', // 'all' | 'available' | 'sponsored'
  searchQuery: '',
  selectedRegionId: null,
  forms: {
    studentDraft: JSON.parse(localStorage.getItem('simbiomakers_student_draft') || '{}'),
    sponsorDraft: JSON.parse(localStorage.getItem('simbiomakers_sponsor_draft') || '{}')
  }
};

// Configuration for Live Data & Form Webhooks
const CONFIG = {
  // Para alimentar el mapa en vivo: Pega la URL de tu Google Sheet publicado como CSV o Web App JSON
  LIVE_SHEET_CSV_URL: '',
  // Webhook para recibir formularios (Google Apps Script o Formspree)
  FORM_WEBHOOK_URL: ''
};

// Theme Management
function initTheme() {
  const root = document.documentElement;
  if (state.theme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
  updateThemeToggleUI();
}

function toggleTheme() {
  state.theme = state.theme === 'light' ? 'dark' : 'light';
  localStorage.setItem('simbiomakers_theme', state.theme);
  initTheme();
}

function updateThemeToggleUI() {
  const btn = document.getElementById('theme-toggle-btn');
  if (!btn) return;
  const isDark = state.theme === 'dark';
  btn.innerHTML = isDark
    ? `<svg class="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/></svg>`
    : `<svg class="w-4 h-4 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/></svg>`;
}

// Toast Notifications
function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  const bgColors = {
    success: 'bg-emerald-600 text-white',
    error: 'bg-rose-600 text-white',
    info: 'bg-teal-700 text-white'
  };
  toast.className = `flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl text-xs font-semibold transform transition-all duration-300 translate-y-2 opacity-0 ${bgColors[type] || bgColors.success}`;
  toast.innerHTML = `
    <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${type === 'success' ? 'M5 13l4 4L19 7' : 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'}"/>
    </svg>
    <span>${message}</span>
  `;
  container.appendChild(toast);

  requestAnimationFrame(() => {
    toast.classList.remove('translate-y-2', 'opacity-0');
    toast.classList.add('translate-y-0', 'opacity-100');
  });

  setTimeout(() => {
    toast.classList.add('opacity-0', 'translate-y-2');
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// Modal Management
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (!modal) return;
  modal.classList.remove('hidden');
  document.body.classList.add('overflow-hidden');
  const backdrop = modal.querySelector('.modal-backdrop');
  const panel = modal.querySelector('.modal-panel');
  if (backdrop && panel) {
    requestAnimationFrame(() => {
      backdrop.classList.remove('opacity-0');
      backdrop.classList.add('opacity-100');
      panel.classList.remove('scale-95', 'opacity-0');
      panel.classList.add('scale-100', 'opacity-100');
    });
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (!modal) return;
  const backdrop = modal.querySelector('.modal-backdrop');
  const panel = modal.querySelector('.modal-panel');
  if (backdrop && panel) {
    backdrop.classList.add('opacity-0');
    panel.classList.add('scale-95', 'opacity-0');
    setTimeout(() => {
      modal.classList.add('hidden');
      document.body.classList.remove('overflow-hidden');
    }, 200);
  } else {
    modal.classList.add('hidden');
    document.body.classList.remove('overflow-hidden');
  }
}

// Global Stats Calculation
function renderGlobalStats() {
  const regions = PERU_MAP_DATA.regions;
  const totalQuota = regions.reduce((acc, r) => acc + (r.quotaTarget || 20), 0);
  const sponsoredCount = regions.filter(r => r.sponsorStatus === 'sponsored').length;
  const availableFabLabs = regions.filter(r => r.sponsorStatus === 'available' && !r.isPendingSede).length;
  const pendingSedes = regions.filter(r => r.isPendingSede).length;

  const elApplicants = document.getElementById('stat-total-applicants');
  const elSponsored = document.getElementById('stat-sponsored-regions');
  const elFemale = document.getElementById('stat-female-ratio');

  if (elApplicants) elApplicants.textContent = `${totalQuota}`;
  if (elSponsored) {
    elSponsored.textContent = sponsoredCount > 0
      ? `${sponsoredCount} patrocinadas / ${availableFabLabs} Fab Labs disponibles`
      : `${availableFabLabs} Fab Labs disponibles · ${pendingSedes} sedes híbridas`;
  }
  if (elFemale) elFemale.textContent = '50%';
}

// Render Minimalist 3D Maquette Network Map in Hero (Bright, multi-color arcs, zero popups)
function renderHeroNetworkMap() {
  const container = document.getElementById('hero-peru-network');
  const card = document.getElementById('hero-peru-card');
  const badge = document.getElementById('hero-network-badge');
  if (!container) return;

  const { viewBox, regions } = PERU_MAP_DATA;
  const [minX, minY, width, height] = viewBox;

  const normalizeName = (s) => (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

  // Build unique pairs of connected regions (region <-> regionAliada)
  const pairs = [];
  const seen = new Set();
  regions.forEach(r => {
    const target = normalizeName(r.regionAliada);
    const ally = regions.find(x => normalizeName(x.name) === target);
    if (ally) {
      const key = [r.id, ally.id].sort().join('--');
      if (!seen.has(key)) {
        seen.add(key);
        pairs.push({ a: r, b: ally, key });
      }
    }
  });

  const arcGradients = [
    'url(#arc-grad-teal)',
    'url(#arc-grad-magenta)',
    'url(#arc-grad-blue)',
    'url(#arc-grad-emerald)',
    'url(#arc-grad-violet)',
    'url(#arc-grad-amber)'
  ];

  const nodeColors = ['#0D9488', '#e60066', '#2563eb', '#059669', '#7c3aed', '#d97706'];

  let svg = `
    <div class="hero-3d-stage w-full flex items-center justify-center" id="hero-3d-stage">
      <svg viewBox="${minX - 20} ${minY - 55} ${width + 40} ${height + 75}" class="w-full h-auto max-h-[395px] mx-auto select-none overflow-visible" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="arc-glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <linearGradient id="arc-grad-teal" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#0D9488" />
            <stop offset="100%" stop-color="#06B6D4" />
          </linearGradient>
          <linearGradient id="arc-grad-magenta" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#e60066" />
            <stop offset="100%" stop-color="#f97316" />
          </linearGradient>
          <linearGradient id="arc-grad-blue" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#2563eb" />
            <stop offset="100%" stop-color="#00BBF9" />
          </linearGradient>
          <linearGradient id="arc-grad-emerald" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#059669" />
            <stop offset="100%" stop-color="#84cc16" />
          </linearGradient>
          <linearGradient id="arc-grad-violet" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#7c3aed" />
            <stop offset="100%" stop-color="#ec4899" />
          </linearGradient>
          <linearGradient id="arc-grad-amber" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#d97706" />
            <stop offset="100%" stop-color="#eab308" />
          </linearGradient>
        </defs>

        <!-- 3D Extruded Base Shadow Plate -->
        <g transform="translate(10, 16)">
          ${regions.map(r => `<path d="${r.d}" class="fill-slate-400/50 dark:fill-slate-950/90 stroke-slate-400/50 dark:stroke-slate-950/90" stroke-width="1.4" />`).join('')}
        </g>

        <!-- Main High-Contrast Slate 3D Peru Map Layer (pops sharply over light card) -->
        <g id="hero-map-regions">
          ${regions.map((r, i) => {
            const shade = i % 2 === 0 ? 'fill-slate-800 dark:fill-slate-700' : 'fill-slate-700/95 dark:fill-slate-800';
            return `
              <path
                d="${r.d}"
                stroke-width="1"
                class="hero-region-shape ${shade} stroke-slate-500/70 dark:stroke-slate-500/80 transition-colors duration-200 cursor-pointer"
                data-hero-id="${r.id}"
              />
            `;
          }).join('')}
        </g>

        <!-- Ground Shadows of Elevated Arcs (creates 3D height illusion) -->
        <g id="hero-arc-shadows" pointer-events="none">
          ${pairs.map(({ a, b, key }) => {
            const mx = (a.cx + b.cx) / 2;
            const my = (a.cy + b.cy) / 2 + 8;
            return `<path d="M ${a.cx} ${a.cy} Q ${mx.toFixed(1)} ${my.toFixed(1)} ${b.cx} ${b.cy}" fill="none" class="stroke-slate-950/55" stroke-width="2.4" data-arc-shadow="${key}" />`;
          }).join('')}
        </g>

        <!-- Elevated 3D Multi-Color Interconnection Arcs -->
        <g id="hero-arcs" pointer-events="none" filter="url(#arc-glow)">
          ${pairs.map(({ a, b, key }, idx) => {
            const dist = Math.hypot(b.cx - a.cx, b.cy - a.cy);
            const lift = Math.min(120, Math.max(46, dist * 0.45));
            const mx = (a.cx + b.cx) / 2 - (b.cy - a.cy) * 0.08;
            const my = (a.cy + b.cy) / 2 - lift;
            const grad = arcGradients[idx % arcGradients.length];
            const delay = (idx * 0.25).toFixed(2);
            const dPath = `M ${a.cx} ${a.cy} Q ${mx.toFixed(1)} ${my.toFixed(1)} ${b.cx} ${b.cy}`;
            return `
              <g class="hero-arc-group transition-opacity duration-200" data-arc-key="${key}" data-a="${a.id}" data-b="${b.id}">
                <path d="${dPath}" fill="none" stroke="${grad}" stroke-width="1.6" stroke-opacity="0.45" />
                <path d="${dPath}" fill="none" stroke="${grad}" stroke-width="2.6" stroke-linecap="round" class="hero-network-flow" style="animation-delay: ${delay}s;" />
              </g>
            `;
          }).join('')}
        </g>

        <!-- Multi-Color 25 Regional Nodes -->
        <g id="hero-nodes">
          ${regions.map((r, idx) => {
            const color = nodeColors[idx % nodeColors.length];
            const delay = (idx * 0.14).toFixed(2);
            return `
              <g transform="translate(${r.cx}, ${r.cy})" class="cursor-pointer hero-node-group" data-hero-id="${r.id}">
                <circle r="7.5" fill="${color}" opacity="0.22" class="animate-ping" style="animation-duration: 3s; animation-delay: ${delay}s;" />
                <circle r="4.2" fill="${color}" stroke="#ffffff" stroke-width="1.5" />
              </g>
            `;
          }).join('')}
        </g>
      </svg>
    </div>
  `;

  container.innerHTML = svg;

  // Hover interactivity: highlight region + its ally + connecting 3D arc (NO click popups!)
  const stage = document.getElementById('hero-3d-stage');
  const arcGroups = container.querySelectorAll('.hero-arc-group');
  const regionShapes = container.querySelectorAll('.hero-region-shape');

  function highlightConnection(regionId) {
    const region = regions.find(r => r.id === regionId);
    if (!region) return;
    const ally = regions.find(x => normalizeName(x.name) === normalizeName(region.regionAliada));

    regionShapes.forEach((shape, i) => {
      const id = shape.getAttribute('data-hero-id');
      if (id === region.id) {
        shape.style.fill = '#0D9488';
        shape.style.stroke = '#00F5D4';
      } else if (ally && id === ally.id) {
        shape.style.fill = '#e60066';
        shape.style.stroke = '#ff6b9d';
      } else {
        shape.style.fill = '';
        shape.style.stroke = '';
      }
    });

    arcGroups.forEach(group => {
      const aId = group.getAttribute('data-a');
      const bId = group.getAttribute('data-b');
      group.style.opacity = (aId === region.id || bId === region.id) ? '1' : '0.15';
    });

    if (badge) {
      badge.innerHTML = `<span class="w-2 h-2 rounded-full bg-[#e60066] animate-pulse"></span><span><strong>${region.name}</strong> · Red nacional de fabricación distribuida</span>`;
    }
  }

  function resetHighlight() {
    regionShapes.forEach(shape => {
      shape.style.fill = '';
      shape.style.stroke = '';
    });
    arcGroups.forEach(group => {
      group.style.opacity = '1';
    });
    if (badge) {
      badge.innerHTML = `<span class="w-2 h-2 rounded-full bg-teal-500 animate-pulse"></span><span>Red nacional · 24 regiones conectadas</span>`;
    }
  }

  container.querySelectorAll('[data-hero-id]').forEach(el => {
    el.addEventListener('mouseenter', () => highlightConnection(el.getAttribute('data-hero-id')));
    el.addEventListener('mouseleave', resetHighlight);
  });

  // Mouse-tracking 3D parallax tilt + Zoom & Pan
  const zoomInBtn = document.getElementById('hero-zoom-in');
  const zoomOutBtn = document.getElementById('hero-zoom-out');
  const zoomResetBtn = document.getElementById('hero-zoom-reset');

  let heroZoom = 1.06;
  let panX = 0;
  let panY = 0;
  let rotX = 44;
  let rotZ = -14;
  let isDragging = false;
  let dragStartX = 0;
  let dragStartY = 0;

  function applyStageTransform() {
    if (!stage) return;
    stage.style.transform = `perspective(950px) translate(${panX.toFixed(1)}px, ${panY.toFixed(1)}px) rotateX(${rotX.toFixed(1)}deg) rotateZ(${rotZ.toFixed(1)}deg) scale(${heroZoom.toFixed(2)})`;
    if (zoomResetBtn) {
      if (heroZoom > 1.15 || panX !== 0 || panY !== 0) {
        zoomResetBtn.classList.remove('hidden');
        zoomResetBtn.classList.add('flex');
      } else {
        zoomResetBtn.classList.add('hidden');
        zoomResetBtn.classList.remove('flex');
      }
    }
    if (card) {
      card.style.cursor = heroZoom > 1.15 ? (isDragging ? 'grabbing' : 'grab') : 'default';
    }
  }

  function setZoom(newZoom) {
    heroZoom = Math.min(2.6, Math.max(0.85, newZoom));
    if (heroZoom <= 1.1) {
      panX = 0;
      panY = 0;
    }
    applyStageTransform();
  }

  if (zoomInBtn) zoomInBtn.addEventListener('click', (e) => { e.stopPropagation(); setZoom(heroZoom + 0.35); });
  if (zoomOutBtn) zoomOutBtn.addEventListener('click', (e) => { e.stopPropagation(); setZoom(heroZoom - 0.35); });
  if (zoomResetBtn) {
    zoomResetBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      heroZoom = 1.06;
      panX = 0;
      panY = 0;
      rotX = 44;
      rotZ = -14;
      applyStageTransform();
    });
  }

  if (card && stage) {
    // Mouse wheel zoom inside map card
    card.addEventListener('wheel', (e) => {
      e.preventDefault();
      const delta = e.deltaY < 0 ? 0.16 : -0.16;
      setZoom(heroZoom + delta);
    }, { passive: false });

    // Double click toggles zoom
    card.addEventListener('dblclick', (e) => {
      if (e.target.closest('button')) return;
      setZoom(heroZoom > 1.4 ? 1.06 : 1.9);
    });

    // Drag to pan when zoomed in
    card.addEventListener('mousedown', (e) => {
      if (heroZoom <= 1.15 || e.target.closest('button')) return;
      isDragging = true;
      dragStartX = e.clientX - panX;
      dragStartY = e.clientY - panY;
      stage.style.transition = 'none';
      applyStageTransform();
    });

    window.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      panX = Math.max(-140, Math.min(140, e.clientX - dragStartX));
      panY = Math.max(-140, Math.min(140, e.clientY - dragStartY));
      applyStageTransform();
    });

    window.addEventListener('mouseup', () => {
      if (!isDragging) return;
      isDragging = false;
      stage.style.transition = 'transform 0.22s ease-out';
      applyStageTransform();
    });

    // Parallax tilt
    card.addEventListener('mousemove', (e) => {
      if (isDragging) return;
      const rect = card.getBoundingClientRect();
      const nx = (e.clientX - rect.left) / rect.width - 0.5;
      const ny = (e.clientY - rect.top) / rect.height - 0.5;
      rotX = 44 - ny * 12;
      rotZ = -14 + nx * 12;
      applyStageTransform();
    });

    card.addEventListener('mouseleave', () => {
      if (isDragging) return;
      rotX = 44;
      rotZ = -14;
      applyStageTransform();
    });
  }
}

// Render SVG Map of Peru
function renderPeruMap() {
  const container = document.getElementById('peru-map-svg-container');
  if (!container) return;

  const { viewBox, regions } = PERU_MAP_DATA;
  const [minX, minY, width, height] = viewBox;

  let svgHtml = `
    <svg viewBox="${minX} ${minY} ${width} ${height}" class="w-full h-auto max-h-[700px] mx-auto filter drop-shadow-sm select-none" xmlns="http://www.w3.org/2000/svg">
      <g id="regions-group">
  `;

  regions.forEach(region => {
    const isSponsored = region.sponsorStatus === 'sponsored';
    const isSelected = state.selectedRegionId === region.id;
    const isFilteredOut = isRegionFilteredOut(region);

    let fillClass = isSponsored
      ? 'fill-teal-600/80 hover:fill-teal-500 stroke-teal-800/80'
      : 'fill-slate-200 dark:fill-slate-800 hover:fill-teal-100 dark:hover:fill-slate-700 stroke-slate-300 dark:stroke-slate-700';

    if (isSelected) {
      fillClass = 'fill-cyan-500 stroke-cyan-600 stroke-2';
    }

    if (isFilteredOut) {
      fillClass += ' opacity-20';
    }

    svgHtml += `
      <path 
        id="map-path-${region.id}"
        data-id="${region.id}"
        data-name="${region.name}"
        d="${region.d}" 
        class="transition-all duration-200 cursor-pointer stroke-[1] ${fillClass}"
      >
        <title>${region.name} - ${region.iestName} (${isSponsored ? 'Patrocinada' : 'Disponible para adopción'})</title>
      </path>
    `;
  });

  // Region markers/pins
  regions.forEach(region => {
    if (isRegionFilteredOut(region)) return;
    const isSponsored = region.sponsorStatus === 'sponsored';
    const circleColor = isSponsored ? '#0D9488' : '#64748B';
    const pulseColor = isSponsored ? '#2DD4BF' : '#94A3B8';

    svgHtml += `
      <g class="cursor-pointer pointer-events-none" transform="translate(${region.cx}, ${region.cy})">
        <circle r="5" fill="${pulseColor}" opacity="0.3" class="animate-ping" />
        <circle r="3.5" fill="${circleColor}" stroke="#ffffff" stroke-width="1.2" />
      </g>
    `;
  });

  svgHtml += `</g></svg>`;
  container.innerHTML = svgHtml;

  // Event Listeners for map regions
  container.querySelectorAll('path[data-id]').forEach(path => {
    const regionId = path.getAttribute('data-id');

    path.addEventListener('click', () => {
      selectRegion(regionId);
    });

    path.addEventListener('mouseenter', (e) => {
      showMapTooltip(e, regionId);
    });

    path.addEventListener('mouseleave', () => {
      hideMapTooltip();
    });
  });
}

function isRegionFilteredOut(region) {
  if (state.macroFilter !== 'all' && region.macroregion !== state.macroFilter) {
    return true;
  }
  if (state.sponsorFilter === 'available' && region.sponsorStatus !== 'available') {
    return true;
  }
  if (state.sponsorFilter === 'sponsored' && region.sponsorStatus !== 'sponsored') {
    return true;
  }
  if (state.searchQuery.trim() !== '') {
    const q = state.searchQuery.toLowerCase().trim();
    const nameMatch = region.name.toLowerCase().includes(q);
    const iestMatch = region.iestName.toLowerCase().includes(q);
    const cityMatch = region.iestCity.toLowerCase().includes(q);
    if (!nameMatch && !iestMatch && !cityMatch) return true;
  }
  return false;
}

// Tooltip Management
function showMapTooltip(e, regionId) {
  const tooltip = document.getElementById('map-tooltip');
  if (!tooltip) return;
  const region = PERU_MAP_DATA.regions.find(r => r.id === regionId);
  if (!region) return;

  const isSponsored = region.sponsorStatus === 'sponsored';
  tooltip.innerHTML = `
    <div class="font-bold text-xs text-slate-900 dark:text-white flex items-center justify-between gap-3">
      <span>${region.name}</span>
      <span class="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded ${isSponsored ? 'bg-teal-100 text-teal-800 dark:bg-teal-900/60 dark:text-teal-300' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'}">
        ${isSponsored ? 'Patrocinada' : 'Disponible'}
      </span>
    </div>
    <div class="text-[11px] text-slate-600 dark:text-slate-300 mt-1">
      <span class="font-semibold text-teal-600 dark:text-teal-400">Sede:</span> ${region.iestName}
    </div>
    <div class="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 mt-2 pt-1 border-t border-slate-100 dark:border-slate-800">
      <span>👥 ${region.applicantsCount} postulantes</span>
      <span>⚖️ ${region.femaleRatio}% chicas</span>
    </div>
  `;

  tooltip.classList.remove('hidden');
  const updatePos = (event) => {
    const parentRect = tooltip.parentElement.getBoundingClientRect();
    const x = event.clientX - parentRect.left + 15;
    const y = event.clientY - parentRect.top - 10;
    tooltip.style.transform = `translate(${x}px, ${y}px)`;
  };
  updatePos(e);
}

function hideMapTooltip() {
  const tooltip = document.getElementById('map-tooltip');
  if (tooltip) tooltip.classList.add('hidden');
}

// Render Grid Cards for Regions
function renderRegionsGrid() {
  const container = document.getElementById('regions-grid-container');
  if (!container) return;

  const filteredRegions = PERU_MAP_DATA.regions.filter(r => !isRegionFilteredOut(r));

  if (filteredRegions.length === 0) {
    container.innerHTML = `
      <div class="col-span-full py-12 text-center text-slate-500">
        <p class="text-sm font-medium">No se encontraron regiones con el filtro seleccionado.</p>
        <button id="reset-filters-btn" class="mt-3 px-4 py-2 text-xs font-semibold text-teal-600 bg-teal-50 dark:bg-slate-800 rounded-lg">Limpiar Filtros</button>
      </div>
    `;
    const btn = document.getElementById('reset-filters-btn');
    if (btn) btn.addEventListener('click', resetFilters);
    return;
  }

  let html = '';
  filteredRegions.forEach(region => {
    const isSponsored = region.sponsorStatus === 'sponsored';
    const isSelected = state.selectedRegionId === region.id;

    html += `
      <div 
        data-region-id="${region.id}"
        class="region-card group relative bg-white dark:bg-slate-800/90 rounded-2xl p-5 border transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md ${isSelected ? 'border-teal-500 ring-2 ring-teal-500/20' : 'border-slate-200 dark:border-slate-700/80 hover:border-teal-300'}"
      >
        <div class="flex items-start justify-between gap-2 mb-3">
          <div>
            <div class="flex items-center gap-2">
              <h4 class="font-bold text-base text-slate-900 dark:text-white group-hover:text-teal-600 transition-colors">${region.name}</h4>
              <span class="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">${region.macroregion}</span>
            </div>
            <p class="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">Sede: ${region.iestName}</p>
          </div>
          <span class="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md ${isSponsored ? 'bg-teal-100 text-teal-800 dark:bg-teal-950/70 dark:text-teal-300 border border-teal-200 dark:border-teal-800' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700'}">
            ${isSponsored ? 'Patrocinada' : 'Disponible'}
          </span>
        </div>

        <p class="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 line-clamp-2 mb-3">
          <strong class="text-teal-600 dark:text-teal-400">Vocación territorial:</strong> ${region.localChallenge}
        </p>

        <div class="grid grid-cols-2 gap-2 text-[11px] text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-700/50">
          <div>
            <span class="block text-[10px] text-slate-400">Conexión nacional:</span>
            <span class="font-semibold text-slate-700 dark:text-slate-200">🔄 Codiseño en red</span>
          </div>
          <div>
            <span class="block text-[10px] text-slate-400">Postulantes:</span>
            <span class="font-semibold text-slate-700 dark:text-slate-200">${region.applicantsCount} jóvenes</span>
          </div>
        </div>

        <div class="mt-4 flex items-center justify-between text-xs pt-1">
          <span class="text-teal-600 dark:text-teal-400 font-semibold group-hover:underline flex items-center gap-1">
            Ficha regional
            <svg class="w-3.5 h-3.5 transform group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
          </span>
          <span class="text-[11px] text-slate-400">${region.femaleRatio}% chicas</span>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;

  container.querySelectorAll('.region-card').forEach(card => {
    card.addEventListener('click', () => {
      const regionId = card.getAttribute('data-region-id');
      selectRegion(regionId);
    });
  });
}

// Select Region & Open Slide Drawer
function selectRegion(regionId) {
  state.selectedRegionId = regionId;
  renderPeruMap();

  const region = PERU_MAP_DATA.regions.find(r => r.id === regionId);
  if (!region) return;

  const drawer = document.getElementById('region-drawer');
  if (!drawer) return;

  const isSponsored = region.sponsorStatus === 'sponsored';

  document.getElementById('drawer-region-title').textContent = region.name;
  document.getElementById('drawer-region-macro').textContent = `Macrorregión ${region.macroregion}`;
  document.getElementById('drawer-iest-name').textContent = region.iestName;
  document.getElementById('drawer-iest-city').textContent = region.iestCity;
  document.getElementById('drawer-challenge').textContent = region.localChallenge;
  document.getElementById('drawer-mirror-region').textContent = 'Por afinidad de desafío';
  document.getElementById('drawer-applicants').textContent = `${region.applicantsCount} estudiantes`;
  document.getElementById('drawer-female-ratio').textContent = `${region.femaleRatio}% mujeres`;
  
  const sponsorBadge = document.getElementById('drawer-sponsor-status');
  if (isSponsored) {
    sponsorBadge.className = 'px-3 py-1 rounded-full text-xs font-bold bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300 border border-teal-200';
    sponsorBadge.textContent = `Patrocinada por: ${region.sponsorName || 'Aliado regional'}`;
  } else {
    sponsorBadge.className = 'px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border border-slate-200';
    sponsorBadge.textContent = 'Disponible para adopción regional';
  }

  // Pre-fill form dropdowns
  const studentRegionSelect = document.getElementById('student-form-region');
  if (studentRegionSelect) studentRegionSelect.value = region.name;

  const drawerSponsorBtn = document.getElementById('drawer-sponsor-btn');
  if (drawerSponsorBtn) {
    drawerSponsorBtn.onclick = () => {
      closeRegionDrawer();
      openDeliaWhatsApp(`Adopción de la sede regional ${region.name}`);
    };
  }

  // Open drawer
  drawer.classList.remove('hidden');
  const panel = drawer.querySelector('.drawer-panel');
  const backdrop = drawer.querySelector('.drawer-backdrop');
  requestAnimationFrame(() => {
    backdrop.classList.remove('opacity-0');
    backdrop.classList.add('opacity-100');
    panel.classList.remove('translate-x-full');
    panel.classList.add('translate-x-0');
  });
}

function closeRegionDrawer() {
  const drawer = document.getElementById('region-drawer');
  if (!drawer) return;
  const panel = drawer.querySelector('.drawer-panel');
  const backdrop = drawer.querySelector('.drawer-backdrop');

  backdrop.classList.add('opacity-0');
  panel.classList.add('translate-x-full');
  setTimeout(() => {
    drawer.classList.add('hidden');
    state.selectedRegionId = null;
    renderPeruMap();
  }, 250);
}

function resetFilters() {
  state.macroFilter = 'all';
  state.sponsorFilter = 'all';
  state.searchQuery = '';

  const searchInput = document.getElementById('region-search-input');
  if (searchInput) searchInput.value = '';

  updateFilterTabsUI();
  renderPeruMap();
  renderRegionsGrid();
}

function updateFilterTabsUI() {
  document.querySelectorAll('.filter-macro-btn').forEach(btn => {
    const filter = btn.getAttribute('data-filter');
    if (filter === state.macroFilter) {
      btn.className = 'filter-macro-btn px-3 py-1.5 rounded-lg text-xs font-bold bg-teal-600 text-white shadow-sm';
    } else {
      btn.className = 'filter-macro-btn px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800';
    }
  });

  document.querySelectorAll('.filter-sponsor-btn').forEach(btn => {
    const filter = btn.getAttribute('data-sponsor-filter');
    if (filter === state.sponsorFilter) {
      btn.className = 'filter-sponsor-btn px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm';
    } else {
      btn.className = 'filter-sponsor-btn px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800';
    }
  });
}

// Render Pedagogical Phases
function renderPedagogy() {
  const container = document.getElementById('pedagogy-phases-container');
  if (!container) return;

  const phases = EDITION_CONFIG.pedagogy;
  container.innerHTML = phases.map(phase => {
    const isPresencial = (phase.modality || '').toLowerCase().includes('presencial');
    const modClass = isPresencial
      ? 'bg-pink-50 text-pink-700 dark:bg-pink-950/60 dark:text-pink-300 border-pink-200 dark:border-pink-800'
      : 'bg-cyan-50 text-cyan-700 dark:bg-cyan-950/60 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800';
    return `
      <div class="relative bg-white dark:bg-slate-800/90 rounded-2xl p-6 border border-slate-200 dark:border-slate-700/80 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
        <div>
          <div class="flex items-center justify-between mb-4">
            <span class="text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/60 px-3 py-1 rounded-full">
              Fase ${phase.step}
            </span>
            <span class="text-xs font-medium text-slate-400">${phase.period}</span>
          </div>
          <h4 class="font-bold text-base text-slate-900 dark:text-white mb-2">${phase.title}</h4>
          <p class="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">${phase.summary}</p>
        </div>
        ${phase.modality ? `<div class="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/60"><span class="inline-block text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${modClass}">${phase.modality}</span></div>` : ''}
      </div>
    `;
  }).join('');
}

// Render Selection Pillars
function renderSelectionCriteria() {
  const container = document.getElementById('criteria-container');
  if (!container) return;

  const langData = (window.SIMBIO_I18N && window.SIMBIO_I18N[currentLang]) || null;
  const pillars = (langData && langData.selectionPillars) ? langData.selectionPillars : EDITION_CONFIG.selectionPillars;

  container.innerHTML = pillars.map(c => `
    <div class="bg-slate-50 dark:bg-slate-800/80 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm h-full flex flex-col justify-between">
      <div>
        <div class="flex items-center gap-3 mb-3">
          <div class="w-10 h-10 rounded-xl bg-teal-600 text-white font-display font-extrabold text-sm flex items-center justify-center flex-shrink-0">
            ${c.pct}%
          </div>
          <h4 class="font-bold text-sm text-slate-900 dark:text-white leading-snug min-h-[2.5rem] flex items-center">${c.title}</h4>
        </div>
        <p class="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">${c.desc}</p>
      </div>
    </div>
  `).join('');
}

// Render CNEB Competencies & Transformation Indicators
function renderCompetenciesAndIndicators() {
  const compContainer = document.getElementById('competencies-container');
  const indContainer = document.getElementById('indicators-container');
  const langData = (window.SIMBIO_I18N && window.SIMBIO_I18N[currentLang]) || (window.SIMBIO_I18N && window.SIMBIO_I18N.es);
  if (!langData) return;

  if (compContainer && langData.competencies) {
    compContainer.innerHTML = langData.competencies.map(c => `
      <div class="bg-white dark:bg-slate-900/70 rounded-xl p-3.5 border border-slate-200/80 dark:border-slate-700/80">
        <div class="flex items-center gap-2 mb-1">
          <span class="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-300">${c.code}</span>
          <h5 class="font-bold text-xs text-slate-900 dark:text-white">${c.title}</h5>
        </div>
        <p class="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">${c.desc}</p>
      </div>
    `).join('');
  }

  if (indContainer && langData.indicators) {
    indContainer.innerHTML = langData.indicators.map(ind => {
      const isQual = ind.type.toLowerCase().includes('cual') || ind.type.toLowerCase().includes('qual');
      const badgeCls = isQual
        ? 'bg-pink-50 text-pink-700 dark:bg-pink-950/60 dark:text-pink-300'
        : 'bg-cyan-50 text-cyan-700 dark:bg-cyan-950/60 dark:text-cyan-300';
      return `
        <div class="bg-white dark:bg-slate-900/70 rounded-xl p-3.5 border border-slate-200/80 dark:border-slate-700/80">
          <div class="flex items-center gap-2 mb-1">
            <span class="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded ${badgeCls}">${ind.type}</span>
            <h5 class="font-bold text-xs text-slate-900 dark:text-white">${ind.metric}</h5>
          </div>
          <p class="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">${ind.desc}</p>
        </div>
      `;
    }).join('');
  }
}

// Render FAQ Accordion
function renderFaq() {
  const container = document.getElementById('faq-accordion-container');
  if (!container) return;

  const faqs = EDITION_CONFIG.faq;
  container.innerHTML = faqs.map((item, i) => `
    <div class="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden bg-white dark:bg-slate-800/90">
      <button 
        class="faq-toggle w-full px-6 py-4 text-left font-bold text-xs sm:text-sm text-slate-900 dark:text-white flex items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
        data-index="${i}"
      >
        <span>${item.q}</span>
        <svg class="w-4 h-4 text-slate-400 transform transition-transform duration-200 faq-icon flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
      </button>
      <div class="faq-content hidden px-6 pb-5 pt-1 text-xs text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-700/50">
        ${item.a}
      </div>
    </div>
  `).join('');

  container.querySelectorAll('.faq-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const content = btn.nextElementSibling;
      const icon = btn.querySelector('.faq-icon');
      const isHidden = content.classList.contains('hidden');

      container.querySelectorAll('.faq-content').forEach(c => c.classList.add('hidden'));
      container.querySelectorAll('.faq-icon').forEach(ic => ic.classList.remove('rotate-180'));

      if (isHidden) {
        content.classList.remove('hidden');
        icon.classList.add('rotate-180');
      }
    });
  });
}

// Student Form Handling with Auto-Draft
function initStudentForm() {
  const form = document.getElementById('student-application-form');
  if (!form) return;

  // Restore draft
  const draft = state.forms.studentDraft;
  Object.keys(draft).forEach(key => {
    const input = form.elements[key];
    if (input) input.value = draft[key];
  });

  // Auto-save draft
  form.addEventListener('input', () => {
    const formData = new FormData(form);
    const dataObj = {};
    formData.forEach((val, key) => { dataObj[key] = val; });
    localStorage.setItem('simbiomakers_student_draft', JSON.stringify(dataObj));
  });

  // Form submit
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = form.querySelector('button[type="submit"]');
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = `<span>Registrando tu postulación...</span>`;

    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());
    payload.timestamp = new Date().toISOString();
    payload.tipo = 'postulacion_estudiante';

    try {
      if (CONFIG.FORM_WEBHOOK_URL) {
        await fetch(CONFIG.FORM_WEBHOOK_URL, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      localStorage.removeItem('simbiomakers_student_draft');
      form.reset();
      closeModal('modal-estudiante');
      showToast('¡Tu postulación ha sido enviada con éxito! Nos comunicaremos contigo por WhatsApp.', 'success');
      showSuccessCelebration(payload.nombre);
    } catch (err) {
      console.error(err);
      showToast('Tus datos han quedado registrados en tu navegador.', 'info');
    } finally {
      btn.disabled = false;
      btn.innerHTML = originalText;
    }
  });
}

// IEST Form Handling (with multiple-choice equipment checkboxes)
function initIestForm() {
  const form = document.getElementById('iest-application-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = form.querySelector('button[type="submit"]');
    btn.disabled = true;

    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());
    const checkedEquip = Array.from(form.querySelectorAll('input[name="equipamiento"]:checked')).map(cb => cb.value);
    payload.equipamiento = checkedEquip.join(', ');
    payload.timestamp = new Date().toISOString();
    payload.tipo = 'registro_sede_iest';

    try {
      if (CONFIG.FORM_WEBHOOK_URL) {
        await fetch(CONFIG.FORM_WEBHOOK_URL, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }
      form.reset();
      closeModal('modal-iest');
      showToast('¡Sede IEST registrada! La coordinación de Fab Lab Perú se contactará con tu laboratorio.', 'success');
    } catch (err) {
      console.error(err);
    } finally {
      btn.disabled = false;
    }
  });
}

// Volunteer Mentor Form Handling
function initMentorForm() {
  const form = document.getElementById('mentor-application-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = form.querySelector('button[type="submit"]');
    btn.disabled = true;

    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());
    payload.timestamp = new Date().toISOString();
    payload.tipo = 'registro_mentor';

    try {
      if (CONFIG.FORM_WEBHOOK_URL) {
        await fetch(CONFIG.FORM_WEBHOOK_URL, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }
      form.reset();
      closeModal('modal-mentor');
      showToast('¡Gracias por sumarte como Mentor! Te contactaremos antes del inicio en enero 2027.', 'success');
    } catch (err) {
      console.error(err);
    } finally {
      btn.disabled = false;
    }
  });
}

// Live Google Sheet CSV Sync (runs automatically if LIVE_SHEET_CSV_URL is configured)
async function syncLiveSheetData() {
  if (!CONFIG.LIVE_SHEET_CSV_URL) return;
  try {
    const res = await fetch(CONFIG.LIVE_SHEET_CSV_URL);
    if (!res.ok) return;
    const csv = await res.text();
    const lines = csv.split(/\r?\n/).filter(Boolean);
    if (lines.length < 2) return;

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const normalize = (s) => (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',').map(c => c.trim().replace(/^"|"$/g, ''));
      const row = {};
      headers.forEach((h, idx) => { row[h] = cols[idx] || ''; });

      const region = PERU_MAP_DATA.regions.find(r => normalize(r.name) === normalize(row.region || row.departamento));
      if (region) {
        if (row.postulantes) region.applicantsCount = parseInt(row.postulantes, 10) || region.applicantsCount;
        if (row.mujeres_pct) region.femaleRatio = parseInt(row.mujeres_pct, 10) || region.femaleRatio;
        if (row.estado) region.sponsorStatus = row.estado.toLowerCase().includes('patrocin') ? 'sponsored' : 'available';
        if (row.sponsor) region.sponsorName = row.sponsor || null;
      }
    }

    renderGlobalStats();
    renderHeroNetworkMap();
    renderPeruMap();
    renderRegionsGrid();
  } catch (err) {
    console.warn('No se pudo sincronizar Google Sheet en vivo:', err);
  }
}

function showSuccessCelebration(nombre = 'Maker') {
  const celebrationModal = document.getElementById('modal-celebration');
  if (!celebrationModal) return;
  const nameEl = document.getElementById('celebration-name');
  if (nameEl) nameEl.textContent = nombre;
  openModal('modal-celebration');
}

// Global Event Listeners
function setupEventListeners() {
  const themeBtn = document.getElementById('theme-toggle-btn');
  if (themeBtn) themeBtn.addEventListener('click', toggleTheme);

  // Mobile Menu Toggle
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  const mobileMenu = document.getElementById('mobile-menu');
  if (mobileMenuBtn && mobileMenu) {
    mobileMenuBtn.addEventListener('click', () => {
      mobileMenu.classList.toggle('hidden');
    });
    mobileMenu.querySelectorAll('.mobile-nav-link').forEach(link => {
      link.addEventListener('click', () => mobileMenu.classList.add('hidden'));
    });
  }

  // View switch (Map vs Grid)
  const viewMapBtn = document.getElementById('view-map-btn');
  const viewGridBtn = document.getElementById('view-grid-btn');
  const mapViewSection = document.getElementById('peru-map-view-section');
  const gridViewSection = document.getElementById('peru-grid-view-section');

  if (viewMapBtn && viewGridBtn) {
    viewMapBtn.addEventListener('click', () => {
      state.viewMode = 'map';
      viewMapBtn.className = 'px-3 py-1.5 rounded-lg text-xs font-bold bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-400 shadow-sm';
      viewGridBtn.className = 'px-3 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:text-slate-900 dark:hover:text-white';
      mapViewSection.classList.remove('hidden');
      gridViewSection.classList.add('hidden');
      renderPeruMap();
    });

    viewGridBtn.addEventListener('click', () => {
      state.viewMode = 'grid';
      viewGridBtn.className = 'px-3 py-1.5 rounded-lg text-xs font-bold bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-400 shadow-sm';
      viewMapBtn.className = 'px-3 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:text-slate-900 dark:hover:text-white';
      gridViewSection.classList.remove('hidden');
      mapViewSection.classList.add('hidden');
      renderRegionsGrid();
    });
  }

  // Macrorregion filters
  document.querySelectorAll('.filter-macro-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      state.macroFilter = btn.getAttribute('data-filter');
      updateFilterTabsUI();
      renderPeruMap();
      renderRegionsGrid();
    });
  });

  // Sponsor status filters
  document.querySelectorAll('.filter-sponsor-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      state.sponsorFilter = btn.getAttribute('data-sponsor-filter');
      updateFilterTabsUI();
      renderPeruMap();
      renderRegionsGrid();
    });
  });

  // Search input
  const searchInput = document.getElementById('region-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      state.searchQuery = e.target.value;
      renderPeruMap();
      renderRegionsGrid();
    });
  }

  // Drawer close buttons
  document.querySelectorAll('.drawer-close-btn').forEach(btn => {
    btn.addEventListener('click', closeRegionDrawer);
  });

  // Modal close buttons
  document.querySelectorAll('.modal-close-btn').forEach(btn => {
    const modalId = btn.getAttribute('data-modal-id');
    btn.addEventListener('click', () => closeModal(modalId));
  });

  // Populate region dropdowns (clean region names only, without IEST names)
  const studentSelect = document.getElementById('student-form-region');
  const iestSelect = document.getElementById('iest-form-region');

  const optionsHtml = PERU_MAP_DATA.regions
    .map(r => `<option value="${r.name}">${r.name}</option>`)
    .join('');

  if (studentSelect) studentSelect.innerHTML = `<option value="">Selecciona tu región</option>` + optionsHtml;
  if (iestSelect) iestSelect.innerHTML = `<option value="">Selecciona la región de tu IEST</option>` + optionsHtml;
}

function openDeliaWhatsApp(contextText = '') {
  const msg = contextText
    ? `Hola Delia, me gustaría conversar sobre SimbioMakers PE (${contextText}).`
    : 'Hola Delia, me gustaría conocer cómo sumar a mi organización como aliado en SimbioMakers PE.';
  window.open(`https://wa.me/51946037105?text=${encodeURIComponent(msg)}`, '_blank', 'noopener,noreferrer');
}

window.openDeliaWhatsApp = openDeliaWhatsApp;
window.openModal = openModal;
window.closeModal = closeModal;
window.selectRegion = selectRegion;
window.closeRegionDrawer = closeRegionDrawer;


// ==========================================
// Language Switcher (ES / EN) & Escape Key
// ==========================================
let currentLang = localStorage.getItem('simbiomakers_lang') || 'es';

const I18N_DICT = {
  es: {
    nav_program: 'Programa',
    nav_join: 'Participa',
    nav_method: 'Metodología',
    nav_allies: 'Aliados',
    cta_apply: 'Postular',
    cta_adopt: 'Adopta una región',
    hero_student: '🎓 Soy estudiante',
    hero_iest: '🏛️ Soy sede IEST',
    hero_sponsor: '🤝 Soy aliado / sponsor',
    sec_prog_badge: 'El programa',
    sec_map_badge: 'Mapeo nacional',
    sec_map_title: '24 Fab Labs públicos y vocaciones territoriales',
    sec_part_badge: 'Cómo participar',
    sec_part_title: 'Tres puertas de acción transformadora',
    sec_method_badge: 'Metodología SimbioCreación',
    sec_method_title: 'De ideas individuales a una red nacional de co-creación',
    sec_allies_badge: 'Alianzas institucionales',
    sec_allies_title: 'Invierte en el talento creador de una región',
    sec_faq_badge: 'Preguntas frecuentes',
    sec_faq_title: 'Claridad para estudiantes, sedes IEST y aliados',
    p3_title: 'De MPV a MIP'
  },
  en: {
    nav_program: 'Program',
    nav_join: 'Join',
    nav_method: 'Methodology',
    nav_allies: 'Partners',
    cta_apply: 'Apply',
    cta_adopt: 'Adopt a region',
    hero_student: '🎓 I am a student',
    hero_iest: '🏛️ IEST Fab Lab',
    hero_sponsor: '🤝 Partner / Sponsor',
    sec_prog_badge: 'The Program',
    sec_map_badge: 'National Mapping',
    sec_map_title: '24 Public Fab Labs & Territorial Focus',
    sec_part_badge: 'How to Join',
    sec_part_title: 'Three Pathways for Action',
    sec_method_badge: 'SimbioCreación Methodology',
    sec_method_title: 'From individual ideas to a national co-creation network',
    sec_allies_badge: 'Institutional Partnerships',
    sec_allies_title: 'Invest in regional creative talent',
    sec_faq_badge: 'FAQ',
    sec_faq_title: 'Clarity for students, IEST labs & partners',
    p3_title: 'From MVP to MIP'
  }
};

function applyLanguage(lang) {
  currentLang = lang;
  localStorage.setItem('simbiomakers_lang', lang);
  const btn = document.getElementById('lang-toggle-btn');
  if (btn) btn.textContent = lang === 'es' ? 'EN' : 'ES';

  const dict = (window.SIMBIO_I18N && window.SIMBIO_I18N[lang]) || (window.SIMBIO_I18N && window.SIMBIO_I18N.es) || {};
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (dict[key] && typeof dict[key] === 'string') el.textContent = dict[key];
  });
  document.querySelectorAll('[data-i18n-html]').forEach(el => {
    const key = el.getAttribute('data-i18n-html');
    if (dict[key] && typeof dict[key] === 'string') el.innerHTML = dict[key];
  });

  const heroH1 = document.querySelector('h1');
  const heroLead = heroH1 ? heroH1.nextElementSibling : null;
  if (heroH1 && dict.hero_h1) heroH1.innerHTML = dict.hero_h1;
  if (heroLead && dict.hero_lead) heroLead.textContent = dict.hero_lead;

  if (typeof renderPedagogy === 'function') renderPedagogy();
  if (typeof renderSelectionCriteria === 'function') renderSelectionCriteria();
  if (typeof renderCompetenciesAndIndicators === 'function') renderCompetenciesAndIndicators();
  if (typeof updateScale500UI === 'function') updateScale500UI();
}

function initLanguageToggle() {
  const btn = document.getElementById('lang-toggle-btn');
  if (!btn) return;
  applyLanguage(currentLang);
  btn.addEventListener('click', () => {
    applyLanguage(currentLang === 'es' ? 'en' : 'es');
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initLanguageToggle();
  initTheme();
  renderGlobalStats();
  renderHeroNetworkMap();
  renderPeruMap();
  renderRegionsGrid();
  initHeroRotatingWords();
  initScale500Canvas();
  renderPedagogy();
  renderSelectionCriteria();
  renderCompetenciesAndIndicators();
  renderSponsorTiers();
  renderFaq();
  initStudentForm();
  initIestForm();
  initMentorForm();
  setupEventListeners();
  syncLiveSheetData();

  // Atajo de teclado interno: Tecla 'F' para alternar Fullscreen (sin bloquear Ctrl+F ni inputs)
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const tag = (e.target && e.target.tagName) ? e.target.tagName.toLowerCase() : '';
    if (tag === 'input' || tag === 'textarea' || tag === 'select' || (e.target && e.target.isContentEditable)) return;

    if (e.key === 'Escape') {
      ['modal-estudiante', 'modal-iest', 'modal-mentor', 'modal-celebration'].forEach(id => {
        const m = document.getElementById(id);
        if (m && !m.classList.contains('hidden')) closeModal(id);
      });
      const drawer = document.getElementById('region-drawer');
      if (drawer && !drawer.classList.contains('hidden')) closeRegionDrawer();
      return;
    }

    if (e.key === 'f' || e.key === 'F') {
      e.preventDefault();
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      } else {
        document.exitFullscreen().catch(() => {});
      }
    }
  });
});
