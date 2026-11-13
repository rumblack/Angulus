/* 店主可編輯設定：請勿在此放密碼或私人 API 金鑰。 */
window.SHOP_CONFIG = {
  name: '星藍工坊',
  englishName: 'Sapphire Atelier',
  tagline: '遊戲道具製作小舖',
  notice: '本店使用 FF14 遊戲內 Gil 計價。下單後由店主確認庫存、製作時間與交付方式。',
  contactLabel: 'Discord 聯絡店主',
  contactUrl: '', // 例如 https://discord.gg/你的邀請連結 ，留空則隱藏
  formEndpoint: '', // 在 Formspree 建立表單後填入 https://formspree.io/f/xxxxxxxx ，空白時不能線上送單
  products: [
    { id:'chair', name:'華麗書房椅', category:'傢俱', price:250000, days:'2–3 日', image:'assets/chair.webp', badge:'推薦', desc:'為你的居所增添精緻的古典氣息。' },
    { id:'bookshelf', name:'書架組合（大型）', category:'傢俱', price:800000, days:'3–5 日', image:'assets/bookshelf.webp', badge:'熱門', desc:'帶有沉穩木色的典藏書房陳設。' },
    { id:'lamp', name:'寶石燈飾', category:'燈具', price:320000, days:'2–4 日', image:'assets/lamp.webp', badge:'可客製', desc:'藍色寶石與金屬細節相襯。' },
    { id:'custom', name:'專屬客製委託', category:'客製委託', price:null, days:'依需求報價', image:'assets/workshop.webp', badge:'待報價', desc:'請描述想製作的道具、數量與期望交期。' }
  ]
};
