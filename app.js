import { EDITION_CONFIG, PERU_MAP_DATA } from './data.js';

// Global App State
const state = {
  theme: localStorage.getItem('simbiomakers_theme') || 'light',
  viewMode: 'map', // 'map' | 'grid'
  macroFilter: 'all', // 'all' | 'Norte' | 'Centro' | 'Sur' | 'Oriente'
  sponsorFilter: 'all', // 'all' | 'available' | 'sponsored'
  searchQuery: '',
  selectedRegionId: null,
  calcRegions: 1,
  calcStudentsPerRegion: 20,
  forms: {
    studentDraft: JSON.parse(localStorage.getItem('simbiomakers_student_draft') || '{}'),
    sponsorDraft: JSON.parse(localStorage.getItem('simbiomakers_sponsor_draft') || '{}')
  }
};

// Webhook config (replace with your Google Apps Script Webhook or Formspree endpoint)
const CONFIG = {
  GOOGLE_SHEET_WEBHOOK: '', // Set your Google Apps Script URL here
  FORMSPREE_ENDPOINT: ''    // Or your Formspree endpoint
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
    ? `<svg class="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/></svg>`
    : `<svg class="w-5 h-5 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/></svg>`;
}

// Toast Notifications
export function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  const bgColors = {
    success: 'bg-emerald-600 text-white',
    error: 'bg-rose-600 text-white',
    info: 'bg-cyan-600 text-white'
  };
  toast.className = `flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl text-sm font-medium transform transition-all duration-300 translate-y-2 opacity-0 ${bgColors[type] || bgColors.success}`;
  toast.innerHTML = `
    <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
export function openModal(modalId) {
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

export function closeModal(modalId) {
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

// Render Stats & Metrics
function renderGlobalStats() {
  const regions = PERU_MAP_DATA.regions;
  const totalApplicants = regions.reduce((acc, r) => acc + r.applicantsCount, 0);
  const sponsoredCount = regions.filter(r => r.sponsorStatus === 'sponsored').length;
  const availableCount = regions.filter(r => r.sponsorStatus === 'available').length;
  const avgFemale = Math.round(regions.reduce((acc, r) => acc + r.femaleRatio, 0) / regions.length);

  const elApplicants = document.getElementById('stat-total-applicants');
  const elSponsored = document.getElementById('stat-sponsored-regions');
  const elAvailable = document.getElementById('stat-available-regions');
  const elFemale = document.getElementById('stat-female-ratio');

  if (elApplicants) elApplicants.textContent = totalApplicants;
  if (elSponsored) elSponsored.textContent = `${sponsoredCount}/25`;
  if (elAvailable) elAvailable.textContent = availableCount;
  if (elFemale) elFemale.textContent = `${avgFemale}%`;
}

// Render SVG Map of Peru
function renderPeruMap() {
  const container = document.getElementById('peru-map-svg-container');
  if (!container) return;

  const { viewBox, regions } = PERU_MAP_DATA;
  const [minX, minY, width, height] = viewBox;

  let svgHtml = `
    <svg viewBox="${minX} ${minY} ${width} ${height}" class="w-full h-auto max-h-[750px] mx-auto filter drop-shadow-md select-none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        <linearGradient id="grad-available" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#F1F5F9" />
          <stop offset="100%" stop-color="#E2E8F0" />
        </linearGradient>
        <linearGradient id="grad-sponsored" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#00F5D4" />
          <stop offset="100%" stop-color="#00BBF9" />
        </linearGradient>
      </defs>
      <g id="regions-group">
  `;

  regions.forEach(region => {
    const isSponsored = region.sponsorStatus === 'sponsored';
    const isSelected = state.selectedRegionId === region.id;
    const isFilteredOut = isRegionFilteredOut(region);

    let fillClass = isSponsored
      ? 'fill-teal-500/80 hover:fill-teal-400 stroke-teal-700/60'
      : 'fill-slate-200 dark:fill-slate-800 hover:fill-teal-100 dark:hover:fill-slate-700 stroke-slate-300 dark:stroke-slate-700';

    if (isSelected) {
      fillClass = 'fill-cyan-500 stroke-cyan-600 stroke-2';
    }

    if (isFilteredOut) {
      fillClass += ' opacity-25';
    }

    svgHtml += `
      <path 
        id="map-path-${region.id}"
        data-id="${region.id}"
        data-name="${region.name}"
        d="${region.d}" 
        class="transition-all duration-200 cursor-pointer stroke-[1] ${fillClass}"
      >
        <title>${region.name} - ${region.iestName} (${isSponsored ? 'Patrocinado' : 'Disponible para adopción'})</title>
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
        <circle r="6" fill="${pulseColor}" opacity="0.35" class="animate-ping" />
        <circle r="4" fill="${circleColor}" stroke="#ffffff" stroke-width="1.5" />
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

