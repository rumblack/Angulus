# Angulus v1.3.26 — GitHub Pages 全量更新版

這份壓縮檔**沒有外層資料夾**。解壓縮後請把所有檔案上傳到 GitHub Pages 實際發布來源的目錄，而非僅上傳 zip 或外層資料夾。

## 必須上傳到相同目錄的檔案

- `index.html`：頁面結構、店主資訊、伺服器選擇、注意事項
- `styles.css`：寶石藍、白色、深木色、羊皮紙排版
- `script.js`：分類分頁、客製委託、購物車及送單
- `config.js`：所有商品與 Gil 價格、收單端點
- `.nojekyll`：可選的 GitHub Pages 靜態發布設定（隱藏檔）

**注意：上傳前請備份 GitHub 現有 `config.js`。** 這份包含完整商品資料，但 `formEndpoint` 與 `contactUrl` 預設留空；若你已在 GitHub 的 `config.js` 設定收單地址或 Discord 連結，請把對應值補回新版後再上傳，避免現有接單功能中斷。

## 更新方法（使用 GitHub 網頁）

1. 開啟你的 GitHub 儲存庫，確認 `Settings → Pages` 的 `Build and deployment`：若使用 `Deploy from a branch`，確認分支（通常是 `main`）及資料夾（常見 `/(root)`，也可能是 `/docs`）。
2. 切換到這個發布分支和發布資料夾，使用 `Add file → Upload files`，**上傳以上檔案本身**（而非外層資料夾），覆蓋原有同名檔。提交變更。
3. 打開儲存庫的 `Actions`，確認 GitHub Pages 建置與部署任務已成功。
4. 開啟你的 GitHub Pages 網址。往頁尾看是否出現 `v1.3.26`。也可按 Ctrl+Shift+R（Mac: Cmd+Shift+R）重新整理。
5. 若仍為舊版：確認 Pages 的發布分支/資料夾是否與上傳位置一致；確認 `index.html` 的連結是 `styles.css?v=1.3.26`、`config.js?v=1.3.26`、`script.js?v=1.3.26`；檢查儲存庫是否有另一個 index.html。

CSS/JS 帶版本查詢參數可以減少舊檔被瀏覽器快取沿用的機率；**它不能修正上傳到錯誤儲存庫、分支或目錄的問題**。

## 全量功能清單

- 導覽：首頁（回頂部）、商品一覽、訂購流程、訂購申請；無重複客製委託導覽
- 店主資訊：伊弗利特／亞德里恩／薰衣草苗圃 11區48號
- 分類：常駐商品／少量購買／客製化委託（委託直接在分頁輸入）
- 常駐：高山茶 329,000 Gil（999 杯）、瑪黛茶餅乾 69,000 Gil（99 塊）、四種 3 級寶藥各 128,000 Gil（99 瓶）
- 少量：瑪黛茶餅乾 6,000 Gil（10 塊）、四種寶藥各 13,000 Gil（10 瓶）
- 訂購單：數量加減與總計；客製委託可以移除；指定七個伺服器；承諾文字已更新
- 注意事項：Gil 計價、庫存與製作時程、材料行情可能影響價格

## 接單限制

GitHub Pages 本身只有靜態頁面，**不會自行儲存或接收訂單**。此版本的線上提交使用 Formspree；請在 `config.js` 設定正確 `formEndpoint` 並做正式測試。請勿將密碼、機密金鑰或私人資料硬編碼到公開儲存庫。

## 如何確認已發布新版

頁面最下方的版本應顯示 **v1.3.26**。如果看到版本號但商品還是舊的，優先檢查 `config.js` 是否被新版覆蓋，以及網址中的 `?v=1.3.26`。


## V1.3.27 Formspree 訂單接收

- 已在 `config.js` 填入 `https://formspree.io/f/xbgodgak`。
- `index.html` 快取參數更新為 `v=1.3.27`。
- 請登入 Formspree 確認表單通知信箱及啟用狀態，並用測試訂單確認成功接收。
- 請勿只依網站顯示的 Gil 小計直接完成交易；請人工核對訂單內容。


## V1.3.28：外連預覽文字
- 更新 HTML title、meta description、og:title、og:description、Twitter Card 標題與描述。
- 不新增預覽圖片，維持純文字品牌風格。
- Discord 等平台可能快取舊預覽，需要等待重新抓取。


## V1.3.29 外連預覽文案調整
- 站點描述、Open Graph 描述及 Twitter 描述統一為：
  Angulus 道具製作小舖｜提供各類客製化委託服務。使用 Gil 計價，歡迎冒險者選購與提出需求。
- 本次沒有更改現有商品及 Formspree 接單設定。


## V1.3.30 少量購買新增
- 「少量購買」第一項新增一小份高山茶：每份 99 杯，32,500 Gil。
- 常駐商品「高山茶一組」維持 999 杯／329,000 Gil。
- 其他商品價格與 Formspree 接單網址維持不變。
- 已同步更新 index.html 的資源版本參數與頁尾版本標記。


## V1.3.31 預覽標題修正
- 修正 `script.js` 在載入完成後覆寫 HTML `<title>` 的問題。瀏覽器頁籤現在保留 `Angulus｜FF14 道具製作與委託訂購`。
- `config.js` 內副標語改為「道具製作小舖」。
- 保留現有的 SEO meta description、Open Graph、Twitter 標題與說明。
- 資源載入參數更新為 `?v=1.3.31`，頁尾版本改為 `v1.3.31`。
- **請上傳 `index.html`、`script.js`、`config.js` 三檔**到 GitHub Pages 真正的發布目錄。
- 分享卡片抓取的是公開網站回傳的 HTML meta，不是 JavaScript 產生的頁籤文字。Discord 可能有快取，且 GitHub Pages 上傳錯誤分支、目錄或尚未成功部署也會顯示舊資料。
- 測試時開啟網站 `view-source:` 原始碼，搜尋 `og:description` 並確認是否包含「Angulus 道具製作小舖」，同時確認 `angulus-version=1.3.31`；如果顯示舊內容，請核對 Settings > Pages 的發布來源與 Actions 部署結果。
- 在分享網址後加 `?preview=13131` 可能使部分社群平台以新網址重新抓取，但不保證立即更新，而且必須先確認原始網站已部署成功。
