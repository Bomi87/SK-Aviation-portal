<!DOCTYPE html>
<html lang="ko">
 <head>
  <meta charset="utf-8"/>
  <meta content="width=device-width,initial-scale=1" name="viewport"/>
  <title>
   CREW DUTY DASHBOARD
  </title>
  <style>
:root {
    color-scheme:dark;
    font-family:Inter,system-ui,'Malgun Gothic',sans-serif;
    background:#0a1220;
    color:#edf3ff;
}
* {
    box-sizing:border-box;
}
body {
    margin:0;
}
header {
    display:flex;
    justify-content:space-between;
    align-items:center;
    gap:16px;
    padding:24px 4%;
    border-bottom:1px solid #26354a;
    background:#101d30;
}
.sub {
    color:#97a9c5;
    font-size:12px;
}
.brand {
    font-size:20px;
    font-weight:800;
    letter-spacing:.07em;
}
main {
    padding:22px 4%;
    max-width:1600px;
    margin:auto;
}
.panel {
    border:1px solid #2d415a;
    border-radius:14px;
    background:#111e31;
    padding:17px;
    margin-bottom:18px;
}
.controls {
    display:flex;
    gap:12px;
    flex-wrap:wrap;
    align-items:end;
}
.field {
    display:grid;
    gap:5px;
    min-width:180px;
    flex:1;
}
.field label {
    font-size:12px;
    color:#9fb3cc;
}
input,select,button {
    color:#edf3ff;
    background:#152741;
    border:1px solid #38516d;
    border-radius:9px;
    padding:10px 12px;
    font:inherit;
}
button {
    cursor:pointer;
}
button.primary {
    background:#306bda;
    border-color:#306bda;
    font-weight:700;
}
button:disabled {
    opacity:.4;
    cursor:not-allowed;
}
input[type=checkbox] {
    accent-color:#4e93ff;
}
.cards {
    display:grid;
    grid-template-columns:repeat(4,minmax(140px,1fr));
    gap:12px;
    margin-bottom:18px;
}
.card {
    background:#182940;
    padding:16px;
    border-radius:12px;
    border:1px solid #2c415a;
}
.card .val {
    font-size:30px;
    font-weight:800;
    margin:7px 0;
}
.muted {
    color:#98aac3;
    font-size:12px;
}
.warn {
    color:#ffc06b;
}
.bad {
    color:#ff7f8e;
}
.ok {
    color:#70dfba;
}
.unknown {
    color:#aab8cf;
}
.tblwrap {
    overflow:auto;
}
table {
    border-collapse:collapse;
    width:100%;
    font-size:13px;
    white-space:nowrap;
}
th,td {
    padding:11px 12px;
    text-align:left;
    border-bottom:1px solid #283b55;
}
th {
    color:#9fb4cd;
    background:#14243a;
    position:sticky;
    top:0;
}
tr:hover {
    background:#1a304b;
}
.pill {
    font-size:11px;
    padding:4px 8px;
    border-radius:20px;
    background:#26394e;
}
.pill.warn {
    background:#533b18;
}
.pill.bad {
    background:#572634;
}
.pill.ok {
    background:#163f36;
}
.pct {
    height:7px;
    border-radius:20px;
    background:#344459;
    overflow:hidden;
    min-width:90px;
    margin-top:6px;
}
.fill {
    height:100%;
    background:#72d6af;
}
.fill.warn {
    background:#eab65d;
}
.fill.bad {
    background:#f37b87;
}
.layout {
    display:grid;
    grid-template-columns:1fr 1fr;
    gap:18px;
}
.scroll {
    height:310px;
    overflow:auto;
}
.trip {
    display:flex;
    gap:10px;
    align-items:center;
    border-bottom:1px solid #2b3c52;
    padding:11px 3px;
    font-size:12px;
}
.trip small {
    color:#94acc7;
}
.msg {
    padding:12px;
    background:#2e2938;
    color:#ffcf8b;
    border-radius:10px;
    margin-bottom:16px;
    white-space:pre-wrap;
}
h2 {
    font-size:15px;
    margin:0 0 15px;
}
p {
    line-height:1.6;
}
.hint {
    color:#9aaac0;
    font-size:12px;
}
footer {
    padding:20px 4%;
    color:#889ab0;
    font-size:11px;
}
@media(max-width:950px) {
    .layout {
        grid-template-columns:1fr;
    }
    .cards {
        grid-template-columns:repeat(2,1fr);
    }
    header {
        display:block;
    }
}
</style>
 </head>
 <body>
  <div id="authScreen" style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;background:#0a1220;color:#edf3ff;font-family:system-ui,'Malgun Gothic',sans-serif;">
    승인 확인 중...
  </div>
  <div id="appRoot" style="display:none;">
  <header>
   <div>
    <div class="brand">
     CREW DUTY DASHBOARD
    </div>
    <div class="sub">
     ACTUAL OPERATIONS · PLANNED TRIP SIMULATION · DUTY / FLIGHT TIME
    </div>
   </div>
   <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">
    <div id="loginButton">
    </div>
    <div class="sub" id="updated">
     로그인 필요
    </div>
   </div>
  </header>
  <main>
   <div class="msg" hidden="" id="message">
   </div>
   <section class="panel controls">
    <div class="field">
     <label>
      조회 기준 UTC 날짜
     </label>
     <input id="asof" type="date"/>
    </div>
    <div class="field">
     <label>
      승무원 검색
     </label>
     <input id="search" placeholder="이름 검색"/>
    </div>
    <div class="field">
     <label>
      CREW 구분
     </label>
     <select id="kind">
      <option value="all">
       전체
      </option>
      <option value="pilot">
       조종사 (PF / PM / ACM)
      </option>
      <option value="cabin">
       객실/기타
      </option>
     </select>
    </div>
    <div class="field">
     <label>
      경고 임계치 (%)
     </label>
     <input id="threshold" max="100" min="1" type="number" value="85"/>
    </div>
    <button class="primary" id="reload">
     새로고침
    </button>
   </section>
   <section class="cards">
    <div class="card">
     <div class="muted">
      CREW 인원
     </div>
     <div class="val" id="count">
      —
     </div>
    </div>
    <div class="card">
     <div class="muted">
      LIMIT 초과
     </div>
     <div class="val bad" id="exceed">
      —
     </div>
    </div>
    <div class="card">
     <div class="muted">
      LIMIT 접근
     </div>
     <div class="val warn" id="near">
      —
     </div>
    </div>
    <div class="card">
     <div class="muted">
      LIMIT 미설정 인원
     </div>
     <div class="val" id="unconfigured">
      —
     </div>
    </div>
   </section>
   <div class="layout">
    <section class="panel">
     <h2>
      예정 TRIP 선택 (실제 기록에 포함된 LEG는 제외)
     </h2>
     <div class="controls" style="margin-bottom:10px">
      <button id="selectall">
       전체 선택
      </button>
      <button id="clear">
       선택 해제
      </button>
      <span class="sub" id="selectedSummary">
      </span>
     </div>
     <div class="scroll" id="trips">
     </div>
    </section>
    <section class="panel">
     <h2>
      상세 / 계산 설명
     </h2>
     <p class="hint">
      모든 RAW 시각은 UTC로 계산합니다. G/T 11:30 미만은 연속 DUTY이며 11:30 이상은 분리합니다. 각 예정 비행은 먼저 실제 운항 기록과 중복 여부를 확인합니다. 같은 TRIP의 연속 LEG는 휴식 분리 기준에 따라 DUTY로 묶습니다. PF·PM·ACM은 해당 LEG 전체 BLOCK을 Flight Time으로 계산하며 동일 인원은 중복 집계하지 않습니다.
     </p>
     <div class="hint" id="details">
      승무원을 클릭하면 상세 근무 세그먼트가 표시됩니다.
     </div>
    </section>
   </div>
   <section class="panel">
    <h2>
     CREW 누적시간 · 실제 + 선택 예정 TRIP
    </h2>
    <div class="tblwrap">
     <table>
      <thead>
       <tr>
        <th>
         CREW
        </th>
        <th>
         유형
        </th>
        <th>
         Duty 7일
        </th>
        <th>
         Duty 28일
        </th>
        <th>
         Duty 365일
        </th>
        <th>
         Flight 7일
        </th>
        <th>
         Flight 28일
        </th>
        <th>
         Flight 365일
        </th>
        <th>
         최고 사용률
        </th>
        <th>
         경고
        </th>
       </tr>
      </thead>
      <tbody id="rows">
      </tbody>
     </table>
    </div>
    <p class="hint">
     시간 표기 HH:MM · 통계 기준: 각 DUTY 완료 시각/각 LEG 완료 시각이 조회 시점 이전이며, 이동식 기간 내에 포함된 기록. 경계를 걸치는 비행시간은 단순 종료시각 귀속 처리하므로 법정 정밀 산정과 차이가 날 수 있습니다.
    </p>
   </section>
  </main>
  <footer>
   근무시간 = 연속 DUTY의 (BLOCK + GROUND) + 01:30. 법적 한도 미입력 시 ‘LIMIT 미설정’으로 표시합니다. G/T 11:30 이상 DUTY 분리 규칙은 법정 휴식 충족 판정과 별개입니다.
  </footer>
  </div>
  <script async="" defer="" src="https://accounts.google.com/gsi/client">
  </script>
  <script>
