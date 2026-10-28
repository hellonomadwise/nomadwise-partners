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
let PAYMENTS=[], SHOWN={}, SCEN={}, PB=null, BIDS=[], BIDBOX=null, NOBID=new Set(); let SESSION=null; let ACCESS=[]; let MYNAME=""; let ACT_EV=[]; let PREVIEW=false; let SALES_FROM=null;
let S={tiers:[],setPrices:{},packages:{},contracts:{},firstRefusal:{articles:[]},discTiers:[],review:0,discMin:0,discPct:0};
let ARTS=[], TOTALS=null, PROVIDERS=[], TEAM=[], REMS={}, offers=[];
const regionOf={};
let mode="team", asProv="__new";
const sel=new Map();
let reviews=0, submitted=null, laterOpen=false, sending=false, confirmOffer=null, draftNote="";
const openD=new Set();
const propOpt=new Set(); let propAccepted=false, propConfirm=false, PE=null, peQ="";
let filt={q:"",tier:"",avail:false,regions:new Set(),region:"",all:false,prov:"",ppos:""}; let POPULAR=[];
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
// ---------- families: a country and its cities go together, in 1st or 2nd ----------
const FAMS=()=>S.families||{};
function famHead(n){const F=FAMS();if(F[n])return n;for(const h in F)if((F[h]||[]).includes(n))return h;return null}
const famNames=h=>[h].concat(FAMS()[h]||[]);
const famOf=n=>{const h=famHead(n);return h?famNames(h):[n]};
// Who owns a family in a position: whoever holds the country there (paid now, or in its 60-day renewal window)
function famOwner(h,pos){const a=ARTS.find(x=>x.name===h);const s=a&&a.slots[pos-1];if(!s||!s.prov)return null;if(s.flag==="E")return s.prov;return s.exp&&days(D(s.exp),TODAY)>=-60?s.prov:null}
const isoD=d=>d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
// A city added to a family the partner already holds runs to the country's end date, priced pro rata
const proRata=(a,pos,until)=>Math.max(1,Math.round(priceOf(a,pos)*Math.min(Math.max(days(until,TODAY),0),365)/365));
// Partner view of a city slot: it only ever goes with its country
function famMember(a,s,v,st,h){
  const pos=s.pos,own=famOwner(h,pos),head=ARTS.find(x=>x.name===h);st.nobid=true;st.fam=h;
  if(!head)return null;
  if(v===null){if(!st.paid)st.who=(st.who?st.who+" · ":"")+"goes with "+h+(own?" ("+own+")":"");return null}
  if(own&&own!==v){
    if(st.k==="mine"){st.sel=false;st.label=(st.exp?"Yours to "+fmtM(st.exp)+", ":"")+"then goes with "+h;return null}
    if(st.k==="available")return {k:"reserved",label:"Goes with "+h,who:"",held:false,fam:h,nobid:true};
    return null}
  if(own===v){
    const hst=status0(head,head.slots[pos-1],v);
    if(st.k==="available"){
      if(S.contracts[v]){st.sel=false;st.label="Goes with your "+h+", in your proposal";return null}
      if(!(hst.due||hst.soon)&&hst.exp){st.until=hst.exp;st.price=proRata(a,pos,hst.exp);st.label="Add to your "+h+" to "+fmtM(hst.exp)}
      else st.label="Renew with "+h;
      return null}
    if((st.k==="taken"||st.k==="reserved")&&st.exp){const nx=new Date(st.exp);nx.setDate(nx.getDate()+1);st.label="Joins your "+h+" "+fmtM(nx)}
    return null}
  const hst=status(head,head.slots[pos-1],v);
  if(!(hst.sel||hst.k==="mine")){
    if(st.k==="available")return {k:"reserved",label:"Goes with "+h,who:"",held:false,fam:h,nobid:true};
    if(st.k==="mine"){st.sel=false;st.label=(st.exp?"Yours to "+fmtM(st.exp)+", ":"")+"then goes with "+h}}
  else if(st.k==="available")st.label="With "+h;
  return null}
// Everything that gets added when a partner picks any article in a family
function famPick(h,pos){const v=viewer(),own=famOwner(h,pos),pl=pos===1?"1st":"2nd",out=[];
  const arts=famNames(h).map(n=>ARTS.find(a=>a.name===n)).filter(Boolean),head=arts[0];
  const it=(a,st,full)=>({k:key(a,pos),name:a.name,price:full?priceOf(a,pos):(st.price!=null?st.price:priceOf(a,pos)),kind:st.k==="mine"?"renew":"new",tier:grp(a).name,until:!full&&st.until?isoD(st.until):null});
  const hst=status(head,head.slots[pos-1],v);let full=true;
  if(own===v){if(hst.k==="mine"&&hst.sel&&(hst.due||hst.soon))out.push(it(head,hst,true));else full=false}
  else{if(hst.oneEach)return "You have the other position on "+h+", so its family isn't open to you in "+pl;if(!hst.sel)return h+" isn't open in "+pl+", so its cities aren't either";out.push(it(head,hst,true))}
  for(const a of arts.slice(1)){const st=status(a,a.slots[pos-1],v);
    if(st.oneEach)return "You have the other position on "+a.name+", so the "+h+" family isn't open to you in "+pl;
    if((st.k==="available"&&st.sel)||(st.k==="mine"&&st.sel&&(st.due||st.soon)))out.push(it(a,st,full))}
  const fresh=out.filter(x=>!sel.has(x.k));return fresh.length?fresh:"Nothing in the "+h+" family to add right now"}
const holdsNow=s=>s.prov&&(!s.exp||days(D(s.exp),TODAY)>=-60);
// First refusal on open 1st positions (flag R/R31): lasts as long as the holder's contract runs (incl. its renewal window)
function frActive(a,s){if(s.pos!==1||!/^R/.test(s.flag||""))return null;const h=(S.firstRefusal||{}).holder||"Ubigi";const c=S.contracts[h];
  return c&&c.contractEnd&&days(D(c.contractEnd),TODAY)>=-60?h:null}
const frItems=o=>o.items.map(it=>{const m=String(it).match(/^(.*?) · 1st/);const a=m&&ARTS.find(x=>x.name===m[1]);return a&&frActive(a,a.slots[0])?a.name:null}).filter(Boolean);
function status(a,s,viewer){
  const st=status0(a,s,viewer);
  const c=viewer&&S.contracts[viewer];
  if(c&&st.k==="mine"){st.sel=false;st.contract=true;if(st.fr)st.label=((c.included||[]).includes(a.name)||propOpt.has(a.name))?"In your proposal":"Optional, tick above";}
  const fh=famHead(a.name);
  if(fh&&fh!==a.name){const f=famMember(a,s,viewer,st,fh);if(f)return f}
  else if(fh&&viewer&&st.k==="available"&&st.sel){const m=FAMS()[fh]||[];st.label=m.length===1?"Available with "+m[0]:"Available with "+m.length+" more"}
  // One position per article: a partner can never hold or pick both 1st and 2nd
  if(viewer&&st.sel&&st.k!=="mine"){const op=s.pos===1?2:1,os=a.slots[op-1],ost=os?status0(a,os,viewer):null,pk=key(a,op);
    const holds=ost&&ost.k==="mine",picked=sel.has(pk);
    if(holds||picked){const ol=op===1?"1st":"2nd";return {k:"taken",label:holds?"You have "+ol+" here":"You picked "+ol+" here",who:"",sel:false,oneEach:true}}}
  // Partners can make an offer to take over a slot held by someone else in its last two months (or while it is held for renewal)
  const otherMine=viewer&&(()=>{const os=a.slots[s.pos===1?1:0];return os&&status0(a,os,viewer).k==="mine"})();
  if(viewer&&!otherMine&&!st.frSlot&&!st.nobid&&s.prov&&s.prov!==viewer&&s.exp&&s.flag!=="E"&&!NOBID.has(a.name+" · "+(s.pos===1?"1st":"2nd"))&&!(S.contracts[s.prov]&&S.contracts[s.prov].noBids)&&((st.k==="taken"&&st.soon)||(st.k==="reserved"&&st.due))){
    st.bid=true;st.label=st.due?"In renewal · offers open":"Ends "+fmtD(st.exp)+" · offers open";}
  // Admin: who is on the slot when nobody has paid for it (from the July 2026 positioning sheet)
  if(viewer===null&&!st.paid&&!(s.prov&&s.exp)){const sh=(SHOWN[a.name]||{})[String(s.pos)];
    st.who=(st.who?st.who+" · ":"")+(sh?"Showing: "+sh+" (unpaid, Jul 2026 sheet)":"Showing: not recorded");}
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
      const soon=d<=60, near=d<=90;
      if(viewer===s.prov) return {k:"mine",label:soon?"Renew by "+fmtD(e):"Yours to "+fmtM(e),sel:true,soon,near,exp:e,held:true,paid:true};
      const nx=new Date(e);nx.setDate(nx.getDate()+1);
      return {k:"taken",label:"Unavailable · opens "+fmtM(nx),who:s.prov+" · "+fmtD(e),soon,near,exp:e,held:true,paid:true};
    }
    if(d>=-60){
      if(viewer===s.prov){const hold=new Date(e);hold.setDate(hold.getDate()+60);return {k:"mine",label:"Ended "+e.getDate()+" "+MON[e.getMonth()]+", renew now",due:true,sel:true,exp:e,hold,held:true,paid:true};}
      return {k:"reserved",label:"In renewal",who:s.prov+" · ended "+fmtD(e),due:true,exp:e,held:true,paid:true};
    }
    return {k:"available",label:"Available",sel:true,who:"Unpaid: "+s.prov+" showing since "+fmtM(e)};
  }
  if(s.flag==="R31") return {k:"reserved",label:"Reserved to Dec 2026",who:"First refusal to 31 Dec 2026"};
  return {k:"available",label:"Available",sel:true,who:s.flag==="O"?"Outside contract":""};
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
  BIDS=data.bids||[]; NOBID=new Set(data.noBid||[]); POPULAR=data.popular||[];
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
  SALES_FROM=data.salesFrom||null; PAYMENTS=data.payments||[]; SHOWN=data.shown||{}; SCEN=data.scenarios||{};
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
    const m=String(it).match(/^(.*?) · (1st|2nd)(?: · to (\d{4}-\d{2}-\d{2}))?$/);const a=m&&ARTS.find(x=>x.name===m[1]);
    if(a){const pos=m[2]==="1st"?1:2,p=m[3]?proRata(a,pos,D(m[3])):priceOf(a,pos),t=grp(a).name;sub+=p;if((S.discTiers||[]).includes(t)){elig++;eligVal+=p}return `<tr><td>${esc(a.name)}${m[3]?` <span class="muted">to ${fmtD(D(m[3]))}, pro rata</span>`:""}</td><td>${m[2]}</td><td>${esc(t)}</td><td class="num">${eur(p)}</td></tr>`}
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
const ACT_BID={
  accept:{label:"Accept",what:"Only once the current holder hasn't renewed. Drafts a confirmation to open in your email app. Then update the Notion placements table and send the invoice."},
  counter:{label:"Counter",what:"Suggest a different price. Approving opens the reply in your email app."},
  decline:{label:"Decline",what:"Pick the reason (the holder renewed, or the offer is too low) and a polite no is drafted. The holder is never named."}
};
const firstName=o=>{const n=namesOf(o.from);return n.length?n.join(" and "):o.from+" team"};
const itemLines=o=>o.items.map(it=>{const m=String(it).match(/^(.*?) · (1st|2nd)(?: · to (\d{4}-\d{2}-\d{2}))?$/);return "- "+(m?m[1]+", "+m[2]+" position"+(m[3]?", to "+fmtD(D(m[3])):""):it)}).join("\n");
const holdDate=()=>{const d=new Date(TODAY);d.setDate(d.getDate()+7);return fmtD(d)};
// Takeover offers: one slot held by someone else
function bidInfo(o){const m=String(o.items[0]||"").match(/^(.*) · (1st|2nd)$/);if(!m)return null;
  const a=ARTS.find(x=>x.name===m[1]);if(!a)return null;const pos=m[2]==="1st"?1:2,s=a.slots[pos-1],lp=priceOf(a,pos);
  const e=s&&s.exp?D(s.exp):null,closes=e?(()=>{const x=new Date(e);x.setDate(x.getDate()+60);return x})():null;
  const pay=PAYMENTS.filter(p=>p.provider===s.prov&&p.article===a.name&&+p.pos===pos).sort((x,y)=>String(y.invoiced_on||"").localeCompare(String(x.invoiced_on||"")))[0];
  const sl=a.sales||{},n=+sl["s"+pos]||0,v=+sl["v"+pos]||0,c=+sl["c"+pos]||0;
  const others=offers.filter(x=>x!==o&&x.kind==="bid"&&x.status==="new"&&x.items[0]===o.items[0]);
  return {a,pos,pl:m[2],s,lp,e,closes,pay,n,v,c,others,holder:s&&s.prov}}
const cleanNote=t=>String(t||"").replace(/\n?Sent by .*$/,"").trim();
function bidPanel(o){const b=bidInfo(o);if(!b)return invoice(o);const bf=bidFamily(b.a.name,b.pl);b.lp=o.list||bf.lp;o._pkg=b.lp;
  const pct=b.lp?Math.round((o.offer-b.lp)/b.lp*100):0,vs=pct===0?"at list price":(pct>0?pct+"% above list":(-pct)+"% below list");
  const ended=b.e&&b.e<TODAY;
  const row=(k,v)=>`<tr><td>${k}</td><td class="num" style="text-align:right">${v}</td></tr>`;
  return `${b.closes?`<div class="note" style="background:var(--amber-soft,#FFF4E5);color:#7A4B00;border-radius:10px;padding:10px 12px;margin:8px 0"><b>Decide by ${fmtD(b.closes)}</b>, when ${esc(b.holder)}'s renewal window closes. ${esc(b.holder)} can renew first, and doesn't know about this offer.</div>`:""}
    <div class="scroll"><table class="inv"><tbody>
    ${row("Their offer, 12 months",`<b class="mono">${eur(o.offer)}</b> <span class="${pct<0?"neg":""}" style="font-size:.85rem">${vs}</span>`)}
    ${row("List price",`<span class="mono">${eur(b.lp)}</span> · ${esc(grp(b.a).name)}`)}
    ${bf.now.length||bf.later.length?row("Comes with",esc(bf.now.join(", "))+(bf.later.length?(bf.now.length?"; ":"")+esc(bf.later.join(", ")):"")):""}
    ${row("Held by",esc(b.holder||"Nobody")+(b.e?(ended?", ended ":", ends ")+fmtD(b.e):""))}
    ${row("They last paid",b.pay?`<span class="mono">${eur(b.pay.paid)}</span>${b.pay.invoiced_on?" in "+fmtM(D(b.pay.invoiced_on)):""}${+b.pay.paid?` <span class="muted" style="font-size:.85rem">· offer is ${o.offer===+b.pay.paid?"the same":eur(Math.abs(o.offer-b.pay.paid))+(o.offer>b.pay.paid?" more":" less")}</span>`:""}`:'<span class="muted">Not recorded</span>')}
    ${row("Sales from this slot, 12 months",b.n?`${b.n} sales, <span class="mono">${eur(b.v)}</span> <span class="muted" style="font-size:.85rem">· our commission ${eur(b.c)}</span>`:'<span class="muted">None tracked</span>')}
    ${row("Other offers on this slot",b.others.length?b.others.length+", highest <span class=\"mono\">"+eur(Math.max(...b.others.map(x=>x.offer)))+"</span>":"None")}
    </tbody></table></div>`}
