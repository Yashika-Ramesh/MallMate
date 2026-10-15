/* MallMate Security Dashboard — Iteration 1
   Uses only endpoints exposed by the current backend. The UI does not expose admin-only writes. */
"use strict";

const $ = (selector, root = document) => root.querySelector(selector);
const state = {shops: [], incidents: [], maintenance: [], facilities: [], announcements: [], floors: []};
const globalMessage = $("#globalMessage");

const esc = (value) => String(value ?? "").replace(/[&<>"']/g, ch => ({
  "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;"
}[ch]));

function showMessage(message, type = "info") {
  globalMessage.textContent = message;
  globalMessage.className = `notice ${type}`;
  globalMessage.hidden = false;
  globalMessage.scrollIntoView({behavior:"smooth", block:"nearest"});
}
function clearMessage() { globalMessage.hidden = true; globalMessage.textContent = ""; }


async function getCsrf() {
  const response = await fetch("/api/auth/csrf", {
    credentials: "same-origin"
  });

  if (!response.ok) {
    throw new Error(
      "Could not obtain the security token. Refresh and sign in again."
    );
  }

  const cookie = document.cookie
    .split("; ")
    .find(c => c.startsWith("XSRF-TOKEN="));

  if (!cookie) {
    throw new Error(
      "CSRF token cookie not found. Refresh and sign in again."
    );
  }

  return {
    headerName: "X-XSRF-TOKEN",
    token: decodeURIComponent(
      cookie.substring("XSRF-TOKEN=".length)
    )
  };
}

async function apiRequest(url, options = {}) {
  const method = (options.method || "GET").toUpperCase();
  const headers = new Headers(options.headers || {});
  if (options.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  const config = {...options, method, headers, credentials:"same-origin"};
  if (!["GET","HEAD","OPTIONS","TRACE"].includes(method)) {
    const csrf = await getCsrf();
    headers.set(csrf.headerName || "X-XSRF-TOKEN", csrf.token);
  }
  const response = await fetch(url, config);
  if (response.status === 204) return null;
  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json") ? await response.json().catch(() => null) : await response.text().catch(() => "");
  if (!response.ok) {
    if (response.status === 401) throw new Error("Your session is not authenticated. Sign in with a STAFF account and reopen this dashboard.");
    if (response.status === 403) throw new Error("Access denied. This action is not permitted for the current role.");
    throw new Error(payload?.message || payload?.detail || payload || `Request failed (${response.status})`);
  }
  return payload;
}
function asArray(data) { return Array.isArray(data) ? data : []; }
function dateText(value) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? esc(value) : date.toLocaleString([], {dateStyle:"medium", timeStyle:"short"});
}
function badge(value) {
  const label = String(value || "Unknown").replaceAll("_"," ");
  const cls = String(value || "").toLowerCase().replaceAll("_","-").replaceAll(" ","-");
  return `<span class="status-badge status-${esc(cls)}">${esc(label)}</span>`;
}
function setCount(id, value, noun) { $(id).textContent = `${value} ${noun}${value === 1 ? "" : "s"}`; }
function emptyRow(cols, message) { return `<tr><td class="empty" colspan="${cols}">${esc(message)}</td></tr>`; }

