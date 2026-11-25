"use strict";
const q=id=>document.getElementById(id);
const formatGil=v=>new Intl.NumberFormat('en-US').format(Number(v)||0)+' Gil';
const historyKey='angulus-order-history-v1';
const endpoint=String(window.SHOP_CONFIG?.googleScriptUrl||'');
let active=false;
let currentReceipt=null;
function txt(node,value){node.textContent=String(value??'');}
function appendLine(parent,title,detail,price){
 const row=document.createElement('div');row.className='receipt-line';
 const left=document.createElement('div');const bold=document.createElement('strong');txt(bold,title);left.appendChild(bold);
 if(detail){const sub=document.createElement('small');txt(sub,detail);left.appendChild(sub);}
 row.appendChild(left);
 if(price!==undefined){const amount=document.createElement('strong');txt(amount,formatGil(price));row.appendChild(amount);}
 parent.appendChild(row);
}
function renderReceipt(r){
 currentReceipt=r;
 txt(q('r-id'),r.orderId);txt(q('r-character'),r.character);txt(q('r-server'),r.server);
 txt(q('r-date'),r.createdAt);txt(q('r-status'),r.status);txt(q('r-payment'),r.paymentStatus);
 q('r-status').dataset.state=String(r.status||'');
 const items=q('r-items');items.replaceChildren();
 if(r.items?.length){r.items.forEach(x=>appendLine(items,x.name+' × '+x.qty,x.category+' · '+formatGil(x.unitPrice)+' / 份',x.subtotal));}
 else appendLine(items,'沒有固定商品','此委託可能只有客製項目');
 txt(q('r-total'),formatGil(r.fixedSubtotal));
 const commissions=q('r-commissions');commissions.replaceChildren();
 const hasCustom=Array.isArray(r.commissions)&&r.commissions.length>0;
 q('r-commission-block').hidden=!hasCustom;
 if(hasCustom)r.commissions.forEach(x=>appendLine(commissions,x.name,(x.type||'客製委託')+' · '+[x.equipmentType,x.job].filter(Boolean).join(' / ')+' · 數量 '+x.qty+' · '+x.status,x.subtotal===null||x.subtotal===undefined?undefined:x.subtotal));
 txt(q('r-quote'),r.finalQuote!==null&&r.finalQuote!==undefined?'店主最終報價：'+formatGil(r.finalQuote):(r.requiresQuote?'包含待報價項目，總額須等待店主確認。':'金額以店主確認為準。'));
 q('lookup-result').hidden=false;
 q('lookup-result').scrollIntoView({behavior:'smooth',block:'start'});
}
// 透過既有 Apps Script JSONP 端點查詢訂單；保留目前角色名稱＋密鑰驗證方式。
// VPN 或跨區網路偶爾會增加 Google 轉址時間，因此等待上限為 30 秒。
const LOOKUP_TIMEOUT_MS=30000;
function lookupError(kind,message){const e=new Error(message);e.kind=kind;return e;}
function lookupOrder(character,code){
 return new Promise((resolve,reject)=>{
  if(!/^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(endpoint)){
   reject(lookupError('configuration','工坊尚未開放委託紀錄查閱，請聯絡店主。'));return;
  }
  const cb='angulusLookup_'+Math.random().toString(36).slice(2);
  const script=document.createElement('script');let done=false;let timer;
  function finish(err,value){
   if(done)return;
   done=true;clearTimeout(timer);delete window[cb];script.remove();
   err?reject(err):resolve(value);
  }
  window[cb]=value=>finish(null,value);
  script.onerror=()=>finish(lookupError('network','通往工坊紀錄庫的路途暫時受阻。請確認網路或更換 VPN 節點後重新查閱。'));
  timer=setTimeout(()=>finish(lookupError('timeout','工坊紀錄庫的回音遲遲未至（已等候 30 秒）。委託紀錄不受影響，可再試一次或更換連線。')),LOOKUP_TIMEOUT_MS);
  script.src=endpoint+'?action=lookup&character='+encodeURIComponent(character)+'&queryCode='+encodeURIComponent(code)+'&callback='+encodeURIComponent(cb)+'&v='+Date.now();
  document.head.appendChild(script);
 });
}
function loadHistory(){try{const h=JSON.parse(localStorage.getItem(historyKey)||'[]');return Array.isArray(h)?h.filter(x=>x&&x.character&&/^[a-f0-9]{40}$/.test(x.requestId)).slice(0,15):[];}catch(e){return [];}}
function renderHistory(){
 const h=loadHistory();q('recent-orders').hidden=!h.length;
 const list=q('recent-list');list.replaceChildren();
 for(const entry of h){
  const btn=document.createElement('button');btn.type='button';btn.className='recent-entry';
  const name=document.createElement('strong');txt(name,entry.character);
  const id=document.createElement('small');txt(id,entry.orderId||'委託紀錄');
  btn.append(name,id);btn.addEventListener('click',()=>{q('lookup-character').value=entry.character;q('lookup-code').value=entry.requestId;q('lookup-form').requestSubmit();});
  list.appendChild(btn);
 }
}
document.addEventListener('DOMContentLoaded',()=>{
 q('lookup-menu').addEventListener('click',()=>{const open=q('lookup-nav').classList.toggle('open');q('lookup-menu').setAttribute('aria-expanded',String(open));q('lookup-menu').textContent=open?'關閉':'選單';});
 q('lookup-nav').querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{q('lookup-nav').classList.remove('open');q('lookup-menu').setAttribute('aria-expanded','false');q('lookup-menu').textContent='選單';}));
 q('lookup-form').addEventListener('submit',async e=>{
  e.preventDefault();if(active)return;
  const character=q('lookup-character').value.trim();const code=q('lookup-code').value.trim().toLowerCase();
  if(!character||!/^[a-f0-9]{40}$/.test(code)){q('lookup-status').className='form-status error';txt(q('lookup-status'),'請備妥登記時的角色名稱與 40 碼委託查詢碼，再查閱紀錄。');q('lookup-retry').hidden=true;return;}
  active=true;q('lookup-submit').disabled=true;q('lookup-retry').hidden=true;q('lookup-result').hidden=true;
  txt(q('lookup-status'),'正在翻閱 Angulus 的委託紀錄，尋找你的委託……');q('lookup-status').className='form-status';
  try{const res=await lookupOrder(character,code);
   if(res?.found&&res.receipt){renderReceipt(res.receipt);txt(q('lookup-status'),'已尋得你的委託卷宗，收據與目前進度已呈列於下方。');}
   else{q('lookup-status').className='form-status error';txt(q('lookup-status'),res?.message||'工坊卷宗中尚未尋得相符紀錄。請核對角色名稱與查詢碼，或向店主詢問。');}
  }catch(err){q('lookup-status').className='form-status error';txt(q('lookup-status'),err.message);q('lookup-retry').hidden=!['timeout','network'].includes(err.kind);}
  finally{active=false;q('lookup-submit').disabled=false;}
 });
 q('lookup-retry').addEventListener('click',()=>{if(!active)q('lookup-form').requestSubmit();});
 q('clear-order-history').addEventListener('click',()=>{if(!confirm('確定清除這部裝置保存的委託查詢紀錄？清除後須自行輸入查詢碼。'))return;localStorage.removeItem(historyKey);renderHistory();});
 q('lookup-reorder').addEventListener('click',()=>{
  const r=currentReceipt;if(!r)return;
  const items=(Array.isArray(r.items)?r.items:[]).map(x=>({name:String(x.name||''),category:String(x.category||''),unitPrice:Number(x.unitPrice),qty:Number(x.qty)}));
  const hasCommissions=Array.isArray(r.commissions)&&r.commissions.length>0;
  try{localStorage.setItem('angulus-reorder-v1',JSON.stringify({items,hasCommissions}));}
  catch(e){txt(q('lookup-reorder-note'),'無法儲存再訂內容，請確認瀏覽器允許使用本機儲存空間。');return;}
  location.href='index.html#order';
 });
 q('lookup-print').addEventListener('click',()=>window.print());
 renderHistory();
});
