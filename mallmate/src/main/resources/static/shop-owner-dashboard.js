const $ = (selector) => document.querySelector(selector);
const state = {shop:null, tenant:null, me:null, shops:[], facilities:[], maintenance:[], incidents:[], announcements:[], floors:[]};

function esc(value){return String(value ?? "").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function asArray(value){return Array.isArray(value)?value:[];}
function money(value){if(value===null||value===undefined||value==="")return "Not available";return new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:2}).format(Number(value));}
function dateText(value){if(!value)return "Not available";const s=String(value);const m=/^(\d{4})-(\d{2})-(\d{2})/.exec(s);if(m)return `${m[3]}-${m[2]}-${m[1]}`;const d=new Date(s);return Number.isNaN(d.getTime())?s:d.toLocaleString("en-IN",{dateStyle:"medium",timeStyle:s.includes("T")?"short":undefined});}
function notify(message,type="info"){const el=$("#pageMessage");el.textContent=message;el.className=`notice${type==="error"?" error":type==="success"?" success":""}`;el.hidden=false;el.scrollIntoView({behavior:"smooth",block:"nearest"});}
function clearNotify(){$("#pageMessage").hidden=true;}
function cookie(name){for(const item of document.cookie.split(";")){const [key,...rest]=item.trim().split("=");if(key===name)return decodeURIComponent(rest.join("="));}return null;}
async function ensureCsrf(){let token=cookie("XSRF-TOKEN");if(token)return token;const response=await fetch("/api/auth/csrf",{credentials:"same-origin",headers:{Accept:"application/json"}});if(!response.ok)throw new Error("Unable to initialize CSRF protection. Refresh and try again.");token=cookie("XSRF-TOKEN");if(!token)throw new Error("CSRF token is missing. Refresh the page and try again.");return token;}
async function api(url,options={}){const method=(options.method||"GET").toUpperCase();const headers={Accept:"application/json",...(options.headers||{})};if(options.body!==undefined)headers["Content-Type"]="application/json";if(!["GET","HEAD","OPTIONS"].includes(method))headers["X-XSRF-TOKEN"]=await ensureCsrf();const response=await fetch(url,{...options,method,headers,credentials:"same-origin"});if(response.status===401){window.location.replace("/index.html");throw new Error("Your session has expired. Please sign in again.");}if(response.status===403)throw new Error("Access denied for this action.");if(!response.ok){let detail=`Request failed (${response.status})`;try{const data=await response.json();detail=data.message||data.error||detail;}catch{}throw new Error(detail);}if(response.status===204)return null;const type=response.headers.get("content-type")||"";return type.includes("application/json")?response.json():null;}
function renderDetails(id,items){const root=document.getElementById(id);root.innerHTML=items.length?items.map(([label,value])=>`<div class="detail-item"><span class="detail-label">${esc(label)}</span><span class="detail-value">${esc(value===null||value===undefined||value===""?"Not available":value)}</span></div>`).join(""):'<p class="muted">No details available.</p>';}
function roleName(me){const r=me?.role;return typeof r==="string"?r:(r?.name||r?.roleName||"SHOP_OWNER");}
async function loadProfile(){try{const me=await api("/api/users/me");state.me=me;const name=me.name||me.fullName||me.username||"Shop Owner";const role=String(roleName(me)).replace(/^ROLE_/i,"").toUpperCase();$("#ownerName").textContent=name;$("#welcomeName").textContent=name;$("#ownerUsername").textContent=me.username||role;$("#profileAvatar").textContent=name.trim().charAt(0).toUpperCase()||"O";$("#accountAvatar").textContent=name.trim().charAt(0).toUpperCase()||"O";$("#accountName").textContent=name;$("#accountRole").textContent=role;renderDetails("accountDetails",[["Full name",name],["Username",me.username],["Email",me.email],["Phone",me.phone],["Role",role],["Account status",me.active===false?"Inactive":me.status||"Active"]]);}catch(e){console.warn("Profile endpoint unavailable:",e.message);renderDetails("accountDetails",[["Account details","Unable to load profile details. Please sign in again if needed."]]);}}
async function loadMyShop(){try{const [shop,tenant]=await Promise.all([api("/api/shops/my-shop"),api("/api/tenants/my-lease").catch(e=>e.message.includes("404")?null:Promise.reject(e))]);state.shop=shop;state.tenant=tenant;$("#summaryShop").textContent=shop.name||"Assigned shop";$("#summaryShopNumber").textContent=shop.shopNumber?`Shop ${shop.shopNumber}`:"Shop number unavailable";$("#summaryRent").textContent=tenant?money(tenant.monthlyRent):"—";$("#maintenanceShopLabel").textContent=`New requests will be submitted for ${shop.name||"your assigned shop"}.`;const status=shop.operatingStatus||shop.status||"Unknown";$("#shopStatus").textContent=status;$("#shopStatus").className="status-badge"+( /open|active/i.test(status)?" success":/closed|inactive|maintenance/i.test(status)?" danger":"");renderDetails("shopDetails",[["Shop ID",shop.id],["Shop name",shop.name],["Shop number",shop.shopNumber],["Description",shop.description],["Category",shop.categoryName],["Floor",shop.floorName],["Floor number",shop.floorNumber],["Record status",shop.status],["Operating status",shop.operatingStatus],["Under maintenance",shop.underMaintenance?"Yes":"No"],["Opening time",shop.openingTime],["Closing time",shop.closingTime]]);renderDetails("tenantDetails",tenant?[["Tenant ID",tenant.id],["Business name",tenant.businessName],["Contact person",tenant.contactPerson],["Email",tenant.email],["Phone",tenant.phone],["Associated shop",tenant.shopName]]:[]);renderDetails("leaseDetails",tenant?[["Lease start",dateText(tenant.leaseStartDate)],["Lease end",dateText(tenant.leaseEndDate)],["Monthly rent",money(tenant.monthlyRent)]]:[]);}catch(e){notify(`Could not load your shop profile: ${e.message}`,"error");}}
async function loadShops(){try{state.shops=asArray(await api("/api/shops"));populateShopFilters();renderShops();}catch(e){$("#shopsGrid").innerHTML=`<p class="empty-state">Could not load shops: ${esc(e.message)}</p>`;}}
function populateShopFilters(){const cats=[...new Set(state.shops.map(s=>s.categoryName).filter(Boolean))].sort();const floors=[...new Set(state.shops.map(s=>s.floorName).filter(Boolean))].sort();const fill=(id,values,label)=>{const el=$(id),old=el.value;el.innerHTML=`<option value="">All ${label}</option>`+values.map(v=>`<option value="${esc(v)}">${esc(v)}</option>`).join("");if(values.includes(old))el.value=old;};fill("#shopCategoryFilter",cats,"categories");fill("#shopFloorFilter",floors,"floors");}
function renderShops(){const q=$("#shopSearch").value.trim().toLowerCase(),cat=$("#shopCategoryFilter").value,floor=$("#shopFloorFilter").value;const rows=state.shops.filter(s=>[s.name,s.shopNumber,s.description,s.categoryName,s.floorName,s.floorNumber].join(" ").toLowerCase().includes(q)&&(!cat||s.categoryName===cat)&&(!floor||s.floorName===floor));$("#shopsGrid").innerHTML=rows.length?rows.map(s=>`<article class="shop-card">${s.imageUrl?`<img class="shop-image" src="${esc(s.imageUrl)}" alt="${esc(s.name||"Shop")}" loading="lazy" onerror="this.style.display='none'">`:'<div class="shop-image-placeholder" aria-hidden="true">▣</div>'}<div class="shop-card-content"><h3>${esc(s.name||"Unnamed shop")}</h3><p>${esc(s.description||"No description provided.")}</p><div class="meta-line"><span class="pill">${esc(s.shopNumber||"No shop number")}</span><span class="pill">${esc(s.categoryName||"Uncategorised")}</span><span class="pill">${esc(s.floorName||"Floor not specified")}</span></div><div class="meta-line"><span class="badge ${/active|open/i.test(s.operatingStatus||s.status||"")?"success":""}">${esc(s.operatingStatus||s.status||"Status unavailable")}</span></div></div></article>`).join(""):'<p class="empty-state">No shops match your search.</p>';}
async function loadFacilities(){try{state.facilities=asArray(await api("/api/facilities"));renderFacilities();}catch(e){$("#facilitiesGrid").innerHTML=`<p class="empty-state">Could not load facilities: ${esc(e.message)}</p>`;}}
function renderFacilities(){const q=$("#facilitySearch").value.trim().toLowerCase();const rows=state.facilities.filter(f=>[f.name,f.type,f.description,f.locationDescription,f.floorName,f.floorNumber].join(" ").toLowerCase().includes(q));$("#facilitiesGrid").innerHTML=rows.length?rows.map(f=>`<article class="facility-card"><div class="facility-icon">▦</div><h3>${esc(f.name||"Facility")}</h3><div class="meta-line"><span class="pill">${esc(f.type||"General")}</span>${f.floorNumber!==null&&f.floorNumber!==undefined?`<span class="pill">Floor ${esc(f.floorNumber)}</span>`:""}</div><p>${esc(f.description||"No description provided.")}</p><p><strong>Location:</strong> ${esc(f.locationDescription||f.floorName||"Not specified")}</p></article>`).join(""):'<p class="empty-state">No facilities match your search.</p>';}
async function loadMaintenance(){try{state.maintenance=asArray(await api("/api/maintenance/my-requests"));$("#summaryMaintenance").textContent=state.maintenance.length;renderMaintenance();}catch(e){$("#summaryMaintenance").textContent="—";$("#maintenanceList").innerHTML=`<p class="empty-state">Could not load requests: ${esc(e.message)}</p>`;}}
function renderMaintenance(){const rows=state.maintenance;$("#maintenanceList").innerHTML=rows.length?rows.map(m=>`<article class="record-card"><div class="record-top"><div><h3>${esc(m.title||"Maintenance request")}</h3><p>${esc(m.description||"No description provided.")}</p></div><span class="badge ${/complete|resolved|closed/i.test(m.status||"")?"success":""}">${esc(m.status||"Unknown")}</span></div><div class="record-meta"><span>Category: ${esc(m.category||"—")}</span><span>Priority: ${esc(m.priority||"—")}</span><span>Shop: ${esc(m.shopName||state.shop?.name||"Your shop")}</span><span>Created: ${esc(dateText(m.createdAt))}</span></div></article>`).join(""):'<p class="empty-state">You have no maintenance requests yet.</p>';}
async function submitMaintenance(event){event.preventDefault();if(!state.shop?.id){notify("Your assigned shop could not be identified. Please refresh the page.","error");return;}const form=event.currentTarget,fd=new FormData(form),payload={title:String(fd.get("title")||"").trim(),description:String(fd.get("description")||"").trim(),category:String(fd.get("category")||"").trim(),priority:String(fd.get("priority")||"MEDIUM"),shopId:Number(state.shop.id)};const button=$("#submitMaintenance");button.disabled=true;button.textContent="Submitting…";try{await api("/api/maintenance",{method:"POST",body:JSON.stringify(payload)});form.reset();form.hidden=true;$("#toggleMaintenanceForm").setAttribute("aria-expanded","false");$("#toggleMaintenanceForm").textContent="+ New request";await loadMaintenance();notify("Maintenance request submitted successfully.","success");}catch(e){notify(`Could not submit request: ${e.message}`,"error");}finally{button.disabled=false;button.textContent="Submit request";}}
async function loadFloors(){try{state.floors=asArray(await api("/api/floors"));const select=$("#incidentFloor");select.innerHTML='<option value="">Select floor</option>'+state.floors.map(f=>`<option value="${esc(f.id)}">${esc(f.name||f.floorName||`Floor ${f.floorNumber??f.id}`)}${f.floorNumber!==undefined&&f.floorNumber!==null?` (${esc(f.floorNumber)})`:""}</option>`).join("");}catch(e){$("#incidentFloor").innerHTML='<option value="">Could not load floors</option>';console.warn("Could not load floors",e.message);}}
async function loadIncidents(){try{state.incidents=asArray(await api("/api/incidents"));$("#summaryIncidents").textContent=state.incidents.length;renderIncidents();}catch(e){$("#summaryIncidents").textContent="—";$("#incidentList").innerHTML=`<p class="empty-state">Could not load your reports: ${esc(e.message)}</p>`;}}
function renderIncidents(){const rows=state.incidents;$("#incidentList").innerHTML=rows.length?rows.map(i=>`<article class="record-card"><div class="record-top"><div><h3>${esc(i.title||"Incident report")}</h3><p>${esc(i.description||"No description provided.")}</p></div><span class="badge ${/resolved|closed/i.test(i.status||"")?"success":""}">${esc(i.status||"Reported")}</span></div><div class="record-meta"><span>Type: ${esc(i.incidentType||"—")}</span><span>Severity: ${esc(i.severity||"—")}</span><span>Floor: ${esc(i.floorNumber??"—")}</span><span>Reported: ${esc(dateText(i.reportedAt))}</span></div></article>`).join(""):'<p class="empty-state">You have not reported any incidents.</p>';}
async function submitIncident(event){event.preventDefault();const form=event.currentTarget,fd=new FormData(form),payload={title:String(fd.get("title")||"").trim(),description:String(fd.get("description")||"").trim(),incidentType:String(fd.get("incidentType")||"").trim(),severity:String(fd.get("severity")||"MEDIUM"),floorId:Number(fd.get("floorId"))};if(!payload.floorId){notify("Please select a floor.","error");return;}const button=$("#submitIncident");button.disabled=true;button.textContent="Submitting…";try{await api("/api/incidents",{method:"POST",body:JSON.stringify(payload)});form.reset();form.hidden=true;$("#toggleIncidentForm").setAttribute("aria-expanded","false");$("#toggleIncidentForm").textContent="+ Report incident";await loadIncidents();notify("Incident report submitted successfully.","success");}catch(e){notify(`Could not submit incident: ${e.message}`,"error");}finally{button.disabled=false;button.textContent="Submit report";}}
async function loadAnnouncements(){try{state.announcements=asArray(await api("/api/announcements"));renderAnnouncements();}catch(e){$("#announcementsList").innerHTML=`<p class="empty-state">Could not load announcements: ${esc(e.message)}</p>`;}}
function renderAnnouncements(){const rows=state.announcements.filter(a=>a.active!==false&&(!a.targetAudience||["ALL","SHOP_OWNER","SHOP OWNERS","SHOP-OWNER","EVERYONE"].includes(String(a.targetAudience).toUpperCase())));$("#announcementsList").innerHTML=rows.length?rows.map(a=>`<article class="announcement-card"><div class="announcement-icon">▤</div><div><h3>${esc(a.title||"Announcement")}</h3><p>${esc(a.message||"")}</p><div class="announcement-meta"><span>Audience: ${esc(a.targetAudience||"All")}</span><span>Published: ${esc(dateText(a.createdAt))}</span>${a.expiresAt?`<span>Expires: ${esc(dateText(a.expiresAt))}</span>`:""}</div></div></article>`).join(""):'<p class="empty-state">No active announcements for shop owners right now.</p>';}
function toggleForm(formSelector,buttonSelector,labelOpen,labelClosed){const form=$(formSelector),button=$(buttonSelector);const open=form.hidden;form.hidden=!open;button.setAttribute("aria-expanded",String(open));button.textContent=open?labelClosed:labelOpen;if(open)form.querySelector("input,select,textarea")?.focus();}
function openModal(id){const modal=document.getElementById(id);if(!modal)return;modal.hidden=false;document.body.classList.add("modal-open");modal.querySelector("button")?.focus();}
function closeModal(id){const modal=document.getElementById(id);if(!modal)return;modal.hidden=true;if(!document.querySelector(".modal-backdrop:not([hidden])"))document.body.classList.remove("modal-open");}
async function signOut(){const button=$("#confirmSignOutButton");button.disabled=true;button.textContent="Signing out…";try{await api("/api/auth/logout",{method:"POST"});window.location.replace("/index.html");}catch(e){closeModal("signOutModal");notify(`Could not sign out: ${e.message}`,"error");button.disabled=false;button.textContent="Yes, sign out";}}

