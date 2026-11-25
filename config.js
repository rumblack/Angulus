/* 店主可編輯設定：請勿在此放密碼或私人 API 金鑰。 */
window.SHOP_CONFIG = {
  name: 'Angulus',
  tagline: '道具製作小舖',
  notice: '本店所有商品皆以 FF14 遊戲內貨幣 Gil 計價。',
  contactLabel: 'Discord 聯絡店主',
  contactUrl: '', // 例如 https://discord.gg/你的邀請連結 ，留空則隱藏
  googleScriptUrl: 'https://script.google.com/macros/s/AKfycbw9wIt64Onps7LeJGWG2ccVwRzA3BrX2bnSW6ydkGC_OrGfbeqHMU8Db1abA--dNGwS/exec', // 貼上 Apps Script 網頁應用程式 /exec 網址，啟用 Google 試算表接單
  orderBackend: 'google', // google: Google Sheets；formspree: 原有備援
  formEndpoint: 'https://formspree.io/f/xbgodgak', // 在 Formspree 建立表單後填入 https://formspree.io/f/xxxxxxxx ，空白時不能線上送單
  // 裝備顯示文字：key 必須與網站原有裝備名稱一致，以保留 Google 後端固定價識別。
  equipmentDisplay: {
    '典禮套裝（740）': { name: '典禮套裝', note: '品級 740' },
    '宮廷愛人（770/7.4）': { name: '宮廷愛人', note: '品級 770・7.4' },
    '雀翎套裝＋金拇指工具組（750）': { name: '雀翎＋金拇指工具組', note: '品級 750' }
  },
  products: [
    { id:'artificial-dark-matter-trio', pack:'3 件', name:'人造暗物質三件套', category:'常駐商品', price:20000, days:'依店主確認', desc:'內含人造暗物質 α、β、γ 各一份。聽說幻境村的工匠們正需要這些材料，或許能為你的冒險派上用場。' },
    { id:'mountain-tea-999', pack:'999 杯', name:'高山茶一組', category:'常駐商品', price:329000, days:'依店主確認', badge:'常駐', desc:'前往舊薩雷安時，不妨多備一些——說不定當地的人們正需要這份暖心茶香。' },
    { id:'mate-cookies-99', pack:'99 塊', name:'高級瑪黛茶餅乾', category:'常駐商品', price:69000, days:'依店主確認', badge:'常駐', desc:'香甜酥脆，是陪伴你踏上旅途、探索未知的最佳良伴。' },
    { id:'grade3-strength-potion-99', pack:'99 瓶', name:'3級剛力之寶藥', category:'常駐商品', price:128000, days:'依店主確認', badge:'常駐', desc:'蘊含強化力量的藥效，為奮戰在前線的冒險者增添一份助力。' },
    { id:'grade3-intelligence-potion-99', pack:'99 瓶', name:'3級智力之寶藥', category:'常駐商品', price:128000, days:'依店主確認', badge:'常駐', desc:'能夠提升智力的寶藥，為施展法術與迎接挑戰做好準備。' },
    { id:'grade3-mind-potion-99', pack:'99 瓶', name:'3級意力之寶藥', category:'常駐商品', price:128000, days:'依店主確認', badge:'常駐', desc:'能夠提升精神的寶藥，為守護同伴的旅途增添一份安心。' },
    { id:'grade3-dexterity-potion-99', pack:'99 瓶', name:'3級巧力之寶藥', category:'常駐商品', price:128000, days:'依店主確認', badge:'常駐', desc:'蘊含提升靈巧的藥效，讓每一次出手更加俐落，陪伴冒險者從容迎接挑戰。' },
    // 少量購買：高山茶每份 99 杯，餅乾每份 10 塊、寶藥每份 10 瓶。
    // 少量購買價格：餅乾每份 6,000 Gil；四種寶藥每組 13,000 Gil。
    { id:'mountain-tea-99', pack:'99 杯', name:'一小份高山茶', category:'少量購買', price:32500, days:'依店主確認', badge:'少量', desc:'前往舊薩雷安時，不妨備上一小份暖心茶香，說不定正好能派上用場。' },
    { id:'mate-cookies-10', pack:'10 塊', name:'高級瑪黛茶餅乾', category:'少量購買', price:6000, days:'依店主確認', badge:'少量', desc:'香甜酥脆，是陪伴你踏上旅途、探索未知的最佳良伴。' },
    { id:'grade3-strength-potion-10', pack:'10 瓶', name:'3級剛力之寶藥', category:'少量購買', price:13000, days:'依店主確認', badge:'少量', desc:'蘊含強化力量的藥效，為奮戰在前線的冒險者增添一份助力。' },
    { id:'grade3-intelligence-potion-10', pack:'10 瓶', name:'3級智力之寶藥', category:'少量購買', price:13000, days:'依店主確認', badge:'少量', desc:'能夠提升智力的寶藥，為施展法術與迎接挑戰做好準備。' },
    { id:'grade3-mind-potion-10', pack:'10 瓶', name:'3級意力之寶藥', category:'少量購買', price:13000, days:'依店主確認', badge:'少量', desc:'能夠提升精神的寶藥，為守護同伴的旅途增添一份安心。' },
    { id:'grade3-dexterity-potion-10', pack:'10 瓶', name:'3級巧力之寶藥', category:'少量購買', price:13000, days:'依店主確認', badge:'少量', desc:'蘊含提升靈巧的藥效，讓每一次出手更加俐落，陪伴冒險者從容迎接挑戰。' },
    { id:'custom', name:'專屬客製委託', category:'客製委託', price:null, days:'依需求報價', badge:'待報價', desc:'請描述想製作的道具、數量與期望交期。' }
  ]
};
