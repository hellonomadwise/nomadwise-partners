/* Nomadwise partner placements · partners.nomadwise.io
   Providers open a private link (#k=…) and only ever receive their own data from the database.
   The team signs in with Google and gets everything. Nothing is ever emailed automatically:
   replies and reminders open in the team's own email app after approval. */
(function(){
const SB_URL="https://xclqfbuwrijpwtgbvrim.supabase.co";
const SB_KEY="sb_publishable_BdLDgE41WZXKIR7SaAvlxg_SJT3Ad_h";
const sb=window.supabase.createClient(SB_URL,SB_KEY,{auth:{flowType:"pkce",persistSession:true,detectSessionInUrl:true}});

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
const REGION_ORDER=["Europe","Asia","Caucasus & Central Asia","Middle East","Africa","North America","Central America & Caribbean","South America","Oceania","Worldwide"];

// ---------- state ----------
let ROLE=null;           // "team" | "provider"
let ME=null;             // provider name, or the team member's email
let TOKEN=null;
let S={tiers:[],setPrices:{},packages:{},contracts:{},firstRefusal:{articles:[]},discTiers:[],review:0,discMin:0,discPct:0};
let ARTS=[], TOTALS=null, PROVIDERS=[], TEAM=[], REMS={}, offers=[];
const regionOf={};
let mode="team", asProv="__new";
const sel=new Map();
let reviews=0, submitted=null, laterOpen=false, sending=false;
const openD=new Set();
const propOpt=new Set(); let propAccepted=false, propConfirm=false;
let filt={q:"",tier:"",avail:false,regions:new Set()};
const drafts={};

function toast(msg){const t=$("toast");t.textContent=msg;t.hidden=false;clearTimeout(toast._t);toast._t=setTimeout(()=>{t.hidden=true},3200)}

// ---------- prices ----------
const byMin=()=>S.tiers.slice().sort((x,y)=>y.min-x.min);
const tierOf=a=>a.grp!==undefined?(S.tiers.find(t=>t.name===a.grp)||{name:a.grp,p1:a.p1,p2:a.p2}):(byMin().find(t=>a.clicks>=t.min)||S.tiers[S.tiers.length-1]);
const grp=a=>{const o=S.setPrices[a.name];const name=a.grp!==undefined?a.grp:(o&&o.label?o.label:tierOf(a).name);const i=S.tiers.findIndex(t=>t.name===name);return {name,rank:i<0?-1:i}};
const priceOf=(a,pos)=>{if(a.grp!==undefined)return +(pos===1?a.p1:a.p2);const o=S.setPrices[a.name];if(o&&o["p"+pos]!=null)return +o["p"+pos];const t=tierOf(a);return pos===1?+t.p1:+t.p2};

// Providers on a contract see their deal, not per-slot list prices
function status(a,s,viewer){
  const st=status0(a,s,viewer);
  const c=viewer&&S.contracts[viewer];
  if(c&&st.k==="mine"){st.sel=false;st.contract=true;if(st.fr)st.label=((c.included||[]).includes(a.name)||propOpt.has(a.name))?"In your proposal":"Optional, tick above";}
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
function parseToken(){
  const m=location.hash.match(/k=([a-f0-9]{20,})/i);
  if(m)return m[1];
  const q=new URLSearchParams(location.search).get("k");
  return q&&/^[a-f0-9]{20,}$/i.test(q)?q:null;
}
function setRegions(){ARTS.forEach(a=>{regionOf[a.name]=a.region||"Other"})}

async function boot(){
  TOKEN=parseToken();
  if(TOKEN) return loadProvider();
  const {data:{session}}=await sb.auth.getSession();
  if(session) return loadTeam(session);
  gate();
}

async function loadProvider(){
  const {data,error}=await sb.rpc("partners_provider_page",{p_token:TOKEN});
  if(error) return message("We couldn't load your page just now","Please refresh in a minute. If it keeps happening, reply to our last email and we'll sort it out.");
  if(!data) return message("This link is no longer active","Please ask the Nomadwise team for a new link.");
  ROLE="provider"; ME=data.provider; mode="prov"; asProv=ME;
  S=Object.assign({},data.settings,{contracts:data.contracts||{}});
  ARTS=(data.articles||[]).map(a=>({name:a.name,region:a.region,grp:a.grp,p1:+a.p1,p2:+a.p2,slots:a.slots.map(s=>({pos:s.pos,prov:s.prov||"",exp:s.exp||"",flag:s.flag||""}))}));
  TOTALS=data.totals; setRegions();
  const lo=data.lastOffer;
  if(lo&&lo.kind==="proposal"&&(lo.status==="new"||lo.status==="accepted")){
    propAccepted=true;(lo.items||[]).forEach(it=>{const m=/^(.*) 1st$/.exec(it);if(m)propOpt.add(m[1])});
  }else if(lo&&lo.status==="new"){
    submitted={offer:+lo.offer,when:lo.created_at,items:lo.items||[]};
  }
  $("topbar").innerHTML=`<span>Private page for ${esc(ME)} · please don't forward this link</span>`;
  render();
}

async function loadTeam(session){
  const {data,error}=await sb.rpc("partners_team_data");
  const email=(session&&session.user&&session.user.email)||"";
  if(error){
    if(/team only/i.test(error.message)) return message("This account isn't on the team list","You're signed in as "+email+". Ask Jonathan or Leonie to add this email under Who has access, or sign in with the Nomadwise Google account.",true);
    return message("Couldn't load the team view",error.message,true);
  }
  ROLE="team"; ME=data.me||email;
  applyTeamData(data);
  mode="team"; asProv=(PROVIDERS.find(p=>S.contracts[p.name])||PROVIDERS[0]||{name:"__new"}).name;
  render();
}
function applyTeamData(data){
  S=Object.assign({},data.settings,{contracts:data.contracts||{}});
  ARTS=(data.articles||[]).map(r=>({name:r.name,region:r.region,views:r.views,clicks:r.clicks,slots:[{pos:1,prov:r.p1_prov||"",exp:r.p1_exp||"",flag:r.p1_flag||""},{pos:2,prov:r.p2_prov||"",exp:r.p2_exp||"",flag:r.p2_flag||""}]}));
  PROVIDERS=data.providers||[]; TEAM=data.team||[]; REMS=data.reminders||{};
  const emailOf=p=>(PROVIDERS.find(x=>x.name===p)||{}).contact_email||"";
  offers=(data.offers||[]).map(o=>({id:o.id,from:o.provider,email:emailOf(o.provider),when:fmtDT(o.created_at),items:o.items||[],list:+o.list||0,offer:+o.offer,note:o.note,status:o.status,kind:o.kind,action:o.status==="new"?null:o.action,counterAmt:o.counter_amt!=null?+o.counter_amt:null,draftText:o.status==="new"?null:o.draft_text,sent:o.status!=="new",decided:o.decided_at?fmtD(new Date(o.decided_at))+(o.decided_by?" by "+o.decided_by:""):""}));
  setRegions();
}
async function reloadTeam(){const {data,error}=await sb.rpc("partners_team_data");if(!error&&data){applyTeamData(data);render()}}

function gate(){
  $("topbar").innerHTML="";
  $("forwho").innerHTML="";$("stats").innerHTML="";$("rail").innerHTML="";
  document.querySelector("header.top h1").textContent="Partner portal";
  $("main").innerHTML=`<section class="panel gate"><h2>Welcome to Nomadwise Partners</h2>
    <p><b>Already a partner?</b> Open the private link provided to you.</p>
    <div class="acts" style="margin-top:4px"><button class="btn small ghost" id="g-in">Team sign in</button></div></section>`;
  $("grid").style.gridTemplateColumns="minmax(0,1fr)";
  $("g-in").addEventListener("click",signIn);
}
function message(title,body,signedIn){
  $("forwho").innerHTML="";$("stats").innerHTML="";$("rail").innerHTML="";
  $("grid").style.gridTemplateColumns="minmax(0,1fr)";
  $("main").innerHTML=`<section class="panel gate"><h2>${esc(title)}</h2><p class="muted">${esc(body)}</p>${signedIn?`<div class="acts"><button class="btn" id="g-out">Sign out</button></div>`:""}</section>`;
  if(signedIn)$("g-out").addEventListener("click",signOut);
}
async function signIn(){
  const {error}=await sb.auth.signInWithOAuth({provider:"google",options:{redirectTo:location.origin+location.pathname}});
  if(error)toast("Sign in didn't start: "+error.message);
}
async function signOut(){await sb.auth.signOut();location.replace(location.origin+location.pathname)}

// ---------- offers (team) ----------
function invoice(o){
  let sub=0,elig=0,eligVal=0,priced=true;
  const rows=o.items.map(it=>{
    const m=String(it).match(/^(.*) · (1st|2nd)$/);const a=m&&ARTS.find(x=>x.name===m[1]);
    if(a){const pos=m[2]==="1st"?1:2,p=priceOf(a,pos),t=grp(a).name;sub+=p;if((S.discTiers||[]).includes(t)){elig++;eligVal+=p}return `<tr><td>${esc(a.name)}</td><td>${m[2]}</td><td>${esc(t)}</td><td class="num">${eur(p)}</td></tr>`}
    const r=String(it).match(/^Review article × (\d+)$/);if(r){const p=S.review*+r[1];sub+=p;return `<tr><td>Review article × ${r[1]}</td><td>Add-on</td><td>–</td><td class="num">${eur(p)}</td></tr>`}
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
const firstName=o=>o.from.replace(/ \(.*\)$/,"");
const itemLines=o=>o.items.map(it=>{const m=String(it).match(/^(.*) · (1st|2nd)$/);return "- "+(m?m[1]+", "+m[2]+" position":it)}).join("\n");
const holdDate=()=>{const d=new Date(TODAY);d.setDate(d.getDate()+7);return fmtD(d)};
function draftFor(o){
  const n=firstName(o),sig="\n\nBest,\nThe Nomadwise team";
  if(o.kind==="proposal"){
    if(o.action==="accept")return `Hi ${n} team,\n\nThanks for confirming the 2027 proposal at ${eur(o.offer/12)} a month:\n${itemLines(o)}\n\nWe'll send the agreement over shortly, and everything carries on without a break from 1 January.`+sig;
    if(o.action==="counter")return `Hi ${n} team,\n\nThanks for coming back on the 2027 proposal. Before we confirm, we'd like to suggest ${eur(o.counterAmt/12)} a month for:\n${itemLines(o)}\n\nJust reply here and we'll send the agreement.`+sig;
    return `Hi ${n} team,\n\nThanks for coming back on the 2027 proposal. Unfortunately we can't go ahead on these terms. Happy to talk through options, just reply here.`+sig;
  }
  if(o.action==="accept")return `Hi ${n} team,\n\nThanks for your offer. We're happy to accept ${eur(o.offer)} for these placements:\n${itemLines(o)}\n\nEach placement runs for 12 months from the day it goes live. We'll send the invoice shortly, and the placements go live once it's paid.`+sig;
  if(o.action==="counter")return `Hi ${n} team,\n\nThanks for your offer of ${eur(o.offer)}. We can't go quite that low for this package, but we can do ${eur(o.counterAmt)} for:\n${itemLines(o)}\n\nWe're holding these placements for you until ${holdDate()}. Reply here to accept, or send a new offer from your partner page.`+sig;
  return `Hi ${n} team,\n\nThanks for your offer of ${eur(o.offer)}. Unfortunately we can't accept it for this package.\n\nIf it helps, you could choose a smaller selection at the listed price${o.items.some(it=>/ · 1st$/.test(it))?", or look at 2nd positions on the same articles":""}. Your partner page shows everything that's open, and you're welcome to send a new offer.`+sig;
}
function openMail(to,subject,body){
  const addr=/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(to||"")?to:"";
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
    ${o.email?"":`<p class="note"><b>No email saved for ${esc(o.from)}.</b> Add it under Who has access, or type it into your email app.</p>`}
    <label class="eyebrow" for="dt-${i}">Draft reply to the provider · edit freely</label><textarea class="draft" id="dt-${i}" data-dt="${i}" rows="12">${esc(o.draftText??(o.draftText=draftFor(o)))}</textarea>
    <div class="acts"><button class="btn small primary" data-send="${i}">Approve and open in email</button><button class="btn small ghost" data-back="${i}">Back</button></div></div>`;
}
function chipList(names){
  const g={};names.forEach(n=>{const r=regionOf[n]||"Other";(g[r]=g[r]||[]).push(n)});
  return `<div class="clist">${REGION_ORDER.concat("Other").filter(r=>g[r]).map(r=>`<div class="cgrp"><span class="eyebrow">${esc(r)} · ${g[r].length}</span><div class="chips">${g[r].sort((a,b)=>a.replace(/^The /,"").localeCompare(b.replace(/^The /,""))).map(n=>`<span class="chip">${esc(n)}</span>`).join("")}</div></div>`).join("")}</div>`;
}
const fold=(id,title,inner)=>`<details class="fold" id="${id}" ${openD.has(id)?"open":""}><summary>${title}<span class="tag-internal">Team only</span></summary><div class="fold-in">${inner}</div></details>`;
const renewable=m=>m.st.fr||m.st.due||m.st.soon;
const ptot=c=>c.base+[...propOpt].reduce((t,o)=>t+((c.prices||{})[o]||0),0);
const key=(a,pos)=>a.name+" · "+(pos===1?"1st":"2nd");
const viewer=()=>mode==="team"?null:asProv;

// ---------- render ----------
function render(){
  $("grid").style.gridTemplateColumns="";
  const v=viewer();
  if(ROLE==="team"){
    $("topbar").innerHTML=`<span>Signed in as ${esc(ME)}</span><button id="out">Sign out</button>`;
    $("out").addEventListener("click",signOut);
    const opts=PROVIDERS.map(p=>p.name).concat("__new");
    $("switch").innerHTML=`<div class="switch" role="group" aria-label="View switch"><span class="eyebrow">View</span>
      <div class="seg"><button id="v-team" aria-pressed="${mode==="team"}">Nomadwise team</button><button id="v-prov" aria-pressed="${mode!=="team"}">See a provider's page</button></div>
      <select id="as-prov" aria-label="Preview as provider" ${mode==="team"?"disabled":""}>${opts.map(n=>`<option value="${esc(n)}" ${n===asProv?"selected":""}>${n==="__new"?"as a new provider":"as "+esc(n)}</option>`).join("")}</select>
      <span class="muted">${mode==="team"?"Only you and Leonie see this view.":"Preview only. This is what their private link shows."}</span></div>`;
    $("v-team").addEventListener("click",()=>{mode="team";render()});
    $("v-prov").addEventListener("click",()=>{mode="prov";resetSel();render()});
    $("as-prov").addEventListener("change",e=>{asProv=e.target.value;resetSel();render()});
  }
  $("forwho").innerHTML=v===null?"<b>Team view</b> · visible only to Nomadwise":(v==="__new"?"Prepared for <b>a new partner</b>":"Prepared for <b>"+esc(v)+"</b>");
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

function teamPanels(){
  let paid=0,inRen=0,res=0,open=0,total=0;
  ARTS.forEach(a=>a.slots.forEach(s=>{total++;const st=status(a,s,null);
    if(st.k==="taken")paid++;else if(st.due)inRen++;else if(st.k==="reserved")res++;else if(st.k==="available")open++;}));
  const pct=n=>total?Math.round(n/total*100):0;
  const byP={};
  ARTS.forEach(a=>a.slots.forEach(s=>{const st=status(a,s,null);
    if(s.prov&&st.exp&&(st.due||st.soon)){(byP[s.prov]=byP[s.prov]||[]).push({a,s,st})}}));
  const provs=Object.keys(byP).sort((x,y)=>byP[y].length-byP[x].length);
  const how=`<section class="panel internal"><div class="phead"><h2 class="dup">How this works<span class="tag-internal">Team only</span></h2></div>
    <ol class="how">
      <li><b>One master list</b><span>Who holds which slot comes from the Notion placements table. Prices and rules are edited here, under Prices and rules.</span></li>
      <li><b>Private links</b><span>Each provider gets their own link from Who has access. It shows open slots, prices and their own placements. Never other providers' names, prices or per-article numbers. A link can be switched off at any time.</span></li>
      <li><b>They pick and offer</b><span>Providers tick slots and add-ons, see the list total, and send one package offer. No auction, no automatic replies.</span></li>
      <li><b>We decide</b><span>Offers land in the inbox here. Accept, counter or decline drafts a reply. Nothing is sent until one of us approves it, and approving opens it in your email app. We aim to reply within 2 working days.</span></li>
      <li><b>Renewals</b><span>Placements ending in the next 90 days appear under Renewals due. Draft a reminder, edit it, approve it. An ended slot is held for its provider for 60 days, then opens.</span></li>
    </ol></section>`;
  const kpi=`<section class="panel internal"><div class="phead"><h2>Inventory<span class="tag-internal">Team only</span></h2><span class="muted mono">${total} slots</span></div>
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
  const inbox=`<section class="panel internal"><div class="phead"><h2>Offers inbox<span class="tag-internal">Team only</span></h2><span class="muted">${openO.length} open</span></div>
    <div class="queue">${openO.map(oCard).join("")||'<p class="muted" style="font-size:.9rem">No open offers. New ones appear here as soon as a provider sends one.</p>'}</div>
    ${doneO.length?`<details id="d-done" ${openD.has("d-done")?"open":""}><summary style="cursor:pointer;font-weight:600">Answered · ${doneO.length}</summary><div class="queue" style="margin-top:8px">${doneO.map(oCard).join("")}</div></details>`:""}</section>`;
  const ren=`<section class="panel internal"><div class="phead"><h2>Renewals due<span class="tag-internal">Team only</span></h2><span class="muted">Next 90 days and recently ended</span></div>
    <div class="queue">${provs.map(p=>{const L=byP[p];
      const total=L.reduce((t,x)=>t+priceOf(x.a,x.s.pos),0);
      const c=S.contracts[p];const groups={};L.forEach(x=>{const k=x.s.exp;(groups[k]=groups[k]||[]).push(x)});
      const rem=REMS[p];const em=(PROVIDERS.find(x=>x.name===p)||{}).contact_email;
      const gl=Object.keys(groups).sort().map(k=>{const G=groups[k],e=D(k),past=e<TODAY;const hold=new Date(e);hold.setDate(hold.getDate()+60);
        return `<details class="rg"><summary><span class="pill ${past?"due":"soon"}">${past?"Ended "+fmtD(e):"Ends "+fmtD(e)}</span> ${G.length} ${G.length===1?"slot":"slots"}${past?" · held for them until "+fmtD(hold):""}</summary><p class="note" style="margin-top:6px">${G.map(x=>esc(x.a.name)+" "+(x.s.pos===1?"1st":"2nd")).join(", ")}</p></details>`}).join("");
      return `<div class="qi"><div class="h"><b>${esc(p)}</b><span class="muted" style="font-size:.84rem">${L.length} ${L.length===1?"slot":"slots"} to renew</span></div>
      <div class="facts">
        <div><span class="eyebrow">Pays now</span><span>${c&&c.current?`<b>${eur(c.current.monthly)} a month</b> (${eur(c.current.monthly*12)} a year), contract to ${esc(c.current.until)}`:`<span class="muted">Not recorded yet. Add it to the Price column in Notion</span>`}</span></div>
        ${c?`<div><span class="eyebrow">Our 2027 proposal</span><span><b>${eur(c.base)} a month</b> core, up to ${eur(c.base+Object.values(c.prices||{}).reduce((a,b)=>a+b,0))} with all optional countries</span></div>`:""}
        <div><span class="eyebrow">Same slots at list price</span><span>${eur(total)} a year${c&&c.current?` <span class="muted">(their contract is ${Math.round(c.current.monthly*12/total*100)}% of this)</span>`:""}</span></div>
      </div>
      <div class="rgs">${gl}</div>
      ${drafts[p]!=null?`<textarea class="draft" id="rd-${slug(p)}" data-rd="${esc(p)}" rows="10" aria-label="Draft reminder to ${esc(p)}">${esc(drafts[p])}</textarea>${em?"":`<p class="note">No email saved for ${esc(p)}. Add it under Who has access.</p>`}`:""}
      <div class="acts">${drafts[p]!=null?`<button class="btn small primary" data-ap="${esc(p)}">Approve and open in email</button><button class="btn small ghost" data-rdx="${esc(p)}">Discard draft</button>`:`<button class="btn small" data-dr="${esc(p)}">Draft reminder</button>`}${rem&&rem.sent_at?`<span class="pill ok">Reminder sent ${fmtD(new Date(rem.sent_at))}</span>`:""}</div></div>`}).join("")||'<p class="muted" style="font-size:.9rem">Nothing ends in the next 90 days.</p>'}</div></section>`;
  const prices=`<section class="panel internal"><div class="phead"><h2 class="dup">Prices and rules<span class="tag-internal">Team only</span></h2><span class="muted">Changes save straight away and show on every provider's page</span></div>
    <div class="scroll"><table class="tbl"><thead><tr><th>Tier</th><th>Clicks a year</th><th>1st position</th><th>2nd position</th></tr></thead><tbody>
    ${S.tiers.map((t,i)=>`<tr><td><b>${esc(t.name)}</b></td><td class="muted">${esc(t.desc)}</td><td>€ <input id="t${i}p1" data-t="${i}|p1" type="number" min="0" value="${t.p1}"></td><td>€ <input id="t${i}p2" data-t="${i}|p2" type="number" min="0" value="${t.p2}"></td></tr>`).join("")}
    ${Object.keys(S.setPrices||{}).map(n=>`<tr><td><b>${esc(n)}</b></td><td class="muted">Set price, overrides its tier</td><td>€ <input id="sp-${slug(n)}" data-sp="${esc(n)}|p1" type="number" min="0" value="${S.setPrices[n].p1}"></td><td>${S.setPrices[n].p2!=null?`€ <input id="sp2-${slug(n)}" data-sp="${esc(n)}|p2" type="number" min="0" value="${S.setPrices[n].p2}">`:'<span class="muted">Tier price</span>'}</td></tr>`).join("")}
    <tr><td><b>Review article</b></td><td class="muted">Dedicated add-on</td><td colspan="2">€ <input id="rv" data-s="review" type="number" min="0" value="${S.review}"></td></tr>
    <tr><td><b>Package discount</b></td><td class="muted">Premium and Standard only</td><td colspan="2"><input id="dm" data-s="discMin" type="number" min="1" value="${S.discMin}"> slots or more get <input id="dp" data-s="discPct" type="number" min="0" max="50" value="${S.discPct}"> % off</td></tr>
    </tbody></table></div></section>`;
  const base=location.origin+location.pathname;
  const acc=`<section class="panel internal"><div class="phead"><h2 class="dup">Who has access<span class="tag-internal">Team only</span></h2></div>
    <h3>Providers</h3>
    <p class="note">Copy a provider's private link and send it to them. If a link gets passed around, make a new one: the old link stops working straight away.</p>
    <div class="scroll"><table class="tbl"><thead><tr><th>Provider</th><th>Email for replies</th><th>Last visit</th><th>Private link</th><th>On</th></tr></thead><tbody>
    ${PROVIDERS.map(p=>`<tr><td><b>${esc(p.name)}</b></td><td><input class="wide" type="email" data-pe="${esc(p.name)}" value="${esc(p.contact_email||"")}" placeholder="name@provider.com" aria-label="Email for ${esc(p.name)}"></td>
      <td class="muted">${p.last_seen?fmtD(new Date(p.last_seen)):"Not yet"}</td>
      <td><div class="linkcell"><button class="btn small" data-copy="${esc(base+"#k="+p.token)}" ${p.active?"":"disabled"}>Copy link</button><button class="btn small ghost" data-newlink="${p.id}">New link</button></div></td>
      <td><input type="checkbox" data-act="${p.id}" ${p.active?"checked":""} aria-label="Link on for ${esc(p.name)}" style="width:auto"></td></tr>`).join("")}
    </tbody></table></div>
    <form class="access-add" id="provform"><input id="np-name" placeholder="Provider name, e.g. Airalo" aria-label="Provider name" required><input id="np-email" type="email" placeholder="Their email (optional)" aria-label="Provider email"><button class="btn small primary" type="submit">Add provider</button></form>
    <h3 style="margin-top:8px">Team</h3>
    <p class="note">Anyone signed in with the Nomadwise Google account can use this view, plus these emails:</p>
    <div class="chips">${TEAM.map(e=>`<span class="chip">${esc(e)} <button class="x" data-rmteam="${esc(e)}" aria-label="Remove ${esc(e)}" style="border:0;background:none;color:inherit;padding:0 0 0 4px">×</button></span>`).join("")||'<span class="muted" style="font-size:.86rem">None added yet.</span>'}</div>
    <form class="access-add" id="teamform"><input id="nt-email" type="email" placeholder="Leonie's Google email" aria-label="Team email" required><button class="btn small" type="submit">Add to team</button></form>
    <p class="note">Providers never see anything marked Team only.</p></section>`;
  const order=["Top page"].concat(S.tiers.map(t=>t.name));const cg={};const capT=[0,0,0],openT=[0,0,0],cnt={};
  ARTS.forEach(a=>{const n=grp(a).name;cg[n]=cg[n]||[0,0,0];cnt[n]=(cnt[n]||0)+1;a.slots.forEach(s=>{const p=priceOf(a,s.pos);cg[n][s.pos]+=p;capT[s.pos]+=p;if(status(a,s,null).k==="available")openT[s.pos]+=p})});
  const cap=`<section class="panel internal"><div class="phead"><h2>Capacity if 100% sold<span class="tag-internal">Team only</span></h2><span class="muted">At list prices, per year</span></div>
    <div class="kpis"><div class="kpi"><div class="v">${eur(capT[1])}</div><div class="l">All 1st positions</div></div><div class="kpi"><div class="v">${eur(capT[2])}</div><div class="l">All 2nd positions</div></div><div class="kpi"><div class="v">${eur(capT[1]+capT[2])}</div><div class="l">Total</div></div></div>
    <div class="scroll"><table class="tbl"><thead><tr><th>Tier</th><th>Articles</th><th>1st</th><th>2nd</th><th>Total</th></tr></thead><tbody>
    ${order.filter(n=>cg[n]).map(n=>`<tr><td><b>${esc(n)}</b></td><td class="mono">${cnt[n]}</td><td class="mono">${eur(cg[n][1])}</td><td class="mono">${eur(cg[n][2])}</td><td class="mono">${eur(cg[n][1]+cg[n][2])}</td></tr>`).join("")}
    <tr><td><b>Open now</b></td><td></td><td class="mono">${eur(openT[1])}</td><td class="mono">${eur(openT[2])}</td><td class="mono">${eur(openT[1]+openT[2])}</td></tr></tbody></table></div>
    <p class="note">Contract deals are priced separately, so actual revenue on those slots differs from list.</p></section>`;
  return `<p class="note" style="margin-top:-8px">Two things need us: offers and renewals. Everything else is folded away below.</p>`+inbox+ren+fold("d-how","How this works",how)+fold("d-num","Inventory and capacity",kpi+cap)+fold("d-pr","Prices and rules",prices)+fold("d-acc","Who has access",acc);
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
    const ex=contract.filter(m=>(c.exclusive||[]).includes(m.a.name)),nx=contract.filter(m=>!(c.exclusive||[]).includes(m.a.name));
    const accept=propAccepted?`<div class="done"><b>Proposal accepted.</b> €${ptot(c)} a month${propOpt.size?", including "+[...propOpt].join(", "):""}. We'll send the agreement to confirm.${ROLE==="team"?' <span class="muted">Preview only, nothing was sent.</span>':""}</div>`
      :(propConfirm?`<div class="step"><b>Accept the 2027 proposal at €${ptot(c)} a month?</b><p class="note">${propOpt.size?"Including "+[...propOpt].join(", ")+". ":"Core renewal only, no optional countries. "}We'll confirm by email and send the agreement.</p><div class="acts"><button class="btn primary" id="prop-yes" ${sending?"disabled":""}>Yes, accept</button><button class="btn ghost" id="prop-back">Back</button></div></div>`
      :`<div class="acts"><button class="btn primary" id="prop-ok">Accept this proposal</button></div><p class="note">Questions or changes? Just reply to our email.</p>`);
    return `<section class="panel"><div class="phead"><h2>${esc(c.title)}</h2><span class="muted">${contract.length} contract articles</span></div>
    <p class="muted">${esc(c.term)}</p>
    <div class="cur">${(c.lines||[]).map(l=>`<div class="ci" style="grid-template-columns:minmax(0,1fr) auto"><span>${esc(l[0].replace("{n}",contract.length))}</span><span class="mono">${esc(l[1])}</span></div>`).join("")}
      <details class="ci" style="display:block"><summary style="cursor:pointer;font-size:.88rem"><b>Exclusive 1st position · ${ex.length}</b> <span class="muted">no other eSIM can take 1st</span></summary>${chipList(ex.map(m=>m.a.name))}</details>
      <details class="ci" style="display:block"><summary style="cursor:pointer;font-size:.88rem"><b>1st position by default, non-exclusive · ${nx.length}</b> <span class="muted">first refusal if another provider asks, at up to €300–350</span></summary>${chipList(nx.map(m=>m.a.name))}</details>
      ${c.banners?`<div class="ci" style="grid-template-columns:minmax(0,1fr);font-size:.88rem"><span><b>Coworking banners</b> <span class="muted">${esc(c.banners)}</span></span></div>`:""}
    <div class="ci" style="grid-template-columns:minmax(0,1fr)"><span class="eyebrow">Optional 1st positions · tick the ones you want</span></div>
    ${(c.options||[]).map(o=>`<label class="ci"><input type="checkbox" id="po-${slug(o)}" data-po="${esc(o)}" ${propOpt.has(o)?"checked":""} ${propAccepted?"disabled":""}><span>${esc(o)} 1st</span><span class="mono">+€${c.prices[o]} a month</span></label>`).join("")}
    <div class="ci" style="grid-template-columns:minmax(0,1fr) auto;font-weight:600"><span>Your total${propOpt.size?" with "+propOpt.size+" optional":""}</span><span class="mono">€${ptot(c)} a month</span></div></div>
    ${accept}
    ${other.length?`<details style="border-top:1px solid var(--line);padding-top:10px"><summary style="cursor:pointer;font-weight:600">Also yours, outside this contract · ${other.length} placements, ending ${fmtM(other[0].st.exp)} to ${fmtM(other[other.length-1].st.exp)}</summary><div class="cur" style="margin-top:8px">${other.map(m=>`<div class="ci" style="grid-template-columns:minmax(0,1fr) auto"><span>${esc(m.a.name)} · ${m.s.pos===1?"1st":"2nd"}</span><span class="pill ok">Runs to ${fmtD(m.st.exp)}</span></div>`).join("")}</div><p class="note">Paid separately and unchanged by this proposal. They can join the contract when each one ends.</p></details>`:""}
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

function inventoryPanel(v){
  const team=v===null;
  const list=ARTS.filter(a=>{
    if(filt.q && !a.name.toLowerCase().includes(filt.q.toLowerCase())) return false;
    if(filt.tier && grp(a).name!==filt.tier) return false;
    if(filt.regions.size && !filt.regions.has(regionOf[a.name])) return false;
    if(filt.avail && !a.slots.some(s=>status(a,s,v).sel)) return false;
    return true;
  }).sort((x,y)=>grp(x).rank-grp(y).rank||x.name.replace(/^The /,"").localeCompare(y.name.replace(/^The /,"")));
  let lastG="";
  const tiers=`<div class="tiers">${S.tiers.map(t=>`<div class="tier"><span class="n">${esc(t.name)}</span><span class="r">${esc(t.desc)}</span><div class="pp"><span class="pc"><span class="pl">1st</span><span class="pv">${eur(t.p1)}</span></span><span class="pc"><span class="pl">2nd</span><span class="pv">${eur(t.p2)}</span></span></div></div>`).join("")}</div>`;
  const regs=REGION_ORDER.filter(r=>ARTS.some(a=>regionOf[a.name]===r));
  return `<section class="panel"><div class="phead"><h2>${team?"All placements":"Available placements"}</h2><span class="muted">12-month term · prices per year</span></div>
    ${team?`<p class="note">Views and clicks to eSIM providers over the last 12 months, measured on nomadwise.io. Click rate is clicks per page view. Team only: providers see the tier, not these figures.</p>`:""}
    ${tiers}
    <div class="legend"><span><i class="dot" style="background:var(--accent)"></i>Available</span><span><i class="dot" style="background:var(--mine)"></i>Yours</span><span><i class="dot" style="background:var(--amber)"></i>Reserved</span><span><i class="dot" style="background:var(--taken)"></i>Unavailable</span></div>
    <div class="regs" role="group" aria-label="Filter by region"><button class="reg" data-reg="" aria-pressed="${!filt.regions.size}">All regions</button>${regs.map(r=>`<button class="reg" data-reg="${esc(r)}" aria-pressed="${filt.regions.has(r)}">${esc(r)} <span class="mono">${ARTS.filter(a=>regionOf[a.name]===r).length}</span></button>`).join("")}</div>
    <div class="filters"><input type="search" id="f-q" placeholder="Search a country or city" value="${esc(filt.q)}" aria-label="Search articles">
      <select id="f-tier" aria-label="Tier"><option value="">All tiers</option>${["Top page"].concat(S.tiers.map(t=>t.name)).map(n=>`<option ${filt.tier===n?"selected":""}>${esc(n)}</option>`).join("")}</select>
      ${team?"":`<label class="chk"><input type="checkbox" id="f-avail" ${filt.avail?"checked":""}> Only what I can pick</label>`}</div>
    <div class="rows">${list.map(a=>{const t=tierOf(a);const g=grp(a).name;const head=g!==lastG?`<div class="ghead"><span>${esc(g)}</span><span class="muted mono">${list.filter(x=>grp(x).name===g).length}</span></div>`:"";lastG=g;
      return head+`<div class="row"><div class="art"><span class="nm">${esc(a.name)}</span><span class="meta"><span class="tchip ${(S.setPrices||{})[a.name]?"Premium":esc(t.name)}">${esc(g)}</span>${team?`<span class="mono">${a.views.toLocaleString("en-GB")} views</span><span class="mono">${a.clicks.toLocaleString("en-GB")} clicks</span>${a.views>=50?`<span class="mono">${Math.round(a.clicks/a.views*100)}% click rate</span>`:""}`:""}</span></div>
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
    return `<button class="seat mine${renew?" renew":""}${on?" selected":""}" ${canR?`data-k="${esc(k)}" aria-pressed="${on}"`:"disabled"} title="${esc(c&&renew?"Renew through your 2027 proposal":lab+", "+sub)}">${pos}<span class="st">${esc(lab)}</span>${right}<span class="sub">${esc(sub)}</span></button>`;}
  const cls=st.k+(on?" selected":"")+(team?" plain":"");
  const canSel=st.sel && !team && !submitted;
  return `<button class="seat ${cls}" ${canSel?`data-k="${esc(k)}" aria-pressed="${on}"`:"disabled"} title="${esc(st.label)}">
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
  if(v===null) return `<section class="panel internal"><h3>Team view<span class="tag-internal">Team only</span></h3>
    <p class="muted" style="font-size:.9rem">Provider names and contract notes show in purple under each slot. Use “See a provider's page” at the top to check exactly what a provider sees.</p></section>`;
  const T=totals();
  if(submitted) return `<section class="panel" id="selp"><h2>Your offer</h2><div class="done"><b>Offer sent to Nomadwise${submitted.when?" on "+fmtD(new Date(submitted.when)):""}.</b><br>${submitted.items.length} ${submitted.items.length===1?"item":"items"}, offer ${eur(submitted.offer)}. We'll reply within 2 working days. You can send a new offer once we've answered this one.</div>
    ${ROLE==="team"?`<p class="note">Preview only. Nothing was sent.</p><button class="btn small" id="reset">Reset preview</button>`:""}</section>`;
  const items=[...sel.entries()];
  return `<section class="panel" id="selp"><div class="phead"><h2>Your selection</h2><span class="muted">${T.slots} placements</span></div>
    ${items.length||reviews?`<div class="sel-list">${items.map(([k,x])=>`<div class="sel-item"><span>${esc(k)}${x.kind==="renew"?' <span class="muted">renewal</span>':""}</span><span class="mono">${eur(x.price)}</span><button class="x" data-rm="${esc(k)}" aria-label="Remove ${esc(k)}">×</button></div>`).join("")}
      ${reviews?`<div class="sel-item"><span>Review article × ${reviews}</span><span class="mono">${eur(T.addons)}</span><span></span></div>`:""}</div>`:`<p class="muted" style="font-size:.9rem">Tap an available slot to add it. Your current placements can be renewed from the list on the left.</p>`}
    <div class="sum"><span>List price</span><span class="mono">${eur(T.list+T.addons)}</span></div>
    ${T.disc?`<div class="sum"><span>Package discount (${T.elig} Premium or Standard, ${S.discPct}%)</span><span class="mono">−${eur(T.disc)}</span></div>`:`<div class="note">${S.discMin} or more Premium or Standard placements: ${S.discPct}% off those placements.${T.elig?" You have "+T.elig+".":""}</div>`}
    <div class="sum total"><span>Package price</span><span class="mono">${eur(T.total)}</span></div>
    <form id="offer" class="col" style="gap:10px">
      <label class="fl">Your offer for the package (€)<input id="o-amt" type="number" min="1" inputmode="numeric" value="${T.total||""}" required></label>
      <label class="fl">Note for the Nomadwise team (optional)<textarea id="o-note" rows="2" maxlength="3000"></textarea></label>
      <button class="btn primary" type="submit" ${(T.slots||reviews)&&!sending?"":"disabled"}>${sending?"Sending…":"Send offer"}</button>
      <p class="note">One open offer at a time. We reply within 2 working days with an answer or a counter.</p>
    </form></section>`;
}

function mbar(){
  const v=viewer();const T=totals();
  const show=v!==null&&!submitted&&(T.slots||reviews);
  $("mbar").hidden=!show;
  if(show)$("mbar-t").textContent=T.slots+" placements · "+eur(T.total);
}

function toggle(k){
  if(sel.has(k)){sel.delete(k);return}
  const [name,p]=k.split(" · ");const a=ARTS.find(x=>x.name===name);const pos=p==="1st"?1:2;
  const st=status(a,a.slots[pos-1],viewer());
  sel.set(k,{price:priceOf(a,pos),kind:st.k==="mine"?"renew":"new",tier:grp(a).name});
}

// ---------- saving ----------
let saveT;
function saveSettings(){
  clearTimeout(saveT);
  saveT=setTimeout(async()=>{const s=Object.assign({},S);delete s.contracts;
    const {error}=await sb.rpc("partners_team_save_settings",{p_s:s});
    toast(error?"Couldn't save. Check your connection and try again.":"Saved. Provider pages now show the new prices.")},500);
}
async function submitOffer(items,list,amt,note,kind){
  if(ROLE!=="provider"){ // team preview: never sent
    offers.unshift({preview:true,from:asProv==="__new"?"New partner":asProv,email:"",when:"Just now",items,list,offer:amt,note,status:"new",kind,sent:false});
    return true;
  }
  sending=true;render();
  const {error}=await sb.rpc("partners_submit_offer",{p_token:TOKEN,p_kind:kind,p_items:items,p_list:list,p_offer:amt,p_note:note||""});
  sending=false;
  if(error){toast(error.message||"Couldn't send. Please try again.");render();return false}
  return true;
}

function bind(){
  document.querySelectorAll("[data-k]").forEach(el=>{
    el.addEventListener(el.type==="checkbox"?"change":"click",()=>{toggle(el.dataset.k);render()});
  });
  document.querySelectorAll("[data-rm]").forEach(el=>el.addEventListener("click",()=>{sel.delete(el.dataset.rm);render()}));
  const q=$("f-q");if(q)q.addEventListener("input",()=>{filt.q=q.value;const pos=q.selectionStart;render();const n=$("f-q");n.focus();n.setSelectionRange(pos,pos)});
  const ft=$("f-tier");if(ft)ft.addEventListener("change",()=>{filt.tier=ft.value;render()});
  document.querySelectorAll("[data-reg]").forEach(el=>el.addEventListener("click",()=>{const r=el.dataset.reg;if(r==="")filt.regions.clear();else if(filt.regions.has(r))filt.regions.delete(r);else filt.regions.add(r);render()}));
  const fa=$("f-avail");if(fa)fa.addEventListener("change",()=>{filt.avail=fa.checked;render()});
  const rm=$("rv-m"),rp=$("rv-p");
  if(rm)rm.addEventListener("click",()=>{if(!submitted&&reviews>0){reviews--;render()}});
  if(rp)rp.addEventListener("click",()=>{if(!submitted&&viewer()!==null){reviews++;render()}});
  document.querySelectorAll("details.qi,details.fold,#d-done").forEach(d=>d.addEventListener("toggle",()=>{if(d.open)openD.add(d.id);else openD.delete(d.id)}));
  const lt=$("later");if(lt)lt.addEventListener("toggle",()=>{laterOpen=lt.open});
  const ra=$("renall");if(ra)ra.addEventListener("click",()=>{
    const v=viewer();const mine=[];ARTS.forEach(a=>a.slots.forEach(s=>{const st=status(a,s,v);if(st.k==="mine"&&renewable({st}))mine.push(key(a,s.pos))}));
    const all=mine.every(k=>sel.has(k));mine.forEach(k=>{if(all)sel.delete(k);else if(!sel.has(k))toggle(k)});render()});
  const of=$("offer");if(of)of.addEventListener("submit",async e=>{e.preventDefault();if(sending)return;
    const amt=+$("o-amt").value;if(!amt)return;const T=totals();const note=$("o-note").value;
    const items=[...sel.keys()].concat(reviews?["Review article × "+reviews]:[]);
    if(await submitOffer(items,T.list+T.addons,amt,note,"offer")){submitted={offer:amt,when:new Date().toISOString(),items};render();window.scrollTo({top:0,behavior:"smooth"})}});
  const rs=$("reset");if(rs)rs.addEventListener("click",()=>{resetSel();render()});
  document.querySelectorAll("[data-poseat]").forEach(el=>el.addEventListener("click",()=>{const o=el.dataset.poseat;if(propOpt.has(o))propOpt.delete(o);else propOpt.add(o);render()}));
  document.querySelectorAll("[data-po]").forEach(el=>el.addEventListener("change",()=>{const o=el.dataset.po;if(el.checked)propOpt.add(o);else propOpt.delete(o);render()}));
  const pk=$("prop-ok");if(pk)pk.addEventListener("click",()=>{propConfirm=true;render()});
  const pb=$("prop-back");if(pb)pb.addEventListener("click",()=>{propConfirm=false;render()});
  const py=$("prop-yes");if(py)py.addEventListener("click",async()=>{const c=S.contracts[asProv];const m=ptot(c);
    const items=["Core renewal, €"+c.base+" a month"].concat([...propOpt].map(o=>o+" 1st"));
    if(await submitOffer(items,m*12,m*12,"Accepted at €"+m+" a month","proposal")){propAccepted=true;propConfirm=false;render()}});
  // team: prices
  document.querySelectorAll("[data-t]").forEach(el=>el.addEventListener("change",()=>{const [i,f]=el.dataset.t.split("|");S.tiers[+i][f]=Math.max(0,+el.value||0);saveSettings();render()}));
  document.querySelectorAll("[data-sp]").forEach(el=>el.addEventListener("change",()=>{const [n,f]=el.dataset.sp.split("|");S.setPrices[n][f]=Math.max(0,+el.value||0);saveSettings();render()}));
  document.querySelectorAll("[data-s]").forEach(el=>el.addEventListener("change",()=>{S[el.dataset.s]=Math.max(0,+el.value||0);saveSettings();render()}));
  // team: offers
  document.querySelectorAll("[data-oa]").forEach(el=>el.addEventListener("click",()=>{const [i,k]=el.dataset.oa.split("|");const o=offers[+i];o.action=k;o.counterAmt=o.counterAmt||o._pkg;o.draftText=null;o.counterDrafted=false;openD.add("of-"+(o.id||i));render()}));
  document.querySelectorAll("[data-cd]").forEach(el=>el.addEventListener("click",()=>{const i=+el.dataset.cd,o=offers[i];o.counterAmt=Math.max(1,+$("ca-"+i).value||o._pkg);o.counterDrafted=true;o.draftText=null;render()}));
  document.querySelectorAll("[data-back]").forEach(el=>el.addEventListener("click",()=>{const o=offers[+el.dataset.back];o.action=null;o.counterDrafted=false;o.draftText=null;render()}));
  document.querySelectorAll("[data-dt]").forEach(el=>el.addEventListener("input",()=>{offers[+el.dataset.dt].draftText=el.value}));
  document.querySelectorAll("[data-send]").forEach(el=>el.addEventListener("click",async()=>{const o=offers[+el.dataset.send];
    if(o.preview){o.sent=true;render();return}
    const st={accept:"accepted",counter:"countered",decline:"declined"}[o.action];
    const {error}=await sb.rpc("partners_team_offer",{p_id:o.id,p_action:o.action,p_counter:o.action==="counter"?o.counterAmt:null,p_draft:o.draftText,p_status:st});
    if(error){toast("Couldn't save: "+error.message);return}
    openMail(o.email,o.kind==="proposal"?"Your Nomadwise 2027 proposal":"Your Nomadwise placement offer",o.draftText);
    o.sent=true;o.decided=fmtD(TODAY)+" by "+ME;render()}));
  document.querySelectorAll("[data-undo]").forEach(el=>el.addEventListener("click",async()=>{const o=offers[+el.dataset.undo];
    if(!o.preview){const {error}=await sb.rpc("partners_team_offer",{p_id:o.id,p_action:null,p_counter:null,p_draft:null,p_status:"new"});if(error){toast("Couldn't save: "+error.message);return}}
    o.action=null;o.sent=false;o.counterDrafted=false;o.draftText=null;render()}));
  // team: reminders
  document.querySelectorAll("[data-rd]").forEach(el=>el.addEventListener("input",()=>{drafts[el.dataset.rd]=el.value}));
  document.querySelectorAll("[data-rdx]").forEach(el=>el.addEventListener("click",()=>{delete drafts[el.dataset.rdx];render()}));
  document.querySelectorAll("[data-dr]").forEach(el=>el.addEventListener("click",()=>{const p=el.dataset.dr;
    const L=[];ARTS.forEach(a=>a.slots.forEach(s=>{const st=status(a,s,null);if(s.prov===p&&st.exp&&(st.due||st.soon))L.push({a,s,st})}));
    const first=L.reduce((m,x)=>x.st.exp<m?x.st.exp:m,L[0].st.exp);const past=first<TODAY;
    drafts[p]=`Hi ${p} team,\n\nA quick heads-up that ${L.length} of your Nomadwise placements ${past?"have ended or end soon, the first on":"end soon, the first on"} ${fmtD(first)}.\n\nYou can see them all, with renewal prices and anything else that's open, on your private partner page. Tick what you'd like to keep and send us a package offer there, or just reply here.\n\nBest,\nJonathan`;
    render()}));
  document.querySelectorAll("[data-ap]").forEach(el=>el.addEventListener("click",async()=>{const p=el.dataset.ap;const text=drafts[p];
    const {error}=await sb.rpc("partners_team_reminder",{p_provider:p,p_draft:text,p_sent:true});
    if(error){toast("Couldn't save: "+error.message);return}
    openMail((PROVIDERS.find(x=>x.name===p)||{}).contact_email,"Your Nomadwise placements",text);
    REMS[p]={sent_at:new Date().toISOString()};delete drafts[p];render()}));
  // team: access
  document.querySelectorAll("[data-copy]").forEach(el=>el.addEventListener("click",async()=>{try{await navigator.clipboard.writeText(el.dataset.copy);toast("Link copied")}catch(e){prompt("Copy this link",el.dataset.copy)}}));
  document.querySelectorAll("[data-newlink]").forEach(el=>el.addEventListener("click",async()=>{
    if(!el.dataset.sure){el.dataset.sure="1";el.textContent="Old link stops working. Sure?";return}
    const {error}=await sb.rpc("partners_team_provider_set",{p_id:el.dataset.newlink,p_active:null,p_new_link:true});
    if(error){toast("Couldn't save: "+error.message);return}toast("New link made. Copy it and send it on.");reloadTeam()}));
  document.querySelectorAll("[data-act]").forEach(el=>el.addEventListener("change",async()=>{
    const {error}=await sb.rpc("partners_team_provider_set",{p_id:el.dataset.act,p_active:el.checked,p_new_link:false});
    if(error){toast("Couldn't save: "+error.message);return}toast(el.checked?"Link switched on":"Link switched off");reloadTeam()}));
  document.querySelectorAll("[data-pe]").forEach(el=>el.addEventListener("change",async()=>{
    const {error}=await sb.rpc("partners_team_provider_save",{p_name:el.dataset.pe,p_email:el.value});
    if(error){toast("Couldn't save: "+error.message);return}toast("Email saved");reloadTeam()}));
  const pf=$("provform");if(pf)pf.addEventListener("submit",async e=>{e.preventDefault();
    const {error}=await sb.rpc("partners_team_provider_save",{p_name:$("np-name").value,p_email:$("np-email").value});
    if(error){toast(error.message);return}toast("Provider added. Copy their link below.");openD.add("d-acc");reloadTeam()});
  const tf=$("teamform");if(tf)tf.addEventListener("submit",async e=>{e.preventDefault();
    const {error}=await sb.rpc("partners_team_member",{p_email:$("nt-email").value,p_add:true});
    if(error){toast(error.message);return}toast("Added to the team");openD.add("d-acc");reloadTeam()});
  document.querySelectorAll("[data-rmteam]").forEach(el=>el.addEventListener("click",async()=>{
    const {error}=await sb.rpc("partners_team_member",{p_email:el.dataset.rmteam,p_add:false});
    if(error){toast(error.message);return}reloadTeam()}));
}

$("mbar-b").addEventListener("click",()=>{const p=$("selp");if(p)p.scrollIntoView({behavior:"smooth"})});
window.addEventListener("hashchange",()=>{if(parseToken()!==TOKEN)location.reload()});
boot().catch(e=>message("Something went wrong",String(e&&e.message||e)));
})();