function setupCollapsiblePanels(){
  document.querySelectorAll(".panel").forEach((panel,index)=>{
    const heading=panel.querySelector(":scope > .panel-heading");
    if(!heading || panel.querySelector(":scope > .panel-collapse-toggle")) return;

    // Keep search/filter controls visible at all times; only the section results/content collapse.
    const alwaysVisible = Array.from(panel.children).filter(child =>
      child !== heading && (child.matches(".filters") || child.matches(".search-input") || child.matches(".panel-search-tools"))
    );
    let content=panel.querySelector(":scope > .panel-content");
    if(!content){
      content=document.createElement("div");
      content.className="panel-content";
      const siblings=Array.from(panel.children).filter(child=>child!==heading && !alwaysVisible.includes(child));
      siblings.forEach(child=>content.appendChild(child));
      // Put search controls immediately after the heading, before the Show/Hide-controlled content.
      let anchor=heading;
      alwaysVisible.forEach(child=>{
        panel.insertBefore(child,anchor.nextSibling);
        anchor=child;
      });
      panel.appendChild(content);
    }

    let actions=heading.querySelector(":scope > .panel-heading-actions");
    if(!actions){
      actions=document.createElement("div");
      actions.className="panel-heading-actions";
      heading.appendChild(actions);
      Array.from(heading.children).forEach(child=>{
        if(child!==actions && child.matches("button, .status-badge")) actions.insertBefore(child,actions.firstChild);
      });
    }
    const title=heading.querySelector("h2")?.textContent?.trim()||`Section ${index+1}`;
    const button=document.createElement("button");
    button.type="button";
    button.className="panel-collapse-toggle";
    button.setAttribute("aria-expanded","false");
    button.setAttribute("aria-controls",`panel-content-${index+1}`);
    content.id=`panel-content-${index+1}`;
    content.hidden=true;
    button.innerHTML='<span class="collapse-label">Show</span>';
    button.setAttribute("aria-label",`Show ${title} section content`);
    button.addEventListener("click",()=>{
      const expanded=button.getAttribute("aria-expanded")==="true";
      button.setAttribute("aria-expanded",String(!expanded));
      content.hidden=expanded;
      button.querySelector(".collapse-label").textContent=expanded?"Show":"Hide";
      button.setAttribute("aria-label",`${expanded?"Show":"Hide"} ${title} section content`);
    });
    actions.appendChild(button);
  });
}

