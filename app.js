const { EDITION_CONFIG, PERU_MAP_DATA } = window;

// Global App State
const state = {
  theme: localStorage.getItem('simbiomakers_theme') || 'light',
  viewMode: 'map', // 'map' | 'grid'
  macroFilter: 'all', // 'all' | 'Norte' | 'Centro' | 'Sur' | 'Oriente'
  sponsorFilter: 'all', // 'all' | 'available' | 'sponsored'
  searchQuery: '',
  selectedRegionId: null,
  calcRegions: 3,
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
  const totalApplicants = regions.reduce((acc, r) => acc + (r.applicantsCount || 0), 0);
  const sponsoredCount = regions.filter(r => r.sponsorStatus === 'sponsored').length;
  const availableCount = regions.filter(r => r.sponsorStatus === 'available').length;
  const avgFemale = Math.round(regions.reduce((acc, r) => acc + (r.femaleRatio || 50), 0) / regions.length);

  const elApplicants = document.getElementById('stat-total-applicants');
  const elSponsored = document.getElementById('stat-sponsored-regions');
  const elFemale = document.getElementById('stat-female-ratio');

  if (elApplicants) elApplicants.textContent = `+${totalApplicants}`;
  if (elSponsored) elSponsored.textContent = `${sponsoredCount} patrocinadas / ${availableCount} disponibles`;
  if (elFemale) elFemale.textContent = `${avgFemale}%`;
}

// Render Minimalist Animated Network Map in Hero (Zero text clutter, pure visual impact)
function renderHeroNetworkMap() {
  const container = document.getElementById('hero-peru-network');
  if (!container) return;

  const { viewBox, regions } = PERU_MAP_DATA;
  const [minX, minY, width, height] = viewBox;

  // Build unique pairs of connected regions (region <-> regionAliada)
  const pairs = [];
  const seen = new Set();
  regions.forEach(r => {
    const ally = regions.find(x => x.name.toLowerCase() === (r.regionAliada || '').toLowerCase());
    if (ally) {
      const key = [r.id, ally.id].sort().join('--');
      if (!seen.has(key)) {
        seen.add(key);
        pairs.push([r, ally]);
      }
    }
  });

  let svg = `
    <svg viewBox="${minX} ${minY} ${width} ${height}" class="w-full h-auto max-h-[430px] mx-auto select-none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="arc-grad-teal" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#0D9488" stop-opacity="0.85" />
          <stop offset="100%" stop-color="#00BBF9" stop-opacity="0.85" />
        </linearGradient>
        <linearGradient id="arc-grad-magenta" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#e60066" stop-opacity="0.75" />
          <stop offset="100%" stop-color="#00BBF9" stop-opacity="0.75" />
        </linearGradient>
      </defs>
      <g>
  `;

  // Subtle Peru silhouette
  regions.forEach(r => {
    svg += `<path d="${r.d}" class="fill-slate-100/90 dark:fill-slate-800/70 stroke-slate-200/90 dark:stroke-slate-700/60 stroke-[0.9] transition-colors hover:fill-teal-50 dark:hover:fill-slate-700 cursor-pointer" data-hero-region="${r.id}" />`;
  });

  // Curved Bezier interconnection arcs
  pairs.forEach(([a, b], idx) => {
    const mx = (a.cx + b.cx) / 2;
    const my = (a.cy + b.cy) / 2;
    const dx = b.cx - a.cx;
    const dy = b.cy - a.cy;
    // Offset control point perpendicular to chord for graceful arc
    const cx = mx - dy * 0.22;
    const cy = my + dx * 0.22;
    const grad = idx % 3 === 0 ? 'url(#arc-grad-magenta)' : 'url(#arc-grad-teal)';
    const delay = (idx * 0.35).toFixed(2);

    svg += `
      <path d="M ${a.cx} ${a.cy} Q ${cx.toFixed(1)} ${cy.toFixed(1)} ${b.cx} ${b.cy}"
        fill="none" stroke="${grad}" stroke-width="1.4" stroke-opacity="0.25" />
      <path d="M ${a.cx} ${a.cy} Q ${cx.toFixed(1)} ${cy.toFixed(1)} ${b.cx} ${b.cy}"
        fill="none" stroke="${grad}" stroke-width="1.8"
        class="hero-network-flow" style="animation-delay: ${delay}s;" />
    `;
  });

  // Glowing 25 regional nodes
  regions.forEach((r, idx) => {
    const isSponsored = r.sponsorStatus === 'sponsored';
    const color = isSponsored ? '#e60066' : '#0D9488';
    const delay = (idx * 0.12).toFixed(2);
    svg += `
      <g transform="translate(${r.cx}, ${r.cy})" class="cursor-pointer" data-hero-region="${r.id}">
        <circle r="6" fill="${color}" opacity="0.22" class="animate-ping" style="animation-duration: 3s; animation-delay: ${delay}s;" />
        <circle r="3.2" fill="${color}" stroke="#ffffff" stroke-width="1.2" />
      </g>
    `;
  });

  svg += `</g></svg>`;
  container.innerHTML = svg;

  // Clicking any region in hero map smoothly scrolls to #mapa and opens that region's drawer
  container.querySelectorAll('[data-hero-region]').forEach(el => {
    el.addEventListener('click', () => {
      const id = el.getAttribute('data-hero-region');
      document.getElementById('mapa')?.scrollIntoView({ behavior: 'smooth' });
      setTimeout(() => selectRegion(id), 450);
    });
  });
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
          <strong class="text-teal-600 dark:text-teal-400">Reto:</strong> ${region.localChallenge}
        </p>

        <div class="grid grid-cols-2 gap-2 text-[11px] text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-700/50">
          <div>
            <span class="block text-[10px] text-slate-400">Región Aliada:</span>
            <span class="font-semibold text-slate-700 dark:text-slate-200">🤝 ${region.regionAliada}</span>
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
  document.getElementById('drawer-mirror-region').textContent = region.regionAliada;
  document.getElementById('drawer-applicants').textContent = `${region.applicantsCount} estudiantes`;
  document.getElementById('drawer-female-ratio').textContent = `${region.femaleRatio}% de mujeres postulantes`;
  
  const sponsorBadge = document.getElementById('drawer-sponsor-status');
  if (isSponsored) {
    sponsorBadge.className = 'px-3 py-1 rounded-full text-xs font-bold bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300 border border-teal-200';
    sponsorBadge.textContent = `Patrocinada por: ${region.sponsorName || 'Aliado Regional'}`;
  } else {
    sponsorBadge.className = 'px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border border-slate-200';
    sponsorBadge.textContent = 'Disponible para Adopción Regional';
  }

  // Pre-fill form dropdowns
  const studentRegionSelect = document.getElementById('student-form-region');
  if (studentRegionSelect) studentRegionSelect.value = region.name;

  const sponsorRegionSelect = document.getElementById('sponsor-form-region');
  if (sponsorRegionSelect) sponsorRegionSelect.value = region.name;

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
  container.innerHTML = phases.map(phase => `
    <div class="relative bg-white dark:bg-slate-800/90 rounded-2xl p-6 border border-slate-200 dark:border-slate-700/80 shadow-sm hover:shadow-md transition-shadow">
      <div class="flex items-center justify-between mb-4">
        <span class="text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/60 px-3 py-1 rounded-full">
          Fase ${phase.step}
        </span>
        <span class="text-xs font-medium text-slate-400">${phase.period}</span>
      </div>
      <h4 class="font-bold text-base text-slate-900 dark:text-white mb-2">${phase.title}</h4>
      <p class="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">${phase.summary}</p>
    </div>
  `).join('');
}

