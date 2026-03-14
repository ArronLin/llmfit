const invoke = window.__TAURI_INTERNALS__
  ? window.__TAURI_INTERNALS__.invoke
  : async (cmd) => { console.warn('Tauri not available, cmd:', cmd); return null; };

let allFits = [];
let ollamaAvailable = false;
let pullInterval = null;

// Internationalization
const i18n = {
  en: {
    system: 'System',
    cpu: 'CPU',
    detecting: 'Detecting...',
    total_ram: 'Total RAM',
    available_ram: 'Available RAM',
    memory: 'Memory',
    gpu: 'GPU',
    no_gpu_detected: 'No GPU detected',
    model_compatibility: 'Model Compatibility',
    filter_models: 'Filter models...',
    all_fit_levels: 'All Fit Levels',
    perfect: 'Perfect',
    good: 'Good',
    marginal: 'Marginal',
    too_tight: 'Too Tight',
    model: 'Model',
    params: 'Params',
    quant: 'Quant',
    fit: 'Fit',
    mode: 'Mode',
    score: 'Score',
    ram_req: 'RAM Req',
    est_tps: 'Est. TPS',
    use_case: 'Use Case',
    loading_models: 'Loading models...',
    no_models_found: 'No models found',
    error_loading_models: 'Error loading models',
    cores: 'cores',
    gb_vram: 'GB VRAM',
    shared_memory: 'Shared memory',
    integrated: 'Integrated',
    discrete: 'Discrete',
    unified_memory: 'Unified (CPU + GPU shared)',
    parameters: 'Parameters',
    quantization: 'Quantization',
    runtime: 'Runtime',
    est_speed: 'Est. Speed',
    tok_per_sec: 'tok/s',
    fit_analysis: 'Fit Analysis',
    memory_usage: 'Memory',
    notes: 'Notes',
    installed: 'Installed',
    not_installed: 'Not Installed',
    download_via_ollama: '⬇ Download via Ollama',
    close: 'Close',
    starting_download: 'Starting download...',
    download_complete: 'Download complete!',
    error: 'Error',
    error_loading_specs: 'Error loading specs'
  },
  zh: {
    system: '系统',
    cpu: '处理器',
    detecting: '检测中...',
    total_ram: '总内存',
    available_ram: '可用内存',
    memory: '内存',
    gpu: '显卡',
    no_gpu_detected: '未检测到显卡',
    model_compatibility: '模型适配分析',
    filter_models: '搜索模型...',
    all_fit_levels: '所有适配级别',
    perfect: '完美',
    good: '良好',
    marginal: '勉强',
    too_tight: '太紧张',
    model: '模型',
    params: '参数量',
    quant: '量化',
    fit: '适配度',
    mode: '运行模式',
    score: '分数',
    ram_req: '内存需求',
    est_tps: '预估TPS',
    use_case: '使用场景',
    loading_models: '加载模型中...',
    no_models_found: '未找到模型',
    error_loading_models: '加载模型出错',
    cores: '核',
    gb_vram: 'GB 显存',
    shared_memory: '共享内存',
    integrated: '集成显卡',
    discrete: '独立显卡',
    unified_memory: '统一内存 (CPU + GPU 共享)',
    parameters: '参数量',
    quantization: '量化级别',
    runtime: '运行时',
    est_speed: '预估速度',
    tok_per_sec: '词元/秒',
    fit_analysis: '适配分析',
    memory_usage: '内存使用',
    notes: '备注',
    installed: '已安装',
    not_installed: '未安装',
    download_via_ollama: '⬇ 通过 Ollama 下载',
    close: '关闭',
    starting_download: '开始下载...',
    download_complete: '下载完成!',
    error: '错误',
    error_loading_specs: '加载系统信息出错'
  }
};

let currentLang = localStorage.getItem('llmfit-lang') || 'en';

function t(key) {
  return i18n[currentLang][key] || key;
}

function updateLanguage() {
  // Update all elements with data-i18n attribute
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (i18n[currentLang][key]) {
      el.textContent = i18n[currentLang][key];
    }
  });
  
  // Update all elements with data-i18n-placeholder attribute
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (i18n[currentLang][key]) {
      el.placeholder = i18n[currentLang][key];
    }
  });
  
  // Update language toggle button
  const langToggle = document.getElementById('lang-toggle');
  if (langToggle) {
    langToggle.textContent = currentLang === 'en' ? '中文' : 'English';
  }
  
  // Refresh dynamic content
  loadSpecs();
  renderModels(allFits);
}

function toggleLanguage() {
  currentLang = currentLang === 'en' ? 'zh' : 'en';
  localStorage.setItem('llmfit-lang', currentLang);
  updateLanguage();
}

function esc(s) {
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}