'use strict';
let DATA=null,SELECTED=new Set(),activePerson=null;
let SIMULATED_ASOF=null;
const $=id=>document.getElementById(id),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const hh=m=>{let sign=m<0?'-':'';
m=Math.abs(Math.round(m));
return sign+String(Math.floor(m/60)).padStart(2,'0')+':'+String(m%60).padStart(2,'0')};
const utcDate=ms=>new Date(ms).toISOString().slice(0,10);
const cmp=(a,b)=>a.dep-b.dep;
function dedupeKey(l){return [l.dateUTC,l.from,l.to,(l.flight||'').toUpperCase(),(l.aircraft||'').toUpperCase()].join('|')}
// Do not discard a flight merely because route/date matches. Strong match needs flight number or aircraft,
// plus departure proximity and block agreement. Ambiguities are counted and shown for review.
function duplicates(actual,p){let same=actual.filter(a=>a.from===p.from&&a.to===p.to&&Math.abs(a.dep-p.dep)<=90*60000&&Math.abs(a.block-p.block)<=45);
return same.filter(a=>(a.flight&&p.flight&&a.flight.toUpperCase()===p.flight.toUpperCase())||(a.aircraft&&p.aircraft&&a.aircraft.toUpperCase()===p.aircraft.toUpperCase()));
}
function tripGroups(legs){let by=new Map();
for(const l of legs){let k=l.trip?('TRIP:'+l.trip):('DAY:'+l.dateUTC+':'+l.aircraft);
if(!by.has(k))by.set(k,[]);
by.get(k).push(l)}
return [...by.entries()].map(([id,a])=>({id,legs:a.sort(cmp),start:Math.min(...a.map(l=>l.dep)),end:Math.max(...a.map(l=>l.arr)),route:a.map(l=>l.from).concat(a.at(-1).to).join(' → ')})).sort((a,b)=>a.start-b.start)}
function buildPersonLegs(actual,plans){let map=new Map();
for(const l of [...actual,...plans])for(const p of l.people){let key=p.name.toLowerCase();
if(!map.has(key))map.set(key,{name:p.name,kind:p.kind,legs:[]});
let x=map.get(key);
if(p.kind==='pilot')x.kind='pilot';
x.legs.push(l)}return [...map.values()];
}
function duties(legs,breakHours){let a=legs.slice().sort(cmp),out=[],group=[];
const flush=()=>{if(!group.length)return;
let start=group[0].dep,end=Math.max(...group.map(x=>x.arr));
let block=group.reduce((s,l)=>s+l.block,0),ground=Math.max(0,Math.round((end-start)/60000)-block);
out.push({start,end,block,ground,duty:block+ground+DATA.meta.extraDutyMinutes,legs:group.slice()});
group=[]};
for(const leg of a){let prior=group.at(-1);
if(prior&&(leg.dep-prior.arr)/3600000>=breakHours)flush();
group.push(leg)}flush();
return out;
}
function compute(person,asof){const end=asof+86400000-1, ds=duties(person.legs,DATA.meta.minGroundBreakHours),tot={duty:{},flight:{}},detail={duty:ds};
for(let days of DATA.meta.windows){let lower=end-days*86400000;
tot.duty[days]=ds.filter(d=>d.end>lower&&d.end<=end).reduce((s,d)=>s+d.duty,0);
tot.flight[days]=person.kind==='pilot'?person.legs.filter(l=>l.arr>lower&&l.arr<=end&&l.people.some(p=>p.name.toLowerCase()===person.name.toLowerCase()&&p.kind==='pilot'&&p.flightEligible)).reduce((s,l)=>s+l.block,0):null;
}return {tot,detail};
}
function assess(p,t,threshold){let cfg=DATA.meta.limits[p.kind]||{},seen=false,maxPct=0,top='';
for(let category of ['duty','flight'])for(let days of DATA.meta.windows){let limit=cfg[category]?.[days];
if(limit!==null&&limit!==undefined&&Number(limit)>0&&t[category][days]!==null){seen=true;
let pct=t[category][days]/(Number(limit)*60)*100;
if(pct>maxPct){maxPct=pct;
top=category+' '+days+'일';
}}}
return {seen,maxPct,top,status:!seen?'미설정':maxPct>100?'초과':maxPct>=threshold?'접근':'정상'};
}
function selectPlans(){let chosen=tripGroups(DATA.planned).filter(g=>SELECTED.has(g.id)).flatMap(g=>g.legs),kept=[],skipped=[];
for(const l of chosen){let found=duplicates(DATA.actual,l);
if(found.length)skipped.push(l);
else kept.push(l)}return {kept,skipped};
}
function refresh(){if(!DATA)return;
const selectedLegs=selectPlans().kept;
// Simulate at the end of the selected future trip, not solely at today's date.
const inputAsOf=Date.parse($('asof').value+'T00:00:00Z');
const latestSelected=selectedLegs.length?Math.max(...selectedLegs.map(l=>l.arr)):0;
const asof=Math.max(inputAsOf,latestSelected?Date.parse(utcDate(latestSelected)+'T00:00:00Z'):inputAsOf);
SIMULATED_ASOF=asof;
const threshold=Math.min(100,Math.max(1,Number($('threshold').value)||85));
const {kept,skipped}=selectPlans(),all=buildPersonLegs(DATA.actual,kept);
let results=all.map(p=>({...p,...compute(p,asof),assessment:null}));
// For future trips, flag a limit reached at ANY duty end in the selected trip.
results.forEach(p=>{
 p.assessment=assess(p,p.tot,threshold);
 const original=p.assessment;
 const futureEnds=selectedLegs.filter(l=>l.people.some(q=>q.name.toLowerCase()===p.name.toLowerCase())).map(l=>l.arr);
 for(const t of futureEnds){
   const rolling=compute(p,Date.parse(utcDate(t)+'T00:00:00Z')).tot;
   const a=assess(p,rolling,threshold);
   if(a.maxPct>original.maxPct){p.assessment=a;}
 }
});
results.sort((a,b)=>({초과:0,접근:1,정상:2,미설정:3}[a.assessment.status]-{초과:0,접근:1,정상:2,미설정:3}[b.assessment.status])||(b.assessment.maxPct-a.assessment.maxPct)||a.name.localeCompare(b.name));
const visible=results.filter(p=>($('kind').value==='all'||p.kind===$('kind').value)&&p.name.toLowerCase().includes($('search').value.trim().toLowerCase()));
$('count').textContent=visible.length;
$('exceed').textContent=visible.filter(p=>p.assessment.status==='초과').length;
$('near').textContent=visible.filter(p=>p.assessment.status==='접근').length;
$('unconfigured').textContent=visible.filter(p=>p.assessment.status==='미설정').length;
$('selectedSummary').textContent=`선택 ${SELECTED.size}개 TRIP / 신규 ${kept.length} LEG / 완료 기록과 중복 제외 ${skipped.length} LEG / 집계 기준 ${utcDate(asof)} UTC`; 
$('rows').innerHTML=visible.map(p=>{let a=p.assessment,cls=a.status==='초과'?'bad':a.status==='접근'?'warn':a.status==='정상'?'ok':'unknown',c=d=>d===null?'—':hh(d);
return `<tr data-name="${esc(p.name)}"><td><button type="button" class="person" data-key="${esc(p.name.toLowerCase())}">${esc(p.name)}</button></td><td>${p.kind==='pilot'?'Pilot':'Cabin/Other'}</td>${[7,28,365].map(n=>'<td>'+c(p.tot.duty[n])+'</td>').join('')}${[7,28,365].map(n=>'<td>'+c(p.tot.flight[n])+'</td>').join('')}<td>${a.seen?a.maxPct.toFixed(1)+'% <small>'+esc(a.top)+'</small>':'—'}${a.seen?`<div class="pct"><div class="fill ${cls}" style="width:${Math.min(a.maxPct,100)}%"></div></div>`:''}</td><td><span class="pill ${cls}">${a.status==='미설정'?'LIMIT 미설정':a.status}</span></td></tr>`}).join('');
$('rows').querySelectorAll('.person').forEach(b=>b.onclick=()=>{activePerson=b.dataset.key;
showDetails(results.find(p=>p.name.toLowerCase()===activePerson))});
if(activePerson)showDetails(results.find(p=>p.name.toLowerCase()===activePerson));
}
function showDetails(p){if(!p){$('details').textContent='승무원을 선택하세요.';
return}let d=p.detail.duty.filter(x=>x.end<=(SIMULATED_ASOF||Date.parse($('asof').value+'T00:00:00Z'))+86400000-1).slice(-30).reverse();
$('details').innerHTML='<strong>'+esc(p.name)+'</strong> · '+p.kind+'<div class="tblwrap"><table><thead><tr><th>시작 UTC</th><th>종료 UTC</th><th>LEG</th><th>BLOCK</th><th>G/T</th><th>DUTY</th></tr></thead><tbody>'+d.map(x=>`<tr><td>${new Date(x.start).toISOString().slice(0,16).replace('T',' ')}</td><td>${new Date(x.end).toISOString().slice(0,16).replace('T',' ')}</td><td>${esc(x.legs.map(l=>l.from+'-'+l.to).join(', '))}</td><td>${hh(x.block)}</td><td>${hh(x.ground)}</td><td>${hh(x.duty)}</td></tr>`).join('')+'</tbody></table></div>';
}
function showTrips(){let groups=tripGroups(DATA.planned);
$('trips').innerHTML=groups.map(g=>`<label class="trip"><input type="checkbox" data-trip="${esc(g.id)}" ${SELECTED.has(g.id)?'checked':''}><span><strong>${esc(g.route)}</strong><br><small>${new Date(g.start).toISOString().slice(0,16).replace('T',' ')} UTC · ${g.legs.length} LEG · ${esc(g.id)}</small></span></label>`).join('')||'<p class="hint">표시할 예정 비행이 없습니다.</p>';
$('trips').querySelectorAll('input[data-trip]').forEach(el=>el.onchange=()=>{if(el.checked)SELECTED.add(el.dataset.trip);
else SELECTED.delete(el.dataset.trip);
refresh()});
}
// 24-hour common-auth.js cache remains unchanged.
// Additional Google ID credential is required for every private GAS API request.
// ID tokens expire (typically around 1 hour); renewal may prompt the user.
const BACKEND_URL = 'https://script.google.com/macros/s/AKfycbw_hSBOeESSs9C8S_Mf2ORDBrRNCrb4AA30S4pkY_7C6I_b6QKaeaUYA0-dklS3UDXJSA/exec';
const GOOGLE_CLIENT_ID = '434108168386-jn8hp4mflhn68n98n6m9r1nm6iv7b3qe.apps.googleusercontent.com';
let idToken = '';
let tokenExpiryMs = 0;
let loading = false;
let requestingToken = false;
let oauthReady = false;

