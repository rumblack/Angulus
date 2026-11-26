'use strict';
const config=window.SHOP_CONFIG||{};
const $=id=>document.getElementById(id);
const money=n=>new Intl.NumberFormat('en-US',{maximumFractionDigits:0}).format(n)+' Gil';
// 顯示用規格；資料送往後台仍使用原始商品名稱。
const packName=p=>p.pack?`${p.name}（${p.pack}）`:p.name;
const moneyHtml=n=>new Intl.NumberFormat('en-US',{maximumFractionDigits:0}).format(n)+'<span class="gil">Gil</span>';
const safe=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let products=Array.isArray(config.products)?config.products.filter(p=>p&&p.id&&p.name&&p.price!==null):[];
let catalogReady=false;let catalogFailed=false;
const catalogUrl=String(config.googleScriptUrl||'').trim();
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
// V1.4.04：套裝／訂製方式完全由 Apps Script 公開唯讀資料提供。
// ID 僅作管理用途；訂單仍以大類＋套裝名稱＋訂製方式由後端核價。
let equipmentEntries=[];
const equipmentNameOptions=()=>Object.fromEntries(Object.keys(equipmentJobs).map(type=>[
 type,[...new Set(equipmentEntries.filter(x=>x.type===type).map(x=>x.name)),'其他']
]));
// V1.4.05：試算表新套裝自動拆分名稱與品級；config.js 已設定者沿用店主指定顯示。
function equipmentLabel(name){
 const raw=String(name||'').trim();
 const preset=config.equipmentDisplay?.[raw];
 if(preset)return {name:preset.name||raw,note:preset.note||''};
 const match=raw.match(/^(.*?)\s*[（(]\s*(\d{2,4})(?:\s*[/／]\s*(\d+(?:\.\d+)?))?\s*[）)]$/);
 if(!match||!match[1].trim())return {name:raw,note:''};
 return {name:match[1].trim(),note:'品級 '+match[2]+(match[3]?'・'+match[3]:'')};
}
const equipmentChoice=(type,name,mode)=>equipmentEntries.find(x=>x.type===type&&x.name===name&&x.mode===mode)||null;
const fixedSpec=(type,name,mode)=>{
 const entry=equipmentChoice(type,name,mode);
 return entry&&entry.pricing==='固定售價'&&Number.isSafeInteger(entry.price)&&entry.price>0?
  {price:entry.price,description:entry.description,id:entry.id}:null;
};
const fixedSpecForItem=x=>x?.type==='裝備訂製'?fixedSpec(x.equipmentType,x.equipmentName,x.equipmentSet):null;
const pricedCommissionSubtotal=x=>{const spec=fixedSpecForItem(x);return spec?spec.price*Number(x.quantity||0):null;};
function refreshEquipmentCart(){
 const removed=[];
 custom=custom.filter(x=>{
  if(x.type!=='裝備訂製'||x.equipmentName==='其他')return true;
  const e=equipmentChoice(x.equipmentType,x.equipmentName,x.equipmentSet);
  if(e)return true;
  removed.push(x.name);return false;
 });
 return removed;
}
let selectedEquipmentType='';let selectedEquipmentJob=null;let selectedEquipmentName='';let selectedEquipmentSet='';
function selectedFixedEquipment(){return selectedEquipmentJob?fixedSpec(selectedEquipmentType,selectedEquipmentName,selectedEquipmentSet):null;}
function selectedFixedEquipmentIndex(){return custom.findIndex(x=>x.equipmentJob===selectedEquipmentJob?.name&&x.equipmentType===selectedEquipmentType&&x.equipmentName===selectedEquipmentName&&x.equipmentSet===selectedEquipmentSet&&fixedSpecForItem(x));}
function fixedEquipmentDetail(qty,spec){return `大類：${selectedEquipmentType}\n職業：${selectedEquipmentJob.name}（${selectedEquipmentJob.abbr}）\n訂製方式：${selectedEquipmentSet}（${spec.description}）\n數量：${qty} 套\n固定售價：每套 ${spec.price.toLocaleString('en-US')} Gil`;}
function updateFixedEquipmentUI(){
 const box=$('equipment-fixed-purchase'),fields=$('equipment-quote-fields');if(!box||!fields)return;
 const spec=selectedFixedEquipment();box.hidden=!spec;fields.hidden=!!spec||!selectedEquipmentName||(selectedEquipmentName!=='其他'&&!selectedEquipmentSet);
 if(!spec)return;
 $('equipment-fixed-name').textContent=`${equipmentLabel(selectedEquipmentName).name}｜${selectedEquipmentSet}`;
 $('equipment-fixed-description').textContent=spec.description;
 $('equipment-fixed-price').innerHTML=moneyHtml(spec.price)+'<span class="price-per-set">／套</span>';
 $('equipment-fixed-quantity').setAttribute('aria-label',`${selectedEquipmentName} ${selectedEquipmentSet}數量調整`);
 const idx=selectedFixedEquipmentIndex(),qty=idx<0?0:Number(custom[idx].quantity||0);
 $('equipment-fixed-count').textContent=String(qty);
 $('equipment-fixed-add').hidden=qty>0;
 $('equipment-fixed-add').textContent=`加入訂購申請單（${money(spec.price)}）`;
 $('equipment-fixed-quantity').hidden=qty<=0;
 $('equipment-fixed-minus').disabled=qty<=0;
 $('equipment-fixed-plus').disabled=qty>=99;
}
function adjustFixedEquipmentQuantity(delta){
 if(!catalogReady){showCatalogNotice(CATALOG_MSG.notReady);return;}
 const spec=selectedFixedEquipment();if(!spec||!Number.isInteger(delta))return;
 const idx=selectedFixedEquipmentIndex(),old=idx<0?0:Number(custom[idx].quantity||0);
 const qty=Math.max(0,Math.min(99,old+delta));if(qty===old)return;
 if(qty===0){if(idx>=0)custom.splice(idx,1);}
 else if(idx>=0){custom[idx].quantity=qty;custom[idx].detail=fixedEquipmentDetail(qty,spec);}
 else{custom.push({name:`【裝備訂製】${selectedEquipmentName}／${selectedEquipmentSet}${spec.description?'（'+spec.description+'）':''}｜${selectedEquipmentJob.name}`,
  detail:fixedEquipmentDetail(qty,spec),type:'裝備訂製',equipmentType:selectedEquipmentType,
  equipmentJob:selectedEquipmentJob.name,equipmentName:selectedEquipmentName,equipmentSet:selectedEquipmentSet,quantity:qty});}
 renderCart();updateFixedEquipmentUI();
 const status=$('equipment-status');status.className='custom-status success';
 if(delta>0)pulseMobileOrderBar();
 status.textContent=qty>0?`已將 ${qty} 套${equipmentLabel(selectedEquipmentName).name}（${selectedEquipmentSet}）登記於訂購申請單，合計 ${money(qty*spec.price)}。`:'已從訂購申請單移除此項套裝。';
}
function updateEquipmentSetChoices(){
 const field=$('equipment-set-field');if(!field)return;
 const show=!!selectedEquipmentName&&selectedEquipmentName!=='其他';field.hidden=!show;
 const modes=equipmentEntries.filter(x=>x.type===selectedEquipmentType&&x.name===selectedEquipmentName);
 const holder=$('equipment-set-options');
 holder.innerHTML=modes.map(x=>`<button type="button" class="equipment-set-choice" data-equipment-set="${safe(x.mode)}" aria-pressed="${String(selectedEquipmentSet===x.mode)}"><strong>${safe(x.mode)}</strong><small>${safe(x.description|| (x.pricing==='待報價'?'請填寫詳細需求':'固定價格'))}</small></button>`).join('');
 holder.querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{
  selectedEquipmentSet=b.dataset.equipmentSet;updateEquipmentSetChoices();$('equipment-status').textContent='';
 }));
 const hint=$('equipment-set-hint');hint.hidden=!!selectedEquipmentSet;
 hint.textContent='請選擇訂製方式。';
 updateFixedEquipmentUI();
}
function renderEquipmentNameOptions(){
 const holder=$('equipment-name-options');
 if(!holder)return;
 selectedEquipmentName='';selectedEquipmentSet='';
 $('equipment-details').placeholder='請填寫裝備等級、品質、特殊要求、希望交期或其他細節';
 updateEquipmentSetChoices();
 holder.innerHTML=(equipmentNameOptions()[selectedEquipmentType]||[]).map(name=>{
  const label=equipmentLabel(name);const parts=[label.name,label.note];
  return `<button type="button" class="equipment-name-choice" data-equipment-name="${safe(name)}" aria-pressed="false"><strong>${safe(parts[0])}</strong>${parts[1]?`<small>${safe(parts[1])}</small>`:''}</button>`;
 }).join('');
 holder.querySelectorAll('button').forEach(button=>button.addEventListener('click',()=>{
  selectedEquipmentName=button.dataset.equipmentName;
  selectedEquipmentSet='';
  $('equipment-details').placeholder=selectedEquipmentName==='其他'?'請填寫想訂製的裝備名稱、等級、品質及其他需求':'請填寫裝備等級、品質、特殊要求、希望交期或其他細節';
  holder.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
  updateEquipmentSetChoices();
  $('equipment-name-hint').hidden=true;
  $('equipment-status').textContent='';
 }));
 $('equipment-name-hint').hidden=false;
 $('equipment-name-hint').textContent='請選擇裝備名稱。';
}

