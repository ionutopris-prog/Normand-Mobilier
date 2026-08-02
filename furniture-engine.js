/* =========================================================================
   NORMAND · Motor comun de mobilă la comandă (folosit de configurator.html + planner.html)
   Mobila e DESENATĂ parametric (SVG). Sursa unică de adevăr pentru:
   finisaje, tipuri de corp, randare, defs.
   ========================================================================= */

const FINISHES = [
  { id:"alb",         name:"Alb",              base:"#eef0ec", wood:false },
  { id:"alb-lucios",  name:"Alb lucios",       base:"#fafbf8", wood:false, gloss:true },
  { id:"crem",        name:"Crem / Vanilie",   base:"#e8dcc4", wood:false },
  { id:"gri-deschis", name:"Gri deschis",      base:"#c6c8c5", wood:false },
  { id:"antracit",    name:"Antracit",         base:"#3c4043", wood:false },
  { id:"negru",       name:"Negru mat",        base:"#26282a", wood:false },
  { id:"sonoma",      name:"Sonoma deschis",   base:"#cbb188", wood:true },
  { id:"sonoma-inch", name:"Sonoma închis",    base:"#8f6f49", wood:true },
  { id:"stejar",      name:"Stejar auriu",     base:"#c39a5c", wood:true },
  { id:"fag",         name:"Fag",              base:"#dcc196", wood:true },
  { id:"nuc",         name:"Nuc",              base:"#7a5230", wood:true },
  { id:"wenge",       name:"Wenge",            base:"#3b2c25", wood:true },
  { id:"cappuccino",  name:"Cappuccino",       base:"#8a6f57", wood:true },
  { id:"artizan",     name:"Stejar Artizan",   base:"#9b7a4f", wood:true },
  { id:"gri-grafit",  name:"Gri grafit",       base:"#6e7276", wood:false },
  { id:"trufa",       name:"Trufă",            base:"#7d6a5a", wood:true },
  { id:"alb-mat",     name:"Alb mat",          base:"#e7e8e3", wood:false },
  { id:"salcam",      name:"Salcâm",           base:"#b98f5c", wood:true },
  { id:"crem-luc",    name:"Crem lucios",      base:"#ecdcbe", wood:false, gloss:true },
  { id:"vanilie-luc", name:"Vanilie lucioasă", base:"#f0e4bf", wood:false, gloss:true },
  { id:"gri-luc",     name:"Gri deschis lucios",base:"#ccd0cd", wood:false, gloss:true },
  { id:"capp-luc",    name:"Cappuccino lucios",base:"#9c7f64", wood:false, gloss:true },
  { id:"rosu-luc",    name:"Roșu lucios",      base:"#b32a2a", wood:false, gloss:true },
  { id:"bordo-luc",   name:"Bordo lucios",     base:"#6f2130", wood:false, gloss:true },
  { id:"verde-luc",   name:"Verde lucios",     base:"#2f5d43", wood:false, gloss:true },
  { id:"antracit-luc",name:"Antracit lucios",  base:"#363a3d", wood:false, gloss:true },
  { id:"negru-luc",   name:"Negru lucios",     base:"#1d1f21", wood:false, gloss:true }
];
const HANDLES = [
  { id:"bara", name:"Bară" }, { id:"buton", name:"Buton" },
  { id:"scoica", name:"Scoică" }, { id:"push", name:"Push (fără mâner)" }
];
function finById(id){ return FINISHES.find(f=>f.id===id) || FINISHES[0]; }
function handleName(id){ const h=HANDLES.find(x=>x.id===id); return h?h.name:"Bară"; }

const CATEGORIES = {
  "Dulapuri": ["dulap2","dulap3","dulap4","glisant"],
  "Bucătărie": ["baza-buc","suspendat-buc","coltar-buc","corp-chiuveta","corp-cuptor","coloana-frig","hota-orizontala","hota-verticala"],
  "Dormitor & living": ["pat","noptiera","comoda","biblioteca","tv"]
};

