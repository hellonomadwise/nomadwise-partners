/* Nomadwise partner placements · partners.nomadwise.io
   Providers open a private link (#k=…) and only ever receive their own data from the database.
   The team signs in with Google and gets everything. Nothing is ever emailed automatically:
   replies and reminders open in the team's own email app after approval. */
(function(){
const SB_URL="https://xclqfbuwrijpwtgbvrim.supabase.co";
const SB_KEY="sb_publishable_BdLDgE41WZXKIR7SaAvlxg_SJT3Ad_h";
const sb=window.supabase.createClient(SB_URL,SB_KEY,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
const SKEY="nw_partners_session";
const store={get(){try{return localStorage.getItem(SKEY)}catch(e){return null}},set(v){try{localStorage.setItem(SKEY,v)}catch(e){}},clear(){try{localStorage.removeItem(SKEY)}catch(e){}}};

const $=id=>document.getElementById(id);
const esc=s=>String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const slug=n=>String(n).toLowerCase().replace(/^the /,"").replace(/[^a-z0-9]+/g,"-");
const TODAY=new Date(); TODAY.setHours(0,0,0,0);
const D=s=>new Date(s+"T00:00:00");
const days=(a,b)=>Math.round((a-b)/864e5);
const MON=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const fmtM=d=>MON[d.getMonth()]+" "+d.getFullYear();
const fmtD=d=>d.getDate()+" "+MON[d.getMonth()]+" "+d.getFullYear();
const fmtDT=s=>{const d=new Date(s);return fmtD(d)+", "+String(d.getHours()).padStart(2,"0")+":"+String(d.getMinutes()).padStart(2,"0")};
const eur=n=>"€"+Math.round(n).toLocaleString("en-GB");
const eurS=n=>`<span style="white-space:nowrap;color:${Math.round(n)<0?"var(--coral)":"var(--accent)"}">${Math.round(n)<0?"-":"+"}${eur(Math.abs(n))}</span>`;
const REGION_ORDER=["Europe","Asia","Caucasus & Central Asia","Middle East","Africa","North America","Central America & Caribbean","South America","Oceania","Worldwide"];

// ---------- state ----------
let ROLE=null;           // "team" | "provider"
let ME=null;             // provider name, or the team member's email
let PAYMENTS=[]; let SESSION=null; let ACCESS=[]; let MYNAME=""; let ACT_EV=[]; let PREVIEW=false; let SALES_FROM=null;
let S={tiers:[],setPrices:{},packages:{},contracts:{},firstRefusal:{articles:[]},discTiers:[],review:0,discMin:0,discPct:0};
let ARTS=[], TOTALS=null, PROVIDERS=[], TEAM=[], REMS={}, offers=[];
const regionOf={};
let mode="team", asProv="__new";
const sel=new Map();
let reviews=0, submitted=null, laterOpen=false, sending=false, confirmOffer=null, draftNote="";
const openD=new Set();
const propOpt=new Set(); let propAccepted=false, propConfirm=false;
let filt={q:"",tier:"",avail:false,regions:new Set(),prov:"",ppos:""};
const drafts={};

// ---------- partner activity (partners only; admins and previews are never tracked) ----------
const VISIT_ID=Math.random().toString(36).slice(2,10);
let maxScroll=0;
window.addEventListener("scroll",()=>{const h=document.documentElement;const p=Math.round((h.scrollTop+h.clientHeight)/h.scrollHeight*100);if(p>maxScroll)maxScroll=Math.min(100,p)},{passive:true});
function deviceInfo(){const ua=navigator.userAgent;
  const dev=/iPad|Tablet/i.test(ua)?"tablet":(/Mobi|Android|iPhone/i.test(ua)?"phone":"desktop");
  const br=/Edg\//.test(ua)?"Edge":/OPR\//.test(ua)?"Opera":/Chrome\//.test(ua)?"Chrome":/Firefox\//.test(ua)?"Firefox":/Safari\//.test(ua)?"Safari":"other";
  const os=/Windows/.test(ua)?"Windows":/Mac OS X/.test(ua)&&!/iPhone|iPad/.test(ua)?"Mac":/iPhone|iPad/.test(ua)?"iOS":/Android/.test(ua)?"Android":/Linux/.test(ua)?"Linux":"other";
  let tz="";try{tz=Intl.DateTimeFormat().resolvedOptions().timeZone}catch(e){}
  return {device:dev,browser:br,os,tz,w:window.innerWidth,lang:navigator.language||""}}
function track(kind,detail){
  if(ROLE!=="provider"||!SESSION||PREVIEW)return;
  const d=Object.assign({},detail||{},{v:VISIT_ID});
  sb.rpc("partners_track",{p_session:SESSION,p_kind:kind,p_detail:d}).then(()=>{},()=>{});
}
let visStart=Date.now();
function flushTime(){
  if(ROLE!=="provider"||!SESSION||PREVIEW)return;
  const secs=Math.round((Date.now()-visStart)/1000);visStart=Date.now();
  if(secs<3||secs>4*3600)return;
  try{fetch(SB_URL+"/rest/v1/rpc/partners_track",{method:"POST",keepalive:true,headers:{"apikey":SB_KEY,"Content-Type":"application/json"},body:JSON.stringify({p_session:SESSION,p_kind:"time_on_page",p_detail:{seconds:secs,scroll:maxScroll,v:VISIT_ID}})})}catch(e){}
}
document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="hidden")flushTime();else visStart=Date.now()});
window.addEventListener("pagehide",flushTime);
let searchT;
const lastGuard={};
function guardHit(kind,detail){const now=Date.now();if(lastGuard[kind]&&now-lastGuard[kind]<20000)return;lastGuard[kind]=now;track(kind,detail||{})}
function lockPage(){
  document.body.classList.add("locked");
  const typing=t=>t&&t.closest&&t.closest("input,textarea,select");
  document.addEventListener("copy",e=>{if(typing(e.target))return;e.preventDefault();guardHit("copy_attempt")});
  document.addEventListener("cut",e=>{if(typing(e.target))return;e.preventDefault();guardHit("copy_attempt")});
  document.addEventListener("selectstart",e=>{if(typing(e.target))return;e.preventDefault();guardHit("select_attempt")});
  document.addEventListener("dragstart",e=>{e.preventDefault();guardHit("select_attempt")});
  document.addEventListener("contextmenu",e=>{if(typing(e.target))return;e.preventDefault();guardHit("right_click")});
  window.addEventListener("beforeprint",()=>guardHit("print_attempt"));
  document.addEventListener("keydown",e=>{
    if(!(e.ctrlKey||e.metaKey))return;const k=(e.key||"").toLowerCase();
    if(k==="a"&&!typing(e.target)){e.preventDefault();guardHit("select_attempt",{keys:"select all"})}
    else if(k==="c"&&!typing(e.target)){e.preventDefault();guardHit("copy_attempt",{keys:"copy"})}
    else if(k==="p"){e.preventDefault();guardHit("print_attempt",{keys:"print"})}
    else if(k==="s"){e.preventDefault();guardHit("save_attempt",{keys:"save page"})}
    else if(k==="u"){e.preventDefault();guardHit("source_attempt",{keys:"view source"})}
  });
}

function toast(msg){const t=$("toast");t.textContent=msg;t.hidden=false;clearTimeout(toast._t);toast._t=setTimeout(()=>{t.hidden=true},3200)}

// ---------- prices ----------
const byMin=()=>S.tiers.slice().sort((x,y)=>y.min-x.min);
const autoTier=a=>byMin().find(t=>a.clicks>=t.min)||S.tiers[S.tiers.length-1];
const manualTier=a=>S.groups&&S.groups[a.name]?S.tiers.find(t=>t.name===S.groups[a.name]):null;
const tierOf=a=>a.grp!==undefined?(S.tiers.find(t=>t.name===a.grp)||{name:a.grp,p1:a.p1,p2:a.p2}):(manualTier(a)||autoTier(a));
const grp=a=>{const o=S.setPrices[a.name];const name=a.grp!==undefined?a.grp:(o&&o.label?o.label:tierOf(a).name);const i=S.tiers.findIndex(t=>t.name===name);return {name,rank:i<0?-1:i}};
const priceOf=(a,pos)=>{if(a.grp!==undefined)return +(pos===1?a.p1:a.p2);const o=S.setPrices[a.name];if(o&&o["p"+pos]!=null)return +o["p"+pos];const t=tierOf(a);return pos===1?+t.p1:+t.p2};

// Providers on a contract see their deal, not per-slot list prices
// Admin filter: who currently holds a slot (paid now, or ended under 60 days ago and still in renewal)
const holdsNow=s=>s.prov&&(!s.exp||days(D(s.exp),TODAY)>=-60);
function status(a,s,viewer){
  const st=status0(a,s,viewer);
  const c=viewer&&S.contracts[viewer];
  if(c&&st.k==="mine"){st.sel=false;st.contract=true;if(st.fr)st.label=((c.included||[]).includes(a.name)||propOpt.has(a.name))?"In your proposal":"Optional, tick above";}
  // One position per article: a partner can never hold or pick both 1st and 2nd
  if(viewer&&st.sel&&st.k!=="mine"){const op=s.pos===1?2:1,os=a.slots[op-1],ost=os?status0(a,os,viewer):null,pk=key(a,op);
    const holds=ost&&ost.k==="mine",picked=sel.has(pk);
    if(holds||picked){const ol=op===1?"1st":"2nd";return {k:"taken",label:holds?"You have "+ol+" here":"You picked "+ol+" here",who:"",sel:false,oneEach:true}}}
  if(viewer===null&&s.prov&&S.contracts[s.prov]&&st.who&&s.pos===1)st.who+=(S.contracts[s.prov].exclusive||[]).includes(a.name)?" · exclusive":(s.exp===S.contracts[s.prov].contractEnd?" · non-exclusive":"");
  return st;
}
// Status of one slot as seen by a viewer (null = team)
function status0(a,s,viewer){
  const fr=S.firstRefusal||{articles:[]};
  if(s.flag==="E") return {k:"taken",label:"Unavailable",who:s.prov+" · ongoing",held:true,paid:true};
  if(s.pos===1 && S.packages&&S.packages[a.name]){
    return {k:"reserved",label:"Sold with "+S.packages[a.name],who:"Package rule",held:false};
  }
  if(s.pos===1 && (fr.articles||[]).includes(a.name) && fr.until && D(fr.until)>=TODAY){
    if(viewer===fr.holder) return {k:"mine",label:"Your first refusal",fr:true,sel:true,who:""};
    return {k:"reserved",label:"Reserved to "+fmtM(D(fr.until)),who:"Free now, held for "+fr.holder+"'s proposal",held:false,frSlot:true};
  }
  if(s.prov && s.exp){
    const e=D(s.exp), d=days(e,TODAY);
    if(d>=0){
      const soon=d<=90;
      if(viewer===s.prov) return {k:"mine",label:soon?"Renew by "+fmtD(e):"Yours to "+fmtM(e),sel:true,soon,exp:e,held:true,paid:true};
      const nx=new Date(e);nx.setDate(nx.getDate()+1);
      return {k:"taken",label:"Unavailable · opens "+fmtM(nx),who:s.prov+" · "+fmtD(e),soon,exp:e,held:true,paid:true};
    }
    if(d>=-60){
      if(viewer===s.prov){const hold=new Date(e);hold.setDate(hold.getDate()+60);return {k:"mine",label:"Ended "+e.getDate()+" "+MON[e.getMonth()]+", renew now",due:true,sel:true,exp:e,hold,held:true,paid:true};}
      return {k:"reserved",label:"In renewal",who:s.prov+" · ended "+fmtD(e),due:true,exp:e,held:true,paid:true};
    }
    return {k:"available",label:"Available",sel:true,who:"Unpaid: "+s.prov+" showing since "+fmtM(e)};
  }
  if(s.flag==="R31") return {k:"reserved",label:"Reserved to Dec 2026",who:"First refusal to 31 Dec 2026"};
  return {k:"available",label:"Available",sel:true,who:s.flag==="R"?"First refusal ended Apr 2026":(s.flag==="O"?"Outside contract":"")};
}

// ---------- loading ----------
function setRegions(){ARTS.forEach(a=>{regionOf[a.name]=a.region||"Other"})}
const firstOf=n=>String(n||"").trim().split(/\s+/)[0]||"";

async function boot(){
  const m=location.hash.match(/login=([a-f0-9]{20,})/i);
  if(m){
    history.replaceState(null,"",location.pathname);
    const {data,error}=await sb.rpc("partners_redeem",{p_login:m[1]});
    if(error) return message("We couldn't sign you in just now","Please try the link again in a minute.");
    if(!data) return gate("This sign-in link has expired. Enter your email for a new one.");
    store.set(data);
  }
  SESSION=store.get();
  if(!SESSION) return gate();
  return load();
}

