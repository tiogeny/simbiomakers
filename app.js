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


// ==========================================
// Rotating Hero Words (Inspired by FabLab SCZ)
// ==========================================
function initHeroRotatingWords() {
  const container = document.getElementById('hero-rot-words');
  if (!container) return;
  const span = container.querySelector('span');
  if (!span) return;

  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion) return;

  const words = [
    'soluciones reales',
    'prototipos físicos',
    'redes de talento',
    'innovación local',
    'co-creación viva'
  ];
  let currentIndex = 0;

  setInterval(() => {
    span.classList.add('out');
    setTimeout(() => {
      currentIndex = (currentIndex + 1) % words.length;
      span.textContent = words[currentIndex];
      span.classList.remove('out');
    }, 350);
  }, 2700);
}


// ==========================================
// SimbioCreación a Escala 500 (Grafo Radial Animado)
// ==========================================
const SCALE500_META = [
  {
    step: 0,
    pill: 'Etapa 0 · Punto de partida',
    title: '500 saberes individuales',
    desc: '20 jóvenes por región inician identificando un desafío concreto de su comunidad y planteando su propuesta de solución tecnológica.',
    status: '500 ideas activas en todo el país'
  },
  {
    step: 1,
    pill: 'Etapa 1 · Diálogo intercolegios',
    title: '250 duplas colaborativas',
    desc: 'Los participantes se unen en parejas de distintos colegios para dialogar y fusionar sus propuestas en 250 conceptos híbridos más potentes.',
    status: '250 duplas co-diseñando en vivo'
  },
  {
    step: 2,
    pill: 'Etapa 2 · Prototipado físico en IEST',
    title: 'Fabricación digital en los Fab Labs',
    desc: 'Las duplas acuden al Fab Lab del IEST de su región para fabricar físicamente sus componentes y prototipos con impresoras 3D, corte láser y electrónica.',
    status: '★ Prototipado y fabricación física en IEST ★'
  },
  {
    step: 3,
    pill: 'Etapa 3 · 24 Fab Labs Públicos',
    title: '24 sedes IEST articuladas en red',
    desc: 'Cada uno de los 24 Fab Labs públicos IEST del país (de Tumbes a Tacna, incluyendo 2 sedes en Lima y 1 en Callao) consolida las soluciones de su territorio.',
    status: '24 Fab Labs IEST articulando soluciones'
  },
  {
    step: 4,
    pill: 'Etapa 4 · Demo Day Nacional',
    title: '1 sola Red Nacional interconectada',
    desc: 'Convergencia total: los 24 Fab Labs públicos del Perú integrados en una sola red nacional de innovación y fabricación digital escolar para el Máximo Impacto Posible (MIP).',
    status: 'Red Nacional en vivo · Máximo Impacto Posible'
  }
];

let scale500Graph = null;
let scale500Step = 0;
let scale500LastStepChange = 0;
let scale500Raf = null;
let scale500AutoTimer = null;
let scale500UserPaused = false;