function authError(message) {
  const msg = $('message');
  msg.hidden = false;
  msg.textContent = message;
}

function receiveCredential(response) {
  idToken = String(response?.credential || '');
  if (!idToken) return authError('Google 인증정보를 받지 못했습니다.');
  try {
    const p = JSON.parse(atob(idToken.split('.')[1].replace(/-/g,'+').replace(/_/g,'/')));
    tokenExpiryMs = Number(p.exp)*1000;
  } catch (e) { tokenExpiryMs = 0; }
  requestingToken = false;
  $('loginButton').style.display='none';
  load();
}

function requestCredential() {
  if (!window.CURRENT_PORTAL_USER) return;
  if (!window.google?.accounts?.id) {
    authError('Google 로그인 모듈을 불러오는 중입니다. 잠시 후 새로고침하세요.');
    return;
  }
  if (!oauthReady) {
    google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: receiveCredential,
      auto_select: true,
      cancel_on_tap_outside: false
    });
    google.accounts.id.renderButton($('loginButton'),{
      theme:'outline',size:'large',shape:'pill',text:'continue_with',width:220
    });
    oauthReady = true;
  }
  $('loginButton').style.display = 'block';
  if (!requestingToken) {
    requestingToken = true;
    google.accounts.id.prompt();
  }
}