// Render Selection Pillars
function renderSelectionCriteria() {
  const container = document.getElementById('criteria-container');
  if (!container) return;

  const pillars = EDITION_CONFIG.selectionPillars;
  container.innerHTML = pillars.map(item => `
    <div class="bg-white dark:bg-slate-800/90 rounded-2xl p-6 border border-slate-200 dark:border-slate-700/80 shadow-sm">
      <div class="flex items-center gap-3 mb-3">
        <div class="w-11 h-11 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 text-white font-extrabold text-base flex items-center justify-center shadow-sm">
          ${item.pct}%
        </div>
        <h4 class="font-bold text-sm text-slate-900 dark:text-white">${item.title}</h4>
      </div>
      <p class="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">${item.desc}</p>
    </div>
  `).join('');
}

// Render Sponsor Tiers
function renderSponsorTiers() {
  const container = document.getElementById('sponsor-tiers-container');
  if (!container) return;

  const tiers = EDITION_CONFIG.sponsorTiers;
  container.innerHTML = tiers.map(tier => `
    <div class="relative bg-white dark:bg-slate-800/90 rounded-3xl p-7 border ${tier.featured ? 'border-teal-500 ring-2 ring-teal-500/20 shadow-xl' : 'border-slate-200 dark:border-slate-700 shadow-sm'} flex flex-col justify-between">
      ${tier.featured ? '<div class="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-teal-600 text-white shadow">Modalidad Principal</div>' : ''}
      <div>
        <div class="flex items-center justify-between gap-2 mb-2">
          <span class="text-[10px] font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/60 px-2.5 py-1 rounded-md">${tier.badge}</span>
        </div>
        <h4 class="font-bold text-lg text-slate-900 dark:text-white mt-2">${tier.title}</h4>
        <p class="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">${tier.summary}</p>
        <p class="text-xs text-slate-600 dark:text-slate-300 mt-3 leading-relaxed">${tier.description}</p>
        
        <ul class="mt-5 space-y-2 text-xs text-slate-600 dark:text-slate-300">
          ${tier.benefits.map(b => `
            <li class="flex items-start gap-2">
              <svg class="w-4 h-4 text-teal-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
              <span>${b}</span>
            </li>
          `).join('')}
        </ul>
      </div>

      <div class="mt-7">
        <button 
          onclick="window.selectSponsorTier('${tier.id}')"
          class="w-full py-3 px-4 rounded-xl font-bold text-xs tracking-wide transition-all ${tier.featured ? 'bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white shadow-md' : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-white'}"
        >
          Elegir Esta Modalidad
        </button>
      </div>
    </div>
  `).join('');
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

// Dynamic Impact Calculator
function initBudgetCalculator() {
  const slider = document.getElementById('calc-region-slider');
  const regionCountVal = document.getElementById('calc-region-count');
  const totalStudentsVal = document.getElementById('calc-total-students');
  const totalTeamsVal = document.getElementById('calc-total-teams');
  const prototypesVal = document.getElementById('calc-prototypes');
  const freightSavedVal = document.getElementById('calc-freight-saved');

  if (!slider) return;

  function updateCalc() {
    const regions = parseInt(slider.value, 10);
    state.calcRegions = regions;
    const studentsPerRegion = 20;
    const teamsPerRegion = 4;
    const totalStudents = regions * studentsPerRegion;
    const totalTeams = regions * teamsPerRegion;
    const freightSaved = totalTeams * 150; // Ahorro logístico por fabricación local

    if (regionCountVal) regionCountVal.textContent = regions;
    if (totalStudentsVal) totalStudentsVal.textContent = `+${totalStudents}`;
    if (totalTeamsVal) totalTeamsVal.textContent = totalTeams;
    if (prototypesVal) prototypesVal.textContent = totalTeams;
    if (freightSavedVal) freightSavedVal.textContent = `S/ ${freightSaved.toLocaleString('es-PE')}`;
  }

  slider.addEventListener('input', updateCalc);
  updateCalc();
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

// Sponsor Form Handling
function initSponsorForm() {
  const form = document.getElementById('sponsor-application-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = form.querySelector('button[type="submit"]');
    btn.disabled = true;

    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());
    payload.timestamp = new Date().toISOString();
    payload.tipo = 'interes_sponsor';

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
      closeModal('modal-sponsor');
      showToast('¡Gracias por sumarte como Aliado! Te enviaremos el dossier de impacto MIP.', 'success');
    } catch (err) {
      console.error(err);
      showToast('Gracias. Nos pondremos en contacto contigo a la brevedad.', 'success');
    } finally {
      btn.disabled = false;
    }
  });
}