// 三段式訂製流程：完成後顯示摘要，修改前段時重置後段尚未提交的選擇。
function resetEquipmentFlow(stage){
 if(stage==='type'){
  selectedEquipmentType='';
  $('equipment-category-step').hidden=false;
  $('equipment-category-summary').hidden=true;
  $('equipment-job-step').hidden=true;
  document.querySelectorAll('[data-equipment-type]').forEach(b=>b.setAttribute('aria-pressed','false'));
 }else if(stage==='job'){
  $('equipment-category-step').hidden=true;
  $('equipment-category-summary').hidden=false;
  $('equipment-job-step').hidden=false;
 }
 selectedEquipmentJob=null;selectedEquipmentName='';selectedEquipmentSet='';
 $('equipment-job-summary').hidden=true;
 $('equipment-form').hidden=true;
 $('equipment-form').reset();
 $('equipment-details').placeholder='請填寫裝備等級、品質、特殊要求、希望交期或其他細節';
 $('equipment-status').textContent='';
 $('equipment-name-hint').hidden=false;
 $('equipment-set-hint').hidden=false;
 document.querySelectorAll('.equipment-job-btn').forEach(b=>b.setAttribute('aria-pressed','false'));
 renderEquipmentNameOptions();
}
function chooseEquipmentType(type){
 if(!equipmentJobs[type])return;
 resetEquipmentFlow('type');
 selectedEquipmentType=type;
 document.querySelectorAll('[data-equipment-type]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.equipmentType===type)));
 $('equipment-category-step').hidden=true;
 $('equipment-category-summary').hidden=false;
 $('equipment-summary-type').textContent=type;
 $('equipment-job-step').hidden=false;
 $('equipment-job-hint').textContent='請選擇職業。';
 $('equipment-job-groups').innerHTML=equipmentJobs[type].map(g=>`<div class="equipment-job-group"><h5>${safe(g.group)}</h5><div class="equipment-job-grid">${g.jobs.map(([abbr,name])=>`<button type="button" class="equipment-job-btn role-${g.role}" data-job-abbr="${safe(abbr)}" data-job-name="${safe(name)}" aria-label="${safe(name)}" aria-pressed="false" title="${safe(name)}">${jobIconByAbbr[abbr]?`<img class="job-icon-img" src="assets/jobs/${jobIconByAbbr[abbr]}?v=1.3.72" alt="" width="48" height="48" loading="lazy">`:`<span class="job-monogram" aria-hidden="true">${safe(abbr)}</span>`}<span class="job-label">${safe(name)}</span></button>`).join('')}</div></div>`).join('');
 $('equipment-job-groups').querySelectorAll('.equipment-job-btn').forEach(b=>b.addEventListener('click',()=>chooseEquipmentJob(b.dataset.jobAbbr,b.dataset.jobName)));
}
function chooseEquipmentJob(abbr,name){
 selectedEquipmentJob={abbr,name};
 selectedEquipmentName='';selectedEquipmentSet='';
 renderEquipmentNameOptions();
 $('equipment-job-step').hidden=true;
 $('equipment-job-summary').hidden=false;
 $('equipment-summary-job').textContent=name;
 $('equipment-form').hidden=false;
 $('equipment-status').textContent='';
 updateFixedEquipmentUI();
}
try{const saved=JSON.parse(localStorage.getItem(localKey)||'{}');if(saved&&typeof saved==='object'){for(const [id,value] of Object.entries(saved)){const q=Number(value);if(/^[a-z0-9][a-z0-9-]{1,79}$/.test(id)&&Number.isInteger(q)&&q>0&&q<=99)cart[id]=q;}}}catch(e){}
function save(){try{localStorage.setItem(localKey,JSON.stringify(cart));}catch(e){}}
/** 以 Apps Script 公開唯讀 JSONP 載入商品，GitHub Pages 無須同源伺服器。
 * 只有此公開商品端點可使用 JSONP，且絕不包含訂單或客戶資料。
 */
// V1.4.02：商品同步相關的客人提示（店主口吻）
const CATALOG_MSG={
 loading:'店主正在清點貨架，同步最新的商品與價格……',
 notReady:'店主還在清點貨架，請等最新價格同步完成後再挑選。',
 failed:'暫時聯繫不上工坊的帳房。為了不讓你以舊價格成交，店主先暫停了接單，請稍候片刻再重新整理頁面。',
 invalid:'工坊帳簿的商品紀錄出了點狀況，店主暫停了接單。請稍後再來，或直接聯絡店主。',
 notSet:'工坊的帳簿尚未開張，暫時無法接受委託，請直接聯絡店主。',
 blocked:'帳房還沒核對完最新價格，委託暫時無法送出。請重新整理頁面後再試一次。',
 removed:'店主清點貨架時發現，下列品項已暫停供應，已從你的訂購申請單取下：',
 removedSome:'店主清點貨架時發現，你先前挑選的部分品項已暫停供應，已從訂購申請單取下。'
};
function loadManagedCatalog(){
 if(!/^https:\/\/script\.google\.com\/macros\/s\/[^/]+\/exec$/.test(catalogUrl)){
  catalogFailed=true;showCatalogNotice(CATALOG_MSG.notSet);return;
 }
 const callback='angulusCatalog_'+Math.random().toString(36).slice(2)+'_'+Date.now();
 const node=document.createElement('script');let settled=false;
 const clean=()=>{clearTimeout(timer);node.remove();try{delete window[callback];}catch(e){window[callback]=undefined;}};
 const fail=()=>{if(settled)return;settled=true;clean();catalogFailed=true;showCatalogNotice(CATALOG_MSG.failed);renderProducts();};
 const timer=setTimeout(fail,12000);
 window[callback]=data=>{
  if(settled)return;settled=true;clean();
  if(!data||data.ok!==true||!Array.isArray(data.products)){catalogFailed=true;showCatalogNotice(CATALOG_MSG.invalid);renderProducts();return;}
  // V1.4.02：逐筆檢查，格式有誤的商品只隱藏該筆，不讓整間店停擺
  const ids=new Set();
  const accepted=data.products.filter(x=>{
   const ok=x&&/^[a-z0-9][a-z0-9-]{1,79}$/.test(x.id)&&['常駐商品','少量購買'].includes(x.category)&&typeof x.name==='string'&&x.name.trim()!==''&&Number.isSafeInteger(x.price)&&x.price>0&&!ids.has(x.id);
   if(ok)ids.add(x.id);return ok;
  });
  const skipped=data.products.length-accepted.length;
  if(skipped)console.warn(`Angulus：商品價格表有 ${skipped} 筆資料格式異常，已暫時隱藏。`);
  if(!accepted.length){catalogFailed=true;showCatalogNotice(CATALOG_MSG.invalid);renderProducts();return;}
  const before=products;const prev=cart;const next={};const removed=[];
  products=accepted.map(x=>({...x,pack:String(x.pack||''),desc:String(x.desc||''),badge:String(x.badge||'')}));
  for(const [id,value] of Object.entries(prev)){
   const qty=Number(value);
   if(products.some(p=>p.id===id)&&Number.isInteger(qty)&&qty>0&&qty<=99)next[id]=qty;
   else removed.push(before.find(p=>p.id===id)?.name||'');
  }
  cart=next;save();
  // V1.4.05：裝備資料與一般商品隔離；異常／重複方案逐筆略過，不中斷一般商品販售。
  // 若後端未提供 equipment，保留「其他」自由委託，既有固定價方案一律不使用快取。
  const equipmentRows=Array.isArray(data.equipment)?data.equipment:[];
  const seenEquipmentIds=new Set(),seenEquipmentModes=new Set();
  equipmentEntries=equipmentRows.filter(x=>{
   if(!x||typeof x.id!=='string'||!/^[a-z0-9][a-z0-9-]{1,79}$/.test(x.id)
      ||!['戰鬥裝備','製作採集'].includes(x.type)
      ||typeof x.name!=='string'||!x.name.trim()||x.name.length>100
      ||typeof x.mode!=='string'||!x.mode.trim()||x.mode.length>50
      ||!['固定售價','待報價'].includes(x.pricing))return false;
   const key=JSON.stringify([x.type,x.name.trim(),x.mode.trim()]);
   if(seenEquipmentIds.has(x.id)||seenEquipmentModes.has(key))return false;
   if(x.pricing==='固定售價'&&(!Number.isSafeInteger(x.price)||x.price<=0||x.price>1000000000))return false;
   seenEquipmentIds.add(x.id);seenEquipmentModes.add(key);
   return true;
  }).map(x=>({...x,name:x.name.trim(),mode:x.mode.trim(),price:x.pricing==='固定售價'?x.price:0,description:String(x.description||'').slice(0,200)}));
  if(equipmentRows.length!==equipmentEntries.length)console.warn('Angulus：'+(equipmentRows.length-equipmentEntries.length)+' 筆裝備方案異常或重複，已暫時隱藏。');
  if(!Array.isArray(data.equipment))console.warn('Angulus：未收到裝備訂製清單；僅開放「其他」自由委託，一般商品照常販售。');
  const removedEquipment=refreshEquipmentCart();
  if(removedEquipment.length)console.warn('Angulus：已移除下架裝備訂製：'+removedEquipment.join('、'));
  catalogReady=true;catalogFailed=false;
  const named=removed.concat(removedEquipment).filter(Boolean);
  showCatalogNotice(!removed.length&&!removedEquipment.length?'':named.length?CATALOG_MSG.removed+named.join('、')+'。':CATALOG_MSG.removedSome);
  applyReorderFromReceipt();renderProducts();renderCart();renderEquipmentNameOptions();updateFixedEquipmentUI();
 };
 node.onerror=fail;
 node.src=catalogUrl+'?action=catalog&callback='+encodeURIComponent(callback)+'&_='+Date.now();
 document.head.appendChild(node);
}
function showCatalogNotice(message){const el=$('catalog-notice');if(!el)return;el.hidden=!message;el.textContent=message;}

function refreshMobileOrderBar(count,total){
 const bar=$('mobile-order-bar');if(!bar)return;
 bar.hidden=count<=0;
 const distinct=products.filter(p=>cart[p.id]>0&&p.price!==null).length+custom.length;
 $('mobile-order-count').textContent=`${distinct} 項・${count} 件`;
 $('mobile-order-total').textContent=money(total);
}
function pulseMobileOrderBar(){
 const bar=$('mobile-order-bar');if(!bar||bar.hidden)return;
 bar.classList.remove('is-pulsing');void bar.offsetWidth;bar.classList.add('is-pulsing');
}

function setup(){// Keep document.title from HTML head, matching Open Graph preview metadata.
 const orderPanel=$('order');
 if(orderPanel&&'IntersectionObserver' in window){
  const observer=new IntersectionObserver(entries=>{
    const bar=$('mobile-order-bar');if(!bar)return;
    bar.classList.toggle('is-near-order',entries[0].isIntersecting);
  },{threshold:0,rootMargin:'0px 0px -24px 0px'});
  observer.observe(orderPanel);
 }

 $('brand-name').textContent=config.name||'Angulus';$('footer-name').textContent=config.name||'Angulus';$('shop-notice').textContent=config.notice||'本店使用 FF14 遊戲內 Gil 計價。';if(config.contactUrl&&/^https:\/\//.test(config.contactUrl)){$('contact-link').href=config.contactUrl;$('contact-link').textContent=config.contactLabel||'聯絡店主';$('contact-link').hidden=false;}
 $('menu-toggle').addEventListener('click',()=>{const open=$('nav').classList.toggle('open');$('menu-toggle').setAttribute('aria-expanded',String(open));$('menu-toggle').textContent=open?'關閉':'選單';});document.querySelectorAll('#nav a').forEach(a=>a.addEventListener('click',()=>{$('nav').classList.remove('open');$('menu-toggle').setAttribute('aria-expanded','false');$('menu-toggle').textContent='選單';}));document.querySelectorAll('a[href="#shop"]').forEach(a=>a.addEventListener('click',()=>selectCategory('常駐商品')));
 const navCustom=$('nav-open-custom');if(navCustom)navCustom.addEventListener('click',e=>{e.preventDefault();selectCategory('客製化委託');location.hash='commission';});
 $('custom-form').addEventListener('submit',e=>{e.preventDefault();const name=$('custom-name').value.trim()||'客製化委託';const detail=$('custom-detail').value.trim();const status=$('custom-status');if(detail.length<5){status.textContent='請至少填寫 5 個字的製作需求。';status.className='custom-status error';$('custom-detail').focus();return;}custom.push({name,detail});$('custom-form').reset();status.textContent='已加入訂購申請單，可繼續填寫其他委託。';status.className='custom-status success';renderCart();});
 document.querySelectorAll('[data-equipment-type]').forEach(b=>b.addEventListener('click',()=>chooseEquipmentType(b.dataset.equipmentType)));
 $('equipment-fixed-minus').addEventListener('click',()=>adjustFixedEquipmentQuantity(-1));
 $('equipment-fixed-plus').addEventListener('click',()=>adjustFixedEquipmentQuantity(1));
 $('equipment-edit-type').addEventListener('click',()=>resetEquipmentFlow('type'));
 $('equipment-edit-job').addEventListener('click',()=>resetEquipmentFlow('job'));
 $('equipment-fixed-add').addEventListener('click',()=>adjustFixedEquipmentQuantity(1));
 $('equipment-form').addEventListener('submit',e=>{
  e.preventDefault();
  const name=selectedEquipmentName;
  if(selectedFixedEquipment())return; // 固定價套裝直接透過加減數量加入訂購申請單。
  if(!selectedEquipmentType||!selectedEquipmentJob)return;
  const qty=Number($('equipment-qty').value);
  const details=$('equipment-details').value.trim();
  const status=$('equipment-status');
  if(!name||(name!=='其他'&&!selectedEquipmentSet)||!Number.isInteger(qty)||qty<1||qty>99||details.length<5){
   status.textContent='請確認裝備名稱、訂製方式（選「其他」可略過）、1–99 的訂製數量，以及至少 5 個字的需求說明。';
   status.className='custom-status error';return;
  }
  const selectedMode=equipmentChoice(selectedEquipmentType,name,selectedEquipmentSet);
  if(name!=='其他'&&!selectedMode){status.textContent='此訂製方案已下架，請重新選擇。';status.className='custom-status error';return;}
  const setLabel=name==='其他'?'其他（依需求）':selectedEquipmentSet+(selectedMode?.pricing==='固定售價'&&selectedMode.description?'（'+selectedMode.description+'）':'');
  custom.push({name:'【裝備訂製】'+name+'／'+setLabel,detail:`大類：${selectedEquipmentType}\n職業：${selectedEquipmentJob.name}（${selectedEquipmentJob.abbr}）\n訂製方式：${setLabel}\n數量：${qty} ${selectedEquipmentSet==='整套'?'套':'件／份'}\n${details}`,type:'裝備訂製',equipmentType:selectedEquipmentType,equipmentJob:selectedEquipmentJob.name,equipmentName:name,equipmentSet:name==='其他'?'其他':selectedEquipmentSet,quantity:qty});
  $('equipment-form').reset();selectedEquipmentName='';selectedEquipmentSet='';renderEquipmentNameOptions();status.textContent='裝備訂製已加入訂購申請單，待店主報價。';status.className='custom-status success';renderCart();
 });
 initializeCheckoutEnhancements();$('checkout-form').addEventListener('submit',submitOrder);$('checkout-form').addEventListener('input',e=>{if(e.target.matches('input,select,textarea'))clearCheckoutFieldError(e.target);});$('checkout-form').addEventListener('change',e=>{if(e.target.matches('input,select,textarea'))clearCheckoutFieldError(e.target);});initializePendingRecovery();showCatalogNotice(CATALOG_MSG.loading);loadManagedCatalog();if(location.hash==='#commission')currentCategory='客製化委託';renderFilters();renderProducts();renderCart();}
function categories(){return shopTabs;}
function categoryOf(p){if(p.price===null)return '客製化委託';const c=p.shopCategory||p.category;return shopTabs.includes(c)?c:'常駐商品';}
function selectCategory(c){if(!shopTabs.includes(c))return;currentCategory=c;renderFilters();renderProducts();}
function renderFilters(){
 $('filters').innerHTML=categories().map(c=>`<button type="button" role="tab" class="${c===currentCategory?'active':''}" data-cat="${safe(c)}" aria-selected="${c===currentCategory}" aria-controls="${c==='客製化委託'?'commission':c==='裝備訂製'?'equipment':'products'}">${safe(c)}</button>`).join('');
 $('filters').querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>selectCategory(b.dataset.cat)));
}
function changeQuantity(id,delta){
 const p=products.find(x=>x.id===id);if(!p||p.price===null||!catalogReady)return;
 const next=Math.max(0,Math.min(99,(cart[id]||0)+delta));if(next)cart[id]=next;else delete cart[id];
 save();renderProducts();renderCart();if(delta>0)pulseMobileOrderBar();
}
function renderProducts(){
 const customTab=currentCategory==='客製化委託';const equipmentTab=currentCategory==='裝備訂製';$('products').hidden=customTab||equipmentTab;$('commission').hidden=!customTab;$('equipment').hidden=!equipmentTab;$('products').setAttribute('aria-label',currentCategory);if(customTab||equipmentTab)return;
 const shown=products.filter(p=>p.price!==null&&categoryOf(p)===currentCategory);
 $('products').innerHTML=shown.map(p=>{
  const customItem=p.price===null;const qty=cart[p.id]||0;
  const packLabel=p.pack?`<span class="pack-tag">每組 × ${safe(p.pack)}</span>`:'';
  const potionType=[[/剛力/,'strength'],[/智力/,'intelligence'],[/意力/,'mind'],[/巧力/,'dexterity']].find(([pattern])=>pattern.test(p.name));
  const action=customItem?`<button type="button" class="add-product" data-id="${safe(p.id)}">填寫委託需求</button>`:
   `<div class="product-purchase"><strong class="price">${moneyHtml(p.price)}</strong><div class="product-qty" role="group" aria-label="${safe(p.name)}數量調整"><button class="product-qty-btn" type="button" data-id="${safe(p.id)}" data-delta="-1" aria-label="減少${safe(p.name)}數量" ${qty===0?'disabled':''}>−</button><span class="product-qty-value" aria-live="polite">${qty}</span><button class="product-qty-btn" type="button" data-id="${safe(p.id)}" data-delta="1" aria-label="增加${safe(p.name)}數量" ${qty===99||!catalogReady?'disabled':''}>＋</button></div></div>`;
  return `<article class="product-card ${qty>0?'is-selected':''} ${potionType?'potion-'+potionType[1]:''}"><div class="product-info">${packLabel}<small class="product-category">${safe(p.category||'精選商品')}</small>${p.badge&&p.badge!=='常駐'&&p.badge!=='少量'?'<span class="product-new-badge">'+safe(p.badge)+'</span>':''}<h3>${safe(p.name)}</h3><p>${safe(p.desc||'')}</p><div class="product-bottom">${customItem?'<strong class="price">另行報價</strong>':''}${action}</div></div></article>`;
 }).join('')||'<p class="category-empty">目前沒有此分類商品，請稍後再查看。</p>';
 $('products').querySelectorAll('.product-qty-btn').forEach(b=>b.addEventListener('click',()=>changeQuantity(b.dataset.id,Number(b.dataset.delta))));
 bumpChangedQuantities();

}
function renderCart(){
 const entries=products.filter(p=>cart[p.id]>0&&p.price!==null);
 const count=entries.reduce((n,p)=>n+cart[p.id],0)+custom.reduce((n,x)=>n+(pricedCommissionSubtotal(x)!==null?Number(x.quantity||0):1),0);
 $('nav-count').textContent=count;
 const html=entries.map(p=>`<div class="cart-line"><div><strong>${safe(packName(p))}</strong><small>${money(p.price)} / 件</small></div><div class="cart-action"><strong>${money(p.price*cart[p.id])}</strong><div class="quantity-control" role="group" aria-label="${safe(p.name)}數量調整"><button class="quantity-btn" type="button" data-action="minus" data-id="${safe(p.id)}" aria-label="減少${safe(p.name)}數量">−</button><span class="quantity-value" aria-live="polite">${cart[p.id]}</span><button class="quantity-btn" type="button" data-action="plus" data-id="${safe(p.id)}" aria-label="增加${safe(p.name)}數量">＋</button></div></div></div>`).join('');
 const customHtml=custom.map((x,i)=>{const price=pricedCommissionSubtotal(x);const controls=price!==null?`<div class="quantity-control" role="group" aria-label="${safe(x.name)}數量調整"><button class="quantity-btn" type="button" data-action="fixed-minus" data-index="${i}" aria-label="減少數量">−</button><span class="quantity-value">${Number(x.quantity)||0}</span><button class="quantity-btn" type="button" data-action="fixed-plus" data-index="${i}" aria-label="增加數量" ${Number(x.quantity)>=99?'disabled':''}>＋</button></div>`:`<button type="button" class="remove" data-action="remove-custom" data-index="${i}">移除</button>`;return `<div class="cart-line"><div><strong>${safe(x.name)}</strong><small>${safe(x.detail.slice(0,60))}</small></div><div class="cart-action"><strong>${price===null?'待報價':money(price)}</strong>${controls}</div></div>`;}).join('');
 $('cart-items').innerHTML=html+customHtml||'<div class="empty-cart">'+emptyCartIllustration+'<p>尚未選擇商品</p><small>請先挑選商品<br>並將需要的項目加入委託。</small></div>';
 $('cart-items').querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{const action=b.dataset.action;if(action==='remove-custom'){custom.splice(Number(b.dataset.index),1);}else if(action==='fixed-minus'||action==='fixed-plus'){
  const idx=Number(b.dataset.index),item=custom[idx];if(!item||pricedCommissionSubtotal(item)===null)return;
  const next=Math.max(0,Math.min(99,Number(item.quantity)+(action==='fixed-plus'?1:-1)));
  if(next===0)custom.splice(idx,1);else{
    item.quantity=next;item.detail=item.detail.replace(/數量：\d+ 套/,`數量：${next} 套`);
  }
 }else{const id=b.dataset.id;if(action==='plus'&&!catalogReady)return;cart[id]=Math.max(0,Math.min(99,(cart[id]||0)+(action==='plus'?1:-1)));if(!cart[id])delete cart[id];save();}renderCart();renderProducts();updateFixedEquipmentUI();if(action==='plus'||action==='fixed-plus')pulseMobileOrderBar();}));
 const regularTotal=entries.reduce((n,p)=>n+p.price*cart[p.id],0);
 const fixedEquipmentTotal=custom.reduce((sum,x)=>sum+(pricedCommissionSubtotal(x)||0),0);
 animateCartTotal(regularTotal+fixedEquipmentTotal);markNewCartLines();
 refreshMobileOrderBar(count,regularTotal+fixedEquipmentTotal);
 refreshCheckoutButton();
 $('quote-note').hidden=!custom.some(x=>pricedCommissionSubtotal(x)===null);
}
function orderData(){
 const fd=new FormData($('checkout-form'));
 const chosen=products.filter(p=>cart[p.id]>0&&p.price!==null);
 const items=chosen.map(p=>({id:p.id,name:p.name,unit_price:p.price,qty:cart[p.id],subtotal:p.price*cart[p.id]}));
 const total=items.reduce((v,p)=>v+p.subtotal,0)+custom.reduce((v,p)=>v+(pricedCommissionSubtotal(p)||0),0);
 return {shop:config.name||'Angulus',character:String(fd.get('character')||'').trim(),server:String(fd.get('server')||'').trim(),contact:String(fd.get('contact')||'').trim(),deliveryDate:String(fd.get('deliveryDate')||''),deliveryTime:String(fd.get('deliveryTime')||'').trim(),notes:String(fd.get('notes')||'').trim(),items,custom,estimated_gil:total,requires_quote:custom.some(x=>pricedCommissionSubtotal(x)===null),created_at:new Date().toISOString()};
}
function orderText(d){return [`【${d.shop}】訂購申請`,`角色名稱：${d.character}`,`伺服器：${d.server}`,`聯絡方式：${d.contact}`,`希望交貨：${d.deliveryDate||'未填寫'}`,`方便時段：${d.deliveryTime||'未填寫'}`,'','【固定商品】',...d.items.map(p=>`${p.name} × ${p.qty}｜${money(p.subtotal)}`),'',`委託小計：${money(d.estimated_gil)}`,...(d.requires_quote?['＊另含客製委託，總額待報價。']:[]),'','【客製委託】',...(d.custom.map((x,i)=>`${i+1}. ${x.name}\n${x.detail}`)),'','備註：'+(d.notes||'無'),'申請時間：'+d.created_at].join('\n');}
async function submitOrderFormspree(e){e.preventDefault();if(!catalogReady){showCatalogNotice(CATALOG_MSG.notReady);return;}const s=$('form-status');s.className='form-status';if(!Object.keys(cart).length&&!custom.length){s.textContent='請先選擇商品或填寫委託。';s.classList.add('error');return;}const endpoint=String(config.formEndpoint||'').trim();if(!/^https:\/\/formspree\.io\/f\/[a-zA-Z0-9]+$/.test(endpoint)){s.classList.add('error');s.textContent='店主尚未設定線上收單服務，現階段無法送出。請聯絡店主；亦可先截圖委託內容。';return;}const d=orderData();const button=$('submit-order');checkoutBusy=true;button.disabled=true;button.textContent='正在傳送委託…';try{const r=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify({name:d.character,email:d.contact.includes('@')?d.contact:undefined,character:d.character,server:d.server,contact:d.contact,deliveryDate:d.deliveryDate,deliveryTime:d.deliveryTime,message:orderText(d),order_json:JSON.stringify(d)})});if(!r.ok)throw Error('伺服器未接受此委託（HTTP '+r.status+'）');s.textContent='委託已傳送！請保留聯絡資訊並等候店主回覆。';cart={};custom=[];save();renderCart();renderProducts();$('checkout-form').reset();}catch(err){s.classList.add('error');s.textContent='送單失敗：'+err.message+'。商品仍留在訂購申請單中，請稍後再試。';}finally{checkoutBusy=false;refreshCheckoutButton();}}
document.addEventListener('DOMContentLoaded',setup);