const TYPES = {
  "dulap2": { label:"Dulap 2 uși", icon:"wardrobe", dims:{w:[80,140,100],h:[180,245,210],d:[50,65,58]}, doors:[2], drawers:[0,1,2,3], shelves:[2,3,4,5], overhead:true, build:(p)=>columnsDoors(p,2) },
  "dulap3": { label:"Dulap 3 uși", icon:"wardrobe", dims:{w:[120,220,165],h:[180,245,215],d:[52,65,58]}, doors:[3], drawers:[0,2,3], shelves:[3,4,5,6], overhead:true, build:(p)=>columnsDoors(p,3) },
  "dulap4": { label:"Dulap 4 uși", icon:"wardrobe", dims:{w:[180,300,220],h:[180,245,220],d:[52,66,60]}, doors:[4], drawers:[0,2,4], shelves:[4,5,6,7], overhead:true, build:(p)=>columnsDoors(p,4) },
  "glisant": { label:"Uși glisante", icon:"slider", dims:{w:[150,280,200],h:[180,245,215],d:[60,70,65]}, doors:[2,3], drawers:[0], shelves:[3,4,5,6], overhead:false, build:(p)=>slidingDoors(p) },
  "comoda": { label:"Comodă cu sertare", icon:"drawers", dims:{w:[60,160,90],h:[70,120,85],d:[40,55,45]}, doors:[0], drawers:[3,4,2,5], shelves:[0], overhead:false, build:(p)=>drawersStack(p) },
  "biblioteca": { label:"Bibliotecă", icon:"shelf", dims:{w:[60,220,120],h:[150,230,200],d:[28,45,32]}, doors:[0,2], drawers:[0], shelves:[3,4,5,6,7], overhead:false, build:(p)=>bookcase(p) },
  "tv": { label:"Corp TV", icon:"tv", dims:{w:[120,320,200],h:[40,70,50],d:[35,55,45]}, doors:[2,4], drawers:[0,2], shelves:[0], overhead:false, build:(p)=>tvUnit(p) },
  "pat": { label:"Pat", icon:"bed", dims:{w:[140,200,160],h:[95,130,110],d:[190,215,200]}, doors:[0], drawers:[0], shelves:[0], overhead:false, build:(p)=>bed(p) },
  "noptiera": { label:"Noptieră", icon:"drawers", dims:{w:[40,60,45],h:[40,60,50],d:[35,45,40]}, doors:[0], drawers:[2,3], shelves:[0], overhead:false, build:(p)=> p.drawers>0 ? drawersStack(p) : columnsDoors(p,1) },
  "baza-buc": { label:"Bază bucătărie", icon:"cabinet", dims:{w:[40,120,60],h:[82,92,85],d:[56,62,60]}, doors:[1,2], drawers:[0,3,4], shelves:[1,2], overhead:false, build:(p)=> p.drawers>0 ? drawersStack(p) : columnsDoors(p,p.doors) },
  "suspendat-buc": { label:"Suspendat bucătărie", icon:"cabinet", dims:{w:[40,120,60],h:[55,90,72],d:[30,40,32]}, doors:[1,2], drawers:[0], shelves:[1,2], overhead:false, build:(p)=>columnsDoors(p,p.doors) },
  "coltar-buc": { label:"Colțar bucătărie", icon:"corner", dims:{w:[85,110,90],h:[82,92,85],d:[85,110,90]}, doors:[1], drawers:[0], shelves:[1,2], overhead:false, build:(p)=>cornerBase(p) },
  "corp-chiuveta": { label:"Corp chiuvetă", icon:"sink", dims:{w:[60,120,80],h:[82,92,85],d:[56,62,60]}, doors:[2], drawers:[0], shelves:[1], overhead:false, build:(p)=>sinkBase(p) },
  "corp-cuptor": { label:"Corp cuptor", icon:"oven", dims:{w:[60,70,60],h:[195,235,210],d:[58,65,60]}, doors:[1,2], drawers:[1,2,3], shelves:[0], overhead:false, build:(p)=>ovenTower(p) },
  "coloana-frig": { label:"Coloană frigider", icon:"column", dims:{w:[60,72,60],h:[195,235,210],d:[58,65,60]}, doors:[2], drawers:[0], shelves:[0], overhead:false, build:(p)=>fridgeColumn(p) },
  "hota-orizontala": { label:"Hotă orizontală", icon:"hoodH", dims:{w:[50,120,90],h:[16,50,30],d:[45,60,50]}, doors:[0], drawers:[0], shelves:[0], overhead:false, build:(p)=>hoodH(p) },
  "hota-verticala": { label:"Hotă verticală", icon:"hoodV", dims:{w:[50,90,60],h:[60,140,95],d:[45,60,50]}, doors:[0], drawers:[0], shelves:[0], overhead:false, build:(p)=>hoodV(p) }
};

const ICONS = {
  wardrobe:'<svg viewBox="0 0 40 34" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="7" y="4" width="26" height="26"/><line x1="20" y1="4" x2="20" y2="30"/><circle cx="17" cy="17" r="1.1" fill="currentColor"/><circle cx="23" cy="17" r="1.1" fill="currentColor"/></svg>',
  slider:'<svg viewBox="0 0 40 34" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="5" y="5" width="30" height="24"/><line x1="19" y1="5" x2="19" y2="29"/><line x1="15" y1="14" x2="15" y2="20"/><line x1="25" y1="14" x2="25" y2="20"/></svg>',
  drawers:'<svg viewBox="0 0 40 34" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="8" y="5" width="24" height="24"/><line x1="8" y1="13" x2="32" y2="13"/><line x1="8" y1="21" x2="32" y2="21"/></svg>',
  shelf:'<svg viewBox="0 0 40 34" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="8" y="4" width="24" height="26"/><line x1="8" y1="12" x2="32" y2="12"/><line x1="8" y1="19" x2="32" y2="19"/><line x1="8" y1="26" x2="32" y2="26"/></svg>',
  tv:'<svg viewBox="0 0 40 34" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="5" y="12" width="30" height="15"/><line x1="20" y1="12" x2="20" y2="27"/></svg>',
  cabinet:'<svg viewBox="0 0 40 34" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="9" y="5" width="22" height="24"/><line x1="20" y1="5" x2="20" y2="29"/></svg>',
  corner:'<svg viewBox="0 0 40 34" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M8 6h14l10 10v12H8z"/><line x1="22" y1="6" x2="22" y2="16"/><line x1="22" y1="16" x2="32" y2="16"/></svg>',
  sink:'<svg viewBox="0 0 40 34" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="8" y="9" width="24" height="20"/><ellipse cx="20" cy="13" rx="8" ry="2.4"/><line x1="20" y1="6" x2="20" y2="11"/></svg>',
  oven:'<svg viewBox="0 0 40 34" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="9" y="4" width="22" height="26"/><rect x="12" y="14" width="16" height="12"/><line x1="12" y1="9" x2="28" y2="9"/></svg>',
  column:'<svg viewBox="0 0 40 34" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="11" y="3" width="18" height="28"/><rect x="14" y="12" width="12" height="10"/></svg>',
  bed:'<svg viewBox="0 0 40 34" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="4" y="10" width="32" height="16" rx="2"/><rect x="4" y="6" width="10" height="10" rx="2"/><line x1="4" y1="26" x2="4" y2="30"/><line x1="36" y1="26" x2="36" y2="30"/></svg>',
  hoodH:'<svg viewBox="0 0 40 34" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M6 10h28v7l-4 5H10l-4-5z"/><line x1="15" y1="26" x2="25" y2="26"/></svg>',
  hoodV:'<svg viewBox="0 0 40 34" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="16" y="4" width="8" height="14"/><path d="M8 30h24l-6-12H14z"/></svg>'
};

