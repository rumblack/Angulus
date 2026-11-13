# Angulus — GitHub Pages V1.3.2

本版從 V1.3.1 更新：
- 全站店名統一為 **Angulus**。
- 刪除首頁右側「ABOUT THE ATELIER」介紹框。
- 首頁 Hero 改為單欄精簡版，縮減標題及上下留白。
- 保留純文字商品卡、Gil 計價、數量按鈕、客製委託、表單與 Formspree 設定方式。

## 更新 GitHub Pages
將 `index.html`、`styles.css`、`script.js`、`config.js` 覆蓋上傳到原本 repository 根目錄。`README.md` 可一併上傳。

## 設定商品及訂單
在 `config.js` 中修改 `products` 及 `formEndpoint`。**GitHub Pages 為靜態網站，不會自行儲存訂單**；表單須連結至 Formspree 等服務，並自行測試正式送單。
