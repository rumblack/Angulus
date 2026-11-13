# Angulus V1.3.42｜Google 試算表訂單管理系統

## 目錄
- `index.html`、`styles.css`、`script.js`、`config.js`、`assets/jobs/`：GitHub Pages 前台
- `google-apps-script/Code.gs`：Google Apps Script 後端，請複製進試算表所屬 Apps Script 專案
- `GOOGLE_部署教學.md`：新手部署、測試、安全與故障處理

## 本版功能
- 客人維持在 Angulus 原網頁選購與委託，不跳轉 Google 表單。
- 固定商品於 GAS 後端依商品編號重新計價，客製委託待報價。
- Google 試算表自動生成 6 張工作表：訂單總表、商品明細、客製委託、回執紀錄、商品價格表、營運總覽。
- 回執專用匿名請求識別碼：提交後網頁查詢接收確認，未確認時不會清空購物車。
- 避免重複提交相同請求識別碼；但公開寫入端點仍可能遭濫用，需要定期監控。

## 限制
- 目前無獨立 Web 管理後台；使用私人 Google 試算表作為管理介面。
- 尚未串接實際 Google 帳戶，請在部署後做測試訂單。
- Google Apps Script 是跨來源服務：使用隱藏 POST 表單＋只回傳訂單編號的 JSONP 回執，不會把私人訂單明細公開。
- 此為初期低流量方案，不是高安全性的電子商務或金流系統。
- 當商品價格調整時，必須**同時**調整 `config.js` 和 `Code.gs` 的 `PRODUCT_CATALOG`，並重新部署 GAS。
- 原 Formspree 端點只作為備援；不會自動同時雙寫。


## V1.3.43 Google 接單端點設定

已填入提供的 Google Apps Script /exec 網址，保留 orderBackend=google 與 Formspree 備援網址。
請覆蓋 GitHub Pages 根目錄 index.html 與 config.js，並以測試訂單確認 Google 試算表實際收件。
不要只憑本機設定完成就認定已收到訂單。


## V1.3.44：獨立訂單查詢頁
- 入口位於「訂購流程」與「訂購申請」之間，連向 `orders.html`。
- 搜尋使用**角色名稱＋每筆訂單獨立的 40 碼查詢碼**，不公開任何角色的全量訂單。
- 新訂單成功後顯示查詢碼，並只在客人本機瀏覽器保留最近 15 筆快速查詢紀錄。
- 查詢結果為羊皮紙收據，包含訂單狀態、付款狀態、商品金額及客製委託摘要；不提供聯絡方式與備註。
- 必須將新版 `google-apps-script/Code.gs` 重新部署到同一個 Web App 部署版本，否則查詢功能無法使用。
- 過去 V1.3.43 前已建立的訂單，當時客人未取得查詢碼，無法自行查詢；請店主手動核對。