function setupNavigation(){
  const sidebar=$("#sidebar"),layout=document.querySelector(".layout"),toggle=$("#menuToggle"),backdrop=$("#sidebarBackdrop");
  const mobile=()=>window.matchMedia("(max-width: 850px)").matches;
  const setOpen=(open)=>{
    if(mobile()){sidebar.classList.toggle("mobile-open",open);backdrop.hidden=!open;}
    else{layout.classList.toggle("sidebar-collapsed",!open);backdrop.hidden=true;}
    toggle.setAttribute("aria-expanded",String(open));
    toggle.setAttribute("aria-label",open?"Close navigation menu":"Open navigation menu");
    toggle.textContent=mobile()?(open?"×":"☰"):(open?"☰":"☰");
    toggle.title=mobile()?(open?"Close navigation":"Open navigation"):(open?"Collapse sidebar to icons":"Expand sidebar");
    document.body.classList.toggle("navigation-open",open&&mobile());
  };
  toggle.addEventListener("click",()=>{
    const open=mobile()?sidebar.classList.contains("mobile-open"):!layout.classList.contains("sidebar-collapsed");
    setOpen(!open);
  });
  backdrop.addEventListener("click",()=>setOpen(false));
  window.addEventListener("resize",()=>{if(!mobile()){sidebar.classList.remove("mobile-open");backdrop.hidden=true;document.body.classList.remove("navigation-open");toggle.setAttribute("aria-expanded",String(!layout.classList.contains("sidebar-collapsed")));toggle.textContent="☰";toggle.title=layout.classList.contains("sidebar-collapsed")?"Expand sidebar":"Collapse sidebar to icons";}else{layout.classList.remove("sidebar-collapsed");toggle.setAttribute("aria-expanded",String(sidebar.classList.contains("mobile-open")));toggle.textContent=sidebar.classList.contains("mobile-open")?"×":"☰";toggle.title=sidebar.classList.contains("mobile-open")?"Close navigation":"Open navigation";}});
  document.querySelectorAll("[data-nav]").forEach(link=>link.addEventListener("click",()=>{if(mobile())setOpen(false);}));
  document.addEventListener("keydown",event=>{if(event.key==="Escape"&&(sidebar.classList.contains("mobile-open")||layout.classList.contains("sidebar-collapsed"))){if(mobile())setOpen(false);else setOpen(false);}});
}