async function load(){
  const {data,error}=await sb.rpc("partners_page",{p_session:SESSION});
  if(error) return message("We couldn't load your page just now","Please refresh in a minute.");
  if(!data){store.clear();SESSION=null;return gate("Please sign in again.")}
  MYNAME=data.name||"";
  if(data.role==="team"){
    ROLE="team"; ME=data.me; applyTeamData(data);
    mode="team"; asProv=(PROVIDERS.find(p=>S.contracts[p.name])||PROVIDERS[0]||{name:"__new"}).name;
    return render();
  }
  showPartner(data);
}
function showPartner(data){
  MYNAME=data.name||"";
  ROLE="provider"; ME=data.provider; mode="prov"; asProv=ME;
  S=Object.assign({},data.settings,{contracts:data.contracts||{}});
  ARTS=(data.articles||[]).map(a=>({name:a.name,region:a.region,grp:a.grp,p1:+a.p1,p2:+a.p2,slots:a.slots.map(s=>({pos:s.pos,prov:s.prov||"",exp:s.exp||"",flag:s.flag||""}))}));
  TOTALS=data.totals; setRegions(); visStart=Date.now();
  const lo=data.lastOffer;
  if(lo&&lo.kind==="proposal"&&(lo.status==="new"||lo.status==="accepted")){
    propAccepted=true;(lo.items||[]).forEach(it=>{const m=/^(.*) 1st$/.exec(it);if(m)propOpt.add(m[1])});
  }else if(lo&&lo.status==="new"){
    submitted={offer:+lo.offer,when:lo.created_at,items:lo.items||[]};
  }
  $("switch").innerHTML="";
  $("topbar").innerHTML=`<span>Signed in as ${esc(MYNAME||data.me)}${MYNAME?` · ${esc(data.me)}`:""}</span><button id="out">Sign out</button>`;
  $("out").addEventListener("click",PREVIEW?exitPreview:signOut);
  if(!PREVIEW)lockPage();
  render();
  track("visit",deviceInfo());
}
// Admin: open exactly the page a partner gets (built by the database, same as theirs)
async function startPreview(company){
  const {data,error}=await sb.rpc("partners_team_preview",{p_session:SESSION,p_provider:company==="__new"?"":company});
  if(error||!data){toast("Couldn't open the preview: "+(error?error.message:"no data"));return}
  PREVIEW=true;resetSel();window.scrollTo({top:0});
  if(company==="__new"){data.provider="";data.name=null}
  showPartner(data);
  if(company==="__new"){ME="__new";asProv="__new";render()}
  const bar=document.createElement("div");bar.className="pvbar";bar.id="pvbar";
  bar.innerHTML=`<span>${company==="__new"?"Previewing what a new partner sees":"Previewing exactly what "+esc(data.name||company)+(data.name?" at "+esc(company):"")+" sees"}. Nothing here is sent or recorded.</span><button id="pv-exit">Exit preview</button>`;
  document.body.appendChild(bar);$("pv-exit").addEventListener("click",exitPreview);
}
function exitPreview(){location.reload()}
function applyTeamData(data){
  S=Object.assign({},data.settings,{contracts:data.contracts||{}});
  SALES_FROM=data.salesFrom||null; PAYMENTS=data.payments||[];
  ARTS=(data.articles||[]).map(r=>({name:r.name,region:r.region,views:r.views,clicks:r.clicks,sales:r.sales||null,slots:[{pos:1,prov:r.p1_prov||"",exp:r.p1_exp||"",flag:r.p1_flag||""},{pos:2,prov:r.p2_prov||"",exp:r.p2_exp||"",flag:r.p2_flag||""}]}));
  PROVIDERS=data.providers||[]; ACCESS=data.access||[]; REMS=data.reminders||{}; ACT_EV=data.activity||[];
  offers=(data.offers||[]).map(o=>({id:o.id,from:o.provider,email:emailsOf(o.provider),when:fmtDT(o.created_at),items:o.items||[],list:+o.list||0,offer:+o.offer,note:o.note,status:o.status,kind:o.kind,action:o.status==="new"?null:o.action,counterAmt:o.counter_amt!=null?+o.counter_amt:null,draftText:o.status==="new"?null:o.draft_text,sent:o.status!=="new",decided:o.decided_at?fmtD(new Date(o.decided_at))+(o.decided_by?" by "+o.decided_by:""):""}));
  setRegions();
}
const emailsOf=p=>ACCESS.filter(x=>x.provider===p).map(x=>x.email).join(",");
const namesOf=p=>ACCESS.filter(x=>x.provider===p&&x.name).map(x=>firstOf(x.name));
async function reloadTeam(){const {data,error}=await sb.rpc("partners_page",{p_session:SESSION});if(!error&&data&&data.role==="team"){applyTeamData(data);render()}}

function gate(note){
  $("topbar").innerHTML="";$("switch").innerHTML="";
  $("forwho").innerHTML="";$("stats").innerHTML="";$("rail").innerHTML="";
  document.querySelector("header.top h1").textContent="Partner portal";
  $("main").innerHTML=`<section class="panel gate"><h2>Welcome to Nomadwise Partners</h2>
    ${note?`<p class="note">${esc(note)}</p>`:""}
    <form id="signin" class="col" style="gap:10px">
      <label class="fl">Your email<input id="si-email" type="email" autocomplete="email" required placeholder="name@company.com"></label>
      <button class="btn primary" type="submit">Email me a sign-in link</button>
    </form>
    <div class="done" id="si-done" hidden>If that email has access, a sign-in link is on its way. It works for the next hour.</div></section>`;
  $("grid").style.gridTemplateColumns="minmax(0,1fr)";
  $("signin").addEventListener("submit",async e=>{e.preventDefault();const btn=e.target.querySelector("button");btn.disabled=true;
    await sb.rpc("partners_request_link",{p_email:$("si-email").value});
    $("signin").hidden=true;$("si-done").hidden=false});
}
function message(title,body,signedIn){
  $("forwho").innerHTML="";$("stats").innerHTML="";$("rail").innerHTML="";
  $("grid").style.gridTemplateColumns="minmax(0,1fr)";
  $("main").innerHTML=`<section class="panel gate"><h2>${esc(title)}</h2><p class="muted">${esc(body)}</p>${signedIn?`<div class="acts"><button class="btn" id="g-out">Sign out</button></div>`:""}</section>`;
  if(signedIn)$("g-out").addEventListener("click",signOut);
}
async function signOut(){try{await sb.rpc("partners_sign_out",{p_session:SESSION})}catch(e){}store.clear();location.replace(location.origin+location.pathname)}

// ---------- offers (team) ----------
function invoice(o){
  let sub=0,elig=0,eligVal=0,priced=true;
  const rows=o.items.map(it=>{
    const m=String(it).match(/^(.*) · (1st|2nd)$/);const a=m&&ARTS.find(x=>x.name===m[1]);
    if(a){const pos=m[2]==="1st"?1:2,p=priceOf(a,pos),t=grp(a).name;sub+=p;if((S.discTiers||[]).includes(t)){elig++;eligVal+=p}return `<tr><td>${esc(a.name)}</td><td>${m[2]}</td><td>${esc(t)}</td><td class="num">${eur(p)}</td></tr>`}
    const r=String(it).match(/^Review article × (\d+)$/);if(r){const p=S.review*+r[1];sub+=p;return `<tr><td>Review article × ${r[1]}</td><td>Add-on</td><td></td><td class="num">${eur(p)}</td></tr>`}
    priced=false;return `<tr><td colspan="3">${esc(it)}</td><td class="num muted">in proposal</td></tr>`;
  }).join("");
  const disc=elig>=S.discMin?Math.round(eligVal*S.discPct/100):0;const pkg=priced?sub-disc:o.list;
  const gap=o.offer-pkg,pct=pkg?Math.round(o.offer/pkg*100):0;o._pkg=pkg;
  return `<div class="scroll"><table class="inv"><thead><tr><th>Article</th><th>Position</th><th>Tier</th><th class="num">List price</th></tr></thead><tbody>${rows}</tbody>
    <tfoot>${priced?`<tr><td colspan="3">Subtotal</td><td class="num">${eur(sub)}</td></tr>${disc?`<tr><td colspan="3">Package discount (${elig} Premium or Standard, ${S.discPct}%)</td><td class="num">−${eur(disc)}</td></tr>`:""}`:""}
    <tr><td colspan="3">${o.kind==="proposal"?"Proposal value, 12 months":"Package price"}</td><td class="num">${eur(pkg)}</td></tr>
    <tr class="offer"><td colspan="3">${o.kind==="proposal"?"They accepted":"Their offer"}</td><td class="num">${eur(o.offer)}</td></tr>
    ${o.kind==="proposal"?"":`<tr><td colspan="3" class="muted">Difference</td><td class="num ${gap<0?"neg":""}">${gap<0?"−":""}${eur(Math.abs(gap))} · ${pct}% of price</td></tr>`}</tfoot></table></div>`;
}
const ACT={
  accept:{label:"Accept",what:"Drafts a confirmation. Approving opens it in your email app, ready to send. Then add the slots to the Notion placements table and send the invoice. Each placement runs 12 months from going live."},
  counter:{label:"Counter",what:"Suggest a different price. Approving opens the reply in your email app. Hold the slots for them for 7 days while they decide."},
  decline:{label:"Decline",what:"Drafts a polite no and opens it in your email app. They can then send a new offer from their page."}
};
const firstName=o=>{const n=namesOf(o.from);return n.length?n.join(" and "):o.from+" team"};
const itemLines=o=>o.items.map(it=>{const m=String(it).match(/^(.*) · (1st|2nd)$/);return "- "+(m?m[1]+", "+m[2]+" position":it)}).join("\n");
const holdDate=()=>{const d=new Date(TODAY);d.setDate(d.getDate()+7);return fmtD(d)};
function draftFor(o){
  const n=firstName(o),sig="\n\nBest,\nThe Nomadwise team";
  if(o.kind==="proposal"){
    if(o.action==="accept")return `Hi ${n},\n\nThanks for confirming the 2027 proposal at ${eur(o.offer/12)} a month:\n${itemLines(o)}\n\nWe'll send the agreement over shortly, and everything carries on without a break from 1 January.`+sig;
    if(o.action==="counter")return `Hi ${n},\n\nThanks for coming back on the 2027 proposal. Before we confirm, we'd like to suggest ${eur(o.counterAmt/12)} a month for:\n${itemLines(o)}\n\nJust reply here and we'll send the agreement.`+sig;
    return `Hi ${n},\n\nThanks for coming back on the 2027 proposal. Unfortunately we can't go ahead on these terms. Happy to talk through options, just reply here.`+sig;
  }
  if(o.action==="accept")return `Hi ${n},\n\nThanks for your offer. We're happy to accept ${eur(o.offer)} for these placements:\n${itemLines(o)}\n\nEach placement runs for 12 months from the day it goes live. We'll send the invoice shortly, and the placements go live once it's paid.`+sig;
  if(o.action==="counter")return `Hi ${n},\n\nThanks for your offer of ${eur(o.offer)}. We can't go quite that low for this package, but we can do ${eur(o.counterAmt)} for:\n${itemLines(o)}\n\nWe're holding these placements for you until ${holdDate()}. Reply here to accept, or send a new offer from your partner page.`+sig;
  return `Hi ${n},\n\nThanks for your offer of ${eur(o.offer)}. Unfortunately we can't accept it for this package.\n\nIf it helps, you could choose a smaller selection at the listed price${o.items.some(it=>/ · 1st$/.test(it))?", or look at 2nd positions on the same articles":""}. Your partner page shows everything that's open, and you're welcome to send a new offer.`+sig;
}
function openMail(to,subject,body){
  const addr=String(to||"").split(",").map(s=>s.trim()).filter(s=>/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(s)).join(",");
  location.href="mailto:"+addr+"?subject="+encodeURIComponent(subject)+"&body="+encodeURIComponent(body);
}
function actionBlock(o,i){
  if(o.sent)return `<div class="done"><b>${{accept:"Accepted",counter:"Countered",decline:"Declined"}[o.action]||"Answered"}</b>${o.decided?" · "+esc(o.decided):""}${o.preview?' <span class="muted">Preview only, nothing was sent.</span>':""}</div>
    ${o.draftText?`<details><summary class="note" style="cursor:pointer">The reply we sent</summary><div class="draft" style="margin-top:6px">${esc(o.draftText)}</div></details>`:""}
    <div class="acts"><button class="btn small ghost" data-undo="${i}">Move back to open</button></div>`;
  if(!o.action)return `<div class="acts">${Object.entries(ACT).map(([k,a])=>`<button class="btn small ${k==="accept"?"primary":k==="decline"?"ghost":""}" data-oa="${i}|${k}">${a.label}</button>`).join("")}</div>
    <ul class="what">${Object.values(ACT).map(a=>`<li><b>${a.label}</b> ${a.what}</li>`).join("")}</ul>`;
  const a=ACT[o.action];
  if(o.action==="counter"&&!o.counterDrafted)return `<div class="step"><b>Counter</b><p class="note">${a.what}</p>
    <label class="fl">Your counter price for the ${o.kind==="proposal"?"year":"package"} (€)<input id="ca-${i}" type="number" min="1" value="${Math.round(o.counterAmt||o._pkg||o.offer)}"></label>
    <div class="acts"><button class="btn small primary" data-cd="${i}">Draft the reply</button><button class="btn small ghost" data-back="${i}">Back</button></div></div>`;
  return `<div class="step"><b>${a.label}</b><p class="note">${a.what}</p>
    ${o.email?"":`<p class="note"><b>No one from ${esc(o.from)} is on the access list yet.</b> Add them under Who has access, or type their email into your email app.</p>`}
    <label class="eyebrow" for="dt-${i}">Draft reply to the provider · edit freely</label><textarea class="draft" id="dt-${i}" data-dt="${i}" rows="12">${esc(o.draftText??(o.draftText=draftFor(o)))}</textarea>
    <div class="acts"><button class="btn small primary" data-send="${i}">Approve and open in email</button><button class="btn small ghost" data-back="${i}">Back</button></div></div>`;
}
function chipList(names){
  const g={};names.forEach(n=>{const r=regionOf[n]||"Other";(g[r]=g[r]||[]).push(n)});
  return `<div class="clist">${REGION_ORDER.concat("Other").filter(r=>g[r]).map(r=>`<div class="cgrp"><span class="eyebrow">${esc(r)} · ${g[r].length}</span><div class="chips">${g[r].sort((a,b)=>a.replace(/^The /,"").localeCompare(b.replace(/^The /,""))).map(n=>`<span class="chip">${esc(n)}</span>`).join("")}</div></div>`).join("")}</div>`;
}
const fold=(id,title,inner)=>`<details class="fold" id="${id}" ${openD.has(id)?"open":""}><summary>${title}<span class="tag-internal">Admin only</span></summary><div class="fold-in">${inner}</div></details>`;
const renewable=m=>m.st.fr||m.st.due||m.st.soon;
const ptot=c=>c.base+[...propOpt].reduce((t,o)=>t+((c.prices||{})[o]||0),0);
const key=(a,pos)=>a.name+" · "+(pos===1?"1st":"2nd");
const viewer=()=>mode==="team"?null:asProv;

