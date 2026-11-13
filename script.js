'use strict';
const config=window.SHOP_CONFIG||{};
const $=id=>document.getElementById(id);
const money=n=>new Intl.NumberFormat('en-US',{maximumFractionDigits:0}).format(n)+' Gil';
const safe=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const products=Array.isArray(config.products)?config.products.filter(p=>p&&p.id&&p.name):[];
const localKey='sapphire-atelier-cart-v1';
let cart={};let custom=[];const shopTabs=['常駐商品','少量購買','裝備訂製','客製化委託'];let currentCategory='常駐商品';
// 裝備訂製：各職業圖示以使用者上傳原始 PNG 名稱核對，並使用版本參數避免舊快取。
// 基礎職業圖示不加入網站；僅使用已確認的正式職業與製作採集職業圖示。
const jobIconByAbbr={AST:"astrologian.png",BRD:"bard.png",BLM:"blackmage.png",ARM:"armorer.png",BSM:"blacksmith.png",ALC:"alchemist.png",MCH:"machinist.png",BLU:"bluemage.png",BTN:"botanist.png",CRP:"carpenter.png",CUL:"culinarian.png",DNC:"dancer.png",DRK:"darkknight.png",DRG:"dragoon.png",FSH:"fisher.png",GSM:"goldsmith.png",GNB:"gunbreaker.png",LTW:"leatherworker.png",PCT:"pictomancer.png",SAM:"samurai.png",VPR:"viper.png",SGE:"sage.png",RPR:"reaper.png",WAR:"warrior.png",SCH:"scholar.png",WVR:"weaver.png",WHM:"whitemage.png",MIN:"miner.png",NIN:"ninja.png",RDM:"redmage.png",PLD:"paladin.png",SMN:"summoner.png",MNK:"monk.png"};
const equipmentJobs={
 '戰鬥裝備':[
  {group:'防護職業',role:'tank',jobs:[['PLD','騎士'],['WAR','戰士'],['DRK','暗黑騎士'],['GNB','絕槍戰士']]},
  {group:'治療職業',role:'healer',jobs:[['WHM','白魔法師'],['SCH','學者'],['AST','占星術士'],['SGE','賢者']]},
  {group:'近戰攻擊',role:'melee',jobs:[['MNK','武僧'],['DRG','龍騎士'],['NIN','忍者'],['SAM','武士'],['RPR','奪魂者'],['VPR','毒蛇劍士']]},
  {group:'遠程物理',role:'ranged',jobs:[['BRD','吟遊詩人'],['MCH','機工士'],['DNC','舞者']]},
  {group:'遠程魔法',role:'caster',jobs:[['BLM','黑魔法師'],['SMN','召喚師'],['RDM','赤魔法師'],['PCT','繪靈法師'],['BLU','青魔法師']]}
 ],
 '製作採集':[
  {group:'製作職業',role:'craft',jobs:[['CRP','刻木匠'],['BSM','鍛鐵匠'],['ARM','鑄甲匠'],['GSM','雕金匠'],['LTW','製革匠'],['WVR','裁縫匠'],['ALC','鍊金術士'],['CUL','烹調師']]},
  {group:'採集職業',role:'gather',jobs:[['MIN','採礦工'],['BTN','園藝工'],['FSH','捕魚人']]}
 ]
};
let selectedEquipmentType='';let selectedEquipmentJob=null;
function chooseEquipmentType(type){
 if(!equipmentJobs[type])return;
 selectedEquipmentType=type; selectedEquipmentJob=null;
 document.querySelectorAll('[data-equipment-type]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.equipmentType===type)));
 $('equipment-job-step').hidden=false;$('equipment-form').hidden=true;
 $('equipment-job-hint').textContent=`已選擇「${type}」，請再選擇要訂製的職業。`;
 $('equipment-job-groups').innerHTML=equipmentJobs[type].map(g=>`<div class="equipment-job-group"><h5>${safe(g.group)}</h5><div class="equipment-job-grid">${g.jobs.map(([abbr,name])=>`<button type="button" class="equipment-job-btn role-${g.role}" data-job-abbr="${safe(abbr)}" data-job-name="${safe(name)}" aria-label="${safe(name)}" aria-pressed="false" title="${safe(name)}">${jobIconByAbbr[abbr]?`<img class="job-icon-img" src="assets/jobs/${jobIconByAbbr[abbr]}?v=1.3.39" alt="" width="48" height="48" loading="lazy">`:`<span class="job-monogram" aria-hidden="true">${safe(abbr)}</span>`}<span class="job-label">${safe(name)}</span></button>`).join('')}</div></div>`).join('');
 $('equipment-job-groups').querySelectorAll('.equipment-job-btn').forEach(b=>b.addEventListener('click',()=>chooseEquipmentJob(b.dataset.jobAbbr,b.dataset.jobName)));
}
function chooseEquipmentJob(abbr,name){
 selectedEquipmentJob={abbr,name};
 document.querySelectorAll('.equipment-job-btn').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.jobAbbr===abbr)));
 $('equipment-selection-summary').textContent=`已選擇：${selectedEquipmentType} ／ ${name}`;
 $('equipment-form').hidden=false;$('equipment-status').textContent='';
}
try{const saved=JSON.parse(localStorage.getItem(localKey)||'{}');if(saved&&typeof saved==='object'){for(const p of products){const q=Number(saved[p.id]);if(Number.isInteger(q)&&q>0&&q<=99&&p.price!==null)cart[p.id]=q;}}}catch(e){}
function save(){try{localStorage.setItem(localKey,JSON.stringify(cart));}catch(e){}}
function setup(){// Keep document.title from HTML head, matching Open Graph preview metadata.
 $('brand-name').textContent=config.name||'Angulus';$('footer-name').textContent=config.name||'Angulus';$('shop-notice').textContent=config.notice||'本店使用 FF14 遊戲內 Gil 計價。';if(config.contactUrl&&/^https:\/\//.test(config.contactUrl)){$('contact-link').href=config.contactUrl;$('contact-link').textContent=config.contactLabel||'聯絡店主';$('contact-link').hidden=false;}
 $('menu-toggle').addEventListener('click',()=>{const open=$('nav').classList.toggle('open');$('menu-toggle').setAttribute('aria-expanded',String(open));});document.querySelectorAll('#nav a').forEach(a=>a.addEventListener('click',()=>{$('nav').classList.remove('open');$('menu-toggle').setAttribute('aria-expanded','false');}));document.querySelectorAll('a[href="#shop"]').forEach(a=>a.addEventListener('click',()=>selectCategory('常駐商品')));
 const navCustom=$('nav-open-custom');if(navCustom)navCustom.addEventListener('click',e=>{e.preventDefault();selectCategory('客製化委託');location.hash='commission';});
 $('custom-form').addEventListener('submit',e=>{e.preventDefault();const name=$('custom-name').value.trim()||'客製化委託';const detail=$('custom-detail').value.trim();const status=$('custom-status');if(detail.length<5){status.textContent='請至少填寫 5 個字的製作需求。';status.className='custom-status error';$('custom-detail').focus();return;}custom.push({name,detail});$('custom-form').reset();status.textContent='已加入右側訂購申請單，可繼續填寫其他委託。';status.className='custom-status success';renderCart();});
 document.querySelectorAll('[data-equipment-type]').forEach(b=>b.addEventListener('click',()=>chooseEquipmentType(b.dataset.equipmentType)));
 $('equipment-back-type').addEventListener('click',()=>{selectedEquipmentType='';selectedEquipmentJob=null;$('equipment-job-step').hidden=true;$('equipment-form').hidden=true;document.querySelectorAll('[data-equipment-type]').forEach(b=>b.setAttribute('aria-pressed','false'));});
 $('equipment-back-job').addEventListener('click',()=>{selectedEquipmentJob=null;$('equipment-form').hidden=true;document.querySelectorAll('.equipment-job-btn').forEach(b=>b.setAttribute('aria-pressed','false'));});
 $('equipment-form').addEventListener('submit',e=>{
  e.preventDefault();
  const name=$('equipment-name').value.trim();
  if(!selectedEquipmentType||!selectedEquipmentJob)return;
  const qty=Number($('equipment-qty').value);
  const details=$('equipment-details').value.trim();
  const status=$('equipment-status');
  if(!name||!Number.isInteger(qty)||qty<1||qty>99||details.length<5){
   status.textContent='請填寫裝備名稱、1–99 的訂製數量，以及至少 5 個字的需求說明。';
   status.className='custom-status error';return;
  }
  custom.push({name:'【裝備訂製】'+name,detail:`大類：${selectedEquipmentType}\n職業：${selectedEquipmentJob.name}（${selectedEquipmentJob.abbr}）\n數量：${qty} 件\n${details}`,type:'裝備訂製',equipmentType:selectedEquipmentType,equipmentJob:selectedEquipmentJob.name,quantity:qty});
  $('equipment-form').reset();status.textContent='裝備訂製已加入右側申請單，待店主報價。';status.className='custom-status success';renderCart();
 });
 $('checkout-form').addEventListener('submit',submitOrder);if(location.hash==='#commission')currentCategory='客製化委託';renderFilters();renderProducts();renderCart();}
function categories(){return shopTabs;}
function categoryOf(p){if(p.price===null)return '客製化委託';const c=p.shopCategory||p.category;return shopTabs.includes(c)?c:'常駐商品';}
function selectCategory(c){if(!shopTabs.includes(c))return;currentCategory=c;renderFilters();renderProducts();}
function renderFilters(){
 $('filters').innerHTML=categories().map(c=>`<button type="button" role="tab" class="${c===currentCategory?'active':''}" data-cat="${safe(c)}" aria-selected="${c===currentCategory}" aria-controls="${c==='客製化委託'?'commission':c==='裝備訂製'?'equipment':'products'}">${safe(c)}</button>`).join('');
 $('filters').querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>selectCategory(b.dataset.cat)));
}
function changeQuantity(id,delta){
 const p=products.find(x=>x.id===id);if(!p||p.price===null)return;
 const next=Math.max(0,Math.min(99,(cart[id]||0)+delta));if(next)cart[id]=next;else delete cart[id];
 save();renderProducts();renderCart();
}
function renderProducts(){
 const customTab=currentCategory==='客製化委託';const equipmentTab=currentCategory==='裝備訂製';$('products').hidden=customTab||equipmentTab;$('commission').hidden=!customTab;$('equipment').hidden=!equipmentTab;$('products').setAttribute('aria-label',currentCategory);if(customTab||equipmentTab)return;
 const shown=products.filter(p=>p.price!==null&&categoryOf(p)===currentCategory);
 $('products').innerHTML=shown.map(p=>{
  const customItem=p.price===null;const qty=cart[p.id]||0;
  const action=customItem?`<button type="button" class="add-product" data-id="${safe(p.id)}">填寫委託需求</button>`:
   `<div class="product-purchase"><strong class="price">${money(p.price)}</strong><div class="product-qty" role="group" aria-label="${safe(p.name)}數量調整"><button class="product-qty-btn" type="button" data-id="${safe(p.id)}" data-delta="-1" aria-label="減少${safe(p.name)}數量" ${qty===0?'disabled':''}>−</button><span class="product-qty-value" aria-live="polite">${qty}</span><button class="product-qty-btn" type="button" data-id="${safe(p.id)}" data-delta="1" aria-label="增加${safe(p.name)}數量" ${qty===99?'disabled':''}>＋</button></div></div>`;
  return `<article class="product-card"><div class="product-info"><small class="product-category">${safe(p.category||'精選商品')}</small><h3>${safe(p.name)}</h3><p>${safe(p.desc||'')}</p><div class="product-bottom">${customItem?'<strong class="price">另行報價</strong>':''}${action}</div></div></article>`;
 }).join('')||'<p class="category-empty">目前沒有此分類商品，請稍後再查看。</p>';
 $('products').querySelectorAll('.product-qty-btn').forEach(b=>b.addEventListener('click',()=>changeQuantity(b.dataset.id,Number(b.dataset.delta))));

}
function renderCart(){const entries=products.filter(p=>cart[p.id]>0&&p.price!==null);const count=entries.reduce((n,p)=>n+cart[p.id],0)+custom.length;$('nav-count').textContent=count;const html=entries.map(p=>`<div class="cart-line"><div><strong>${safe(p.name)}</strong><small>${money(p.price)} / 件</small></div><div class="cart-action"><strong>${money(p.price*cart[p.id])}</strong><div class="quantity-control" role="group" aria-label="${safe(p.name)}數量調整"><button class="quantity-btn" type="button" data-action="minus" data-id="${safe(p.id)}" aria-label="減少${safe(p.name)}數量">−</button><span class="quantity-value" aria-live="polite">${cart[p.id]}</span><button class="quantity-btn" type="button" data-action="plus" data-id="${safe(p.id)}" aria-label="增加${safe(p.name)}數量">＋</button></div></div></div>`).join('');const customHtml=custom.map((x,i)=>`<div class="cart-line"><div><strong>${safe(x.name)}</strong><small>${safe(x.detail.slice(0,60))}</small></div><div class="cart-action"><strong>待報價</strong><button type="button" class="remove" data-action="remove-custom" data-index="${i}">移除</button></div></div>`).join('');$('cart-items').innerHTML=html+customHtml||'<div class="empty-cart"><p>尚未選擇商品</p><small>請先從左側挑選商品<br>並將需要的項目加入訂單。</small></div>';
 $('cart-items').querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{const a=b.dataset.action;if(a==='remove-custom'){custom.splice(Number(b.dataset.index),1);}else{const id=b.dataset.id;cart[id]=Math.max(0,Math.min(99,(cart[id]||0)+(a==='plus'?1:-1)));if(!cart[id])delete cart[id];save();}renderCart();renderProducts();}));$('cart-total').textContent=money(entries.reduce((n,p)=>n+p.price*cart[p.id],0));$('quote-note').hidden=!custom.length;}