function populateMaintenanceShopOptions() {
  const select = $("#maintenanceShop");
  if (!select) return;
  const current = select.value;
  select.innerHTML = '<option value="">Select a shop</option>' + state.shops.map(shop =>
    `<option value="${esc(shop.id)}">${esc(shop.name || `Shop ${shop.id}`)}${shop.shopNumber ? ` · ${esc(shop.shopNumber)}` : ""}</option>`
  ).join("");
  if (current) select.value = current;
}
function setMaintenanceForm(open) {
  const form = $("#maintenanceForm");
  const toggle = $("#openMaintenanceForm");
  form.hidden = !open;
  toggle.textContent = open ? "× Close form" : "＋ Report maintenance";
  toggle.setAttribute("aria-expanded", String(open));
  if (open) form.scrollIntoView({behavior:"smooth",block:"center"});
}
async function submitMaintenance(event) {
  event.preventDefault(); clearMessage();
  const form = event.currentTarget; const values = new FormData(form);
  const payload = {title:String(values.get("title")||"").trim(), description:String(values.get("description")||"").trim(), category:String(values.get("category")||"").trim(), priority:String(values.get("priority")||"MEDIUM"), shopId:Number(values.get("shopId"))};
  if (!payload.shopId) { showMessage("Please select the affected shop.", "error"); return; }
  const button = $("#submitMaintenance"); button.disabled = true; button.textContent = "Submitting…";
  try {
    await apiRequest("/api/maintenance", {method:"POST", body:JSON.stringify(payload)});
    form.reset(); setMaintenanceForm(false); await loadMaintenance();
    showMessage("Maintenance request submitted successfully.", "success");
  } catch (e) { showMessage(`Could not submit maintenance request: ${e.message}`, "error"); }
  finally { button.disabled = false; button.textContent = "Submit request"; }
}