/* accesorii de interior — reguli intuitive per tip (partajate de configurator + planner) */
const ACC_LABELS={ shelf:"Raft", rail:"Bară de haine", glass:"Suport pahare", drainer:"Uscător de vase", drawer:"Sertar interior", basket:"Coș extractibil", spice:"Suport condimente", led:"Bandă LED" };
function accLabel(kind){ return ACC_LABELS[kind]||"Raft"; }
const ACC_ICONS={ shelf:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 11h18"/><path d="M6 11v4M18 11v4"/></svg>', rail:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7h18"/><path d="M12 7v2.5"/><path d="M7.5 16l4.5-6 4.5 6z"/></svg>', box:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="6" width="16" height="12" rx="2"/><path d="M4 11h16"/></svg>' };
function accIco(kind){ return ACC_ICONS[kind]||ACC_ICONS.box; }
const WARDROBE_TYPES=["dulap2","dulap3","dulap4","glisant"];
const LAYOUT_TYPES=["dulap2","dulap3","dulap4","glisant","suspendat-buc","baza-buc","noptiera"];
const KITCHEN_ACC_TYPES=["baza-buc","suspendat-buc"];
function usesLayout(type){ return LAYOUT_TYPES.indexOf(type)>=0; }
function accessoriesFor(type){ const isW=WARDROBE_TYPES.indexOf(type)>=0, isK=KITCHEN_ACC_TYPES.indexOf(type)>=0;
  const out=["shelf"]; if(isW) out.push("rail"); if(isK) out.push("glass","drainer","spice"); out.push("drawer","basket","led"); return out; }

/* ===== primitive de desen ===== */
function shade(hex,amt){ const n=parseInt(hex.slice(1),16); let r=(n>>16)&255,g=(n>>8)&255,b=n&255;
  const cl=(v)=>Math.max(0,Math.min(255,v)); const f=(c)=>Math.round(amt<0?c*(1+amt):c+(255-c)*amt);
  r=cl(f(r)); g=cl(f(g)); b=cl(f(b)); return "#"+((1<<24)+(r<<16)+(g<<8)+b).toString(16).slice(1); }
function fillOf(fin){ return fin.wood ? `url(#wood-${fin.id})` : `url(#grad-${fin.id})`; }

function panel(x,y,w,h,fin,opts={}){
  const inset=opts.inset??2, r=opts.r??2.5;
  let s=`<rect x="${x+inset}" y="${y+inset}" width="${w-inset*2}" height="${h-inset*2}" rx="${r}" fill="${fillOf(fin)}" stroke="${shade(fin.base,-0.28)}" stroke-width="1"/>`;
  s+=`<rect x="${x+inset}" y="${y+h-inset-3}" width="${w-inset*2}" height="3" rx="1.5" fill="${shade(fin.base,-0.14)}" opacity="0.5"/>`;
  return s;
}
function handle(cx,cy,kind,fin,vertical=true){
  const metal=fin.wood?"#c9c9c9":"#8a8f8c";
  if(kind==="push") return "";
  if(kind==="buton") return `<circle cx="${cx}" cy="${cy}" r="3.2" fill="${metal}" stroke="#5f625f" stroke-width="0.6"/>`;
  if(kind==="scoica") return `<rect x="${cx-9}" y="${cy-2}" width="18" height="4" rx="2" fill="${shade(fin.base,-0.32)}"/>`;
  if(vertical) return `<rect x="${cx-1.6}" y="${cy-16}" width="3.2" height="32" rx="1.6" fill="${metal}"/>`;
  return `<rect x="${cx-16}" y="${cy-1.6}" width="32" height="3.2" rx="1.6" fill="${metal}"/>`;
}
function columnsDoorsSub(x0,y0,w,h,n,fin,hk){ let s=""; const colW=w/n;
  for(let i=0;i<n;i++){ const x=x0+i*colW; s+=panel(x,y0,colW,h,fin); const hx=(i<n-1)?x+colW-8:x+8; s+=handle(hx,y0+h/2,hk,fin,true); } return s; }
function drawersStackSub(x0,y0,w,h,n,fin,hk){ let s=""; const dh=h/n; for(let i=0;i<n;i++){ const y=y0+i*dh; s+=panel(x0,y,w,dh,fin); s+=handle(x0+w/2,y+dh/2,hk,fin,false);} return s; }