// IEST / School Form Handling
function initIestForm() {
  const form = document.getElementById('iest-application-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = form.querySelector('button[type="submit"]');
    btn.disabled = true;

    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());
    payload.timestamp = new Date().toISOString();
    payload.tipo = 'registro_iest_colegio';

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
      showToast('¡Registro recibido! La coordinación de Fab Lab Perú se contactará con tu institución.', 'success');
    } catch (err) {
      console.error(err);
    } finally {
      btn.disabled = false;
    }
  });
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

  // Populate region dropdowns
  const studentSelect = document.getElementById('student-form-region');
  const sponsorSelect = document.getElementById('sponsor-form-region');
  const iestSelect = document.getElementById('iest-form-region');

  const optionsHtml = PERU_MAP_DATA.regions
    .map(r => `<option value="${r.name}">${r.name} (${r.macroregion}) - Sede ${r.iestName}</option>`)
    .join('');

  if (studentSelect) studentSelect.innerHTML = `<option value="">Selecciona tu Departamento / Región</option>` + optionsHtml;
  if (sponsorSelect) sponsorSelect.innerHTML = `<option value="Cualquier Región con Mayor Necesidad">Cualquier Región con Mayor Necesidad</option>` + optionsHtml;
  if (iestSelect) iestSelect.innerHTML = `<option value="">Selecciona la Región de tu Institución</option>` + optionsHtml;
}

window.selectSponsorTier = function(tierId) {
  const tier = EDITION_CONFIG.sponsorTiers.find(t => t.id === tierId);
  const selectEl = document.getElementById('sponsor-form-tier');
  if (selectEl && tier) {
    selectEl.value = tier.id;
  }
  openModal('modal-sponsor');
};

window.openModal = openModal;
window.closeModal = closeModal;
window.selectRegion = selectRegion;
window.closeRegionDrawer = closeRegionDrawer;

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  renderGlobalStats();
  renderHeroNetworkMap();
  renderPeruMap();
  renderRegionsGrid();
  renderPedagogy();
  renderSelectionCriteria();
  renderSponsorTiers();
  renderFaq();
  initBudgetCalculator();
  initStudentForm();
  initSponsorForm();
  initIestForm();
  setupEventListeners();
});
