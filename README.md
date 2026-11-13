# 星藍工坊 — GitHub Pages 靜態網站樣板 V1.3（純文字版）

寶石藍 × 純 CSS 大理石色調 × 深胡桃木色 × 羊皮紙色調。已移除所有網站照片、商品圖片與裝飾圖示，使用純文字區塊呈現。支援 FF14 Gil 整數計價、商品分類、購物清單、客製委託、訂購表單及手機版排版。

## 最快公開上線（不用安裝 Node.js）

1. 下載 ZIP 並解壓縮，確認最外層有 `index.html`、`styles.css`、`script.js`、`config.js`。
2. 前往 [github.com/new](https://github.com/new)，建立一個 **Public** repository，例如 `sapphire-atelier`。
3. 開啟新建立的 repository → **Add file → Upload files**，將上述檔案依照正確相對路徑上傳。GitHub 網頁上傳直接選取全部檔案即可。
4. 前往 **Settings → Pages** → **Build and deployment**，選擇 **Deploy from a branch**，Branch 選 `main`，Folder 選 `/(root)`，按 Save。
5. 稍後會出現公開網站網址：`https://你的帳號.github.io/sapphire-atelier/`。
6. 往後修改 `config.js` 、推送到 `main` 就會更新網站。

> 此 ZIP 是**全靜態網站**，不需要 Vercel、Supabase 或 npm，也不能直接搭配舊版 Next.js 後端。若你已有 V1.1 的 Supabase 訂單資料庫，兩版目前互不連線。

## 自訂商店、商品和價格

直接用文字編輯器打開 `config.js`：

- `name`：中文店名；`englishName`：英文店名。
- `notice`：注意事項；`contactUrl`：Discord 邀請或其他 HTTPS 聯絡網址。
- `products`：修改示範商品 `name`、`category`、`price`、`days`、`badge`、`desc`。
- 固定商品 `price` 以 Gil 整數填寫，例如 `250000`（畫面自動顯示 250,000 Gil）；**請勿加引號、逗號或 Gil**。
- `price: null` 為「待報價」客製委託。
- `config.js` 內的預設商品和價格都是示範用，**不是正式 FF14 市場售價**。

## 讓客人真正可以送出訂單（必要設定）

**GitHub Pages 只負責提供靜態網頁，不會儲存訂單，也沒有管理員登入與資料庫。** 本樣板額外提供選用的 Formspree 表單服務，店主設定後，可收到表單提交內容：

1. 在 [Formspree](https://formspree.io/) 註冊並驗證店主電子郵件。
2. 建立新表單，取得 EndPoint（樣式如 `https://formspree.io/f/xxxxxxxx`）。
3. 把 `config.js` 內 `formEndpoint: ''` 改成 `formEndpoint: 'https://formspree.io/f/xxxxxxxx'`，提交至 GitHub。
4. 開啟網站，使用測試角色名稱下單；確認 Formspree 控制台或通知信真的收到訂單。
5. 務必實際測試手機版與網路中斷時的提示。

**未設定 endpoint 時，網站會明確阻止送單，不會假裝訂單成功。**

注意：Formspree 為第三方服務，有其方案限制及資料處理條款；顧客聯絡資訊和訂單內容會被傳送至該服務。填入 endpoint 不是保密機制；請勿把密碼、帳號憑證、個人身分證明文件或支付資料放進表單。網站應公布隱私說明並評估適用的個資要求。

本表單**沒有後端驗證價格、防刷單機制、管理後台、會員系統、即時訂單查詢或附件上傳**。買家端金額只能視為初步估價；店主應另行確認所有商品、數量和 Gil 總額，不能信任自行修改的瀏覽器提交內容。若需要正式管理系統，請使用原本 Next.js + Supabase + Vercel 的專案，或另外建立安全的後端。

## 檔案結構

```
index.html       首頁與訂單表單
styles.css       品牌色彩、桌面版及手機版版型
script.js        商品篩選、訂購清單、客製委託與送單
config.js        店主自行編輯的商品與接單設定
.nojekyll        避免 Pages 對靜態檔額外處理
```

## 常見問題

**預覽方法：** 可直接在電腦瀏覽器開啟 `index.html`；建議以上傳 GitHub Pages 後的 HTTPS 網址測試 Formspree 提交。

**為什麼「送出訂購申請」無法使用？** 尚未設定 `formEndpoint`，或設定的網址不是有效 Formspree endpoint。

**圖片在哪裡？** 此版本刻意不使用圖片、SVG 圖示或圖片背景。

**可以自行修改風格嗎？** 可。主要色碼在 `styles.css` 開頭 `:root` 中；右側羊皮紙樣式使用 `.parchment`、背景為 `.marble-area`。

**這是官方 FF14 商店嗎？** 不是。請遵守遊戲使用條款與交易規範。本網站不處理現金扣款，不提供帳號登入或遊戲內自動交易。

官方參考：[GitHub Pages 發布設定](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site) · [Formspree 表單建立](https://help.formspree.io/articles/building-your-form/building-an-html-form)

## V1.3 修改紀錄

- 移除首頁照片、商品圖片、客製橫幅圖片、圖片檔案及相關連結。
- 將商品卡改成純文字內容，不影響分類、Gil 計價、訂單和委託功能。
- 簡化裝飾符號，以字體、邊框及 CSS 色彩建立寶石藍與羊皮紙感。
- GitHub Pages 上傳僅需 5 個檔案，無 assets 目錄。
