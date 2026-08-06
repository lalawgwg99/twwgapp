# 萬家福五甲店活動服務平台

專為門市活動營運設計的響應式報名與管理平台，可部署於 **Cloudflare Pages**，並以 **Cloudflare D1** 作為跨裝置共用資料庫。包含活動刊登、報名期間與名額控管、自訂問卷、代理報名、現場報名、簽到與 CSV 匯出。

---

## 🌟 核心特色

### 1. 專業門市活動介面
- 清楚呈現日期、地點、票價、名額和報名狀態。
- 桌機三欄活動牆與營運資訊側欄，手機改為單欄與底部表單。
- 支援鍵盤操作、焦點管理、縮放與 reduced-motion。

### 2. 🛡️ 台灣《個人資料保護法》合規隱私權條款
- 報名表單強制整合**個資蒐集告知事項與同意條款** Modal。
- 完整規範資料利用期間、地區、當事人權利與 Cloudflare 安全傳輸保護。

### 3. 活動圖片設定
- 支援 HTTPS 外部圖片網址。
- 支援 **本地圖片選擇與即時預覽**。

### 4. 行事曆匯出 (.ics iCal)
- 報名成功後可一鍵下載 `.ics` 檔案，無縫加入 **Apple Calendar**、**Google Calendar** 或 **Outlook**。

---

## 🚀 部署指南 (Deploy to Cloudflare Pages)

### 步驟一：推送到 GitHub
本儲存庫已綁定 `https://github.com/lalawgwg99/twwgapp.git`，執行以下命令推送到 GitHub：

```bash
git add .
git commit -m "feat: launch production event management portal"
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

## 📄 授權條款
MIT License.

---

## 正式環境必要設定

公開販售或正式營運前，請完成以下設定。未綁定 D1 時，系統會進入 `client_sync` 展示模式，資料只保留在單一瀏覽器，不適合正式收件。

1. 建立 D1 資料庫並執行 schema：

```bash
npx wrangler d1 create twwgapp-db
npx wrangler d1 execute twwgapp-db --file=./schema.sql --remote
```

2. 在 Cloudflare Pages 專案綁定 D1，變數名稱必須為 `DB`。
3. 在 Pages 的 Settings > Variables and Secrets 設定：
   - `ADMIN_PASSCODE`：至少 12 字元、不可使用公開預設值。
   - `ADMIN_TOKEN_SECRET`：另一組至少 32 字元的隨機秘密。
4. 重新部署後確認 `GET /api/events` 回傳 `mode: "database"`。

正式網站固定使用 Cloudflare Pages Functions 與 D1。`google_apps_script/` 僅保留為未啟用的歷史備援程式，不與正式站連線，也不會接管管理員登入。

## 測試

```bash
node --test tests/*.test.mjs
node --check app.js
node --check functions/api/events.js
```