// POST to GAS through an isolated hidden iframe, no Worker, JSONP or CORS fetch.
// The reply origin, request ID, and source window are checked.
function gasBridgePost(payload) {
  return new Promise((resolve,reject)=>{
    const frame=document.createElement('iframe');
    frame.name='crewBridge_'+Math.random().toString(36).slice(2);
    frame.style.display='none';
    const form=document.createElement('form');
    form.method='POST';
    form.action=BACKEND_URL;
    form.target=frame.name;
    form.style.display='none';
    const reqId=crypto.randomUUID?.() || String(Date.now())+'_'+Math.random();
    let done=false;
    function cleanup(){window.removeEventListener('message',onMessage);clearTimeout(timer);frame.remove();form.remove();}
    function finish(error,result){if(done)return;done=true;cleanup();if(error)reject(error);else resolve(result);}
    function onMessage(evt){
      if (!['https://script.google.com','https://script.googleusercontent.com'].includes(evt.origin))return;
      if(evt.source!==frame.contentWindow)return;
      if(evt.data?.type!=='CREW_DUTY_REPLY'||evt.data.reqId!==reqId)return;
      finish(null,evt.data.data);
    }
    const timer=setTimeout(()=>finish(new Error('GAS 응답 시간 초과 (60초). 배포/iframe 정책을 확인하세요.')),60000);
    window.addEventListener('message',onMessage);
    Object.entries({...payload,reqId}).forEach(([key,value])=>{
      const input=document.createElement('input');input.type='hidden';input.name=key;input.value=String(value);form.appendChild(input);
    });
    document.body.appendChild(frame);document.body.appendChild(form);form.submit();
  });
}