function interiorAccessory(kind, x, yy, colW, fin, body){ let s=""; const cx=x+colW/2;
  if(kind==="rail"){ s+=`<rect x="${x+5}" y="${yy}" width="${colW-10}" height="2.6" rx="1.3" fill="#b9beba"/>`;
    for(let h=0;h<3;h++){ const hx=x+colW*0.28+h*colW*0.22; s+=`<rect x="${hx}" y="${yy}" width="1.4" height="15" fill="#9aa09b"/><rect x="${hx-5}" y="${yy+11}" width="11" height="19" rx="2" fill="${shade(fin.base,0.12)}" opacity="0.5"/>`; } return s; }
  if(kind==="glass"){ s+=`<rect x="${x+4}" y="${yy}" width="${colW-8}" height="3" fill="${shade(body.base,-0.06)}"/>`;
    for(let g=0;g<3;g++){ const gx=x+colW*0.3+g*colW*0.2; s+=`<line x1="${gx}" y1="${yy+3}" x2="${gx}" y2="${yy+8}" stroke="#b9beba" stroke-width="1"/><path d="M${gx-4} ${yy+8} Q${gx} ${yy+17} ${gx+4} ${yy+8} Z" fill="#d7e6ee" opacity="0.75" stroke="#a9bcc4" stroke-width="0.6"/>`; } return s; }
  if(kind==="drainer"){ s+=`<rect x="${x+5}" y="${yy+17}" width="${colW-10}" height="3" rx="1.5" fill="#c4c9c8"/>`;
    for(let d=0; x+8+d*9 < x+colW-6; d++){ const dx=x+8+d*9; s+=`<line x1="${dx}" y1="${yy}" x2="${dx}" y2="${yy+17}" stroke="#bcc1c0" stroke-width="1.3"/>`; }
    s+=`<ellipse cx="${x+colW*0.4}" cy="${yy+9}" rx="2.4" ry="9" fill="#e9eeeb" stroke="#c4c9c8" stroke-width="0.7"/><ellipse cx="${x+colW*0.6}" cy="${yy+9}" rx="2.4" ry="9" fill="#eef1ee" stroke="#c4c9c8" stroke-width="0.7"/>`; return s; }
  if(kind==="drawer"){ s+=`<rect x="${x+4}" y="${yy}" width="${colW-8}" height="14" rx="2" fill="${shade(body.base,-0.3)}"/><rect x="${x+4}" y="${yy}" width="${colW-8}" height="4.5" rx="2" fill="${shade(body.base,-0.12)}"/><rect x="${cx-6}" y="${yy+7}" width="12" height="2" rx="1" fill="${shade(body.base,-0.2)}"/>`; return s; }
  if(kind==="basket"){ s+=`<path d="M${x+5} ${yy} L${x+colW-5} ${yy} L${x+colW-8} ${yy+15} L${x+8} ${yy+15} Z" fill="${shade(body.base,-0.34)}" stroke="#9aa09b" stroke-width="1"/>`;
    for(let w=1;w<4;w++){ s+=`<line x1="${x+5+(colW-10)*w/4}" y1="${yy}" x2="${x+8+(colW-16)*w/4}" y2="${yy+15}" stroke="#8f948f" stroke-width="0.7"/>`; }
    s+=`<line x1="${x+6}" y1="${yy+7.5}" x2="${x+colW-6}" y2="${yy+7.5}" stroke="#8f948f" stroke-width="0.7"/>`; return s; }
  if(kind==="spice"){ s+=`<rect x="${x+4}" y="${yy+9}" width="${colW-8}" height="2.6" fill="${shade(body.base,-0.06)}"/>`; const cols=["#c07b4a","#8a9a5b","#b23b3b","#d8b24e"];
    for(let j=0;j<4;j++){ const jx=x+7+j*((colW-14)/3); s+=`<rect x="${jx-2.5}" y="${yy}" width="5" height="9" rx="1" fill="${cols[j%4]}" opacity="0.85"/><rect x="${jx-2.5}" y="${yy}" width="5" height="2" fill="#6a6e70"/>`; } return s; }
  if(kind==="led"){ s+=`<rect x="${x+4}" y="${yy}" width="${colW-8}" height="6" rx="3" fill="#fff3c4" opacity="0.35"/><rect x="${x+5}" y="${yy+1.5}" width="${colW-10}" height="2" rx="1" fill="#ffdf7e"/>`; return s; }
  s+=`<rect x="${x+4}" y="${yy}" width="${colW-8}" height="3.4" rx="1" fill="${shade(body.base,-0.06)}"/>`; return s; }
function columnsDoors(p,n){ const {W,H,fin,body,handle:hk,view}=p; let s=""; const colW=W/n;
  for(let i=0;i<n;i++){ const x=i*colW;
    if(view==="open"){
      s+=`<rect x="${x+2}" y="2" width="${colW-4}" height="${H-4}" rx="2" fill="${shade(body.base,-0.42)}"/>`;
      if(p.layout && p.layout.length){
        // interior configurat pe elemente (rafturi + bare), distribuite egal de sus în jos
        const top=12, bot=H-8, nL=p.layout.length;
        for(let li=0; li<nL; li++){ const yy=top+(bot-top)*(li+1)/(nL+1); s+=interiorAccessory(p.layout[li].kind, x, yy, colW, fin, body); }
      } else {
        const rail=(p.rail!==undefined)?p.rail:(p.type&&p.type.startsWith("dulap")); const shelfTop=rail?H*0.30:6;
        const nSh=p.shelves, zoneTop=shelfTop, zoneBot=H-6-(p.drawers>0?Math.min(p.drawers,3)*10:0);
        for(let k=1;k<=nSh;k++){ const yy=zoneTop+(zoneBot-zoneTop)*k/(nSh+1); s+=`<rect x="${x+4}" y="${yy}" width="${colW-8}" height="3" fill="${shade(body.base,-0.06)}"/>`; }
        if(rail){ s+=`<rect x="${x+5}" y="${shelfTop-8}" width="${colW-10}" height="2.4" rx="1.2" fill="#b9beba"/>`;
          for(let hh=0;hh<3;hh++){ const hx=x+colW*0.28+hh*colW*0.22; s+=`<rect x="${hx}" y="${shelfTop-8}" width="1.4" height="14" fill="#9aa09b"/><rect x="${hx-5}" y="${shelfTop+5}" width="11" height="20" rx="2" fill="${shade(fin.base,0.12)}" opacity="0.5"/>`; } }
      }
    } else { s+=panel(x,0,colW,H,fin); const hx=(i<n-1)?x+colW-8:x+8; s+=handle(hx,H*0.5,hk,fin,true); }
  } return s; }
