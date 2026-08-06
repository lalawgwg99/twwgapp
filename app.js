/**
 * Apple Native (SwiftUI Style) Event Registration System Logic
 * Compliant with Apple HIG & Taiwan Personal Data Protection Act
 */

(function () {
  'use strict';

  const STORAGE_KEY = 'twwgapp_events_v3';
  let activeView = 'list';
  let selectedCategory = 'all';
  let searchQuery = '';
  let activeEventId = null;
  let uploadMethod = 'url';
  let filePreviewDataUrl = null;

  // 8 High Quality Curated Monthly Events Demo Data
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
      name: '2026 夏季音樂祭：搖滾與草原交響',
      category: '音樂',
      description: '戶外草地音樂盛會，邀請 12 組國內獨立樂團與管弦樂團跨界演出，含現場手作市集與精釀啤酒攤位。',
      maxPeople: 200,
      date: '2026-08-22',
      location: '台北市大安森林公園戶外音樂台',
      image: DEFAULT_IMAGES[0],
      createdAt: Date.now() - 86400000 * 5,
      registrations: [
        { name: '陳小明', email: 'chen@example.com', phone: '0912-345-678', registeredAt: Date.now() - 86400000 * 2 },
        { name: '林美玲', email: 'lin@example.com', phone: '0987-654-321', registeredAt: Date.now() - 86400000 },
        { name: '黃建志', email: 'huang@example.com', phone: '0933-111-222', registeredAt: Date.now() - 3600000 * 4 }
      ]
    },
    {
      id: 'demo-2',
      name: '精品手沖咖啡與風味品評工作坊',
      category: '體驗',
      description: '資深 Q Grader 咖啡品質鑑定師親自指導，現場沖煮並解析 4 款世界冠軍莊園產區微批次咖啡豆。',
      maxPeople: 16,
      date: '2026-08-25',
      location: '台北市大安區永康街咖啡實驗室',
      image: DEFAULT_IMAGES[1],
      createdAt: Date.now() - 86400000 * 4,
      registrations: [
        { name: '周宗翰', email: 'chou@example.com', phone: '0911-222-333', registeredAt: Date.now() - 7200000 },
        { name: '張家豪', email: 'chang@example.com', phone: '0955-666-777', registeredAt: Date.now() - 3600000 }
      ]
    },
    {
      id: 'demo-3',
      name: '陽明山七星山主東峰連走健行團',
      category: '戶外',
      description: '由國家公園專業導覽員帶隊，觀賞地熱火山地形與季風矮林生態。全程提供專屬接駁車與意外保險。',
      maxPeople: 30,
      date: '2026-08-29',
      location: '陽明山小油坑遊客服務中心集合',
      image: DEFAULT_IMAGES[2],
      createdAt: Date.now() - 86400000 * 3,
      registrations: [
        { name: '吳大仁', email: 'wu@example.com', phone: '0922-888-999', registeredAt: Date.now() - 5400000 }
      ]
    },
    {
      id: 'demo-4',
      name: '療癒系法式植物水彩插畫課',
      category: '藝文',
      description: '零基礎也能輕鬆上手！學習水彩渲染與層次堆疊技巧，繪製專屬多肉植物與花卉，材料道具全數提供。',
      maxPeople: 12,
      date: '2026-08-30',
      location: '新北市板橋區藝文創客空間',
      image: DEFAULT_IMAGES[3],
      createdAt: Date.now() - 86400000 * 2,
      registrations: [
        { name: '許雅婷', email: 'hsu@example.com', phone: '0912-333-444', registeredAt: Date.now() - 86400000 },
        { name: '鄭婷婷', email: 'cheng@example.com', phone: '0987-111-222', registeredAt: Date.now() - 7200000 },
        { name: '孫國華', email: 'sun@example.com', phone: '0933-555-666', registeredAt: Date.now() - 3600000 },
        { name: '劉建國', email: 'liu@example.com', phone: '0922-777-888', registeredAt: Date.now() - 1800000 },
        { name: '蔡小萍', email: 'tsai@example.com', phone: '0955-999-000', registeredAt: Date.now() - 900000 },
        { name: '楊心怡', email: 'yang@example.com', phone: '0911-000-111', registeredAt: Date.now() - 600000 },
        { name: '曾志豪', email: 'tseng@example.com', phone: '0988-222-333', registeredAt: Date.now() - 300000 },
        { name: '廖珮君', email: 'liao@example.com', phone: '0933-444-555', registeredAt: Date.now() - 120000 },
        { name: '高健彰', email: 'kao@example.com', phone: '0922-666-777', registeredAt: Date.now() - 60000 },
        { name: '馬勝豪', email: 'ma@example.com', phone: '0955-888-999', registeredAt: Date.now() - 30000 },
        { name: '羅佩珊', email: 'lo@example.com', phone: '0911-111-222', registeredAt: Date.now() - 10000 },
        { name: '梁靜宜', email: 'liang@example.com', phone: '0988-333-444', registeredAt: Date.now() - 5000 }
      ]
    },
    {
      id: 'demo-5',
      name: '新創商業模式與 Pitch 實戰演練講座',
      category: '講座',
      description: '邀請知名創投合夥人拆解 Business Model Canvas，指導簡報邏輯與募資技巧，提供精緻交流午餐。',
      maxPeople: 50,
      date: '2026-09-02',
      location: '台北市信義區微風南山 3 樓會議廳',
      image: DEFAULT_IMAGES[4],
      createdAt: Date.now() - 86400000,
      registrations: [
        { name: '韓大偉', email: 'han@example.com', phone: '0912-555-666', registeredAt: Date.now() - 3600000 }
      ]
    },
    {
      id: 'demo-6',
      name: '週六早晨身心舒緩與呼吸法瑜伽',
      category: '運動',
      description: '在沐浴晨光下進行 Hatha 瑜伽引導，釋放一整週的肩頸壓力。課後特別贈送優格早午餐餐盒。',
      maxPeople: 25,
      date: '2026-09-05',
      location: '台北市中山區圓山花博公園大草皮',
      image: DEFAULT_IMAGES[5],
      createdAt: Date.now() - 43200000,
      registrations: [
        { name: '曹小芳', email: 'tsao@example.com', phone: '0933-888-999', registeredAt: Date.now() - 7200000 },
        { name: '彭大仁', email: 'peng@example.com', phone: '0922-000-111', registeredAt: Date.now() - 3600000 }
      ]
    },
    {
      id: 'demo-7',
      name: '合歡山英仙座流星雨夜間星空攝影',
      category: '戶外',
      description: '專業天文攝影導師隨團，提供長曝相機參數設定指導與赤道儀追星示範。適合具備基礎相機操作者。',
      maxPeople: 15,
      date: '2026-09-12',
      location: '南投縣仁愛鄉合歡山昆陽停車場',
      image: DEFAULT_IMAGES[6],
      createdAt: Date.now() - 21600000,
      registrations: [
        { name: '葉怡婷', email: 'yeh@example.com', phone: '0933-111-222', registeredAt: Date.now() - 1800000 }
      ]
    },
    {
      id: 'demo-8',
      name: '日式陶藝手拉坯與素燒體驗課',
      category: '藝文',
      description: '親手在陶藝轉盤上捏塑屬於自己的茶碗或馬克杯，經 1230 度高溫柴燒後寄送到府，留存獨一無二的手作溫暖。',
      maxPeople: 10,
      date: '2026-09-15',
      location: '新北市鶯歌區陶藝老街工作坊',
      image: DEFAULT_IMAGES[7],
      createdAt: Date.now() - 10800000,
      registrations: [
        { name: '白小君', email: 'pai@example.com', phone: '0922-444-555', registeredAt: Date.now() - 3600000 },
        { name: '崔大仁', email: 'tsui@example.com', phone: '0955-666-777', registeredAt: Date.now() - 1800000 }
      ]
    }
  ];

  // Helper Functions
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
    document.getElementById('view-create').classList.add('hidden');
    document.getElementById('view-manage').classList.add('hidden');

    document.getElementById('nav-list').classList.remove('active');
    document.getElementById('nav-create').classList.remove('active');
    document.getElementById('nav-list').setAttribute('aria-selected', 'false');
    document.getElementById('nav-create').setAttribute('aria-selected', 'false');

    if (viewName === 'list') {
      document.getElementById('view-list').classList.remove('hidden');
      document.getElementById('nav-list').classList.add('active');
      document.getElementById('nav-list').setAttribute('aria-selected', 'true');
      renderEventsGrid();
    } else if (viewName === 'create') {
      document.getElementById('view-create').classList.remove('hidden');
      document.getElementById('nav-create').classList.add('active');
      document.getElementById('nav-create').setAttribute('aria-selected', 'true');
    } else if (viewName === 'manage') {
      document.getElementById('view-manage').classList.remove('hidden');
      renderManageView();
    }
  };

  // Search and Category Filtering
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
          <p class="empty-state-subtitle">請嘗試搜尋其他關鍵字，或切換至「全部」分類列表</p>
        </div>
      `;
      return;
    }

    container.innerHTML = filtered.map(ev => {
      const regCount = ev.registrations ? ev.registrations.length : 0;
      const status = getStatus(regCount, ev.maxPeople);
      const pct = Math.min((regCount / ev.maxPeople) * 100, 100).toFixed(0);
      const categoryTag = ev.category || '活動';

      return `
        <article class="event-card" onclick="openEventDetail('${ev.id}')" role="button" tabindex="0">
          <div class="card-media" style="background-image: url('${ev.image}')">
            <div class="card-badges">
              <span class="sf-badge badge-status-${status.type}">${status.label}</span>
              <span class="sf-badge badge-category">${categoryTag}</span>
            </div>
          </div>
          <div class="card-content">
            <div class="card-date">${formatDate(ev.date)}</div>
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

  // Modal Control Functions
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
    document.getElementById('sheet-location').textContent = ev.location || '線上活動 / 待公布集合地點';
    document.getElementById('sheet-progress-text').textContent = `報名名額：${regCount} / ${ev.maxPeople} 人 (${pct}%)`;

    const statusBadge = document.getElementById('sheet-status-badge');
    statusBadge.textContent = status.label;
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

  window.proceedToRegisterForm = function () {
    closeModal('modal-detail');
    const events = loadEventsData();
    const ev = events.find(e => e.id === activeEventId);
    if (!ev) return;

    document.getElementById('reg-form-event-name').textContent = ev.name;
    document.getElementById('active-registration-form').reset();
    openModal('modal-register-form');
  };

  window.openPrivacyModal = function () {
    openModal('modal-privacy');
  };

  // Submit Registration & Check Privacy consent
  window.submitRegistration = function (e) {
    e.preventDefault();
    if (!activeEventId) return;

    const privacyCheck = document.getElementById('reg-privacy-check');
    if (!privacyCheck.checked) {
      showToast('請勾選同意個人資料保護與隱私權條款', true);
      return;
    }

    const name = document.getElementById('reg-name').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const phone = document.getElementById('reg-phone').value.trim();

    if (!name || !email || !phone) {
      showToast('請填寫完整必填資料', true);
      return;
    }

    const events = loadEventsData();
    const ev = events.find(e => e.id === activeEventId);
    if (!ev) return;

    if (ev.registrations.length >= ev.maxPeople) {
      showToast('抱歉，此活動剛好額滿！', true);
      closeModal('modal-register-form');
      return;
    }

    ev.registrations.push({
      name,
      email,
      phone,
      registeredAt: Date.now()
    });

    saveEventsData(events);
    closeModal('modal-register-form');
    openModal('modal-success');
    renderEventsGrid();
  };

  // Export iCal (.ics) Calendar File
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

  // Image Upload Method Logic
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

    const name = document.getElementById('event-name').value.trim();
    const category = document.getElementById('event-category').value;
    const date = document.getElementById('event-date').value;
    const desc = document.getElementById('event-desc').value.trim();
    const maxPeople = parseInt(document.getElementById('event-max').value, 10);
    const location = document.getElementById('event-location').value.trim();

    let image = DEFAULT_IMAGES[Math.floor(Math.random() * DEFAULT_IMAGES.length)];

    if (uploadMethod === 'url') {
      const urlInput = document.getElementById('event-img-url').value.trim();
      if (urlInput) image = urlInput;
    } else if (uploadMethod === 'file' && filePreviewDataUrl) {
      image = filePreviewDataUrl;
    }

    if (!name || !date || !maxPeople || maxPeople < 1) {
      showToast('請填寫完整的活動必填欄位', true);
      return;
    }

    const events = loadEventsData();
    const newEvent = {
      id: 'evt-' + Date.now(),
      name,
      category,
      date,
      description: desc,
      maxPeople,
      location: location || '現場活動',
      image,
      createdAt: Date.now(),
      registrations: []
    };

    events.unshift(newEvent);
    saveEventsData(events);

    document.getElementById('create-event-form').reset();
    document.getElementById('image-preview').classList.add('hidden');
    filePreviewDataUrl = null;

    showToast('新活動成功發布！');
    switchView('list');
  };

  // Management View
  function renderManageView() {
    if (!activeEventId) {
      const events = loadEventsData();
      if (events.length > 0) activeEventId = events[0].id;
    }

    const events = loadEventsData();
    const ev = events.find(e => e.id === activeEventId);
    const detailContainer = document.getElementById('manage-event-detail');
    const regContainer = document.getElementById('manage-registrations-list');

    if (!ev) {
      detailContainer.innerHTML = '<p>尚無選取的活動</p>';
      regContainer.innerHTML = '';
      return;
    }

    detailContainer.innerHTML = `
      <div style="background:var(--surface-secondary); padding:14px; border-radius:var(--radius-s); margin-bottom:14px;">
        <h3 style="font-size:16px; font-weight:600; margin-bottom:4px;">${escapeHTML(ev.name)}</h3>
        <p style="font-size:13px; color:var(--label-secondary);">日期：${formatDate(ev.date)} ｜ 地點：${escapeHTML(ev.location || '未定')}</p>
        <p style="font-size:13px; color:var(--label-secondary); margin-top:2px;">報名人數：${ev.registrations.length} / ${ev.maxPeople} 人</p>
      </div>
    `;

    if (ev.registrations.length === 0) {
      regContainer.innerHTML = `
        <div style="text-align:center; padding:30px; color:var(--label-tertiary); font-size:13.5px;">
          目前尚無參加者報名
        </div>
      `;
    } else {
      regContainer.innerHTML = `
        <div class="sf-table-wrapper">
          <div class="sf-table-header">
            <div>姓名</div>
            <div>Email / 聯絡電話</div>
            <div>報名日期</div>
          </div>
          ${ev.registrations.map(r => `
            <div class="sf-table-row">
              <div style="font-weight:600;">${escapeHTML(r.name)}</div>
              <div>
                <div>${escapeHTML(r.email)}</div>
                <div class="cell-sub">${escapeHTML(r.phone || '')}</div>
              </div>
              <div class="cell-sub">${new Date(r.registeredAt).toLocaleDateString('zh-TW')}</div>
            </div>
          `).join('')}
        </div>
      `;
    }
  }

  window.deleteActiveEvent = function () {
    if (!activeEventId) return;
    if (!confirm('確定要刪除此活動嗎？刪除後無法復原。')) return;

    let events = loadEventsData();
    events = events.filter(e => e.id !== activeEventId);
    saveEventsData(events);

    showToast('活動已刪除');
    switchView('list');
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
    loadEventsData();
    renderEventsGrid();
  });

})();
