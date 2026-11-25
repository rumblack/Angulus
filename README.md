> V1.3.85：精簡委託收據，新增付款標籤、調整 Gil 排版、隱藏不必要報價提示；後端不變。

# Angulus V1.3.85｜FF14 道具製作小舖

## V1.3.85 本版更新
- 委託收據簡化基本資料，委託狀態統一在進度條顯示。
- 付款狀態改為彩色小標籤；商品單價單位改為「組」；小計的 Gil 套用統一字樣。
- 無報價事項時自動隱藏報價提示框。
- 僅更新 GitHub Pages 前台，Google Apps Script 與 Discord 同步功能保留。

## V1.3.84 先前更新
- 全站顧客可見文案統一「委託」「查詢碼」「你」，訂購申請單等例外保留。
- 注意事項精簡，商品說明移除與 pack 標籤重複的開頭數量句。
- 申請單和確認畫面顯示品項規格；送往 Google 的原商品名稱及商品 ID、價格完全不變。
- Discord 後台功能延用前版，無須重新部署。


- 手機確認視窗的資訊列維持左右雙欄；不再強制改為上下單欄。
- 「返回修改／確認送出」操作列固定於確認視窗捲動區底部。
- 未填寫的希望交貨日期與方便交易時段不顯示。
- 確認畫面的小計標籤統一改為「訂單小計」。
- 網站頁面及資源快取參數更新為 1.3.81。
- `assets/jobs/` 原本就沒有 arcanist.png／archer.png，保留目前的 33 張 48×48 圖標。
- 本版未修改 Google Apps Script；沿用 V1.3.80 的 Discord 通知與狀態同步。

## V1.3.80 先前更新

Discord Webhook 收據改為桌面較穩定的寬版 Embed：商品明細獨立、資訊分區、欄位順序一致，仍可持續編輯原訊息。Discord 不支援精確指定 Embed 寬度。

## 之前功能

1. 希望交貨日期不可選擇昨天或更早的日期。
2. 訂購人可選擇「記住我的資料」；儲存角色名稱、伺服器、聯絡方式到自己的瀏覽器，不保存備註、交貨日期及交易時段。
3. 訂單查詢收據新增「再訂一次」：已下架的商品與裝備／客製委託不會自動帶入；商品更改售價以目前設定為準，並提示差異。
4. 正式送出前新增羊皮紙確認視窗，顯示品項、數量、已知 Gil 小計、待報價項目與訂購人資訊；可返回修改。
5. 新增前端隱藏欄位（honeypot）阻擋部分機器人；這只是基本防護，不足以阻擋針對性大量送單。
6. 選用 Google Apps Script 更新：新訂單 Discord 通知、同角色短時間重複送單防護。預設均停用，不影響原接單流程。
7. `index.html`、`orders.html` 及靜態資源參數升級為 1.3.77。

## 保留項目

- 常駐商品 7 項、少量商品 6 項、裝備訂製與客製委託。
- 典禮整套 500,000 Gil、雀翎＋金拇指整套 1,100,000 Gil、宇宙工具專用 1,000,000 Gil；其他待報價。
- Google 試算表訂單管理、單號／密鑰查詢、付款狀態自動同步、訂單上色。
- 33 張 48×48 透明背景職業 PNG 圖標。

## 檔案結構

- `index.html`、`orders.html`、`styles.css`、`script.js`、`order-lookup.js`、`config.js`：網站。
- `assets/jobs/`：FF14 職業圖示。
- `google-apps-script/`：Google 接單與管理程式。新增的 Discord 通知與短時間重複送單檢查是選用功能，須部署新版 Code.gs 並設定 Script Properties 才生效。
- `部署與維護教學.md`：升級與測試步驟。
- `版本更新紀錄.md`：歷次修訂。

**部署前請備份現有 `config.js`，不要在公開網站存放 Discord Webhook 或其他私密憑證。**


### V1.3.79 Discord 反覆同步修復

即時 onEdit + 每 5 分鐘定期核對，僅同步 Google K/L/M 和 Discord Embed 不一致的訂單。部署後需要重新執行 `setupDiscordStatusSync()` 安裝兩種觸發器，原 `PaymentStatusSync.gs` 不需修改。

### V1.3.78 Discord 收據式通知

`google-apps-script/Code.gs` 已改用 Discord Embed 顯示新訂單明細。必須更新並重新部署既有 Apps Script 網頁應用程式；Webhook 指令碼屬性 `ANGULUS_DISCORD_WEBHOOK_URL` 不必變更。顧客查詢收據依舊顯示最新訂單狀態，Discord 通知則為新訂單成立時的快照。


V1.3.78：Discord 收據狀態可隨 Google 訂單總表 K（訂單狀態）、L（付款狀態）、M（最後報價）修改原訊息。需更新 Code.gs、重新部署並手動執行一次 setupDiscordStatusSync() 安裝可授權編輯觸發器。