function slidingDoors(p){ const {W,H,fin,view}=p; if(view==="open") return columnsDoors({...p,view:"open"},Math.max(2,p.doors));
  let s=""; const n=Math.max(2,p.doors), panelW=W/n*1.06;
  for(let i=0;i<n;i++){ const x=(W-panelW)*(i/(n-1||1)); const z=i%2;
    s+=`<rect x="${x+(z?3:0)}" y="3" width="${panelW-3}" height="${H-6}" rx="2" fill="${fillOf(fin)}" stroke="${shade(fin.base,-0.28)}" stroke-width="1"/>`;
    s+=`<rect x="${x+panelW*0.5-1.5}" y="6" width="3" height="${H-12}" rx="1.5" fill="${shade(fin.base,-0.2)}" opacity="0.4"/>`;
    s+=`<rect x="${x+(z?panelW-10:4)}" y="${H*0.4}" width="3" height="${H*0.2}" rx="1.5" fill="#b9beba"/>`; } return s; }
function drawersStack(p){ const {W,H,fin,body,handle:hk}=p; let s=""; const n=Math.max(1,p.drawers||3), dh=H/n;
  for(let i=0;i<n;i++){ const y=i*dh; s+=panel(0,y,W,dh,fin);
    if(p.view==="open"){ s+=`<rect x="6" y="${y+4}" width="${W-12}" height="${dh-8}" rx="2" fill="${shade(body.base,-0.36)}"/>`; s+=`<rect x="6" y="${y+4}" width="${W-12}" height="6" rx="2" fill="${shade(body.base,-0.15)}"/>`; }
    else s+=handle(W/2,y+dh/2,hk==="bara"?"bara":hk,fin,false); } return s; }
function bookcase(p){ const {W,H,fin,body,shelves,doors}=p; let s=""; const hasDoors=doors>0, doorZone=hasDoors?H*0.32:0, openBot=H-doorZone;
  s+=`<rect x="2" y="2" width="${W-4}" height="${openBot-2}" rx="2" fill="${shade(body.base,-0.4)}"/>`;
  s+=`<rect x="0" y="0" width="${W}" height="${openBot}" rx="3" fill="none" stroke="${shade(body.base,-0.2)}" stroke-width="4"/>`;
  s+=`<rect x="2" y="2" width="${W-4}" height="${openBot-4}" rx="2" fill="none" stroke="${shade(body.base,0.02)}" stroke-width="2"/>`;
  const nSh=Math.max(2,shelves);
  for(let k=1;k<=nSh;k++){ const yy=6+(openBot-12)*k/(nSh+1);
    s+=`<rect x="4" y="${yy}" width="${W-8}" height="4.5" rx="1.5" fill="${shade(body.base,0.05)}" stroke="${shade(body.base,-0.25)}" stroke-width="0.6"/>`;
    s+=`<rect x="4" y="${yy+3.2}" width="${W-8}" height="1.3" fill="${shade(body.base,-0.18)}" opacity="0.6"/>`; }
  if(hasDoors){ if(p.view==="open") s+=`<rect x="2" y="${openBot}" width="${W-4}" height="${doorZone-2}" rx="2" fill="${shade(body.base,-0.4)}"/>`;
    else s+=columnsDoorsSub(0,openBot,W,doorZone,2,fin,p.handle); } return s; }
function tvUnit(p){ const {W,H,fin,body,drawers}=p; let s=""; const openCenter=W*0.4, sideW=(W-openCenter)/2;
  s+=`<rect x="${sideW}" y="2" width="${openCenter}" height="${H-4}" rx="2" fill="${shade(body.base,-0.38)}"/>`;
  if(p.view==="open"){ s+=`<rect x="2" y="2" width="${sideW-2}" height="${H-4}" fill="${shade(body.base,-0.36)}"/>`; s+=`<rect x="${W-sideW}" y="2" width="${sideW-2}" height="${H-4}" fill="${shade(body.base,-0.36)}"/>`; }
  else { if(drawers>0){ s+=drawersStackSub(0,0,sideW,H,Math.max(1,drawers/2|0||1),fin,p.handle); s+=drawersStackSub(W-sideW,0,sideW,H,Math.max(1,drawers/2|0||1),fin,p.handle); }
    else { s+=panel(0,0,sideW,H,fin); s+=handle(sideW-8,H/2,p.handle,fin,true); s+=panel(W-sideW,0,sideW,H,fin); s+=handle(W-sideW+8,H/2,p.handle,fin,true); } }
  s+=`<rect x="-3" y="-4" width="${W+6}" height="6" rx="2" fill="${fillOf(fin)}" stroke="${shade(fin.base,-0.25)}" stroke-width="0.8"/>`; return s; }