function revealPanelResults(panelSelector){
  const panel=$(panelSelector);
  if(!panel) return;
  const content=panel.querySelector(":scope > .panel-content");
  const button=panel.querySelector(".panel-collapse-toggle");
  if(content && button){
    content.hidden=false;
    button.setAttribute("aria-expanded","true");
    const label=button.querySelector(".collapse-label");
    if(label) label.textContent="Hide";
    const title=panel.querySelector("h2")?.textContent?.trim()||"section";
    button.setAttribute("aria-label",`Hide ${title} section content`);
  }
}

function wire(){setupCollapsiblePanels();setupNavigation();document.querySelectorAll("[data-nav]").forEach(a=>a.addEventListener("click",()=>{document.querySelectorAll("[data-nav]").forEach(x=>x.classList.toggle("active",x===a));}));$("#signOutButton").addEventListener("click",()=>openModal("signOutModal"));$("#confirmSignOutButton").addEventListener("click",signOut);$("#profileButton").addEventListener("click",()=>openModal("accountModal"));document.querySelectorAll("[data-close-modal]").forEach(button=>button.addEventListener("click",()=>closeModal(button.dataset.closeModal)));document.querySelectorAll(".modal-backdrop").forEach(modal=>modal.addEventListener("click",event=>{if(event.target===modal)closeModal(modal.id);}));document.addEventListener("keydown",event=>{if(event.key==="Escape")document.querySelectorAll(".modal-backdrop:not([hidden])").forEach(modal=>closeModal(modal.id));});$("#shopSearch").addEventListener("input",renderShops);$("#searchShops").addEventListener("click",()=>{renderShops();revealPanelResults("#explore-shops");});$("#shopCategoryFilter").addEventListener("change",()=>{renderShops();revealPanelResults("#explore-shops");});$("#shopFloorFilter").addEventListener("change",()=>{renderShops();revealPanelResults("#explore-shops");});$("#facilitySearch").addEventListener("input",renderFacilities);$("#searchFacilities").addEventListener("click",()=>{renderFacilities();revealPanelResults("#facilities");});$("#refreshShops").addEventListener("click",loadShops);$("#refreshFacilities").addEventListener("click",loadFacilities);$("#refreshAnnouncements").addEventListener("click",loadAnnouncements);$("#toggleMaintenanceForm").addEventListener("click",()=>toggleForm("#maintenanceForm","#toggleMaintenanceForm","+ New request","− Close form"));$("#cancelMaintenance").addEventListener("click",()=>{ $("#maintenanceForm").hidden=true;$("#toggleMaintenanceForm").textContent="+ New request";$("#toggleMaintenanceForm").setAttribute("aria-expanded","false");});$("#maintenanceForm").addEventListener("submit",submitMaintenance);$("#toggleIncidentForm").addEventListener("click",()=>toggleForm("#incidentForm","#toggleIncidentForm","+ Report incident","− Close form"));$("#cancelIncident").addEventListener("click",()=>{$("#incidentForm").hidden=true;$("#toggleIncidentForm").textContent="+ Report incident";$("#toggleIncidentForm").setAttribute("aria-expanded","false");});$("#incidentForm").addEventListener("submit",submitIncident);}
async function init(){wire();await Promise.all([loadProfile(),loadMyShop(),loadShops(),loadFacilities(),loadMaintenance(),loadIncidents(),loadAnnouncements(),loadFloors()]);}
document.addEventListener("DOMContentLoaded",init);