async function loadShops() {
  try {
    state.shops = asArray(await apiRequest("/api/shops"));
    const categorySelect = $("#shopCategoryFilter");
    if (categorySelect) {
      const selectedCategory = categorySelect.value;
      const categories = [...new Set(state.shops.map(shop => String(shop.categoryName || "").trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b));
      categorySelect.innerHTML = '<option value="">All categories</option>' + categories.map(category => `<option value="${esc(category)}">${esc(category)}</option>`).join("");
      categorySelect.value = categories.includes(selectedCategory) ? selectedCategory : "";
    }
    // These fields are supplied by ShopResponseDTO; status and operatingStatus are intentionally separate.
    $("#statShops").textContent = state.shops.length;
    $("#statOpenShops").textContent = state.shops.filter(s => String(s.operatingStatus || "").toUpperCase() === "OPEN").length;
    $("#statMaintenanceShops").textContent = state.shops.filter(s => s.underMaintenance === true || String(s.operatingStatus || "").toUpperCase() === "UNDER_MAINTENANCE").length;
    renderShops();
  } catch (e) {
    $("#shopsBody").innerHTML = emptyRow(8, e.message);
    $("#statShops").textContent = "—";
    $("#statOpenShops").textContent = "—";
    $("#statMaintenanceShops").textContent = "—";
  }
}
function renderShops() {
  const query = $("#shopSearch").value.trim().toLowerCase();
  const category = $("#shopCategoryFilter").value.trim().toLowerCase();
  const operatingFilter = $("#shopOperatingFilter").value.toUpperCase();
  const rows = state.shops.filter(s => {
    const haystack = [s.name,s.shopNumber,s.categoryName,s.floorName,s.floorNumber,s.description,s.status,s.operatingStatus,s.underMaintenance,s.openingTime,s.closingTime].join(" ").toLowerCase();
    const operatingStatus = String(s.operatingStatus || (s.underMaintenance ? "UNDER_MAINTENANCE" : "UNKNOWN")).toUpperCase();
    const shopCategory = String(s.categoryName || "").trim().toLowerCase();
    return haystack.includes(query) && (!category || shopCategory === category) && (!operatingFilter || operatingStatus === operatingFilter);
  });
  $("#shopsBody").innerHTML = rows.length ? rows.map(s => {
    const maintenance = s.underMaintenance === true;
    const opStatus = s.operatingStatus || (s.underMaintenance ? "UNDER_MAINTENANCE" : "UNKNOWN");
    return `<tr>
      <td><span class="primary-cell">${esc(s.name || "Unnamed shop")}</span><span class="sub-cell">${esc(s.description || "")}</span></td>
      <td>${esc(s.shopNumber || "—")}</td>
      <td>${esc(s.categoryName || "—")}</td>
      <td>${esc(s.floorName || (s.floorNumber != null ? `Floor ${s.floorNumber}` : "—"))}</td>
      <td>${badge(s.status)}</td>
      <td>${badge(opStatus)}</td>
      <td>${maintenance ? badge("UNDER_MAINTENANCE") : '<span class="maintenance-no">No</span>'}</td>
      <td>${esc(s.openingTime || "—")} – ${esc(s.closingTime || "—")}</td>
    </tr>`;
  }).join("") : emptyRow(8, "No shops match your search or filters.");
  setCount("#shopCount", rows.length, "shop");
}

async function loadFloors() {
  try {
    state.floors = asArray(await apiRequest("/api/floors"));
    $("#incidentFloor").innerHTML = '<option value="">Select floor</option>' + state.floors.map(f =>
      `<option value="${esc(f.id)}">${esc(f.name || `Floor ${f.floorNumber ?? f.id}`)}${f.floorNumber != null ? ` · ${esc(f.floorNumber)}` : ""}</option>`
    ).join("");
  } catch (e) {
    $("#incidentFloor").innerHTML = '<option value="">Floors unavailable</option>';
    console.warn("Staff floor list unavailable:", e.message);
  }
}
async function loadIncidents() {
  try {
    state.incidents = asArray(await apiRequest("/api/incidents"));
    renderIncidents();
    renderPriorityAlerts();
    $("#statIncidents").textContent = state.incidents.length;
  } catch (e) {
    $("#incidentsBody").innerHTML = emptyRow(6, e.message);
    $("#priorityAlertList").innerHTML = `<div class="empty-card">Priority alerts unavailable: ${esc(e.message)}</div>`;
    $("#statIncidents").textContent = "—";
  }
}
function renderPriorityAlerts() {
  const urgent = state.incidents.filter(i => {
    const severity = String(i.severity || i.priority || "").toUpperCase();
    const status = String(i.status || "").toUpperCase();
    const unresolved = !["RESOLVED", "CLOSED", "COMPLETED", "CANCELLED"].includes(status);
    return ["HIGH", "CRITICAL", "URGENT", "EMERGENCY"].includes(severity) && unresolved;
  }).sort((a,b) => {
    const rank = value => ({CRITICAL:0, EMERGENCY:0, URGENT:0, HIGH:1}[String(value || "").toUpperCase()] ?? 2);
    return rank(a.severity || a.priority) - rank(b.severity || b.priority)
      || new Date(b.reportedAt || b.createdAt || 0) - new Date(a.reportedAt || a.createdAt || 0);
  });
  const host = $("#priorityAlertList");
  if (!host) return;
  host.innerHTML = urgent.length ? urgent.map(i => `
    <article class="priority-alert-card ${String(i.severity || i.priority || "HIGH").toLowerCase()}">
      <span class="priority-alert-icon" aria-hidden="true">!</span>
      <div class="priority-alert-copy"><div class="priority-alert-top"><strong>${esc(i.title || i.incidentType || "Priority incident")}</strong>${badge(i.severity || i.priority || "HIGH")}</div>
      <p>${esc(i.description || "No additional description provided.")}</p>
      <div class="priority-alert-meta"><span>${esc(i.incidentType || "Incident")}</span><span>${i.floorNumber == null ? "Floor not specified" : `Floor ${esc(i.floorNumber)}`}</span><span>${esc(i.status || "OPEN")}</span><span>${dateText(i.reportedAt || i.createdAt)}</span></div></div>
    </article>`).join("") : '<div class="priority-clear"><strong>No active high-priority incidents</strong><span>High or critical unresolved reports will appear here automatically.</span></div>';
}

function renderIncidents() {
  const q = $("#incidentSearch").value.trim().toLowerCase();
  const severity = $("#incidentSeverityFilter").value.toLowerCase();
  const rows = state.incidents.filter(i => {
    const hay = [i.title,i.description,i.incidentType,i.status,i.floorNumber,i.reportedByName].join(" ").toLowerCase();
    return hay.includes(q) && (!severity || String(i.severity || "").toLowerCase() === severity);
  });
  $("#incidentsBody").innerHTML = rows.length ? rows.map(i => `<tr>
    <td><span class="primary-cell">${esc(i.title)}</span><span class="sub-cell">${esc(i.description || "")}</span></td>
    <td>${esc(i.incidentType || "—")}</td><td>${badge(i.severity)}</td><td>${badge(i.status)}</td>
    <td>${i.floorNumber == null ? "—" : `Floor ${esc(i.floorNumber)}`}</td>
    <td>${dateText(i.reportedAt)}</td>
  </tr>`).join("") : emptyRow(6, "No incidents match your search.");
  setCount("#incidentCount", rows.length, "incident");
}
function setIncidentForm(open) {
  const form = $("#incidentForm");
  const toggle = $("#openIncidentForm");
  form.hidden = !open;
  toggle.textContent = open ? "× Close form" : "＋ Report incident";
  toggle.setAttribute("aria-expanded", String(open));
  if (open) form.scrollIntoView({behavior:"smooth",block:"center"});
}
async function submitIncident(event) {
  event.preventDefault();
  clearMessage();
  const form = event.currentTarget;
  const values = new FormData(form);
  const payload = {
    title: String(values.get("title") || "").trim(),
    description: String(values.get("description") || "").trim(),
    incidentType: String(values.get("incidentType") || "").trim(),
    severity: String(values.get("severity") || "MEDIUM"),
    floorId: Number(values.get("floorId"))
  };
  if (!payload.floorId) { showMessage("Please select a floor before submitting.", "error"); return; }
  const button = $("#submitIncident");
  button.disabled = true; button.textContent = "Submitting…";
  try {
    await apiRequest("/api/incidents", {method:"POST", body:JSON.stringify(payload)});
    form.reset();
    setIncidentForm(false);
    await loadIncidents();
    showMessage("Incident report submitted successfully.", "success");
  } catch (e) {
    showMessage(`Could not submit incident: ${e.message}`, "error");
  } finally {
    button.disabled = false; button.textContent = "Submit report";
  }
}

async function loadMaintenance() {
  try {
    state.maintenance = asArray(await apiRequest("/api/maintenance"));
    renderMaintenance();
    $("#statMaintenance").textContent = state.maintenance.length;
  } catch (e) {
    $("#maintenanceBody").innerHTML = emptyRow(6, e.message);
    $("#statMaintenance").textContent = "—";
  }
}
function renderMaintenance() {
  const q = $("#maintenanceSearch").value.trim().toLowerCase();
  const status = $("#maintenanceStatusFilter").value.toLowerCase();
  const rows = state.maintenance.filter(m => {
    const hay = [m.title,m.description,m.category,m.priority,m.status,m.shopName].join(" ").toLowerCase();
    return hay.includes(q) && (!status || String(m.status || "").toLowerCase() === status);
  });
  $("#maintenanceBody").innerHTML = rows.length ? rows.map(m => `<tr>
    <td><span class="primary-cell">${esc(m.title)}</span><span class="sub-cell">${esc(m.description || "")}</span></td>
    <td>${esc(m.shopName || "—")}</td><td>${esc(m.category || "—")}</td><td>${badge(m.priority)}</td>
    <td>${badge(m.status)}</td><td>${dateText(m.createdAt)}</td>
  </tr>`).join("") : emptyRow(6, "No maintenance requests match your search.");
  setCount("#maintenanceCount", rows.length, "request");
}

async function loadFacilities({notify = false} = {}) {
  const button = $("#refreshFacilities");
  const oldLabel = button.textContent;
  button.disabled = true; button.textContent = "Refreshing…";
  try {
    state.facilities = asArray(await apiRequest("/api/facilities"));
    renderFacilities();
    if (notify) showMessage("Facilities refreshed successfully.", "success");
  } catch (e) {
    $("#facilitiesBody").innerHTML = emptyRow(5, e.message);
    $("#facilityCount").textContent = "Facilities unavailable";
    if (notify) showMessage(`Could not refresh facilities: ${e.message}`, "error");
  } finally { button.disabled = false; button.textContent = oldLabel; }
}
function renderFacilities() {
  const q = $("#facilitySearch").value.trim().toLowerCase();
  const rows = state.facilities.filter(f => [f.name, f.type, f.description, f.locationDescription, f.floorNumber].join(" ").toLowerCase().includes(q));
  $("#facilitiesBody").innerHTML = rows.length ? rows.map(f => `<tr>
    <td><span class="primary-cell">${esc(f.name || "Facility")}</span></td>
    <td>${esc(f.type || "General facility")}</td>
    <td><span class="sub-cell">${esc(f.description || "No description provided.")}</span></td>
    <td>${esc(f.locationDescription || "Location not specified")}</td>
    <td>${f.floorNumber == null ? "—" : esc(f.floorNumber)}</td>
  </tr>`).join("") : emptyRow(5, "No facilities match your search.");
  setCount("#facilityCount", rows.length, "facility");
}
async function loadAnnouncements() {
  try {
    state.announcements = asArray(await apiRequest("/api/announcements"));
    renderAnnouncements();
    $("#statAnnouncements").textContent = state.announcements.length;
  } catch (e) {
    $("#announcementsList").innerHTML = `<div class="empty-card">${esc(e.message)}</div>`;
    $("#statAnnouncements").textContent = "—";
  }
}
function renderAnnouncements() {
  const q = $("#announcementSearch")?.value.trim().toLowerCase() || "";
  const rows = state.announcements.filter(a => a.active !== false && [a.title,a.message,a.targetAudience,a.createdByName].join(" ").toLowerCase().includes(q));
  $("#announcementsList").innerHTML = rows.length ? rows.map(a => `<article class="announcement-card">
    <span class="announcement-icon">▤</span><div class="announcement-content">
      <h3>${esc(a.title || "Announcement")}</h3><p>${esc(a.message || "")}</p>
      <div class="announcement-meta"><span>Audience: ${esc(a.targetAudience || "All")}</span><span>Published: ${dateText(a.createdAt)}</span>${a.expiresAt ? `<span>Expires: ${dateText(a.expiresAt)}</span>` : ""}${a.createdByName ? `<span>By ${esc(a.createdByName)}</span>` : ""}</div>
    </div></article>`).join("") : '<div class="empty-card">No active announcements right now.</div>';
}
async function loadProfile() {
  try {
    const me = await apiRequest("/api/users/me");
    state.profile = me;
    const name = me.name || me.fullName || me.username || "Security officer";
    $("#profileName").textContent = name;
    $("#profileAvatar").textContent = name.trim().charAt(0).toUpperCase() || "S";
    $("#profileRole").textContent = me.role || "SECURITY";
    renderProfileDetails();
  } catch (e) {
    state.profileError = e.message;
    $("#profileDetails").innerHTML = `<p class="notice error">${esc(e.message)}</p>`;
    console.info("Could not load profile:", e.message);
  }
}
function renderProfileDetails() {
  const me = state.profile;
  if (!me) return;
  const fields = [
    ["Full name", me.name || me.fullName],
    ["Username", me.username],
    ["Email address", me.email],
    ["Phone number", me.phone || me.phoneNumber],
    ["Role", me.role || "SECURITY"],
    ["Account status", me.active === false ? "Inactive" : "Active"]
  ];
  $("#profileDetails").innerHTML = fields.map(([label, value]) => `
    <div class="profile-detail-row"><span>${esc(label)}</span><strong>${esc(value || "Not provided")}</strong></div>`).join("");
}
function openModal(id) {
  const modal = document.getElementById(id);
  if (!modal) return;
  modal.hidden = false;
  document.body.classList.add("modal-open");
  const focusTarget = modal.querySelector("button:not([disabled])");
  if (focusTarget) focusTarget.focus();
}
function closeModal(id) {
  const modal = document.getElementById(id);
  if (!modal) return;
  modal.hidden = true;
  if (!document.querySelector(".modal-backdrop:not([hidden])")) document.body.classList.remove("modal-open");
}
function openLogoutModal() {
  $("#logoutModalError").hidden = true;
  $("#logoutModalError").textContent = "";
  openModal("logoutModal");
}
async function logout() {
  const button = $("#confirmLogout");
  const label = button.textContent;
  button.disabled = true;
  button.textContent = "Signing out…";
  $("#cancelLogout").disabled = true;
  $("#logoutModalError").hidden = true;
  try {
    await apiRequest("/api/auth/logout", {method:"POST"});
    window.location.href = "/index.html";
  } catch (e) {
    $("#logoutModalError").textContent = `Could not complete sign out: ${e.message}`;
    $("#logoutModalError").hidden = false;
  } finally {
    button.disabled = false;
    button.textContent = label;
    $("#cancelLogout").disabled = false;
  }
}
async function refreshWithFeedback(buttonSelector, loader, label) {
  const button = $(buttonSelector);
  const original = button.textContent;
  button.disabled = true; button.textContent = "Refreshing…";
  try { await loader(); showMessage(`${label} refreshed successfully.`, "success"); }
  catch (e) { showMessage(`Could not refresh ${label.toLowerCase()}: ${e.message}`, "error"); }
  finally { button.disabled = false; button.textContent = original; }
}
function activateNavigation() {
  document.querySelectorAll("[data-view]").forEach(link => link.addEventListener("click", () => {
    document.querySelectorAll("[data-view]").forEach(item => item.classList.toggle("active", item === link));
    $("#sidebar").classList.remove("mobile-open");
  }));
  document.querySelectorAll("[data-go]").forEach(button => button.addEventListener("click", () => {
    const target = button.dataset.go;
    document.querySelector(`.nav-link[data-view="${target}"]`)?.click();
    document.getElementById(target)?.scrollIntoView({behavior:"smooth"});
  }));
  $("#menuToggle").addEventListener("click", () => {
    const sidebar = $("#sidebar");
    if (window.matchMedia("(max-width: 850px)").matches) {
      sidebar.classList.toggle("mobile-open");
      $("#menuToggle").setAttribute("aria-expanded", String(sidebar.classList.contains("mobile-open")));
    } else {
      document.body.classList.toggle("sidebar-collapsed");
      $("#menuToggle").setAttribute("aria-expanded", String(!document.body.classList.contains("sidebar-collapsed")));
    }
  });
}
function wireSectionToggles() {
  document.querySelectorAll("[data-toggle-section]").forEach(button => {
    button.addEventListener("click", () => {
      const target = document.getElementById(button.dataset.toggleSection);
      if (!target) return;
      const willOpen = target.hidden;
      target.hidden = !willOpen;
      button.setAttribute("aria-expanded", String(willOpen));
      button.textContent = willOpen ? "Hide" : "Show";
    });
  });
}
function wireEvents() {
  wireSectionToggles();
  // Search controls stay visible at all times. When Search is clicked, reveal the
  // matching results panel as well, otherwise the render succeeds behind a hidden panel.
  const revealResults = (contentId) => {
    const content = document.getElementById(contentId);
    if (!content) return;
    content.hidden = false;
    const toggle = document.querySelector(`[data-toggle-section="${contentId}"]`);
    if (toggle) {
      toggle.setAttribute("aria-expanded", "true");
      toggle.textContent = "Hide";
    }
  };
  const bindSearch = (inputSelector, buttonSelector, render, contentId) => {
    const input = $(inputSelector);
    const button = $(buttonSelector);
    if (!input || !button) return;
    const runSearch = () => { render(); revealResults(contentId); };
    button.addEventListener("click", runSearch);
    input.addEventListener("keydown", event => {
      if (event.key === "Enter") { event.preventDefault(); runSearch(); }
    });
  };
  bindSearch("#shopSearch", "#searchShops", renderShops, "shopsContent");
  $("#shopCategoryFilter").addEventListener("change", () => { renderShops(); revealResults("shopsContent"); });
  $("#shopOperatingFilter").addEventListener("change", () => { renderShops(); revealResults("shopsContent"); });
  bindSearch("#incidentSearch", "#searchIncidents", renderIncidents, "incidentsContent");
  $("#incidentSeverityFilter").addEventListener("change", () => { renderIncidents(); revealResults("incidentsContent"); });
  bindSearch("#maintenanceSearch", "#searchMaintenance", renderMaintenance, "maintenanceContent");
  $("#maintenanceStatusFilter").addEventListener("change", () => { renderMaintenance(); revealResults("maintenanceContent"); });
  bindSearch("#facilitySearch", "#searchFacilities", renderFacilities, "facilitiesContent");
  bindSearch("#announcementSearch", "#searchAnnouncements", renderAnnouncements, "announcementsContent");
  // Clear restores the original unfiltered state, including every dropdown.
  const clearSearchAndFilters = (inputSelector, filterSelectors, render, contentId) => {
    const input = $(inputSelector);
    if (input) input.value = "";
    filterSelectors.forEach(selector => { const control = $(selector); if (control) control.selectedIndex = 0; });
    render();
    revealResults(contentId);
    if (input) input.focus();
  };
  $("#clearShopSearch").addEventListener("click", () => clearSearchAndFilters("#shopSearch", ["#shopCategoryFilter", "#shopOperatingFilter"], renderShops, "shopsContent"));
  $("#clearIncidentSearch").addEventListener("click", () => clearSearchAndFilters("#incidentSearch", ["#incidentSeverityFilter"], renderIncidents, "incidentsContent"));
  $("#clearMaintenanceSearch").addEventListener("click", () => clearSearchAndFilters("#maintenanceSearch", ["#maintenanceStatusFilter"], renderMaintenance, "maintenanceContent"));
  $("#clearAnnouncementSearch").addEventListener("click", () => clearSearchAndFilters("#announcementSearch", [], renderAnnouncements, "announcementsContent"));
  $("#clearFacilitySearch").addEventListener("click", () => clearSearchAndFilters("#facilitySearch", [], renderFacilities, "facilitiesContent"));
  $("#openIncidentForm").addEventListener("click", () => setIncidentForm($("#incidentForm").hidden));
  $("#openMaintenanceForm").addEventListener("click", () => setMaintenanceForm($("#maintenanceForm").hidden));
  $("#closeMaintenanceForm").addEventListener("click", () => setMaintenanceForm(false));
  $("#cancelMaintenanceForm").addEventListener("click", () => { $("#maintenanceForm").reset(); setMaintenanceForm(false); });
  $("#maintenanceForm").addEventListener("submit", submitMaintenance);
  $("#closeIncidentForm").addEventListener("click", () => setIncidentForm(false));
  $("#cancelIncidentForm").addEventListener("click", () => { $("#incidentForm").reset(); setIncidentForm(false); });
  $("#incidentForm").addEventListener("submit", submitIncident);
  $("#logoutButton").addEventListener("click", openLogoutModal);
  $("#confirmLogout").addEventListener("click", logout);
  $("#cancelLogout").addEventListener("click", () => closeModal("logoutModal"));
  $("#openProfile").addEventListener("click", async () => {
    openModal("profileModal");
    if (!state.profile && !state.profileError) await loadProfile();
  });
  document.querySelectorAll("[data-close-modal]").forEach(button => button.addEventListener("click", () => closeModal(button.dataset.closeModal)));
  document.querySelectorAll(".modal-backdrop").forEach(modal => modal.addEventListener("click", event => {
    if (event.target === modal) closeModal(modal.id);
  }));
  document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      const opened = document.querySelector(".modal-backdrop:not([hidden])");
      if (opened) closeModal(opened.id);
    }
  });
}
async function init() {
  $("#year").textContent = new Date().getFullYear();
  $("#todayLabel").textContent = new Date().toLocaleDateString([], {weekday:"short", month:"short", day:"numeric", year:"numeric"});
  activateNavigation(); wireEvents();
  // Each section handles its own 401/403 so one unavailable endpoint won't blank the whole dashboard.
  await Promise.all([loadProfile(), loadShops(), loadFloors(), loadIncidents(), loadMaintenance(), loadFacilities(), loadAnnouncements()]);
}
document.addEventListener("DOMContentLoaded", init);