function buildScale500Graph() {
  const nodes = [];
  const edges = [];
  
  // Lista oficial de los 24 Fab Labs Públicos en IEST del Perú
  const FAB_LABS_24 = [
    { name: 'IEST José A. Quiñones (Tumbes)', code: 'TUM', macro: 'Norte' },
    { name: 'IEST Catalina Buendía (Ica)', code: 'ICA', macro: 'Sur' },
    { name: 'IEST Aparicio Pomares (Huánuco)', code: 'HCO', macro: 'Centro' },
    { name: 'IEST Abancay (Apurímac)', code: 'APU', macro: 'Sur' },
    { name: 'IEST Pedro P. Díaz (Arequipa)', code: 'AQP', macro: 'Sur' },
    { name: 'IEST J. C. Mariátegui (Moquegua)', code: 'MOQ', macro: 'Sur' },
    { name: 'IEST J. A. Encinas (Puno)', code: 'PUN', macro: 'Sur' },
    { name: 'IEST Gilda Ballivián (Lima SJM)', code: 'LIM', macro: 'Centro' },
    { name: 'IEST Sullana (Piura)', code: 'PIU', macro: 'Norte' },
    { name: 'IEST C. Salazar Romero (Áncash)', code: 'ANC', macro: 'Centro' },
    { name: 'IEST F. Gonzales Vigil (Tacna)', code: 'TAC', macro: 'Sur' },
    { name: 'IEST Huancavelica', code: 'HUV', macro: 'Centro' },
    { name: 'IEST Huando (Huaral, Lima)', code: 'HRL', macro: 'Centro' },
    { name: 'IEST Jorge Basadre (Madre de Dios)', code: 'MDD', macro: 'Oriente' },
    { name: 'IEST M. Hierro Pozo (Ayacucho)', code: 'AYA', macro: 'Centro' },
    { name: 'IEST Nor Oriental (San Martín)', code: 'SAM', macro: 'Oriente' },
    { name: 'IEST Nueva Esperanza (La Libertad)', code: 'LAL', macro: 'Norte' },
    { name: 'IEST Pasco', code: 'PAS', macro: 'Centro' },
    { name: 'IEST P. Del Águila (Loreto)', code: 'LOR', macro: 'Oriente' },
    { name: 'IEST Perú Japón (Amazonas)', code: 'AMZ', macro: 'Oriente' },
    { name: 'IEST Rep. Fed. Alemania (Lambayeque)', code: 'LAM', macro: 'Norte' },
    { name: 'IEST Simón Bolívar (Callao)', code: 'CAL', macro: 'Centro' },
    { name: 'IEST Suiza (Ucayali)', code: 'UCY', macro: 'Oriente' },
    { name: 'IEST Túpac Amaru (Cusco)', code: 'CUS', macro: 'Sur' }
  ];

  const palette = ['#00F5D4', '#00BBF9', '#7928CA', '#FF007F', '#FFBE0B', '#10B981', '#3B82F6', '#F43F5E', '#8B5CF6', '#14B8A6'];

  const buildSlicesFromMap = (map) => {
    const arr = Object.entries(map).map(([color, weight]) => ({ color, weight }));
    return arr.length ? arr : [{ color: '#00F5D4', weight: 1 }];
  };

  // Nivel 4 (Centro): Red Nacional Única
  const centerIdx = 0;
  const centerWeights = {};
  const centerNode = {
    level: 4,
    x: 0,
    y: 0,
    r: 34,
    color: '#FF007F',
    label: 'RED NACIONAL',
    slices: []
  };
  nodes.push(centerNode);

  // Nivel 3 (Penúltimo Nivel): Exactamente las 24 BURBUJAS de los 24 Fab Labs IEST
  // Distribuidas de forma concéntrica a dist3 = 0.172
  const dist3 = 0.172;
  const dist2 = 0.280;
  const dist1 = 0.380;
  const dist0 = 0.466;

  const numRegiones = FAB_LABS_24.length; // 24 Fab Labs públicos
  const pairSplits = [[60, 40], [55, 45], [65, 35], [50, 50], [70, 30]];

  for (let r = 0; r < numRegiones; r++) {
    const regData = FAB_LABS_24[r];
    const rAng = -Math.PI / 2 + (r * 2 * Math.PI) / numRegiones;
    const rIdx = nodes.length;
    const regionWeights = {};
    const regColor = palette[r % palette.length];

    const rNode = {
      level: 3,
      regionIdx: r,
      name: regData.name,
      code: regData.code,
      macro: regData.macro,
      x: Math.cos(rAng) * dist3,
      y: Math.sin(rAng) * dist3,
      r: 10.5,
      color: regColor,
      slices: []
    };
    nodes.push(rNode);

    // Cada región tiene 2 núcleos/módulos de prototipado en Nivel 2
    const sectorSpan = (2 * Math.PI / numRegiones) * 0.90;
    for (let g = 0; g < 2; g++) {
      const gOffset = (g - 0.5) * sectorSpan * 0.55;
      const gAng = rAng + gOffset;
      const gIdx = nodes.length;
      const groupWeights = {};
      const gNode = {
        level: 2,
        regionIdx: r,
        x: Math.cos(gAng) * dist2,
        y: Math.sin(gAng) * dist2,
        r: 6.2,
        color: palette[(r + g * 3) % palette.length],
        slices: []
      };
      nodes.push(gNode);

      // Cada núcleo tiene 5 duplas en Nivel 1 (10 duplas por región = ~240-250 duplas en total)
      const groupSpan = sectorSpan * 0.5;
      for (let p = 0; p < 5; p++) {
        const pOffset = (p - 2) * (groupSpan / 4) * 0.82;
        const pAng = gAng + pOffset;
        const pIdx = nodes.length;

        const c1 = palette[(r + p) % palette.length];
        const c2 = palette[(r + g + p + 2) % palette.length];
        const [w1, w2] = pairSplits[(g + p) % pairSplits.length];

        const pairSlices = (c1 === c2)
          ? [{ color: c1, weight: w1 + w2 }]
          : [{ color: c1, weight: w1 }, { color: c2, weight: w2 }];

        groupWeights[c1] = (groupWeights[c1] || 0) + w1;
        groupWeights[c2] = (groupWeights[c2] || 0) + w2;
        regionWeights[c1] = (regionWeights[c1] || 0) + w1;
        regionWeights[c2] = (regionWeights[c2] || 0) + w2;
        centerWeights[c1] = (centerWeights[c1] || 0) + w1;
        centerWeights[c2] = (centerWeights[c2] || 0) + w2;

        nodes.push({
          level: 1,
          regionIdx: r,
          x: Math.cos(pAng) * dist1,
          y: Math.sin(pAng) * dist1,
          r: 4.2,
          color: c1,
          slices: pairSlices
        });
        edges.push({ from: pIdx, to: gIdx, level: 2, color: c1, travelColors: c1 === c2 ? [c1] : [c1, c2] });

        // En Nivel 0: 2 saberes individuales por dupla (20 jóvenes por región * 24 regiones = 480-500 jóvenes)
        // Agregamos pequeños offsets para distribuir exactamente los ~500 saberes
        for (let i = 0; i < 2; i++) {
          const iOffset = (i === 0 ? -0.42 : 0.42) * (groupSpan / 5) * 0.75;
          const iAng = pAng + iOffset;
          const iColor = i === 0 ? c1 : c2;
          const iIdx = nodes.length;
          nodes.push({
            level: 0,
            regionIdx: r,
            orderIdx: r * 20 + g * 10 + p * 2 + i,
            x: Math.cos(iAng) * dist0,
            y: Math.sin(iAng) * dist0,
            r: 2.8,
            color: iColor
          });
          edges.push({ from: iIdx, to: pIdx, level: 1, color: iColor, travelColors: [iColor] });
        }
      }

      gNode.slices = buildSlicesFromMap(groupWeights);
      const gCols = gNode.slices.map(sl => sl.color);
      edges.push({ from: gIdx, to: rIdx, level: 3, color: gCols[0], travelColors: gCols });
    }

    rNode.slices = buildSlicesFromMap(regionWeights);
    const rCols = rNode.slices.map(sl => sl.color);
    // Cada una de las 24 burbujas regionales se conecta al Centro Único en Nivel 4
    edges.push({ from: rIdx, to: centerIdx, level: 4, color: rCols[0], travelColors: rCols });
  }

  centerNode.slices = buildSlicesFromMap(centerWeights);
  return { nodes, edges };
}

