/**
 * Apple Native (SwiftUI Style) Event Registration & Management Platform
 * 萬家福五甲店 (Prosperity Plaza Wujia Branch) Official Store Portal & Dynamic Custom Categories
 */

(function () {
  'use strict';

  const STORAGE_KEY = 'twwgapp_wujia_store_events_v10';
  const ADMIN_TOKEN_KEY = 'twwgapp_server_signed_token';
  const ADMIN_DATA_KEY = 'twwgapp_admin_event_data';
  const LEGACY_GAS_URL_KEY = 'twwgapp_gas_webapp_url';
  const QUICK_LINKS_KEY = 'twwgapp_quick_links_v2';
  const HERO_CONFIG_KEY = 'twwgapp_hero_config_v1';

  const DEFAULT_HERO_CONFIG = {
    title: '萬家福五甲店 每月會員 9 折專屬感恩慶',
    description: '全館生鮮、乾貨、進口零食憑萬家福會員卡即享 9 折限時折扣！數量有限，倒數截止搶購中。',
    badge: '五甲店獨家 9折',
    priceText: '全館憑卡 9 折',
    locationText: '萬家福五甲店 全館門市',
    startDate: '2026-08-01T00:00',
    endDate: '2026-08-31T23:59',
    countdownEnabled: true,
    bgImage: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=1600&h=400&fit=crop',
    buttonText: '瀏覽本月活動',
    buttonUrl: '#events-grid'
  };

  let activeView = 'list';
  let activeAdminSubView = 'manage';
  let selectedCategory = 'all';
  let searchQuery = '';
  let activeEventId = null;
  let uploadMethod = 'url';
  let filePreviewDataUrl = null;
  let editEventUploadMethod = 'url';
  let editEventFilePreviewDataUrl = null;
  let editBuilderQuestions = [];
  let lastFocusedElement = null;
  let backendMode = 'client_sync';

  // Real Server Authentication State
  let adminSessionToken = null;
  let isAdminAuthenticated = false;

  // Custom Questionnaire State in Builder
  let builderQuestions = [];

  const DEFAULT_QUICK_LINKS = {
    mapUrl: 'https://www.google.com/maps/search/?api=1&query=830%E9%AB%98%E9%9B%84%E5%B8%82%E9%B3%B6%E5%B1%B1%E5%8D%80%E5%AF%8C%E6%A6%AE%E9%87%8C%E6%9E%97%E6%A3%AE%E8%B7%AF291%E8%99%9F+%E8%90%AC%E5%AE%B6%E7%A6%8F%E4%BA%94%E7%94%B2%E5%BA%97',
    lineUrl: '',
    fbUrl: '',
    igUrl: '',
    ytUrl: '',
    siteUrl: 'https://www.prosperity-plaza.com.tw'
  };

  const STORE_IMAGES = [
    'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=800&h=450&fit=crop',
    'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=800&h=450&fit=crop',
    'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=800&h=450&fit=crop',
    'https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?w=800&h=450&fit=crop',
    'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&h=450&fit=crop',
    'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&h=450&fit=crop',
    'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=800&h=450&fit=crop',
    'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=800&h=450&fit=crop'
  ];

  const DEMO_EVENTS = [
    {
      id: 'wujia-1',
      name: '萬家福五甲店 2026 會員週年慶尊榮驚喜抽獎會',
      category: '體驗試吃',
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
      category: '體驗試吃',
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
      category: '健康講座',
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
      category: '親子手作',
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
      category: '晨間瑜伽',
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
      category: '健康講座',
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
      category: '戶外展示',
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
      category: '親子手作',
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

  // Quick Links Helper Functions
  function loadQuickLinks() {
    try {
      const stored = localStorage.getItem(QUICK_LINKS_KEY);
      if (stored) {
        return Object.assign({}, DEFAULT_QUICK_LINKS, JSON.parse(stored));
      }
    } catch (e) {
      console.warn('LocalStorage Quick Links read failed:', e);
    }
    return DEFAULT_QUICK_LINKS;
  }

  function saveQuickLinks(links) {
    try {
      localStorage.setItem(QUICK_LINKS_KEY, JSON.stringify(links));
    } catch (e) {
      console.error('Failed to save quick links:', e);
    }
  }

  function renderQuickLinksUI() {
    const links = loadQuickLinks();
    const container = document.getElementById('quick-links-pills-container');
    if (!container) return;

    const linkDefinitions = [
      { key: 'mapUrl', label: '📍 Google 地圖導航', shortLabel: '📍', css: 'pill-map', title: 'Google Maps' },
      { key: 'lineUrl', label: '💬 LINE 官方帳號', shortLabel: '💬', css: 'pill-line', title: 'LINE' },
      { key: 'fbUrl', label: '📘 FB 粉絲專頁', shortLabel: '📘', css: 'pill-fb', title: 'Facebook' },
      { key: 'igUrl', label: '📷 Instagram', shortLabel: '📷', css: 'pill-ig', title: 'Instagram' },
      { key: 'ytUrl', label: '🎬 YouTube 影音', shortLabel: '🎬', css: 'pill-yt', title: 'YouTube' },
      { key: 'siteUrl', label: '🌐 萬家福品牌官網', shortLabel: '🌐', css: 'pill-site', title: '萬家福官網' }
    ].filter(item => safeExternalUrl(links[item.key]) !== '#');

    container.innerHTML = linkDefinitions.map(item => `
      <a href="${escapeHTML(safeExternalUrl(links[item.key]))}" target="_blank" rel="noopener" class="quick-link-pill ${item.css}">${item.label}</a>
    `).join('');

    // Also render footer social links
    const footerSocial = document.getElementById('footer-social-links');
    if (footerSocial) {
      footerSocial.innerHTML = linkDefinitions.map(item => `
        <a href="${escapeHTML(safeExternalUrl(links[item.key]))}" target="_blank" rel="noopener" class="footer-social-icon" title="${item.title}">${item.shortLabel}</a>
      `).join('');
    }
  }

  window.openQuickLinksModal = function () {
    if (!isAdminAuthenticated) {
      openModal('modal-admin-auth');
      showToast('🔒 請先輸入管理員密碼解鎖後台權限！', true);
      return;
    }

    const links = loadQuickLinks();
    document.getElementById('link-map').value = links.mapUrl || '';
    document.getElementById('link-line').value = links.lineUrl || '';
    document.getElementById('link-fb').value = links.fbUrl || '';
    document.getElementById('link-ig').value = links.igUrl || '';
    document.getElementById('link-yt').value = links.ytUrl || '';
    document.getElementById('link-site').value = links.siteUrl || '';

    openModal('modal-edit-quicklinks');
  };

  window.submitEditQuickLinks = async function (e) {
    e.preventDefault();
    if (!isAdminAuthenticated) {
      showToast('權限不足', true);
      return;
    }

    const newLinks = {
      mapUrl: document.getElementById('link-map').value.trim(),
      lineUrl: document.getElementById('link-line').value.trim(),
      fbUrl: document.getElementById('link-fb').value.trim(),
      igUrl: document.getElementById('link-ig').value.trim(),
      ytUrl: document.getElementById('link-yt').value.trim(),
      siteUrl: document.getElementById('link-site').value.trim()
    };

    try {
      await requestBackend('update_setting', { key: 'quickLinks', value: newLinks }, true);
      saveQuickLinks(newLinks);
    } catch (error) {
      showToast(error.message, true);
      return;
    }
    renderQuickLinksUI();
    closeModal('modal-edit-quicklinks');
    showToast('🌐 已成功更新萬家福五甲店 數位媒體與導航網址！');
  };

  async function requestBackend(action, payload = {}, requiresAdmin = false) {
    const headers = { 'Content-Type': 'application/json' };
    if (requiresAdmin && adminSessionToken) headers['X-Admin-Token'] = adminSessionToken;

    const body = Object.assign({ action }, payload);
    const response = await fetch('/api/events', { method: 'POST', headers, body: JSON.stringify(body) });
    const isJson = (response.headers.get('content-type') || '').includes('application/json');
    const result = isJson ? await response.json().catch(() => ({})) : {};
    if (!response.ok || result.success === false) {
      throw new Error(result.error || '伺服器暫時無法處理');
    }
    return result;
  }

  async function syncEventsFromBackend() {
    try {
      const headers = adminSessionToken ? { 'X-Admin-Token': adminSessionToken } : {};
      const response = await fetch('/api/events', { headers });
      if (!(response.headers.get('content-type') || '').includes('application/json')) return false;
      const data = await response.json();
      backendMode = data.mode || backendMode;
      if (isAdminAuthenticated && adminSessionToken && data.mode === 'database' && data.viewer !== 'admin') {
        sessionStorage.removeItem(ADMIN_TOKEN_KEY);
        sessionStorage.removeItem(ADMIN_DATA_KEY);
        isAdminAuthenticated = false;
        adminSessionToken = null;
        updateAdminNavUI();
        throw new Error('管理工作階段已失效');
      }
      if (data.settings?.quickLinks) {
        saveQuickLinks(Object.assign({}, DEFAULT_QUICK_LINKS, data.settings.quickLinks));
        renderQuickLinksUI();
      }
      if (data.settings?.hero) {
        saveHeroConfig(Object.assign({}, DEFAULT_HERO_CONFIG, data.settings.hero));
        renderHeroSpotlight();
        startCountdownTimers();
      }
      if (response.ok && Array.isArray(data.events) && (data.mode === 'database' || data.events.length > 0)) {
        saveEventsData(data.events);
        if (!activeEventId || !data.events.some(event => event.id === activeEventId)) {
          activeEventId = data.events[0]?.id || null;
        }
        renderEventsGrid();
        renderSidebarWidgets();
        if (isAdminAuthenticated) renderAdminDashboard();
        return true;
      }
      return false;
    } catch (error) {
      console.warn('Remote event sync unavailable:', error);
      return false;
    }
  }

  // REAL SERVER-SIDE AUTHENTICATION CHALLENGE
  async function checkAdminSession() {
    const savedToken = sessionStorage.getItem(ADMIN_TOKEN_KEY);
    if (!savedToken) {
      isAdminAuthenticated = false;
      adminSessionToken = null;
      sessionStorage.removeItem(ADMIN_DATA_KEY);
      updateAdminNavUI();
      return;
    }

    try {
      adminSessionToken = savedToken;
      const data = await requestBackend('verify_token', {}, true);
      if (data.success || data.isAdmin) {
        isAdminAuthenticated = true;
        adminSessionToken = savedToken;
      } else {
        isAdminAuthenticated = false;
        adminSessionToken = null;
        sessionStorage.removeItem(ADMIN_TOKEN_KEY);
      }
    } catch (e) {
      isAdminAuthenticated = false;
      adminSessionToken = null;
      sessionStorage.removeItem(ADMIN_TOKEN_KEY);
      sessionStorage.removeItem(ADMIN_DATA_KEY);
    }

    updateAdminNavUI();
  }

  function updateAdminNavUI() {
    const label = document.getElementById('admin-nav-label');
    if (label) {
      label.textContent = isAdminAuthenticated ? '🔓 五甲店後台' : '🔑 管理員驗證';
    }
    const editBtn = document.getElementById('quick-link-edit-btn');
    if (editBtn) {
      editBtn.classList.toggle('hidden', !isAdminAuthenticated);
    }
  }

  async function openAdminDashboard() {
    if (!isAdminAuthenticated) {
      openModal('modal-admin-auth');
      return;
    }
    const synced = await syncEventsFromBackend();
    if (!synced) {
      showToast('完整報名名單載入失敗，請確認網路後重試', true);
      if (!isAdminAuthenticated) openModal('modal-admin-auth');
      return;
    }
    switchView('admin');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  window.handleAdminTabClick = function () {
    if (isAdminAuthenticated) {
      openAdminDashboard();
    } else {
      openModal('modal-admin-auth');
    }
  };

  // REAL SERVER-SIDE PASSCODE VERIFICATION
  window.verifyAdminPasscode = async function (e) {
    e.preventDefault();
    const passcode = document.getElementById('admin-passcode-input').value.trim();
    const submitButton = e.submitter;
    if (submitButton) submitButton.disabled = true;

    try {
      const data = await requestBackend('verify_admin', { passcode });

      if (data.success || data.token) {
        const token = data.token;
        sessionStorage.setItem(ADMIN_TOKEN_KEY, token);
        sessionStorage.removeItem(ADMIN_DATA_KEY);
        adminSessionToken = token;
        isAdminAuthenticated = true;
        updateAdminNavUI();

        const synced = await syncEventsFromBackend();
        if (!synced) throw new Error('登入成功，但完整報名名單載入失敗，請重試');

        closeModal('modal-admin-auth');
        document.getElementById('admin-passcode-input').value = '';
        showToast('管理員登入成功');
        switchView('admin');
        return;
      }
    } catch (err) {
      showToast(err.message || '管理密碼不正確', true);
    } finally {
      if (submitButton) submitButton.disabled = false;
    }
  };

  window.lockAdminSession = function () {
    sessionStorage.removeItem(ADMIN_TOKEN_KEY);
    sessionStorage.removeItem(ADMIN_DATA_KEY);
    isAdminAuthenticated = false;
    adminSessionToken = null;
    updateAdminNavUI();
    showToast('🔒 五甲店管理員後台已鎖定登出');
    switchView('list');
  };

  // Helper Data Storage
  function loadEventsData() {
    try {
      if (isAdminAuthenticated) {
        const adminStored = sessionStorage.getItem(ADMIN_DATA_KEY);
        if (adminStored) {
          const adminParsed = JSON.parse(adminStored);
          if (Array.isArray(adminParsed.events)) return adminParsed.events;
        }
      }
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && Array.isArray(parsed.events)) {
          return parsed.events;
        }
      }
    } catch (e) {
      console.warn('LocalStorage access failed, using empty fallback:', e);
    }
    saveEventsData([]);
    return [];
  }

  function saveEventsData(events) {
    try {
      if (backendMode === 'database') {
        if (isAdminAuthenticated) sessionStorage.setItem(ADMIN_DATA_KEY, JSON.stringify({ events }));
        const sanitized = events.map(event => Object.assign({}, event, {
          registrations: (event.registrations || []).map(() => ({}))
        }));
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ events: sanitized }));
      } else {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ events }));
      }
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

  function validateEventTiming(date, startDate, endDate, currentRegistrationCount = 0, maxPeople = 1) {
    if (!date || !endDate) return '請設定活動日期與報名截止時間';
    const eventEnd = new Date(`${date}T23:59:59`).getTime();
    const start = startDate ? new Date(startDate).getTime() : null;
    const end = new Date(endDate).getTime();
    if (!Number.isFinite(end) || !Number.isFinite(eventEnd)) return '日期格式不正確';
    if (start && start >= end) return '報名截止時間必須晚於開放時間';
    if (end >= eventEnd) return '報名截止時間必須早於活動結束日';
    if (maxPeople < currentRegistrationCount) return `人數上限不可低於目前 ${currentRegistrationCount} 位報名者`;
    return '';
  }

  function safeImageUrl(value) {
    const raw = String(value || '').trim();
    if (raw.startsWith('data:image/')) return raw;
    try {
      const url = new URL(raw, window.location.href);
      return ['http:', 'https:'].includes(url.protocol) ? url.href : '';
    } catch (_error) {
      return '';
    }
  }

  function safeExternalUrl(value) {
    const raw = String(value || '').trim();
    if (!raw) return '#';
    try {
      const url = new URL(raw, window.location.href);
      return ['http:', 'https:'].includes(url.protocol) ? url.href : '#';
    } catch (_error) {
      return '#';
    }
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

    const navList = document.getElementById('nav-list');
    const navAdmin = document.getElementById('nav-admin');
    if (navList) { navList.classList.remove('active'); navList.setAttribute('aria-selected', 'false'); }
    if (navAdmin) { navAdmin.classList.remove('active'); navAdmin.setAttribute('aria-selected', 'false'); }

    if (viewName === 'list') {
      document.getElementById('view-list').classList.remove('hidden');
      if (navList) { navList.classList.add('active'); navList.setAttribute('aria-selected', 'true'); }
      renderEventsGrid();
      renderHeroSpotlight();
      renderSidebarWidgets();
      startCountdownTimers();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (viewName === 'admin') {
      if (!isAdminAuthenticated) {
        openModal('modal-admin-auth');
        return;
      }
      document.getElementById('view-admin').classList.remove('hidden');
      if (navAdmin) { navAdmin.classList.add('active'); navAdmin.setAttribute('aria-selected', 'true'); }
      renderAdminDashboard();
      window.scrollTo({ top: 0, behavior: 'auto' });
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

  // DYNAMIC CATEGORIES RENDERER
  function renderCategoryPills() {
    const events = loadEventsData();
    const pillsContainer = document.getElementById('category-pills');
    if (!pillsContainer) return;

    // Collect unique category names from events
    const categoriesSet = new Set();
    events.forEach(ev => {
      if (ev.category && ev.category.trim()) {
        categoriesSet.add(ev.category.trim());
      }
    });

    const uniqueCategories = Array.from(categoriesSet);

    pillsContainer.innerHTML = `
      <button class="pill-btn ${selectedCategory === 'all' ? 'active' : ''}" onclick="filterByCategory('all')">全部</button>
      <button class="pill-btn ${selectedCategory === 'available' ? 'active' : ''}" onclick="filterByCategory('available')">🔥 可報名</button>
      ${uniqueCategories.map(cat => `
        <button class="pill-btn ${selectedCategory === cat ? 'active' : ''}" data-category="${escapeHTML(cat)}" onclick="filterByCategory(this.dataset.category)">
          ${escapeHTML(cat)}
        </button>
      `).join('')}
    `;
  }

  // Filter & Search
  window.filterByCategory = function (category) {
    selectedCategory = category;
    renderCategoryPills();
    renderEventsGrid();
  };

  window.handleSearchInput = function (e) {
    searchQuery = e.target.value.toLowerCase().trim();
    renderEventsGrid();
  };

  // Render Events Grid Wall
  function renderEventsGrid() {
    renderCategoryPills();

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
        (ev.category && ev.category.toLowerCase().includes(searchQuery)) ||
        (ev.description && ev.description.toLowerCase().includes(searchQuery)) ||
        (ev.customBadge && ev.customBadge.toLowerCase().includes(searchQuery)) ||
        (ev.location && ev.location.toLowerCase().includes(searchQuery))
      );
    }

    countLabel.textContent = `共 ${filtered.length} 個活動`;

    if (filtered.length === 0) {
      const hasEvents = events.length > 0;
      container.innerHTML = `
        <div class="empty-state-view">
          <div class="empty-state-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
          </div>
          <h3 class="empty-state-title">${hasEvents ? '找不到符合條件的五甲店活動' : '目前尚無可報名活動'}</h3>
          <p class="empty-state-subtitle">${hasEvents ? '請嘗試搜尋其他關鍵字或變更分類標籤' : '新活動上架後會立即顯示在這裡'}</p>
        </div>
      `;
      return;
    }

    container.innerHTML = filtered.map(ev => {
      const regCount = ev.registrations ? ev.registrations.length : 0;
      const status = getStatus(regCount, ev.maxPeople, ev.startDate, ev.endDate);
      const maxPeople = Math.max(Number(ev.maxPeople) || 1, 1);
      const pct = Math.min((regCount / maxPeople) * 100, 100).toFixed(0);
      const categoryTag = ev.category || '活動';
      const customTag = ev.customBadge ? `<span class="sf-badge badge-custom">${escapeHTML(ev.customBadge)}</span>` : '';
      const priceText = ev.priceTier || '免費活動';

      return `
        <article class="event-card" data-event-id="${escapeHTML(ev.id)}" onclick="openEventDetail(this.dataset.eventId)" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();openEventDetail(this.dataset.eventId)}" role="button" tabindex="0" aria-label="查看活動：${escapeHTML(ev.name)}">
          <div class="card-media" style="background-image: url(&quot;${escapeHTML(safeImageUrl(ev.image))}&quot;)">
            <div class="card-badges">
              <span class="sf-badge badge-status-${status.type}">${status.label}</span>
              <div style="display:flex; gap:4px;">
                ${customTag}
                <span class="sf-badge badge-category">${escapeHTML(categoryTag)}</span>
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
            <div class="card-location-row"><span aria-hidden="true">⌖</span>${escapeHTML(ev.location || '萬家福五甲店')}</div>
            <div class="progress-block">
              <div class="progress-header">
                <span class="progress-label">名額進度</span>
                <span class="progress-value">${regCount} / ${maxPeople} 人 (${pct}%)</span>
              </div>
              <div class="progress-track">
                <div class="progress-fill" style="width: ${pct}%; background: ${status.color};"></div>
              </div>
            </div>
          </div>
          <div class="card-countdown-bar" data-end="${ev.endDate || ''}"><span class="countdown-text">⏳ 計算中...</span></div>
        </article>
      `;
    }).join('');
  }

  // Modals
  window.openModal = function (modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      lastFocusedElement = document.activeElement;
      modal.classList.add('active');
      document.body.classList.add('modal-open');
      const focusTarget = modal.querySelector('input:not([type="hidden"]), select, textarea, button');
      if (focusTarget) requestAnimationFrame(() => focusTarget.focus());
    }
  };

  window.closeModal = function (modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('active');
      if (!document.querySelector('.sf-modal-backdrop.active')) document.body.classList.remove('modal-open');
      if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') lastFocusedElement.focus();
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
    document.getElementById('edit-event-category').value = ev.category || '體驗試吃';
    document.getElementById('edit-event-date').value = ev.date || '';
    document.getElementById('edit-event-start-time').value = ev.startDate || '';
    document.getElementById('edit-event-end-time').value = ev.endDate || '';
    document.getElementById('edit-event-desc').value = ev.description || '';
    document.getElementById('edit-event-location').value = ev.location || '';
    document.getElementById('edit-event-price-tier').value = ev.priceTier || '';
    document.getElementById('edit-event-custom-badge').value = ev.customBadge || '';
    document.getElementById('edit-event-max').value = ev.maxPeople || 50;
    document.getElementById('edit-event-img-url').value = ev.image || '';
    document.getElementById('edit-event-img-file').value = '';
    editEventFilePreviewDataUrl = null;
    switchEditEventUploadMethod('url');
    const imagePreview = document.getElementById('edit-event-image-preview');
    if (ev.image) {
      imagePreview.style.backgroundImage = `url('${ev.image}')`;
      imagePreview.classList.remove('hidden');
    } else {
      imagePreview.classList.add('hidden');
    }
    editBuilderQuestions = JSON.parse(JSON.stringify(ev.customQuestions || []));
    renderEditQuestionnaireBuilder();
    updateEditDateFeedback();

    openModal('modal-edit-event');
  };

  window.submitEditEvent = async function (e) {
    e.preventDefault();
    if (!isAdminAuthenticated) {
      showToast('權限不足', true);
      return;
    }

    const events = loadEventsData();
    const ev = events.find(e => e.id === activeEventId);
    if (!ev) return;

    const name = document.getElementById('edit-event-name').value.trim();
    const category = document.getElementById('edit-event-category').value.trim();
    const date = document.getElementById('edit-event-date').value;
    const startDate = document.getElementById('edit-event-start-time').value;
    const endDate = document.getElementById('edit-event-end-time').value;
    const desc = document.getElementById('edit-event-desc').value.trim();
    const location = document.getElementById('edit-event-location').value.trim();
    const priceTier = document.getElementById('edit-event-price-tier').value.trim();
    const customBadge = document.getElementById('edit-event-custom-badge').value.trim();
    const maxPeople = parseInt(document.getElementById('edit-event-max').value, 10);
    let image = ev.image;
    if (editEventUploadMethod === 'file' && editEventFilePreviewDataUrl) {
      image = editEventFilePreviewDataUrl;
    } else if (editEventUploadMethod === 'url') {
      image = document.getElementById('edit-event-img-url').value.trim() || ev.image;
    }

    if (!name || !category || !date || !endDate || !maxPeople || maxPeople < 1) {
      showToast('請填寫完整必填欄位、自訂分類與報名截止時間', true);
      return;
    }
    const timingError = validateEventTiming(date, startDate, endDate, ev.registrations.length, maxPeople);
    if (timingError) {
      showToast(timingError, true);
      updateEditDateFeedback();
      return;
    }
    const questionError = validateQuestions(editBuilderQuestions);
    if (questionError) {
      showToast(questionError, true);
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
    ev.customQuestions = JSON.parse(JSON.stringify(editBuilderQuestions));

    const submitButton = e.submitter;
    if (submitButton) submitButton.disabled = true;
    try {
      await requestBackend('update_event', { event: ev }, true);
      saveEventsData(events);
    } catch (error) {
      showToast(error.message, true);
      if (submitButton) submitButton.disabled = false;
      return;
    }

    closeModal('modal-edit-event');
    showToast(`✏️ 已成功更新『${name}』活動設定！`);
    renderAdminDashboard();
    renderEventsGrid();
    if (submitButton) submitButton.disabled = false;
  };

  window.openEventDetail = function (eventId) {
    const events = loadEventsData();
    const ev = events.find(e => e.id === eventId);
    if (!ev) return;

    activeEventId = eventId;
    const regCount = ev.registrations ? ev.registrations.length : 0;
    const status = getStatus(regCount, ev.maxPeople, ev.startDate, ev.endDate);
    const pct = Math.min((regCount / ev.maxPeople) * 100, 100).toFixed(0);

    document.getElementById('sheet-image-bg').style.backgroundImage = `url("${safeImageUrl(ev.image)}")`;
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
  window.submitRegistration = async function (e) {
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
    const attendeePhone = document.getElementById('reg-phone').value.replace(/\D/g, '');
    const attendeeEmail = document.getElementById('reg-email').value.trim();

    if (!attendeeName || !attendeePhone) {
      showToast('請填寫參加者姓名與聯絡電話', true);
      return;
    }
    if (!/^09\d{8}$/.test(attendeePhone)) {
      showToast('請輸入有效的台灣手機號碼（09 開頭共 10 碼）', true);
      return;
    }

    if (isProxy && (!proxyName || !proxyEmail)) {
      showToast('請填寫代報人姓名與 Email', true);
      return;
    }

    const existingIndex = ev.registrations.findIndex(r => String(r.phone || '').replace(/\D/g, '') === attendeePhone);
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

    const registration = {
      name: attendeeName,
      email: attendeeEmail,
      phone: attendeePhone,
      isProxy,
      proxyName,
      proxyEmail,
      answers,
      checkedIn: false,
      registeredAt: Date.now()
    };

    const submitButton = document.getElementById('reg-submit-btn');
    submitButton.disabled = true;
    submitButton.textContent = '正在確認名額...';
    try {
      const result = await requestBackend('register', {
        eventId: ev.id, attendeeName, attendeePhone, attendeeEmail,
        isProxy, proxyName, proxyEmail, answers,
        website: document.getElementById('reg-website').value
      });
      if (result.registrationId) registration.id = result.registrationId;
      ev.registrations.push(registration);
      saveEventsData(events);
    } catch (error) {
      showToast(error.message, true);
      submitButton.disabled = false;
      submitButton.textContent = '確認送出報名';
      return;
    }

    document.getElementById('voucher-event-name').textContent = ev.name;
    document.getElementById('voucher-attendee-info').textContent = `參加者：${attendeeName} ｜ 電話：${attendeePhone}`;
    document.getElementById('voucher-date-location').textContent = `地點：${ev.location || '萬家福五甲店 現場'}`;

    closeModal('modal-register-form');
    openModal('modal-success');
    renderEventsGrid();
    submitButton.disabled = false;
    submitButton.textContent = '確認送出報名';
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

  window.submitOnsiteRegistration = async function (e) {
    e.preventDefault();
    if (!isAdminAuthenticated) {
      showToast('權限不足', true);
      return;
    }

    const eventId = document.getElementById('onsite-event-selector').value;
    const name = document.getElementById('onsite-name').value.trim();
    const phone = document.getElementById('onsite-phone').value.replace(/\D/g, '');
    const autoCheckin = document.getElementById('onsite-auto-checkin').checked;

    if (!eventId || !name || !/^09\d{8}$/.test(phone)) {
      showToast('請填寫姓名與有效的台灣手機號碼', true);
      return;
    }

    const events = loadEventsData();
    const ev = events.find(e => e.id === eventId);
    if (!ev) return;
    const status = getStatus(ev.registrations.length, ev.maxPeople, ev.startDate, ev.endDate);
    if (!status.allowRegister) {
      showToast(`無法報名：${status.label}`, true);
      return;
    }
    if (ev.registrations.some(registration => String(registration.phone || '').replace(/\D/g, '') === phone)) {
      showToast('此電話號碼已報名過本活動', true);
      return;
    }

    const registration = {
      name,
      email: '',
      phone,
      isProxy: false,
      answers: {},
      checkedIn: autoCheckin,
      registeredAt: Date.now()
    };

    try {
      const result = await requestBackend('register', {
        eventId, attendeeName: name, attendeePhone: phone, attendeeEmail: '', answers: {}
      });
      if (result.registrationId) registration.id = result.registrationId;
      if (autoCheckin && result.registrationId) {
        await requestBackend('set_checkin', { eventId, registrationId: result.registrationId, checkedIn: true }, true);
      }
      ev.registrations.push(registration);
      saveEventsData(events);
    } catch (error) {
      showToast(error.message, true);
      return;
    }

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

    const startDate = ev.date || new Date().toISOString().slice(0, 10);
    const endDate = new Date(`${startDate}T12:00:00+08:00`);
    endDate.setDate(endDate.getDate() + 1);
    const startStr = startDate.replace(/-/g, '');
    const endStr = `${endDate.getFullYear()}${String(endDate.getMonth() + 1).padStart(2, '0')}${String(endDate.getDate()).padStart(2, '0')}`;
    const escapeICS = value => String(value || '').replace(/\\/g, '\\\\').replace(/([,;])/g, '\\$1').replace(/\r?\n/g, '\\n');

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Apple Native SwiftUI Event System//TW',
      'BEGIN:VEVENT',
      `UID:event-${ev.id}@wgapptw.pages.dev`,
      `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')}`,
      `DTSTART;VALUE=DATE:${startStr}`,
      `DTEND;VALUE=DATE:${endStr}`,
      `SUMMARY:${escapeICS(ev.name)}`,
      `DESCRIPTION:${escapeICS(ev.description)}`,
      `LOCATION:${escapeICS(ev.location)}`,
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    const objectUrl = window.URL.createObjectURL(blob);
    link.href = objectUrl;
    link.setAttribute('download', `${ev.name.replace(/\s+/g, '_')}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(objectUrl);
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

  window.updateQuestionnaireField = function (index, key, value, editMode = false) {
    const questions = editMode ? editBuilderQuestions : builderQuestions;
    if (!questions[index]) return;
    questions[index][key] = key === 'required' ? Boolean(value) : String(value).trim();
    if (key === 'type') {
      if ((value === 'select' || value === 'checkbox') && !questions[index].options) questions[index].options = '選項 A, 選項 B';
      editMode ? renderEditQuestionnaireBuilder() : renderQuestionnaireBuilder();
    }
    updateCreateReadiness();
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
            <input type="text" class="sf-input" value="${escapeHTML(q.title)}" placeholder="例如：飲食習慣需求" onchange="updateQuestionnaireField(${i},'title',this.value)">
          </div>
          <div class="field-group">
            <label class="field-label">題型</label>
            <select class="sf-select" onchange="updateQuestionnaireField(${i},'type',this.value)">
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
            <input type="text" class="sf-input" value="${escapeHTML(q.options || '')}" placeholder="例如：葷食, 素食(蛋奶素), 全素" onchange="updateQuestionnaireField(${i},'options',this.value)">
          </div>
        ` : ''}

        <label class="checkbox-row" style="margin-top:2px;">
          <input type="checkbox" ${q.required ? 'checked' : ''} onchange="updateQuestionnaireField(${i},'required',this.checked)">
          <span>將此題目設為必填 (勾選必填，取消勾選則為選填)</span>
        </label>
      </div>
    `).join('');
  }

  window.addEditQuestionnaireField = function () {
    editBuilderQuestions.push({ id: `q_${Date.now().toString(36)}`, title: '', type: 'text', options: '', required: false });
    renderEditQuestionnaireBuilder();
  };

  window.removeEditQuestionnaireField = function (index) {
    editBuilderQuestions.splice(index, 1);
    renderEditQuestionnaireBuilder();
  };

  function renderEditQuestionnaireBuilder() {
    const container = document.getElementById('edit-questionnaire-builder-container');
    if (!container) return;
    if (!editBuilderQuestions.length) {
      container.innerHTML = '<div class="questionnaire-empty">目前沒有自訂題目</div>';
      return;
    }
    container.innerHTML = editBuilderQuestions.map((q, i) => `
      <div class="question-item-card compact-question-item">
        <div class="question-item-header"><strong>題目 ${i + 1}</strong><button type="button" class="btn-text-danger" onclick="removeEditQuestionnaireField(${i})">刪除</button></div>
        <div class="form-row-2">
          <div class="field-group"><label class="field-label">題目名稱</label><input class="sf-input" value="${escapeHTML(q.title)}" onchange="updateQuestionnaireField(${i},'title',this.value,true)"></div>
          <div class="field-group"><label class="field-label">題型</label><select class="sf-select" onchange="updateQuestionnaireField(${i},'type',this.value,true)">
            <option value="text" ${q.type === 'text' ? 'selected' : ''}>單行文字</option>
            <option value="textarea" ${q.type === 'textarea' ? 'selected' : ''}>多行文字</option>
            <option value="select" ${q.type === 'select' ? 'selected' : ''}>單選</option>
            <option value="checkbox" ${q.type === 'checkbox' ? 'selected' : ''}>多選</option>
          </select></div>
        </div>
        ${(q.type === 'select' || q.type === 'checkbox') ? `<div class="field-group"><label class="field-label">選項（以逗號分隔）</label><input class="sf-input" value="${escapeHTML(q.options || '')}" onchange="updateQuestionnaireField(${i},'options',this.value,true)"></div>` : ''}
        <label class="checkbox-row"><input type="checkbox" ${q.required ? 'checked' : ''} onchange="updateQuestionnaireField(${i},'required',this.checked,true)"><span>必填題目</span></label>
      </div>
    `).join('');
  }

  function validateQuestions(questions) {
    for (let index = 0; index < questions.length; index += 1) {
      const question = questions[index];
      if (!String(question.title || '').trim()) return `請填寫第 ${index + 1} 題的題目名稱`;
      if ((question.type === 'select' || question.type === 'checkbox') && !String(question.options || '').split(',').some(option => option.trim())) {
        return `請設定第 ${index + 1} 題的選項`;
      }
    }
    return '';
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

  window.handleFileSelect = async function (e) {
    const file = e.target.files[0];
    if (!file) return;
    try {
      filePreviewDataUrl = await optimizeImageFile(file);
      const preview = document.getElementById('image-preview');
      preview.style.backgroundImage = `url('${filePreviewDataUrl}')`;
      preview.classList.remove('hidden');
    } catch (error) {
      showToast(error.message, true);
      e.target.value = '';
    }
  };

  window.switchEditEventUploadMethod = function (method) {
    editEventUploadMethod = method;
    document.getElementById('edit-event-tab-url').classList.toggle('active', method === 'url');
    document.getElementById('edit-event-tab-file').classList.toggle('active', method === 'file');
    document.getElementById('edit-event-upload-url-block').classList.toggle('hidden', method !== 'url');
    document.getElementById('edit-event-upload-file-block').classList.toggle('hidden', method !== 'file');
  };

  window.handleEditEventImageUrlChange = function (e) {
    const url = e.target.value.trim();
    const preview = document.getElementById('edit-event-image-preview');
    if (url) {
      preview.style.backgroundImage = `url('${url}')`;
      preview.classList.remove('hidden');
    } else {
      preview.classList.add('hidden');
    }
  };

  window.handleEditEventFileSelect = async function (e) {
    const file = e.target.files[0];
    if (!file) return;
    try {
      editEventFilePreviewDataUrl = await optimizeImageFile(file);
      const preview = document.getElementById('edit-event-image-preview');
      preview.style.backgroundImage = `url('${editEventFilePreviewDataUrl}')`;
      preview.classList.remove('hidden');
      showToast('圖片讀取成功，儲存後將更新活動封面');
    } catch (error) {
      showToast(error.message, true);
      e.target.value = '';
    }
  };

  function optimizeImageFile(file) {
    if (!file.type.startsWith('image/')) return Promise.reject(new Error('請選擇圖片檔案'));
    if (file.size > 12 * 1024 * 1024) return Promise.reject(new Error('圖片不可超過 12 MB'));
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('圖片讀取失敗'));
      reader.onload = () => {
        const image = new Image();
        image.onerror = () => reject(new Error('圖片格式無法使用'));
        image.onload = () => {
          const maxDimension = 1600;
          const scale = Math.min(1, maxDimension / Math.max(image.naturalWidth, image.naturalHeight));
          let canvas = document.createElement('canvas');
          canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
          canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));

          const drawImage = (target, source) => {
            const context = target.getContext('2d');
            context.fillStyle = '#fff';
            context.fillRect(0, 0, target.width, target.height);
            context.drawImage(source, 0, 0, target.width, target.height);
          };
          drawImage(canvas, image);

          const maxDataUrlLength = 950000;
          let quality = 0.82;
          let output = canvas.toDataURL('image/jpeg', quality);
          while (output.length > maxDataUrlLength && quality > 0.5) {
            quality -= 0.08;
            output = canvas.toDataURL('image/jpeg', quality);
          }
          while (output.length > maxDataUrlLength && Math.max(canvas.width, canvas.height) > 720) {
            const resized = document.createElement('canvas');
            resized.width = Math.max(1, Math.round(canvas.width * 0.82));
            resized.height = Math.max(1, Math.round(canvas.height * 0.82));
            drawImage(resized, canvas);
            canvas = resized;
            output = canvas.toDataURL('image/jpeg', 0.68);
          }
          if (output.length > maxDataUrlLength) {
            reject(new Error('圖片內容過於複雜，請改用較小的圖片'));
            return;
          }
          resolve(output);
        };
        image.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  // Create New Event
  window.submitCreateEvent = async function (e) {
    e.preventDefault();
    if (!isAdminAuthenticated) {
      showToast('權限不足：需要管理員驗證', true);
      return;
    }

    const name = document.getElementById('event-name').value.trim();
    const category = document.getElementById('event-category').value.trim();
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

    if (!name || !category || !date || !endDate || !maxPeople || maxPeople < 1) {
      showToast('請填寫完整必填欄位、自訂分類與報名截止時間', true);
      return;
    }
    const timingError = validateEventTiming(date, startDate, endDate, 0, maxPeople);
    if (timingError) {
      showToast(timingError, true);
      updateCreateReadiness();
      return;
    }
    const questionError = validateQuestions(builderQuestions);
    if (questionError) {
      showToast(questionError, true);
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

    const submitButton = e.submitter;
    if (submitButton) submitButton.disabled = true;
    try {
      await requestBackend('create_event', { event: newEvent }, true);
      events.unshift(newEvent);
      saveEventsData(events);
    } catch (error) {
      showToast(error.message, true);
      if (submitButton) submitButton.disabled = false;
      return;
    }

    document.getElementById('create-event-form').reset();
    document.getElementById('image-preview').classList.add('hidden');
    filePreviewDataUrl = null;
    builderQuestions = [];
    renderQuestionnaireBuilder();

    showToast('🎉 萬家福五甲店 新活動發布成功！');
    switchAdminSubView('manage');
    renderEventsGrid();
    updateCreateReadiness();
    if (submitButton) submitButton.disabled = false;
  };

  function updateCreateReadiness() {
    const date = document.getElementById('event-date')?.value || '';
    const start = document.getElementById('event-start-time')?.value || '';
    const end = document.getElementById('event-end-time')?.value || '';
    const max = Number(document.getElementById('event-max')?.value || 0);
    const timingError = validateEventTiming(date, start, end, 0, max || 1);
    const requiredReady = Boolean(document.getElementById('event-name')?.value.trim() && document.getElementById('event-category')?.value.trim() && max > 0);
    const questionError = validateQuestions(builderQuestions);
    const feedback = document.getElementById('create-date-feedback');
    const readiness = document.getElementById('create-event-readiness');
    if (feedback) {
      feedback.textContent = timingError || '報名期間設定正確';
      feedback.classList.toggle('is-valid', !timingError);
    }
    if (readiness) {
      const ready = requiredReady && !timingError && !questionError;
      readiness.textContent = ready ? '可以發布' : '尚未完成必填設定';
      readiness.classList.toggle('is-ready', ready);
    }
  }

  function updateEditDateFeedback() {
    const events = loadEventsData();
    const event = events.find(item => item.id === activeEventId);
    const error = validateEventTiming(
      document.getElementById('edit-event-date')?.value || '',
      document.getElementById('edit-event-start-time')?.value || '',
      document.getElementById('edit-event-end-time')?.value || '',
      event?.registrations?.length || 0,
      Number(document.getElementById('edit-event-max')?.value || 0)
    );
    const feedback = document.getElementById('edit-date-feedback');
    if (feedback) {
      feedback.textContent = error || '活動時間與名額設定正確';
      feedback.classList.toggle('is-valid', !error);
    }
  }

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

    if (ev.registrations.some(registration => !registration?.id || !registration?.name || !registration?.phone)) {
      detailContainer.innerHTML = '<p>活動資料已載入，正在等待完整報名名單。</p>';
      regContainer.innerHTML = `
        <div class="empty-state-view">
          <h3 class="empty-state-title">完整名單尚未載入</h3>
          <p class="empty-state-subtitle">系統不會以空白欄位取代姓名與電話，請重新同步資料。</p>
          <button class="btn-system-primary" onclick="refreshAdminData(event)">↻ 重新整理完整名單</button>
        </div>
      `;
      if (statBadge) statBadge.textContent = `報名 ${ev.registrations.length} 人`;
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
                <th>操作</th>
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
                    <td>
                      <button class="btn-registration-delete" type="button"
                        data-event-id="${escapeHTML(ev.id)}" data-registration-index="${i}"
                        onclick="deleteRegistration(this.dataset.eventId, Number(this.dataset.registrationIndex), this)"
                        aria-label="取消 ${escapeHTML(r.name)} 的報名">取消報名</button>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      `;
    }
  }

  window.toggleCheckInStatus = async function (eventId, regIndex) {
    if (!isAdminAuthenticated) return;
    const events = loadEventsData();
    const ev = events.find(e => e.id === eventId);
    if (!ev || !ev.registrations[regIndex]) return;

    const registration = ev.registrations[regIndex];
    const nextValue = !registration.checkedIn;
    try {
      if (registration.id) {
        await requestBackend('set_checkin', { eventId, registrationId: registration.id, checkedIn: nextValue }, true);
      }
      registration.checkedIn = nextValue;
      saveEventsData(events);
    } catch (error) {
      showToast(error.message, true);
      return;
    }

    const statusStr = ev.registrations[regIndex].checkedIn ? '已成功標記簽到' : '已取消簽到狀態';
    showToast(statusStr);
    renderAdminRegistrations();
  };

  window.deleteRegistration = async function (eventId, regIndex, button) {
    if (!isAdminAuthenticated) {
      showToast('權限不足', true);
      return;
    }

    const events = loadEventsData();
    const ev = events.find(event => event.id === eventId);
    const registration = ev?.registrations?.[regIndex];
    if (!ev || !registration?.id) {
      showToast('找不到可取消的報名紀錄，請先重新整理名單', true);
      return;
    }

    const confirmed = window.confirm(`確定要取消「${registration.name}」的報名嗎？\n刪除後會立即釋放名額，且無法復原。`);
    if (!confirmed) return;

    if (button) button.disabled = true;
    try {
      await requestBackend('delete_registration', {
        eventId: ev.id,
        registrationId: registration.id
      }, true);
      ev.registrations.splice(regIndex, 1);
      saveEventsData(events);
      showToast(`已取消 ${registration.name} 的報名並釋放名額`);
      renderAdminDashboard();
      renderEventsGrid();
      renderSidebarWidgets();
    } catch (error) {
      showToast(error.message, true);
    } finally {
      if (button?.isConnected) button.disabled = false;
    }
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
    if (ev.registrations.some(registration => !registration?.id || !registration?.name || !registration?.phone)) {
      showToast('完整名單尚未載入，請先重新整理名單', true);
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
    const objectUrl = URL.createObjectURL(blob);
    link.href = objectUrl;
    link.setAttribute('download', `${ev.name}_報名名單.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(objectUrl);

    showToast('📊 UTF-8 CSV 報名名單導出成功！');
  };

  window.deleteActiveEvent = async function () {
    if (!isAdminAuthenticated) {
      showToast('權限不足', true);
      return;
    }
    if (!activeEventId) return;
    if (!confirm('確定要刪除此活動嗎？刪除後無法復原。')) return;

    let events = loadEventsData();
    try {
      await requestBackend('delete_event', { eventId: activeEventId }, true);
    } catch (error) {
      showToast(error.message, true);
      return;
    }
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

  // HERO SPOTLIGHT - Standalone Banner (獨立促銷/活動看板，可由管理員自訂編輯)
  function loadHeroConfig() {
    try {
      const stored = localStorage.getItem(HERO_CONFIG_KEY);
      if (stored) {
        return Object.assign({}, DEFAULT_HERO_CONFIG, JSON.parse(stored));
      }
    } catch (e) {
      console.warn('LocalStorage Hero Config read failed:', e);
    }
    return DEFAULT_HERO_CONFIG;
  }

  function saveHeroConfig(config) {
    try {
      localStorage.setItem(HERO_CONFIG_KEY, JSON.stringify(config));
    } catch (e) {
      console.error('Failed to save Hero Config:', e);
    }
  }

  function renderHeroSpotlight() {
    const container = document.getElementById('hero-spotlight');
    if (!container) return;

    const hero = loadHeroConfig();
    container.innerHTML = `
      <div class="hero-poster-wrapper">
        <!-- Top Poster Box: 100% Pure Image, No Text Overlay, 4:1 Aspect Ratio -->
        <div class="hero-poster-box">
          <img src="${escapeHTML(safeImageUrl(hero.bgImage))}" alt="${escapeHTML(hero.title)}" class="hero-poster-img">
        </div>

        <!-- Below-Poster Action Card (Title, Live Countdown Timer, CTA Button) -->
        <div class="hero-action-card">
          <div class="hero-action-info">
            <div class="hero-badges">
              <span class="sf-badge badge-status-open">🔥 門市焦點</span>
              ${hero.badge ? `<span class="sf-badge badge-custom">${escapeHTML(hero.badge)}</span>` : ''}
            </div>
            <h2 class="hero-action-title">${escapeHTML(hero.title)}</h2>
            ${hero.description ? `<p class="hero-action-desc">${escapeHTML(hero.description)}</p>` : ''}
          </div>

          <div class="hero-action-right">
            ${hero.countdownEnabled !== false ? `
              <div class="hero-countdown-block">
                <span class="countdown-label-top">計算活動時間</span>
                <div class="hero-countdown" id="hero-countdown" data-start="${escapeHTML(hero.startDate || '')}" data-end="${escapeHTML(hero.endDate || '')}">
                  <div class="countdown-unit"><span class="countdown-num" id="hero-days">--</span><span class="countdown-label">天</span></div>
                  <div class="countdown-unit"><span class="countdown-num" id="hero-hours">--</span><span class="countdown-label">時</span></div>
                  <div class="countdown-unit"><span class="countdown-num" id="hero-mins">--</span><span class="countdown-label">分</span></div>
                  <div class="countdown-unit"><span class="countdown-num" id="hero-secs">--</span><span class="countdown-label">秒</span></div>
                </div>
              </div>
            ` : ''}

            <button class="btn-hero-cta" data-url="${escapeHTML(safeExternalUrl(hero.buttonUrl))}" onclick="openHeroLink(this.dataset.url)">
              ${escapeHTML(hero.buttonText || '查看五甲店活動詳情 →')}
            </button>
          </div>
        </div>
      </div>
    `;
  }

  window.openHeroLink = function (url) {
    const safeUrl = safeExternalUrl(url);
    if (safeUrl === '#') return;
    const parsed = new URL(safeUrl);
    if (parsed.origin === window.location.origin && parsed.hash) {
      document.querySelector(parsed.hash)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    window.open(safeUrl, '_blank', 'noopener');
  };

  // HERO IMAGE UPLOAD HANDLERS
  let heroUploadMethod = 'url';
  let heroFilePreviewDataUrl = null;

  window.switchHeroUploadMethod = function (method) {
    heroUploadMethod = method;
    const tabUrl = document.getElementById('hero-tab-url');
    const tabFile = document.getElementById('hero-tab-file');
    const blockUrl = document.getElementById('hero-upload-url-block');
    const blockFile = document.getElementById('hero-upload-file-block');

    if (tabUrl) tabUrl.classList.toggle('active', method === 'url');
    if (tabFile) tabFile.classList.toggle('active', method === 'file');
    if (blockUrl) blockUrl.classList.toggle('hidden', method !== 'url');
    if (blockFile) blockFile.classList.toggle('hidden', method !== 'file');
  };

  window.handleHeroImageUrlChange = function (e) {
    const url = e.target.value.trim();
    const preview = document.getElementById('hero-image-preview');
    if (url && preview) {
      preview.style.backgroundImage = `url('${url}')`;
      preview.classList.remove('hidden');
    } else if (preview) {
      preview.classList.add('hidden');
    }
  };

  window.handleHeroFileSelect = async function (e) {
    const file = e.target.files[0];
    if (!file) return;

    try {
      heroFilePreviewDataUrl = await optimizeImageFile(file);
      const preview = document.getElementById('hero-image-preview');
      if (preview) {
        preview.style.backgroundImage = `url('${heroFilePreviewDataUrl}')`;
        preview.classList.remove('hidden');
      }
      showToast('📸 圖片讀取成功！已設定為 Hero 看板圖');
    } catch (error) {
      showToast(error.message, true);
      e.target.value = '';
    }
  };

  window.openHeroConfigModal = function () {
    if (!isAdminAuthenticated) {
      openModal('modal-admin-auth');
      showToast('🔒 請先輸入管理員密碼解鎖後台權限！', true);
      return;
    }

    const hero = loadHeroConfig();
    document.getElementById('hero-input-title').value = hero.title || '';
    document.getElementById('hero-input-desc').value = hero.description || '';
    document.getElementById('hero-input-badge').value = hero.badge || '';
    document.getElementById('hero-input-startdate').value = hero.startDate || '';
    document.getElementById('hero-input-enddate').value = hero.endDate || '';
    document.getElementById('hero-input-countdown-enabled').checked = hero.countdownEnabled !== false;
    document.getElementById('hero-input-price').value = hero.priceText || '';
    document.getElementById('hero-input-location').value = hero.locationText || '';
    document.getElementById('hero-input-bg').value = hero.bgImage || '';
    document.getElementById('hero-input-btn-text').value = hero.buttonText || '';
    document.getElementById('hero-input-btn-url').value = hero.buttonUrl || '';
    document.getElementById('hero-input-file').value = '';
    heroFilePreviewDataUrl = null;

    // Show preview if image exists
    const preview = document.getElementById('hero-image-preview');
    if (hero.bgImage && preview) {
      preview.style.backgroundImage = `url('${hero.bgImage}')`;
      preview.classList.remove('hidden');
    }

    switchHeroUploadMethod('url');
    openModal('modal-edit-hero');
  };

  window.submitEditHeroConfig = async function (e) {
    e.preventDefault();
    if (!isAdminAuthenticated) {
      showToast('權限不足', true);
      return;
    }

    let finalBgImage = DEFAULT_HERO_CONFIG.bgImage;
    if (heroUploadMethod === 'file' && heroFilePreviewDataUrl) {
      finalBgImage = heroFilePreviewDataUrl;
    } else {
      const inputUrl = document.getElementById('hero-input-bg').value.trim();
      if (inputUrl) finalBgImage = inputUrl;
    }

    const startDate = document.getElementById('hero-input-startdate').value;
    const endDate = document.getElementById('hero-input-enddate').value;
    if (!startDate || !endDate || new Date(startDate).getTime() >= new Date(endDate).getTime()) {
      showToast('Hero 開始時間必須早於截止時間', true);
      return;
    }

    const newConfig = {
      title: document.getElementById('hero-input-title').value.trim(),
      description: document.getElementById('hero-input-desc').value.trim(),
      badge: document.getElementById('hero-input-badge').value.trim(),
      startDate,
      endDate,
      countdownEnabled: document.getElementById('hero-input-countdown-enabled').checked,
      priceText: document.getElementById('hero-input-price').value.trim(),
      locationText: document.getElementById('hero-input-location').value.trim(),
      bgImage: finalBgImage,
      buttonText: document.getElementById('hero-input-btn-text').value.trim(),
      buttonUrl: document.getElementById('hero-input-btn-url').value.trim()
    };

    try {
      await requestBackend('update_setting', { key: 'hero', value: newConfig }, true);
      saveHeroConfig(newConfig);
    } catch (error) {
      showToast(error.message, true);
      return;
    }
    renderHeroSpotlight();
    startCountdownTimers();
    closeModal('modal-edit-hero');
    showToast('🌟 已成功更新 Hero 頂部焦點看板！');
  };

  // SIDEBAR WIDGETS
  function renderSidebarWidgets() {
    const container = document.getElementById('sidebar-widgets');
    if (!container) return;

    const events = loadEventsData();
    const now = Date.now();
    let totalRegs = 0;
    let openCount = 0;
    events.forEach(ev => {
      totalRegs += ev.registrations ? ev.registrations.length : 0;
      const st = getStatus(ev.registrations ? ev.registrations.length : 0, ev.maxPeople, ev.startDate, ev.endDate);
      if (st.allowRegister) openCount++;
    });

    // Get next 4 upcoming events sorted by date
    const upcoming = [...events].sort((a, b) => new Date(a.date) - new Date(b.date)).slice(0, 4);

    container.innerHTML = `
      <div class="sidebar-widget">
        <h3 class="widget-title">📊 五甲店活動快報</h3>
        <div class="store-stats-grid">
          <div class="stat-item">
            <span class="stat-num">${events.length}</span>
            <span class="stat-label">活動總數</span>
          </div>
          <div class="stat-item">
            <span class="stat-num">${openCount}</span>
            <span class="stat-label">可報名</span>
          </div>
          <div class="stat-item">
            <span class="stat-num">${totalRegs}</span>
            <span class="stat-label">總報名人次</span>
          </div>
        </div>
      </div>

      <div class="sidebar-widget">
        <h3 class="widget-title">📅 近期活動時程</h3>
        <div class="upcoming-timeline">
          ${upcoming.map(ev => {
            const st = getStatus(ev.registrations ? ev.registrations.length : 0, ev.maxPeople, ev.startDate, ev.endDate);
            const d = new Date(ev.date);
            const month = d.getMonth() + 1;
            const day = d.getDate();
            return `
              <div class="timeline-item" onclick="openEventDetail('${ev.id}')">
                <div class="timeline-date-block">
                  <span class="timeline-month">${month}月</span>
                  <span class="timeline-day">${day}</span>
                </div>
                <div class="timeline-info">
                  <div class="timeline-event-name">${escapeHTML(ev.name)}</div>
                  <div class="timeline-event-meta">
                    <span class="sf-badge badge-status-${st.type}" style="font-size:10px; padding:2px 6px;">${st.label}</span>
                    <span>${ev.registrations ? ev.registrations.length : 0}/${ev.maxPeople}人</span>
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <div class="sidebar-widget">
        <h3 class="widget-title">🏬 關於萬家福五甲店</h3>
        <div class="store-about-text">
          <p>萬家福五甲店座落於高雄市鳳山區林森路，深耕在地逾 20 年，是陪伴社區家庭日常生活的一站式購物據點。店內匯集新鮮生鮮、食品飲料、進口商品、生活百貨、居家五金、家電與 3C 用品，滿足日常採買、居家修繕與生活所需。</p>
          <p style="margin-top:8px;">除了提供多元完整的商品選擇，我們也持續規劃會員回饋、料理教室、試吃體驗、親子手作及生活主題活動，期待以便利、實用又有溫度的服務，成為鄰里交流與家庭生活的好夥伴。</p>
        </div>
      </div>
    `;
  }

  // LIVE COUNTDOWN TIMERS on cards
  let countdownInterval = null;

  function startCountdownTimers() {
    if (countdownInterval) clearInterval(countdownInterval);

    function updateAllCountdowns() {
      const now = Date.now();

      // Update hero countdown
      const heroEl = document.getElementById('hero-countdown');
      if (heroEl) {
        const startStr = heroEl.getAttribute('data-start');
        const endStr = heroEl.getAttribute('data-end');
        if (endStr) {
          const startTime = startStr ? new Date(startStr).getTime() : 0;
          const endTime = new Date(endStr).getTime();
          const countdownTarget = startTime > now ? startTime : endTime;
          const diff = countdownTarget - now;
          const labelEl = heroEl.closest('.hero-countdown-block')?.querySelector('.countdown-label-top');
          if (labelEl) labelEl.textContent = startTime > now ? '距離開始' : (endTime > now ? '倒數截止' : '活動已結束');
          const valueIds = ['hero-days', 'hero-hours', 'hero-mins', 'hero-secs'];
          if (diff > 0) {
            const days = Math.floor(diff / 86400000);
            const hours = Math.floor((diff % 86400000) / 3600000);
            const mins = Math.floor((diff % 3600000) / 60000);
            const secs = Math.floor((diff % 60000) / 1000);
            const dEl = document.getElementById('hero-days');
            const hEl = document.getElementById('hero-hours');
            const mEl = document.getElementById('hero-mins');
            const sEl = document.getElementById('hero-secs');
            if (dEl) dEl.textContent = String(days).padStart(2, '0');
            if (hEl) hEl.textContent = String(hours).padStart(2, '0');
            if (mEl) mEl.textContent = String(mins).padStart(2, '0');
            if (sEl) sEl.textContent = String(secs).padStart(2, '0');
          } else {
            valueIds.forEach(id => {
              const valueEl = document.getElementById(id);
              if (valueEl) valueEl.textContent = '00';
            });
          }
        }
      }

      // Update card countdowns
      document.querySelectorAll('.card-countdown-bar').forEach(bar => {
        const endStr = bar.getAttribute('data-end');
        if (!endStr) return;
        const diff = new Date(endStr).getTime() - now;
        const textEl = bar.querySelector('.countdown-text');
        if (!textEl) return;
        if (diff <= 0) {
          textEl.textContent = '報名已截止';
          bar.classList.add('expired');
        } else {
          const days = Math.floor(diff / 86400000);
          const hours = Math.floor((diff % 86400000) / 3600000);
          const mins = Math.floor((diff % 3600000) / 60000);
          if (days > 0) {
            textEl.textContent = `⏳ 剩餘 ${days} 天 ${hours} 時 ${mins} 分`;
          } else {
            textEl.textContent = `⏳ 剩餘 ${hours} 時 ${mins} 分`;
          }
        }
      });
    }

    updateAllCountdowns();
    countdownInterval = setInterval(updateAllCountdowns, 1000);
  }

  // FOOTER ADMIN LOGIN
  window.refreshAdminData = async function (event) {
    const button = event?.currentTarget;
    if (button) button.disabled = true;
    const synced = await syncEventsFromBackend();
    if (button) button.disabled = false;
    showToast(synced ? '完整報名名單已更新' : '名單更新失敗，請確認網路後重試', !synced);
  };

  window.handleFooterAdminClick = function () {
    if (isAdminAuthenticated) {
      openAdminDashboard();
    } else {
      openModal('modal-admin-auth');
    }
  };

  // FOOTER YEAR
  function setFooterYear() {
    const el = document.getElementById('footer-year');
    if (el) el.textContent = new Date().getFullYear();
  }

  // Initialize
  document.addEventListener('DOMContentLoaded', async () => {
    localStorage.removeItem(LEGACY_GAS_URL_KEY);
    await checkAdminSession();
    loadEventsData();
    renderQuickLinksUI();
    renderEventsGrid();
    renderQuestionnaireBuilder();
    renderHeroSpotlight();
    renderSidebarWidgets();
    startCountdownTimers();
    setFooterYear();
    await syncEventsFromBackend();

    ['event-name', 'event-category', 'event-date', 'event-start-time', 'event-end-time', 'event-max']
      .forEach(id => document.getElementById(id)?.addEventListener('input', updateCreateReadiness));
    ['edit-event-date', 'edit-event-start-time', 'edit-event-end-time', 'edit-event-max']
      .forEach(id => document.getElementById(id)?.addEventListener('input', updateEditDateFeedback));
    updateCreateReadiness();
    document.querySelectorAll('.sf-modal-backdrop').forEach((modal) => {
      modal.setAttribute('role', 'dialog');
      modal.setAttribute('aria-modal', 'true');
      const title = modal.querySelector('.sheet-title');
      if (title) {
        if (!title.id) title.id = `${modal.id}-title`;
        modal.setAttribute('aria-labelledby', title.id);
      }
      modal.querySelectorAll('.btn-icon-circular').forEach(button => {
        if (!button.getAttribute('aria-label')) button.setAttribute('aria-label', '關閉視窗');
      });
    });
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      const activeModal = Array.from(document.querySelectorAll('.sf-modal-backdrop.active')).pop();
      if (activeModal) closeModal(activeModal.id);
    }
    if (event.key === 'Tab') {
      const activeModal = Array.from(document.querySelectorAll('.sf-modal-backdrop.active')).pop();
      if (!activeModal) return;
      const focusable = Array.from(activeModal.querySelectorAll('button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href]'))
        .filter(element => element.offsetParent !== null);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  });

})();