function cornerBase(p){ const {W,H,fin,body}=p; let s=""; const chip=W*0.42;
  s+=`<polygon points="${chip},4 ${W-4},4 ${W-4},${H-4} 4,${H-4} 4,${chip}" fill="${shade(body.base,-0.38)}"/>`;
  if(p.view==="open"){
    s+=`<polygon points="${chip+4},8 ${W-8},8 ${W-8},${H-8} 8,${H-8} 8,${chip+4}" fill="${shade(body.base,-0.5)}"/>`;
    for(let k=1;k<=2;k++){ const sy=8+(H-16)*k/3; s+=`<polygon points="${chip+4},${sy} ${W-8},${sy} ${W-8},${sy+3.5} ${chip+4},${sy+3.5}" fill="${shade(body.base,-0.06)}"/><polygon points="8,${sy} ${chip+4},${sy} ${chip+4},${sy+3.5} 8,${sy+3.5}" fill="${shade(body.base,-0.06)}"/>`; }
  } else {
    s+=`<polygon points="${chip+2},6 ${W-6},6 ${W-6},${H-6} 6,${H-6} 6,${chip+2}" fill="${fillOf(fin)}" stroke="${shade(fin.base,-0.28)}" stroke-width="1"/>`;
    s+=handle(W*0.5,H*0.55,p.handle,fin,true);
  }
  s+=`<polygon points="${chip},-4 ${W+2},-4 ${W+2},2 ${chip},2 -2,${chip} -2,${chip-6}" fill="${fillOf(fin)}" stroke="${shade(fin.base,-0.25)}" stroke-width="0.8"/>`; return s; }
function sinkBase(p){ const {W,H,fin,body}=p; let s="";
  if(p.view==="open"){
    s+=`<rect x="2" y="6" width="${W-4}" height="${H-8}" rx="2" fill="${shade(body.base,-0.46)}"/>`;
    s+=`<path d="M${W*0.5} 12 v${H*0.32} q0 12 12 12 h${W*0.16}" fill="none" stroke="#9aa09b" stroke-width="4" stroke-linecap="round"/>`;
    s+=`<rect x="${W*0.5-5}" y="${H*0.46}" width="10" height="9" rx="2" fill="#b9beba"/>`;
    s+=`<rect x="6" y="${H-16}" width="${W-12}" height="3" fill="${shade(body.base,-0.06)}"/>`;
  } else s+=columnsDoorsSub(0,6,W,H-6,2,fin,p.handle);
  s+=`<rect x="-3" y="-7" width="${W+6}" height="9" rx="2" fill="${fillOf(fin)}" stroke="${shade(fin.base,-0.25)}" stroke-width="0.8"/>`;
  s+=`<rect x="${W*0.26}" y="-5.5" width="${W*0.48}" height="6" rx="2.5" fill="${shade(body.base,-0.3)}" stroke="${shade(body.base,-0.45)}" stroke-width="0.5"/>`;
  s+=`<rect x="${W*0.5-0.8}" y="-11" width="1.6" height="6" rx="0.8" fill="#9aa09b"/><circle cx="${W*0.5}" cy="-11" r="1.6" fill="#b9beba"/>`; return s; }
function ovenTower(p){ const {W,H,fin,body}=p; let s=""; const topH=H*0.30, ovenH=H*0.19, botH=H-topH-ovenH; const open=p.view==="open";
  if(open){ s+=`<rect x="2" y="2" width="${W-4}" height="${topH-2}" rx="2" fill="${shade(body.base,-0.44)}"/>`;
    for(let k=1;k<=2;k++){ const yy=6+(topH-10)*k/3; s+=`<rect x="5" y="${yy}" width="${W-10}" height="3" fill="${shade(body.base,-0.06)}"/>`; }
  } else s+=columnsDoorsSub(0,0,W,topH,Math.max(1,p.doors),fin,p.handle);
  s+=`<rect x="3" y="${topH}" width="${W-6}" height="${ovenH}" fill="${shade(body.base,-0.42)}"/>`;
  if(open){ s+=`<rect x="8" y="${topH+5}" width="${W-16}" height="${ovenH-10}" rx="3" fill="#3d4145" stroke="#141414" stroke-width="1"/>`;
    for(let k=1;k<=2;k++){ const yy=topH+5+(ovenH-10)*k/3; s+=`<rect x="12" y="${yy}" width="${W-24}" height="2" fill="#7a7e80"/>`; }
  } else { s+=`<rect x="8" y="${topH+5}" width="${W-16}" height="${ovenH-10}" rx="4" fill="#2b2d2f" stroke="#141414" stroke-width="1"/>`;
    s+=`<rect x="14" y="${topH+11}" width="${W-28}" height="${(ovenH-16)*0.42}" rx="2" fill="#3d4145"/>`;
    s+=`<rect x="12" y="${topH+8}" width="${W-24}" height="3" rx="1.5" fill="#5a5e60"/>`; }
  if(open){ s+=`<rect x="2" y="${H-botH}" width="${W-4}" height="${botH-2}" rx="2" fill="${shade(body.base,-0.4)}"/>`;
    const n=Math.max(2,p.drawers||3), dh=botH/n; for(let i=0;i<n;i++){ const y=H-botH+i*dh; s+=`<rect x="6" y="${y+3}" width="${W-12}" height="${dh-6}" rx="2" fill="${shade(body.base,-0.3)}"/><rect x="6" y="${y+3}" width="${W-12}" height="5" rx="2" fill="${shade(body.base,-0.13)}"/>`; }
  } else s+=drawersStackSub(0,H-botH,W,botH,Math.max(2,p.drawers||3),fin,p.handle); return s; }
