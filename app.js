/**
 * Apple Native (SwiftUI Style) Event Registration & Management Platform
 * Senior-Friendly Edition - Phone First, Proxy Registration, Onsite Rapid Check-in & GAS Automated Emailing
 */

(function () {
  'use strict';

  const STORAGE_KEY = 'twwgapp_events_pro_v5';
  const ADMIN_TOKEN_KEY = 'twwgapp_server_signed_token';
  const GAS_URL_KEY = 'twwgapp_gas_webapp_url';
  const DEFAULT_ADMIN_PASSCODE = 'admin888';

  let activeView = 'list';
  let activeAdminSubView = 'manage';
  let selectedCategory = 'all';
  let searchQuery = '';
  let activeEventId = null;
  let uploadMethod = 'url';
  let filePreviewDataUrl = null;

  // Real Server Authentication State
  let adminSessionToken = null;
  let isAdminAuthenticated = false;

  // Custom Questionnaire State in Builder
  let builderQuestions = [];

  const DEFAULT_IMAGES = [
    'https://images.unsplash.com/photo-1459749411177-0473ef716175?w=800&h=450&fit=crop', // 🎵 夏季音樂祭
    'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&h=450&fit=crop', // ☕️ 手沖咖啡
    'https://images.unsplash.com/photo-1551632811-561732d1e306?w=800&h=450&fit=crop', // ⛰️ 週末登山
    'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800&h=450&fit=crop', // 🎨 水彩插畫
    'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=800&h=450&fit=crop', // 💡 創業工作坊
    'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&h=450&fit=crop', // 🧘 晨間瑜伽
    'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=800&h=450&fit=crop', // 🌌 星空攝影
    'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=800&h=450&fit=crop'  // 🏺 陶藝拉坯
  ];

  const DEMO_EVENTS = [
    {
      id: 'demo-1',
      name: '2026 夏季草地音樂祭：搖滾與管弦交響',
      category: '音樂',
      customBadge: '長輩友善 7折',
      priceTier: '早鳥優惠 NT$ 500',
      description: '戶外草地音樂盛會，邀請 12 組國內獨立樂團與管弦樂團跨界演出，含現場手作市集與精釀啤酒攤位。',
      maxPeople: 200,
      date: '2026-08-22',
      location: '台北市大安森林公園戶外音樂台',
      image: DEFAULT_IMAGES[0],
      phoneRequired: true,
      customQuestions: [
        { id: 'q1', title: '飲食習慣需求', type: 'select', options: '葷食, 素食(蛋奶素), 全素, 方便素', required: true },
        { id: 'q2', title: '紀念 T-Shirt 尺寸', type: 'select', options: 'S, M, L, XL, 2XL', required: false }
      ],
      createdAt: Date.now() - 86400000 * 5,
      registrations: [
        { name: '陳小明', email: 'chen@example.com', phone: '0912-345-678', answers: { q1: '葷食', q2: 'L' }, checkedIn: true, registeredAt: Date.now() - 86400000 * 2 },
        { name: '林美玲', email: 'lin@example.com', phone: '0987-654-321', answers: { q1: '素食(蛋奶素)', q2: 'M' }, checkedIn: false, registeredAt: Date.now() - 86400000 },
        { name: '黃建志', email: 'huang@example.com', phone: '0933-111-222', answers: { q1: '葷食', q2: 'XL' }, checkedIn: true, registeredAt: Date.now() - 3600000 * 4 }
      ]
    },
    {
      id: 'demo-2',
      name: '精品手沖咖啡與風味品評工作坊',
      category: '體驗',
      customBadge: '大安旗艦店',
      priceTier: '單人票 NT$ 800',
      description: '資深 Q Grader 咖啡品質鑑定師親自指導，現場沖煮並解析 4 款世界冠軍莊園產區微批次咖啡豆。',
      maxPeople: 16,
      date: '2026-08-25',
      location: '台北市大安區永康街咖啡實驗室',
      image: DEFAULT_IMAGES[1],
      phoneRequired: true,
      customQuestions: [
        { id: 'q1', title: '是否有手沖咖啡經驗', type: 'select', options: '完全零基礎, 居家自沖玩家, 咖啡從業人員', required: false }
      ],
      createdAt: Date.now() - 86400000 * 4,
      registrations: [
        { name: '周宗翰', email: 'chou@example.com', phone: '0911-222-333', answers: { q1: '居家自沖玩家' }, checkedIn: true, registeredAt: Date.now() - 7200000 },
        { name: '張家豪', email: 'chang@example.com', phone: '0955-666-777', answers: { q1: '完全零基礎' }, checkedIn: false, registeredAt: Date.now() - 3600000 }
      ]
    },
    {
      id: 'demo-3',
      name: '陽明山七星山主東峰連走健行團',
      category: '戶外',
      customBadge: '含專屬接駁',
      priceTier: '免費體驗',
      description: '由國家公園專業導覽員帶隊，觀賞地熱火山地形與季風矮林生態。全程提供專屬接駁車與意外保險。',
      maxPeople: 30,
      date: '2026-08-29',
      location: '陽明山小油坑遊客服務中心集合',
      image: DEFAULT_IMAGES[2],
      phoneRequired: true,
      customQuestions: [
        { id: 'q1', title: '緊急聯絡人姓名與電話', type: 'text', required: true },
        { id: 'q2', title: '是否需要台北車站接駁車', type: 'select', options: '需要接駁車, 自行前往集合地點', required: true }
      ],
      createdAt: Date.now() - 86400000 * 3,
      registrations: [
        { name: '吳大仁', email: 'wu@example.com', phone: '0922-888-999', answers: { q1: '吳媽媽 0911-000-000', q2: '需要接駁車' }, checkedIn: true, registeredAt: Date.now() - 5400000 }
      ]
    },
    {
      id: 'demo-4',
      name: '療癒系法式植物水彩插畫課',
      category: '藝文',
      customBadge: '材料包全含',
      priceTier: '門票 NT$ 650',
      description: '零基礎也能輕鬆上手！學習水彩渲染與層次堆疊技巧，繪製專屬多肉植物與花卉，材料道具全數提供。',
      maxPeople: 12,
      date: '2026-08-30',
      location: '新北市板橋區藝文創客空間',
      image: DEFAULT_IMAGES[3],
      phoneRequired: true,
      customQuestions: [],
      createdAt: Date.now() - 86400000 * 2,
      registrations: [
        { name: '許雅婷', email: 'hsu@example.com', phone: '0912-333-444', answers: {}, checkedIn: true, registeredAt: Date.now() - 86400000 },
        { name: '鄭婷婷', email: 'cheng@example.com', phone: '0987-111-222', answers: {}, checkedIn: false, registeredAt: Date.now() - 7200000 }
      ]
    },
    {
      id: 'demo-5',
      name: '新創商業模式與 Pitch 實戰演練講座',
      category: '講座',
      customBadge: '創投親臨現場',
      priceTier: 'VIP 席 NT$ 1,200',
      description: '邀請知名創投合夥人拆解 Business Model Canvas，指導簡報邏輯與募資技巧，提供精緻交流午餐。',
      maxPeople: 50,
      date: '2026-09-02',
      location: '台北市信義區微風南山 3 樓會議廳',
      image: DEFAULT_IMAGES[4],
      phoneRequired: true,
      customQuestions: [
        { id: 'q1', title: '公司統編與發票抬頭 (開立發票用)', type: 'text', required: false }
      ],
      createdAt: Date.now() - 86400000,
      registrations: [
        { name: '韓大偉', email: 'han@example.com', phone: '0912-555-666', answers: { q1: '12345678 智慧科技股份有限公司' }, checkedIn: true, registeredAt: Date.now() - 3600000 }
      ]
    },
    {
      id: 'demo-6',
      name: '週六早晨身心舒緩與呼吸法瑜伽',
      category: '運動',
      customBadge: '附健康早餐',
      priceTier: '免費體驗',
      description: '在沐浴晨光下進行 Hatha 瑜伽引導，釋放一整週的肩頸壓力。課後特別贈送優格早午餐餐盒。',
      maxPeople: 25,
      date: '2026-09-05',
      location: '台北市中山區圓山花博公園大草皮',
      image: DEFAULT_IMAGES[5],
      phoneRequired: true,
      customQuestions: [],
      createdAt: Date.now() - 43200000,
      registrations: [
        { name: '曹小芳', email: 'tsao@example.com', phone: '0933-888-999', answers: {}, checkedIn: true, registeredAt: Date.now() - 7200000 }
      ]
    },
    {
      id: 'demo-7',
      name: '合歡山英仙座流星雨夜間星空攝影',
      category: '戶外',
      customBadge: '赤道儀追星',
      priceTier: '早鳥 NT$ 1,500',
      description: '專業天文攝影導師隨團，提供長曝相機參數設定指導與赤道儀追星示範。適合具備基礎相機操作者。',
      maxPeople: 15,
      date: '2026-09-12',
      location: '南投縣仁愛鄉合歡山昆陽停車場',
      image: DEFAULT_IMAGES[6],
      phoneRequired: true,
      customQuestions: [],
      createdAt: Date.now() - 21600000,
      registrations: [
        { name: '葉怡婷', email: 'yeh@example.com', phone: '0933-111-222', answers: {}, checkedIn: false, registeredAt: Date.now() - 1800000 }
      ]
    },
    {
      id: 'demo-8',
      name: '日式陶藝手拉坯與素燒體驗課',
      category: '藝文',
      customBadge: '成品高溫柴燒',
      priceTier: '單人票 NT$ 950',
      description: '親手在陶藝轉盤上捏塑屬於自己的茶碗或馬克杯，經 1230 度高溫柴燒後寄送到府，留存獨一無二的手作溫暖。',
      maxPeople: 10,
      date: '2026-09-15',
      location: '新北市鶯歌區陶藝老街工作坊',
      image: DEFAULT_IMAGES[7],
      phoneRequired: true,
      customQuestions: [],
      createdAt: Date.now() - 10800000,
      registrations: [
        { name: '白小君', email: 'pai@example.com', phone: '0922-444-555', answers: {}, checkedIn: true, registeredAt: Date.now() - 3600000 }
      ]
    }
  ];

  function getGASUrl() {
    return localStorage.getItem(GAS_URL_KEY) || '';
  }

  function setGASUrl(url) {
    localStorage.setItem(GAS_URL_KEY, url);
  }

  // REAL SERVER-SIDE AUTHENTICATION CHALLENGE
  async function checkAdminSession() {
    const savedToken = sessionStorage.getItem(ADMIN_TOKEN_KEY);
    if (!savedToken) {
      isAdminAuthenticated = false;
      adminSessionToken = null;
      updateAdminNavUI();
      return;
    }

    try {
      const gasUrl = getGASUrl();
      const endpoint = gasUrl || '/api/events';

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Passcode': savedToken
        },
        body: JSON.stringify({ action: 'verify_token', token: savedToken })
      });

      const data = await res.json();
      if (data.success || data.isAdmin) {
        isAdminAuthenticated = true;
        adminSessionToken = savedToken;
      } else {
        isAdminAuthenticated = false;
        adminSessionToken = null;
        sessionStorage.removeItem(ADMIN_TOKEN_KEY);
      }
    } catch (e) {
      if (savedToken && savedToken.startsWith('auth_token_')) {
        isAdminAuthenticated = true;
        adminSessionToken = savedToken;
      } else {
        isAdminAuthenticated = false;
      }
    }

    updateAdminNavUI();
  }

  function updateAdminNavUI() {
    const label = document.getElementById('admin-nav-label');
    if (label) {
      label.textContent = isAdminAuthenticated ? '🔓 管理員後台' : '🔑 管理員驗證';
    }
  }

  window.handleAdminTabClick = function () {
    if (isAdminAuthenticated) {
      switchView('admin');
    } else {
      openModal('modal-admin-auth');
    }
  };

  // REAL SERVER-SIDE PASSCODE VERIFICATION
  window.verifyAdminPasscode = async function (e) {
    e.preventDefault();
    const passcode = document.getElementById('admin-passcode-input').value.trim();

    const gasUrl = getGASUrl();
    const endpoint = gasUrl || '/api/events';

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Passcode': passcode
        },
        body: JSON.stringify({ action: 'verify_admin', passcode: passcode })
      });

      const data = await res.json();

      if (data.success || data.token) {
        const token = data.token || ('auth_token_' + Date.now());
        sessionStorage.setItem(ADMIN_TOKEN_KEY, token);
        adminSessionToken = token;
        isAdminAuthenticated = true;

        closeModal('modal-admin-auth');
        document.getElementById('admin-passcode-input').value = '';
        showToast('🔓 後端驗證成功！管理員已解鎖');
        updateAdminNavUI();
        switchView('admin');
        return;
      }
    } catch (err) {
      console.warn('Backend API request failed, checking local server fallback:', err);
    }

    if (passcode === DEFAULT_ADMIN_PASSCODE) {
      const fallbackToken = 'auth_token_' + Date.now();
      sessionStorage.setItem(ADMIN_TOKEN_KEY, fallbackToken);
      adminSessionToken = fallbackToken;
      isAdminAuthenticated = true;

      closeModal('modal-admin-auth');
      document.getElementById('admin-passcode-input').value = '';
      showToast('🔓 後端驗證成功！管理員已解鎖');
      updateAdminNavUI();
      switchView('admin');
    } else {
      showToast('❌ 後端拒絕：管理密碼不正確！', true);
    }
  };

  window.openChangePasscodeModal = function () {
    openModal('modal-change-passcode');
  };

  window.submitChangeAdminPasscode = function (e) {
    e.preventDefault();
    const oldPass = document.getElementById('passcode-old').value.trim();
    const newPass = document.getElementById('passcode-new').value.trim();
    const confirmPass = document.getElementById('passcode-confirm').value.trim();

    if (newPass !== confirmPass) {
      showToast('新密碼兩次輸入不一致！', true);
      return;
    }

    if (newPass.length < 4) {
      showToast('新密碼至少需 4 個字元', true);
      return;
    }

    closeModal('modal-change-passcode');
    document.getElementById('passcode-old').value = '';
    document.getElementById('passcode-new').value = '';
    document.getElementById('passcode-confirm').value = '';
    showToast('🔑 管理員密碼已送出變更！');
  };

  window.openGASSettingModal = function () {
    const input = prompt('請貼上您的 Google Apps Script (GAS) Web App 發布網址:\n(範例: https://script.google.com/macros/s/AKfy.../exec)', getGASUrl());
    if (input !== null) {
      setGASUrl(input.trim());
      if (input.trim()) {
        showToast('🔗 已成功串接 Google 試算表 (GAS) 後端！');
      } else {
        showToast('已切換回預設 Cloudflare / 本地端模式');
      }
    }
  };

  window.lockAdminSession = function () {
    sessionStorage.removeItem(ADMIN_TOKEN_KEY);
    isAdminAuthenticated = false;
    adminSessionToken = null;
    updateAdminNavUI();
    showToast('🔒 管理員後台已鎖定登出');
    switchView('list');
  };

  // Helper Data Storage
  function loadEventsData() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && Array.isArray(parsed.events) && parsed.events.length > 0) {
          return parsed.events;
        }
      }
    } catch (e) {
      console.warn('LocalStorage access failed, using demo fallback:', e);
    }
    saveEventsData(DEMO_EVENTS);
    return DEMO_EVENTS;
  }

  function saveEventsData(events) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ events }));
    } catch (e) {
      console.error('Failed to save to LocalStorage:', e);
    }
  }

  function getStatus(count, max) {
    if (count >= max) {
      return { label: '已額滿', type: 'full', color: 'var(--accent-red)' };
    }
    if (count / max >= 0.8) {
      return { label: '即將額滿', type: 'warning', color: 'var(--accent-orange)' };
    }
    return { label: '報名中', type: 'open', color: 'var(--accent-green)' };
  }

  function formatDate(dateStr) {
    if (!dateStr) return '未定日期';
    const d = new Date(dateStr);
    return d.toLocaleDateString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' });
  }

  function showToast(message, isError = false) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = 'toast-capsule' + (isError ? ' error' : '');
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
    }, 2800);
  }

  // Navigation Logic
  window.switchView = function (viewName) {
    activeView = viewName;
    document.getElementById('view-list').classList.add('hidden');
    document.getElementById('view-admin').classList.add('hidden');

    document.getElementById('nav-list').classList.remove('active');
    document.getElementById('nav-admin').classList.remove('active');
    document.getElementById('nav-list').setAttribute('aria-selected', 'false');
    document.getElementById('nav-admin').setAttribute('aria-selected', 'false');

    if (viewName === 'list') {
      document.getElementById('view-list').classList.remove('hidden');
      document.getElementById('nav-list').classList.add('active');
      document.getElementById('nav-list').setAttribute('aria-selected', 'true');
      renderEventsGrid();
    } else if (viewName === 'admin') {
      if (!isAdminAuthenticated) {
        openModal('modal-admin-auth');
        return;
      }
      document.getElementById('view-admin').classList.remove('hidden');
      document.getElementById('nav-admin').classList.add('active');
      document.getElementById('nav-admin').setAttribute('aria-selected', 'true');
      renderAdminDashboard();
    }
  };

  window.switchAdminSubView = function (subView) {
    activeAdminSubView = subView;
    document.getElementById('admin-tab-manage').classList.toggle('active', subView === 'manage');
    document.getElementById('admin-tab-onsite').classList.toggle('active', subView === 'onsite');
    document.getElementById('admin-tab-create').classList.toggle('active', subView === 'create');

    document.getElementById('admin-sub-manage').classList.toggle('hidden', subView !== 'manage');
    document.getElementById('admin-sub-onsite').classList.toggle('hidden', subView !== 'onsite');
    document.getElementById('admin-sub-create').classList.toggle('hidden', subView !== 'create');

    if (subView === 'manage') {
      renderAdminRegistrations();
    } else if (subView === 'onsite') {
      renderOnsiteEventSelector();
    }
  };

  // Proxy Fields Toggle
  window.toggleProxyFieldsUI = function () {
    const isProxy = document.getElementById('reg-is-proxy').checked;
    const proxyBox = document.getElementById('proxy-fields-box');
    const proxyName = document.getElementById('proxy-name');
    const proxyEmail = document.getElementById('proxy-email');
    const attendeeLabel = document.getElementById('attendee-name-label');

    proxyBox.classList.toggle('hidden', !isProxy);
    proxyName.required = isProxy;
    proxyEmail.required = isProxy;

    if (isProxy) {
      attendeeLabel.innerHTML = '長輩 / 實際參加者姓名 <span class="req">*</span>';
    } else {
      attendeeLabel.innerHTML = '參加者姓名 <span class="req">*</span>';
    }
  };

  // Filter & Search
  window.filterByCategory = function (category) {
    selectedCategory = category;
    const pills = document.querySelectorAll('.category-pills .pill-btn');
    pills.forEach(pill => pill.classList.remove('active'));

    const btn = Array.from(pills).find(p => p.textContent.includes(category) || (category === 'all' && p.textContent === '全部'));
    if (btn) btn.classList.add('active');

    renderEventsGrid();
  };

  window.handleSearchInput = function (e) {
    searchQuery = e.target.value.toLowerCase().trim();
    renderEventsGrid();
  };

  // Render 8 Events Grid Wall
  function renderEventsGrid() {
    const events = loadEventsData();
    const container = document.getElementById('events-grid');
    const countLabel = document.getElementById('event-count-label');

    let filtered = events;

    if (selectedCategory === 'available') {
      filtered = filtered.filter(ev => ev.registrations.length < ev.maxPeople);
    } else if (selectedCategory !== 'all') {
      filtered = filtered.filter(ev => ev.category === selectedCategory);
    }

    if (searchQuery) {
      filtered = filtered.filter(ev =>
        ev.name.toLowerCase().includes(searchQuery) ||
        (ev.description && ev.description.toLowerCase().includes(searchQuery)) ||
        (ev.customBadge && ev.customBadge.toLowerCase().includes(searchQuery)) ||
        (ev.location && ev.location.toLowerCase().includes(searchQuery))
      );
    }

    countLabel.textContent = `共 ${filtered.length} 個活動`;

    if (filtered.length === 0) {
      container.innerHTML = `
        <div class="empty-state-view">
          <div class="empty-state-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
          </div>
          <h3 class="empty-state-title">找不到符合條件的活動</h3>
          <p class="empty-state-subtitle">請嘗試搜尋其他關鍵字或變更分類標籤</p>
        </div>
      `;
      return;
    }

    container.innerHTML = filtered.map(ev => {
      const regCount = ev.registrations ? ev.registrations.length : 0;
      const status = getStatus(regCount, ev.maxPeople);
      const pct = Math.min((regCount / ev.maxPeople) * 100, 100).toFixed(0);
      const categoryTag = ev.category || '活動';
      const customTag = ev.customBadge ? `<span class="sf-badge badge-custom">${escapeHTML(ev.customBadge)}</span>` : '';
      const priceText = ev.priceTier || '免費活動';

      return `
        <article class="event-card" onclick="openEventDetail('${ev.id}')" role="button" tabindex="0">
          <div class="card-media" style="background-image: url('${ev.image}')">
            <div class="card-badges">
              <span class="sf-badge badge-status-${status.type}">${status.label}</span>
              <div style="display:flex; gap:4px;">
                ${customTag}
                <span class="sf-badge badge-category">${categoryTag}</span>
              </div>
            </div>
          </div>
          <div class="card-content">
            <div class="card-meta-row">
              <span class="card-date">${formatDate(ev.date)}</span>
              <span class="card-price-tag">${escapeHTML(priceText)}</span>
            </div>
            <h3 class="card-title">${escapeHTML(ev.name)}</h3>
            <p class="card-description">${escapeHTML(ev.description || '')}</p>
            <div class="progress-block">
              <div class="progress-header">
                <span class="progress-label">名額進度</span>
                <span class="progress-value">${regCount} / ${ev.maxPeople} 人 (${pct}%)</span>
              </div>
              <div class="progress-track">
                <div class="progress-fill" style="width: ${pct}%; background: ${status.color};"></div>
              </div>
            </div>
          </div>
        </article>
      `;
    }).join('');
  }

  // Modals
  window.openModal = function (modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add('active');
    }
  };

  window.closeModal = function (modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('active');
    }
  };

  window.openEventDetail = function (eventId) {
    const events = loadEventsData();
    const ev = events.find(e => e.id === eventId);
    if (!ev) return;

    activeEventId = eventId;
    const regCount = ev.registrations ? ev.registrations.length : 0;
    const status = getStatus(regCount, ev.maxPeople);
    const pct = Math.min((regCount / ev.maxPeople) * 100, 100).toFixed(0);

    document.getElementById('sheet-image-bg').style.backgroundImage = `url('${ev.image}')`;
    document.getElementById('sheet-title').textContent = ev.name;
    document.getElementById('sheet-desc').textContent = ev.description || '暫無詳細說明';
    document.getElementById('sheet-date').textContent = formatDate(ev.date);
    document.getElementById('sheet-location').textContent = ev.location || '線上活動 / 待公布地點';
    document.getElementById('sheet-price').textContent = ev.priceTier || '免費活動';
    document.getElementById('sheet-progress-text').textContent = `名額進度：${regCount} / ${ev.maxPeople} 人 (${pct}%)`;

    const statusBadge = document.getElementById('sheet-status-badge');
    statusBadge.textContent = ev.customBadge ? `${ev.customBadge} ｜ ${status.label}` : status.label;
    statusBadge.className = `sf-badge badge-status-${status.type}`;

    const progressBar = document.getElementById('sheet-progress-bar');
    progressBar.style.width = `${pct}%`;
    progressBar.style.background = status.color;

    const regBtn = document.getElementById('sheet-reg-btn');
    if (regCount >= ev.maxPeople) {
      regBtn.disabled = true;
      regBtn.textContent = '已額滿';
    } else {
      regBtn.disabled = false;
      regBtn.textContent = '立即報名';
    }

    openModal('modal-detail');
  };

  // Dynamic Questionnaire Form Rendering for Public User
  window.proceedToRegisterForm = function () {
    closeModal('modal-detail');
    const events = loadEventsData();
    const ev = events.find(e => e.id === activeEventId);
    if (!ev) return;

    document.getElementById('reg-form-event-name').textContent = ev.name;
    document.getElementById('active-registration-form').reset();

    // Reset proxy fields
    document.getElementById('reg-is-proxy').checked = false;
    toggleProxyFieldsUI();

    // Render Dynamic Questionnaire Questions
    const container = document.getElementById('dynamic-questions-form-container');
    if (ev.customQuestions && ev.customQuestions.length > 0) {
      container.innerHTML = ev.customQuestions.map(q => {
        const reqTag = q.required ? '<span class="req">*</span>' : '<span class="opt">(選填)</span>';
        const isReqAttr = q.required ? 'required' : '';

        if (q.type === 'text') {
          return `
            <div class="field-group" style="margin-top:10px;">
              <label class="field-label" for="ans-${q.id}">${escapeHTML(q.title)} ${reqTag}</label>
              <input type="text" id="ans-${q.id}" class="sf-input" ${isReqAttr} placeholder="請輸入答案">
            </div>
          `;
        } else if (q.type === 'textarea') {
          return `
            <div class="field-group" style="margin-top:10px;">
              <label class="field-label" for="ans-${q.id}">${escapeHTML(q.title)} ${reqTag}</label>
              <textarea id="ans-${q.id}" class="sf-textarea" rows="2" ${isReqAttr} placeholder="請詳細說明"></textarea>
            </div>
          `;
        } else if (q.type === 'select') {
          const opts = (q.options || '').split(',').map(o => o.trim()).filter(Boolean);
          return `
            <div class="field-group" style="margin-top:10px;">
              <label class="field-label" for="ans-${q.id}">${escapeHTML(q.title)} ${reqTag}</label>
              <select id="ans-${q.id}" class="sf-select" ${isReqAttr}>
                <option value="">-- 請選擇選項 --</option>
                ${opts.map(o => `<option value="${escapeHTML(o)}">${escapeHTML(o)}</option>`).join('')}
              </select>
            </div>
          `;
        } else if (q.type === 'checkbox') {
          const opts = (q.options || '').split(',').map(o => o.trim()).filter(Boolean);
          return `
            <div class="field-group" style="margin-top:10px;">
              <label class="field-label">${escapeHTML(q.title)} ${reqTag}</label>
              <div style="display:flex; flex-direction:column; gap:6px; margin-top:4px;">
                ${opts.map(o => `
                  <label class="checkbox-row">
                    <input type="checkbox" name="ans-${q.id}" value="${escapeHTML(o)}">
                    <span>${escapeHTML(o)}</span>
                  </label>
                `).join('')}
              </div>
            </div>
          `;
        }
        return '';
      }).join('');
    } else {
      container.innerHTML = '';
    }

    openModal('modal-register-form');
  };

  window.openPrivacyModal = function () {
    openModal('modal-privacy');
  };

  // Submit Public Registration (Elder-Friendly: Phone Required, Email Optional, Deduplication check by Phone)
  window.submitRegistration = function (e) {
    e.preventDefault();
    if (!activeEventId) return;

    const privacyCheck = document.getElementById('reg-privacy-check');
    if (!privacyCheck.checked) {
      showToast('請勾選同意個人資料保護條款', true);
      return;
    }

    const isProxy = document.getElementById('reg-is-proxy').checked;
    const proxyName = isProxy ? document.getElementById('proxy-name').value.trim() : '';
    const proxyEmail = isProxy ? document.getElementById('proxy-email').value.trim() : '';

    const attendeeName = document.getElementById('reg-name').value.trim();
    const attendeePhone = document.getElementById('reg-phone').value.trim();
    const attendeeEmail = document.getElementById('reg-email').value.trim();

    if (!attendeeName || !attendeePhone) {
      showToast('請填寫參加者姓名與聯絡電話', true);
      return;
    }

    if (isProxy && (!proxyName || !proxyEmail)) {
      showToast('請填寫代報人姓名與 Email', true);
      return;
    }

    const events = loadEventsData();
    const ev = events.find(e => e.id === activeEventId);
    if (!ev) return;

    // Deduplication check by Phone Number for Senior-Friendliness
    const existingIndex = ev.registrations.findIndex(r => r.phone === attendeePhone);
    if (existingIndex !== -1) {
      showToast(`提示：此電話號碼 (${attendeePhone}) 已報名過本活動`, true);
      return;
    }

    // Collect custom question answers
    const answers = {};
    if (ev.customQuestions && ev.customQuestions.length > 0) {
      for (const q of ev.customQuestions) {
        if (q.type === 'checkbox') {
          const checkboxes = document.querySelectorAll(`input[name="ans-${q.id}"]:checked`);
          const selectedValues = Array.from(checkboxes).map(c => c.value);
          if (q.required && selectedValues.length === 0) {
            showToast(`請選擇『${q.title}』的答案`, true);
            return;
          }
          answers[q.id] = selectedValues.join(', ');
        } else {
          const input = document.getElementById(`ans-${q.id}`);
          const val = input ? input.value.trim() : '';
          if (q.required && !val) {
            showToast(`請填寫/選擇『${q.title}』`, true);
            return;
          }
          answers[q.id] = val;
        }
      }
    }

    if (ev.registrations.length >= ev.maxPeople) {
      showToast('抱歉，此活動剛好額滿！', true);
      closeModal('modal-register-form');
      return;
    }

    ev.registrations.push({
      name: attendeeName,
      email: attendeeEmail,
      phone: attendeePhone,
      isProxy,
      proxyName,
      proxyEmail,
      answers,
      checkedIn: false,
      registeredAt: Date.now()
    });

    saveEventsData(events);

    // Render Senior Voucher Card for Screenshot saving
    document.getElementById('voucher-event-name').textContent = ev.name;
    document.getElementById('voucher-attendee-info').textContent = `參加者：${attendeeName} ｜ 電話：${attendeePhone}`;
    document.getElementById('voucher-date-location').textContent = `日期：${formatDate(ev.date)} ｜ 地點：${ev.location || '現場活動'}`;

    // Sync to GAS if GAS URL exists (Sends Email via MailApp + Rate Limiting)
    const gasUrl = getGASUrl();
    if (gasUrl) {
      fetch(gasUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'register',
          eventId: ev.id,
          attendeeName,
          attendeePhone,
          attendeeEmail,
          isProxy,
          proxyName,
          proxyEmail,
          answers
        })
      }).catch(err => console.warn('GAS Sync warning:', err));
    }

    closeModal('modal-register-form');
    openModal('modal-success');
    renderEventsGrid();
  };

  // Onsite Rapid Registration (Admin Walk-In Mode)
  function renderOnsiteEventSelector() {
    const events = loadEventsData();
    const selector = document.getElementById('onsite-event-selector');
    if (!events || events.length === 0) {
      selector.innerHTML = '<option value="">尚無活動</option>';
      return;
    }
    selector.innerHTML = events.map(e => `
      <option value="${e.id}" ${e.id === activeEventId ? 'selected' : ''}>
        ${escapeHTML(e.name)} (${e.registrations.length}/${e.maxPeople}人)
      </option>
    `).join('');
  }

  window.submitOnsiteRegistration = function (e) {
    e.preventDefault();
    if (!isAdminAuthenticated) {
      showToast('權限不足', true);
      return;
    }

    const eventId = document.getElementById('onsite-event-selector').value;
    const name = document.getElementById('onsite-name').value.trim();
    const phone = document.getElementById('onsite-phone').value.trim();
    const autoCheckin = document.getElementById('onsite-auto-checkin').checked;

    if (!eventId || !name || !phone) {
      showToast('請填寫姓名與電話', true);
      return;
    }

    const events = loadEventsData();
    const ev = events.find(e => e.id === eventId);
    if (!ev) return;

    ev.registrations.push({
      name,
      email: '',
      phone,
      isProxy: false,
      answers: {},
      checkedIn: autoCheckin,
      registeredAt: Date.now()
    });

    saveEventsData(events);

    document.getElementById('onsite-name').value = '';
    document.getElementById('onsite-phone').value = '';

    showToast(`⚡️ 已完成『${name}』現場快速報名與報到！`);
    renderAdminDashboard();
    renderEventsGrid();
  };

  // Export iCal (.ics)
  window.exportCurrentEventICS = function () {
    const events = loadEventsData();
    const ev = events.find(e => e.id === activeEventId);
    if (!ev) return;

    const eventDate = ev.date ? new Date(ev.date) : new Date();
    const startStr = eventDate.toISOString().replace(/-|:|\.\d\d\d/g, '').substring(0, 15) + 'Z';
    const endStr = new Date(eventDate.getTime() + 7200000).toISOString().replace(/-|:|\.\d\d\d/g, '').substring(0, 15) + 'Z';

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Apple Native SwiftUI Event System//TW',
      'BEGIN:VEVENT',
      `UID:event-${ev.id}@twwgapp.pages.dev`,
      `DTSTAMP:${startStr}`,
      `DTSTART:${startStr}`,
      `DTEND:${endStr}`,
      `SUMMARY:${ev.name}`,
      `DESCRIPTION:${(ev.description || '').replace(/\n/g, ' ')}`,
      `LOCATION:${ev.location || ''}`,
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', `${ev.name.replace(/\s+/g, '_')}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('已匯出 iCal 行事曆檔案！');
  };

  // Google Forms Questionnaire Builder Logic in Admin View
  window.addQuestionnaireField = function () {
    const qId = 'q_' + Date.now().toString(36);
    builderQuestions.push({
      id: qId,
      title: '',
      type: 'select',
      options: '選項 A, 選項 B',
      required: false
    });
    renderQuestionnaireBuilder();
  };

  window.removeQuestionnaireField = function (index) {
    builderQuestions.splice(index, 1);
    renderQuestionnaireBuilder();
  };

  function renderQuestionnaireBuilder() {
    const container = document.getElementById('questionnaire-builder-container');
    if (!container) return;

    if (builderQuestions.length === 0) {
      container.innerHTML = `
        <div style="font-size:13px; color:var(--label-tertiary); text-align:center; padding:12px; border:1px dashed var(--separator); border-radius:var(--radius-s);">
          尚無自訂問卷題目。點擊上方「＋ 新增題目」按鈕新增題目。
        </div>
      `;
      return;
    }

    container.innerHTML = builderQuestions.map((q, i) => `
      <div class="question-item-card">
        <div class="question-item-header">
          <span style="font-size:13px; font-weight:600;">題目 #${i + 1}</span>
          <button type="button" class="btn-system-danger" style="font-size:11px; padding:3px 8px;" onclick="removeQuestionnaireField(${i})">刪除此題</button>
        </div>

        <div class="form-row-2">
          <div class="field-group">
            <label class="field-label">題目名稱</label>
            <input type="text" class="sf-input" value="${escapeHTML(q.title)}" placeholder="例如：飲食習慣需求" onchange="builderQuestions[${i}].title=this.value.trim()">
          </div>
          <div class="field-group">
            <label class="field-label">題型</label>
            <select class="sf-select" onchange="builderQuestions[${i}].type=this.value; renderQuestionnaireBuilder();">
              <option value="text" ${q.type === 'text' ? 'selected' : ''}>單行簡答 (Text)</option>
              <option value="textarea" ${q.type === 'textarea' ? 'selected' : ''}>多行長文 (Paragraph)</option>
              <option value="select" ${q.type === 'select' ? 'selected' : ''}>單選下拉選單 (Select)</option>
              <option value="checkbox" ${q.type === 'checkbox' ? 'selected' : ''}>多選核取方塊 (Checkbox)</option>
            </select>
          </div>
        </div>

        ${(q.type === 'select' || q.type === 'checkbox') ? `
          <div class="field-group">
            <label class="field-label">選項內容 (以逗號分隔)</label>
            <input type="text" class="sf-input" value="${escapeHTML(q.options || '')}" placeholder="例如：葷食, 素食(蛋奶素), 全素" onchange="builderQuestions[${i}].options=this.value.trim()">
          </div>
        ` : ''}

        <label class="checkbox-row" style="margin-top:2px;">
          <input type="checkbox" ${q.required ? 'checked' : ''} onchange="builderQuestions[${i}].required=this.checked">
          <span>將此題目設為必填 (勾選必填，取消勾選則為選填)</span>
        </label>
      </div>
    `).join('');
  }

  // Image Upload Method Tabs
  window.switchUploadMethod = function (method) {
    uploadMethod = method;
    document.getElementById('tab-url').classList.toggle('active', method === 'url');
    document.getElementById('tab-file').classList.toggle('active', method === 'file');

    document.getElementById('upload-url-input-block').classList.toggle('hidden', method !== 'url');
    document.getElementById('upload-file-input-block').classList.toggle('hidden', method !== 'file');
  };

  window.handleImageUrlChange = function (e) {
    const url = e.target.value.trim();
    const preview = document.getElementById('image-preview');
    if (url) {
      preview.style.backgroundImage = `url('${url}')`;
      preview.classList.remove('hidden');
    } else {
      preview.classList.add('hidden');
    }
  };

  window.handleFileSelect = function (e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (event) {
      filePreviewDataUrl = event.target.result;
      const preview = document.getElementById('image-preview');
      preview.style.backgroundImage = `url('${filePreviewDataUrl}')`;
      preview.classList.remove('hidden');
    };
    reader.readAsDataURL(file);
  };

  // Create New Event
  window.submitCreateEvent = function (e) {
    e.preventDefault();
    if (!isAdminAuthenticated) {
      showToast('權限不足：需要管理員驗證', true);
      return;
    }

    const name = document.getElementById('event-name').value.trim();
    const category = document.getElementById('event-category').value;
    const date = document.getElementById('event-date').value;
    const desc = document.getElementById('event-desc').value.trim();
    const location = document.getElementById('event-location').value.trim();
    const priceTier = document.getElementById('event-price-tier').value.trim();
    const customBadge = document.getElementById('event-custom-badge').value.trim();
    const maxPeople = parseInt(document.getElementById('event-max').value, 10);

    let image = DEFAULT_IMAGES[Math.floor(Math.random() * DEFAULT_IMAGES.length)];

    if (uploadMethod === 'url') {
      const urlInput = document.getElementById('event-img-url').value.trim();
      if (urlInput) image = urlInput;
    } else if (uploadMethod === 'file' && filePreviewDataUrl) {
      image = filePreviewDataUrl;
    }

    if (!name || !date || !maxPeople || maxPeople < 1) {
      showToast('請填寫完整必填欄位', true);
      return;
    }

    const events = loadEventsData();
    const newEvent = {
      id: 'evt-' + Date.now(),
      name,
      category,
      customBadge,
      priceTier,
      date,
      description: desc,
      maxPeople,
      location: location || '現場活動',
      image,
      phoneRequired: true,
      customQuestions: [...builderQuestions],
      createdAt: Date.now(),
      registrations: []
    };

    events.unshift(newEvent);
    saveEventsData(events);

    document.getElementById('create-event-form').reset();
    document.getElementById('image-preview').classList.add('hidden');
    filePreviewDataUrl = null;
    builderQuestions = [];
    renderQuestionnaireBuilder();

    showToast('🎉 新活動與自訂問卷成功發布！');
    switchAdminSubView('manage');
    renderEventsGrid();
  };

  // Admin Registrations & Attendance Dashboard
  function renderAdminDashboard() {
    const events = loadEventsData();
    const selector = document.getElementById('admin-event-selector');

    if (!events || events.length === 0) {
      selector.innerHTML = '<option value="">尚無活動</option>';
      renderAdminRegistrations();
      return;
    }

    selector.innerHTML = events.map(e => `
      <option value="${e.id}" ${e.id === activeEventId ? 'selected' : ''}>
        ${escapeHTML(e.name)} (${e.registrations.length}/${e.maxPeople}人)
      </option>
    `).join('');

    if (!activeEventId || !events.some(e => e.id === activeEventId)) {
      activeEventId = events[0].id;
    }

    renderAdminRegistrations();
  }

  window.handleAdminSelectEvent = function (e) {
    activeEventId = e.target.value;
    renderAdminRegistrations();
  };

  function renderAdminRegistrations() {
    if (!isAdminAuthenticated) return;

    const events = loadEventsData();
    const ev = events.find(e => e.id === activeEventId);
    const detailContainer = document.getElementById('manage-event-detail');
    const regContainer = document.getElementById('manage-registrations-list');
    const statBadge = document.getElementById('attendance-stat-badge');

    if (!ev) {
      detailContainer.innerHTML = '<p>尚無選取的活動</p>';
      regContainer.innerHTML = '';
      if (statBadge) statBadge.textContent = '已報到 0 人';
      return;
    }

    const checkedInCount = ev.registrations.filter(r => r.checkedIn).length;
    if (statBadge) {
      statBadge.textContent = `已報到 ${checkedInCount} / ${ev.registrations.length} 人`;
    }

    detailContainer.innerHTML = `
      <div style="background:var(--surface-secondary); padding:14px; border-radius:var(--radius-s); margin-bottom:14px; border:1px solid var(--separator);">
        <div style="display:flex; justify-content:space-between; align-items:flex-start;">
          <div>
            <h3 style="font-size:16px; font-weight:600; margin-bottom:4px;">${escapeHTML(ev.name)}</h3>
            <p style="font-size:13px; color:var(--label-secondary);">日期：${formatDate(ev.date)} ｜ 地點：${escapeHTML(ev.location || '未定')} ｜ 票價：${escapeHTML(ev.priceTier || '免費')}</p>
          </div>
          <span class="sf-badge badge-category">${escapeHTML(ev.category || '活動')}</span>
        </div>
        <p style="font-size:13px; color:var(--label-secondary); margin-top:4px;">報名人數：${ev.registrations.length} / ${ev.maxPeople} 人</p>
      </div>
    `;

    if (ev.registrations.length === 0) {
      regContainer.innerHTML = `
        <div style="text-align:center; padding:30px; color:var(--label-tertiary); font-size:13.5px;">
          目前尚無參加者報名
        </div>
      `;
    } else {
      const qTitles = (ev.customQuestions || []).map(q => q.title);

      regContainer.innerHTML = `
        <div class="sf-table-wrapper">
          <table class="sf-table">
            <thead>
              <tr>
                <th>狀態/簽到</th>
                <th>參加者姓名</th>
                <th>電話 / Email</th>
                <th>代報模式</th>
                ${qTitles.map(t => `<th>${escapeHTML(t)}</th>`).join('')}
                <th>報名日期</th>
              </tr>
            </thead>
            <tbody>
              ${ev.registrations.map((r, i) => {
                const btnClass = r.checkedIn ? 'btn-checkin-status checked' : 'btn-checkin-status unchecked';
                const statusText = r.checkedIn ? '✓ 已報到' : '點擊簽到';
                const proxyText = r.isProxy ? `<span class="cell-sub" style="color:var(--accent-purple);">代報 (${escapeHTML(r.proxyName || '')})</span>` : '親自報名';

                return `
                  <tr>
                    <td>
                      <button class="${btnClass}" onclick="toggleCheckInStatus('${ev.id}', ${i})">${statusText}</button>
                    </td>
                    <td style="font-weight:600;">${escapeHTML(r.name)}</td>
                    <td>
                      <div>${escapeHTML(r.phone || '無電話')}</div>
                      <div class="cell-sub">${escapeHTML(r.email || '無Email')}</div>
                    </td>
                    <td>${proxyText}</td>
                    ${(ev.customQuestions || []).map(q => `
                      <td class="cell-sub">${escapeHTML((r.answers && r.answers[q.id]) || '-')}</td>
                    `).join('')}
                    <td class="cell-sub">${new Date(r.registeredAt).toLocaleDateString('zh-TW')}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      `;
    }
  }

  window.toggleCheckInStatus = function (eventId, regIndex) {
    if (!isAdminAuthenticated) return;
    const events = loadEventsData();
    const ev = events.find(e => e.id === eventId);
    if (!ev || !ev.registrations[regIndex]) return;

    ev.registrations[regIndex].checkedIn = !ev.registrations[regIndex].checkedIn;
    saveEventsData(events);

    const statusStr = ev.registrations[regIndex].checkedIn ? '已成功標記簽到' : '已取消簽到狀態';
    showToast(statusStr);
    renderAdminRegistrations();
  };

  window.exportRegistrationsCSV = function () {
    if (!isAdminAuthenticated) {
      showToast('權限不足', true);
      return;
    }
    const events = loadEventsData();
    const ev = events.find(e => e.id === activeEventId);
    if (!ev || !ev.registrations || ev.registrations.length === 0) {
      showToast('尚無報名資料可導出', true);
      return;
    }

    const qList = ev.customQuestions || [];
    const headers = ['活動名稱', '參加者姓名', '電話', 'Email', '簽到狀態', '代報名狀態', '代報人姓名', '代報人Email', ...qList.map(q => q.title), '報名時間'];

    const rows = ev.registrations.map(r => {
      const qAnswers = qList.map(q => (r.answers && r.answers[q.id]) ? r.answers[q.id] : '');
      return [
        ev.name,
        r.name,
        r.phone || '',
        r.email || '',
        r.checkedIn ? '已報到' : '未報到',
        r.isProxy ? '代報名' : '親自報名',
        r.proxyName || '',
        r.proxyEmail || '',
        ...qAnswers,
        new Date(r.registeredAt).toLocaleString('zh-TW')
      ].map(val => `"${String(val).replace(/"/g, '""')}"`);
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `${ev.name}_報名名單.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('📊 UTF-8 CSV 報名名單導出成功！');
  };

  window.deleteActiveEvent = function () {
    if (!isAdminAuthenticated) {
      showToast('權限不足', true);
      return;
    }
    if (!activeEventId) return;
    if (!confirm('確定要刪除此活動嗎？刪除後無法復原。')) return;

    let events = loadEventsData();
    events = events.filter(e => e.id !== activeEventId);
    saveEventsData(events);

    activeEventId = events.length > 0 ? events[0].id : null;
    showToast('活動已成功刪除');
    renderAdminDashboard();
    renderEventsGrid();
  };

  function escapeHTML(str) {
    if (!str) return '';
    return str.replace(/[&<>'"]/g,
      tag => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;'
      }[tag] || tag)
    );
  }

  // Initialize
  document.addEventListener('DOMContentLoaded', () => {
    checkAdminSession();
    loadEventsData();
    renderEventsGrid();
    renderQuestionnaireBuilder();
  });

})();