async function load(){
  if(!window.CURRENT_PORTAL_USER)return;
  if(!idToken || Date.now()>tokenExpiryMs-60000){
    idToken='';
    requestCredential();
    return;
  }
  if(loading)return;
  loading=true;
  $('message').hidden=true;
  $('updated').textContent='Loading…';
  try{
    const data=await gasBridgePost({action:'data',idToken});
    if(!data || !data.ok)throw Error(data?.error || '백엔드 오류');
    DATA=data;
    $('updated').textContent='Loaded '+data.meta.generatedAt+' UTC · Actual '+data.actual.length+' LEG / Planned '+data.planned.length+' LEG';
    const errors=[...(data.errors?.actual||[]).map(x=>'실제: '+x),...(data.errors?.planned||[]).map(x=>'예정: '+x)];
    if(errors.length){$('message').hidden=false;$('message').textContent='일부 기록 제외: '+errors.slice(0,12).join(' / ');}
    SELECTED.clear();activePerson=null;showTrips();refresh();
  }catch(error){authError('데이터 로딩 오류: '+error.message);$('updated').textContent='Failed';}
  finally{loading=false;}
}
$('asof').value=new Date().toISOString().slice(0,10);
$('asof').min=new Date(Date.now()-365*86400000).toISOString().slice(0,10);
$('asof').max=new Date(Date.now()+365*86400000).toISOString().slice(0,10);
['asof','search','kind','threshold'].forEach(id=>$(id).addEventListener(id==='search'?'input':'change',refresh));
$('reload').onclick=load;
$('selectall').onclick=()=>{if(!DATA)return;
tripGroups(DATA.planned).forEach(g=>SELECTED.add(g.id));
showTrips();
refresh()};
$('clear').onclick=()=>{SELECTED.clear();
showTrips();
refresh()};
// Use existing 24-hour portal cache and app permission gate.
let crewAppStarted = false;
window.startProtectedApp = function () {
  if (crewAppStarted) return;
  crewAppStarted = true;
  requestCredential();
};
(function waitForPortalAuth(){
  if(window.CURRENT_PORTAL_USER){window.startProtectedApp();return;}
  setTimeout(waitForPortalAuth,250);
})();
</script>
  <script src="https://bomi87.github.io/SK-Aviation-portal/common-auth.js"></script>
 </body>
</html>