function orderData(){const fd=new FormData($('checkout-form'));const chosen=products.filter(p=>cart[p.id]>0&&p.price!==null);const items=chosen.map(p=>({id:p.id,name:p.name,unit_price:p.price,qty:cart[p.id],subtotal:p.price*cart[p.id]}));const total=items.reduce((v,p)=>v+p.subtotal,0);return {shop:config.name||'Angulus',character:String(fd.get('character')||'').trim(),server:String(fd.get('server')||'').trim(),contact:String(fd.get('contact')||'').trim(),deliveryDate:String(fd.get('deliveryDate')||''),deliveryTime:String(fd.get('deliveryTime')||'').trim(),notes:String(fd.get('notes')||'').trim(),items,custom,estimated_gil:total,requires_quote:custom.length>0,created_at:new Date().toISOString()};}
function orderText(d){return [`【${d.shop}】訂購申請`,`角色名稱：${d.character}`,`伺服器：${d.server}`,`聯絡方式：${d.contact}`,`希望交貨：${d.deliveryDate||'未填寫'}`,`方便時段：${d.deliveryTime||'未填寫'}`,'','【固定商品】',...d.items.map(p=>`${p.name} × ${p.qty}｜${money(p.subtotal)}`),'',`訂單小記：${money(d.estimated_gil)}`,...(d.requires_quote?['＊另含客製委託，總額待報價。']:[]),'','【客製委託】',...(d.custom.map((x,i)=>`${i+1}. ${x.name}\n${x.detail}`)),'','備註：'+(d.notes||'無'),'申請時間：'+d.created_at].join('\n');}
async function submitOrder(e){e.preventDefault();const s=$('form-status');s.className='form-status';if(!Object.keys(cart).length&&!custom.length){s.textContent='請先選擇商品或填寫客製委託。';s.classList.add('error');return;}const endpoint=String(config.formEndpoint||'').trim();if(!/^https:\/\/formspree\.io\/f\/[a-zA-Z0-9]+$/.test(endpoint)){s.classList.add('error');s.textContent='店主尚未設定線上收單服務，現階段無法送出。請聯絡店主；亦可先截圖訂單內容。';return;}const d=orderData();const button=$('submit-order');button.disabled=true;button.textContent='正在傳送訂單…';try{const r=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify({name:d.character,email:d.contact.includes('@')?d.contact:undefined,character:d.character,server:d.server,contact:d.contact,deliveryDate:d.deliveryDate,deliveryTime:d.deliveryTime,message:orderText(d),order_json:JSON.stringify(d)})});if(!r.ok)throw Error('伺服器未接受此訂單（HTTP '+r.status+'）');s.textContent='訂單申請已傳送！請保留聯絡資訊並等候店主回覆。';cart={};custom=[];save();renderCart();renderProducts();$('checkout-form').reset();}catch(err){s.classList.add('error');s.textContent='送單失敗：'+err.message+'。商品仍留在訂購單中，請稍後再試。';}finally{button.disabled=false;button.textContent='送出訂購申請';}}
document.addEventListener('DOMContentLoaded',setup);