// V1.3.42: GitHub Pages -> Apps Script via HTML form POST and a receipt-only JSONP query.
// Direct fetch() POST to Apps Script from Pages often fails due to cross-origin redirects.
// Do not infer delivery from iframe load; only a receipt found in the private Sheet confirms success.
const receiptKey='angulus-last-uncertain-order';
const angulusOrderHistoryKey='angulus-order-history-v1';
let googleSubmitting=false;

// V1.3.72 — submission readiness, with inline validation in the shop's visual language.
let checkoutBusy=false;
function hasOrderItems(){return Object.values(cart).some(q=>Number(q)>0)||custom.length>0;}
function refreshCheckoutButton(){
 const button=$('submit-order');if(!button)return;
 const empty=!hasOrderItems();
 button.disabled=empty||checkoutBusy||googleSubmitting||!catalogReady;
 if(!checkoutBusy&&!googleSubmitting)button.textContent=empty?'請先選擇商品':'送出訂購申請';
}
function inlineValidationMessage(field){
 if(field.validity.valueMissing)return field.name==='accept'?'請先勾選同意注意事項。':'此欄位為必填，請填寫後再送出。';
 if(field.validity.typeMismatch)return '請輸入有效的資料格式。';
 if(field.validity.patternMismatch)return '資料格式不符合要求，請檢查後再試。';
 if(field.validity.tooLong)return '內容超過允許的長度。';
 return '請檢查此欄位內容。';
}
function clearCheckoutFieldError(field){
 field.removeAttribute('aria-invalid');
 const wrapper=field.closest('label');
 const error=wrapper?.querySelector('.checkout-field-error');
 if(error)error.remove();
}
function validateCheckoutFields(){
 const form=$('checkout-form');let first=null;
 const fields=[...form.querySelectorAll('input,select,textarea')];
 fields.forEach(field=>{
  clearCheckoutFieldError(field);
  if(field.willValidate&&!field.checkValidity()){
   if(!first)first=field;
   field.setAttribute('aria-invalid','true');
   const label=field.closest('label');
   if(label){const msg=document.createElement('span');msg.className='checkout-field-error';msg.setAttribute('role','alert');msg.textContent=inlineValidationMessage(field);label.appendChild(msg);}
  }
 });
 if(first){first.focus({preventScroll:true});first.scrollIntoView({behavior:'smooth',block:'center'});return false;}
 return true;
}