// ---------- render ----------
function render(){
  $("grid").style.gridTemplateColumns="";
  const v=viewer();
  if(ROLE==="team"){
    $("topbar").innerHTML=`<span>Signed in as ${esc(MYNAME||ME)}${MYNAME?` · ${esc(ME)}`:""}</span><button id="out">Sign out</button>`;
    $("out").addEventListener("click",signOut);
    const opts=PROVIDERS.map(p=>{const c=ACCESS.find(x=>x.provider===p.name);return [p.name,esc(p.name)+(c&&c.name?" · "+esc(c.name):" · no contact yet")]}).concat([["__new","A new partner (no placements)"]]);
    $("switch").innerHTML=`<div class="switch" role="group" aria-label="Preview a partner's page"><span class="eyebrow">See exactly what a partner sees</span>
      <select id="as-prov" aria-label="Partner to preview">${opts.map(([v,l])=>`<option value="${esc(v)}">${l}</option>`).join("")}</select>
      <button class="btn small" id="pv-open">Open their page</button></div>`;
    $("pv-open").addEventListener("click",()=>startPreview($("as-prov").value));
  }
  const who="<b>"+esc(v)+"</b>";
  $("forwho").innerHTML=v===null?"<b>Admin view</b> · visible only to Nomadwise":(v==="__new"?"Prepared for <b>a new partner</b>":"Prepared for "+who);
  if(ROLE==="provider"){document.querySelector("header.top h1").textContent=MYNAME?"Welcome, "+firstOf(MYNAME):"Partner placements"}
  const totalViews=TOTALS?+TOTALS.views:ARTS.reduce((t,a)=>t+a.views,0);
  const totalClicks=TOTALS?+TOTALS.clicks:ARTS.reduce((t,a)=>t+a.clicks,0);
  const av=[0,0,0];ARTS.forEach(a=>a.slots.forEach(s=>{if(status(a,s,v).k==="available")av[s.pos]++}));
  $("stats").innerHTML=`<div class="stat"><span class="v">${ARTS.length}</span><span class="l">eSIM guides</span></div>
    <div class="stat"><span class="v">${totalViews.toLocaleString("en-GB")}</span><span class="l">page views, last 12 months</span></div>
    <div class="stat"><span class="v">${totalClicks.toLocaleString("en-GB")}</span><span class="l">clicks to providers</span></div>
    <div class="stat"><span class="v">${totalViews?(totalClicks/totalViews*100).toFixed(1):"0"}%</span><span class="l">blended click rate</span></div>
    <div class="stat"><span class="v">${av[1]}</span><span class="l">1st positions open now</span></div>
    <div class="stat"><span class="v">${av[2]}</span><span class="l">2nd positions open now</span></div>`;
  $("main").innerHTML=(v===null?teamPanels():"")+(v!==null&&v!=="__new"?currentPanel(v):"")+inventoryPanel(v)+addonPanel();
  $("rail").innerHTML=railPanel(v);
  bind();
  mbar();
}
function resetSel(){sel.clear();reviews=0;submitted=null;propOpt.clear();propAccepted=false;propConfirm=false}

// ---------- partner activity (admin) ----------
const mins=s=>s<60?s+" sec":(s<3600?Math.round(s/60)+" min":(s/3600).toFixed(1)+" h");
const ago=d=>{const s=(Date.now()-d)/1000;if(s<90)return "just now";if(s<3600)return Math.round(s/60)+" min ago";if(s<86400)return Math.round(s/3600)+" h ago";const n=Math.round(s/86400);return n===1?"yesterday":n+" days ago"};
function evText(e){const d=e.detail||{};switch(e.kind){
  case "visit":return "opened their page";
  case "slot_add":return (d.renewal?"ticked to renew ":"added ")+"<b>"+esc(d.item)+"</b>"+(d.price!=null?" ("+eur(d.price)+")":"");
  case "slot_remove":return "removed "+esc(d.item);
  case "filter_region":return "looked at <b>"+esc(d.region)+"</b>";
  case "filter_tier":return "filtered to "+esc(d.tier);
  case "search":return "searched “"+esc(d.q)+"”";
  case "filter_available":return "showed only what they can pick";
  case "review_change":return "set review articles to "+esc(d.count);
  case "offer_sent":return "<b>sent an offer</b>: "+eur(d.offer)+" for "+esc(d.items)+" items";
  case "proposal_option":return (d.on?"ticked ":"unticked ")+"<b>"+esc(d.country)+"</b> in the 2027 proposal";
  case "proposal_accepted":return "<b>accepted the 2027 proposal</b> at "+eur(d.monthly)+" a month";
  case "renew_all":return "ticked renew all ("+esc(d.count)+")";
  case "view_later_placements":return "looked at their 2027 placements";
  case "time_on_page":return "left the page after "+mins(d.seconds)+(d.scroll?", scrolled "+d.scroll+"% of the way down":"");
  case "tap_unavailable":return "tapped <b>"+esc(d.item)+"</b>, which shows “"+esc(d.label)+"”";
  case "open_section":return "opened "+esc(d.section);
  case "copy_attempt":return '<span class="pill due">tried to copy</span>'+(d.keys?" (keyboard)":"");
  case "select_attempt":return '<span class="pill due">tried to select text</span>'+(d.keys?" (select all)":"");
  case "right_click":return '<span class="pill due">tried to right-click</span>';
  case "print_attempt":return '<span class="pill due">tried to print</span>';
  case "save_attempt":return '<span class="pill due">tried to save the page</span>';
  case "source_attempt":return '<span class="pill due">tried to view the page source</span>';
  default:return esc(e.kind)}}
function activityPanel(){
  const ev=ACT_EV.map(e=>Object.assign({},e,{t:new Date(e.at)})).sort((x,y)=>y.t-x.t);
  const since=new Date(Date.now()-90*864e5);
  const who=em=>{const x=ACCESS.find(a=>a.email===em);return x&&x.name?x.name:em};
  const by={};
  ev.slice().reverse().forEach(e=>{const p=by[e.email]=by[e.email]||{email:e.email,provider:e.provider,visits:0,secs:0,last:null,added:new Map(),removed:new Set(),regions:{},searches:new Set(),offers:0,flags:{},taps:new Set()};
    if(!p.last||e.t>p.last)p.last=e.t;
    if(e.t<since)return;
    const d=e.detail||{};
    if(e.kind==="visit")p.visits++;
    if(e.kind==="time_on_page")p.secs+=+d.seconds||0;
    if(e.kind==="slot_add")p.added.set(d.item,d);
    if(e.kind==="slot_remove")p.added.delete(d.item);
    if(e.kind==="proposal_option"){const it=d.country+" · 1st (2027 proposal)";if(d.on)p.added.set(it,d);else p.added.delete(it)}
    if(e.kind==="offer_sent")p.added.clear();
    if(e.kind==="filter_region")p.regions[d.region]=(p.regions[d.region]||0)+1;
    if(e.kind==="search")p.searches.add(d.q);
    if(e.kind==="tap_unavailable")p.taps.add(d.item);
    if(/_attempt$|^right_click$/.test(e.kind))p.flags[e.kind]=(p.flags[e.kind]||0)+1;
    if(e.kind==="offer_sent"||e.kind==="proposal_accepted")p.offers++;
  });
  const people=Object.values(by).sort((x,y)=>y.last-x.last);
  const recent=people.filter(p=>p.last>=since);
  const tot={visits:0,secs:0,added:0,offers:0};recent.forEach(p=>{tot.visits+=p.visits;tot.secs+=p.secs;tot.added+=p.added.size;tot.offers+=p.offers});
  const interest={};recent.forEach(p=>p.added.forEach((d,item)=>{(interest[item]=interest[item]||[]).push(p)}));
  const topI=Object.entries(interest).sort((x,y)=>y[1].length-x[1].length).slice(0,12);
  const visitsOf=email=>{const mine=ev.filter(e=>e.email===email).slice().reverse();const out=[];let cur=null;
    mine.forEach(e=>{const d=e.detail||{};const vid=d.v||null;
      if(e.kind==="visit"||!cur||(vid&&cur.vid&&vid!==cur.vid)||(!vid&&e.t-cur.end>30*60000)){cur={vid,start:e.t,end:e.t,info:e.kind==="visit"?d:null,steps:[],secs:0,scroll:0};out.push(cur)}
      cur.end=e.t;if(e.kind==="time_on_page"){cur.secs+=+d.seconds||0;cur.scroll=Math.max(cur.scroll,+d.scroll||0)}
      if(e.kind!=="visit")cur.steps.push(e)});
    return out.reverse()};
  const tm=t=>String(t.getHours()).padStart(2,"0")+":"+String(t.getMinutes()).padStart(2,"0")+":"+String(t.getSeconds()).padStart(2,"0");
  const visitHtml=v=>{const i=v.info||{};
    return `<details class="rg"><summary><b>${fmtD(v.start)}, ${tm(v.start).slice(0,5)}</b> · ${v.secs?mins(v.secs):"under a minute"}${v.scroll?" · scrolled "+v.scroll+"%":""} · ${v.steps.filter(s=>s.kind!=="time_on_page").length} actions${i.device?` <span class="muted">· ${esc(i.device)}, ${esc(i.browser)} on ${esc(i.os)}${i.tz?", "+esc(i.tz):""}</span>`:""}</summary>
      <div class="cur" style="margin:6px 0 4px 14px">${v.steps.length?v.steps.map(s=>`<div class="ci" style="grid-template-columns:auto minmax(0,1fr);padding:4px 0"><span class="muted mono" style="font-size:.76rem">${tm(s.t)}</span><span style="font-size:.86rem">${evText(s)}</span></div>`).join(""):'<p class="muted" style="font-size:.86rem">Opened the page and looked around without clicking anything.</p>'}</div></details>`};
  // one line per partner (everyone with partner access, plus anyone with activity), newest first
  ACCESS.filter(x=>x.provider&&!by[x.email]).forEach(x=>{by[x.email]={email:x.email,provider:x.provider,visits:0,secs:0,last:null,added:new Map(),regions:{},searches:new Set(),offers:0,flags:{},taps:new Set(),never:true}});
  const all=Object.values(by).sort((x,y)=>(y.last||0)-(x.last||0));
  const flagTxt=p=>Object.entries(p.flags).map(([k,n])=>({copy_attempt:"copy",select_attempt:"select",right_click:"right-click",print_attempt:"print",save_attempt:"save",source_attempt:"view source"}[k]||k)+" ×"+n).join(", ");
  const line=p=>{const unsent=[...p.added.keys()];const vis=p.never?[]:visitsOf(p.email);const regs=Object.entries(p.regions).sort((a,b)=>b[1]-a[1]).map(r=>r[0]);const id="pa-"+slug(p.email);
    const summary=p.never?'<span class="muted">Not visited yet</span>'
      :`<span class="muted">Last seen ${ago(p.last)} · ${vis.length} ${vis.length===1?"visit":"visits"} · ${mins(vis.reduce((t,v)=>t+v.secs,0))}</span>${unsent.length?` <span class="pill soon">${unsent.length} in selection, not sent</span>`:""}${p.offers?` <span class="pill ok">${p.offers} offer${p.offers>1?"s":""} sent</span>`:""}${Object.keys(p.flags).length?` <span class="pill due">Tried to take content</span>`:""}`;
    return `<details class="qi" id="${id}" ${openD.has(id)?"open":""}><summary class="h" style="cursor:pointer"><span><b>${esc(who(p.email))}</b> <span class="muted">· ${esc(p.provider)} · ${esc(p.email)}</span></span><span style="display:flex;gap:6px;flex-wrap:wrap;align-items:center;font-size:.84rem">${summary}</span></summary>
      ${p.never?'<p class="muted" style="font-size:.88rem">They have access but haven\'t signed in yet. Use Email sign-in link under Who has access to send them a link.</p>':`
      ${Object.keys(p.flags).length?`<div><span class="pill due">Tried to take content: ${flagTxt(p)}</span></div>`:""}
      <div class="facts">
        ${regs.length?`<div><span class="eyebrow">Regions looked at</span><span>${regs.map(esc).join(", ")}</span></div>`:""}
        ${p.searches.size?`<div><span class="eyebrow">Searched</span><span>${[...p.searches].map(s=>"“"+esc(s)+"”").join(", ")}</span></div>`:""}
      </div>
      ${unsent.length?`<div><span class="eyebrow">In their selection, not sent yet</span><div class="chips" style="margin-top:6px">${unsent.map(i=>`<span class="chip">${esc(i)}</span>`).join("")}</div></div>`:""}
      ${p.taps.size?`<div><span class="eyebrow">Looked at slots held by others</span><div class="chips" style="margin-top:6px">${[...p.taps].map(i=>`<span class="chip" style="background:var(--taken-soft);color:var(--muted)">${esc(i)}</span>`).join("")}</div></div>`:""}
      <div><span class="eyebrow">Every visit, newest first · open one to see each step</span><div class="rgs" style="margin-top:6px">${vis.map(visitHtml).join("")}</div></div>`}
    </details>`};
  return `<section class="panel internal"><div class="phead"><h2 class="dup">Partner activity<span class="tag-internal">Admin only</span></h2><span class="muted">Last 90 days · admins and previews are never recorded</span></div>
    <div class="queue">${all.map(line).join("")||'<p class="muted" style="font-size:.9rem">No partners have access yet. Add them under Who has access.</p>'}</div>
    ${topI.length?`<details class="rg" style="margin-top:6px"><summary style="cursor:pointer;font-weight:600">Slots partners have picked but not sent · ${topI.length}</summary><div class="scroll" style="margin-top:8px"><table class="tbl"><thead><tr><th>Slot</th><th>In the selection of</th></tr></thead><tbody>${topI.map(([i,ps])=>`<tr><td>${esc(i)}</td><td>${ps.map(p=>esc(who(p.email))+" <span class='muted'>("+esc(p.provider)+")</span>").join(", ")}</td></tr>`).join("")}</tbody></table></div></details>`:""}
  </section>`;
}
function activityTitle(){const wk=ACT_EV.filter(e=>e.kind==="visit"&&new Date(e.at)>new Date(Date.now()-7*864e5)).length;return "Partner activity"+(wk?` <span class="muted" style="font-weight:500;font-size:.9rem">· ${wk} ${wk===1?"visit":"visits"} this week</span>`:"")}