function draftFor(o){
  const n=firstName(o),sig="\n\nBest,\nThe Nomadwise team";
  if(o.kind==="bid"){const b=bidInfo(o)||{a:{name:o.items[0]},pl:"",lp:o.offer};const what=b.a.name+(b.pl?", "+b.pl+" position":"");
    if(o.action==="accept")return `Hi ${n},\n\nGood news: your offer of ${eur(o.offer)} for ${what} has been accepted.\n\nThe placement runs for 12 months from the day it goes live. We'll send the invoice shortly, and it goes live once it's paid.`+sig;
    if(o.action==="counter")return `Hi ${n},\n\nThanks for your offer for ${what}. This one has a lot of interest, so we can't accept ${eur(o.offer)}, but we can do ${eur(o.counterAmt)} for 12 months.\n\nWe're holding it for you until ${holdDate()}. Just reply here to accept.`+sig;
    if((o.reason||(o.offer>=b.lp?"renewed":"low"))==="renewed")return `Hi ${n},\n\nThanks for your offer for ${what}. The current partner has renewed this placement, so it isn't available this time.\n\nWe'll keep your interest on file and let you know if it opens up again. In the meantime, your partner page shows everything that's open now.`+sig;
    return `Hi ${n},\n\nThanks for your offer of ${eur(o.offer)} for ${what}. Unfortunately it's below what we can accept for this placement, which lists at ${eur(b.lp)} for 12 months.\n\nIf you'd like to try again, you can send a new offer from your partner page while offers are open.`+sig;
  }
  if(o.kind==="proposal"){
    if(o.action==="accept")return `Hi ${n},\n\nThanks for confirming the 2027 proposal at ${eur(o.offer/12)} a month:\n${itemLines(o)}\n\nWe'll send the agreement over shortly, and everything carries on without a break from 1 January.`+sig;
    if(o.action==="counter")return `Hi ${n},\n\nThanks for coming back on the 2027 proposal. Before we confirm, we'd like to suggest ${eur(o.counterAmt/12)} a month for:\n${itemLines(o)}\n\nJust reply here and we'll send the agreement.`+sig;
    return `Hi ${n},\n\nThanks for coming back on the 2027 proposal. Unfortunately we can't go ahead on these terms. Happy to talk through options, just reply here.`+sig;
  }
  if(o.action==="accept")return `Hi ${n},\n\nThanks for your offer. We're happy to accept ${eur(o.offer)} for these placements:\n${itemLines(o)}\n\nEach placement runs for 12 months from the day it goes live. We'll send the invoice shortly, and the placements go live once it's paid.`+sig;
  if(o.action==="counter")return `Hi ${n},\n\nThanks for your offer of ${eur(o.offer)}. We can't go quite that low for this package, but we can do ${eur(o.counterAmt)} for:\n${itemLines(o)}\n\nWe're holding these placements for you until ${holdDate()}. Reply here to accept, or send a new offer from your partner page.`+sig;
  return `Hi ${n},\n\nThanks for your request for these placements:\n${itemLines(o)}\n\nUnfortunately we can't confirm it as it stands. Your partner page shows everything that's open now, and you're welcome to send a new request from there.`+sig;
}
function openMail(to,subject,body){
  const addr=String(to||"").split(",").map(s=>s.trim()).filter(s=>/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(s)).join(",");
  location.href="mailto:"+addr+"?subject="+encodeURIComponent(subject)+"&body="+encodeURIComponent(body);
}
function actionBlock(o,i){
  if(o.sent)return `<div class="done"><b>${{accept:"Accepted",counter:"Countered",decline:"Declined"}[o.action]||"Answered"}</b>${o.decided?" · "+esc(o.decided):""}${o.preview?' <span class="muted">Preview only, nothing was sent.</span>':""}</div>
    ${o.draftText?`<details><summary class="note" style="cursor:pointer">The reply we sent</summary><div class="draft" style="margin-top:6px">${esc(o.draftText)}</div></details>`:""}
    <div class="acts"><button class="btn small ghost" data-undo="${i}">Move back to open</button></div>`;
  const AX=o.kind==="bid"?ACT_BID:ACT;
  if(!o.action)return `<div class="acts">${Object.entries(AX).map(([k,a])=>`<button class="btn small ${k==="accept"?"primary":k==="decline"?"ghost":""}" data-oa="${i}|${k}">${a.label}</button>`).join("")}</div>
    <ul class="what">${Object.values(AX).map(a=>`<li><b>${a.label}</b> ${a.what}</li>`).join("")}</ul>`;
  const a=AX[o.action];
  if(o.action==="counter"&&!o.counterDrafted)return `<div class="step"><b>Counter</b><p class="note">${a.what}</p>
    <label class="fl">Your counter price for the ${o.kind==="proposal"?"year":"package"} (€)<input id="ca-${i}" type="number" min="1" value="${Math.round(o.counterAmt||o._pkg||o.offer)}"></label>
    <div class="acts"><button class="btn small primary" data-cd="${i}">Draft the reply</button><button class="btn small ghost" data-back="${i}">Back</button></div></div>`;
  return `<div class="step"><b>${a.label}</b><p class="note">${a.what}</p>
    ${o.email?"":`<p class="note"><b>No one from ${esc(o.from)} is on the access list yet.</b> Add them under Who has access, or type their email into your email app.</p>`}
    ${o.kind==="bid"&&o.action==="decline"?(()=>{const r=o.reason||(o.offer>=((bidInfo(o)||{}).lp||0)?"renewed":"low");return `<div class="acts" role="group" aria-label="Reason">${[["renewed","The holder renewed"],["low","Offer too low"]].map(([k,l])=>`<button class="btn small ${r===k?"primary":"ghost"}" data-rsn="${i}|${k}" aria-pressed="${r===k}">${l}</button>`).join("")}</div>`})():""}
    <label class="eyebrow" for="dt-${i}">Draft reply to the provider · edit freely</label><textarea class="draft" id="dt-${i}" data-dt="${i}" rows="12">${esc(o.draftText??(o.draftText=draftFor(o)))}</textarea>
    <div class="acts"><button class="btn small primary" data-send="${i}">Approve and open in email</button><button class="btn small ghost" data-back="${i}">Back</button></div></div>`;
}
function chipList(names){
  const g={};names.forEach(n=>{const r=regionOf[n]||"Other";(g[r]=g[r]||[]).push(n)});
  return `<div class="clist">${REGION_ORDER.concat("Other").filter(r=>g[r]).map(r=>`<div class="cgrp"><span class="eyebrow">${esc(r)} · ${g[r].length}</span><div class="chips">${g[r].sort((a,b)=>a.replace(/^The /,"").localeCompare(b.replace(/^The /,""))).map(n=>`<span class="chip">${esc(n)}</span>`).join("")}</div></div>`).join("")}</div>`;
}
const fold=(id,title,inner)=>`<details class="fold" id="${id}" ${openD.has(id)?"open":""}><summary>${title}<span class="tag-internal">Admin only</span></summary><div class="fold-in">${inner}</div></details>`;
const renewable=m=>m.st.fr||m.st.due||m.st.soon;
const peOn=c=>c&&c.edit&&c.edit.on;
function peInit(c){if(!PE)PE={keep:new Set(c.edit.keep||[]),add:new Set(c.edit.add||[])};return PE}
const peList=c=>{const P=peInit(c);return [...P.keep,...P.add].reduce((t,n)=>{const a=ARTS.find(x=>x.name===n);return t+(a?priceOf(a,1):0)},0)};
const peFixed=c=>c.edit&&c.edit.mode==="fixed";
const peMonthly=c=>peFixed(c)?+c.base:Math.round(peList(c)*(1-(+c.edit.disc||0))/12);
const peChanged=c=>{const P=peInit(c);const k0=c.edit.keep||[],a0=c.edit.add||[];return P.keep.size!==k0.length||P.add.size!==a0.length||k0.some(n=>!P.keep.has(n))||a0.some(n=>!P.add.has(n))};
const coreM=c=>peOn(c)?peMonthly(c):c.base;
const ptot=c=>coreM(c)+[...propOpt].reduce((t,o)=>t+((c.prices||{})[o]||0),0);
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
    ${v===null?`<div class="stat"><span class="v">${totalViews?(totalClicks/totalViews*100).toFixed(1):"0"}%</span><span class="l">blended click rate</span></div>`:""}`;
  OPEN_NOW=av;
  $("main").innerHTML=(v===null?teamPanels():"")+(v!==null&&v!=="__new"?currentPanel(v):"")+inventoryPanel(v)+(v===null?"":addonPanel())+bidBox();
  $("rail").innerHTML=railPanel(v);
  bind();
  mbar();
}
function resetSel(){sel.clear();reviews=0;submitted=null;propOpt.clear();propAccepted=false;propConfirm=false;PE=null;peQ=""}

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
// Plain-text copy of a partner's activity, to paste into Claude
let STORY={};
const plain=h=>String(h).replace(/<[^>]+>/g,"").replace(/&quot;/g,'"').replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&amp;/g,"&");
const STORY_ASK="This is what partners did on Nomadwise's private placements portal (partners.nomadwise.io). eSIM brands use it to book 1st or 2nd position on our country eSIM guides for 12 months, renew what they hold, or make an offer to take over a slot another brand holds in its last two months. Tell me the story: what each partner seems to be after, where they hesitated or got stuck, and what I should say or offer them next.";
function storyOf(p,vis,regs,unsent,name,tm){
  const L=[];const pr=p.provider;
  L.push("PARTNER: "+name+" ("+pr+"), "+p.email);
  L.push("Last seen "+fmtD(p.last)+", "+tm(p.last).slice(0,5)+" · "+vis.length+(vis.length===1?" visit · ":" visits · ")+mins(vis.reduce((t,v)=>t+v.secs,0))+" on the page in total");
  const held=[];ARTS.forEach(a=>a.slots.forEach(s=>{if(s.prov===pr&&s.exp&&days(D(s.exp),TODAY)>=-60){const e=D(s.exp);held.push(a.name+" "+(s.pos===1?"1st":"2nd")+(e<TODAY?" (ended "+fmtD(e)+", in renewal)":" (to "+fmtD(e)+")"))}}));
  L.push("Holds now: "+(held.length?held.length+" placements: "+held.join(", "):"nothing"));
  const c=S.contracts[pr];if(c)L.push("Contract: "+(c.base?eur(c.base)+" a month":"")+(c.contractEnd?", ends "+fmtD(D(c.contractEnd)):""));
  const os=offers.filter(o=>o.from===pr);
  if(os.length)L.push("Offers sent:\n"+os.map(o=>"- "+o.when+": "+(o.kind==="bid"?"takeover offer":o.kind==="proposal"?"2027 proposal":"request")+", "+eur(o.offer)+" for "+o.items.join(", ")+" · "+(o.status==="new"?"waiting for our reply":(o.action||o.status))+(cleanNote(o.note)?" · their note: \""+cleanNote(o.note)+"\"":"")).join("\n"));
  if(regs.length)L.push("Regions looked at: "+regs.join(", "));
  if(p.searches.size)L.push("Searched: "+[...p.searches].map(s=>"\""+s+"\"").join(", "));
  if(unsent.length)L.push("In their selection, not sent ("+unsent.length+"): "+unsent.join(", "));
  if(p.taps.size)L.push("Tapped slots held by others: "+[...p.taps].join(", "));
  if(Object.keys(p.flags).length)L.push("Tried to copy or save content: "+Object.entries(p.flags).map(([k,n])=>k.replace(/_/g," ")+" x"+n).join(", "));
  L.push("Visits, oldest first:");
  vis.slice().reverse().forEach((v,i)=>{const x=v.info||{};
    L.push("Visit "+(i+1)+": "+fmtD(v.start)+", "+tm(v.start).slice(0,5)+" · "+(v.secs?mins(v.secs):"under a minute")+(v.scroll?" · scrolled "+v.scroll+"%":"")+(x.device?" · "+x.device+", "+x.browser+" on "+x.os:""));
    if(!v.steps.length)L.push("  looked around without clicking anything");
    v.steps.forEach(s=>L.push("  "+tm(s.t)+" "+plain(evText(s))))});
  return L.join("\n");
}
async function copyText(t){try{await navigator.clipboard.writeText(t);return true}catch(e){const ta=document.createElement("textarea");ta.value=t;ta.style.position="fixed";ta.style.opacity="0";document.body.appendChild(ta);ta.select();let ok=false;try{ok=document.execCommand("copy")}catch(_){}ta.remove();return ok}}
function activityPanel(){
  STORY={};
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
    if(!p.never)STORY[id]=storyOf(p,vis,regs,unsent,who(p.email),tm);
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
      <div class="acts"><button class="btn small" data-story="${id}" title="Copies everything above as plain text, ready to paste into Claude">Copy for Claude</button></div>
      <div><span class="eyebrow">Every visit, newest first · open one to see each step</span><div class="rgs" style="margin-top:6px">${vis.map(visitHtml).join("")}</div></div>`}
    </details>`};
  return `<section class="panel internal"><div class="phead"><h2 class="dup">Partner activity<span class="tag-internal">Admin only</span></h2><span class="muted">Last 90 days · admins and previews are never recorded</span></div>
    ${all.some(p=>!p.never)?`<div class="acts" style="margin-bottom:8px"><button class="btn small" data-story="__all" title="Copies every partner's activity as plain text, ready to paste into Claude">Copy all partners for Claude</button></div>`:""}
    <div class="queue">${all.map(line).join("")||'<p class="muted" style="font-size:.9rem">No partners have access yet. Add them under Who has access.</p>'}</div>
    ${topI.length?`<details class="rg" style="margin-top:6px"><summary style="cursor:pointer;font-weight:600">Slots partners have picked but not sent · ${topI.length}</summary><div class="scroll" style="margin-top:8px"><table class="tbl"><thead><tr><th>Slot</th><th>In the selection of</th></tr></thead><tbody>${topI.map(([i,ps])=>`<tr><td>${esc(i)}</td><td>${ps.map(p=>esc(who(p.email))+" <span class='muted'>("+esc(p.provider)+")</span>").join(", ")}</td></tr>`).join("")}</tbody></table></div></details>`:""}
  </section>`;
}
function activityTitle(){const wk=ACT_EV.filter(e=>e.kind==="visit"&&new Date(e.at)>new Date(Date.now()-7*864e5)).length;return "Partner activity"+(wk?` <span class="muted" style="font-weight:500;font-size:.9rem">· ${wk} ${wk===1?"visit":"visits"} this week</span>`:"")}

// Sales of one brand on one article, last 12 months, any position: count, customer value, our commission
const brandSales=(ar,p)=>{const S2=ar.sales;let n=0,v=0,c=0;if(!S2)return {n,v,c};
    [["b1","v1","c1"],["b2","v2","c2"],["b3","v3","c3"],["bo","vo","co"]].forEach(([b,vk,ck])=>{(S2[b]||[]).forEach(x=>{if(x.b===p){n+=+x.n||0;v+=+x.v||0;const tv=+S2[vk]||0;c+=tv?(+S2[ck]||0)*(+x.v||0)/tv:0}})});return {n,v,c}};

// ---------- proposal builder (admin) ----------
function pbInit(p){const c=S.contracts[p];if(!c)return null;
  const cur=ARTS.filter(a=>a.slots[0].prov===p&&a.slots[0].exp===c.contractEnd).map(a=>a.name);
  const sc=SCEN[p]||{};
  const curList=cur.reduce((t,n)=>{const a=ARTS.find(x=>x.name===n);return t+(a?priceOf(a,1):0)},0);
  const disc=sc.disc!=null?+sc.disc:(curList?1-(+c.base||0)*12/curList:0);
  return {p,cur,keep:new Set(sc.keep?sc.keep.filter(n=>cur.includes(n)):cur),add:new Set(sc.add||[]),disc,q:"",opt:new Set(sc.opt||[]),optPrice:Object.assign({},c.prices||{},sc.optPrice||{}),fixed:sc.fixed!=null?!!sc.fixed:c.pricing==="fixed",fixedM:+sc.fixedM||+c.base||0};}
const ROI=()=>{const r=+((SCEN._renewal||{}).roi);return r>0?r:1.5};
function roiSave(r){SCEN._renewal={roi:r};sb.rpc("partners_team_scenario",{p_session:SESSION,p_provider:"_renewal",p_data:{roi:r}}).then(({error})=>{if(error)toast("Couldn't save the target")})}
function pbSetList(){return PB.cur.filter(n=>PB.keep.has(n)).concat([...PB.add]).reduce((t,n)=>{const a=ARTS.find(x=>x.name===n);return t+(a?priceOf(a,1):0)},0)}
function pbSave(){if(!PB)return;clearTimeout(pbSave.t);pbSave.t=setTimeout(async()=>{
  const data={keep:[...PB.keep],add:[...PB.add],disc:PB.disc,monthly:PB.monthly,opt:[...PB.opt],optPrice:PB.optPrice,fixed:PB.fixed,fixedM:PB.fixedM,at:new Date().toISOString()};SCEN[PB.p]=data;
  const {error}=await sb.rpc("partners_team_scenario",{p_session:SESSION,p_provider:PB.p,p_data:data});if(error)toast("Couldn't save the scenario. Check your connection.")},600)}
function pbCand(){const p=PB.p,c=S.contracts[p],win=new Date(D(c.contractEnd));win.setDate(win.getDate()+31);
  return ARTS.filter(a=>!PB.cur.includes(a.name)).map(a=>{const s=a.slots[0];
    let free=null;if(s.flag==="E")free=null;else if(!s.prov||!s.exp)free=TODAY;else{const e=D(s.exp);if(days(e,TODAY)<-60)free=TODAY;else if(s.prov===p)free=null;else{const nx=new Date(e);nx.setDate(nx.getDate()+1);if(nx<=win)free=nx}}
    return {a,free,holder:s.prov&&s.exp&&days(D(s.exp),TODAY)>=-60?s.prov:"",opt:(c.options||[]).includes(a.name)}}).filter(x=>x.free&&!x.opt)}
// Best proposal: price held, same number of articles, the strongest sellers in, families kept whole,
// and the optional extras where the partner comes out ahead. With a fixed price, every extra sale raises
// their profit and our commission together, so "most sales" is the one target that serves both sides.
const NEW_FACTOR=0.8,STICK=1.5,MAX_SWAPS=12;
// Best proposal, built to be an easy yes and to earn the most on both sides:
// - price held, same number of articles, optional extras ticked only where the partner comes out ahead;
// - countries and their cities stay together (a free city joins its country);
// - an article is swapped only when the new one is expected to sell at least 1.5x what it replaces, so
//   only clearly weak ones move, at most 12, and never adding list value (we don't give away more than they pay for).
// With the price fixed, more sales means more profit for them and more commission for us at the same time.
function pbBest(){
  const p=PB.p,c=S.contracts[p],cap=PB.cur.length;
  const S1=a=>{const z=a.sales||{};return {v:+z.v1||0,c:+z.c1||0}};
  PB.opt=new Set((c.options||[]).filter(n=>{const a=ARTS.find(x=>x.name===n);if(!a)return false;const e=S1(a);return e.v-(+PB.optPrice[n]||0)*12-e.c>0}));
  const curSet=new Set(PB.cur),candA=pbCand().map(x=>x.a),candSet=new Set(candA.map(a=>a.name));
  const heldBy=(n,who)=>{const a=ARTS.find(x=>x.name===n);const s=a&&a.slots[0];return s&&s.prov===who&&s.exp&&days(D(s.exp),TODAY)>=-60};
  const locked=new Set(PB.cur.filter(n=>{const h=famHead(n);return h&&h!==n&&!curSet.has(h)&&(PB.opt.has(h)||heldBy(h,p))}));
  const pool=new Map();
  PB.cur.forEach(n=>{const a=ARTS.find(x=>x.name===n);if(a)pool.set(n,{a,v:brandSales(a,p).v,cur:true})});
  candA.forEach(a=>{const h=famHead(a.name);if(h&&h!==a.name&&!curSet.has(h)&&!candSet.has(h))return;pool.set(a.name,{a,v:S1(a).v*NEW_FACTOR,cur:false})});
  const seen=new Set(locked),units=[];
  pool.forEach((x,n)=>{if(seen.has(n))return;const ns=famOf(n).filter(m=>pool.has(m)&&!locked.has(m));ns.forEach(m=>seen.add(m));
    units.push({ns,v:ns.reduce((t,m)=>t+pool.get(m).v,0),L:ns.reduce((t,m)=>t+priceOf(pool.get(m).a,1),0),cur:ns.some(m=>pool.get(m).cur)})});
  let base=units.filter(u=>u.cur);const cands=units.filter(u=>!u.cur).sort((x,y)=>y.v/y.ns.length-x.v/x.ns.length);
  const weakKey=u=>u.v*STICK/u.ns.length,cnt=()=>locked.size+base.reduce((t,u)=>t+u.ns.length,0);
  const lockedL=[...locked].reduce((t,n)=>t+priceOf(ARTS.find(x=>x.name===n),1),0),LL=()=>lockedL+base.reduce((t,u)=>t+u.L,0);
  while(cnt()>cap&&base.length){const w=base.slice().sort((x,y)=>weakKey(x)-weakKey(y))[0];base=base.filter(u=>u!==w)}
  const budget=LL();let sw=0;
  for(const cu of cands){if(sw+cu.ns.length>MAX_SWAPS)continue;
    const weak=base.slice().sort((x,y)=>weakKey(x)-weakKey(y));const rem=[];let fr=cap-cnt();
    for(const w of weak){if(fr>=cu.ns.length)break;rem.push(w);fr+=w.ns.length}
    if(fr<cu.ns.length)continue;
    const rv=rem.reduce((t,w)=>t+w.v,0),rl=rem.reduce((t,w)=>t+w.L,0);
    if(cu.v>STICK*rv&&LL()-rl+cu.L<=budget){base=base.filter(u=>!rem.includes(u)).concat([cu]);sw+=cu.ns.length}}
  const pick=new Set([...locked,...base.flatMap(u=>u.ns)]);
  PB.keep=new Set(PB.cur.filter(n=>pick.has(n)));PB.add=new Set([...pick].filter(n=>!curSet.has(n)));
  PB.fixed=true;PB.fixedM=+(c.current&&c.current.monthly)||+c.base||PB.fixedM;
  const inn=[...PB.add],joins=inn.filter(n=>{const h=famHead(n);return h&&h!==n&&curSet.has(h)});
  PB.best={out:PB.cur.filter(n=>!pick.has(n)),swapIn:inn.filter(n=>!joins.includes(n)),joins,opt:[...PB.opt],skipped:(c.options||[]).filter(n=>!PB.opt.has(n))};
  pbSave();render();
}
function pbBestNote(){const b=PB&&PB.best;if(!b)return "";const L=x=>esc(x.join(", "));
  return `<div class="note best-note"><b>Best proposal: same ${eur(PB.fixedM)} a month, ${PB.keep.size+PB.add.size} articles.</b>
    <ul>${b.joins.length?`<li><b>Joins its country:</b> ${L(b.joins)}. Free now, and they go with countries ${esc(PB.p)} already has.</li>`:""}
    ${b.swapIn.length?`<li><b>Swapped in:</b> ${L(b.swapIn)}. Each sold at least 1.5 times what it replaces.</li>`:""}
    ${b.out.length?`<li><b>Out:</b> ${L(b.out)}. Their weakest, mostly no sales in 12 months.</li>`:"<li>Nothing else is strong enough to swap, so the rest stays as it is.</li>"}
    ${b.opt.length?`<li><b>Optional extras ticked:</b> ${L(b.opt)}. ${esc(PB.p)} comes out ahead on each.</li>`:""}
    ${b.skipped.length?`<li><b>Left out:</b> ${L(b.skipped)}. They would lose money there.</li>`:""}</ul>
    <span class="muted">Why this is the easiest yes: the price doesn't move, few articles change, and only clearly weak ones go. With the price held, every extra sale adds to their profit and our commission at the same time. New articles count at 80% of what the slot sold, because ${esc(PB.p)} hasn't sold there yet. We never give away more list value than we take back.</span></div>`}
function pbPanel(){
  const cps=Object.keys(S.contracts||{});if(!cps.length)return '<p class="muted">No partner has a monthly contract.</p>';
  if(!PB||!S.contracts[PB.p])PB=pbInit(cps[0]);
  const p=PB.p,c=S.contracts[p],ends=D(c.contractEnd),win=new Date(ends);win.setDate(win.getDate()+31);
  const lp=a=>priceOf(a,1);
  const curA=PB.cur.map(n=>ARTS.find(a=>a.name===n)).filter(Boolean);
  // candidates: 1st slot free by a month after the contract ends, not already theirs
  const cand=pbCand();
  const S1=a=>{const z=a.sales||{};return {n:+z.s1||0,v:+z.v1||0,c:+z.c1||0}};
  const inSet=curA.filter(a=>PB.keep.has(a.name)).concat(cand.filter(x=>PB.add.has(x.a.name)).map(x=>x.a));
  const listT=inSet.reduce((t,a)=>t+lp(a),0);
  if(PB.fixed&&listT)PB.disc=1-PB.fixedM*12/listT;
  const M=PB.fixed?PB.fixedM:Math.round(listT*(1-PB.disc)/12),Y=M*12;PB.monthly=M;const share=listT?Y/listT:0;
  const est=a=>PB.cur.includes(a.name)?brandSales(a,p):S1(a); // kept: their own sales; new: what 1st position sold there
  const row=a=>{const e=est(a),fee=lp(a)*share;return {a,e,fee,net:e.v-fee-e.c,we:fee+e.c}};
  const R=inSet.map(row);const tot=R.reduce((t,r)=>({v:t.v+r.e.v,c:t.c+r.e.c,n:t.n+r.e.n,net:t.net+r.net}),{v:0,c:0,n:0,net:0});
  const optA=(c.options||[]).map(n=>ARTS.find(a=>a.name===n)).filter(Boolean);
  const OX=optA.filter(a=>PB.opt.has(a.name)).reduce((t,a)=>{const e=S1(a),y=(+PB.optPrice[a.name]||0)*12;return {y:t.y+y,m:t.m+(+PB.optPrice[a.name]||0),v:t.v+e.v,c:t.c+e.c,n:t.n+e.n,k:t.k+1}},{y:0,m:0,v:0,c:0,n:0,k:0});
  tot.v+=OX.v;tot.c+=OX.c;tot.n+=OX.n;tot.net+=OX.v-OX.y-OX.c;
  const curY=c.current?c.current.monthly*12:0,curList=curA.reduce((t,a)=>t+lp(a),0);
  const curEst=curA.reduce((t,a)=>{const b=brandSales(a,p);return {v:t.v+b.v,c:t.c+b.c}},{v:0,c:0});
  const dropped=curA.filter(a=>!PB.keep.has(a.name)),added=cand.filter(x=>PB.add.has(x.a.name));
  const pc=x=>Math.round(x*100);
  const q=PB.q.trim().toLowerCase();
  const curRows=curA.map(a=>{const keep=PB.keep.has(a.name);const e=brandSales(a,p),fee=keep?lp(a)*share:lp(a)*(curY&&curList?curY/curList:0);return {a,keep,e,fee,net:e.v-fee-e.c}})
    .filter(r=>!q||r.a.name.toLowerCase().includes(q)).sort((x,y)=>x.net-y.net);
  const candRows=cand.map(x=>({...x,e:S1(x.a)})).filter(r=>!q||r.a.name.toLowerCase().includes(q)).sort((x,y)=>y.e.v-x.e.v);
  const stat=(l,v,sub,cls)=>`<div><span class="eyebrow">${l}</span><b class="mono ${cls||""}">${v}</b>${sub?`<span class="muted">${sub}</span>`:""}</div>`;
  return `<p class="note">Model ${esc(p)}'s renewal: keep or drop their current ${PB.cur.length} articles, add others whose 1st position is free by ${fmtD(win)}, and set the monthly price. For articles they already have, sales are their own last 12 months. For new ones, it is what the 1st position there sold last 12 months, whoever held it. ${PB.fixed?"Fixed pricing keeps the monthly price the same whatever you swap, so the aim is to swap weak articles for stronger free ones.":"The price is the list value of the chosen articles less the discount, so dropping an article takes its share off the price; type a monthly price instead and the discount adjusts."} Saved automatically, only admins see it, nothing changes on their page.</p>
    <div class="pb-top">
      <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:flex-end"><label class="fl" style="max-width:210px">Pricing<select id="pb-mode"><option value="fixed" ${PB.fixed?"selected":""}>Fixed monthly price, swap articles</option><option value="disc" ${PB.fixed?"":"selected"}>Discount off list</option></select></label>
      ${PB.fixed?"":`<label class="fl" style="max-width:150px">Discount off list (%)<input type="number" id="pb-d" min="0" max="90" step="1" value="${Math.round(PB.disc*100)}"></label>`}
      <label class="fl" style="max-width:150px">Monthly price (€)<input type="number" id="pb-m" min="0" value="${M}"></label>${PB.fixed?`<span class="muted" style="font-size:.84rem;padding-bottom:8px">${listT?Math.round(PB.disc*100)+"% below list":""}</span>`:""}</div>
      <div class="acts"><button class="btn small primary" id="pb-best" title="Same price, the strongest sellers in, and the optional extras that pay for them">Build the best proposal</button>${PB.fixed?"":`<button class="btn small" id="pb-dropneg">Drop all where their net is negative</button>`}<button class="btn small ghost" id="pb-reset">Reset to current</button><button class="btn small ghost" id="pb-copy">Copy summary</button><label class="chk" style="font-size:.86rem" title="When on, other partners can't make takeover offers on ${esc(p)}'s slots"><input type="checkbox" id="pb-nobid" ${c.noBids?"checked":""}> Keep ${esc(p)}'s articles closed to offers</label><button class="btn small primary" id="pb-share">${c.edit&&c.edit.on?"Update what "+esc(p)+" sees":"Share with "+esc(p)+" to adjust"}</button>${c.edit&&c.edit.on?`<button class="btn small ghost" id="pb-unshare">Stop sharing</button>`:""}</div>
    </div>
    ${c.edit&&c.edit.on?`<p class="note" style="color:var(--accent)"><b>Shared with ${esc(p)}${c.edit.shared_at?" on "+fmtD(new Date(c.edit.shared_at)):""}.</b> Their page shows ${c.edit.keep.length+c.edit.add.length} articles at ${Math.round((c.edit.disc||0)*100)}% off list (€${c.base} a month). They can remove articles, add free ones and send it back; it lands in the offers inbox and by email.</p>`:""}
    ${pbBestNote()}
    <div class="kgrid">
      ${stat("Articles",inSet.length+OX.k,`${PB.keep.size} kept · ${dropped.length} dropped · ${added.length} added${OX.k?" · "+OX.k+" optional":""}`)}
      ${stat("Price",eur(Y+OX.y)+" a year",`${eur(M+OX.m)} a month${OX.k?" ("+eur(M)+" core + "+eur(OX.m)+" optional)":""} · ${inSet.length?eur(Y/inSet.length):"€0"} per core article${curY?" · "+((Y+OX.y)>=curY?"+":"")+pc((Y+OX.y)/curY-1)+"% on now":""}`)}
      ${stat("List value",eur(listT),listT?`price is ${Y<listT?pc(1-Y/listT)+"% below":pc(Y/listT-1)+"% above"} list`:"")}
      ${stat("Their sales, 12 months",eur(tot.v),`${tot.n} sales · ${Y?(tot.v/(Y+OX.y)).toFixed(1)+"× the price":""}${curY?" · now "+eur(curEst.v):""}`)}
      ${stat("We earn",eur(Y+OX.y+tot.c),`price ${eur(Y+OX.y)} + commission ${eur(tot.c)}${curY?" · now "+eur(curY+curEst.c):""}`)}
      ${stat("Their net",(tot.net<0?"-":"+")+eur(Math.abs(tot.net)),"sales minus price and commission, before their data costs",tot.net<0?"neg":"pos")}
    </div>
    ${optA.length?`<h3 style="margin:14px 0 6px">Optional extras <span class="muted" style="font-weight:500">· monthly add-ons on top of the core price; tick to include in this scenario</span></h3>
    <div class="scroll"><table class="tbl"><thead><tr><th></th><th>Article</th><th class="num">Price a month</th><th class="num">A year</th><th class="num">1st pos. sales</th><th class="num">Our comm.</th><th class="num">Clicks</th><th class="num">Their net</th></tr></thead><tbody>
    ${optA.map(a=>{const e=S1(a),m=+PB.optPrice[a.name]||0,on=PB.opt.has(a.name),net=e.v-m*12-e.c;return `<tr class="${on?"pb-on":""}"><td><input type="checkbox" data-pbo="${esc(a.name)}" ${on?"checked":""} aria-label="Include ${esc(a.name)}"></td><td>${esc(a.name)} 1st</td><td class="num"><span class="mono">€</span><input type="number" min="0" data-pbop="${esc(a.name)}" value="${m}" style="width:70px;padding:3px 6px;border:1px solid var(--line);border-radius:6px;background:var(--surface);font:inherit"></td><td class="num mono">${eur(m*12)}</td><td class="num mono">${e.v?eur(e.v):'<span class="muted">€0</span>'} <span class="muted" style="font-size:.74rem">${e.n}</span></td><td class="num mono muted">${eur(e.c)}</td><td class="num mono muted">${a.clicks||0}</td><td class="num mono">${eurS(net)}</td></tr>`}).join("")}
    </tbody></table></div>
    <p class="note">Prices here are what ${esc(p)} sees for each optional country when you share. 1st pos. sales is what the 1st position on that article sold in the last 12 months, whoever held it.</p>`:""}
    <div class="filters" style="margin:10px 0"><input type="search" id="pb-q" placeholder="Search an article" value="${esc(PB.q)}" aria-label="Search the builder"></div>
    <div class="pb-cols">
      <div><h3 style="margin:4px 0 6px">Their current articles <span class="muted" style="font-weight:500">· worst for them first</span></h3>
        <div class="scroll ren-list"><table class="tbl"><thead><tr><th></th><th>Article</th><th class="num">List</th><th class="num">Their sales</th><th class="num">Our comm.</th><th class="num">Fee share</th><th class="num">Their net</th></tr></thead><tbody>
        ${curRows.map(r=>`<tr class="${r.keep?"":"pb-off"}"><td><input type="checkbox" data-pbk="${esc(r.a.name)}" ${r.keep?"checked":""} aria-label="Keep ${esc(r.a.name)}"></td><td>${esc(r.a.name)}</td><td class="num mono">${eur(lp(r.a))}</td><td class="num mono">${r.e.v?eur(r.e.v):'<span class="muted">€0</span>'} <span class="muted" style="font-size:.74rem">${r.e.n}</span></td><td class="num mono muted">${eur(r.e.c)}</td><td class="num mono">${eur(r.fee)}</td><td class="num mono">${eurS(r.net)}</td></tr>`).join("")}
        </tbody></table></div></div>
      <div><h3 style="margin:4px 0 6px">Could add <span class="muted" style="font-weight:500">· 1st position free by ${fmtD(win)}, best sellers first</span></h3>
        <div class="scroll ren-list"><table class="tbl"><thead><tr><th></th><th>Article</th><th class="num">List</th><th class="num">1st pos. sales</th><th class="num">Clicks</th><th>Free</th></tr></thead><tbody>
        ${candRows.map(r=>`<tr class="${PB.add.has(r.a.name)?"pb-on":""}"><td><input type="checkbox" data-pba="${esc(r.a.name)}" ${PB.add.has(r.a.name)?"checked":""} aria-label="Add ${esc(r.a.name)}"></td><td>${esc(r.a.name)}${r.holder?` <span class="muted" style="font-size:.74rem">${esc(r.holder)}</span>`:""}</td><td class="num mono">${eur(lp(r.a))}</td><td class="num mono">${r.e.v?eur(r.e.v):'<span class="muted">€0</span>'} <span class="muted" style="font-size:.74rem">${r.e.n}</span></td><td class="num mono muted">${r.a.clicks||0}</td><td class="muted" style="white-space:nowrap">${r.free<=TODAY?"now":fmtD(r.free)}</td></tr>`).join("")||'<tr><td colspan="6" class="muted">Nothing free in that window.</td></tr>'}
        </tbody></table></div></div>
    </div>
    ${dropped.length||added.length?`<p class="note"><b>Dropping:</b> ${dropped.map(a=>esc(a.name)).join(", ")||"none"}. <b>Adding:</b> ${added.map(x=>esc(x.a.name)).join(", ")||"none"}.</p>`:""}`;
}
function teamPanels(){
  let paid=0,inRen=0,res=0,open=0,total=0;
  ARTS.forEach(a=>a.slots.forEach(s=>{total++;const st=status(a,s,null);
    if(st.k==="taken")paid++;else if(st.due)inRen++;else if(st.k==="reserved")res++;else if(st.k==="available")open++;}));
  const pct=n=>total?Math.round(n/total*100):0;
  const byP={};
  ARTS.forEach(a=>a.slots.forEach(s=>{const st=status(a,s,null);
    if(s.prov&&st.exp&&(st.due||st.near)){(byP[s.prov]=byP[s.prov]||[]).push({a,s,st})}}));
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
  const oCard=([o,i])=>{const inv=o.kind==="bid"?bidPanel(o):invoice(o);const id="of-"+(o.id||i);return `<details class="qi" id="${id}" ${openD.has(id)?"open":""}><summary class="h" style="cursor:pointer"><span><b>${esc(o.from)}</b>${o.preview?'<span class="ex">Preview</span>':""}${o.kind==="proposal"?'<span class="ex">2027 proposal</span>':""}${o.kind==="bid"?'<span class="ex">Takeover offer</span>':""}<br><span class="muted" style="font-size:.84rem">${o.kind==="bid"?esc(String(o.items[0]||"").replace(" · "," ")):o.items.length+(o.items.length===1?" item":" items")} · ${o.kind==="proposal"?"accepted at":"offer"} <b class="mono">${eur(o.offer)}</b>${o.kind==="proposal"?" a year":` against ${o.kind==="bid"?"list ":""}<span class="mono">${eur(o._pkg)}</span>`}</span></span><span class="pill ${o.sent?(o.action==="decline"?"due":"ok"):"soon"}">${esc(o.sent?({accept:"Accepted",counter:"Countered",decline:"Declined"}[o.action]||"Answered"):(o.action?"Draft ready":"New"))}</span></summary>
      <div class="note">${esc(o.email||"No email saved")} · ${esc(o.when)}</div>
      ${frItems(o).length?`<div class="note" style="background:var(--internal-soft);color:var(--internal);border-radius:10px;padding:8px 12px;margin:8px 0"><b>${esc(S.firstRefusal.holder||"Ubigi")} has first refusal</b> on ${esc(frItems(o).join(", "))} 1st. Give them the chance first.</div>`:""}
      ${inv}
      ${cleanNote(o.note)?`<div class="note"><b>Their note:</b> “${esc(cleanNote(o.note))}”</div>`:""}
      ${actionBlock(o,i)}</details>`};
  const inbox=`<section class="panel internal"><div class="phead"><h2>Offers inbox<span class="tag-internal">Admin only</span></h2><span class="muted">${openO.length} open</span></div>
    <div class="queue">${openO.map(oCard).join("")||'<p class="muted" style="font-size:.9rem">No open offers. New ones appear here as soon as a provider sends one.</p>'}</div>
    ${doneO.length?`<details id="d-done" ${openD.has("d-done")?"open":""}><summary style="cursor:pointer;font-weight:600">Answered · ${doneO.length}</summary><div class="queue" style="margin-top:8px">${doneO.map(oCard).join("")}</div></details>`:""}</section>`;
  const firstEnd=p=>byP[p].reduce((m,x)=>x.st.exp<m?x.st.exp:m,byP[p][0].st.exp);
  const provsU=provs.slice().sort((x,y)=>firstEnd(x)-firstEnd(y));
  const ren=`<section class="panel internal"><div class="phead"><h2>Renewals due<span class="tag-internal">Admin only</span></h2><span class="muted roi-ctl">Suggest prices for a <input type="number" id="roi" min="0.5" max="5" step="0.1" value="${ROI()}" aria-label="Target return"> × return on their sales · soonest first</span></div>
    <div class="queue">${provsU.map(p=>{const L=byP[p];
      const total=L.reduce((t,x)=>t+priceOf(x.a,x.s.pos),0);
      const c=S.contracts[p];const groups={};L.forEach(x=>{const k=x.s.exp;(groups[k]=groups[k]||[]).push(x)});
      const rem=REMS[p];const em=emailsOf(p);const id="rn-"+slug(p);
      const fe=firstEnd(p),past=fe<TODAY;
      const nowY=c&&c.current?c.current.monthly*12:0,payY=c&&c.current?(+c.current.paid12||nowY):0,share=payY&&total?payY/total:0,propY=c?c.base*12:0;
      const SS=L.reduce((t,x)=>{const b=brandSales(x.a,p);t.n+=b.n;t.v+=b.v;t.c+=b.c;return t},{n:0,v:0,c:0});
      const pc=x=>Math.round(x*100);
      const pays=c&&c.current?eur(c.current.monthly)+" a month":"";
      const lastPay=(ar,pos)=>{const L2=PAYMENTS.filter(y=>y.p===p&&y.a===ar.name);const same=L2.filter(y=>y.pos===pos),pool=same.length?same:L2.filter(y=>y.pos==null);return pool.length?pool[pool.length-1]:null};
      const roi=ROI(),floorP=pos=>{const t=S.tiers[S.tiers.length-1]||{p1:0,p2:0};return +(pos===1?t.p1:t.p2)||0};
      const R=L.map(x=>{const lp=priceOf(x.a,x.s.pos),bs=brandSales(x.a,p),lpay=lastPay(x.a,x.s.pos);const fee=payY?lp*share:(lpay?+lpay.paid:null);
        const sug=Math.min(lp,Math.max(floorP(x.s.pos),Math.round((bs.v-bs.c)/roi/10)*10));return {x,lp,bs,lpay,fee,sug}});
      const SG=R.reduce((t,r)=>({s:t.s+r.sug,v:t.v+r.bs.v,c:t.c+r.bs.c,atL:t.atL+(r.sug>=r.lp?1:0),atF:t.atF+(r.sug<=floorP(r.x.s.pos)?1:0)}),{s:0,v:0,c:0,atL:0,atF:0});
      const anyFee=R.some(r=>r.fee!=null),anyPaid=R.some(r=>r.lpay);
      const T={lp:0,paid:0,paidN:0,fee:0,feeN:0};R.forEach(r=>{T.lp+=r.lp;if(r.lpay){T.paid+=+r.lpay.paid;T.paidN++}if(r.fee!=null){T.fee+=r.fee;T.feeN++}});
      const feeK=R.filter(r=>r.fee!=null),feeBs=feeK.reduce((t,r)=>({v:t.v+r.bs.v,c:t.c+r.bs.c}),{v:0,c:0});
      const cols=10;
      const mo=d=>{const t=new Date(d+"T00:00:00");return MON[t.getMonth()]+" "+t.getFullYear()};
      const netOf=r=>r.fee==null?null:r.bs.v-r.fee-r.bs.c;
      const maxAbs=Math.max(1,...R.map(r=>Math.abs(netOf(r)||0)));
      const bar=n=>{if(n==null)return '<span class="muted">?</span>';const w=Math.round(Math.abs(n)/maxAbs*50);
        return `<div class="nbar"><span class="nb-track"><i class="${n<0?"neg":"pos"}" style="${n<0?`right:50%;width:${w}%`:`left:50%;width:${w}%`}"></i></span><b class="mono ${n<0?"neg":"pos"}">${n<0?"-":"+"}${eur(Math.abs(n))}</b></div>`};
      const rows=Object.keys(groups).sort().map(k=>{const G=R.filter(r=>r.x.s.exp===k).sort((u,w)=>{const a1=netOf(u),b1=netOf(w);return (b1==null?-1e9:b1)-(a1==null?-1e9:a1)}),e=D(k),pe=e<TODAY;const hold=new Date(e);hold.setDate(hold.getDate()+60);
        return `<tr class="rg-h"><td colspan="${cols}"><span class="pill ${pe?"due":"soon"}">${pe?"Ended "+fmtD(e):"Ends "+fmtD(e)}</span> <span class="muted">${G.length} ${G.length===1?"slot":"slots"}${pe?" · held for them until "+fmtD(hold):""} · best for them first</span></td></tr>`
          +G.map(r=>{const {x,lp,bs,lpay,fee}=r;const lpc=lpay?Math.round((lp/lpay.paid-1)*100):null;const n=netOf(r);
            const paidCell=payY?`${eur(fee)}`:(lpay?`${eur(lpay.paid)} <span class="muted" style="font-size:.72rem">${mo(lpay.on)}</span>`:`<span class="muted">${c?"in fee":"none"}</span>`);
            const tip=lpay?esc("Invoice "+lpay.inv+", "+fmtD(new Date(lpay.on+"T00:00:00"))+(lpay.list?", list rate €"+lpay.list:"")+(lpay.note?" · "+lpay.note:"")):"";
            return `<tr class="${n==null?"":n<0?"r-neg":"r-pos"}"><td><b style="font-weight:600">${esc(x.a.name)}</b> <span class="muted" style="font-size:.78rem">${x.s.pos===1?"1st":"2nd"} · ${esc(grp(x.a).name)}</span></td>
              <td class="num mono">${eur(lp)}${lpc?` <span style="font-size:.72rem;color:${lpc>0?"var(--accent)":"var(--coral)"}">${lpc>0?"+":""}${lpc}%</span>`:""}</td>
              <td class="num mono" title="${tip}">${paidCell}</td>
              <td class="num mono sugc" title="Their sales less our commission, divided by ${roi}, between the lowest group price and today's list">${eur(r.sug)}</td>
              <td class="num mono split">${bs.v?eur(bs.v):'<span class="muted">€0</span>'} <span class="muted" style="font-size:.72rem">${bs.n} ${bs.n===1?"sale":"sales"}</span></td>
              <td class="num mono muted">${fee!=null?"-"+eur(fee):"?"}</td>
              <td class="num mono muted">-${eur(bs.c)}</td>
              <td class="netc">${bar(n)}</td></tr>`}).join("")}).join("");
      const RN=R.filter(r=>netOf(r)!=null),posN=RN.filter(r=>netOf(r)>=0).length,netT=RN.reduce((t,r)=>t+netOf(r),0),feeT=RN.reduce((t,r)=>t+r.fee,0),commT=RN.reduce((t,r)=>t+r.bs.c,0),valT=RN.reduce((t,r)=>t+r.bs.v,0);
      const feeLbl=payY?"their fee share":"what they paid last time";
      const open=drafts[p]!=null||openD.has(id);
      return `<details class="qi ren" id="${id}" ${open?"open":""}><summary><span><b>${esc(p)}</b> <span class="muted">· ${L.length} ${L.length===1?"slot":"slots"}</span></span>
        <span class="rsum"><span class="pill ${past?"due":"soon"}">${past?"Ended "+fmtD(fe):"First ends "+fmtD(fe)}</span>${pays?`<span class="muted">Pays ${pays}</span>`:""}<span class="muted">List ${eur(total)} a year</span><span class="muted">Made them <b style="color:var(--ink)">${eur(SS.v)}</b> in 12 months</span>${c&&c.pricing==="fixed"?`<span class="pill fr" title="Renewal plan: same monthly price, swap articles">Hold €${c.current?c.current.monthly:c.base}/mo</span>`:`<span class="pill fr" title="Suggested renewal at a ${roi}× target">Suggest ${eur(SG.s)}</span>`}${RN.length?`<span class="pill ${netT<0?"due":"ok"}" title="What they made or lost after ${payY?"their fee":"what they paid"} and our commission">${netT<0?"Lost":"Up"} ${eur(Math.abs(netT))} · ${posN} of ${RN.length} in profit</span>`:""}${rem&&rem.sent_at?`<span class="pill ok">Reminder sent ${fmtD(new Date(rem.sent_at))}</span>`:(drafts[p]!=null?`<span class="pill soon">Draft open</span>`:"")}</span></summary>
      <div class="kgrid">
        <div><span class="eyebrow">List price</span><b class="mono">${eur(total)}</b><span class="muted">a year · ${L.length} ${L.length===1?"slot":"slots"} · ${eur(total/L.length)} each on average</span></div>
        <div><span class="eyebrow">${payY?"Paid us":"Paid last time"}</span>${payY?`<b class="mono">${eur(payY)}</b><span class="muted">in the last 12 months${c.current.history?" ("+esc(c.current.history)+")":""} · ${eur(payY/L.length)} per article · ${eur(c.current.monthly)} a month now</span><span class="pill ${share<1?"due":"ok"}" style="justify-self:start">${share<1?pc(1-share)+"% below list":pc(share-1)+"% above list"}</span>`:(anyPaid?`<b class="mono">${eur(T.paid)}</b><span class="muted">a year, from their last invoices${T.paidN<L.length?" ("+T.paidN+" of "+L.length+" slots found)":""}</span><span class="pill ${T.paid<T.lp?"due":"ok"}" style="justify-self:start">${T.paid<(R.filter(r=>r.lpay).reduce((t,r)=>t+r.lp,0))?pc(1-T.paid/R.filter(r=>r.lpay).reduce((t,r)=>t+r.lp,0))+"% below today's list":"at or above today's list"}</span>`:`<span class="muted">No invoices found for these slots</span>`)}</div>
        ${c?`<div><span class="eyebrow">Our 2027 proposal</span><b class="mono">${eur(propY)}</b><span class="muted">${eur(c.base)} a month core · ${eur(propY/L.length)} per article${nowY?" · "+(propY>=nowY?"+":"")+pc(propY/nowY-1)+"% on the €"+c.current.monthly+" a month now":""}</span><span class="pill ${propY<total?"due":"ok"}" style="justify-self:start">${propY<total?pc(1-propY/total)+"% below list":"at or above list"}</span></div>`:""}
        <div><span class="eyebrow">Their sales on these, 12 months</span><b class="mono">${eur(SS.v)}</b><span class="muted">${SS.n} sales · our commission ${eur(SS.c)}</span>${payY?`<span class="muted">${(SS.v/payY).toFixed(1)}× what they pay us</span>`:""}</div>
        ${RN.length?`<div class="${netT<0?"kneg":"kpos"}"><span class="eyebrow">Their result</span><b class="mono ${netT<0?"neg":"pos"}">${netT<0?"-":"+"}${eur(Math.abs(netT))}</b><span class="muted">${posN} of ${RN.length} articles made them money after ${payY?"their fee":"what they paid"} and our commission</span><span class="muted">We earned ${eur(feeT+commT)} (${eur(feeT)} ${payY?"fee":"paid"} + ${eur(commT)} commission)</span></div>`:""}
        ${c&&c.pricing==="fixed"?(()=>{const weak=R.filter(r=>netOf(r)!=null).sort((u,w)=>netOf(u)-netOf(w)).slice(0,5);
          const win=new Date(D(c.contractEnd));win.setDate(win.getDate()+31);
          const held=new Set(ARTS.filter(a=>a.slots[0].prov===p&&holdsNow(a.slots[0])).map(a=>a.name));
          const free=ARTS.filter(a=>!held.has(a.name)&&!(c.options||[]).includes(a.name)).filter(a=>{const s=a.slots[0];if(!s.prov||!s.exp)return true;const e=D(s.exp);if(days(e,TODAY)<-60)return true;const nx=new Date(e);nx.setDate(nx.getDate()+1);return nx<=win}).map(a=>({a,v:+((a.sales||{}).v1)||0})).sort((x,y)=>y.v-x.v).slice(0,5);
          return `<div class="ksug"><span class="eyebrow">Renewal plan</span><b class="mono">Hold €${c.current?c.current.monthly:c.base} a month</b><span class="muted">Same price, swap the weakest articles for stronger free ones, optional extras on top.</span>
          <span class="muted"><strong style="color:var(--ink);font-size:inherit">Weakest for them:</strong> ${weak.map(r=>esc(r.x.a.name)+" "+eurS(netOf(r))).join(", ")}</span>
          <span class="muted"><strong style="color:var(--ink);font-size:inherit">Best free to swap in:</strong> ${free.map(x=>esc(x.a.name)+" ("+eur(x.v)+")").join(", ")}</span>
          <span class="muted">Model it in the Proposal builder, then share it so ${esc(p)} can swap too.</span></div>`})():`<div class="ksug"><span class="eyebrow">Suggested renewal</span><b class="mono">${eur(SG.s)} a year</b>${payY?`<span class="muted">${eur(SG.s/12)} a month</span>`:""}
          <span class="muted">${(nowY||T.paid)?`${SG.s>=(nowY||T.paid)?"+":""}${pc(SG.s/(nowY||T.paid)-1)}% on what they ${nowY?"pay now (€"+eur(nowY).slice(1)+" a year)":"paid last time"} · `:""}${pc(SG.s/total)}% of list</span>
          <span class="muted">At this price they'd make ${(SG.v-SG.s-SG.c)<0?"-":"+"}${eur(Math.abs(SG.v-SG.s-SG.c))} and we'd earn ${eur(SG.s+SG.c)}, on last year's sales</span>
          <span class="muted">${SG.atL} at list · ${SG.atF} at the lowest price · rest priced on their sales</span></div>`}
      </div>
      <div class="scroll ren-list"><table class="tbl rtbl${c&&c.pricing==="fixed"?" nosug":""}"><thead>
        <tr class="grp"><th colspan="${c&&c.pricing==="fixed"?3:4}">Price</th><th colspan="4" class="split">Their last 12 months on this article</th></tr>
        <tr><th>Article</th><th class="num" title="List price now, and how it compares with what they paid">List now</th><th class="num">${payY?"Fee share*":"Paid last time"}</th><th class="num sugc">Suggested</th><th class="num split">Their sales</th><th class="num">Less paid</th><th class="num">Less our commission</th><th class="netc">= What they made or lost</th></tr></thead><tbody>${rows}</tbody>
        <tfoot><tr><td><b>Total</b></td><td class="num mono"><b>${eur(total)}</b></td><td class="num mono"><b>${payY?eur(payY):eur(T.paid)}</b>${!payY&&T.paidN<L.length?` <span class="muted" style="font-size:.72rem">${T.paidN} of ${L.length}</span>`:""}</td><td class="num mono sugc"><b>${eur(SG.s)}</b></td><td class="num mono split"><b>${eur(SS.v)}</b></td><td class="num mono muted"><b>-${eur(feeT)}</b></td><td class="num mono muted"><b>-${eur(commT)}</b></td><td class="netc">${RN.length?`<b class="mono ${netT<0?"neg":"pos"}">${netT<0?"-":"+"}${eur(Math.abs(netT))}</b>`:""}</td></tr></tfoot></table></div>
      <p class="note">Suggested: for each article, their sales there less our commission, divided by a target of ${roi}× (so they make about €${roi} in sales for every €1 they pay us), kept between the lowest group price and today's list. Change the target at the top of Renewals. What they made or lost = what customers paid ${esc(p)} on that article in the last 12 months, less ${payY?"their fee share":"what they paid us for the slot"} and our commission. It is before their own cost of the data, so their real margin is lower. ${anyPaid&&!payY?"Paid last time is the per-slot amount on their latest invoice after any bundle discount (hover for the invoice); the % by the list price compares today's list with it. ":""}${payY?"*Fee share: their yearly fee split across these articles in proportion to list price ("+pc(1-share)+"% below list). ":""}Sales count every sale of ${esc(p)} on that article in any position.</p>
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
  return `<p class="note" style="margin-top:-8px">Two things need us: offers and renewals. Everything else is folded away below.</p>`+inbox+ren+fold("d-pb","Proposal builder",pbPanel())+fold("d-act",activityTitle(),activityPanel())+fold("d-how","How this works",how)+fold("d-num","Inventory and capacity",kpi+cap)+fold("d-pr","Prices and rules",prices)+fold("d-acc","Who has access",acc);
}


function peEditor(c,v){
  const P=peInit(c),disc=+c.edit.disc||0,ends=D(c.contractEnd),win=new Date(ends);win.setDate(win.getDate()+31);
  const all=[...P.keep,...P.add];const k0=c.edit.keep||[];
  const a0=c.edit.add||[],removed=k0.filter(n=>!P.keep.has(n)).concat(a0.filter(n=>!P.add.has(n)));
  const cand=ARTS.filter(a=>!all.includes(a.name)&&!k0.includes(a.name)&&!a0.includes(a.name)&&!(c.options||[]).includes(a.name)).map(a=>{const s=a.slots[0],st=status(a,s,v);
    if(st.k==="mine")return null;let free=null;if(st.k==="available")free=TODAY;else if(st.exp){const nx=new Date(st.exp);nx.setDate(nx.getDate()+1);if(nx<=win)free=nx}
    return free?{a,free}:null}).filter(Boolean).filter(x=>!peQ||x.a.name.toLowerCase().includes(peQ.toLowerCase())).sort((x,y)=>x.a.name.localeCompare(y.a.name));
  const lock=propAccepted||propConfirm;
  const chip=(n,isNew)=>`<span class="pchip${isNew?" new":""}">${esc(n)}${isNew?' <i>new</i>':""}${peFixed(c)?"":` <span class="muted mono">${eur(priceOf(ARTS.find(x=>x.name===n)||{slots:[]},1))}</span>`}${lock?"":`<button class="x" data-perm="${esc(n)}" aria-label="Remove ${esc(n)}">×</button>`}</span>`;
  const fx=peFixed(c),max=+c.edit.max||all.length,full=fx&&all.length>=max;
  return `<div class="ci" style="display:block"><div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap"><b>Your 2027 articles · ${all.length}${fx?" of "+max:""}</b><span class="muted">${fx?"":`List value ${eur(peList(c))} a year, ${Math.round(disc*100)}% off · `}<b class="mono" style="color:var(--ink)">€${peMonthly(c)} a month</b></span></div>
    <p class="note" style="margin:4px 0 8px">${fx?`€${c.base} a month for up to ${max} articles, each with exclusive 1st position. Swap any article for one that's free: remove one, then add its replacement. The price stays the same.`:`Exclusive 1st position on each. Remove any you don't want and add others that are free; the monthly price follows at the same ${Math.round(disc*100)}% off list.`}</p>
    <div class="pchips">${[...P.keep].sort().map(n=>chip(n,false)).join("")}${[...P.add].sort().map(n=>chip(n,!k0.includes(n))).join("")}</div>
    ${removed.length?`<p class="note" style="margin-top:8px">Removed: ${removed.map(n=>`<button class="lnk" data-peres="${esc(n)}" ${lock?"disabled":""}>${esc(n)} ↺</button>`).join(" ")}</p>`:""}
    ${full&&!lock?`<p class="note" style="margin-top:8px">You have all ${max} articles. Remove one to swap in another.</p>`:""}
    ${lock||full?"":`<details class="ci" data-sec="proposal add articles" style="display:block;margin-top:8px" ${peQ?"open":""}><summary style="cursor:pointer;font-size:.88rem"><b>Add articles</b> <span class="muted">· 1st position free by ${fmtD(win)}</span></summary>
      <input type="search" id="pe-q" placeholder="Search a country or city" value="${esc(peQ)}" style="margin:8px 0;width:100%;background:var(--bg);border:1px solid var(--line);border-radius:8px;padding:7px 10px" aria-label="Search articles to add">
      <div class="pe-add">${cand.map(x=>`<button class="pe-a" data-peadd="${esc(x.a.name)}"><span>${esc(x.a.name)}</span><span class="muted mono">${fx?"":eur(priceOf(x.a,1))}${x.free>TODAY?(fx?"":" · ")+"from "+fmtM(x.free):""}</span><b>+</b></button>`).join("")||'<p class="muted" style="font-size:.88rem">Nothing matches.</p>'}</div></details>`}
    ${peChanged(c)&&!lock?`<p class="note" style="margin-top:6px"><button class="lnk" id="pe-reset">Back to our proposal</button></p>`:""}</div>`;
}

// A takeover offer on a country covers its cities: free ones now, the rest when their current placement ends
function bidFamily(name,p){const pos=p==="1st"?1:2,a=ARTS.find(x=>x.name===name);let lp=a?priceOf(a,pos):0;const now=[],later=[];
  if(famHead(name)===name)(FAMS()[name]||[]).forEach(n=>{const m=ARTS.find(x=>x.name===n);if(!m)return;const s=m.slots[pos-1];
    if(s.prov&&s.exp&&days(D(s.exp),TODAY)>=0&&s.prov!==(a.slots[pos-1]||{}).prov){const nx=D(s.exp);nx.setDate(nx.getDate()+1);later.push(n+" from "+fmtM(nx))}
    else if(s.prov&&s.exp&&days(D(s.exp),TODAY)>=0&&days(D(s.exp),D(a.slots[pos-1].exp))>31){const nx=D(s.exp);nx.setDate(nx.getDate()+1);later.push(n+" from "+fmtM(nx))}
    else{now.push(n);lp+=priceOf(m,pos)}});
  return {lp,now,later}}
function bidBox(){
  if(!BIDBOX)return "";const [name,p]=BIDBOX.k.split(" · ");const a=ARTS.find(x=>x.name===name);const s=a&&a.slots[p==="1st"?0:1];const st=a?status(a,s,viewer()):{};
  const bf=bidFamily(name,p),lp=bf.lp;
  return `<div class="modal" role="dialog" aria-modal="true" aria-labelledby="bid-t"><div class="modal-in">
    <h2 id="bid-t">Make an offer for ${esc(BIDBOX.k)}</h2>
    <p class="muted" style="font-size:.92rem">This placement is held by another partner ${st.due?"and is being held for them to renew":"until "+(st.exp?fmtD(st.exp):"soon")}. They can renew first. If they don't, we'll look at offers and come back to you within 2 working days.</p>
    ${bf.now.length||bf.later.length?`<p class="note">${esc(name)} and its cities go together.${bf.now.length?" Includes "+esc(bf.now.join(", "))+".":""}${bf.later.length?" "+esc(bf.later.join(", "))+" join when their current placement ends.":""}</p>`:""}
    <div class="sum" style="margin:10px 0"><span>List price, 12 months${bf.now.length?", with "+esc(bf.now.join(", ")):""}</span><span class="mono">${eur(lp)}</span></div>
    <label class="fl">Your offer for 12 months (€)<input id="bid-amt" type="number" min="1" inputmode="numeric" value="${BIDBOX.amt||lp}"></label>
    <label class="fl">Note for the Nomadwise team (optional)<textarea id="bid-note" rows="2" maxlength="1000">${esc(BIDBOX.note||"")}</textarea></label>
    <div class="acts" style="margin-top:10px"><button class="btn primary" id="bid-send" ${sending?"disabled":""}>${sending?"Sending…":"Send offer"}</button><button class="btn" id="bid-x">Cancel</button></div>
  </div></div>`;
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
    const accept=propAccepted?`<div class="done"><b>Proposal sent.</b> €${ptot(c)} a month${propOpt.size?", including "+[...propOpt].join(", "):""}. We'll reply within 2 working days.${PREVIEW?' <span class="muted">Preview only, nothing was sent.</span>':""}</div>`
      :(propConfirm?`<div class="step"><b>Send your 2027 proposal at €${ptot(c)} a month?</b><p class="note">${propOpt.size?"Including "+[...propOpt].join(", ")+". ":"Core renewal only, no optional countries. "}We'll come back to you within 2 working days.</p><div class="acts"><button class="btn primary" id="prop-yes" ${sending?"disabled":""}>${sending?"Sending…":"Yes, send it"}</button><button class="btn ghost" id="prop-back">Back</button></div></div>`
      :`<div class="acts"><button class="btn primary" id="prop-ok">Send proposal to Nomadwise</button></div><p class="note">${peOn(c)?"Adjust the articles above, then send it. We reply within 2 working days.":"Questions or changes? Just reply to our email."}</p>`);
    return `<section class="panel"><div class="phead"><h2>${esc(c.title)}</h2><span class="muted">${peOn(c)?[...peInit(c).keep,...peInit(c).add].length+" articles":contract.length+" contract articles"}</span></div>
    <p class="muted">${esc(c.term)}</p>
    <div class="cur">${peOn(c)?`<div class="ci" style="grid-template-columns:minmax(0,1fr) auto"><span>Core renewal, your ${[...peInit(c).keep,...peInit(c).add].length} articles (1st position)</span><span class="mono">€${peMonthly(c)} a month</span></div>`+peEditor(c,v):(c.lines||[]).map(l=>`<div class="ci" style="grid-template-columns:minmax(0,1fr) auto"><span>${esc(l[0].replace("{n}",contract.length))}</span><span class="mono">${esc(l[1])}</span></div>`).join("")}
      ${peOn(c)?"":`<details class="ci" data-sec="exclusive list" style="display:block"><summary style="cursor:pointer;font-size:.88rem"><b>Exclusive 1st position · ${ex.length+exOut.length}</b> <span class="muted">no other eSIM can take 1st</span></summary>${chipList(ex.map(m=>m.a.name))}${exOut.length?`<p class="note" style="margin-top:6px">Also exclusive: ${exOut.map(m=>`<b>${esc(m.a.name)}</b> (runs separately to ${fmtD(m.st.exp)})`).join(", ")}. ${exOut.length===1?"It is":"They are"} in the list below.</p>`:""}</details>
      ${nx.length?`<details class="ci" data-sec="non-exclusive list" style="display:block"><summary style="cursor:pointer;font-size:.88rem"><b>1st position by default, non-exclusive · ${nx.length}</b> <span class="muted">first refusal if another provider asks, at up to €300 to €350</span></summary>${chipList(nx.map(m=>m.a.name))}</details>`:""}`}
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
    <p class="muted">What you hold now and when each one ends. Placements ending in the next two months can be renewed: tick them and they join your selection.</p>
    <h3>Up for renewal <span class="muted mono" style="font-weight:400">${now.length}</span></h3>
    ${now.length?`<div class="cur">${now.map(item).join("")}</div>`:`<p class="muted" style="font-size:.9rem">Nothing ends in the next two months.</p>`}
    ${later.length?`<details id="later" ${laterOpen?"open":""}><summary style="cursor:pointer;font-weight:600">Your other placements · ${later.length} <span class="muted" style="font-weight:400">· not up for renewal yet</span></summary><div class="cur" style="margin-top:8px">${later.map(m=>{const op=new Date(m.st.exp);op.setDate(op.getDate()-60);
        return `<div class="ci" style="grid-template-columns:minmax(0,1fr) auto"><span>${esc(m.a.name)} · ${m.s.pos===1?"1st":"2nd"}</span><span class="pill ok" title="You can renew from ${fmtD(op)}, two months before it ends">Runs to ${fmtD(m.st.exp)} · renew from ${fmtM(op)}</span></div>`}).join("")}</div><p class="note">Renewal opens two months before each placement ends.</p></details>`:""}</section>`;
}

const salesBit=(label,n,v,c,brands)=>`<span title="${esc((brands||[]).map(x=>x.b+": "+x.n+" sales, "+eur(x.v)).join("\n")+(c!=null?"\nOur commission: "+eur(c):""))}">${label} ${n||0} (${eur(v||0)})</span>`;
// A slot a partner can do something with right now: book it, renew it, or make an offer
function actionable(a,s,v){const st=status(a,s,v);return (st.k==="available"&&st.sel)||(st.k==="mine"&&!st.contract&&(st.soon||st.due||st.fr))||!!st.bid}
function myRegions(v){const r=new Set();ARTS.forEach(a=>a.slots.forEach(s=>{if(s.prov===v||status(a,s,v).k==="mine")r.add(regionOf[a.name])}));return r}
function picksFor(v){
  const mine=myRegions(v),seen=new Set(),out=[];
  const order=POPULAR.map(n=>ARTS.find(a=>a.name===n)).filter(Boolean);
  const cand=[];order.forEach(a=>{if(seen.has(a.name))return;seen.add(a.name);
    const s=a.slots.find(s=>{const st=status(a,s,v);return st.k==="available"&&st.sel});if(s)cand.push({a,s,mine:mine.has(regionOf[a.name])})});
  cand.sort((x,y)=>(y.mine-x.mine));return cand.slice(0,6);
}
function regionSelect(v,team){
  const mine=team?new Set():myRegions(v);const act=!team&&!filt.all;
  const cnt={};ARTS.forEach(a=>{const r=regionOf[a.name];cnt[r]=(cnt[r]||0)+(act?a.slots.filter(s=>actionable(a,s,v)).length:1)});
  let regs=REGION_ORDER.filter(r=>cnt[r]>0||r===filt.region);regs=regs.filter(r=>mine.has(r)).concat(regs.filter(r=>!mine.has(r)));
  return `<select id="f-reg" aria-label="Region"><option value="">All regions</option>${regs.map(r=>`<option value="${esc(r)}" ${filt.region===r?"selected":""}>${esc(r)} · ${cnt[r]||0} ${act?"open":(cnt[r]===1?"article":"articles")}${mine.has(r)?" ★":""}</option>`).join("")}</select>`;
}
function inventoryPanel(v){
  const team=v===null;
  const list=ARTS.filter(a=>{
    if(filt.q && !a.name.toLowerCase().includes(filt.q.toLowerCase())) return false;
    if(filt.tier && grp(a).name!==filt.tier) return false;
    if(team&&filt.prov && !a.slots.some(s=>s.prov===filt.prov&&holdsNow(s)&&(!filt.ppos||String(s.pos)===filt.ppos))) return false;
    if(filt.region && regionOf[a.name]!==filt.region) return false;
    if(!team && !filt.all && !a.slots.some(s=>actionable(a,s,v))) return false;
    if(team && !filt.all && !filt.q && !filt.prov && !filt.tier && !comingUp(a)) return false;
    return true;
  }).sort((x,y)=>grp(x).rank-grp(y).rank||x.name.replace(/^The /,"").localeCompare(y.name.replace(/^The /,"")));
  let lastG="";
  const tiers=`<div class="tiers">${S.tiers.map(t=>`<div class="tier"><span class="n">${esc(t.name)}</span><span class="r">${esc(t.desc)}</span><div class="pp"><span class="pc"><span class="pl">1st</span><span class="pv">${eur(t.p1)}</span></span><span class="pc"><span class="pl">2nd</span><span class="pv">${eur(t.p2)}</span></span></div></div>`).join("")}</div>`;
  const regs=REGION_ORDER.filter(r=>ARTS.some(a=>regionOf[a.name]===r));
  return `<section class="panel"><div class="phead"><h2>${team?"All placements":"Available placements"}</h2><span class="muted">12-month term · prices per year</span></div>
    ${team?`<details class="howto"><summary>How these figures work</summary><p class="note">Views and clicks to eSIM providers over the last 12 months, measured on nomadwise.io. Click rate is clicks per page view. Sales are the last 12 months${SALES_FROM?" (from "+fmtD(new Date(SALES_FROM+"T00:00:00"))+")":""} from the sales feed: the number of sales and, in brackets, what customers paid the brand. Each brand counts towards the position it held: the current holder, or a brand that held 1st or 2nd earlier in the year (from the July positioning sheet and the May and August swaps). 3rd is the brand mentioned further down. “Not placed” is a brand we have no record of in 1st or 2nd on that article. Hover a figure to see the brands and our commission. Admin only: providers see the tier, not these figures. Tap an article name for sales by brand and to change its group.</p></details>`:""}
    <div class="legend" aria-label="Key">${(team?[["available","Open"],["held","Held"],["reserved","In renewal or reserved"]]:filt.all?[["available","Available"],["selected","Selected"],["mine","Yours"],["bid","Offers open"],["reserved","Reserved or in renewal"],["taken","Unavailable"]]:[["available","Available"],["selected","Selected"],["mine","Yours"],["bid","Offers open"]]).map(([c,l])=>`<span class="key ${c}">${l}</span>`).join("")}</div>
    <div class="filters"><input type="search" id="f-q" placeholder="Search a country or city" value="${esc(filt.q)}" aria-label="Search articles">
      ${regionSelect(v,team)}
      <select id="f-tier" aria-label="Group"><option value="">All groups</option>${["Top page"].concat(S.tiers.map(t=>t.name)).map(n=>`<option ${filt.tier===n?"selected":""}>${esc(n)}</option>`).join("")}</select>
      ${team?(()=>{const cnt={};ARTS.forEach(a=>a.slots.forEach(s=>{if(holdsNow(s))cnt[s.prov]=(cnt[s.prov]||0)+1}));const ps=Object.keys(cnt).sort((x,y)=>cnt[y]-cnt[x]||x.localeCompare(y));
        return `<select id="f-prov" aria-label="Provider"><option value="">All providers</option>${ps.map(p=>`<option value="${esc(p)}" ${filt.prov===p?"selected":""}>${esc(p)} · ${cnt[p]}</option>`).join("")}</select>${filt.prov?`<select id="f-ppos" aria-label="Position"><option value="">1st or 2nd</option><option value="1" ${filt.ppos==="1"?"selected":""}>1st only</option><option value="2" ${filt.ppos==="2"?"selected":""}>2nd only</option></select>`:""}`})():""}</div>
    ${team?`<p class="showing">${filt.all||filt.q||filt.prov||filt.tier?`Showing ${filt.all?"all ":""}${list.length} ${list.length===1?"article":"articles"}.${filt.all?` <button class="lnk" id="f-all" data-all="0">Show only what's coming up</button>`:""}`:`Showing ${list.length} ${list.length===1?"article":"articles"} with something coming up: a slot ending in the next 60 days, in renewal, or with an offer in. <button class="lnk" id="f-all" data-all="1">Show all ${ARTS.length}</button>`}</p>`:`<p class="showing">${filt.all?`Showing all ${ARTS.length} articles. <button class="lnk" id="f-all" data-all="0">Show only what you can book, renew or bid on</button>`:`Showing ${list.length} ${list.length===1?"article":"articles"} you can book, renew or make an offer on. <button class="lnk" id="f-all" data-all="1">Show all ${ARTS.length}</button>`}</p>`}
    ${!team&&!filt.q&&!filt.region&&!filt.tier&&!submitted?(()=>{const P=picksFor(v);return P.length?`<div class="picks"><h3>Picked for you <span class="muted" style="font-weight:500;font-size:.86rem">· popular articles with a slot open now${myRegions(v).size?", your regions first":""}</span></h3><div class="pick-row">${P.map(({a,s})=>{const k=key(a,s.pos),on=sel.has(k);return `<button class="pick${on?" on":""}" data-k="${esc(k)}" aria-pressed="${on}"><span class="pn">${esc(a.name)}</span><span class="pm">${s.pos===1?"1st":"2nd"} · ${esc(grp(a).name)}</span><span class="pp"><b class="mono">${eur(priceOf(a,s.pos))}</b><span>${on?"Added ✓":"+ Add"}</span></span></button>`}).join("")}</div></div>`:""})():""}
    <div class="rows">${list.map(a=>{const t=tierOf(a);const g=grp(a).name;const head=g!==lastG?`<div class="ghead"><span>${esc(g)} group</span><span class="gn">${list.filter(x=>grp(x).name===g).length} ${list.filter(x=>grp(x).name===g).length===1?"article":"articles"}</span></div>`:"";lastG=g;
      return head+`<div class="row${team&&GEXP.has(a.name)?" open":""}"><div class="art">${team?`<button class="nm nmb" data-gx="${esc(a.name)}" aria-expanded="${GEXP.has(a.name)}">${esc(a.name)} <span class="tchip">${esc(g)}</span></button>`:`<span class="nm">${esc(a.name)}</span>`}<span class="meta">${team?teamMeta(a,t,g):`<span class="tchip ${(S.setPrices||{})[a.name]?"Premium":esc(t.name)}">${esc(g)}</span>`}</span></div>
      <div class="seats">${a.slots.map(s=>seat(a,s,v,team)).join("")}</div>${team&&GEXP.has(a.name)?rowDetail(a,t,g):""}</div>`}).join("")||'<p class="muted">No articles match.</p>'}</div></section>`;
}

// Admin rows: tier chip (tap to change), then views, clicks and sales on one quiet line
let GEDIT=null, OPEN_NOW=[0,0,0]; const GEXP=new Set();
// Admin: is anything happening on this article soon?
function comingUp(a){return a.slots.some(s=>{if(!s.prov||!s.exp||s.flag==="E")return false;const d=days(D(s.exp),TODAY);return d<=60&&d>=-60})||offers.some(o=>o.status==="new"&&!o.sent&&o.items.some(it=>String(it).startsWith(a.name+" · ")))}
// Admin: the extra detail under a row, only when asked for
function rowDetail(a,t,g){
  const sl=a.sales||{},brands=b=>(b||[]).map(x=>esc(x.b)+" "+x.n+" ("+eur(x.v)+")").join(", ");
  const line=(l,n,v,c,b)=>n?`<div><b>${l}</b> ${n} sales, ${eur(v)}${c!=null?` <span class="muted">· our commission ${eur(c)}</span>`:""}${b&&b.length?`<br><span class="muted">${brands(b)}</span>`:""}</div>`:"";
  const sh=SHOWN[a.name]||{};const fam=typeof famHead==="function"?famHead(a.name):null;
  return `<div class="rdetail">
    <div class="rd-col"><span class="eyebrow">Sales, last 12 months</span>${line("1st",sl.s1,sl.v1,sl.c1,sl.b1)}${line("2nd",sl.s2,sl.v2,sl.c2,sl.b2)}${line("3rd",sl.s3,sl.v3,sl.c3,sl.b3)}${line("Not placed",sl.so,sl.vo,sl.co,sl.bo)}${!(sl.s1||sl.s2||sl.s3||sl.so)?'<div class="muted">No sales tracked</div>':""}</div>
    <div class="rd-col"><span class="eyebrow">Group</span><div>${teamMetaChip(a,g)}</div>
      <span class="eyebrow" style="margin-top:8px">Traffic</span><div>${a.views.toLocaleString("en-GB")} views · ${a.clicks.toLocaleString("en-GB")} clicks${a.views>=50?" · "+Math.round(a.clicks/a.views*100)+"% click rate":""}</div>
      ${sh["1"]||sh["2"]?`<span class="eyebrow" style="margin-top:8px">Showing on the page (Jul 2026 sheet)</span><div>1st ${esc(sh["1"]||"not recorded")} · 2nd ${esc(sh["2"]||"not recorded")}</div>`:""}
      ${fam?`<span class="eyebrow" style="margin-top:8px">Family</span><div>${esc(famNames(fam).join(" + "))}</div>`:""}
    </div></div>`;
}
function teamMetaChip(a,g){const set=(S.setPrices||{})[a.name];if(set)return `<span class="tchip Premium">${esc(g)}</span> <span class="muted">custom price</span>`;
  return `<select class="gsel${manualTier(a)?" manual":""}" data-grp="${esc(a.name)}" aria-label="Group for ${esc(a.name)}"><option value="">Auto · ${esc(autoTier(a).name)}</option>${S.tiers.map(x=>`<option value="${esc(x.name)}" ${manualTier(a)&&manualTier(a).name===x.name?"selected":""}>${esc(x.name)} · set by hand</option>`).join("")}</select>`}
function teamMeta(a,t,g){
  const sl=a.sales||{},sb=(l,n,v)=>n?`${l} ${n} (${eur(v)})`:"";
  const sales=[sb("1st",sl.s1,sl.v1),sb("2nd",sl.s2,sl.v2)].filter(Boolean).join(" · ");
  const tip=(sl.b1||[]).concat(sl.b2||[]).map(x=>x.b+": "+x.n+" sales, "+eur(x.v)).join("\n");
  return `<span class="mono stat-line" title="${esc(tip)}">${a.views.toLocaleString("en-GB")} views · ${a.clicks.toLocaleString("en-GB")} clicks${a.views>=50?" ("+Math.round(a.clicks/a.views*100)+"%)":""}${sales?" · sales "+sales:""}</span>`;
}
// Admin seats: who has it and until when, nothing else
function teamSeat(a,s,st){
  const pos=`<span class="pos">${s.pos===1?"1st":"2nd"}</span>`;const c=s.prov&&S.contracts[s.prov];
  const sh=(SHOWN[a.name]||{})[String(s.pos)];const fr=frActive(a,s);
  let main,sub="",cls=st.k==="mine"?"taken":st.k,price="";
  if(s.flag==="E"){main=s.prov;sub="ongoing";cls="held"}
  else if(s.prov&&s.exp&&st.exp&&days(st.exp,TODAY)>=0){main=s.prov;const d=days(st.exp,TODAY);sub="to "+fmtD(st.exp)+(d<=60?" · ends in "+d+" days":"")+(s.pos===1&&c?((c.exclusive||[]).includes(a.name)?" · exclusive":""):"");cls=d<=60?"held soon":"held"}
  else if(st.due){main=s.prov+" · in renewal";sub="ended "+fmtD(st.exp)+", held to "+fmtD((()=>{const x=new Date(st.exp);x.setDate(x.getDate()+60);return x})());cls="reserved"}
  else if(st.k==="reserved"){main=st.label;sub=st.who||"";}
  else{main="Available";price=`<span class="pr">${eur(priceOf(a,s.pos))}</span>`;
    const showing=(s.prov&&!s.exp)?s.prov:(s.prov&&s.exp?s.prov:(sh||""));
    sub=[fr?fr+" first refusal":"",showing?"showing "+showing+", unpaid":""].filter(Boolean).join(" · ")}
  return `<div class="seat ${cls} plain" title="${esc(main+(sub?", "+sub:""))}">${pos}<span class="st">${esc(main)}</span>${price}${sub?`<span class="who">${esc(sub)}</span>`:""}</div>`;
}
function seat(a,s,v,team){
  const st=status(a,s,v), k=key(a,s.pos), on=sel.has(k);
  if(team)return teamSeat(a,s,st);
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
  if(!team&&!filt.all&&st.k!=="mine"&&!st.bid&&!(st.k==="available"&&st.sel)&&!on)return `<div class="seat quiet" aria-disabled="true">${pos}<span class="st">Unavailable</span></div>`;
  if(st.bid&&!team){const sent=BIDS.find(b=>b.item===k);
    return `<button class="seat bid${sent?" sent":""}" ${sent?`aria-disabled="true"`:`data-bid="${esc(k)}"`} title="${esc(sent?"Your offer of "+eur(sent.offer)+" is with us":"Held by another partner until "+fmtD(st.exp)+". Make an offer to take it over")}">${pos}<span class="st">${sent?"Offer sent · "+eur(sent.offer):"Make an offer"}</span><span class="pr">${sent?"":"List "+eur(famHead(a.name)===a.name?bidFamily(a.name,s.pos===1?"1st":"2nd").lp:priceOf(a,s.pos))}</span><span class="sub">${st.due?"Held for renewal now":"Ends "+fmtD(st.exp)}</span></button>`;}
  const cls=st.k+(on?" selected":"")+(team?" plain":"")+(st.oneEach?" one":"");
  const canSel=st.sel && !team && !submitted;
  return `<button class="seat ${cls}" ${canSel?`data-k="${esc(k)}" aria-pressed="${on}"`:(team||submitted?"disabled":`aria-disabled="true" data-tap="${esc(k)}" data-tapl="${esc(st.label)}"`)} title="${esc(st.label)}">
    ${pos}<span class="st">${on?"Selected":esc(st.label)}</span>${st.sel?`<span class="pr">${eur(on&&sel.get(k)?sel.get(k).price:(st.price!=null?st.price:priceOf(a,s.pos)))}</span>`:""}${team&&st.who?`<span class="who">${esc(st.who)}</span>`:""}</button>`;
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
  if(v===null){const openO=offers.filter(o=>o.status==="new"&&!o.sent).length;
    let ren=0,soon=0;ARTS.forEach(a=>a.slots.forEach(s=>{if(!s.prov||!s.exp||s.flag==="E")return;const d=days(D(s.exp),TODAY);if(d<0&&d>=-60)ren++;else if(d>=0&&d<=60)soon++}));
    const wk=ACT_EV.filter(e=>e.kind==="visit"&&new Date(e.at)>new Date(Date.now()-7*864e5)).length;
    const g=(n,l,sub)=>`<div class="glance"><span class="gv">${n}</span><span class="gl">${l}${sub?`<small>${sub}</small>`:""}</span></div>`;
    return `<section class="panel"><h3 style="margin-bottom:8px">At a glance</h3>
      ${g(openO,openO===1?"offer waiting":"offers waiting")}${g(ren,"slots in renewal","ended, held up to 60 days")}${g(soon,"slots ending","in the next 60 days")}
      ${g(OPEN_NOW[1]+" · "+OPEN_NOW[2],"open now","1st · 2nd")}${g(wk,wk===1?"partner visit":"partner visits","this week")}
      <p class="note" style="margin-top:8px">To see exactly what a partner sees, pick them at the top and press Open their page.</p></section>`}
  const T=totals();
  if(submitted) return `<section class="panel" id="selp"><h2>Your request</h2><div class="done"><b>Sent to Nomadwise${submitted.when?" on "+fmtD(new Date(submitted.when)):""}.</b><br>${submitted.items.length} ${submitted.items.length===1?"item":"items"}, package price ${eur(submitted.offer)}. We'll reply within 2 working days. You can send another once we've answered this one.</div>
    ${PREVIEW?`<p class="note">Preview only. Nothing was sent.</p><button class="btn small" id="reset">Reset preview</button>`:""}</section>`;
  const items=[...sel.entries()];
  const stepN=confirmOffer?3:((T.slots||reviews)?2:1);
  const stepper=`<ol class="stepper" aria-label="Steps">${["Pick","Review","Send"].map((l,i)=>`<li class="${i+1<stepN?"s-done":i+1===stepN?"s-on":""}"><span>${i+1<stepN?"✓":i+1}</span>${l}</li>`).join("")}</ol>`;
  return `<section class="panel" id="selp">${stepper}<div class="phead"><h2>Your selection</h2><span class="muted">${T.slots} placements</span></div>
    ${items.length||reviews?`<div class="sel-list">${items.map(([k,x])=>`<div class="sel-item"><span>${esc(k)}${x.kind==="renew"?' <span class="muted">renewal</span>':""}${x.until?` <span class="muted">to ${fmtD(D(x.until))}</span>`:""}</span><span class="mono">${eur(x.price)}</span><button class="x" data-rm="${esc(k)}" aria-label="Remove ${esc(k)}">×</button></div>`).join("")}
      ${reviews?`<div class="sel-item"><span>Review article × ${reviews}</span><span class="mono">${eur(T.addons)}</span><span></span></div>`:""}</div>`:`<p class="muted" style="font-size:.9rem">Tap an available slot to add it. Your current placements can be renewed from the list on the left.</p>`}
    <div class="sum"><span>List price</span><span class="mono">${eur(T.list+T.addons)}</span></div>
    ${T.disc?`<div class="sum"><span>Package discount ${S.discPct}%<small>${T.elig} Premium or Standard placements</small></span><span class="mono">−${eur(T.disc)}</span></div>`:`<div class="note">${S.discMin} or more Premium or Standard placements: ${S.discPct}% off those placements.${T.elig?" You have "+T.elig+".":""}</div>`}
    <div class="sum total"><span>Package price</span><span class="mono">${eur(T.total)}</span></div>
    ${confirmOffer?`<div class="step confirm-offer"><b>Send this to Nomadwise?</b>
      <div class="sum"><span>${T.slots+(reviews?reviews:0)} ${T.slots+(reviews?reviews:0)===1?"item":"items"} · list price</span><span class="mono">${eur(T.list+T.addons)}</span></div>
      ${T.disc?`<div class="sum"><span>Package discount</span><span class="mono">-${eur(T.disc)}</span></div>`:""}
      <div class="sum total"><span>Package price</span><span class="mono">${eur(confirmOffer.amt)}</span></div>
      ${confirmOffer.note.trim()?`<p class="note">Your note: “${esc(confirmOffer.note.trim())}”</p>`:""}
      <p class="note">Once sent you can't change it or send another until we've replied, usually within 2 working days.</p>
      <div class="acts"><button class="btn primary" id="o-yes" ${sending?"disabled":""}>${sending?"Sending…":"Yes, send it"}</button><button class="btn" id="o-back" ${sending?"disabled":""}>Go back</button></div></div>`:`
    <form id="offer" class="col" style="gap:10px">
      <label class="fl">Note for the Nomadwise team (optional)<textarea id="o-note" rows="2" maxlength="3000">${esc(draftNote)}</textarea></label>
      <button class="btn primary" type="submit" ${(T.slots||reviews)&&!sending?"":"disabled"}>${sending?"Sending…":"Send to Nomadwise"}</button>
      <p class="note">Prices are fixed, with the package discount applied automatically. One open request at a time; we reply within 2 working days.</p>
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
  const [name,p]=k.split(" · ");const a=ARTS.find(x=>x.name===name);const pos=p==="1st"?1:2;const fh=famHead(name);
  if(sel.has(k)){const ks=fh?famNames(fh).map(n=>n+" · "+p).filter(x=>sel.has(x)):[k];
    ks.forEach(x=>{const it=sel.get(x);sel.delete(x);track("slot_remove",{item:x,price:it.price,renewal:it.kind==="renew"})});
    if(ks.length>1)toast(ks.map(x=>x.split(" · ")[0]).join(", ")+" go together, so all "+ks.length+" were removed");return}
  if(fh){const r=famPick(fh,pos);if(typeof r==="string"){toast(r);return}
    r.forEach(x=>{sel.set(x.k,{price:x.price,kind:x.kind,tier:x.tier,until:x.until});track("slot_add",{item:x.k,price:x.price,tier:x.tier,renewal:x.kind==="renew",family:fh})});
    if(r.length>1)toast(r.map(x=>x.name).join(", ")+" go together in "+p+", so all "+r.length+" were added");return}
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
  document.querySelectorAll("[data-bid]").forEach(el=>el.addEventListener("click",()=>{BIDBOX={k:el.dataset.bid};track("bid_open",{item:el.dataset.bid});render();const i=$("bid-amt");if(i){i.focus();i.select()}}));
  const bx=$("bid-x");if(bx)bx.addEventListener("click",()=>{BIDBOX=null;render()});
  const bsd=$("bid-send");if(bsd)bsd.addEventListener("click",async()=>{if(sending||!BIDBOX)return;const amt=Math.round(+$("bid-amt").value||0);if(amt<=0){toast("Enter an amount");return}
    const note=$("bid-note").value;const k=BIDBOX.k;const [name,p]=k.split(" · ");const bf=bidFamily(name,p),lp=bf.lp;
    BIDBOX.amt=amt;BIDBOX.note=note;
    if(await submitOffer([k],lp,amt,note,"bid")){BIDS.push({item:k,offer:amt,at:new Date().toISOString()});track("bid_sent",{item:k,offer:amt,list:lp});BIDBOX=null;render();toast(PREVIEW?"Preview only, nothing was sent":"Offer sent. We'll come back to you within 2 working days")}});
  const roiI=$("roi");if(roiI)roiI.addEventListener("change",()=>{const r=Math.min(5,Math.max(0.5,+roiI.value||1.5));roiSave(r);render()});
  const pbm=$("pb-m");if(pbm)pbm.addEventListener("change",()=>{const m=Math.max(0,+pbm.value||0);if(PB.fixed){PB.fixedM=m}else{const L=pbSetList();PB.disc=L?Math.min(.9,Math.max(-1,1-m*12/L)):0}pbSave();render()});
  const pbmo=$("pb-mode");if(pbmo)pbmo.addEventListener("change",()=>{PB.fixed=pbmo.value==="fixed";if(PB.fixed)PB.fixedM=PB.monthly||PB.fixedM;pbSave();render()});
  const pbd=$("pb-d");if(pbd)pbd.addEventListener("change",()=>{PB.disc=Math.min(.9,Math.max(0,(+pbd.value||0)/100));pbSave();render()});
  const pbq=$("pb-q");if(pbq)pbq.addEventListener("input",()=>{PB.q=pbq.value;const pos=pbq.selectionStart;render();const n=$("pb-q");n.focus();n.setSelectionRange(pos,pos)});
  const pbFam=(n,on)=>{const ns=famOf(n),cand=new Set(pbCand().map(x=>x.a.name));const moved=[];
    ns.forEach(m=>{if(PB.cur.includes(m)){if(on)PB.keep.add(m);else PB.keep.delete(m);moved.push(m)}else if(cand.has(m)){if(on)PB.add.add(m);else PB.add.delete(m);moved.push(m)}});
    PB.best=null;if(moved.length>1)toast(moved.join(", ")+" go together, so all "+moved.length+(on?" are in":" are out"))};
  document.querySelectorAll("[data-pbk]").forEach(el=>el.addEventListener("change",()=>{pbFam(el.dataset.pbk,el.checked);pbSave();render()}));
  document.querySelectorAll("[data-pbo]").forEach(el=>el.addEventListener("change",()=>{const n=el.dataset.pbo;if(el.checked)PB.opt.add(n);else PB.opt.delete(n);pbSave();render()}));
  document.querySelectorAll("[data-pbop]").forEach(el=>el.addEventListener("change",()=>{PB.optPrice[el.dataset.pbop]=Math.max(0,+el.value||0);pbSave();render()}));
  document.querySelectorAll("[data-pba]").forEach(el=>el.addEventListener("change",()=>{pbFam(el.dataset.pba,el.checked);pbSave();render()}));
  const pbr=$("pb-reset");if(pbr)pbr.addEventListener("click",()=>{const p=PB.p;delete SCEN[p];PB=pbInit(p);pbSave();render()});
  const pbb=$("pb-best");if(pbb)pbb.addEventListener("click",pbBest);
  const pbs5=$("pb-swap5");if(pbs5)pbs5.addEventListener("click",()=>{const p=PB.p,c=S.contracts[p];
    const kept=PB.cur.filter(n=>PB.keep.has(n)).map(n=>ARTS.find(a=>a.name===n)).filter(Boolean);
    const L0=pbSetList(),share=L0?PB.fixedM*12/L0:0;
    const weak=kept.map(a=>{const e=brandSales(a,p);return {a,net:e.v-priceOf(a,1)*share-e.c}}).sort((x,y)=>x.net-y.net).slice(0,5);
    const win=new Date(D(c.contractEnd));win.setDate(win.getDate()+31);
    const held=new Set(ARTS.filter(a=>a.slots[0].prov===p&&holdsNow(a.slots[0])).map(a=>a.name));
    const free=ARTS.filter(a=>!held.has(a.name)&&!PB.add.has(a.name)&&!(c.options||[]).includes(a.name)).filter(a=>{const s=a.slots[0];if(!s.prov||!s.exp)return true;const e=D(s.exp);if(days(e,TODAY)<-60)return true;const nx=new Date(e);nx.setDate(nx.getDate()+1);return nx<=win}).sort((x,y)=>(+((y.sales||{}).v1)||0)-(+((x.sales||{}).v1)||0)).slice(0,weak.length);
    weak.forEach(w=>PB.keep.delete(w.a.name));free.forEach(a=>PB.add.add(a.name));pbSave();render();
    toast("Swapped "+weak.map(w=>w.a.name).join(", ")+" for "+free.map(a=>a.name).join(", "))});
  const pbn=$("pb-dropneg");if(pbn)pbn.addEventListener("click",()=>{const p=PB.p,c=S.contracts[p];
    const L0=pbSetList(),share=PB.fixed?(L0?PB.fixedM*12/L0:0):1-PB.disc;let k=0;
    PB.cur.forEach(n=>{if(!PB.keep.has(n))return;const a=ARTS.find(x=>x.name===n);const e=brandSales(a,p);if(e.v-priceOf(a,1)*share-e.c<0){PB.keep.delete(n);k++}});
    PB.cur.forEach(n=>{if(!PB.keep.has(n))famOf(n).forEach(m=>{PB.keep.delete(m);PB.add.delete(m)})});PB.best=null;
    pbSave();render();toast(k?"Dropped "+k+" current "+(k===1?"article":"articles")+" where their net was negative":"No current article has a negative net at this discount")});
  const pbs=$("pb-share");if(pbs)pbs.addEventListener("click",async()=>{const p=PB.p;const edit={keep:[...PB.keep],add:[...PB.add],disc:PB.disc,mode:PB.fixed?"fixed":"disc",max:PB.keep.size+[...PB.add].length,prices:Object.fromEntries((S.contracts[p].options||[]).map(o=>[o,+PB.optPrice[o]||0]))};const base=PB.monthly;
    if(!base){toast("Set a price first");return}
    const {error}=await sb.rpc("partners_team_share_proposal",{p_session:SESSION,p_provider:p,p_edit:edit,p_base:base});
    if(error){toast(error.message||"Couldn't share");return}
    S.contracts[p].prices=edit.prices;delete edit.prices;S.contracts[p].edit=Object.assign(edit,{on:true,shared_at:new Date().toISOString()});S.contracts[p].base=base;render();toast(p+" now sees this scenario at €"+base+" a month and can adjust it")});
  const pbu=$("pb-unshare");if(pbu)pbu.addEventListener("click",async()=>{const p=PB.p;const {error}=await sb.rpc("partners_team_share_proposal",{p_session:SESSION,p_provider:p,p_edit:null,p_base:null});
    if(error){toast(error.message||"Couldn't update");return}delete S.contracts[p].edit;render();toast(p+" sees the fixed proposal again")});
  const pbnb=$("pb-nobid");if(pbnb)pbnb.addEventListener("change",async()=>{const p=PB.p,on=pbnb.checked;const {error}=await sb.rpc("partners_team_no_bids",{p_session:SESSION,p_provider:p,p_on:on});
    if(error){toast(error.message||"Couldn't save");pbnb.checked=!on;return}S.contracts[p].noBids=on;toast(on?p+"'s articles are closed to offers":p+"'s articles open to offers in their last two months")});
  const pbc=$("pb-copy");if(pbc)pbc.addEventListener("click",()=>{const p=PB.p;const el=document.querySelector("#d-pb .kgrid");
    const dropped=PB.cur.filter(n=>!PB.keep.has(n)),added=[...PB.add];
    const txt=`${p} 2027 scenario\n${PB.keep.size+added.length} articles at €${PB.monthly} a month (€${PB.monthly*12} a year)\nKeeping ${PB.keep.size} of ${PB.cur.length}.\nDropping: ${dropped.join(", ")||"none"}\nAdding: ${added.join(", ")||"none"}\nOptional extras: ${[...PB.opt].map(n=>n+" €"+PB.optPrice[n]+"/mo").join(", ")||"none"}\n\n${el?el.innerText.replace(/\n+/g,"\n"):""}`;
    navigator.clipboard.writeText(txt).then(()=>toast("Summary copied"),()=>toast("Couldn't copy"))});
  document.querySelectorAll("[data-k]").forEach(el=>{
    el.addEventListener(el.type==="checkbox"?"change":"click",()=>{toggle(el.dataset.k);render()});
  });
  document.querySelectorAll("[data-rm]").forEach(el=>el.addEventListener("click",()=>{sel.delete(el.dataset.rm);confirmOffer=null;render()}));
  const q=$("f-q");if(q)q.addEventListener("input",()=>{filt.q=q.value;clearTimeout(searchT);const sq=q.value.trim();if(sq.length>=3)searchT=setTimeout(()=>track("search",{q:sq}),1500);const pos=q.selectionStart;render();const n=$("f-q");n.focus();n.setSelectionRange(pos,pos)});
  const ft=$("f-tier");if(ft)ft.addEventListener("change",()=>{filt.tier=ft.value;if(ft.value)track("filter_tier",{tier:ft.value});render()});
  document.querySelectorAll("[data-reg]").forEach(el=>el.addEventListener("click",()=>{const r=el.dataset.reg;if(r==="")filt.regions.clear();else if(filt.regions.has(r))filt.regions.delete(r);else{filt.regions.add(r);track("filter_region",{region:r})}render()}));
  const fpv=$("f-prov");if(fpv)fpv.addEventListener("change",()=>{filt.prov=fpv.value;if(!fpv.value)filt.ppos="";render()});
  const fpp=$("f-ppos");if(fpp)fpp.addEventListener("change",()=>{filt.ppos=fpp.value;render()});
  const fr=$("f-reg");if(fr)fr.addEventListener("change",()=>{filt.region=fr.value;if(fr.value)track("filter_region",{region:fr.value});render()});
  const fal=$("f-all");if(fal)fal.addEventListener("click",()=>{filt.all=fal.dataset.all==="1";if(filt.all)track("show_all",{});render()});
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
    const amt=Math.round(totals().total);if(!amt)return;draftNote=$("o-note").value;confirmOffer={amt,note:draftNote};track("offer_review",{offer:amt});render()});
  const ob=$("o-back");if(ob)ob.addEventListener("click",()=>{confirmOffer=null;render()});
  const oy=$("o-yes");if(oy)oy.addEventListener("click",async()=>{if(sending||!confirmOffer)return;
    const amt=confirmOffer.amt,note=confirmOffer.note;const T=totals();
    const items=[...sel.entries()].map(([k,x])=>x.until?k+" · to "+x.until:k).concat(reviews?["Review article × "+reviews]:[]);
    if(await submitOffer(items,T.list+T.addons,amt,note,"offer")){confirmOffer=null;draftNote="";track("offer_sent",{offer:amt,list:T.list+T.addons,items:items.length});submitted={offer:amt,when:new Date().toISOString(),items};render();window.scrollTo({top:0,behavior:"smooth"})}});
  document.querySelectorAll("[data-tap]").forEach(el=>el.addEventListener("click",()=>track("tap_unavailable",{item:el.dataset.tap,label:el.dataset.tapl})));
  document.querySelectorAll("details[data-sec]").forEach(d=>d.addEventListener("toggle",()=>{if(d.open)track("open_section",{section:d.dataset.sec})}));
  const rs=$("reset");if(rs)rs.addEventListener("click",()=>{resetSel();render()});
  document.querySelectorAll("[data-poseat]").forEach(el=>el.addEventListener("click",()=>{const o=el.dataset.poseat;if(propOpt.has(o))propOpt.delete(o);else propOpt.add(o);track("proposal_option",{country:o,on:propOpt.has(o)});render()}));
  document.querySelectorAll("[data-po]").forEach(el=>el.addEventListener("change",()=>{const o=el.dataset.po;if(el.checked)propOpt.add(o);else propOpt.delete(o);track("proposal_option",{country:o,on:el.checked});render()}));
  const pk=$("prop-ok");if(pk)pk.addEventListener("click",()=>{propConfirm=true;render()});
  const pb=$("prop-back");if(pb)pb.addEventListener("click",()=>{propConfirm=false;render()});
  const py=$("prop-yes");if(py)py.addEventListener("click",async()=>{const c=S.contracts[asProv];const m=ptot(c);
    let items,note;
    if(peOn(c)){const P=peInit(c),k0=c.edit.keep||[],set=[...P.keep,...P.add].sort(),ours=k0.concat(c.edit.add||[]),removed=ours.filter(n=>!set.includes(n)),added=set.filter(n=>!ours.includes(n)),ch=peChanged(c);
      items=["Core renewal, "+set.length+" articles, €"+coreM(c)+" a month"].concat(removed.length?["Removed from our proposal: "+removed.join(", ")]:[]).concat(set.map(n=>n+" · 1st")).concat([...propOpt].map(o=>o+" 1st (optional, +€"+((c.prices||{})[o]||0)+" a month)"));
      note=(ch?"Proposal changed by partner. ":"Accepted as proposed. ")+(added.length?"Added: "+added.join(", ")+". ":"")+(removed.length?"Removed: "+removed.join(", ")+". ":"")+"€"+m+" a month in total.";}
    else{items=["Core renewal, €"+c.base+" a month"].concat([...propOpt].map(o=>o+" 1st"));note="Accepted at €"+m+" a month";}
    if(await submitOffer(items,m*12,m*12,note,"proposal")){track("proposal_accepted",{monthly:m,changed:peOn(c)&&peChanged(c)});propAccepted=true;propConfirm=false;render()}});
  // Proposal editor: a country and its cities are added and removed together
  const peFreeFor=(c,v,n)=>{const a=ARTS.find(x=>x.name===n);if(!a)return false;const st=status(a,a.slots[0],v);if(st.k==="mine")return false;if(st.k==="available")return true;
    if(st.exp){const win=new Date(D(c.contractEnd));win.setDate(win.getDate()+31);const nx=new Date(st.exp);nx.setDate(nx.getDate()+1);return nx<=win}return false};
  const peSet=(c,P,ns,on)=>{const k0=c.edit.keep||[];ns.forEach(m=>{if(!on){P.keep.delete(m);P.add.delete(m)}else if(k0.includes(m))P.keep.add(m);else P.add.add(m)})};
  document.querySelectorAll("[data-perm]").forEach(el=>el.addEventListener("click",()=>{const c=S.contracts[viewer()];const P=peInit(c),n=el.dataset.perm;
    const ns=famOf(n).filter(m=>P.keep.has(m)||P.add.has(m));peSet(c,P,ns,false);if(ns.length>1)toast(ns.join(", ")+" go together, so all "+ns.length+" were removed");track("proposal_remove",{article:n});render()}));
  document.querySelectorAll("[data-peres]").forEach(el=>el.addEventListener("click",()=>{const c=S.contracts[viewer()];const P=peInit(c),n=el.dataset.peres,k0=c.edit.keep||[],a0=c.edit.add||[];
    const ns=famOf(n).filter(m=>!P.keep.has(m)&&!P.add.has(m)&&(k0.includes(m)||a0.includes(m)||peFreeFor(c,viewer(),m)));
    if(peFixed(c)&&P.keep.size+P.add.size+ns.length>(+c.edit.max||0)){toast("That's "+ns.length+" articles. Remove "+(P.keep.size+P.add.size+ns.length-(+c.edit.max||0))+" first to make room");return}
    peSet(c,P,ns,true);track("proposal_restore",{article:n});render()}));
  document.querySelectorAll("[data-peadd]").forEach(el=>el.addEventListener("click",()=>{const c=S.contracts[viewer()];const P=peInit(c),n=el.dataset.peadd,k0=c.edit.keep||[],a0=c.edit.add||[];
    const ns=famOf(n).filter(m=>!P.keep.has(m)&&!P.add.has(m)&&(m===n||k0.includes(m)||a0.includes(m)||peFreeFor(c,viewer(),m)));
    const room=(+c.edit.max||0)-(P.keep.size+P.add.size);
    if(peFixed(c)&&ns.length>room){toast(room<=0?"Remove an article first to swap":(ns.length>1?ns.join(", ")+" go together: remove "+(ns.length-room)+" more to make room":"Remove an article first to swap"));return}
    peSet(c,P,ns,true);if(ns.length>1)toast(ns.join(", ")+" go together, so all "+ns.length+" were added");track("proposal_add",{article:n});render()}));
  const peq=$("pe-q");if(peq)peq.addEventListener("input",()=>{peQ=peq.value;const pos=peq.selectionStart;render();const n=$("pe-q");if(n){n.focus();n.setSelectionRange(pos,pos)}});
  const per=$("pe-reset");if(per)per.addEventListener("click",()=>{PE=null;render()});
  // team: move an article to another group
  document.querySelectorAll("[data-gx]").forEach(el=>el.addEventListener("click",()=>{const n=el.dataset.gx;if(GEXP.has(n))GEXP.delete(n);else GEXP.add(n);render()}));
  document.querySelectorAll("[data-gedit]").forEach(el=>el.addEventListener("click",()=>{GEDIT=el.dataset.gedit;render();const s=document.querySelector(`[data-grp="${CSS.escape(GEDIT)}"]`);if(s)s.focus()}));
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
  document.querySelectorAll("[data-story]").forEach(el=>el.addEventListener("click",async()=>{const id=el.dataset.story;
    const body=id==="__all"?Object.values(STORY).join("\n\n-----\n\n"):STORY[id];if(!body)return;
    toast(await copyText(STORY_ASK+"\n\n"+body)?"Copied. Paste it into Claude and ask away":"Couldn't copy. Try again")}));
  document.querySelectorAll("[data-rsn]").forEach(el=>el.addEventListener("click",()=>{const [i,k]=el.dataset.rsn.split("|");const o=offers[+i];o.reason=k;o.draftText=null;render()}));
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
    const L=[];ARTS.forEach(a=>a.slots.forEach(s=>{const st=status(a,s,null);if(s.prov===p&&st.exp&&(st.due||st.near))L.push({a,s,st})}));
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