async function loadSpecs() {
  try {
    const specs = await invoke('get_system_specs');
    if (!specs) return;

    document.getElementById('cpu-name').textContent = specs.cpu_name;
    document.getElementById('cpu-cores').textContent = specs.cpu_cores + ' ' + t('cores');
    document.getElementById('ram-total').textContent = specs.total_ram_gb.toFixed(1) + ' GB';
    document.getElementById('ram-available').textContent = specs.available_ram_gb.toFixed(1) + ' GB';

    const container = document.getElementById('gpus-container');
    container.innerHTML = '';

    if (specs.gpus.length === 0) {
      const card = document.createElement('div');
      card.className = 'spec-card';
      card.innerHTML = '<span class="spec-label">' + t('gpu') + '</span>' +
        '<span class="spec-value">' + t('no_gpu_detected') + '</span>';
      container.appendChild(card);
    } else {
      specs.gpus.forEach((gpu, i) => {
        const card = document.createElement('div');
        card.className = 'spec-card';
        const label = specs.gpus.length > 1 ? t('gpu') + ' ' + (i + 1) : t('gpu');
        const countStr = gpu.count > 1 ? ' ×' + gpu.count : '';
        const vramStr = gpu.vram_gb != null ? gpu.vram_gb.toFixed(1) + ' ' + t('gb_vram') : t('shared_memory');
        const backendStr = gpu.backend !== 'None' ? gpu.backend : '';
        // Add GPU type indicator (Integrated/Discrete)
        let gpuTypeStr = '';
        if (gpu.gpu_type === 'Integrated') gpuTypeStr = t('integrated');
        else if (gpu.gpu_type === 'Discrete') gpuTypeStr = t('discrete');
        const details = [vramStr, gpuTypeStr, backendStr].filter(Boolean).join(' · ');
        card.innerHTML = '<span class="spec-label">' + esc(label) + '</span>' +
          '<span class="spec-value">' + esc(gpu.name + countStr) + '</span>' +
          '<span class="spec-detail">' + esc(details) + '</span>';
        container.appendChild(card);
      });
    }

    if (specs.unified_memory) {
      const archCard = document.getElementById('memory-arch-card');
      archCard.style.display = '';
      document.getElementById('memory-arch').textContent = t('unified_memory');
    }
  } catch (e) {
    console.error('Failed to load specs:', e);
    document.getElementById('cpu-name').textContent = t('error_loading_specs');
  }
}

function fitClass(level) {
  switch (level) {
    case 'Perfect': return 'fit-perfect';
    case 'Good': return 'fit-good';
    case 'Marginal': return 'fit-marginal';
    default: return 'fit-tight';
  }
}

function modeClass(mode) {
  switch (mode) {
    case 'GPU': return 'mode-gpu';
    case 'MoE Offload': return 'mode-moe';
    case 'CPU Offload': return 'mode-cpuoffload';
    default: return 'mode-cpuonly';
  }
}

function showModal(fit) {
  const modal = document.getElementById('model-modal');
  const body = document.getElementById('modal-body');

  const memBar = Math.min(fit.utilization_pct, 100);
  const memBarClass = fit.utilization_pct > 95 ? 'bar-red' : fit.utilization_pct > 80 ? 'bar-yellow' : 'bar-green';

  let notesHtml = '';
  if (fit.notes && fit.notes.length > 0) {
    notesHtml = '<div class="modal-section"><h4>Notes</h4><ul>' +
      fit.notes.map(n => '<li>' + esc(n) + '</li>').join('') +
      '</ul></div>';
  }

  const installedBadge = fit.installed
    ? '<span class="badge badge-installed">Installed</span>'
    : '<span class="badge badge-not-installed">Not Installed</span>';

  const downloadBtn = (!fit.installed && ollamaAvailable)
    ? '<button class="btn-download" onclick="pullModel(\'' + esc(fit.name) + '\')">⬇ Download via Ollama</button>'
    : '';

  body.innerHTML = `
    <div class="modal-header-row">
      <h3>${esc(fit.name)}</h3>
      ${installedBadge}
    </div>

    <div class="modal-grid">
      <div class="modal-stat">
        <span class="stat-label">Parameters</span>
        <span class="stat-value">${esc(fit.params_b.toFixed(1))}B</span>
      </div>
      <div class="modal-stat">
        <span class="stat-label">Quantization</span>
        <span class="stat-value">${esc(fit.quant)}</span>
      </div>
      <div class="modal-stat">
        <span class="stat-label">Runtime</span>
        <span class="stat-value">${esc(fit.runtime)}</span>
      </div>
      <div class="modal-stat">
        <span class="stat-label">Score</span>
        <span class="stat-value">${esc(fit.score.toFixed(0))}/100</span>
      </div>
      <div class="modal-stat">
        <span class="stat-label">Est. Speed</span>
        <span class="stat-value">${esc(fit.estimated_tps.toFixed(1))} tok/s</span>
      </div>
      <div class="modal-stat">
        <span class="stat-label">Use Case</span>
        <span class="stat-value">${esc(fit.use_case)}</span>
      </div>
    </div>

    <div class="modal-section">
      <h4>Fit Analysis</h4>
      <div class="fit-row">
        <span class="${fitClass(fit.fit_level)}">${esc(fit.fit_level)}</span>
        <span class="fit-detail">${esc(fit.run_mode)}</span>
      </div>
      <div class="mem-bar-container">
        <div class="mem-bar-label">
          <span>Memory: ${esc(fit.memory_required_gb.toFixed(1))} / ${esc(fit.memory_available_gb.toFixed(1))} GB</span>
          <span>${esc(fit.utilization_pct.toFixed(0))}%</span>
        </div>
        <div class="mem-bar-track">
          <div class="mem-bar-fill ${memBarClass}" style="width: ${memBar}%"></div>
        </div>
      </div>
    </div>

    ${notesHtml}

    <div id="pull-status" class="pull-status" style="display:none">
      <div class="pull-status-text"></div>
      <div class="mem-bar-track">
        <div class="pull-bar-fill" style="width: 0%"></div>
      </div>
    </div>

    <div class="modal-actions">
      ${downloadBtn}
      <button class="btn-close" onclick="closeModal()">Close</button>
    </div>
  `;

  modal.classList.add('visible');
}