function drawMulticolorCircle(ctx, x, y, r, slices) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.clip();
  if (!slices || slices.length <= 1) {
    ctx.fillStyle = (slices && slices[0] && slices[0].color) || '#FF007F';
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  } else {
    ctx.translate(x, y);
    ctx.rotate(-Math.PI / 4);
    const totalW = slices.reduce((acc, sl) => acc + sl.weight, 0);
    let curY = -r;
    slices.forEach((sl) => {
      const span = (r * 2) * (sl.weight / totalW);
      ctx.fillStyle = sl.color;
      ctx.fillRect(-r - 1, curY, r * 2 + 2, span + 0.8);
      curY += span;
    });
  }
  ctx.restore();
}

function updateScale500UI() {
  const meta = SCALE500_META[scale500Step];
  const pill = document.getElementById('scale500Pill');
  const title = document.getElementById('scale500Title');
  const desc = document.getElementById('scale500Desc');
  const liveStatus = document.getElementById('scale500LiveStatus');

  if (pill) pill.textContent = meta.pill;
  if (title) title.textContent = meta.title;
  if (desc) desc.textContent = meta.desc;
  if (liveStatus) liveStatus.textContent = meta.status;

  document.querySelectorAll('.scale500-step-btn').forEach(btn => {
    const s = parseInt(btn.dataset.step, 10);
    const isActive = s === scale500Step;
    if (isActive) {
      btn.className = 'scale500-step-btn w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-all border bg-teal-50 dark:bg-teal-950/60 border-teal-300 dark:border-teal-700 text-teal-900 dark:text-teal-200 font-bold shadow-sm';
    } else {
      btn.className = 'scale500-step-btn w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition-all border border-transparent text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50';
    }
  });
}

