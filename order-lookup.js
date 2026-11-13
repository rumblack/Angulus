"use strict";
const q=id=>document.getElementById(id);
const formatGil=v=>new Intl.NumberFormat('en-US').format(Number(v)||0)+' Gil';
const historyKey='angulus-order-history-v1';
const endpoint=String(window.SHOP_CONFIG?.googleScriptUrl||'');
let active=false;
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
 txt(q('r-id'),r.orderId);txt(q('r-character'),r.character);txt(q('r-server'),r.server);
 txt(q('r-date'),r.createdAt);txt(q('r-status'),r.status);txt(q('r-payment'),r.paymentStatus);
 q('r-status').dataset.state=String(r.status||'');
 const items=q('r-items');items.replaceChildren();
 if(r.items?.length){r.items.forEach(x=>appendLine(items,x.name+' × '+x.qty,x.category+' · '+formatGil(x.unitPrice)+' / 份',x.subtotal));}
 else appendLine(items,'沒有固定商品','此訂單可能只有客製委託');
 txt(q('r-total'),formatGil(r.fixedSubtotal));
 const commissions=q('r-commissions');commissions.replaceChildren();
 const hasCustom=Array.isArray(r.commissions)&&r.commissions.length>0;
 q('r-commission-block').hidden=!hasCustom;
 if(hasCustom)r.commissions.forEach(x=>appendLine(commissions,x.name,(x.type||'客製委託')+' · '+[x.equipmentType,x.job].filter(Boolean).join(' / ')+' · 數量 '+x.qty+' · '+x.status));
 txt(q('r-quote'),r.finalQuote!==null&&r.finalQuote!==undefined?'店主最終報價：'+formatGil(r.finalQuote):(r.requiresQuote?'包含待報價項目，總額須等待店主確認。':'金額以店主確認為準。'));
 q('lookup-result').hidden=false;
 q('lookup-result').scrollIntoView({behavior:'smooth',block:'start'});
}
function lookupOrder(character,code){
 return new Promise((resolve,reject)=>{
  if(!/^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(endpoint))return reject(new Error('網站尚未設定 Google 接單服務。'));
  const cb='angulusLookup_'+Math.random().toString(36).slice(2);
  const script=document.createElement('script');let done=false;
  const timer=setTimeout(()=>finish(new Error('查詢逾時，請稍後再試。')),12000);
  function finish(err,value){if(done)return;done=true;clearTimeout(timer);delete window[cb];script.remove();err?reject(err):resolve(value);}
  window[cb]=v=>finish(null,v);
  script.onerror=()=>finish(new Error('無法連上 Google 訂單查詢服務。'));
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
  const id=document.createElement('small');txt(id,entry.orderId||'訂單紀錄');
  btn.append(name,id);btn.addEventListener('click',()=>{q('lookup-character').value=entry.character;q('lookup-code').value=entry.requestId;q('lookup-form').requestSubmit();});
  list.appendChild(btn);
 }
}
document.addEventListener('DOMContentLoaded',()=>{
 q('lookup-menu').addEventListener('click',()=>{const open=q('lookup-nav').classList.toggle('open');q('lookup-menu').setAttribute('aria-expanded',String(open));});
 q('lookup-form').addEventListener('submit',async e=>{
  e.preventDefault();if(active)return;
  const character=q('lookup-character').value.trim();const code=q('lookup-code').value.trim().toLowerCase();
  if(!character||!/^[a-f0-9]{40}$/.test(code)){txt(q('lookup-status'),'請填寫角色名稱及 40 碼查詢碼。');return;}
  active=true;q('lookup-submit').disabled=true;q('lookup-result').hidden=true;
  txt(q('lookup-status'),'正在翻閱 Angulus 的委託紀錄，尋找您的訂單……');q('lookup-status').className='form-status';
  try{const res=await lookupOrder(character,code);
   if(res?.found&&res.receipt){renderReceipt(res.receipt);txt(q('lookup-status'),'已找到訂單。');}
   else{q('lookup-status').className='form-status error';txt(q('lookup-status'),res?.message||'查無符合的訂單，請檢查角色名稱與查詢碼。');}
  }catch(err){q('lookup-status').className='form-status error';txt(q('lookup-status'),err.message);}
  finally{active=false;q('lookup-submit').disabled=false;}
 });
 q('clear-order-history').addEventListener('click',()=>{if(!confirm('確定清除這部裝置保存的訂單查詢紀錄？清除後須自行輸入查詢碼。'))return;localStorage.removeItem(historyKey);renderHistory();});
 q('lookup-print').addEventListener('click',()=>window.print());
 renderHistory();
});