function teamPanels(){
  let paid=0,inRen=0,res=0,open=0,total=0;
  ARTS.forEach(a=>a.slots.forEach(s=>{total++;const st=status(a,s,null);
    if(st.k==="taken")paid++;else if(st.due)inRen++;else if(st.k==="reserved")res++;else if(st.k==="available")open++;}));
  const pct=n=>total?Math.round(n/total*100):0;
  const byP={};
  ARTS.forEach(a=>a.slots.forEach(s=>{const st=status(a,s,null);
    if(s.prov&&st.exp&&(st.due||st.soon)){(byP[s.prov]=byP[s.prov]||[]).push({a,s,st})}}));
  const provs=Object.keys(byP).sort((x,y)=>byP[y].length-byP[x].length);
  const how=`<section class="panel internal"><div class="phead"><h2 class="dup">How this works<span class="tag-internal">Admin only</span></h2></div>
    <ol class="how">
      <li><b>One master list</b><span>Who holds which slot comes from the Notion placements table. Prices and rules are edited here, under Prices and rules.</span></li>
      <li><b>Sign in by email</b><span>Give someone access with their name, email and role. Partners sign in at partners.nomadwise.io and see open slots, prices and their own placements, never other providers' names, prices or per-article numbers.</span></li>
      <li><b>They pick and offer</b><span>Providers tick slots and add-ons, see the list total, and send one package offer. No auction, no automatic replies.</span></li>
      <li><b>We decide</b><span>Offers land in the inbox here. Accept, counter or decline drafts a reply. Nothing is sent until one of us approves it, and approving opens it in your email app. We aim to reply within 2 working days.</span></li>
      <li><b>Renewals</b><span>Placements ending in the next 90 days appear under Renewals due. Draft a reminder, edit it, approve it. An ended slot is held for its provider for 60 days, then opens.</span></li>
    </ol></section>`;
  const kpi=`<section class="panel internal"><div class="phead"><h2>Inventory<span class="tag-internal">Admin only</span></h2><span class="muted mono">${total} slots</span></div>
    <div class="bar" aria-hidden="true"><i style="width:${pct(paid)}%;background:var(--taken)"></i><i style="width:${pct(inRen)}%;background:var(--coral)"></i><i style="width:${pct(res)}%;background:var(--amber)"></i><i style="width:${pct(open)}%;background:var(--accent)"></i></div>
    <div class="kpis">
      <div class="kpi"><div class="v">${pct(paid)}%</div><div class="l">Sold (${paid} slots)</div></div>
      <div class="kpi"><div class="v">${inRen}</div><div class="l">In renewal, ended under 60 days ago</div></div>
      <div class="kpi"><div class="v">${res}</div><div class="l">Reserved (first refusal, packages)</div></div>
      <div class="kpi"><div class="v">${open}</div><div class="l">Open to sell</div></div>
    </div></section>`;
  const openO=offers.map((o,i)=>[o,i]).filter(([o])=>!o.sent), doneO=offers.map((o,i)=>[o,i]).filter(([o])=>o.sent);
  const oCard=([o,i])=>{const inv=invoice(o);const id="of-"+(o.id||i);return `<details class="qi" id="${id}" ${openD.has(id)?"open":""}><summary class="h" style="cursor:pointer"><span><b>${esc(o.from)}</b>${o.preview?'<span class="ex">Preview</span>':""}${o.kind==="proposal"?'<span class="ex">2027 proposal</span>':""}<br><span class="muted" style="font-size:.84rem">${o.items.length} items · ${o.kind==="proposal"?"accepted at":"offer"} <b class="mono">${eur(o.offer)}</b>${o.kind==="proposal"?" a year":` against <span class="mono">${eur(o._pkg)}</span>`}</span></span><span class="pill ${o.sent?(o.action==="decline"?"due":"ok"):"soon"}">${esc(o.sent?({accept:"Accepted",counter:"Countered",decline:"Declined"}[o.action]||"Answered"):(o.action?"Draft ready":"New"))}</span></summary>
      <div class="note">${esc(o.email||"No email saved")} · ${esc(o.when)}</div>
      ${inv}
      ${o.note?`<div class="note">“${esc(o.note)}”</div>`:""}
      ${actionBlock(o,i)}</details>`};
  const inbox=`<section class="panel internal"><div class="phead"><h2>Offers inbox<span class="tag-internal">Admin only</span></h2><span class="muted">${openO.length} open</span></div>
    <div class="queue">${openO.map(oCard).join("")||'<p class="muted" style="font-size:.9rem">No open offers. New ones appear here as soon as a provider sends one.</p>'}</div>
    ${doneO.length?`<details id="d-done" ${openD.has("d-done")?"open":""}><summary style="cursor:pointer;font-weight:600">Answered · ${doneO.length}</summary><div class="queue" style="margin-top:8px">${doneO.map(oCard).join("")}</div></details>`:""}</section>`;
  const brandSales=(ar,p)=>{const S2=ar.sales;let n=0,v=0,c=0;if(!S2)return {n,v,c};
    [["b1","v1","c1"],["b2","v2","c2"],["b3","v3","c3"],["bo","vo","co"]].forEach(([b,vk,ck])=>{(S2[b]||[]).forEach(x=>{if(x.b===p){n+=+x.n||0;v+=+x.v||0;const tv=+S2[vk]||0;c+=tv?(+S2[ck]||0)*(+x.v||0)/tv:0}})});return {n,v,c}};
  const firstEnd=p=>byP[p].reduce((m,x)=>x.st.exp<m?x.st.exp:m,byP[p][0].st.exp);
  const provsU=provs.slice().sort((x,y)=>firstEnd(x)-firstEnd(y));
  const ren=`<section class="panel internal"><div class="phead"><h2>Renewals due<span class="tag-internal">Admin only</span></h2><span class="muted">Next 90 days and recently ended · soonest first</span></div>
    <div class="queue">${provsU.map(p=>{const L=byP[p];
      const total=L.reduce((t,x)=>t+priceOf(x.a,x.s.pos),0);
      const c=S.contracts[p];const groups={};L.forEach(x=>{const k=x.s.exp;(groups[k]=groups[k]||[]).push(x)});
      const rem=REMS[p];const em=emailsOf(p);const id="rn-"+slug(p);
      const fe=firstEnd(p),past=fe<TODAY;
      const payY=c&&c.current?c.current.monthly*12:0,share=payY&&total?payY/total:0,propY=c?c.base*12:0;
      const SS=L.reduce((t,x)=>{const b=brandSales(x.a,p);t.n+=b.n;t.v+=b.v;t.c+=b.c;return t},{n:0,v:0,c:0});
      const pc=x=>Math.round(x*100);
      const pays=c&&c.current?eur(c.current.monthly)+" a month":"";
      const lastPay=(ar,pos)=>{const L2=PAYMENTS.filter(y=>y.p===p&&y.a===ar.name);const same=L2.filter(y=>y.pos===pos),pool=same.length?same:L2.filter(y=>y.pos==null);return pool.length?pool[pool.length-1]:null};
      const R=L.map(x=>{const lp=priceOf(x.a,x.s.pos),bs=brandSales(x.a,p),lpay=lastPay(x.a,x.s.pos);const fee=payY?lp*share:(lpay?+lpay.paid:null);return {x,lp,bs,lpay,fee}});
      const anyFee=R.some(r=>r.fee!=null),anyPaid=R.some(r=>r.lpay);
      const T={lp:0,paid:0,paidN:0,fee:0,feeN:0};R.forEach(r=>{T.lp+=r.lp;if(r.lpay){T.paid+=+r.lpay.paid;T.paidN++}if(r.fee!=null){T.fee+=r.fee;T.feeN++}});
      const feeK=R.filter(r=>r.fee!=null),feeBs=feeK.reduce((t,r)=>({v:t.v+r.bs.v,c:t.c+r.bs.c}),{v:0,c:0});
      const cols=7+(anyPaid?1:0)+(payY?1:0)+(anyFee?2:0);
      const mo=d=>{const t=new Date(d+"T00:00:00");return MON[t.getMonth()]+" "+t.getFullYear()};
      const rows=Object.keys(groups).sort().map(k=>{const G=R.filter(r=>r.x.s.exp===k).sort((u,w)=>u.x.a.name.localeCompare(w.x.a.name)),e=D(k),pe=e<TODAY;const hold=new Date(e);hold.setDate(hold.getDate()+60);
        return `<tr class="rg-h"><td colspan="${cols}"><span class="pill ${pe?"due":"soon"}">${pe?"Ended "+fmtD(e):"Ends "+fmtD(e)}</span> <span class="muted">${G.length} ${G.length===1?"slot":"slots"}${pe?" · held for them until "+fmtD(hold):""}</span></td></tr>`
          +G.map(r=>{const {x,lp,bs,lpay,fee}=r;const lpc=lpay?Math.round((lp/lpay.paid-1)*100):null;
            return `<tr><td>${esc(x.a.name)}</td><td>${x.s.pos===1?"1st":"2nd"}</td><td class="muted">${esc(grp(x.a).name)}</td><td class="num mono">${eur(lp)}${lpc?` <span style="font-size:.74rem;color:${lpc>0?"var(--accent)":"var(--coral)"}">${lpc>0?"+":""}${lpc}%</span>`:""}</td>`
            +(anyPaid?`<td class="num mono" title="${lpay?esc("Invoice "+lpay.inv+", "+fmtD(new Date(lpay.on+"T00:00:00"))+(lpay.list?", list rate €"+lpay.list:"")+(lpay.note?" · "+lpay.note:"")):(c?"Covered by their monthly fee":"No invoice found")}">${lpay?eur(lpay.paid)+` <span class="muted" style="font-size:.74rem">${mo(lpay.on)}</span>`:`<span class="muted">${c?"in fee":"none"}</span>`}</td>`:"")
            +(payY?`<td class="num mono">${eur(lp*share)}</td>`:"")
            +`<td class="num mono">${bs.n||'<span class="muted">0</span>'}</td><td class="num mono">${bs.v?eur(bs.v):'<span class="muted">€0</span>'}</td><td class="num mono muted">${bs.c?eur(bs.c):"€0"}</td>`
            +(anyFee?(fee!=null?`<td class="num mono">${eur(fee+bs.c)}</td><td class="num mono">${eurS(bs.v-fee-bs.c)}</td>`:`<td class="muted">?</td><td class="muted">?</td>`):"")+`</tr>`}).join("")}).join("");
      const feeLbl=payY?"their fee share":"what they paid last time";
      const open=drafts[p]!=null||openD.has(id);
      return `<details class="qi ren" id="${id}" ${open?"open":""}><summary><span><b>${esc(p)}</b> <span class="muted">· ${L.length} ${L.length===1?"slot":"slots"}</span></span>
        <span class="rsum"><span class="pill ${past?"due":"soon"}">${past?"Ended "+fmtD(fe):"First ends "+fmtD(fe)}</span>${pays?`<span class="muted">Pays ${pays}</span>`:""}<span class="muted">List ${eur(total)} a year</span><span class="muted">Made them <b style="color:var(--ink)">${eur(SS.v)}</b> in 12 months</span>${rem&&rem.sent_at?`<span class="pill ok">Reminder sent ${fmtD(new Date(rem.sent_at))}</span>`:(drafts[p]!=null?`<span class="pill soon">Draft open</span>`:"")}</span></summary>
      <div class="kgrid">
        <div><span class="eyebrow">List price</span><b class="mono">${eur(total)}</b><span class="muted">a year · ${L.length} ${L.length===1?"slot":"slots"} · ${eur(total/L.length)} each on average</span></div>
        <div><span class="eyebrow">${payY?"Pays now":"Paid last time"}</span>${payY?`<b class="mono">${eur(payY)}</b><span class="muted">${eur(c.current.monthly)} a month · ${eur(payY/L.length)} per article</span><span class="pill ${share<1?"due":"ok"}" style="justify-self:start">${share<1?pc(1-share)+"% below list":pc(share-1)+"% above list"}</span>`:(anyPaid?`<b class="mono">${eur(T.paid)}</b><span class="muted">a year, from their last invoices${T.paidN<L.length?" ("+T.paidN+" of "+L.length+" slots found)":""}</span><span class="pill ${T.paid<T.lp?"due":"ok"}" style="justify-self:start">${T.paid<(R.filter(r=>r.lpay).reduce((t,r)=>t+r.lp,0))?pc(1-T.paid/R.filter(r=>r.lpay).reduce((t,r)=>t+r.lp,0))+"% below today's list":"at or above today's list"}</span>`:`<span class="muted">No invoices found for these slots</span>`)}</div>
        ${c?`<div><span class="eyebrow">Our 2027 proposal</span><b class="mono">${eur(propY)}</b><span class="muted">${eur(c.base)} a month core · ${eur(propY/L.length)} per article${payY?" · "+(propY>=payY?"+":"")+pc(propY/payY-1)+"% on now":""}</span><span class="pill ${propY<total?"due":"ok"}" style="justify-self:start">${propY<total?pc(1-propY/total)+"% below list":"at or above list"}</span></div>`:""}
        <div><span class="eyebrow">Their sales on these, 12 months</span><b class="mono">${eur(SS.v)}</b><span class="muted">${SS.n} sales · our commission ${eur(SS.c)}</span>${payY?`<span class="muted">${(SS.v/payY).toFixed(1)}× what they pay us</span>`:""}</div>
      </div>
      <div class="scroll ren-list"><table class="tbl"><thead><tr><th>Article</th><th>Pos</th><th>Group</th><th class="num" title="List price now, and how it compares with what they paid last time">List now</th>${anyPaid?'<th class="num">Paid last time</th>':""}${payY?'<th class="num" title="Their yearly fee split across these articles in line with list price">Their fee share*</th>':""}<th class="num">Sales</th><th class="num">Their sales value</th><th class="num">Our commission</th>${anyFee?`<th class="num" title="${payY?"Their fee share":"What they paid last time"} plus our commission">We earned</th><th class="num" title="Their sales value minus ${payY?"their fee share":"what they paid"} and our commission">Their net</th>`:""}</tr></thead><tbody>${rows}</tbody>
        <tfoot><tr><td colspan="3"><b>Total</b></td><td class="num mono"><b>${eur(total)}</b></td>${anyPaid?`<td class="num mono"><b>${eur(T.paid)}</b>${T.paidN<L.length?` <span class="muted" style="font-size:.74rem">${T.paidN} of ${L.length}</span>`:""}</td>`:""}${payY?`<td class="num mono"><b>${eur(payY)}</b></td>`:""}<td class="num mono"><b>${SS.n}</b></td><td class="num mono"><b>${eur(SS.v)}</b></td><td class="num mono"><b>${eur(SS.c)}</b></td>${anyFee?`<td class="num mono"><b>${eur(T.fee+feeBs.c)}</b></td><td class="num mono"><b>${eurS(feeBs.v-T.fee-feeBs.c)}</b></td>`:""}</tr></tfoot></table></div>
      <p class="note">${anyPaid?"Paid last time: the per-slot amount on their latest invoice for that article (after any bundle discount); hover for the invoice. The % next to the list price is how today's list compares with it. ":""}${payY?"*Their fee share: what they pay us a year, split across these articles in proportion to list price, so every article shows the same "+pc(1-share)+"% discount. ":""}${anyFee?"We earned: "+feeLbl+" plus our commission. Their net: what customers paid them, minus "+feeLbl+" and our commission, before their own costs for the data. ":""}Sales are the last 12 months from the sales feed, counting every sale of ${esc(p)} on that article in any position. Their sales value is what customers paid ${esc(p)}.</p>
      ${drafts[p]!=null?`<textarea class="draft" id="rd-${slug(p)}" data-rd="${esc(p)}" rows="10" aria-label="Draft reminder to ${esc(p)}">${esc(drafts[p])}</textarea>${em?"":`<p class="note">No one from ${esc(p)} is on the access list yet. Add them under Who has access.</p>`}`:""}
      <div class="acts">${drafts[p]!=null?`<button class="btn small primary" data-ap="${esc(p)}">Approve and open in email</button><button class="btn small ghost" data-rdx="${esc(p)}">Discard draft</button>`:`<button class="btn small" data-dr="${esc(p)}">Draft reminder</button>`}</div></details>`}).join("")||'<p class="muted" style="font-size:.9rem">Nothing ends in the next 90 days.</p>'}</div></section>`;
  const prices=`<section class="panel internal"><div class="phead"><h2 class="dup">Prices and rules<span class="tag-internal">Admin only</span></h2><span class="muted">Changes save straight away and show on every provider's page</span></div>
    <div class="scroll"><table class="tbl"><thead><tr><th>Tier</th><th>Clicks a year</th><th>1st position</th><th>2nd position</th></tr></thead><tbody>
    ${S.tiers.map((t,i)=>`<tr><td><b>${esc(t.name)}</b></td><td class="muted">${esc(t.desc)}</td><td>€ <input id="t${i}p1" data-t="${i}|p1" type="number" min="0" value="${t.p1}"></td><td>€ <input id="t${i}p2" data-t="${i}|p2" type="number" min="0" value="${t.p2}"></td></tr>`).join("")}
    ${Object.keys(S.setPrices||{}).map(n=>`<tr><td><b>${esc(n)}</b></td><td class="muted">Set price, overrides its tier</td>${[1,2].map(k=>{const v=S.setPrices[n]["p"+k];const ar=ARTS.find(x=>x.name===n);const tp=ar?(k===1?+(manualTier(ar)||autoTier(ar)).p1:+(manualTier(ar)||autoTier(ar)).p2):"";return `<td>€ <input id="sp${k===1?"":"2"}-${slug(n)}" data-sp="${esc(n)}|p${k}" type="number" min="0" value="${v!=null?v:""}" placeholder="${tp!==""?tp:""}" title="Type a price to set it. Leave empty to use the tier price"></td>`}).join("")}</tr>`).join("")}
    <tr><td><b>Review article</b></td><td class="muted">Dedicated add-on</td><td colspan="2">€ <input id="rv" data-s="review" type="number" min="0" value="${S.review}"></td></tr>
    <tr><td><b>Package discount</b></td><td class="muted">Premium and Standard only</td><td colspan="2"><input id="dm" data-s="discMin" type="number" min="1" value="${S.discMin}"> slots or more get <input id="dp" data-s="discPct" type="number" min="0" max="50" value="${S.discPct}"> % off</td></tr>
    </tbody></table></div></section>`;
  const role=x=>x.provider?`Partner · ${esc(x.provider)}`:'<span class="tag-internal" style="margin:0">Admin</span>';
  const acc=`<section class="panel internal"><div class="phead"><h2 class="dup">Who has access<span class="tag-internal">Admin only</span></h2></div>
    <p class="note">Everyone signs in at partners.nomadwise.io with their email, and only emails on this list get a sign-in link. Partners see their own page, greeted by name. Admins see this view. Removing someone signs them out straight away.</p>
    <div class="scroll"><table class="tbl"><thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Last sign-in</th><th></th></tr></thead><tbody>
    ${ACCESS.map(x=>`<tr><td><b>${esc(x.name||"")}</b></td><td>${esc(x.email)}</td><td>${role(x)}</td><td class="muted">${x.last_login?fmtD(new Date(x.last_login)):"Not yet"}</td>
      <td><div class="linkcell"><button class="btn small" data-sendlink="${esc(x.email)}">Email sign-in link</button>${x.email===ME?"":`<button class="btn small ghost" data-rmacc="${esc(x.email)}">Remove</button>`}</div></td></tr>`).join("")}
    </tbody></table></div>
    <form class="access-add" id="accform">
      <input id="na-name" placeholder="Name, e.g. Simon Martin" aria-label="Name" required>
      <input id="na-email" type="email" placeholder="name@company.com" aria-label="Email" required>
      <select id="na-role" aria-label="Role"><option value="partner">Partner</option><option value="admin">Admin</option></select>
      <select id="na-prov" aria-label="Partner company">${PROVIDERS.map(p=>`<option value="${esc(p.name)}">${esc(p.name)}</option>`).join("")}<option value="__new">New partner company…</option></select>
      <input id="na-co" placeholder="Company name, e.g. Airalo" aria-label="New partner company" hidden>
      <button class="btn small primary" type="submit">Give access</button></form>
    <p class="note">Giving access doesn't email anyone. Tell them to sign in at partners.nomadwise.io, or press Email sign-in link.</p></section>`;
  const order=["Top page"].concat(S.tiers.map(t=>t.name));const cg={};const capT=[0,0,0],openT=[0,0,0],cnt={};
  ARTS.forEach(a=>{const n=grp(a).name;cg[n]=cg[n]||[0,0,0];cnt[n]=(cnt[n]||0)+1;a.slots.forEach(s=>{const p=priceOf(a,s.pos);cg[n][s.pos]+=p;capT[s.pos]+=p;if(status(a,s,null).k==="available")openT[s.pos]+=p})});
  const cap=`<section class="panel internal"><div class="phead"><h2>Capacity if 100% sold<span class="tag-internal">Admin only</span></h2><span class="muted">At list prices, per year</span></div>
    <div class="kpis"><div class="kpi"><div class="v">${eur(capT[1])}</div><div class="l">All 1st positions</div></div><div class="kpi"><div class="v">${eur(capT[2])}</div><div class="l">All 2nd positions</div></div><div class="kpi"><div class="v">${eur(capT[1]+capT[2])}</div><div class="l">Total</div></div></div>
    <div class="scroll"><table class="tbl"><thead><tr><th>Tier</th><th>Articles</th><th>1st</th><th>2nd</th><th>Total</th></tr></thead><tbody>
    ${order.filter(n=>cg[n]).map(n=>`<tr><td><b>${esc(n)}</b></td><td class="mono">${cnt[n]}</td><td class="mono">${eur(cg[n][1])}</td><td class="mono">${eur(cg[n][2])}</td><td class="mono">${eur(cg[n][1]+cg[n][2])}</td></tr>`).join("")}
    <tr><td><b>Open now</b></td><td></td><td class="mono">${eur(openT[1])}</td><td class="mono">${eur(openT[2])}</td><td class="mono">${eur(openT[1]+openT[2])}</td></tr></tbody></table></div>
    <p class="note">Contract deals are priced separately, so actual revenue on those slots differs from list.</p></section>`;
  return `<p class="note" style="margin-top:-8px">Two things need us: offers and renewals. Everything else is folded away below.</p>`+inbox+ren+fold("d-act",activityTitle(),activityPanel())+fold("d-how","How this works",how)+fold("d-num","Inventory and capacity",kpi+cap)+fold("d-pr","Prices and rules",prices)+fold("d-acc","Who has access",acc);
}