function setScale500Step(step) {
  scale500Step = Math.max(0, Math.min(4, step));
  scale500LastStepChange = performance.now();
  updateScale500UI();
}

function advanceScale500Step() {
  if (scale500Step < 4) {
    setScale500Step(scale500Step + 1);
  } else {
    setScale500Step(0);
  }
}

function toggleScale500Play() {
  const btn = document.getElementById('btnScale500Play');
  if (scale500AutoTimer) {
    clearInterval(scale500AutoTimer);
    scale500AutoTimer = null;
    scale500UserPaused = true;
    if (btn) btn.innerHTML = '<span>▶ Reproducir</span>';
    return;
  }
  scale500UserPaused = false;
  if (scale500Step >= 4) setScale500Step(0);
  if (btn) btn.innerHTML = '<span>⏸ Pausar</span>';
  scale500AutoTimer = setInterval(() => {
    if (scale500Step < 4) {
      setScale500Step(scale500Step + 1);
    } else {
      clearInterval(scale500AutoTimer);
      scale500AutoTimer = null;
      if (btn) btn.innerHTML = '<span>▶ Reproducir</span>';
    }
  }, 2400);
}

function renderScale500Frame(now) {
  const canvas = document.getElementById('scale500Canvas');
  if (!canvas || !scale500Graph) {
    scale500Raf = requestAnimationFrame(renderScale500Frame);
    return;
  }

  const rect = canvas.parentElement.getBoundingClientRect();
  if (rect.width < 10 || rect.height < 10) {
    scale500Raf = requestAnimationFrame(renderScale500Frame);
    return;
  }

  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const cssW = Math.round(rect.width);
  const cssH = Math.round(rect.height);

  if (canvas.width !== Math.round(cssW * dpr) || canvas.height !== Math.round(cssH * dpr)) {
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
    canvas.style.width = cssW + 'px';
    canvas.style.height = cssH + 'px';
  }

  const ctx = canvas.getContext('2d');
  ctx.save();
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, cssW, cssH);

  const cx = cssW / 2;
  const cy = cssH / 2;
  const dim = Math.min(cssW, cssH);
  const isDark = document.documentElement.classList.contains('dark');

  const elapsed = now - scale500LastStepChange;
  const animP = Math.min(1, Math.max(0, elapsed / 750));
  const easeP = 1 - Math.pow(1 - animP, 3);

  // Anillos concéntricos de referencia didáctica
  [0.466, 0.380, 0.280, 0.172].forEach((rf) => {
    ctx.beginPath();
    ctx.arc(cx, cy, dim * rf, 0, Math.PI * 2);
    ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.05)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 6]);
    ctx.stroke();
    ctx.setLineDash([]);
  });

  const { nodes, edges } = scale500Graph;

  // Renderizado de aristas y partículas vivas
  edges.forEach((e, idx) => {
    if (e.level > scale500Step) return;
    const n1 = nodes[e.from];
    const n2 = nodes[e.to];
    const x1 = cx + n1.x * dim;
    const y1 = cy + n1.y * dim;
    const x2 = cx + n2.x * dim;
    const y2 = cy + n2.y * dim;

    const p = (e.level === scale500Step) ? easeP : 1;
    const curX = x1 + (x2 - x1) * p;
    const curY = y1 + (y2 - y1) * p;

    let strokeStyle = e.color;
    if (e.travelColors && e.travelColors.length > 1 && (Math.abs(curX - x1) > 0.5 || Math.abs(curY - y1) > 0.5)) {
      const grad = ctx.createLinearGradient(x1, y1, curX, curY);
      const len = e.travelColors.length;
      e.travelColors.forEach((col, cIdx) => {
        grad.addColorStop(cIdx / (len - 1), col);
      });
      strokeStyle = grad;
    }

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(curX, curY);
    ctx.strokeStyle = strokeStyle;
    ctx.globalAlpha = e.level === 4 ? 0.75 : (e.level === 3 ? 0.55 : (e.level === 2 ? 0.42 : 0.32));
    ctx.lineWidth = e.level === 4 ? 4.2 : (e.level === 3 ? 2.4 : (e.level === 2 ? 1.4 : 1.1));
    ctx.stroke();

    // Partículas luminosas vivas viajando continuamente
    if (p > 0.92 && e.travelColors && e.travelColors.length > 0) {
      const tcLen = e.travelColors.length;
      const speed = e.level === 4 ? 0.00045 : (e.level === 3 ? 0.0005 : 0.00055);
      const pr = e.level === 4 ? 3.4 : (e.level === 3 ? 2.4 : (e.level === 2 ? 1.8 : 1.4));
      e.travelColors.forEach((tc, tIdx) => {
        const t = ((now * speed + idx * 0.11 + tIdx / tcLen) % 1);
        const px = x1 + (x2 - x1) * t;
        const py = y1 + (y2 - y1) * t;
        ctx.beginPath();
        ctx.arc(px, py, pr, 0, Math.PI * 2);
        ctx.fillStyle = tc;
        ctx.globalAlpha = 0.95;
        ctx.fill();
      });
    }
  });

  ctx.globalAlpha = 1;

  // Renderizado de nodos
  nodes.forEach(n => {
    if (n.level > scale500Step) return;
    const x = cx + n.x * dim;
    const y = cy + n.y * dim;

    let scaleFactor = 1;
    if (n.level === 0 && scale500Step === 0) {
      const delay = (n.orderIdx || 0) * 1.2;
      const localP = Math.min(1, Math.max(0, (elapsed - delay) / 200));
      scaleFactor = 0.1 + 0.9 * (1 - Math.pow(1 - localP, 2));
    } else if (n.level === scale500Step && scale500Step > 0) {
      scaleFactor = 0.3 + 0.7 * easeP;
    }

    const r = n.r * scaleFactor * (dim / 650);
    const drawR = n.level === 0 ? Math.max(2.8, r) : Math.max(3.5, r);

    // Halo palpitante para niveles superiores (centro y sedes)
    if (n.level >= 3) {
      const pulse = 1 + 0.09 * Math.sin(now * 0.004);
      ctx.beginPath();
      ctx.arc(x, y, drawR * 1.34 * pulse, 0, Math.PI * 2);
      ctx.fillStyle = n.level === 4 ? 'rgba(255, 0, 127, 0.22)' : 'rgba(0, 245, 212, 0.12)';
      ctx.fill();
    }

    if (n.slices && n.slices.length > 1) {
      drawMulticolorCircle(ctx, x, y, drawR, n.slices);
    } else {
      ctx.beginPath();
      ctx.arc(x, y, drawR, 0, Math.PI * 2);
      ctx.fillStyle = n.color;
      ctx.fill();
    }

    ctx.beginPath();
    ctx.arc(x, y, drawR, 0, Math.PI * 2);
    ctx.lineWidth = n.level === 4 ? 3 : (n.level >= 2 ? 1.6 : 0.6);
    ctx.strokeStyle = isDark ? '#0B0F19' : '#ffffff';
    ctx.stroke();

    // Etiqueta legible para las 24 burbujas regionales en Nivel 3
    if (n.level === 3 && scale500Step >= 3 && n.code) {
      ctx.save();
      ctx.font = 'bold 7.5px Plus Jakarta Sans, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = isDark ? '#ffffff' : '#0f172a';
      // Posicionar la sigla ligeramente radial hacia afuera para máxima legibilidad
      const distFromCenter = Math.sqrt(n.x * n.x + n.y * n.y);
      const textOffsetX = distFromCenter > 0 ? (n.x / distFromCenter) * (drawR + 9) : 0;
      const textOffsetY = distFromCenter > 0 ? (n.y / distFromCenter) * (drawR + 9) : 0;
      ctx.fillText(n.code, x + textOffsetX, y + textOffsetY);
      ctx.restore();
    }
  });

  ctx.restore();
  scale500Raf = requestAnimationFrame(renderScale500Frame);
}

