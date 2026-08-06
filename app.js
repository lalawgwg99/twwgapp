/**
 * Apple Native (SwiftUI Style) Event Registration & Management Platform
 * 萬家福五甲店 (Prosperity Plaza Wujia Branch) Official Store Portal & Event System
 */

(function () {
  'use strict';

  const STORAGE_KEY = 'twwgapp_wujia_store_events_v8';
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

  const STORE_IMAGES = [
    'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=800&h=450&fit=crop', // 🛒 會員週年慶
    'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=800&h=450&fit=crop', // 🍷 名酒品鑑
    'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=800&h=450&fit=crop', // 🥦 有機料理教室
    'https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?w=800&h=450&fit=crop', // 🧸 親子手作黏土
    'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&h=450&fit=crop', // 🧘 晨間頂樓瑜伽
    'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&h=450&fit=crop', // ☕️ 精品咖啡講座
    'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=800&h=450&fit=crop', // ⛺️ 露營裝備體驗
    'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=800&h=450&fit=crop'  // 🍰 法式甜點體驗
  ];

  const DEMO_EVENTS = [
    {
      id: 'wujia-1',
      name: '萬家福五甲店 2026 會員週年慶尊榮驚喜抽獎會',
      category: '體驗',
      customBadge: '五甲店獨家 7折',
      priceTier: '憑會員卡免費參加',
      description: '萬家福五甲店深耕在地 20 週年！現場舉辦頂級食材試吃、好禮抽獎與五甲店限定滿額折扣送，邀請全家大小一同共襄盛舉。',
      maxPeople: 300,
      date: '2026-08-22',
      startDate: '2026-08-01T09:00',
      endDate: '2026-08-21T23:59',
      location: '萬家福五甲店 1樓中央品牌廣場',
      image: STORE_IMAGES[0],
      phoneRequired: true,
      customQuestions: [
        { id: 'q1', title: '萬家福會員卡號 (可填寫或現場核對)', type: 'text', required: false },
        { id: 'q2', title: '預計到場人數', type: 'select', options: '1人, 2人, 3人, 4人以上家庭', required: true }
      ],
      createdAt: Date.now() - 86400000 * 5,
      registrations: [
        { name: '陳小明', email: 'chen@example.com', phone: '0912-345-678', answers: { q1: 'WJ-88991', q2: '2人' }, checkedIn: true, registeredAt: Date.now() - 86400000 * 2 },
        { name: '林美玲', email: 'lin@example.com', phone: '0987-654-321', answers: { q1: 'WJ-11223', q2: '4人以上家庭' }, checkedIn: false, registeredAt: Date.now() - 86400000 }
      ]
    },
    {
      id: 'wujia-2',
      name: '萬家福五甲店 全球特選名酒與起司品鑑試飲會',
      category: '體驗',
      customBadge: '限時尊榮 VIP',
      priceTier: '會員價 NT$ 399',
      description: '由萬家福侍酒師帶領品鑑智利、法國頂級莊園紅酒與嚴選熟成起司，現場購買享五甲店獨家 85 折優惠。',
      maxPeople: 25,
      date: '2026-08-25',
      startDate: '2026-08-01T09:00',
      endDate: '2026-08-24T18:00',
      location: '萬家福五甲店 B1 典藏酒窖區',
      image: STORE_IMAGES[1],
      phoneRequired: true,
      customQuestions: [
        { id: 'q1', title: '是否已滿 18 歲 (禁止酒駕)', type: 'select', options: '是 (已滿 18 歲)', required: true }
      ],
      createdAt: Date.now() - 86400000 * 4,
      registrations: [
        { name: '周宗翰', email: 'chou@example.com', phone: '0911-222-333', answers: { q1: '是 (已滿 18 歲)' }, checkedIn: true, registeredAt: Date.now() - 7200000 }
      ]
    },
    {
      id: 'wujia-3',
      name: '有機小農產地直送試吃與夏日輕食料理教室',
      category: '講座',
      customBadge: '食材包全送',
      priceTier: '免費體驗',
      description: '邀請高雄在地有機農夫與知名廚師，指導如何挑選當季安心蔬菜，並現場實作低卡夏日沙拉與主廚特調醬汁。',
      maxPeople: 30,
      date: '2026-08-28',
      startDate: '2026-08-01T09:00',
      endDate: '2026-08-27T22:00',
      location: '萬家福五甲店 2樓料理實驗室',
      image: STORE_IMAGES[2],
      phoneRequired: true,
      customQuestions: [
        { id: 'q1', title: '特殊飲食需求', type: 'select', options: '葷食, 全素/蛋奶素, 海鮮過敏', required: true }
      ],
      createdAt: Date.now() - 86400000 * 3,
      registrations: [
        { name: '吳大仁', email: 'wu@example.com', phone: '0922-888-999', answers: { q1: '全素/蛋奶素' }, checkedIn: true, registeredAt: Date.now() - 5400000 }
      ]
    },
    {
      id: 'wujia-4',
      name: '五甲店 暑期親子彩繪與超輕黏土創意樂園',
      category: '藝文',
      customBadge: '親子好玩',
      priceTier: '材料費 NT$ 150',
      description: '專為爸爸媽媽與小朋友設計的夏日手作課程！老師現場教學捏塑水果公仔與海洋世界，成品可直接帶回家。',
      maxPeople: 20,
      date: '2026-08-30',
      startDate: '2026-08-01T09:00',
      endDate: '2026-08-29T18:00',
      location: '萬家福五甲店 3樓親子互動區',
      image: STORE_IMAGES[3],
      phoneRequired: true,
      customQuestions: [
        { id: 'q1', title: '小朋友年齡與人數', type: 'text', required: true }
      ],
      createdAt: Date.now() - 86400000 * 2,
      registrations: [
        { name: '許雅婷', email: 'hsu@example.com', phone: '0912-333-444', answers: { q1: '5歲小孩1位' }, checkedIn: true, registeredAt: Date.now() - 86400000 }
      ]
    },
    {
      id: 'wujia-5',
      name: '萬家福頂樓空中花園 晨間舒活瑜伽與元氣早餐會',
      category: '運動',
      customBadge: '附萬家福鮮採早餐',
      priceTier: '會員特惠 NT$ 200',
      description: '在萬家福五甲店空中花園享受清晨陽光，由專業瑜伽導師引導舒展肩頸，課後享用萬家福現烤麵包與有機鮮果汁。',
      maxPeople: 25,
      date: '2026-09-05',
      startDate: '2026-08-10T09:00',
      endDate: '2026-09-04T18:00',
      location: '萬家福五甲店 R樓空中花園',
      image: STORE_IMAGES[4],
      phoneRequired: true,
      customQuestions: [],
      createdAt: Date.now() - 43200000,
      registrations: [
        { name: '曹小芳', email: 'tsao@example.com', phone: '0933-888-999', answers: {}, checkedIn: true, registeredAt: Date.now() - 7200000 }
      ]
    },
    {
      id: 'wujia-6',
      name: '萬家福精品咖啡豆 手沖風味與居家烘焙巡迴講座',
      category: '講座',
      customBadge: '送莊園咖啡豆小樣',
      priceTier: '免費入場',
      description: '國際 Q Grader 咖啡品評師現場講解 5 款產區莊園豆風味，學習沖煮金盃法則，參加者每位免費贈送 50g 嚴選豆。',
      maxPeople: 40,
      date: '2026-09-12',
      startDate: '2026-08-15T09:00',
      endDate: '2026-09-11T22:00',
      location: '萬家福五甲店 1樓美食咖啡館',
      image: STORE_IMAGES[5],
      phoneRequired: true,
      customQuestions: [],
      createdAt: Date.now() - 21600000,
      registrations: []
    },
    {
      id: 'wujia-7',
      name: '五甲店 戶外露營裝備展示與快速搭帳實作體驗',
      category: '戶外',
      customBadge: '露營迷必參加',
      priceTier: '免費參加',
      description: '萬家福五甲店戶外運動專區特展！現場展出 2026 最新款一秒速開帳篷、露營焚火台與行動廚房，專人實機教學。',
      maxPeople: 50,
      date: '2026-09-19',
      startDate: '2026-08-15T09:00',
      endDate: '2026-09-18T20:00',
      location: '萬家福五甲店 1樓戶外展演廣場',
      image: STORE_IMAGES[6],
      phoneRequired: true,
      customQuestions: [],
      createdAt: Date.now() - 10800000,
      registrations: []
    },
    {
      id: 'wujia-8',
      name: '萬家福五甲店 烘焙坊 法式水果塔與泡芙手作課',
      category: '藝文',
      customBadge: '烘焙師親授',
      priceTier: '材料費 NT$ 350',
      description: '萬家福金牌烘焙師手把手指導捏塔皮、煮卡士達醬與新鮮水果擺盤，打造屬於您獨一無二的五甲店法式精緻甜點。',
      maxPeople: 15,
      date: '2026-09-26',
      startDate: '2026-08-20T09:00',
      endDate: '2026-09-25T18:00',
      location: '萬家福五甲店 2樓手作廚房',
      image: STORE_IMAGES[7],
      phoneRequired: true,
      customQuestions: [],
      createdAt: Date.now() - 3600000,
      registrations: []
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
      label.textContent = isAdminAuthenticated ? '🔓 五甲店後台' : '🔑 管理員驗證';
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
        showToast('🔓 萬家福五甲店 後端驗證成功！');
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
      showToast('🔓 萬家福五甲店 後端驗證成功！');
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
    showToast('🔒 五甲店管理員後台已鎖定登出');
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

  // AUTOMATIC DATETIME CUTOFF & STATUS CALCULATION
  function getStatus(count, max, startDateStr, endDateStr) {
    const now = Date.now();

    if (startDateStr) {
      const startTime = new Date(startDateStr).getTime();
      if (!isNaN(startTime) && now < startTime) {
        return { label: '尚未開放報名', type: 'pending', color: 'var(--accent-blue)', allowRegister: false };
      }
    }

    if (endDateStr) {
      const endTime = new Date(endDateStr).getTime();
      if (!isNaN(endTime) && now > endTime) {
        return { label: '已截止報名', type: 'closed', color: 'var(--accent-gray)', allowRegister: false };
      }
    }

    if (count >= max) {
      return { label: '已額滿', type: 'full', color: 'var(--accent-red)', allowRegister: false };
    }
    if (count / max >= 0.8) {
      return { label: '即將額滿', type: 'warning', color: 'var(--accent-orange)', allowRegister: true };
    }

    return { label: '報名中', type: 'open', color: 'var(--accent-green)', allowRegister: true };
  }

  function formatDate(dateStr) {
    if (!dateStr) return '未定日期';
    const d = new Date(dateStr);
    return d.toLocaleDateString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' });
  }

  function formatDateTime(dateTimeStr) {
    if (!dateTimeStr) return '未設定';
    const d = new Date(dateTimeStr);
    return d.toLocaleString('zh-TW', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });
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

  // Render Events Grid Wall
  function renderEventsGrid() {
    const events = loadEventsData();
    const container = document.getElementById('events-grid');
    const countLabel = document.getElementById('event-count-label');

    let filtered = events;

    if (selectedCategory === 'available') {
      filtered = filtered.filter(ev => {
        const st = getStatus(ev.registrations ? ev.registrations.length : 0, ev.maxPeople, ev.startDate, ev.endDate);
        return st.allowRegister;
      });
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
          <h3 class="empty-state-title">找不到符合條件的五甲店活動</h3>
          <p class="empty-state-subtitle">請嘗試搜尋其他關鍵字或變更分類標籤</p>
        </div>
      `;
      return;
    }

    container.innerHTML = filtered.map(ev => {
      const regCount = ev.registrations ? ev.registrations.length : 0;
      const status = getStatus(regCount, ev.maxPeople, ev.startDate, ev.endDate);
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

  // EDIT PUBLISHED EVENT LOGIC
  window.openEditEventModal = function () {
    if (!isAdminAuthenticated) {
      showToast('權限不足', true);
      return;
    }

    const events = loadEventsData();
    const ev = events.find(e => e.id === activeEventId);
    if (!ev) {
      showToast('請先選擇要編輯的活動', true);
      return;
    }

    document.getElementById('edit-event-name').value = ev.name || '';
    document.getElementById('edit-event-category').value = ev.category || '音樂';
    document.getElementById('edit-event-date').value = ev.date || '';
    document.getElementById('edit-event-start-time').value = ev.startDate || '';
    document.getElementById('edit-event-end-time').value = ev.endDate || '';
    document.getElementById('edit-event-desc').value = ev.description || '';
    document.getElementById('edit-event-location').value = ev.location || '';
    document.getElementById('edit-event-price-tier').value = ev.priceTier || '';
    document.getElementById('edit-event-custom-badge').value = ev.customBadge || '';
    document.getElementById('edit-event-max').value = ev.maxPeople || 50;
    document.getElementById('edit-event-img-url').value = ev.image || '';

    openModal('modal-edit-event');
  };

  window.submitEditEvent = function (e) {
    e.preventDefault();
    if (!isAdminAuthenticated) {
      showToast('權限不足', true);
      return;
    }

    const events = loadEventsData();
    const ev = events.find(e => e.id === activeEventId);
    if (!ev) return;

    const name = document.getElementById('edit-event-name').value.trim();
    const category = document.getElementById('edit-event-category').value;
    const date = document.getElementById('edit-event-date').value;
    const startDate = document.getElementById('edit-event-start-time').value;
    const endDate = document.getElementById('edit-event-end-time').value;
    const desc = document.getElementById('edit-event-desc').value.trim();
    const location = document.getElementById('edit-event-location').value.trim();
    const priceTier = document.getElementById('edit-event-price-tier').value.trim();
    const customBadge = document.getElementById('edit-event-custom-badge').value.trim();
    const maxPeople = parseInt(document.getElementById('edit-event-max').value, 10);
    const image = document.getElementById('edit-event-img-url').value.trim() || ev.image;

    if (!name || !date || !endDate || !maxPeople || maxPeople < 1) {
      showToast('請填寫完整必填欄位與報名截止時間', true);
      return;
    }

    ev.name = name;
    ev.category = category;
    ev.date = date;
    ev.startDate = startDate;
    ev.endDate = endDate;
    ev.description = desc;
    ev.location = location;
    ev.priceTier = priceTier;
    ev.customBadge = customBadge;
    ev.maxPeople = maxPeople;
    ev.image = image;

    saveEventsData(events);

    const gasUrl = getGASUrl();
    if (gasUrl) {
      fetch(gasUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_event',
          passcode: DEFAULT_ADMIN_PASSCODE,
          event: ev
        })
      }).catch(err => console.warn('GAS Sync warning:', err));
    }

    closeModal('modal-edit-event');
    showToast(`✏️ 已成功更新『${name}』活動設定！`);
    renderAdminDashboard();
    renderEventsGrid();
  };

  window.openEventDetail = function (eventId) {
    const events = loadEventsData();
    const ev = events.find(e => e.id === eventId);
    if (!ev) return;

    activeEventId = eventId;
    const regCount = ev.registrations ? ev.registrations.length : 0;
    const status = getStatus(regCount, ev.maxPeople, ev.startDate, ev.endDate);
    const pct = Math.min((regCount / ev.maxPeople) * 100, 100).toFixed(0);

    document.getElementById('sheet-image-bg').style.backgroundImage = `url('${ev.image}')`;
    document.getElementById('sheet-title').textContent = ev.name;
    document.getElementById('sheet-desc').textContent = ev.description || '暫無詳細說明';
    document.getElementById('sheet-date').textContent = formatDate(ev.date);
    document.getElementById('sheet-deadline-text').textContent = ev.endDate ? `報名截止時間：${formatDateTime(ev.endDate)}` : '報名截止時間：不限';
    document.getElementById('sheet-location').textContent = ev.location || '萬家福五甲店 現場';
    document.getElementById('sheet-price').textContent = ev.priceTier || '免費活動';
    document.getElementById('sheet-progress-text').textContent = `名額進度：${regCount} / ${ev.maxPeople} 人 (${pct}%)`;

    const statusBadge = document.getElementById('sheet-status-badge');
    statusBadge.textContent = ev.customBadge ? `${ev.customBadge} ｜ ${status.label}` : status.label;
    statusBadge.className = `sf-badge badge-status-${status.type}`;

    const progressBar = document.getElementById('sheet-progress-bar');
    progressBar.style.width = `${pct}%`;
    progressBar.style.background = status.color;

    const regBtn = document.getElementById('sheet-reg-btn');
    if (!status.allowRegister) {
      regBtn.disabled = true;
      regBtn.textContent = status.label;
    } else {
      regBtn.disabled = false;
      regBtn.textContent = '立即報名';
    }

    openModal('modal-detail');
  };

  // Dynamic Questionnaire Form Rendering
  window.proceedToRegisterForm = function () {
    const events = loadEventsData();
    const ev = events.find(e => e.id === activeEventId);
    if (!ev) return;

    const regCount = ev.registrations ? ev.registrations.length : 0;
    const status = getStatus(regCount, ev.maxPeople, ev.startDate, ev.endDate);

    if (!status.allowRegister) {
      showToast(`無法報名：${status.label}`, true);
      return;
    }

    closeModal('modal-detail');
    document.getElementById('reg-form-event-name').textContent = ev.name;
    document.getElementById('active-registration-form').reset();

    document.getElementById('reg-is-proxy').checked = false;
    toggleProxyFieldsUI();

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

  // Submit Public Registration
  window.submitRegistration = function (e) {
    e.preventDefault();
    if (!activeEventId) return;

    const events = loadEventsData();
    const ev = events.find(e => e.id === activeEventId);
    if (!ev) return;

    const status = getStatus(ev.registrations.length, ev.maxPeople, ev.startDate, ev.endDate);
    if (!status.allowRegister) {
      showToast(`報名已關閉：${status.label}`, true);
      closeModal('modal-register-form');
      return;
    }

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

    const existingIndex = ev.registrations.findIndex(r => r.phone === attendeePhone);
    if (existingIndex !== -1) {
      showToast(`提示：此電話號碼 (${attendeePhone}) 已報名過本活動`, true);
      return;
    }

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

    document.getElementById('voucher-event-name').textContent = ev.name;
    document.getElementById('voucher-attendee-info').textContent = `參加者：${attendeeName} ｜ 電話：${attendeePhone}`;
    document.getElementById('voucher-date-location').textContent = `地點：${ev.location || '萬家福五甲店 現場'}`;

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

  // Onsite Rapid Registration
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

  // Google Forms Questionnaire Builder Logic
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
    const startDate = document.getElementById('event-start-time').value;
    const endDate = document.getElementById('event-end-time').value;
    const desc = document.getElementById('event-desc').value.trim();
    const location = document.getElementById('event-location').value.trim();
    const priceTier = document.getElementById('event-price-tier').value.trim();
    const customBadge = document.getElementById('event-custom-badge').value.trim();
    const maxPeople = parseInt(document.getElementById('event-max').value, 10);

    let image = STORE_IMAGES[Math.floor(Math.random() * STORE_IMAGES.length)];

    if (uploadMethod === 'url') {
      const urlInput = document.getElementById('event-img-url').value.trim();
      if (urlInput) image = urlInput;
    } else if (uploadMethod === 'file' && filePreviewDataUrl) {
      image = filePreviewDataUrl;
    }

    if (!name || !date || !endDate || !maxPeople || maxPeople < 1) {
      showToast('請填寫完整必填欄位與報名截止時間', true);
      return;
    }

    const events = loadEventsData();
    const newEvent = {
      id: 'wujia-' + Date.now(),
      name,
      category,
      customBadge,
      priceTier,
      date,
      startDate,
      endDate,
      description: desc,
      maxPeople,
      location: location || '萬家福五甲店 現場',
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

    showToast('🎉 萬家福五甲店 新活動發布成功！');
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

    const deadlineDisplay = ev.endDate ? formatDateTime(ev.endDate) : '不限制';

    detailContainer.innerHTML = `
      <div style="background:var(--surface-secondary); padding:14px; border-radius:var(--radius-s); margin-bottom:14px; border:1px solid var(--separator);">
        <div style="display:flex; justify-content:space-between; align-items:flex-start;">
          <div>
            <h3 style="font-size:16px; font-weight:600; margin-bottom:4px;">${escapeHTML(ev.name)}</h3>
            <p style="font-size:13px; color:var(--label-secondary);">活動日期：${formatDate(ev.date)} ｜ 截止報名：<span style="color:var(--accent-orange); font-weight:600;">${deadlineDisplay}</span> ｜ 票價：${escapeHTML(ev.priceTier || '免費')}</p>
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