function currentPanel(v){
  const mine=[];
  ARTS.forEach(a=>a.slots.forEach(s=>{const st=status(a,s,v);if(st.k==="mine")mine.push({a,s,st})}));
  if(!mine.length) return "";
  mine.sort((x,y)=>(x.st.exp||D("2099-01-01"))-(y.st.exp||D("2099-01-01")));
  const c=S.contracts[v];
  const contract=c?mine.filter(m=>!m.st.fr&&m.s.exp===c.contractEnd).sort((x,y)=>x.a.name.localeCompare(y.a.name)):[];
  const other=c?mine.filter(m=>!m.st.fr&&m.s.exp!==c.contractEnd):[];
  if(c){
    const isEx=m=>m.s.pos===1&&(c.exclusive||[]).includes(m.a.name),exOut=other.filter(isEx),ex=contract.filter(m=>(c.exclusive||[]).includes(m.a.name)),nx=contract.filter(m=>!(c.exclusive||[]).includes(m.a.name));
    const accept=propAccepted?`<div class="done"><b>Proposal accepted.</b> €${ptot(c)} a month${propOpt.size?", including "+[...propOpt].join(", "):""}. We'll send the agreement to confirm.${PREVIEW?' <span class="muted">Preview only, nothing was sent.</span>':""}</div>`
      :(propConfirm?`<div class="step"><b>Accept the 2027 proposal at €${ptot(c)} a month?</b><p class="note">${propOpt.size?"Including "+[...propOpt].join(", ")+". ":"Core renewal only, no optional countries. "}We'll confirm by email and send the agreement.</p><div class="acts"><button class="btn primary" id="prop-yes" ${sending?"disabled":""}>Yes, accept</button><button class="btn ghost" id="prop-back">Back</button></div></div>`
      :`<div class="acts"><button class="btn primary" id="prop-ok">Accept this proposal</button></div><p class="note">Questions or changes? Just reply to our email.</p>`);
    return `<section class="panel"><div class="phead"><h2>${esc(c.title)}</h2><span class="muted">${contract.length} contract articles</span></div>
    <p class="muted">${esc(c.term)}</p>
    <div class="cur">${(c.lines||[]).map(l=>`<div class="ci" style="grid-template-columns:minmax(0,1fr) auto"><span>${esc(l[0].replace("{n}",contract.length))}</span><span class="mono">${esc(l[1])}</span></div>`).join("")}
      <details class="ci" data-sec="exclusive list" style="display:block"><summary style="cursor:pointer;font-size:.88rem"><b>Exclusive 1st position · ${ex.length+exOut.length}</b> <span class="muted">no other eSIM can take 1st</span></summary>${chipList(ex.map(m=>m.a.name))}${exOut.length?`<p class="note" style="margin-top:6px">Also exclusive: ${exOut.map(m=>`<b>${esc(m.a.name)}</b> (runs separately to ${fmtD(m.st.exp)})`).join(", ")}. ${exOut.length===1?"It is":"They are"} in the list below.</p>`:""}</details>
      ${nx.length?`<details class="ci" data-sec="non-exclusive list" style="display:block"><summary style="cursor:pointer;font-size:.88rem"><b>1st position by default, non-exclusive · ${nx.length}</b> <span class="muted">first refusal if another provider asks, at up to €300 to €350</span></summary>${chipList(nx.map(m=>m.a.name))}</details>`:""}
      ${c.banners?`<div class="ci" style="grid-template-columns:minmax(0,1fr);font-size:.88rem"><span><b>Coworking banners</b> <span class="muted">${esc(c.banners)}</span></span></div>`:""}
    <div class="ci" style="grid-template-columns:minmax(0,1fr)"><span class="eyebrow">Optional 1st positions · tick the ones you want</span></div>
    ${(c.options||[]).map(o=>`<label class="ci"><input type="checkbox" id="po-${slug(o)}" data-po="${esc(o)}" ${propOpt.has(o)?"checked":""} ${propAccepted?"disabled":""}><span>${esc(o)} 1st</span><span class="mono">+€${c.prices[o]} a month</span></label>`).join("")}
    <div class="ci" style="grid-template-columns:minmax(0,1fr) auto;font-weight:600"><span>Your total${propOpt.size?" with "+propOpt.size+" optional":""}</span><span class="mono">€${ptot(c)} a month</span></div></div>
    ${accept}
    ${other.length?`<details data-sec="placements outside the contract" style="border-top:1px solid var(--line);padding-top:10px"><summary style="cursor:pointer;font-weight:600">Also yours, outside this contract · ${other.length} placements, ending ${fmtM(other[0].st.exp)} to ${fmtM(other[other.length-1].st.exp)}</summary><div class="cur" style="margin-top:8px">${other.map(m=>`<div class="ci" style="grid-template-columns:minmax(0,1fr) auto"><span>${esc(m.a.name)} · ${m.s.pos===1?"1st":"2nd"}${isEx(m)?' <span class="pill" style="margin-left:6px">Exclusive</span>':""}</span><span class="pill ok">Runs to ${fmtD(m.st.exp)}</span></div>`).join("")}</div><p class="note">Paid separately and unchanged by this proposal. They can join the contract when each one ends.</p></details>`:""}
    <p class="note">Your contract articles are covered by this proposal, so they don't carry separate prices below. Anything else open is yours to add.</p></section>`;
  }
  const now=mine.filter(renewable), later=mine.filter(m=>!renewable(m));
  const allSel=now.length&&now.every(m=>sel.has(key(m.a,m.s.pos)));
  const item=m=>{const k=key(m.a,m.s.pos);const pill=m.st.fr?'<span class="pill fr">First refusal</span>':(m.st.due?'<span class="pill due">Expired '+fmtD(m.st.exp)+' · held for you until '+fmtD(m.st.hold)+'</span>':(m.st.soon?'<span class="pill soon">Ends '+fmtD(m.st.exp)+'</span>':'<span class="pill ok">Runs to '+fmtD(m.st.exp)+'</span>'));
      return `<label class="ci"><input type="checkbox" id="c-${slug(k)}" data-k="${esc(k)}" ${sel.has(k)?"checked":""} ${submitted?"disabled":""}><span>${esc(m.a.name)} · ${m.s.pos===1?"1st":"2nd"} <span class="muted mono">${eur(priceOf(m.a,m.s.pos))}</span></span>${pill}</label>`};
  return `<section class="panel"><div class="phead"><h2>Your current placements</h2>${now.length&&!submitted?`<button class="btn small" id="renall">${allSel?"Clear renewals":"Renew all "+now.length}</button>`:""}</div>
    <p class="muted">What you hold now and when each one ends. Tick the ones to renew and they join your selection.</p>
    <h3>Up for renewal <span class="muted mono" style="font-weight:400">${now.length}</span></h3>
    ${now.length?`<div class="cur">${now.map(item).join("")}</div>`:`<p class="muted" style="font-size:.9rem">Nothing ends in the next 90 days.</p>`}
    ${later.length?`<details id="later" ${laterOpen?"open":""}><summary style="cursor:pointer;font-weight:600">Running into ${later[0].st.exp.getFullYear()} · ${later.length} placements, ends ${fmtM(later[0].st.exp)} to ${fmtM(later[later.length-1].st.exp)}</summary><div class="cur" style="margin-top:8px">${later.map(item).join("")}</div></details>`:""}</section>`;
}