function initScale500Canvas() {
  const canvas = document.getElementById('scale500Canvas');
  if (!canvas) return;

  if (!scale500Graph) {
    scale500Graph = buildScale500Graph();
  }

  scale500LastStepChange = performance.now();
  updateScale500UI();

  if (!scale500Raf) {
    scale500Raf = requestAnimationFrame(renderScale500Frame);
  }

  // Event Listeners para controles
  const btnPlay = document.getElementById('btnScale500Play');
  if (btnPlay) {
    btnPlay.onclick = toggleScale500Play;
  }

  const btnNext = document.getElementById('btnScale500Next');
  if (btnNext) {
    btnNext.onclick = () => {
      if (scale500AutoTimer) toggleScale500Play();
      advanceScale500Step();
    };
  }

  const btnReset = document.getElementById('btnScale500Reset');
  if (btnReset) {
    btnReset.onclick = () => {
      if (scale500AutoTimer) toggleScale500Play();
      setScale500Step(0);
    };
  }

  document.querySelectorAll('.scale500-step-btn').forEach(btn => {
    btn.onclick = () => {
      if (scale500AutoTimer) toggleScale500Play();
      const step = parseInt(btn.dataset.step, 10);
      setScale500Step(step);
    };
  });

  // Autoplay activado por Scroll (IntersectionObserver)
  initScale500ScrollObserver();
}