function fridgeColumn(p){ const {W,H,fin,body}=p; let s=""; const topH=H*0.30, nicheH=H*0.46, botH=H-topH-nicheH; const open=p.view==="open";
  if(open){ s+=`<rect x="2" y="2" width="${W-4}" height="${topH-2}" rx="2" fill="${shade(body.base,-0.44)}"/>`;
    for(let k=1;k<=2;k++){ const yy=6+(topH-10)*k/3; s+=`<rect x="5" y="${yy}" width="${W-10}" height="3" fill="${shade(body.base,-0.06)}"/>`; }
  } else s+=columnsDoorsSub(0,0,W,topH,2,fin,p.handle);
  s+=`<rect x="3" y="${topH}" width="${W-6}" height="${nicheH}" fill="${shade(body.base,-0.42)}"/>`;
  if(open){ s+=`<rect x="8" y="${topH+5}" width="${W-16}" height="${nicheH-10}" rx="3" fill="#eef1ee" stroke="#c4c9c4" stroke-width="1"/>`;
    for(let k=1;k<=3;k++){ const yy=topH+5+(nicheH-10)*k/5; s+=`<rect x="11" y="${yy}" width="${W-22}" height="2.4" rx="1" fill="#cfd4cf"/>`; }
    s+=`<rect x="11" y="${topH+nicheH-6-(nicheH*0.17)}" width="${W-22}" height="${nicheH*0.17}" rx="2" fill="#dde6dd" stroke="#c4c9c4" stroke-width="0.8"/>`;
    s+=`<circle cx="${W*0.34}" cy="${topH+nicheH*0.2}" r="3.2" fill="#c76b52"/><rect x="${W*0.54}" y="${topH+nicheH*0.28}" width="5.5" height="9" rx="1.5" fill="#7ba05b"/><rect x="${W*0.3}" y="${topH+nicheH*0.5}" width="8" height="4" rx="1" fill="#d8b24e"/>`;
  } else { s+=`<rect x="9" y="${topH+6}" width="${W-18}" height="${nicheH-12}" rx="3" fill="#dfe2e0" stroke="#b7bcb8" stroke-width="1"/>`;
    s+=`<line x1="9" y1="${topH+nicheH*0.42}" x2="${W-9}" y2="${topH+nicheH*0.42}" stroke="#b7bcb8" stroke-width="1"/>`;
    s+=`<rect x="${W-16}" y="${topH+nicheH*0.14}" width="3" height="${nicheH*0.22}" rx="1.5" fill="#9aa09b"/>`;
    s+=`<rect x="${W-16}" y="${topH+nicheH*0.5}" width="3" height="${nicheH*0.22}" rx="1.5" fill="#9aa09b"/>`; }
  if(open){ s+=`<rect x="2" y="${H-botH}" width="${W-4}" height="${botH-2}" rx="2" fill="${shade(body.base,-0.44)}"/>`;
    for(let k=1;k<=2;k++){ const yy=H-botH+4+(botH-8)*k/3; s+=`<rect x="5" y="${yy}" width="${W-10}" height="3" fill="${shade(body.base,-0.06)}"/>`; }
  } else s+=columnsDoorsSub(0,H-botH,W,botH,2,fin,p.handle); return s; }
function bed(p){ const {W,H,fin,body}=p; let s=""; const hbH=H*0.60;
  s+=`<rect x="3" y="0" width="${W-6}" height="${hbH}" rx="7" fill="${fillOf(fin)}" stroke="${shade(fin.base,-0.25)}" stroke-width="1"/>`;
  s+=`<rect x="${W*0.13}" y="${hbH*0.18}" width="${W*0.74}" height="${hbH*0.66}" rx="7" fill="${shade(body.base,0.08)}" stroke="${shade(body.base,-0.2)}" stroke-width="1"/>`;
  for(let i=1;i<5;i++){ s+=`<line x1="${W*0.13}" y1="${hbH*0.18+hbH*0.66*i/5}" x2="${W*0.87}" y2="${hbH*0.18+hbH*0.66*i/5}" stroke="${shade(body.base,-0.12)}" stroke-width="0.6" opacity="0.5"/>`; }
  s+=`<rect x="6" y="${hbH-4}" width="${W-12}" height="12" rx="6" fill="#efeee9" stroke="#d9d8d1" stroke-width="0.8"/>`;
  s+=`<rect x="0" y="${hbH+8}" width="${W}" height="${H-hbH-8}" rx="4" fill="${fillOf(fin)}" stroke="${shade(fin.base,-0.25)}" stroke-width="1"/>`;
  if(p.view==="open"){ const by=hbH+12, bh=H-hbH-16; s+=`<rect x="4" y="${by}" width="${W-8}" height="${bh}" rx="3" fill="${shade(body.base,-0.34)}"/><rect x="4" y="${by}" width="${W-8}" height="6" rx="3" fill="${shade(body.base,-0.13)}"/><rect x="${W*0.5-9}" y="${by+bh*0.4}" width="18" height="3" rx="1.5" fill="#b9beba"/>`; }
  s+=`<rect x="2" y="${H-6}" width="8" height="6" fill="${shade(fin.base,-0.3)}"/><rect x="${W-10}" y="${H-6}" width="8" height="6" fill="${shade(fin.base,-0.3)}"/>`;
  return s; }

function hoodH(p){ const {W,H,fin}=p; let s="";
  s+=`<rect x="0" y="0" width="${W}" height="${H*0.52}" rx="3" fill="${fillOf(fin)}" stroke="${shade(fin.base,-0.25)}" stroke-width="1"/>`;
  s+=`<polygon points="0,${H*0.52} ${W},${H*0.52} ${W*0.85},${H} ${W*0.15},${H}" fill="${shade(fin.base,-0.06)}" stroke="${shade(fin.base,-0.25)}" stroke-width="1"/>`;
  for(let i=0;i<3;i++){ s+=`<line x1="${W*0.32}" y1="${H*0.66+i*3}" x2="${W*0.68}" y2="${H*0.66+i*3}" stroke="${shade(fin.base,-0.3)}" stroke-width="0.8"/>`; }
  s+=`<circle cx="${W*0.28}" cy="${H*0.9}" r="1.8" fill="#ffe9a8"/><circle cx="${W*0.72}" cy="${H*0.9}" r="1.8" fill="#ffe9a8"/>`;
  return s; }