const salesBit=(label,n,v,c,brands)=>`<span title="${esc((brands||[]).map(x=>x.b+": "+x.n+" sales, "+eur(x.v)).join("\n")+(c!=null?"\nOur commission: "+eur(c):""))}">${label} ${n||0} (${eur(v||0)})</span>`;
function inventoryPanel(v){
  const team=v===null;
  const list=ARTS.filter(a=>{
    if(filt.q && !a.name.toLowerCase().includes(filt.q.toLowerCase())) return false;
    if(filt.tier && grp(a).name!==filt.tier) return false;
    if(team&&filt.prov && !a.slots.some(s=>s.prov===filt.prov&&holdsNow(s)&&(!filt.ppos||String(s.pos)===filt.ppos))) return false;
    if(filt.regions.size && !filt.regions.has(regionOf[a.name])) return false;
    if(filt.avail && !a.slots.some(s=>status(a,s,v).sel)) return false;
    return true;
  }).sort((x,y)=>grp(x).rank-grp(y).rank||x.name.replace(/^The /,"").localeCompare(y.name.replace(/^The /,"")));
  let lastG="";
  const tiers=`<div class="tiers">${S.tiers.map(t=>`<div class="tier"><span class="n">${esc(t.name)}</span><span class="r">${esc(t.desc)}</span><div class="pp"><span class="pc"><span class="pl">1st</span><span class="pv">${eur(t.p1)}</span></span><span class="pc"><span class="pl">2nd</span><span class="pv">${eur(t.p2)}</span></span></div></div>`).join("")}</div>`;
  const regs=REGION_ORDER.filter(r=>ARTS.some(a=>regionOf[a.name]===r));
  return `<section class="panel"><div class="phead"><h2>${team?"All placements":"Available placements"}</h2><span class="muted">12-month term · prices per year</span></div>
    ${team?`<p class="note">Views and clicks to eSIM providers over the last 12 months, measured on nomadwise.io. Click rate is clicks per page view. Sales are the last 12 months${SALES_FROM?" (from "+fmtD(new Date(SALES_FROM+"T00:00:00"))+")":""} from the sales feed: the number of sales and, in brackets, what customers paid the brand. Each brand counts towards the position it held: the current holder, or a brand that held 1st or 2nd earlier in the year (from the July positioning sheet and the May and August swaps). 3rd is the brand mentioned further down. “Not placed” is a brand we have no record of in 1st or 2nd on that article. Hover a figure to see the brands and our commission. Admin only: providers see the tier, not these figures.</p>`:""}
    ${team?tiers:""}
    <div class="legend" aria-label="Key">${[["available","Available"],["selected","Selected"],["mine","Yours"],["reserved","Reserved or in renewal"],["taken","Unavailable"]].map(([c,l])=>`<span class="key ${c}">${l}</span>`).join("")}</div>
    <div class="regs" role="group" aria-label="Filter by region"><button class="reg" data-reg="" aria-pressed="${!filt.regions.size}">All regions</button>${regs.map(r=>`<button class="reg" data-reg="${esc(r)}" aria-pressed="${filt.regions.has(r)}">${esc(r)} <span class="mono">${ARTS.filter(a=>regionOf[a.name]===r).length}</span></button>`).join("")}</div>
    <div class="filters"><input type="search" id="f-q" placeholder="Search a country or city" value="${esc(filt.q)}" aria-label="Search articles">
      <select id="f-tier" aria-label="Tier"><option value="">All tiers</option>${["Top page"].concat(S.tiers.map(t=>t.name)).map(n=>`<option ${filt.tier===n?"selected":""}>${esc(n)}</option>`).join("")}</select>
      ${team?(()=>{const cnt={};ARTS.forEach(a=>a.slots.forEach(s=>{if(holdsNow(s))cnt[s.prov]=(cnt[s.prov]||0)+1}));const ps=Object.keys(cnt).sort((x,y)=>cnt[y]-cnt[x]||x.localeCompare(y));
        return `<select id="f-prov" aria-label="Provider"><option value="">All providers</option>${ps.map(p=>`<option value="${esc(p)}" ${filt.prov===p?"selected":""}>${esc(p)} · ${cnt[p]}</option>`).join("")}</select>${filt.prov?`<select id="f-ppos" aria-label="Position"><option value="">1st or 2nd</option><option value="1" ${filt.ppos==="1"?"selected":""}>1st only</option><option value="2" ${filt.ppos==="2"?"selected":""}>2nd only</option></select>`:""}`})():`<label class="chk"><input type="checkbox" id="f-avail" ${filt.avail?"checked":""}> Only what I can pick</label>`}</div>
    <div class="rows">${list.map(a=>{const t=tierOf(a);const g=grp(a).name;const head=g!==lastG?`<div class="ghead"><span>${esc(g)} group</span><span class="gn">${list.filter(x=>grp(x).name===g).length} ${list.filter(x=>grp(x).name===g).length===1?"article":"articles"}</span></div>`:"";lastG=g;
      return head+`<div class="row"><div class="art"><span class="nm">${esc(a.name)}</span><span class="meta">${team&&!(S.setPrices||{})[a.name]?`<select class="gsel${manualTier(a)?" manual":""}" data-grp="${esc(a.name)}" aria-label="Group for ${esc(a.name)}" title="Move this article to another group. Its prices follow."><option value="">Auto · ${esc(autoTier(a).name)}</option>${S.tiers.map(x=>`<option value="${esc(x.name)}" ${manualTier(a)&&manualTier(a).name===x.name?"selected":""}>${esc(x.name)} · set by hand</option>`).join("")}</select>`:`<span class="tchip ${(S.setPrices||{})[a.name]?"Premium":esc(t.name)}">${esc(g)}</span>`}${team?`<span class="mono">${a.views.toLocaleString("en-GB")} views</span><span class="mono">${a.clicks.toLocaleString("en-GB")} clicks</span>${a.views>=50?`<span class="mono">${Math.round(a.clicks/a.views*100)}% click rate</span>`:""}${a.sales&&(a.sales.s1||a.sales.s2||a.sales.s3||a.sales.so)?`<span class="mono sales">Sales: ${salesBit("1st",a.sales.s1,a.sales.v1,a.sales.c1,a.sales.b1)} · ${salesBit("2nd",a.sales.s2,a.sales.v2,a.sales.c2,a.sales.b2)}${a.sales.s3?" · "+salesBit("3rd",a.sales.s3,a.sales.v3,a.sales.c3,a.sales.b3):""}${a.sales.so?" · "+salesBit("not placed",a.sales.so,a.sales.vo,a.sales.co,a.sales.bo):""}</span>`:""}`:""}</span></div>
      <div class="seats">${a.slots.map(s=>seat(a,s,v,team)).join("")}</div></div>`}).join("")||'<p class="muted">No articles match.</p>'}</div></section>`;
}