function receiptStore(value){try{if(value)localStorage.setItem(receiptKey,JSON.stringify(value));else localStorage.removeItem(receiptKey);}catch(_){}}
function randomRequestId(){
 if(!window.crypto||!crypto.getRandomValues)throw Error('瀏覽器不支援安全委託識別碼，請改用現代瀏覽器。');
 const b=new Uint8Array(20);crypto.getRandomValues(b);return Array.from(b,x=>x.toString(16).padStart(2,'0')).join('');
}
function lookupReceipt(url,requestId,timeoutMs=11000){
 return new Promise((resolve,reject)=>{
  const callback='angulusReceipt_'+Math.random().toString(36).slice(2);
  const tag=document.createElement('script');let finished=false;
  const timer=setTimeout(()=>finish(new Error('查詢逾時')),timeoutMs);
  function finish(error,value){if(finished)return;finished=true;clearTimeout(timer);delete window[callback];tag.remove();error?reject(error):resolve(value);}
  window[callback]=result=>finish(null,result);
  tag.onerror=()=>finish(new Error('無法連線到 Google 委託回執服務'));
  tag.src=url+(url.includes('?')?'&':'?')+'action=receipt&requestId='+encodeURIComponent(requestId)+'&callback='+encodeURIComponent(callback)+'&v='+Date.now();
  document.head.appendChild(tag);
 });
}
const sleep=ms=>new Promise(done=>setTimeout(done,ms));
async function confirmReceipt(url,requestId){
 for(let attempt=0;attempt<7;attempt++){
  await sleep(attempt===0?2100:2400);
  try{const v=await lookupReceipt(url,requestId,8500);if(v&&v.found&&v.orderId)return v;}catch(e){}
 }
 return null;
}
function postToAppsScript(url,body){
 const frame=$('angulus-submit-frame');
 if(!frame)throw Error('找不到委託傳送框架');
 const form=document.createElement('form');form.method='POST';form.action=url;form.target=frame.name;form.style.display='none';
 Object.entries(body).forEach(([key,value])=>{const input=document.createElement('input');input.type='hidden';input.name=key;input.value=String(value);form.appendChild(input);});
 document.body.appendChild(form);try{form.submit();}finally{form.remove();}
}
function refreshPendingActions(){const p=$('pending-actions');if(p)p.hidden=!loadPending();}
function loadPending(){try{const d=JSON.parse(localStorage.getItem(receiptKey)||'null');return d&&d.requestId?d:null;}catch(_){return null;}}
function initializePendingRecovery(){
 const check=$('check-pending'),clear=$('clear-pending');if(!check||!clear)return;refreshPendingActions();
 check.addEventListener('click',async()=>{const pending=loadPending();if(!pending)return;const url=String(config.googleScriptUrl||'');const s=$('form-status');s.textContent='正在查閱上一份委託紀錄……';try{const found=await lookupReceipt(url,pending.requestId);if(found&&found.found){finishConfirmedOrder(found);s.textContent='已尋得上一份委託，編號：'+found.orderId+'。';}else{s.className='form-status error';s.textContent='工坊尚未查得這份委託的收件紀錄，請先由店主協助核對，再決定是否重新遞交。';}}catch(e){s.className='form-status error';s.textContent='暫時無法查閱委託紀錄，請聯絡店主協助核對。';}});
 clear.addEventListener('click',()=>{const p=loadPending();if(!p)return;if(!window.confirm('請先確認 Google 試算表中沒有這筆委託。若已入帳而再次送出，可能產生重複委託。確定放棄這筆未確認識別碼嗎？'))return;receiptStore(null);refreshPendingActions();$('form-status').textContent='待核對紀錄已清除，原先選購的品項仍為你保留。';});
}
function saveLookupHistory(character, requestId, orderId){
 try{
  if(!/^[a-f0-9]{40}$/.test(requestId)||!character)return;
  const history=JSON.parse(localStorage.getItem(angulusOrderHistoryKey)||'[]');
  const next=[{character,requestId,orderId,date:new Date().toISOString()},...(Array.isArray(history)?history:[]).filter(x=>x&&x.requestId!==requestId)].slice(0,15);
  localStorage.setItem(angulusOrderHistoryKey,JSON.stringify(next));
 }catch(_){/* Local history is optional; the visible code remains available. */}
}
function presentLookupCode(code){
 const area=$('lookup-confirmation'), target=$('lookup-secret'),copy=$('copy-lookup-code');
 if(!area||!target||!code)return;
 target.textContent=code;area.hidden=false;
 if(copy)copy.onclick=()=>{if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(code).then(()=>{copy.textContent='查詢碼已複製';}).catch(()=>{copy.textContent='請手動選取查詢碼並複製';});}else{copy.textContent='請手動選取查詢碼並複製';}};
}
function finishConfirmedOrder(result){
 const pending=loadPending();
 const orderCharacter=(pending&&pending.character)||String(new FormData($('checkout-form')).get('character')||'').trim();
 if(pending&&pending.requestId){saveLookupHistory(orderCharacter,pending.requestId,result.orderId);presentLookupCode(pending.requestId);}
 cart={};custom=[];save();renderCart();renderProducts();$('checkout-form').reset();
 const s=$('form-status');s.className='form-status';s.textContent='委託已登記入冊！委託編號：'+result.orderId+'。請妥善保管查詢碼，靜候店主確認。';
 $('receipt-message').hidden=false;$('receipt-message').textContent='你的委託編號：'+result.orderId;
 receiptStore(null);refreshPendingActions();
}
async function submitOrderGoogle(e){
 e.preventDefault();const status=$('form-status');status.className='form-status';
 if(googleSubmitting)return;
 if(!catalogReady){status.classList.add('error');status.textContent=CATALOG_MSG.blocked;return;}
 if(!Object.keys(cart).length&&!custom.length){status.textContent='請先選擇商品或填寫委託。';status.classList.add('error');return;}
 const url=String(config.googleScriptUrl||'').trim();
 if(!/^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(url)){
  status.textContent='店主尚未完成 Google 委託接收設定，無法送出。請聯絡店主。';status.classList.add('error');return;
 }
 const uncertain=(()=>{try{return JSON.parse(localStorage.getItem(receiptKey)||'null');}catch(_){return null;}})();
 if(uncertain&&uncertain.requestId){
  status.classList.add('error');status.textContent='先前遞交的委託尚待核對，請先查閱原委託紀錄或聯絡店主，避免重複遞交。';return;
 }
 const button=$('submit-order');googleSubmitting=true;button.disabled=true;button.textContent='正在核對訂購申請單……';
 try{
  const requestId=randomRequestId();const payload=orderData();
  const body={payload:JSON.stringify(payload),requestId,website:'angulus',trap:''};
  if(body.payload.length>22000)throw Error('委託內容過長，請縮短備註或分開下單。');
  receiptStore({requestId,character:payload.character,createdAt:Date.now()});refreshPendingActions();
  postToAppsScript(url,body);
  status.textContent='訂購申請單已遞交，工坊正在核對收件紀錄。請暫留此頁，切勿重複遞交。';
  const confirmed=await confirmReceipt(url,requestId);
  if(confirmed){finishConfirmedOrder(confirmed);}else{
   status.classList.add('error');status.textContent='工坊尚未回傳委託收件確認。請勿立即重送；請將這組核對識別碼提供給店主：'+requestId+'，以核對是否已收件。你原先選購的品項仍會保留。';
  }
 }catch(err){status.classList.add('error');status.textContent='委託收件尚未確認：'+err.message+'。請先聯絡店主核對，再考慮重新遞交。';}
 finally{googleSubmitting=false;refreshCheckoutButton();}
}
function submitOrder(e){
 e.preventDefault();
 if(!catalogReady){$('form-status').className='form-status error';$('form-status').textContent=CATALOG_MSG.blocked;return;}
 if(!hasOrderItems()){refreshCheckoutButton();return;}
 if(!validateCheckoutFields())return;
 const dialog=$('order-confirm-dialog');
 renderConfirmation(orderData());
 if(dialog&&!dialog.open)dialog.showModal();
}
function confirmedSubmit(){
 if(googleSubmitting||checkoutBusy||!catalogReady)return;
 const dialog=$('order-confirm-dialog');
 if(!hasOrderItems()||!validateCheckoutFields()){dialog?.close();refreshCheckoutButton();return;}
 dialog?.close();
 const form=$('checkout-form');
 // 前端防灌單僅用來攔下自動填滿機器人的常見操作，不能取代後端防護。
 if(String(form.elements.namedItem('website')?.value||'').trim()){
  const status=$('form-status');status.className='form-status success';status.textContent='已送出';return;
 }
 saveCustomerPreference();
 if(config.orderBackend==='formspree')return submitOrderFormspree(new Event('submit'));
 return submitOrderGoogle(new Event('submit'));
}
const CUSTOMER_KEY='angulus-customer-details-v1';
const REORDER_KEY='angulus-reorder-v1';
function todayLocalISO(){const d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');}
function loadCustomerPreference(){
 try{
  const data=JSON.parse(localStorage.getItem(CUSTOMER_KEY)||'null');
  if(!data||typeof data!=='object')return;
  const form=$('checkout-form');
  ['character','server','contact'].forEach(key=>{const field=form.elements.namedItem(key);if(field&&typeof data[key]==='string')field.value=data[key].slice(0,120);});
  form.elements.namedItem('rememberCustomer').checked=true;
 }catch(e){}
}
function saveCustomerPreference(){
 try{
  const form=$('checkout-form');
  if(!form.elements.namedItem('rememberCustomer').checked){localStorage.removeItem(CUSTOMER_KEY);return;}
  localStorage.setItem(CUSTOMER_KEY,JSON.stringify({character:form.elements.namedItem('character').value.trim(),server:form.elements.namedItem('server').value,contact:form.elements.namedItem('contact').value.trim()}));
 }catch(e){}
}
function appendConfirmRow(parent,title,value){
 const row=document.createElement('div');row.className='confirm-row';
 const name=document.createElement('span');name.textContent=title;
 const text=document.createElement('strong');text.textContent=String(value||'未填寫');
 row.append(name,text);parent.appendChild(row);
}
function renderConfirmation(data){
 const target=$('order-confirm-details');target.replaceChildren();
 const heading=document.createElement('h3');heading.textContent='選購內容';target.appendChild(heading);
 const entries=[...data.items.map(x=>({name:packName(products.find(p=>p.id===x.id)||{name:x.name}),qty:x.qty,price:x.subtotal})),...data.custom.map(x=>({name:x.name,qty:Math.max(1,Number(x.quantity)||1),price:pricedCommissionSubtotal(x)}))];
 entries.forEach(x=>appendConfirmRow(target,`${x.name} × ${x.qty}`,x.price===null?'待報價':money(x.price)));
 appendConfirmRow(target,'委託小計',money(data.estimated_gil));
 if(data.requires_quote)appendConfirmRow(target,'其他委託','含待報價項目，最終金額以店主確認為準');
 const personal=document.createElement('h3');personal.textContent='訂購人資訊';target.appendChild(personal);
 [['角色名稱',data.character],['所屬伺服器',data.server],['聯絡方式',data.contact],['希望交貨日期',data.deliveryDate],['方便交易時段',data.deliveryTime]].forEach(([k,v])=>{if(v||['角色名稱','所屬伺服器','聯絡方式'].includes(k))appendConfirmRow(target,k,v);});
}
function applyReorderFromReceipt(){
 let request=null;try{request=JSON.parse(localStorage.getItem(REORDER_KEY)||'null');localStorage.removeItem(REORDER_KEY);}catch(e){}
 if(!request||!Array.isArray(request.items))return;
 const missing=[],changed=[];
 for(const line of request.items.slice(0,30)){
  const matching=products.find(p=>p.price!==null&&p.name===line.name&&p.category===line.category&&Number(p.price)===Number(line.unitPrice));
  const renamed=matching||products.find(p=>p.price!==null&&p.name===line.name&&p.category===line.category);
  if(!renamed){missing.push(String(line.name||'未知品項'));continue;}
  if(!matching)changed.push(renamed.name);
  const qty=Math.min(99,Math.max(0,Number.parseInt(line.qty,10)||0));
  if(qty>0)cart[renamed.id]=Math.min(99,(cart[renamed.id]||0)+qty);
 }
 save();renderProducts();renderCart();
 const notices=[];if(changed.length)notices.push('部分商品價格已更新，已按目前網站售價重新計算：'+[...new Set(changed)].join('、'));
 if(missing.length)notices.push('下列舊商品已無法加入：'+[...new Set(missing)].join('、'));
 if(request.hasCommissions)notices.push('裝備訂製及客製委託無法自動帶入，請重新填寫需求。');
 const status=$('form-status');status.className='form-status';status.textContent=notices.length?'已帶入可訂購商品。'+notices.join('；'):'已從舊收據帶入商品，請核對數量與目前價格。';
}
function initializeCheckoutEnhancements(){
 const date=$('checkout-form').elements.namedItem('deliveryDate');if(date){date.min=todayLocalISO();date.addEventListener('focus',()=>{date.min=todayLocalISO();});}
 loadCustomerPreference(); // 收據再訂一次待最新商品資料載入後才處理。
 $('confirm-back').addEventListener('click',()=>$('order-confirm-dialog').close());
 $('confirm-send').addEventListener('click',confirmedSubmit);
}



// V1.3.75 — 品牌價格呈現、空白申請單與輕量動態回饋。
const emptyCartIllustration='<svg class="empty-illustration" viewBox="0 0 64 48" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M14 8h36a5 5 0 0 1 0 10H14"/><path d="M14 8a5 5 0 0 0 0 10h4v22a4 4 0 0 0 4 4h28a4 4 0 0 0 4-4V18"/><path d="M26 26h18M26 32h12"/><path d="m48 34 8-8 3 3-8 8-4 1 1-4Z"/></svg>';
const reduceMotion=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
let lastShownQty={},lastCartKeys=null,lastCartTotal=null,totalAnimation=0;
function bumpChangedQuantities(){
 document.querySelectorAll('#products .product-qty').forEach(group=>{
  const id=group.querySelector('[data-id]')?.dataset.id;
  const value=group.querySelector('.product-qty-value');
  if(!id||!value)return;
  const qty=cart[id]||0;
  if(Object.prototype.hasOwnProperty.call(lastShownQty,id)&&lastShownQty[id]!==qty&&!reduceMotion){
   value.classList.remove('is-bumping');void value.offsetWidth;value.classList.add('is-bumping');
  }
  lastShownQty[id]=qty;
 });
}
function markNewCartLines(){
 const lines=[...document.querySelectorAll('#cart-items .cart-line')];
 // 使用穩定的品項名稱，比對這次新加入的商品，不重複觸發既有品項動畫。
 const keys=lines.map(line=>line.querySelector('strong')?.textContent||'');
 if(lastCartKeys&&!reduceMotion)lines.forEach((line,i)=>{if(!lastCartKeys.includes(keys[i]))line.classList.add('is-new');});
 lastCartKeys=keys;
}
function animateCartTotal(total){
 const el=$('cart-total');if(!el)return;
 cancelAnimationFrame(totalAnimation);
 const from=lastCartTotal;lastCartTotal=total;
 if(reduceMotion||from===null||from===total){el.innerHTML=moneyHtml(total);return;}
 const start=performance.now(),duration=380;
 const step=now=>{
  const t=Math.min(1,(now-start)/duration),eased=1-Math.pow(1-t,3);
  el.innerHTML=moneyHtml(Math.round(from+(total-from)*eased));
  if(t<1)totalAnimation=requestAnimationFrame(step);
 };
 totalAnimation=requestAnimationFrame(step);
}