// Check if region matches current filters
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

// Tooltip Management for Map
function showMapTooltip(e, regionId) {
  const tooltip = document.getElementById('map-tooltip');
  if (!tooltip) return;
  const region = PERU_MAP_DATA.regions.find(r => r.id === regionId);
  if (!region) return;

  const isSponsored = region.sponsorStatus === 'sponsored';
  tooltip.innerHTML = `
    <div class="font-bold text-sm text-slate-900 dark:text-white flex items-center justify-between gap-3">
      <span>${region.name}</span>
      <span class="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded ${isSponsored ? 'bg-teal-100 text-teal-800 dark:bg-teal-900/60 dark:text-teal-300' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'}">
        ${isSponsored ? 'Patrocinada' : 'Disponible'}
      </span>
    </div>
    <div class="text-xs text-slate-600 dark:text-slate-300 mt-1">
      <span class="font-semibold text-teal-600 dark:text-teal-400">Sede:</span> ${region.iestName}
    </div>
    <div class="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mt-2 pt-1.5 border-t border-slate-200 dark:border-slate-700">
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
        <p class="text-base font-medium">No se encontraron regiones con el filtro actual.</p>
        <button id="reset-filters-btn" class="mt-3 px-4 py-2 text-xs font-semibold text-teal-600 bg-teal-50 rounded-lg hover:bg-teal-100">Limpiar Filtros</button>
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
    const pct = Math.round((region.applicantsCount / region.quotaTarget) * 100);

    html += `
      <div 
        data-region-id="${region.id}"
        class="region-card group relative bg-white dark:bg-slate-800 rounded-2xl p-5 border transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md ${isSelected ? 'border-teal-500 ring-2 ring-teal-500/20' : 'border-slate-200 dark:border-slate-700/80 hover:border-teal-300'}"
      >
        <div class="flex items-start justify-between gap-2 mb-3">
          <div>
            <div class="flex items-center gap-2">
              <h4 class="font-bold text-base text-slate-900 dark:text-white group-hover:text-teal-600 transition-colors">${region.name}</h4>
              <span class="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">${region.macroregion}</span>
            </div>
            <p class="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">Sede: ${region.iestName}</p>
          </div>
          <span class="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md ${isSponsored ? 'bg-teal-100 text-teal-800 dark:bg-teal-950/70 dark:text-teal-300 border border-teal-200 dark:border-teal-800' : 'bg-amber-50 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200 dark:border-amber-800'}">
            ${isSponsored ? 'Patrocinada' : 'Adopción'}
          </span>
        </div>

        <p class="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/80 line-clamp-2 mb-3">
          <strong class="text-teal-600 dark:text-teal-400">Reto:</strong> ${region.localChallenge}
        </p>

        <!-- Mirror Region & Quotas -->
        <div class="grid grid-cols-2 gap-2 text-[11px] text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-700/50">
          <div>
            <span class="block text-[10px] text-slate-400">Región Espejo 3D:</span>
            <span class="font-semibold text-slate-700 dark:text-slate-200">🔄 ${region.mirrorRegion}</span>
          </div>
          <div>
            <span class="block text-[10px] text-slate-400">Postulantes:</span>
            <span class="font-semibold text-slate-700 dark:text-slate-200">${region.applicantsCount}/${region.quotaTarget} (${pct}%)</span>
          </div>
        </div>

        <!-- Progress bar -->
        <div class="w-full bg-slate-100 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden mt-3">
          <div class="bg-gradient-to-r from-teal-500 to-cyan-500 h-full rounded-full transition-all duration-300" style="width: ${Math.min(pct, 100)}%"></div>
        </div>

        <div class="mt-4 flex items-center justify-between text-xs">
          <span class="text-teal-600 dark:text-teal-400 font-semibold group-hover:underline flex items-center gap-1">
            Ver detalles
            <svg class="w-3.5 h-3.5 transform group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
          </span>
          <span class="text-[11px] text-slate-400">50% STEAM</span>
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
export function selectRegion(regionId) {
  state.selectedRegionId = regionId;
  renderPeruMap(); // re-highlight path

  const region = PERU_MAP_DATA.regions.find(r => r.id === regionId);
  if (!region) return;

  const drawer = document.getElementById('region-drawer');
  if (!drawer) return;

  const isSponsored = region.sponsorStatus === 'sponsored';
  const pct = Math.round((region.applicantsCount / region.quotaTarget) * 100);

  document.getElementById('drawer-region-title').textContent = region.name;
  document.getElementById('drawer-region-macro').textContent = `Macrorregión ${region.macroregion}`;
  document.getElementById('drawer-iest-name').textContent = region.iestName;
  document.getElementById('drawer-iest-city').textContent = region.iestCity;
  document.getElementById('drawer-challenge').textContent = region.localChallenge;
  document.getElementById('drawer-mirror-region').textContent = region.mirrorRegion;
  document.getElementById('drawer-applicants').textContent = `${region.applicantsCount} / ${region.quotaTarget} estudiantes`;
  document.getElementById('drawer-female-ratio').textContent = `${region.femaleRatio}% de postulantes mujeres`;
  
  const sponsorBadge = document.getElementById('drawer-sponsor-status');
  if (isSponsored) {
    sponsorBadge.className = 'px-3 py-1 rounded-full text-xs font-bold bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300 border border-teal-200';
    sponsorBadge.textContent = `Patrocinada por: ${region.sponsorName || 'Aliado Regional'}`;
  } else {
    sponsorBadge.className = 'px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-200';
    sponsorBadge.textContent = 'Disponible para Adopción (S/ 2,007)';
  }

  // Pre-fill student modal region selector
  const studentRegionSelect = document.getElementById('student-form-region');
  if (studentRegionSelect) studentRegionSelect.value = region.name;

  // Pre-fill sponsor modal
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

export function closeRegionDrawer() {
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

// Reset all map and grid filters
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
  container.innerHTML = phases.map((phase, i) => `
    <div class="relative bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700/80 shadow-sm hover:shadow-md transition-shadow">
      <div class="flex items-center justify-between mb-4">
        <span class="text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/60 px-3 py-1 rounded-full">
          Fase 0${i + 1}
        </span>
        <span class="text-xs font-medium text-slate-400">${phase.week}</span>
      </div>
      <h4 class="font-bold text-lg text-slate-900 dark:text-white mb-2">${phase.title}</h4>
      <p class="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">${phase.summary}</p>
    </div>
  `).join('');
}

// Render Selection Criteria
function renderSelectionCriteria() {
  const container = document.getElementById('criteria-container');
  if (!container) return;

  const criteria = EDITION_CONFIG.selectionCriteria;
  container.innerHTML = criteria.map(item => `
    <div class="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700/80 shadow-sm">
      <div class="flex items-center gap-3 mb-3">
        <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 text-white font-extrabold text-lg flex items-center justify-center shadow-md">
          ${item.pct}%
        </div>
        <h4 class="font-bold text-base text-slate-900 dark:text-white">${item.title}</h4>
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
    <div class="relative bg-white dark:bg-slate-800 rounded-3xl p-7 border ${tier.featured ? 'border-teal-500 ring-2 ring-teal-500/20 shadow-xl' : 'border-slate-200 dark:border-slate-700 shadow-sm'} flex flex-col justify-between">
      ${tier.featured ? '<div class="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-teal-600 text-white shadow">Modalidad Principal</div>' : ''}
      <div>
        <div class="flex items-center justify-between gap-2 mb-2">
          <span class="text-[11px] font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/60 px-2.5 py-1 rounded-md">${tier.badge}</span>
        </div>
        <h4 class="font-bold text-xl text-slate-900 dark:text-white mt-2">${tier.title}</h4>
        <p class="text-sm font-semibold text-slate-700 dark:text-slate-200 mt-1">${tier.costSummary}</p>
        <p class="text-xs text-slate-600 dark:text-slate-300 mt-4 leading-relaxed">${tier.description}</p>
        
        <ul class="mt-6 space-y-2 text-xs text-slate-600 dark:text-slate-300">
          ${tier.benefits.map(b => `
            <li class="flex items-start gap-2">
              <svg class="w-4 h-4 text-teal-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
              <span>${b}</span>
            </li>
          `).join('')}
        </ul>
      </div>

      <div class="mt-8">
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
    <div class="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden bg-white dark:bg-slate-800">
      <button 
        class="faq-toggle w-full px-6 py-4 text-left font-bold text-sm text-slate-900 dark:text-white flex items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
        data-index="${i}"
      >
        <span>${item.q}</span>
        <svg class="w-4 h-4 text-slate-400 transform transition-transform duration-200 faq-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
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

      // Close others
      container.querySelectorAll('.faq-content').forEach(c => c.classList.add('hidden'));
      container.querySelectorAll('.faq-icon').forEach(ic => ic.classList.remove('rotate-180'));

      if (isHidden) {
        content.classList.remove('hidden');
        icon.classList.add('rotate-180');
      }
    });
  });
}

// Dynamic Budget Calculator
function initBudgetCalculator() {
  const slider = document.getElementById('calc-region-slider');
  const regionCountVal = document.getElementById('calc-region-count');
  const totalCostVal = document.getElementById('calc-total-cost');
  const totalStudentsVal = document.getElementById('calc-total-students');
  const totalTeamsVal = document.getElementById('calc-total-teams');
  const kitCostVal = document.getElementById('calc-kit-cost');
  const freightSavedVal = document.getElementById('calc-freight-saved');

  if (!slider) return;

  function updateCalc() {
    const regions = parseInt(slider.value, 10);
    state.calcRegions = regions;
    const studentsPerRegion = 20;
    const teamsPerRegion = 4;
    const totalStudents = regions * studentsPerRegion;
    const totalTeams = regions * teamsPerRegion;
    const costPerRegion = 2007; // Basis for scalability
    const totalCost = regions * costPerRegion;
    const kitTotal = totalTeams * 210;
    // Estimated freight saved by distributed fabrication (S/ 60 per module sent physically across regions)
    const freightSaved = totalTeams * 120;

    if (regionCountVal) regionCountVal.textContent = regions;
    if (totalCostVal) totalCostVal.textContent = `S/ ${totalCost.toLocaleString('es-PE')}`;
    if (totalStudentsVal) totalStudentsVal.textContent = totalStudents;
    if (totalTeamsVal) totalTeamsVal.textContent = totalTeams;
    if (kitCostVal) kitCostVal.textContent = `S/ ${kitTotal.toLocaleString('es-PE')}`;
    if (freightSavedVal) freightSavedVal.textContent = `S/ ${freightSaved.toLocaleString('es-PE')}`;
  }

  slider.addEventListener('input', updateCalc);
  updateCalc();
}

// Student Form Handling with Auto-Draft
function initStudentForm() {
  const form = document.getElementById('student-application-form');
  if (!form) return;

  // Restore draft if any
  const draft = state.forms.studentDraft;
  Object.keys(draft).forEach(key => {
    const input = form.elements[key];
    if (input) input.value = draft[key];
  });

  // Auto-save draft on input
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
    btn.innerHTML = `<span class="inline-flex items-center gap-2"><svg class="animate-spin w-4 h-4" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path></svg> Registrando tu postulación...</span>`;

    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());
    payload.timestamp = new Date().toISOString();
    payload.tipo = 'postulacion_estudiante';

    try {
      if (CONFIG.GOOGLE_SHEET_WEBHOOK) {
        await fetch(CONFIG.GOOGLE_SHEET_WEBHOOK, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      // Clear draft
      localStorage.removeItem('simbiomakers_student_draft');
      form.reset();
      closeModal('modal-estudiante');
      showToast('¡Tu postulación ha sido enviada con éxito! Nos comunicaremos contigo por WhatsApp.', 'success');
      showSuccessCelebration(payload.nombre);
    } catch (err) {
      console.error(err);
      showToast('Hubo un inconveniente al enviar, pero tus datos están guardados en tu navegador.', 'info');
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
      if (CONFIG.GOOGLE_SHEET_WEBHOOK) {
        await fetch(CONFIG.GOOGLE_SHEET_WEBHOOK, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }
      form.reset();
      closeModal('modal-sponsor');
      showToast('¡Gracias por sumarte como Aliado! Te enviaremos el dossier de impacto MPI de inmediato.', 'success');
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
      if (CONFIG.GOOGLE_SHEET_WEBHOOK) {
        await fetch(CONFIG.GOOGLE_SHEET_WEBHOOK, {
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

// Setup Global Event Listeners
function setupEventListeners() {
  // Theme toggle
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

  // Populate region dropdowns in forms
  const studentSelect = document.getElementById('student-form-region');
  const sponsorSelect = document.getElementById('sponsor-form-region');
  const iestSelect = document.getElementById('iest-form-region');

  const optionsHtml = PERU_MAP_DATA.regions
    .map(r => `<option value="${r.name}">${r.name} (${r.macroregion}) - Sede ${r.iestName}</option>`)
    .join('');

  if (studentSelect) studentSelect.innerHTML = `<option value="">Selecciona tu Departamento / Región</option>` + optionsHtml;
  if (sponsorSelect) sponsorSelect.innerHTML = `<option value="Cualquier Región Prioritaria">Cualquier Región con Mayor Necesidad</option>` + optionsHtml;
  if (iestSelect) iestSelect.innerHTML = `<option value="">Selecciona la Región de tu Institución</option>` + optionsHtml;
}

// Global hook for selecting sponsor tier
window.selectSponsorTier = function(tierId) {
  const tier = EDITION_CONFIG.sponsorTiers.find(t => t.id === tierId);
  const selectEl = document.getElementById('sponsor-form-tier');
  if (selectEl && tier) {
    selectEl.value = tier.id;
  }
  openModal('modal-sponsor');
};

// Window exposure for inline HTML calls
window.openModal = openModal;
window.closeModal = closeModal;
window.selectRegion = selectRegion;
window.closeRegionDrawer = closeRegionDrawer;

// Init App on DOM Loaded
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  renderGlobalStats();
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