function seat(a,s,v,team){
  const st=status(a,s,v), k=key(a,s.pos), on=sel.has(k);
  const pos=`<span class="pos">${s.pos===1?"1st":"2nd"}</span>`;
  const c=v&&S.contracts[v];
  if(c&&st.contract&&st.fr){const pon=propOpt.has(a.name)||(c.included||[]).includes(a.name);
    return `<button class="seat available opt${pon?" selected":""}" ${propAccepted?"disabled":`data-poseat="${esc(a.name)}" aria-pressed="${pon}"`} title="Optional in your 2027 proposal">${pos}<span class="st">${pon?"Added to your proposal":"Optional for you"}</span><span class="pr">+€${(c.prices||{})[a.name]}/mo</span></button>`;}
  if(st.k==="mine"&&!st.fr){const d=st.exp?(st.exp.getDate()+" "+MON[st.exp.getMonth()]+" "+st.exp.getFullYear()):"";const renew=st.due||st.soon;
    const lab=on?"Renewing":"Yours";
    const sub=st.due?"Ended "+d+(st.hold?" · held for you to "+st.hold.getDate()+" "+MON[st.hold.getMonth()]:""):(st.soon?"Ends "+d:"Runs to "+d);
    const right=renew?`<span class="badge ${st.due?"due":""}">${on?eur(priceOf(a,s.pos)):(c?"To renew":"To renew · "+eur(priceOf(a,s.pos)))}</span>`:"";
    const canR=renew&&!c&&!team&&!submitted;
    return `<button class="seat mine${renew?" renew":""}${on?" selected":""}" ${canR?`data-k="${esc(k)}" aria-pressed="${on}"`:(team?"disabled":`aria-disabled="true" data-tap="${esc(k)}" data-tapl="${esc(lab+", "+sub)}"`)} title="${esc(c&&renew?"Renew through your 2027 proposal":lab+", "+sub)}">${pos}<span class="st">${esc(lab)}</span>${right}<span class="sub">${esc(sub)}</span></button>`;}
  const cls=st.k+(on?" selected":"")+(team?" plain":"")+(st.oneEach?" one":"");
  const canSel=st.sel && !team && !submitted;
  return `<button class="seat ${cls}" ${canSel?`data-k="${esc(k)}" aria-pressed="${on}"`:(team||submitted?"disabled":`aria-disabled="true" data-tap="${esc(k)}" data-tapl="${esc(st.label)}"`)} title="${esc(st.label)}">
    ${pos}<span class="st">${on?"Selected":esc(st.label)}</span>${st.sel?`<span class="pr">${eur(priceOf(a,s.pos))}</span>`:""}${team&&st.who?`<span class="who">${esc(st.who)}</span>`:""}</button>`;
}

function addonPanel(){
  return `<section class="panel"><div class="phead"><h2>Add-ons</h2></div>
    <div class="addon"><div><h3>Dedicated review article</h3><p class="muted" style="font-size:.88rem">A full Nomadwise review of your eSIM, written and published by us, with your link throughout.</p><p class="mono" style="margin-top:4px">${eur(S.review)} each</p></div>
    <div class="qty"><button id="rv-m" aria-label="One fewer review">−</button><span class="mono" id="rv-n">${reviews}</span><button id="rv-p" aria-label="One more review">+</button></div></div></section>`;
}

function totals(){
  let slots=0,list=0,elig=0,eligVal=0;
  sel.forEach(x=>{slots++;list+=x.price;if((S.discTiers||[]).includes(x.tier)){elig++;eligVal+=x.price}});
  const addons=reviews*S.review;
  const disc=elig>=S.discMin?Math.round(eligVal*S.discPct/100):0;
  return {slots,list,addons,disc,elig,total:list-disc+addons};
}

function railPanel(v){
  if(v===null) return `<section class="panel internal"><h3>Admin view<span class="tag-internal">Admin only</span></h3>
    <p class="muted" style="font-size:.9rem">Provider names and contract notes show in purple under each slot. To check exactly what a partner sees, pick them at the top and press Open their page.</p></section>`;
  const T=totals();
  if(submitted) return `<section class="panel" id="selp"><h2>Your offer</h2><div class="done"><b>Offer sent to Nomadwise${submitted.when?" on "+fmtD(new Date(submitted.when)):""}.</b><br>${submitted.items.length} ${submitted.items.length===1?"item":"items"}, offer ${eur(submitted.offer)}. We'll reply within 2 working days. You can send a new offer once we've answered this one.</div>
    ${PREVIEW?`<p class="note">Preview only. Nothing was sent.</p><button class="btn small" id="reset">Reset preview</button>`:""}</section>`;
  const items=[...sel.entries()];
  return `<section class="panel" id="selp"><div class="phead"><h2>Your selection</h2><span class="muted">${T.slots} placements</span></div>
    ${items.length||reviews?`<div class="sel-list">${items.map(([k,x])=>`<div class="sel-item"><span>${esc(k)}${x.kind==="renew"?' <span class="muted">renewal</span>':""}</span><span class="mono">${eur(x.price)}</span><button class="x" data-rm="${esc(k)}" aria-label="Remove ${esc(k)}">×</button></div>`).join("")}
      ${reviews?`<div class="sel-item"><span>Review article × ${reviews}</span><span class="mono">${eur(T.addons)}</span><span></span></div>`:""}</div>`:`<p class="muted" style="font-size:.9rem">Tap an available slot to add it. Your current placements can be renewed from the list on the left.</p>`}
    <div class="sum"><span>List price</span><span class="mono">${eur(T.list+T.addons)}</span></div>
    ${T.disc?`<div class="sum"><span>Package discount (${T.elig} Premium or Standard, ${S.discPct}%)</span><span class="mono">−${eur(T.disc)}</span></div>`:`<div class="note">${S.discMin} or more Premium or Standard placements: ${S.discPct}% off those placements.${T.elig?" You have "+T.elig+".":""}</div>`}
    <div class="sum total"><span>Package price</span><span class="mono">${eur(T.total)}</span></div>
    ${confirmOffer?`<div class="step confirm-offer"><b>Send this offer to Nomadwise?</b>
      <div class="sum"><span>${T.slots+(reviews?reviews:0)} ${T.slots+(reviews?reviews:0)===1?"item":"items"} · list price</span><span class="mono">${eur(T.list+T.addons)}</span></div>
      <div class="sum total"><span>Your offer</span><span class="mono">${eur(confirmOffer.amt)}</span></div>
      ${confirmOffer.note.trim()?`<p class="note">Your note: “${esc(confirmOffer.note.trim())}”</p>`:""}
      <p class="note">Once sent you can't change it or send another until we've replied, usually within 2 working days.</p>
      <div class="acts"><button class="btn primary" id="o-yes" ${sending?"disabled":""}>${sending?"Sending…":"Yes, send offer"}</button><button class="btn" id="o-back" ${sending?"disabled":""}>Go back</button></div></div>`:`
    <form id="offer" class="col" style="gap:10px">
      <label class="fl">Your offer for the package (€)<input id="o-amt" type="number" min="1" inputmode="numeric" value="${T.total||""}" required></label>
      <label class="fl">Note for the Nomadwise team (optional)<textarea id="o-note" rows="2" maxlength="3000">${esc(draftNote)}</textarea></label>
      <button class="btn primary" type="submit" ${(T.slots||reviews)&&!sending?"":"disabled"}>${sending?"Sending…":"Send offer"}</button>
      <p class="note">One open offer at a time. We reply within 2 working days with an answer or a counter.</p>
    </form>`}</section>`;
}

function mbar(){
  const v=viewer();const T=totals();
  const show=v!==null&&!submitted&&(T.slots||reviews);
  $("mbar").hidden=!show;
  if(show)$("mbar-t").textContent=T.slots+" placements · "+eur(T.total);
}

function toggle(k){
  confirmOffer=null;
  if(sel.has(k)){const x=sel.get(k);sel.delete(k);track("slot_remove",{item:k,price:x.price,renewal:x.kind==="renew"});return}
  const [name,p]=k.split(" · ");const a=ARTS.find(x=>x.name===name);const pos=p==="1st"?1:2;
  const st=status(a,a.slots[pos-1],viewer());
  sel.set(k,{price:priceOf(a,pos),kind:st.k==="mine"?"renew":"new",tier:grp(a).name});
  track("slot_add",{item:k,price:priceOf(a,pos),tier:grp(a).name,renewal:st.k==="mine"});
}

// ---------- saving ----------
let saveT;
function saveSettings(msg){
  clearTimeout(saveT);
  saveT=setTimeout(async()=>{const s=Object.assign({},S);delete s.contracts;
    const {error}=await sb.rpc("partners_team_save_settings",{p_session:SESSION,p_s:s});
    toast(error?"Couldn't save. Check your connection and try again.":(msg||"Saved. Provider pages now show the new prices."))},500);
}
async function submitOffer(items,list,amt,note,kind){
  if(ROLE!=="provider"||PREVIEW){ // previews never send anything
    offers.unshift({preview:true,from:asProv==="__new"?"New partner":asProv,email:"",when:"Just now",items,list,offer:amt,note,status:"new",kind,sent:false});
    return true;
  }
  sending=true;render();
  const {error}=await sb.rpc("partners_send_offer",{p_session:SESSION,p_kind:kind,p_items:items,p_list:list,p_offer:amt,p_note:note||""});
  sending=false;
  if(error){toast(error.message||"Couldn't send. Please try again.");render();return false}
  return true;
}