function hoodV(p){ const {W,H,fin}=p; let s=""; const canopyH=Math.min(H*0.34,36), chimW=W*0.36;
  s+=`<rect x="${(W-chimW)/2}" y="0" width="${chimW}" height="${H-canopyH+2}" fill="${fillOf(fin)}" stroke="${shade(fin.base,-0.25)}" stroke-width="1"/>`;
  s+=`<polygon points="0,${H} ${W},${H} ${W*0.72},${H-canopyH} ${W*0.28},${H-canopyH}" fill="${fillOf(fin)}" stroke="${shade(fin.base,-0.25)}" stroke-width="1"/>`;
  for(let i=0;i<3;i++){ s+=`<line x1="${W*0.32}" y1="${H-5-i*3}" x2="${W*0.68}" y2="${H-5-i*3}" stroke="${shade(fin.base,-0.3)}" stroke-width="0.8"/>`; }
  return s; }

/* ===== defs + compunere modul ===== */
function finishDefs(f){ let d="";
  if(f.gloss){ const gT=shade(f.base,0.34),gH=shade(f.base,0.72),gLo=shade(f.base,-0.08),gB=shade(f.base,-0.22);
    d+=`<linearGradient id="grad-${f.id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${gT}"/><stop offset="0.06" stop-color="${gH}"/><stop offset="0.15" stop-color="${gT}"/><stop offset="0.5" stop-color="${f.base}"/><stop offset="0.8" stop-color="${gLo}"/><stop offset="0.93" stop-color="${shade(f.base,0.06)}"/><stop offset="1" stop-color="${gB}"/></linearGradient>`;
  } else { d+=`<linearGradient id="grad-${f.id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${shade(f.base,0.08)}"/><stop offset="0.5" stop-color="${f.base}"/><stop offset="1" stop-color="${shade(f.base,-0.10)}"/></linearGradient>`; }
  if(f.wood){ d+=`<pattern id="wood-${f.id}" width="6" height="120" patternUnits="userSpaceOnUse"><rect width="6" height="120" fill="url(#grad-${f.id})"/><path d="M2 0 Q3 30 2 60 T2 120" stroke="${shade(f.base,-0.12)}" stroke-width="0.6" fill="none" opacity="0.5"/><path d="M5 0 Q4 40 5 80 T5 120" stroke="${shade(f.base,0.10)}" stroke-width="0.5" fill="none" opacity="0.4"/></pattern>`; }
  return d;
}
function finishesUsed(modules){ const seen={}, out=[]; modules.forEach(m=>{ [m.front,m.body].forEach(f=>{ if(f&&!seen[f.id]){ seen[f.id]=1; out.push(f); } }); }); return out; }
function defsBlock(finishes){ let d=`<defs>`; finishes.forEach(f=>d+=finishDefs(f));
  d+=`<linearGradient id="glossSweep" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="0.30" stop-color="#fff" stop-opacity="0.34"/><stop offset="0.42" stop-color="#fff" stop-opacity="0.04"/><stop offset="0.60" stop-color="#fff" stop-opacity="0.14"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>`;
  d+=`<radialGradient id="floorSh" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#000" stop-opacity="0.16"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>`;
  d+=`</defs>`; return d; }

/* desenează un modul în coord. unitate (0..w, 0..h). m={type,w,h,d,doors,drawers,shelves,front,body,handle,view} */
function moduleBody(m){
  const p={W:m.w,H:m.h,fin:m.front,body:m.body,handle:m.handle,view:m.view||"closed",doors:m.doors,drawers:m.drawers,shelves:m.shelves,type:m.type,layout:m.layout};
  const noBox = m.type==="hota-orizontala"||m.type==="hota-verticala";
  let s = noBox ? "" : `<rect x="-2" y="-2" width="${m.w+4}" height="${m.h+4}" rx="4" fill="${shade(m.body.base,-0.34)}"/>`;
  s+=TYPES[m.type].build(p);
  if(m.front.gloss && (m.view||"closed")==="closed" && !noBox) s+=`<rect x="0" y="0" width="${m.w}" height="${m.h-6}" rx="3" fill="url(#glossSweep)" pointer-events="none"/>`;
  if(m.type!=="pat" && !noBox) s+=`<rect x="0" y="${m.h-6}" width="${m.w}" height="6" fill="${shade(m.body.base,-0.3)}"/>`;
  return s;
}
function overheadBody(m,ohH){ const n=m.w>150?3:2, cw=m.w/n; let s=`<rect x="-2" y="-2" width="${m.w+4}" height="${ohH+4}" rx="4" fill="${shade(m.body.base,-0.34)}"/>`;
  for(let i=0;i<n;i++){ s+=panel(i*cw,0,cw,ohH,m.front); const hx=i*cw+cw/2; s+=handle(hx,ohH-6,m.handle==='bara'?'buton':m.handle,m.front,false); }
  if(m.front.gloss) s+=`<rect x="0" y="0" width="${m.w}" height="${ohH}" rx="3" fill="url(#glossSweep)" pointer-events="none"/>`; return s; }