function initScale500ScrollObserver() {
  const card = document.getElementById('scale500-card');
  if (!card || !('IntersectionObserver' in window)) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !scale500AutoTimer && !scale500UserPaused) {
        toggleScale500Play();
      }
    });
  }, { threshold: 0.35 });

  observer.observe(card);
}

// Render Sponsor Tiers (Direct WhatsApp to Delia Barriga)
function renderSponsorTiers() {
  const container = document.getElementById('sponsor-tiers-container');
  if (!container) return;

  const tiers = EDITION_CONFIG.sponsorTiers;
  container.innerHTML = tiers.map(tier => `
    <div class="relative bg-white dark:bg-slate-800/90 rounded-3xl p-7 border ${tier.featured ? 'border-teal-500 ring-2 ring-teal-500/20 shadow-xl' : 'border-slate-200 dark:border-slate-700 shadow-sm'} flex flex-col justify-between">
      ${tier.featured ? '<div class="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-teal-600 text-white shadow">Modalidad principal</div>' : ''}
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
          onclick="window.openDeliaWhatsApp('${tier.title}')"
          class="w-full py-3 px-4 rounded-xl font-bold text-xs tracking-wide transition-all flex items-center justify-center gap-2 ${tier.featured ? 'bg-teal-600 hover:bg-teal-700 text-white shadow-md' : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-white'}"
        >
          <span>Conversar con Delia Barriga (WhatsApp)</span>
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
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

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  renderGlobalStats();
  renderHeroNetworkMap();
  renderPeruMap();
  renderRegionsGrid();
  initHeroRotatingWords();
  initScale500Canvas();
  renderPedagogy();
  renderSelectionCriteria();
  renderSponsorTiers();
  renderFaq();
  initStudentForm();
  initIestForm();
  initMentorForm();
  setupEventListeners();
  syncLiveSheetData();
});