function closeModal() {
  document.getElementById('model-modal').classList.remove('visible');
  if (pullInterval) {
    clearInterval(pullInterval);
    pullInterval = null;
  }
}

async function pullModel(name) {
  const statusEl = document.getElementById('pull-status');
  const textEl = statusEl.querySelector('.pull-status-text');
  const barEl = statusEl.querySelector('.pull-bar-fill');
  const btn = document.querySelector('.btn-download');

  statusEl.style.display = '';
  if (btn) btn.disabled = true;
  textEl.textContent = 'Starting download...';

  try {
    await invoke('start_pull', { modelTag: name });

    pullInterval = setInterval(async () => {
      try {
        const s = await invoke('poll_pull');
        if (!s) return;
        textEl.textContent = s.status;
        if (s.percent != null) barEl.style.width = s.percent + '%';
        if (s.done) {
          clearInterval(pullInterval);
          pullInterval = null;
          if (s.error) {
            textEl.textContent = 'Error: ' + s.error;
            if (btn) btn.disabled = false;
          } else {
            textEl.textContent = 'Download complete!';
            barEl.style.width = '100%';
            // Refresh model list
            await loadModels();
          }
        }
      } catch (e) {
        console.error('Poll error:', e);
      }
    }, 500);
  } catch (e) {
    textEl.textContent = 'Error: ' + e;
    if (btn) btn.disabled = false;
  }
}

function renderModels(fits) {
  const tbody = document.getElementById('models-body');
  if (!fits || fits.length === 0) {
    tbody.innerHTML = '<tr><td colspan="9" class="loading">' + t('no_models_found') + '</td></tr>';
    return;
  }
  tbody.innerHTML = fits.map((f, i) => `
    <tr class="model-row" data-index="${i}">
      <td><strong>${esc(f.name)}</strong>${f.installed ? ' <span class="installed-dot" title="' + t('installed') + '">●</span>' : ''}</td>
      <td>${esc(f.params_b.toFixed(1))}B</td>
      <td>${esc(f.quant)}</td>
      <td class="${fitClass(f.fit_level)}">${esc(f.fit_level)}</td>
      <td class="${modeClass(f.run_mode)}">${esc(f.run_mode)}</td>
      <td>${esc(f.score.toFixed(0))}</td>
      <td>${esc(f.memory_required_gb.toFixed(1))} GB</td>
      <td>${esc(f.estimated_tps.toFixed(1))}</td>
      <td>${esc(f.use_case)}</td>
    </tr>
  `).join('');

  // Attach click handlers
  const currentFits = fits;
  tbody.querySelectorAll('.model-row').forEach(row => {
    row.addEventListener('click', () => {
      const idx = parseInt(row.dataset.index, 10);
      showModal(currentFits[idx]);
    });
  });
}

function applyFilters() {
  const search = document.getElementById('search').value.toLowerCase();
  const fitFilter = document.getElementById('fit-filter').value;

  let filtered = allFits;
  if (search) {
    filtered = filtered.filter(f => f.name.toLowerCase().includes(search));
  }
  if (fitFilter !== 'all') {
    filtered = filtered.filter(f => f.fit_level === fitFilter);
  }
  renderModels(filtered);
}

async function loadModels() {
  try {
    allFits = await invoke('get_model_fits') || [];
    applyFilters();
  } catch (e) {
    console.error('Failed to load models:', e);
    document.getElementById('models-body').innerHTML =
      '<tr><td colspan="9" class="loading">' + t('error_loading_models') + '</td></tr>';
  }
}

// Close modal on backdrop click
document.getElementById('model-modal').addEventListener('click', (e) => {
  if (e.target === e.currentTarget) closeModal();
});

// Close modal on Escape
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeModal();
});

document.getElementById('search').addEventListener('input', applyFilters);
document.getElementById('fit-filter').addEventListener('change', applyFilters);

// Language toggle
document.getElementById('lang-toggle').addEventListener('click', toggleLanguage);

async function init() {
  ollamaAvailable = await invoke('is_ollama_available') || false;
  // Initialize language
  updateLanguage();
  loadSpecs();
  loadModels();
}

init();