function bind(){
  document.querySelectorAll("[data-k]").forEach(el=>{
    el.addEventListener(el.type==="checkbox"?"change":"click",()=>{toggle(el.dataset.k);render()});
  });
  document.querySelectorAll("[data-rm]").forEach(el=>el.addEventListener("click",()=>{sel.delete(el.dataset.rm);confirmOffer=null;render()}));
  const q=$("f-q");if(q)q.addEventListener("input",()=>{filt.q=q.value;clearTimeout(searchT);const sq=q.value.trim();if(sq.length>=3)searchT=setTimeout(()=>track("search",{q:sq}),1500);const pos=q.selectionStart;render();const n=$("f-q");n.focus();n.setSelectionRange(pos,pos)});
  const ft=$("f-tier");if(ft)ft.addEventListener("change",()=>{filt.tier=ft.value;if(ft.value)track("filter_tier",{tier:ft.value});render()});
  document.querySelectorAll("[data-reg]").forEach(el=>el.addEventListener("click",()=>{const r=el.dataset.reg;if(r==="")filt.regions.clear();else if(filt.regions.has(r))filt.regions.delete(r);else{filt.regions.add(r);track("filter_region",{region:r})}render()}));
  const fpv=$("f-prov");if(fpv)fpv.addEventListener("change",()=>{filt.prov=fpv.value;if(!fpv.value)filt.ppos="";render()});
  const fpp=$("f-ppos");if(fpp)fpp.addEventListener("change",()=>{filt.ppos=fpp.value;render()});
  const fa=$("f-avail");if(fa)fa.addEventListener("change",()=>{filt.avail=fa.checked;if(fa.checked)track("filter_available",{});render()});
  const rm=$("rv-m"),rp=$("rv-p");
  if(rm)rm.addEventListener("click",()=>{if(!submitted&&reviews>0){reviews--;confirmOffer=null;track("review_change",{count:reviews});render()}});
  if(rp)rp.addEventListener("click",()=>{if(!submitted&&viewer()!==null){reviews++;confirmOffer=null;track("review_change",{count:reviews});render()}});
  document.querySelectorAll("details.qi,details.fold,#d-done,details[id^='vis-']").forEach(d=>d.addEventListener("toggle",()=>{if(d.open)openD.add(d.id);else openD.delete(d.id)}));
  const lt=$("later");if(lt)lt.addEventListener("toggle",()=>{laterOpen=lt.open;if(lt.open)track("view_later_placements",{})});
  const ra=$("renall");if(ra)ra.addEventListener("click",()=>{
    const v=viewer();const mine=[];ARTS.forEach(a=>a.slots.forEach(s=>{const st=status(a,s,v);if(st.k==="mine"&&renewable({st}))mine.push(key(a,s.pos))}));
    const all=mine.every(k=>sel.has(k));if(!all)track("renew_all",{count:mine.length});mine.forEach(k=>{if(all)sel.delete(k);else if(!sel.has(k))toggle(k)});render()});
  const on=$("o-note");if(on)on.addEventListener("input",()=>{draftNote=on.value});
  const of=$("offer");if(of)of.addEventListener("submit",e=>{e.preventDefault();if(sending)return;
    const amt=+$("o-amt").value;if(!amt)return;draftNote=$("o-note").value;confirmOffer={amt,note:draftNote};track("offer_review",{offer:amt});render()});
  const ob=$("o-back");if(ob)ob.addEventListener("click",()=>{confirmOffer=null;render()});
  const oy=$("o-yes");if(oy)oy.addEventListener("click",async()=>{if(sending||!confirmOffer)return;
    const amt=confirmOffer.amt,note=confirmOffer.note;const T=totals();
    const items=[...sel.keys()].concat(reviews?["Review article × "+reviews]:[]);
    if(await submitOffer(items,T.list+T.addons,amt,note,"offer")){confirmOffer=null;draftNote="";track("offer_sent",{offer:amt,list:T.list+T.addons,items:items.length});submitted={offer:amt,when:new Date().toISOString(),items};render();window.scrollTo({top:0,behavior:"smooth"})}});
  document.querySelectorAll("[data-tap]").forEach(el=>el.addEventListener("click",()=>track("tap_unavailable",{item:el.dataset.tap,label:el.dataset.tapl})));
  document.querySelectorAll("details[data-sec]").forEach(d=>d.addEventListener("toggle",()=>{if(d.open)track("open_section",{section:d.dataset.sec})}));
  const rs=$("reset");if(rs)rs.addEventListener("click",()=>{resetSel();render()});
  document.querySelectorAll("[data-poseat]").forEach(el=>el.addEventListener("click",()=>{const o=el.dataset.poseat;if(propOpt.has(o))propOpt.delete(o);else propOpt.add(o);track("proposal_option",{country:o,on:propOpt.has(o)});render()}));
  document.querySelectorAll("[data-po]").forEach(el=>el.addEventListener("change",()=>{const o=el.dataset.po;if(el.checked)propOpt.add(o);else propOpt.delete(o);track("proposal_option",{country:o,on:el.checked});render()}));
  const pk=$("prop-ok");if(pk)pk.addEventListener("click",()=>{propConfirm=true;render()});
  const pb=$("prop-back");if(pb)pb.addEventListener("click",()=>{propConfirm=false;render()});
  const py=$("prop-yes");if(py)py.addEventListener("click",async()=>{const c=S.contracts[asProv];const m=ptot(c);
    const items=["Core renewal, €"+c.base+" a month"].concat([...propOpt].map(o=>o+" 1st"));
    if(await submitOffer(items,m*12,m*12,"Accepted at €"+m+" a month","proposal")){track("proposal_accepted",{monthly:m});propAccepted=true;propConfirm=false;render()}});
  // team: move an article to another group
  document.querySelectorAll("[data-grp]").forEach(el=>el.addEventListener("change",()=>{const n=el.dataset.grp;S.groups=S.groups||{};
    if(el.value)S.groups[n]=el.value;else delete S.groups[n];
    const a=ARTS.find(x=>x.name===n);render();
    saveSettings("Saved. "+n+(el.value?" is now "+el.value:" is back on its clicks group, "+autoTier(a).name)+": "+eur(priceOf(a,1))+" 1st, "+eur(priceOf(a,2))+" 2nd")}));
  // team: prices
  document.querySelectorAll("[data-t]").forEach(el=>el.addEventListener("change",()=>{const [i,f]=el.dataset.t.split("|");S.tiers[+i][f]=Math.max(0,+el.value||0);saveSettings();render()}));
  document.querySelectorAll("[data-sp]").forEach(el=>el.addEventListener("change",()=>{const [n,f]=el.dataset.sp.split("|");S.setPrices[n][f]=el.value.trim()===""?null:Math.max(0,+el.value||0);saveSettings();render()}));
  document.querySelectorAll("[data-s]").forEach(el=>el.addEventListener("change",()=>{S[el.dataset.s]=Math.max(0,+el.value||0);saveSettings();render()}));
  // team: offers
  document.querySelectorAll("[data-oa]").forEach(el=>el.addEventListener("click",()=>{const [i,k]=el.dataset.oa.split("|");const o=offers[+i];o.action=k;o.counterAmt=o.counterAmt||o._pkg;o.draftText=null;o.counterDrafted=false;openD.add("of-"+(o.id||i));render()}));
  document.querySelectorAll("[data-cd]").forEach(el=>el.addEventListener("click",()=>{const i=+el.dataset.cd,o=offers[i];o.counterAmt=Math.max(1,+$("ca-"+i).value||o._pkg);o.counterDrafted=true;o.draftText=null;render()}));
  document.querySelectorAll("[data-back]").forEach(el=>el.addEventListener("click",()=>{const o=offers[+el.dataset.back];o.action=null;o.counterDrafted=false;o.draftText=null;render()}));
  document.querySelectorAll("[data-dt]").forEach(el=>el.addEventListener("input",()=>{offers[+el.dataset.dt].draftText=el.value}));
  document.querySelectorAll("[data-send]").forEach(el=>el.addEventListener("click",async()=>{const o=offers[+el.dataset.send];
    if(o.preview){o.sent=true;render();return}
    const st={accept:"accepted",counter:"countered",decline:"declined"}[o.action];
    const {error}=await sb.rpc("partners_team_offer",{p_session:SESSION,p_id:o.id,p_action:o.action,p_counter:o.action==="counter"?o.counterAmt:null,p_draft:o.draftText,p_status:st});
    if(error){toast("Couldn't save: "+error.message);return}
    openMail(o.email,o.kind==="proposal"?"Your Nomadwise 2027 proposal":"Your Nomadwise placement offer",o.draftText);
    o.sent=true;o.decided=fmtD(TODAY)+" by "+ME;render()}));
  document.querySelectorAll("[data-undo]").forEach(el=>el.addEventListener("click",async()=>{const o=offers[+el.dataset.undo];
    if(!o.preview){const {error}=await sb.rpc("partners_team_offer",{p_session:SESSION,p_id:o.id,p_action:null,p_counter:null,p_draft:null,p_status:"new"});if(error){toast("Couldn't save: "+error.message);return}}
    o.action=null;o.sent=false;o.counterDrafted=false;o.draftText=null;render()}));
  // team: reminders
  document.querySelectorAll("[data-rd]").forEach(el=>el.addEventListener("input",()=>{drafts[el.dataset.rd]=el.value}));
  document.querySelectorAll("[data-rdx]").forEach(el=>el.addEventListener("click",()=>{delete drafts[el.dataset.rdx];render()}));
  document.querySelectorAll("[data-dr]").forEach(el=>el.addEventListener("click",()=>{const p=el.dataset.dr;
    const L=[];ARTS.forEach(a=>a.slots.forEach(s=>{const st=status(a,s,null);if(s.prov===p&&st.exp&&(st.due||st.soon))L.push({a,s,st})}));
    const first=L.reduce((m,x)=>x.st.exp<m?x.st.exp:m,L[0].st.exp);const past=first<TODAY;
    drafts[p]=`Hi ${namesOf(p).length?namesOf(p).join(" and "):p+" team"},\n\nA quick heads-up that ${L.length===1?"one of your Nomadwise placements "+(past?"ended on":"ends on"):L.length+" of your Nomadwise placements "+(past?"have ended or end soon, the first on":"end soon, the first on")} ${fmtD(first)}.\n\nYou can see them all, with renewal prices and anything else that's open, on your private partner page. Tick what you'd like to keep and send us a package offer there, or just reply here.\n\nBest,\nJonathan`;
    render()}));
  document.querySelectorAll("[data-ap]").forEach(el=>el.addEventListener("click",async()=>{const p=el.dataset.ap;const text=drafts[p];
    const {error}=await sb.rpc("partners_team_reminder",{p_session:SESSION,p_provider:p,p_draft:text,p_sent:true});
    if(error){toast("Couldn't save: "+error.message);return}
    openMail(emailsOf(p),"Your Nomadwise placements",text);
    REMS[p]={sent_at:new Date().toISOString()};delete drafts[p];render()}));
  // team: access
  const nr=$("na-role"),np=$("na-prov");
  const sync=()=>{if(!nr)return;np.hidden=nr.value!=="partner";$("na-co").hidden=nr.value!=="partner"||np.value!=="__new"};
  if(nr){nr.addEventListener("change",sync);np.addEventListener("change",sync);sync()}
  const af=$("accform");if(af)af.addEventListener("submit",async e=>{e.preventDefault();
    let prov=null;if(nr.value==="partner"){prov=np.value==="__new"?$("na-co").value.trim():np.value;if(!prov){toast("Add the company name");return}}
    const {error}=await sb.rpc("partners_team_access",{p_session:SESSION,p_name:$("na-name").value,p_email:$("na-email").value,p_provider:prov,p_action:"add"});
    if(error){toast(error.message);return}toast("Access given. They can now sign in with that email.");openD.add("d-acc");reloadTeam()});
  document.querySelectorAll("[data-sendlink]").forEach(el=>el.addEventListener("click",async()=>{
    const {error}=await sb.rpc("partners_team_access",{p_session:SESSION,p_name:null,p_email:el.dataset.sendlink,p_provider:null,p_action:"send"});
    toast(error?error.message:"Sign-in link sent to "+el.dataset.sendlink)}));
  document.querySelectorAll("[data-rmacc]").forEach(el=>el.addEventListener("click",async()=>{
    if(!el.dataset.sure){el.dataset.sure="1";el.textContent="Sure? Remove";return}
    const {error}=await sb.rpc("partners_team_access",{p_session:SESSION,p_name:null,p_email:el.dataset.rmacc,p_provider:null,p_action:"remove"});
    if(error){toast(error.message);return}toast("Removed");reloadTeam()}));
}

$("mbar-b").addEventListener("click",()=>{const p=$("selp");if(p)p.scrollIntoView({behavior:"smooth"})});
window.addEventListener("hashchange",()=>{if(/login=/.test(location.hash))location.reload()});
boot().catch(e=>message("Something went wrong",String(e&&e.message||e)));
})();
