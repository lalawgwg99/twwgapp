# 活動問卷與報名系統 (Apple Native SwiftUI Style)

本專案為遵循 **Apple Human Interface Guidelines (HIG)** 與 **SwiftUI 原生設計邏輯** 的極緻活動問卷與報名 Web 系統。可直接部署於 **Cloudflare Pages / Workers**，並支援 Cloudflare D1 資料庫與 Cloudflare R2 雲端圖片上傳。

---

## 🌟 核心特色

### 1. 🎨 Apple 原生視覺體驗 (SwiftUI Aesthetic)
- **iOS 系統標準配色與字體**：採用 SF Pro 字體，搭配 Apple System Blue (`#007AFF`)、Green (`#34C759`)、Orange (`#FF9500`)、Red (`#FF3B30`)。
- **SwiftUI 原生元件**：
  - **Navigation Bar & Large Title**：經典 iOS 大標題與滑動視覺。
  - **Segmented Control (分段控制器)**：原生膠囊切換與流暢觸感回饋。
  - **Grouped Event Cards (8活動並排牆)**：響應式 4 欄 / 3 欄 / 2 欄 / 1 欄多裝置自適應。
  - **iOS Bottom Sheet Modal**：毛玻璃背景與動態高度彈窗。
  - **Search & Category Pills**：內嵌式搜尋列與類別篩選標籤（音樂、體驗、戶外、藝文、講座、運動）。

### 2. 🛡️ 台灣《個人資料保護法》合規隱私權條款
- 報名表單強制整合**個資蒐集告知事項與同意條款** Modal。
- 完整規範資料利用期間、地區、當事人權利與 Cloudflare 安全傳輸保護。

### 3. 🖼️ 活動圖片上傳架構 (Cloudflare R2)
- 支援 **Unsplash / Imgur 外部圖片網址** 貼上。
- 支援 **本地圖片選擇與即時預覽**。
- 內建 **Cloudflare R2 Object Storage** 上傳 API 整合介面。

### 4. 📅 行事曆匯出 (.ics iCal)
- 報名成功後可一鍵下載 `.ics` 檔案，無縫加入 **Apple Calendar**、**Google Calendar** 或 **Outlook**。

---

## 🚀 部署指南 (Deploy to Cloudflare Pages)

### 步驟一：推送到 GitHub
本儲存庫已綁定 `https://github.com/lalawgwg99/twwgapp.git`，執行以下命令推送到 GitHub：

```bash
git add .
git commit -m "feat: Apple Native SwiftUI Event App with Cloudflare & iCal support"
git branch -M main
git push -u origin main
```

### 步驟二：於 Cloudflare 控制台連結專案
1. 登入 [Cloudflare Dashboard](https://dash.cloudflare.com/)。
2. 點選 **Workers & Pages** -> **Create Application** -> **Pages**。
3. 選擇 **Connect to Git**，選取 `lalawgwg99/twwgapp` 儲存庫。
4. 設定 Build Settings：
   - **Framework preset**: `None`
   - **Build command**: (留空)
   - **Build output directory**: `./`
5. 點選 **Save and Deploy** 即可完成上線！

---

## 🗄️ 雲端擴充：Cloudflare D1 (SQL) 與 R2 (圖片儲存)

如果希望將 LocalStorage 提升為雲端持久化 SQL 資料庫：

### 1. 建立 D1 資料庫
```bash
npx wrangler d1 create twwgapp-db
```
於 `wrangler.json` 更新 `database_id`。

### 2. 建立資料表結構
```sql
CREATE TABLE events (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT,
  date TEXT,
  description TEXT,
  max_people INTEGER,
  location TEXT,
  image_url TEXT,
  created_at INTEGER
);

CREATE TABLE registrations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id TEXT,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  registered_at INTEGER,
  FOREIGN KEY (event_id) REFERENCES events(id)
);
```

---

## 📄 授權條款
MIT License.
