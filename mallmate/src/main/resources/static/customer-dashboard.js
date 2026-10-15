(() => {
  'use strict';
  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => [...document.querySelectorAll(selector)];
  const state = { user: null, shops: [], facilities: [], floors: [], toastTimer: null };

  function safe(value, fallback = '') { return value === null || value === undefined || value === '' ? fallback : String(value); }
  function escapeHtml(value) { return String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch])); }
  function initials(name) { return safe(name, 'Customer').trim().split(/\s+/).slice(0, 2).map(part => part[0] || '').join('').toUpperCase() || 'C'; }
  function showToast(message) { const toast = $('#toast'); toast.textContent = message; toast.classList.add('show'); clearTimeout(state.toastTimer); state.toastTimer = setTimeout(() => toast.classList.remove('show'), 3800); }
  function getCookie(name) { for (const part of document.cookie.split(';')) { const [key, ...rest] = part.trim().split('='); if (key === name) return decodeURIComponent(rest.join('=')); } return null; }
  async function ensureCsrf() {
    let token = getCookie('XSRF-TOKEN');
    if (token) return token;
    const response = await fetch('/api/auth/csrf', { credentials: 'same-origin', headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error('Could not initialize the secure request. Refresh the page and try again.');
    token = getCookie('XSRF-TOKEN');
    if (!token) throw new Error('Security token was not available. Refresh the page and try again.');
    return token;
  }
  async function api(path, options = {}) {
    const headers = { Accept: 'application/json', ...(options.headers || {}) };
    const request = { credentials: 'same-origin', ...options, headers };
    if (request.body && typeof request.body !== 'string') { request.body = JSON.stringify(request.body); headers['Content-Type'] = 'application/json'; }
    if (request.method && !['GET', 'HEAD', 'OPTIONS'].includes(request.method.toUpperCase())) headers['X-XSRF-TOKEN'] = await ensureCsrf();
    const response = await fetch(path, request);
    const text = await response.text();
    let payload = null;
    if (text) { try { payload = JSON.parse(text); } catch { payload = text; } }
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) throw new Error('Your session may have expired, or your account may not have permission for this action. Please sign in again if needed.');
      const message = payload && typeof payload === 'object' ? (payload.message || payload.error) : payload;
      throw new Error(message || `Request failed (${response.status}).`);
    }
    return payload;
  }
  function unwrapList(payload) { if (Array.isArray(payload)) return payload; if (payload && Array.isArray(payload.content)) return payload.content; if (payload && Array.isArray(payload.data)) return payload.data; return []; }
  function displayError(container, message) { container.innerHTML = `<div class="loading-card">${escapeHtml(message)}</div>`; }

  function getUserName(user) { return safe(user?.name || user?.fullName || user?.username, 'Customer'); }
  function getRole(user) { const role = user?.role; if (typeof role === 'string') return role.replace(/^ROLE_/, '').toUpperCase(); if (role && typeof role === 'object') return safe(role.name || role.roleName, 'CUSTOMER').replace(/^ROLE_/, '').toUpperCase(); return 'CUSTOMER'; }
  function renderUser(user) {
    state.user = user || {};
    const name = getUserName(user); const init = initials(name); const email = safe(user?.email, ''); const username = safe(user?.username, 'customer');
    $('#headerName').textContent = name; $('#welcomeName').textContent = name.split(/\s+/)[0]; $('#avatarInitials').textContent = init;
    $('#popoverInitials').textContent = init; $('#popoverName').textContent = name; $('#popoverEmail').textContent = email || `@${username}`;
    $('#profileAvatar').textContent = init; $('#profileFullName').textContent = name; $('#profileUsername').textContent = `@${username}`;
    $('#detailName').textContent = name; $('#detailUsername').textContent = username; $('#detailEmail').textContent = safe(user?.email, 'Not provided'); $('#detailPhone').textContent = safe(user?.phone, 'Not provided');
    $('#detailStatus').textContent = user?.active === false ? 'Inactive' : 'Active'; $('#detailRole').textContent = getRole(user).replaceAll('_', ' ');
  }
  function shopIcon(shop) { const value = `${shop?.categoryName || ''} ${shop?.name || ''}`.toLowerCase(); if (/food|restaurant|cafe|coffee|bakery|dining/.test(value)) return '☕'; if (/book|stationery/.test(value)) return '▤'; if (/fashion|cloth|apparel|shoe|footwear/.test(value)) return '♧'; if (/tech|electronic|mobile|computer/.test(value)) return '⌘'; if (/beauty|salon|cosmetic/.test(value)) return '✿'; if (/jewel|watch/.test(value)) return '◇'; if (/sport|fitness/.test(value)) return '↗'; return '▦'; }
  function shopCard(shop) {
    const status = safe(shop.status, 'ACTIVE').toUpperCase(); const available = status === 'ACTIVE' && shop.underMaintenance !== true;
    return `<article class="shop-card"><div class="shop-card-top"><span class="shop-emoji">${shopIcon(shop)}</span><span class="status-chip ${available ? '' : 'inactive'}">${escapeHtml(status.replaceAll('_',' '))}</span></div><div class="shop-card-body"><div class="shop-card-heading"><h3>${escapeHtml(safe(shop.name, 'Unnamed shop'))}</h3><span class="shop-number">${escapeHtml(safe(shop.shopNumber, 'Shop'))}</span></div><div class="shop-category">${escapeHtml(safe(shop.categoryName, 'General retail'))}</div><p class="shop-description">${escapeHtml(safe(shop.description, 'Explore this store at MallMate.'))}</p><div class="shop-meta"><span>⌖ ${escapeHtml(safe(shop.floorName, shop.floorNumber != null ? `Floor ${shop.floorNumber}` : 'Mall directory'))}</span><span><strong>${escapeHtml(safe(shop.openingTime, ''))}${shop.openingTime && shop.closingTime ? ' – ' : ''}${escapeHtml(safe(shop.closingTime, ''))}</strong></span></div></div></article>`;
  }
  function renderShops() {
    const featured = $('#featuredShops'); const directory = $('#shopDirectory');
    const q = ($('#shopSearch')?.value || '').trim().toLowerCase(); const category = $('#shopCategory')?.value || ''; const floor = $('#shopFloor')?.value || '';
    const list = state.shops.filter(shop => {
      const searchText = [shop.name, shop.shopNumber, shop.description, shop.categoryName, shop.floorName, shop.floorNumber].join(' ').toLowerCase();
      return (!q || searchText.includes(q)) && (!category || safe(shop.categoryName) === category) && (!floor || safe(shop.floorNumber) === floor || safe(shop.floorName) === floor);
    });
    $('#shopResultCount').textContent = `${list.length} ${list.length === 1 ? 'shop' : 'shops'} found`;
    $('#shopEmpty').classList.toggle('hidden', list.length > 0);
    directory.innerHTML = list.length ? list.map(shopCard).join('') : '';
    const featuredList = state.shops.slice(0, 3); featured.innerHTML = featuredList.length ? featuredList.map(shopCard).join('') : '<div class="loading-card">No shops are available in the directory yet.</div>';
  }
  function fillShopFilters() {
    const categories = [...new Set(state.shops.map(s => safe(s.categoryName)).filter(Boolean))].sort();
    const floors = [...new Set(state.shops.map(s => s.floorNumber != null ? String(s.floorNumber) : safe(s.floorName)).filter(Boolean))].sort((a,b) => a.localeCompare(b, undefined, {numeric:true}));
    $('#shopCategory').innerHTML = '<option value="">All categories</option>' + categories.map(v => `<option value="${escapeHtml(v)}">${escapeHtml(v)}</option>`).join('');
    $('#shopFloor').innerHTML = '<option value="">All floors</option>' + floors.map(v => `<option value="${escapeHtml(v)}">${escapeHtml(/^\d+$/.test(v) ? `Floor ${v}` : v)}</option>`).join('');
  }
  function facilityIcon(facility) { const text = `${facility?.name || ''} ${facility?.type || ''}`.toLowerCase(); if (/restroom|toilet|washroom/.test(text)) return '♧'; if (/parking/.test(text)) return 'P'; if (/lift|elevator|escalator/.test(text)) return '⇅'; if (/first aid|medical|clinic/.test(text)) return '✚'; if (/atm|bank/.test(text)) return '₹'; if (/information|help desk/.test(text)) return 'i'; if (/food|water/.test(text)) return '♨'; if (/prayer/.test(text)) return '✧'; return '⌖'; }
  function renderFacilities() {
    const query = ($('#facilitySearch').value || '').trim().toLowerCase();
    const list = state.facilities.filter(item => [item.name,item.type,item.description,item.locationDescription,item.floorName,item.floorNumber].join(' ').toLowerCase().includes(query));
    $('#facilityResultCount').textContent = `${list.length} ${list.length === 1 ? 'facility' : 'facilities'} found`; $('#facilityEmpty').classList.toggle('hidden', list.length > 0);
    $('#facilityDirectory').innerHTML = list.map(item => `<article class="facility-card"><div class="facility-card-top"><span class="facility-icon">${facilityIcon(item)}</span><span class="facility-type">${escapeHtml(safe(item.type, 'FACILITY'))}</span></div><h3>${escapeHtml(safe(item.name, 'Unnamed facility'))}</h3><p>${escapeHtml(safe(item.description, 'A helpful facility for mall visitors.'))}</p><div class="facility-location"><span>⌖</span><span>${escapeHtml(safe(item.locationDescription, safe(item.floorName, item.floorNumber != null ? `Floor ${item.floorNumber}` : 'Location details not listed')))}</span></div></article>`).join('');
    if (!list.length) $('#facilityDirectory').innerHTML = '';
  }
  async function loadDirectory() {
    try { state.shops = unwrapList(await api('/api/shops')); fillShopFilters(); renderShops(); }
    catch (error) { displayError($('#featuredShops'), `Could not load shops: ${error.message}`); displayError($('#shopDirectory'), `Could not load shops: ${error.message}`); $('#shopResultCount').textContent = 'Shop directory unavailable'; }
    try { state.facilities = unwrapList(await api('/api/facilities')); renderFacilities(); }
    catch (error) { displayError($('#facilityDirectory'), `Could not load facilities: ${error.message}`); $('#facilityResultCount').textContent = 'Facility directory unavailable'; }
    try { state.floors = unwrapList(await api('/api/floors')); const floorSelect = $('#incidentFloor'); floorSelect.innerHTML = '<option value="">Choose a floor</option>' + state.floors.map(f => `<option value="${escapeHtml(f.id)}">${escapeHtml(f.name || (f.floorNumber != null ? `Floor ${f.floorNumber}` : `Floor ${f.id}`))}</option>`).join(''); }
    catch (error) { $('#incidentFloor').innerHTML = '<option value="">Floor list unavailable</option>'; console.warn('Could not load floors:', error); }
  }
  function navigate(view) {
    const allowed = ['overview','shops','facilities','report','profile']; if (!allowed.includes(view)) view = 'overview';
    $$('.view').forEach(el => el.classList.toggle('active', el.dataset.page === view));
    $$('.nav-link').forEach(el => el.classList.toggle('active', el.dataset.view === view));
    const labels = { overview:'Overview', shops:'Shop directory', facilities:'Facilities', report:'Report an issue', profile:'My profile' };
    $('#breadcrumbLabel').textContent = labels[view]; history.replaceState(null, '', `#${view}`); $('#profilePopover').classList.add('hidden'); closeMobileNav(); window.scrollTo({top:0,behavior:'smooth'});
  }
  function closeMobileNav() { $('#sidebar').classList.remove('open'); $('#mobileScrim').classList.remove('show'); if ($('#menuButton')) { $('#menuButton').setAttribute('aria-expanded', 'false'); $('#menuButton').setAttribute('aria-label', 'Open navigation'); $('#menuButton').title = 'Open navigation'; } }
  function openLogoutConfirm() { $('#logoutConfirm').classList.remove('hidden'); }
  async function logout() {
    $('#confirmLogout').disabled = true;
    try { await api('/api/auth/logout', { method: 'POST' }); } catch (error) { console.warn('Logout request:', error.message); }
    window.location.href = '/index.html';
  }
  async function submitIncident(event) {
    event.preventDefault(); const form = $('#incidentForm'); const message = $('#incidentMessage'); message.className = 'form-message hidden'; message.textContent = '';
    const title = $('#incidentTitle').value.trim(); const incidentType = $('#incidentType').value; const severity = $('#incidentSeverity').value; const floorId = Number($('#incidentFloor').value); const description = $('#incidentDescription').value.trim();
    if (!title || !incidentType || !severity || !floorId || !description) { message.className = 'form-message error'; message.textContent = 'Please complete all required fields before submitting.'; return; }
    if (title.length > 150 || description.length > 2000) { message.className = 'form-message error'; message.textContent = 'Please check the title and description lengths.'; return; }
    const button = $('#submitIncident'); button.disabled = true; button.innerHTML = 'Submitting…';
    try {
      await api('/api/incidents', { method: 'POST', body: { title, description, incidentType, severity, floorId } });
      message.className = 'form-message success'; message.textContent = 'Your report was submitted successfully. Thank you for letting the mall team know.'; form.reset(); $('#descriptionCount').textContent = '0'; showToast('Your issue report has been submitted.');
    } catch (error) {
      message.className = 'form-message error';
      message.textContent = error.message.includes('permission') || error.message.includes('not have permission') ? 'Your account is signed in, but the backend currently does not allow customer incident reports. The mall administrator needs to enable customer POST access for /api/incidents.' : `We couldn't submit your report: ${error.message}`;
    } finally { button.disabled = false; button.innerHTML = 'Submit report <span>→</span>'; }
  }
  async function init() {
    $$('.nav-link').forEach(link => link.addEventListener('click', event => { event.preventDefault(); navigate(link.dataset.view); }));
    $$('[data-go]').forEach(button => button.addEventListener('click', () => navigate(button.dataset.go)));
    $('#profileTrigger').addEventListener('click', () => $('#profilePopover').classList.toggle('hidden'));
    $('#viewProfileButton').addEventListener('click', () => navigate('profile'));
    $('#popoverLogout').addEventListener('click', openLogoutConfirm); $('#logoutButton').addEventListener('click', openLogoutConfirm);
    $('#cancelLogout').addEventListener('click', () => $('#logoutConfirm').classList.add('hidden')); $('#confirmLogout').addEventListener('click', logout);
    $('#menuButton').addEventListener('click', () => {
      const isMobile = window.matchMedia('(max-width: 680px)').matches;
      if (isMobile) {
        const isOpen = $('#sidebar').classList.toggle('open');
        $('#mobileScrim').classList.toggle('show', isOpen);
        $('#menuButton').setAttribute('aria-expanded', String(isOpen));
        $('#menuButton').setAttribute('aria-label', isOpen ? 'Close navigation' : 'Open navigation');
        $('#menuButton').title = isOpen ? 'Close navigation' : 'Open navigation';
      } else {
        const isCollapsed = $('.app-shell').classList.toggle('sidebar-collapsed');
        $('#menuButton').setAttribute('aria-expanded', String(!isCollapsed));
        $('#menuButton').setAttribute('aria-label', isCollapsed ? 'Expand navigation' : 'Collapse navigation');
        $('#menuButton').title = isCollapsed ? 'Expand navigation' : 'Collapse navigation';
      }
    });
    $('#mobileScrim').addEventListener('click', closeMobileNav);
    document.addEventListener('click', event => { if (!event.target.closest('#profileTrigger') && !event.target.closest('#profilePopover')) $('#profilePopover').classList.add('hidden'); });
    $('#shopSearch').addEventListener('input', renderShops); $('#shopCategory').addEventListener('change', renderShops); $('#shopFloor').addEventListener('change', renderShops);
    $('#clearShopFilters').addEventListener('click', () => { $('#shopSearch').value = ''; $('#shopCategory').value = ''; $('#shopFloor').value = ''; renderShops(); });
    $('#facilitySearch').addEventListener('input', renderFacilities); $('#clearFacilitySearch').addEventListener('click', () => { $('#facilitySearch').value = ''; renderFacilities(); });
    $('#incidentDescription').addEventListener('input', () => $('#descriptionCount').textContent = String($('#incidentDescription').value.length)); $('#incidentForm').addEventListener('submit', submitIncident);
    document.addEventListener('keydown', event => { if (event.key === 'Escape') { closeMobileNav(); $('#profilePopover').classList.add('hidden'); $('#logoutConfirm').classList.add('hidden'); } });
    try { const user = await api('/api/users/me'); renderUser(user); }
    catch (error) { console.error('Could not load customer profile:', error); showToast('Could not load your profile. Please sign in again if your session has expired.'); }
    await loadDirectory();
    const requested = location.hash.replace('#',''); navigate(['overview','shops','facilities','report','profile'].includes(requested) ? requested : 'overview');
  }
  document.addEventListener('DOMContentLoaded', init);
})();
