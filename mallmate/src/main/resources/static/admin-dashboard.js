/* MallMate Admin Dashboard — API-backed interactions */
"use strict";

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const globalMessage = $("#globalMessage");

const configs = {
    shops: {key:"shops", editable:true, 
        label: "Shop", url: "/api/shops", panel: "shopResults", host: "shopsFormHost",
        create: true, delete: true,
        fields: [
            {name:"name",label:"Shop name",required:true,maxLength:120},
            {name:"shopNumber",label:"Shop number",required:true,maxLength:30},
            {name:"description",label:"Description",type:"textarea"},
            {name:"status",label:"Record status",required:true,options:["ACTIVE","INACTIVE"]},
            {name:"openingTime",label:"Opening time (HH:mm)",placeholder:"10:00"},
            {name:"closingTime",label:"Closing time (HH:mm)",placeholder:"22:00"},
            {name:"imageUrl",label:"Image URL"},
            {name:"floorId",label:"Floor ID",type:"number",required:true},
            {name:"categoryId",label:"Category ID",type:"number",required:true},
            {name:"ownerUsername",label:"Assign shop owner (optional)",type:"shopOwner"}
        ]
    },
    floors: {key:"floors", editable:true, 
        label:"Floor",url:"/api/floors",panel:"floorResults",host:"floorsFormHost",create:true,delete:true,
        fields:[
            {name:"floorNumber",label:"Floor number",required:true,type:"number"},
            {name:"name",label:"Floor name",required:true,maxLength:100},
            {name:"description",label:"Description",type:"textarea"}
        ]
    },
    categories: {key:"categories", editable:true, 
        label:"Category",url:"/api/categories",panel:"categoryResults",host:"categoriesFormHost",create:true,delete:true,
        fields:[
            {name:"name",label:"Category name",required:true,maxLength:100},
            {name:"description",label:"Description",type:"textarea"},
            {name:"icon",label:"Icon reference",maxLength:100}
        ]
    },
    tenants: {key:"tenants", editable:true, 
        label:"Tenant",url:"/api/tenants",panel:"tenantResults",host:"tenantsFormHost",create:true,delete:true,
        fields:[
            {name:"businessName",label:"Business name",required:true},
            {name:"contactPerson",label:"Contact person",required:true},
            {name:"email",label:"Email",type:"email",required:true},
            {name:"phone",label:"Phone",required:true},
            {name:"leaseStartDate",label:"Lease start date",type:"date",required:true},
            {name:"leaseEndDate",label:"Lease end date",type:"date",required:true},
            {name:"monthlyRent",label:"Monthly rent",type:"number",required:true},
            {name:"shopId",label:"Shop ID",type:"number",required:true}
        ]
    },
    facilities: {key:"facilities", editable:true, 
        label:"Facility",url:"/api/facilities",panel:"facilityResults",host:"facilitiesFormHost",create:true,delete:true,
        fields:[
            {name:"name",label:"Facility name",required:true},
            {name:"type",label:"Facility type",required:true,options:["WASHROOM","PARKING","ELEVATOR","ESCALATOR","FOOD_COURT","ATM","FIRST_AID","OTHER"]},
            {name:"description",label:"Description",type:"textarea"},
            {name:"locationDescription",label:"Location description",required:true},
            {name:"floorId",label:"Floor ID",type:"number",required:true}
        ]
    },
    announcements: {key:"announcements", editable:true, 
        label:"Announcement",url:"/api/announcements",panel:"announcementResults",host:"announcementsFormHost",create:true,delete:true,
        fields:[
            {name:"title",label:"Title",required:true,maxLength:150},
            {name:"message",label:"Message",type:"textarea",required:true,maxLength:3000},
            {name:"targetAudience",label:"Target audience",required:true},
            {name:"expiresAt",label:"Expiry date and time",type:"datetime-local"}
        ]
    },
    maintenance: {key:"maintenance", editable:true, 
        label:"Maintenance request",url:"/api/maintenance",panel:"maintenanceResults",host:"maintenanceFormHost",create:true,delete:true,
        fields:[
            {name:"title",label:"Request title",required:true,maxLength:150},
            {name:"description",label:"Description",type:"textarea",required:true,maxLength:2000},
            {name:"category",label:"Category",required:true,maxLength:100,placeholder:"e.g. ELECTRICAL, PLUMBING, CLEANING"},
            {name:"priority",label:"Priority",required:true,options:["LOW","MEDIUM","HIGH","URGENT"]},
            {name:"shopId",label:"Shop ID",type:"number",required:true}
        ]
    },
    incidents: {key:"incidents", editable:true, 
        label:"Incident",url:"/api/incidents",panel:"incidentResults",host:"incidentFormHost",create:true,delete:true,
        fields:[
            {name:"title",label:"Incident title",required:true,maxLength:150},
            {name:"description",label:"Description",type:"textarea",required:true,maxLength:2000},
            {name:"incidentType",label:"Incident type",required:true,maxLength:100,placeholder:"e.g. SAFETY, SECURITY, DAMAGE"},
            {name:"severity",label:"Severity",required:true,options:["LOW","MEDIUM","HIGH","CRITICAL"]},
            {name:"floorId",label:"Floor ID",type:"number",required:true}
        ]
    }
};

const userEditConfig = {
    key:"users", label:"User", url:"/api/users", panel:"userResults", host:"userFormHost", editable:true, delete:true,
    fields:[
        {name:"name",label:"Full name",required:true,maxLength:100},
        {name:"email",label:"Email address",type:"email",required:true,maxLength:254},
        {name:"phone",label:"Phone number",type:"tel",required:true,maxLength:20}
    ]
};

function getCookie(name) {
    const item = document.cookie.split("; ").find(part => part.startsWith(name + "="));
    return item ? decodeURIComponent(item.substring(name.length + 1)) : null;
}

async function getCsrfToken() {
    const response = await fetch("/api/auth/csrf", {credentials:"same-origin"});
    if (!response.ok) throw new Error("Unable to initialize the security token.");
    const token = getCookie("XSRF-TOKEN");
    if (!token) throw new Error("Security token is missing. Refresh the page and sign in again.");
    return token;
}

async function apiRequest(url, options = {}) {
    const method = (options.method || "GET").toUpperCase();
    const headers = {"Accept":"application/json", ...(options.body ? {"Content-Type":"application/json"} : {}), ...(options.headers || {})};
    if (!["GET","HEAD","OPTIONS"].includes(method) && !headers["X-XSRF-TOKEN"]) {
        headers["X-XSRF-TOKEN"] = await getCsrfToken();
    }
    const response = await fetch(url, {...options, method, headers, credentials:"same-origin"});
    if (response.status === 401) {
        window.location.assign("index.html");
        throw new Error("Your session has expired. Please sign in again.");
    }
    if (response.status === 403) throw new Error("Access denied. Your account may not have permission for this action.");
    if (response.status === 204) return null;
    const text = await response.text();
    let data = null;
    if (text) {
        try { data = JSON.parse(text); } catch { data = text; }
    }
    if (!response.ok) {
        const message = typeof data === "string" ? data : (data?.message || data?.detail || data?.error || `Request failed (${response.status}).`);
        throw new Error(message);
    }
    return data;
}

function normalizeList(data) {
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.content)) return data.content;
    if (data && Array.isArray(data.data)) return data.data;
    if (data && Array.isArray(data.items)) return data.items;
    return data && typeof data === "object" ? [data] : [];
}

function showGlobal(message, type = "success") {
    globalMessage.textContent = message;
    globalMessage.className = `global-message ${type}`;
    globalMessage.hidden = !message;
    if (message) globalMessage.scrollIntoView({behavior:"smooth", block:"nearest"});
}

function humanize(key) {
    return key.replace(/([a-z0-9])([A-Z])/g, "$1 $2").replace(/[_-]/g, " ").replace(/^./, c => c.toUpperCase());
}
function scalar(value) {
    if (value === null || value === undefined || value === "") return "—";
    if (typeof value === "object") return value.name ?? value.id ?? JSON.stringify(value);
    return String(value);
}
function getRecordId(record) {
    return record.id ?? record.userId ?? record.shopId ?? record.floorId ?? record.categoryId ?? record.tenantId ?? record.facilityId ?? record.announcementId ?? null;
}
function isScalar(value) { return value === null || ["string","number","boolean"].includes(typeof value); }

function renderTable(panel, records, config = {}) {
    panel.replaceChildren();
    if (!records.length) {
        const empty = document.createElement("p");
        empty.className = "table-empty";
        empty.textContent = "No records found.";
        panel.append(empty);
        return;
    }
    const table = document.createElement("table");
    const keys = [...new Set(records.flatMap(record => Object.keys(record).filter(key => isScalar(record[key]))))];
    const head = document.createElement("thead");
    const headRow = document.createElement("tr");
    keys.forEach(key => { const th = document.createElement("th"); th.textContent = humanize(key); headRow.append(th); });
    if (config.deletable || config.editable) { const th = document.createElement("th"); th.textContent = "Actions"; headRow.append(th); }
    head.append(headRow); table.append(head);
    const body = document.createElement("tbody");
    records.forEach(record => {
        const row = document.createElement("tr");
        keys.forEach(key => {
            const td = document.createElement("td");
            if (key === "operatingStatus") {
                const pill = document.createElement("span");
                const value = String(record[key] ?? "CLOSED").toUpperCase();
                pill.className = `status-pill ${value.toLowerCase().replaceAll("_", "-")}`;
                pill.textContent = value.replaceAll("_", " ");
                td.append(pill);
            } else if (key === "underMaintenance") {
                const pill = document.createElement("span");
                const enabled = record[key] === true || String(record[key]).toLowerCase() === "true";
                pill.className = `status-pill ${enabled ? "under-maintenance" : "not-maintenance"}`;
                pill.textContent = enabled ? "Enabled" : "Disabled";
                td.append(pill);
            } else if (key === "status" && ["ACTIVE", "INACTIVE"].includes(String(record[key]).toUpperCase())) {
                const pill = document.createElement("span");
                const value = String(record[key]).toUpperCase();
                pill.className = `status-pill record-${value.toLowerCase()}`;
                pill.textContent = value;
                td.append(pill);
            } else {
                td.textContent = scalar(record[key]);
            }
            row.append(td);
        });
        if (config.deletable || config.editable) {
            const td = document.createElement("td");
            td.className = "table-actions";
            const id = getRecordId(record);
            if (id === null) td.textContent = "No ID";
            else {
                if (config.key === "shops") {
                    const maintenanceButton = document.createElement("button");
                    maintenanceButton.className = "secondary-button table-action-button maintenance-toggle-button";
                    maintenanceButton.type = "button";
                    const isUnderMaintenance = record.underMaintenance === true || String(record.underMaintenance).toLowerCase() === "true";
                    maintenanceButton.textContent = isUnderMaintenance ? "End maintenance" : "Enable maintenance";
                    maintenanceButton.setAttribute("aria-label", `${isUnderMaintenance ? "End" : "Enable"} maintenance for ${record.name || `shop ${id}`}`);
                    maintenanceButton.addEventListener("click", () => toggleShopMaintenance(record, id, !isUnderMaintenance));
                    td.append(maintenanceButton);
                }
                if (config.editable) {
                    const editButton = document.createElement("button");
                    editButton.className = "secondary-button table-action-button";
                    editButton.type = "button";
                    editButton.textContent = "Edit";
                    editButton.addEventListener("click", () => editRecord(config, id));
                    td.append(editButton);
                }
                if (config.deletable) {
                    const deleteButton = document.createElement("button");
                    deleteButton.className = "danger-button table-action-button";
                    deleteButton.type = "button";
                    deleteButton.textContent = "Delete";
                    deleteButton.addEventListener("click", () => deleteRecord(config, id));
                    td.append(deleteButton);
                }
            }
            row.append(td);
        }
        body.append(row);
    });
    table.append(body); panel.append(table);
}

async function toggleShopMaintenance(shop, id, enable) {
    const action = enable ? "enable" : "end";
    const confirmed = await confirmInDashboard({
        title: `${enable ? "Enable" : "End"} shop maintenance?`,
        message: `${enable ? "Mark" : "Remove the maintenance flag for"} ${shop.name || `shop #${id}`}${enable ? " as under maintenance?" : "?"}`,
        confirmLabel: enable ? "Enable Maintenance" : "End Maintenance",
        danger: false
    });
    if (!confirmed) return;

    try {
        await apiRequest(`/api/shops/${encodeURIComponent(id)}/maintenance?underMaintenance=${enable}`, {
            method: "PATCH"
        });
        searchCache.clear();
        showGlobal(enable
            ? `Maintenance enabled for ${shop.name || `shop #${id}`}.`
            : `Maintenance ended for ${shop.name || `shop #${id}`}.`);
        await loadPanel("/api/shops", "shopResults", {
            key: "shops", deletable: true, editable: true,
            url: "/api/shops", label: "Shop"
        });
        await loadDashboardStats();
    } catch (error) {
        showGlobal(`Could not ${action} maintenance: ${error.message}`, "error");
    }
}

async function loadPanel(url, panelId, config = {}) {
    const panel = document.getElementById(panelId);
    if (!panel) return;
    panel.hidden = false;
    panel.textContent = "Loading…";
    try {
        const data = await apiRequest(url);
        renderTable(panel, normalizeList(data), {...config, url:config.url || url, label:config.label || "Record"});
    } catch (error) {
        panel.textContent = error.message;
        showGlobal(error.message, "error");
    }
}
let pendingConfirmation = null;
function confirmInDashboard({title="Are you sure?", message="Please confirm this action.", confirmLabel="Confirm", danger=true} = {}) {
    const backdrop = $("#confirmModal");
    const titleEl = $("#confirmModalTitle");
    const messageEl = $("#confirmModalMessage");
    const proceed = $("#confirmProceedButton");
    const cancel = $("#confirmCancelButton");
    titleEl.textContent = title; messageEl.textContent = message; proceed.textContent = confirmLabel;
    proceed.className = danger ? "danger-button" : "primary-button";
    backdrop.hidden = false; backdrop.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open"); proceed.focus();
    return new Promise(resolve => {
        pendingConfirmation = resolve;
        const finish = value => {
            if (!pendingConfirmation) return;
            const done = pendingConfirmation; pendingConfirmation = null;
            backdrop.hidden = true; backdrop.setAttribute("aria-hidden", "true"); document.body.classList.remove("modal-open");
            proceed.removeEventListener("click", onProceed); cancel.removeEventListener("click", onCancel); backdrop.removeEventListener("click", onBackdrop); document.removeEventListener("keydown", onKey); done(value);
        };
        const onProceed = () => finish(true); const onCancel = () => finish(false);
        const onBackdrop = event => { if (event.target === backdrop) finish(false); };
        const onKey = event => { if (event.key === "Escape") finish(false); };
        proceed.addEventListener("click", onProceed); cancel.addEventListener("click", onCancel); backdrop.addEventListener("click", onBackdrop); document.addEventListener("keydown", onKey);
    });
}

async function deleteRecord(config, id) {
    const isUser = config.key === "users";
    const actionLabel = isUser ? "deactivate" : "delete";
    const confirmed = await confirmInDashboard({
        title: isUser ? "Deactivate user account?" : `Delete ${config.label.toLowerCase()}?`,
        message: isUser
            ? `Deactivate user ID ${id}? Their account will be kept for records, but they will no longer be able to sign in. You cannot deactivate your own account or the last active administrator.`
            : `Are you sure you want to delete this ${config.label.toLowerCase()} (ID ${id})? This action cannot be undone.`,
        confirmLabel: isUser ? "Deactivate User" : "Delete"
    });
    if (!confirmed) return;
    try {
        await apiRequest(`${config.url}/${encodeURIComponent(id)}`, {method:"DELETE"});
        searchCache.clear();
        showGlobal(isUser ? "User account deactivated successfully." : `${config.label} deleted successfully.`);
        await loadPanel(config.url, config.panel, {
            key:config.key,
            deletable:config.delete,
            editable:config.editable,
            url:config.url,
            label:config.label
        });
        await loadDashboardStats();
    } catch (error) {
        showGlobal(`Could not ${actionLabel} ${config.label.toLowerCase()}: ${error.message}`, "error");
    }
}

async function loadDashboardStats() {
    const stats = [
        {url:"/api/shops",id:"shopCount"},
        {url:"/api/users",id:"userCount"},
        {url:"/api/facilities",id:"facilityCount"},
        {url:"/api/incidents",id:"incidentCount"}
    ];
    await Promise.all(stats.map(async item => {
        const el = document.getElementById(item.id);
        try { el.textContent = normalizeList(await apiRequest(item.url)).length; }
        catch (error) { el.textContent = "—"; console.warn(`Unable to load ${item.url}:`, error.message); }
    }));
}

function buildField(field) {
    const wrapper = document.createElement("div");
    wrapper.className = "form-field" + (field.type === "textarea" ? " full" : "");
    const label = document.createElement("label");
    label.htmlFor = `field-${field.name}`;
    label.textContent = field.label;
    let input;
    if (field.type === "textarea") input = document.createElement("textarea");
    else if (field.type === "shopOwner" || field.options) {
        input = document.createElement("select");
        const placeholder = document.createElement("option");
        placeholder.value = "";
        placeholder.textContent = field.type === "shopOwner" ? "Leave unassigned" : "Select an option";
        input.append(placeholder);
        (field.options || []).forEach(value => { const option = document.createElement("option"); option.value = value; option.textContent = value; input.append(option); });
    } else input = document.createElement("input");
    input.id = `field-${field.name}`;
    input.name = field.name;
    // Only HTMLInputElement supports the writable `type` property.
    // <textarea> and <select> must not receive an input type assignment.
    if (input instanceof HTMLInputElement) {
        input.type = field.type || "text";
    }
    if (field.required) input.required = true;
    if (field.maxLength && (input instanceof HTMLInputElement || input instanceof HTMLTextAreaElement)) input.maxLength = field.maxLength;
    if (field.placeholder) input.placeholder = field.placeholder;
    if (field.type === "number") { input.step = field.name.toLowerCase().includes("rent") ? "0.01" : "1"; if (field.name.toLowerCase().includes("id")) input.min = "1"; }
    wrapper.append(label, input);
    return {wrapper, input};
}

async function openCreateForm(key) {
    const config = configs[key];
    if (!config) {
        showGlobal(`The create form configuration for "${key}" is missing.`, "error");
        console.error("Unknown create form key:", key);
        return;
    }
    const host = document.getElementById(config.host);
    if (!host) {
        showGlobal(`Cannot open the ${config.label} form: form host #${config.host} was not found.`, "error");
        console.error(`Missing form host #${config.host} for`, key);
        return;
    }
    const trigger = document.querySelector(`.create-button[data-create="${key}"]`);
    if (host.firstElementChild) {
        host.replaceChildren();
        if (trigger) trigger.textContent = key === "announcements" ? "+ Create Announcement" : key === "incidents" ? "+ Report Incident" : key === "maintenance" ? "+ Add Maintenance" : `+ Add ${config.label}`;
        return;
    }
    host.replaceChildren();
    const form = document.createElement("form");
    form.className = "form-card";
    const title = document.createElement("h3");
    title.textContent = `Create ${config.label}`;
    form.append(title);
    const grid = document.createElement("div"); grid.className = "form-grid";
    const inputs = {};
    config.fields.forEach(field => {
        const built = buildField(field);
        grid.append(built.wrapper); inputs[field.name] = built.input;
    });
    if (key === "shops" && inputs.ownerUsername) {
        try {
            const users = normalizeList(await apiRequest("/api/users"));
            const owners = users.filter(user =>
                String(user.role || "").toUpperCase() === "SHOP_OWNER" &&
                user.active === true
            );
            owners.forEach(owner => {
                const option = document.createElement("option");
                option.value = owner.username;
                option.textContent = `${owner.name || owner.username} (@${owner.username})`;
                inputs.ownerUsername.append(option);
            });
            if (!owners.length) {
                const option = document.createElement("option");
                option.value = "";
                option.textContent = "No active shop-owner accounts found";
                option.disabled = true;
                inputs.ownerUsername.append(option);
            }
        } catch (error) {
            const option = document.createElement("option");
            option.value = "";
            option.textContent = "Could not load shop owners";
            option.disabled = true;
            inputs.ownerUsername.append(option);
            showGlobal(`Could not load shop owners: ${error.message}`, "error");
        }
    }
    form.append(grid);
    const message = document.createElement("p"); message.className = "form-message"; message.setAttribute("role","status");
    const actions = document.createElement("div"); actions.className = "form-actions";
    const submit = document.createElement("button"); submit.className = "primary-button"; submit.type = "submit"; submit.textContent = `Create ${config.label}`;
    const cancel = document.createElement("button"); cancel.className = "secondary-button"; cancel.type = "button"; cancel.textContent = "Cancel";
    cancel.addEventListener("click", () => {
        host.replaceChildren();
        if (trigger) trigger.textContent = key === "announcements" ? "+ Create Announcement" : key === "incidents" ? "+ Report Incident" : key === "maintenance" ? "+ Add Maintenance" : `+ Add ${config.label}`;
    });
    actions.append(submit,cancel); form.append(actions,message); host.append(form);
    if (trigger) trigger.textContent = "Close Form";
    form.addEventListener("submit", async event => {
        event.preventDefault();
        submit.disabled = true; submit.textContent = "Saving…"; message.textContent = ""; message.className = "form-message";
        const payload = {};
        for (const field of config.fields) {
            const raw = inputs[field.name].value.trim();
            if (raw === "") continue;
            payload[field.name] = field.type === "number" ? Number(raw) : raw;
        }
        // Foreign-key fields are sent as numeric IDs, matching the form labels.
        try {
            await apiRequest(config.url,{method:"POST",body:JSON.stringify(payload)});
            searchCache.clear();
            host.replaceChildren();
            if (trigger) trigger.textContent = key === "announcements" ? "+ Create Announcement" : key === "incidents" ? "+ Report Incident" : key === "maintenance" ? "+ Add Maintenance" : `+ Add ${config.label}`;
            showGlobal(`${config.label} created successfully.`);
            await loadPanel(config.url, config.panel, {key:config.key, deletable:config.delete, editable:config.editable, url:config.url, label:config.label});
            await loadDashboardStats();
        } catch (error) {
            message.textContent = error.message;
            message.classList.add("error");
            submit.disabled = false; submit.textContent = `Create ${config.label}`;
        }
    });
    form.scrollIntoView({behavior:"smooth",block:"nearest"});
}

async function editRecord(config, id) {
    const key = config.key;
    config = {...(key === "users" ? userEditConfig : configs[key]), ...config};
    const hostId = config.host || (key === "users" ? "userFormHost" : null);
    const host = hostId ? document.getElementById(hostId) : null;
    if (!host) return showGlobal(`Edit form for ${config.label} is unavailable.`, "error");
    host.replaceChildren();

    const form = document.createElement("form");
    form.className = "form-card";
    const title = document.createElement("h3");
    title.textContent = `Edit ${config.label} #${id}`;
    const loading = document.createElement("p");
    loading.className = "form-message";
    loading.textContent = `Loading ${config.label.toLowerCase()} details…`;
    form.append(title, loading); host.append(form);
    form.scrollIntoView({behavior:"smooth", block:"nearest"});

    try {
        const record = await apiRequest(`${config.url}/${encodeURIComponent(id)}`);
        let initialValues = {...record};

        // Shop responses expose floor/category names rather than their IDs.
        if (key === "shops") {
            const [floors, categories] = await Promise.all([
                apiRequest("/api/floors").then(normalizeList),
                apiRequest("/api/categories").then(normalizeList)
            ]);
            const floor = floors.find(item =>
                (record.floorNumber != null && String(item.floorNumber) === String(record.floorNumber)) ||
                (record.floorName && String(item.name).toLowerCase() === String(record.floorName).toLowerCase())
            );
            const category = categories.find(item => record.categoryName &&
                String(item.name).toLowerCase() === String(record.categoryName).toLowerCase());
            if (!floor || !category) throw new Error("Could not match this shop's floor/category to their IDs. Check the Floors and Categories APIs.");
            initialValues.floorId = floor.id;
            initialValues.categoryId = category.id;
        }

        // datetime-local inputs expect YYYY-MM-DDTHH:mm without a timezone suffix.
        if (key === "announcements" && initialValues.expiresAt) initialValues.expiresAt = String(initialValues.expiresAt).slice(0,16);

        form.replaceChildren(title);
        const grid = document.createElement("div"); grid.className = "form-grid";
        const inputs = {};
        config.fields.forEach(field => {
            const built = buildField(field);
            grid.append(built.wrapper); inputs[field.name] = built.input;
            const value = initialValues[field.name];
            // TenantResponseDTO currently omits monthlyRent, so that field cannot be pre-filled from this API response.
            if (value !== null && value !== undefined) built.input.value = String(value);
        });
        form.append(grid);
        const message = document.createElement("p"); message.className = "form-message"; message.setAttribute("role","status");
        if (key === "tenants" && initialValues.monthlyRent === undefined) {
            message.textContent = "Note: the current tenant API response does not include monthlyRent. Enter the current rent before saving.";
            message.classList.add("error");
        }
        const actions = document.createElement("div"); actions.className = "form-actions";
        const submit = document.createElement("button"); submit.className = "primary-button"; submit.type = "submit"; submit.textContent = "Save Changes";
        const cancel = document.createElement("button"); cancel.className = "secondary-button"; cancel.type = "button"; cancel.textContent = "Cancel";
        cancel.addEventListener("click", () => host.replaceChildren());
        actions.append(submit,cancel); form.append(actions,message);

        form.addEventListener("submit", async event => {
            event.preventDefault();
            submit.disabled = true; submit.textContent = "Saving…"; message.textContent = ""; message.className = "form-message";
            const payload = {};
            for (const field of config.fields) {
                const raw = inputs[field.name].value.trim();
                if (field.required && raw === "") {
                    message.textContent = `${field.label} is required.`; message.className = "form-message error";
                    submit.disabled = false; submit.textContent = "Save Changes"; inputs[field.name].focus(); return;
                }
                if (raw !== "") payload[field.name] = field.type === "number" ? Number(raw) : raw;
                else if (key === "shops" || key === "tenants" || key === "facilities" || key === "incidents" || key === "maintenance") payload[field.name] = null;
            }
            try {
                await apiRequest(`${config.url}/${encodeURIComponent(id)}`, {method:"PUT", body:JSON.stringify(payload)});
                searchCache.clear();
                host.replaceChildren();
                showGlobal(`${config.label} #${id} updated successfully.`);
                await loadPanel(config.url, config.panel, {key, deletable:!!config.delete, editable:true, url:config.url, label:config.label});
                await loadDashboardStats();
            } catch (error) {
                message.textContent = `Could not update ${config.label.toLowerCase()}: ${error.message}`;
                message.className = "form-message error"; submit.disabled = false; submit.textContent = "Save Changes";
            }
        });
    } catch (error) {
        loading.textContent = `Could not load ${config.label.toLowerCase()} for editing: ${error.message}`;
        loading.classList.add("error");
        const cancel = document.createElement("button"); cancel.type = "button"; cancel.className = "secondary-button"; cancel.textContent = "Close";
        cancel.addEventListener("click", () => host.replaceChildren()); form.append(cancel);
        showGlobal(`Edit form could not be opened: ${error.message}`, "error");
    }
}

function bindViewButtons() {
    $$(".toggle-button:not([data-target=\"userResults\"])").forEach(button => {
        button.addEventListener("click", async () => {
            const panel = document.getElementById(button.dataset.target);
            if (!panel) return;
            const url = button.dataset.load;

            if (!panel.hidden) {
                panel.hidden = true;
                button.textContent = button.dataset.originalLabel || button.textContent.replace(/^Close /, "View ");
                return;
            }
            panel.hidden = false;
            if (url) {
                const config = Object.values(configs).find(item => item.url === url);
                await loadPanel(url, panel.id, {key:config?.key, deletable:!!config?.delete, editable:!!config?.editable, url, label:config?.label || "Record"});
            }
            button.dataset.originalLabel ||= button.textContent;
            button.textContent = `Close ${button.dataset.originalLabel.replace(/^View /, "")}`;
        });
    });
}

// Create forms and user management
$$(".create-button").forEach(button => button.addEventListener("click", () => {
    try {
        openCreateForm(button.dataset.create);
    } catch (error) {
        console.error("Could not open create form:", error);
        showGlobal(`Could not open the form: ${error.message}`, "error");
    }
}));

$("#createUserButton").addEventListener("click", async () => {
    const host = $("#userFormHost");
    if (host.firstElementChild) { host.replaceChildren(); $("#createUserButton").textContent = "+ Create User"; return; }
    host.replaceChildren();
    const form = document.createElement("form"); form.className = "form-card";
    const title = document.createElement("h3"); title.textContent = "Create User"; form.append(title);
    const grid = document.createElement("div"); grid.className = "form-grid";
    const fields = [
        {name:"username",label:"Username",required:true,maxLength:100},
        {name:"password",label:"Temporary password (minimum 8 characters)",type:"password",required:true,minLength:8},
        {name:"name",label:"Full name",required:true,maxLength:100},
        {name:"email",label:"Email address",type:"email",required:true,maxLength:254},
        {name:"phone",label:"Phone number",type:"tel",required:true,maxLength:20}
    ];
    const controls = {};
    fields.forEach(field => { const built=buildField(field); if(field.minLength) built.input.minLength=field.minLength; grid.append(built.wrapper); controls[field.name]=built.input; });
    const roleWrap=document.createElement("div"); roleWrap.className="form-field";
    const roleLabel=document.createElement("label"); roleLabel.htmlFor="user-role"; roleLabel.textContent="Assign role";
    const roleSelect=document.createElement("select"); roleSelect.id="user-role"; roleSelect.name="roleId"; roleSelect.required=true;
    const ph=document.createElement("option"); ph.value=""; ph.textContent="Loading roles…"; roleSelect.append(ph);
    roleWrap.append(roleLabel,roleSelect); grid.append(roleWrap); form.append(grid);
    const message=document.createElement("p"); message.className="form-message"; message.setAttribute("role","status");
    const actions=document.createElement("div"); actions.className="form-actions";
    const submit=document.createElement("button"); submit.type="submit"; submit.className="primary-button"; submit.textContent="Create Account";
    const cancel=document.createElement("button"); cancel.type="button"; cancel.className="secondary-button"; cancel.textContent="Cancel"; cancel.addEventListener("click",()=>{host.replaceChildren();$("#createUserButton").textContent="+ Create User";});
    actions.append(submit,cancel);form.append(actions,message);host.append(form);$("#createUserButton").textContent="Close Form";
    try {
        const roles=normalizeList(await apiRequest("/api/roles"));
        const eligible=roles.filter(role=>["STAFF","SHOP_OWNER","SECURITY"].includes(String(role.name||role.roleName||"").replace(/^ROLE_/i,"").toUpperCase()));
        roleSelect.replaceChildren();
        const prompt=document.createElement("option");prompt.value="";prompt.textContent="Choose a role";roleSelect.append(prompt);
        eligible.forEach(role=>{const option=document.createElement("option");option.value=role.id;option.textContent=role.name||role.roleName;roleSelect.append(option);});
        if(!eligible.length){roleSelect.disabled=true;message.textContent="No eligible roles were returned. Check the roles API and role names.";message.className="form-message error";}
    } catch(error){roleSelect.disabled=true;message.textContent=`Unable to load roles: ${error.message}`;message.className="form-message error";}
    form.addEventListener("submit",async event=>{
        event.preventDefault();submit.disabled=true;submit.textContent="Creating…";message.textContent="";message.className="form-message";
        const payload={};
        fields.forEach(field=>{payload[field.name]=controls[field.name].value.trim();});
        payload.roleId=Number(roleSelect.value);
        try{
            await apiRequest("/api/users",{method:"POST",body:JSON.stringify(payload)});
            searchCache.clear();
            host.replaceChildren();$("#createUserButton").textContent="+ Create User";showGlobal("User account created successfully.");
            await loadDashboardStats();
            if(!$("#userResults").hidden) await loadPanel("/api/users","userResults", {key:"users", editable:true, deletable:true, url:"/api/users", label:"User"});
        }catch(error){message.textContent=`Could not create user: ${error.message}`;message.className="form-message error";submit.disabled=false;submit.textContent="Create Account";}
    });
    form.scrollIntoView({behavior:"smooth",block:"nearest"});
});

$$(".toggle-button").forEach(button => {
    if (button.dataset.target === "userResults") {
        button.addEventListener("click", async () => {
            const panel=$("#userResults");
            if(!panel.hidden){panel.hidden=true;button.textContent="View Users";return;}
            button.textContent="Close Users";panel.hidden=false;await loadPanel("/api/users","userResults", {key:"users", editable:true, deletable:true, url:"/api/users", label:"User"});
        });
    }
});

// Debounced search across dashboard sections. Search is client-side where the API
// only exposes list endpoints, and server-side where a dedicated search endpoint exists.
const searchTimers = new Map();
const searchCache = new Map();
const searchSequence = new Map();
const localSearchFields = {
    userSearchInput: ["username","name","email","phone","role","roleName","authorities"],
    floorSearchInput: ["floorNumber","name","description"],
    incidentSearchInput: ["title","description","incidentType","severity","status","reportedBy","reportedByUsername","reporterName","floorName","type"],
    maintenanceSearchInput: ["title","description","category","priority","status","shopName","requester","reportedBy","type"],
    announcementSearchInput: ["title","message","targetAudience","priority","status"]
};
function flattenSearchValue(value) {
    if (value === null || value === undefined) return [];
    if (Array.isArray(value)) return value.flatMap(flattenSearchValue);
    if (typeof value === "object") return Object.entries(value).flatMap(([key, item]) => [key, ...flattenSearchValue(item)]);
    return [String(value)];
}
function matchesSearch(record, query, fields = []) {
    const selected = fields.length ? fields.flatMap(key => flattenSearchValue(record?.[key])) : flattenSearchValue(record);
    return selected.some(value => value.toLocaleLowerCase().includes(query.toLocaleLowerCase()));
}
function searchConfig(input, panelId, baseUrl) {
    const id = input.id;
    const labels = {shopSearchInput:"Shop",userSearchInput:"User",floorSearchInput:"Floor",categorySearchInput:"Category",tenantSearchInput:"Tenant",facilitySearchInput:"Facility",incidentSearchInput:"Incident",maintenanceSearchInput:"Maintenance record",announcementSearchInput:"Announcement"};
    const keyByInput = {shopSearchInput:"shops", userSearchInput:"users", floorSearchInput:"floors", categorySearchInput:"categories", tenantSearchInput:"tenants", facilitySearchInput:"facilities", incidentSearchInput:"incidents", maintenanceSearchInput:"maintenance", announcementSearchInput:"announcements"};
    const key = keyByInput[id];
    const cfg = key === "users" ? userEditConfig : configs[key];
    return {key, deletable:!!cfg?.delete, editable:!!cfg?.editable, url:cfg?.url || baseUrl, label:labels[id] || input.dataset.searchLabel || "Record", panel:panelId};
}
async function performSectionSearch(input) {
    const query = input.value.trim();
    const panelId = input.dataset.searchPanel || ({shopSearchInput:"shopResults",userSearchInput:"userResults"})[input.id];
    const panel = document.getElementById(panelId);
    if (!panel) return;
    const id = input.id;
    const searchEndpoint = input.dataset.searchUrl || ({userSearchInput:"/api/users",floorSearchInput:"/api/floors",announcementSearchInput:"/api/announcements"})[id];
    const baseUrl = input.dataset.searchBase || searchEndpoint;
    const sequence = (searchSequence.get(id) || 0) + 1;
    searchSequence.set(id, sequence);
    panel.hidden = false;
    panel.textContent = "Loading…";
    try {
        // Empty query means reset the filter and reload the full current list.
        if (!query) {
            const config = searchConfig(input, panelId, baseUrl);
            await loadPanel(baseUrl, panelId, config);
            return;
        }
        let records;
        if (input.dataset.searchParam) {
            const url = `${searchEndpoint}?${encodeURIComponent(input.dataset.searchParam)}=${encodeURIComponent(query)}`;
            records = normalizeList(await apiRequest(url));
        } else {
            const fetchUrl = baseUrl;
            if (!searchCache.has(fetchUrl)) searchCache.set(fetchUrl, apiRequest(fetchUrl).then(normalizeList));
            let all;
            try { all = await searchCache.get(fetchUrl); }
            catch (error) { searchCache.delete(fetchUrl); throw error; }
            records = all.filter(record => matchesSearch(record, query, localSearchFields[id] || []));
        }
        // Ignore an older response if the user has typed a newer query meanwhile.
        if (searchSequence.get(id) !== sequence) return;
        renderTable(panel, records, searchConfig(input, panelId, baseUrl));
    } catch (error) {
        if (searchSequence.get(id) !== sequence) return;
        panel.textContent = `Could not load results: ${error.message}`;
        showGlobal(`Search failed: ${error.message}`, "error");
    }
}
function scheduleSearch(input) {
    clearTimeout(searchTimers.get(input.id));
    searchTimers.set(input.id, setTimeout(() => performSectionSearch(input), 300));
}
const searchInputs = $$("#shopSearchInput, #userSearchInput, #floorSearchInput, #categorySearchInput, #tenantSearchInput, #facilitySearchInput, #incidentSearchInput, #maintenanceSearchInput, #announcementSearchInput");
searchInputs.forEach(input => {
    input.addEventListener("input", () => scheduleSearch(input));
    input.addEventListener("keydown", event => { if (event.key === "Enter") { event.preventDefault(); clearTimeout(searchTimers.get(input.id)); performSectionSearch(input); } });
});
$$('[data-search-button]').forEach(button => button.addEventListener("click", () => {
    const input = document.getElementById(button.dataset.searchButton);
    if (input) { clearTimeout(searchTimers.get(input.id)); performSectionSearch(input); }
}));
// The shop controls pre-date the shared data attributes; bind them into the same search flow.
$("#shopSearchButton")?.addEventListener("click", () => { const input=$("#shopSearchInput"); if(input){clearTimeout(searchTimers.get(input.id));performSectionSearch(input);} });

// Filter the shop directory by category using the existing category endpoint.
const shopCategoryFilter = $("#shopCategoryFilter");
shopCategoryFilter?.addEventListener("change", async () => {
    const category = shopCategoryFilter.value;
    const panel = $("#shopResults");
    if (!panel || panel.hidden) return;
    const nameQuery = $("#shopSearchInput")?.value.trim() || "";
    try {
        if (!category) {
            if (nameQuery) {
                performSectionSearch($("#shopSearchInput"));
            } else {
                await loadPanel("/api/shops", "shopResults", {key:"shops", deletable:true, editable:true, url:"/api/shops", label:"Shop"});
            }
            return;
        }
        const url = `/api/shops/category/${encodeURIComponent(category)}`;
        const data = await apiRequest(url);
        let records = normalizeList(data);
        if (nameQuery) records = records.filter(shop => String(shop.name || "").toLowerCase().includes(nameQuery.toLowerCase()));
        renderTable(panel, records, {key:"shops", deletable:true, editable:true, url:"/api/shops", label:"Shop"});
        panel.hidden = false;
    } catch (error) {
        panel.textContent = error.message;
        showGlobal(error.message, "error");
    }
});

function clearSectionSearch(input) {
    if (!input) return;
    input.value = "";
    clearTimeout(searchTimers.get(input.id));
    searchSequence.set(input.id, (searchSequence.get(input.id) || 0) + 1);
    // A clear should remove the filtered view and restore the complete list, not leave stale rows.
    searchCache.delete(input.dataset.searchBase || input.dataset.searchUrl);
    const panelId = input.dataset.searchPanel;
    const panel = panelId ? document.getElementById(panelId) : null;
    // Keep visibility under the View/Close control's control. Clearing a hidden
    // panel resets the query but must not open it as a side effect.
    if (panel && !panel.hidden) performSectionSearch(input);
    else if (panel && panel.hidden) panel.replaceChildren();
    input.focus();
}
$$('[data-clear-search]').forEach(button => button.addEventListener("click", () => clearSectionSearch(document.getElementById(button.dataset.clearSearch))));
$("#clearShopSearchButton")?.addEventListener("click", () => { if ($("#shopCategoryFilter")) $("#shopCategoryFilter").value = ""; clearSectionSearch($("#shopSearchInput")); });

// Sign out follows the backend's session-based logout and CSRF policy.
$("#logoutButton").addEventListener("click",async()=>{
    const confirmed = await confirmInDashboard({title:"Sign out of MallMate?",message:"You will be signed out of your current session.",confirmLabel:"Sign Out",danger:false});
    if(!confirmed)return;
    const button=$("#logoutButton");button.disabled=true;button.textContent="Signing out…";
    try{await apiRequest("/api/auth/logout",{method:"POST"});window.location.assign("index.html");}
    catch(error){showGlobal(`Could not sign out: ${error.message}`,"error");button.disabled=false;button.textContent="Sign Out";}
});

// Highlight the navigation item for the section currently selected.
$$(".nav-link").forEach(link=>link.addEventListener("click",()=>{
    $$(".nav-link").forEach(item=>item.classList.remove("active"));link.classList.add("active");
}));

// Sidebar collapses to a persistent icon rail rather than sliding completely away.
const menuToggle = $("#menuToggleButton");
function setSidebarOpen(open) {
    document.body.classList.toggle("sidebar-collapsed", !open);
    if (menuToggle) {
        menuToggle.setAttribute("aria-expanded", String(open));
        menuToggle.setAttribute("aria-label", open ? "Collapse navigation menu" : "Expand navigation menu");
        menuToggle.title = open ? "Collapse navigation" : "Expand navigation";
    }
}
menuToggle?.addEventListener("click", () => setSidebarOpen(document.body.classList.contains("sidebar-collapsed")));
$$('.nav-link, .brand').forEach(link => link.addEventListener("click", () => {
    if (window.matchMedia("(max-width: 760px)").matches) document.body.classList.add("sidebar-collapsed");
}));

// Administrator profile opens the registered account details modal.
const profileMenuButton = $("#profileMenuButton");
const profileDropdown = $("#profileDropdown");
let adminProfile = null;
let adminProfileError = null;

function escapeProfileValue(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[character]));
}

function renderAdminProfile() {
    if (!adminProfile) return;
    const me = adminProfile;
    const fields = [
        ["Full name", me.name || me.fullName],
        ["Username", me.username],
        ["Email address", me.email],
        ["Phone number", me.phone || me.phoneNumber],
        ["Role", me.role || "ADMIN"],
        ["Account status", me.active === false ? "Inactive" : "Active"]
    ];
    $("#adminProfileDetails").innerHTML = fields.map(([label, value]) =>
        `<div class="admin-profile-detail-row"><span>${escapeProfileValue(label)}</span><strong>${escapeProfileValue(value || "Not provided")}</strong></div>`
    ).join("");
    const name = me.name || me.fullName || me.username || "Administrator";
    $("#adminProfileName").textContent = name;
    $("#adminProfileAvatar").textContent = name.trim().charAt(0).toUpperCase() || "A";
    $("#adminProfileRole").textContent = me.role || "ADMIN";
}

async function openAdminProfile() {
    const modal = $("#adminProfileModal");
    if (!modal) return;
    if (profileDropdown) profileDropdown.hidden = true;
    modal.hidden = false;
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("admin-profile-modal-open");
    $("#adminProfileDetails").innerHTML = '<p class="admin-profile-loading">Loading your profile…</p>';
    profileMenuButton?.setAttribute("aria-expanded", "true");
    $("#closeAdminProfileButton")?.focus();
    if (adminProfile) { renderAdminProfile(); return; }
    if (adminProfileError) {
        $("#adminProfileDetails").innerHTML = `<p class="admin-profile-error">${escapeProfileValue(adminProfileError)}</p>`;
        return;
    }
    try {
        adminProfile = await apiRequest("/api/users/me");
        renderAdminProfile();
    } catch (error) {
        adminProfileError = error.message || "Could not load your profile.";
        $("#adminProfileDetails").innerHTML = `<p class="admin-profile-error">${escapeProfileValue(adminProfileError)}</p>`;
    }
}

function closeAdminProfile() {
    const modal = $("#adminProfileModal");
    if (modal) { modal.hidden = true; modal.setAttribute("aria-hidden", "true"); }
    document.body.classList.remove("admin-profile-modal-open");
    profileMenuButton?.setAttribute("aria-expanded", "false");
    profileMenuButton?.focus();
}

profileMenuButton?.addEventListener("click", openAdminProfile);
$("#closeAdminProfileButton")?.addEventListener("click", closeAdminProfile);
$("#adminProfileCloseFooter")?.addEventListener("click", closeAdminProfile);
$("#adminProfileModal")?.addEventListener("click", event => {
    if (event.target.id === "adminProfileModal") closeAdminProfile();
});
document.addEventListener("keydown", event => {
    if (event.key === "Escape" && $("#adminProfileModal") && !$("#adminProfileModal").hidden) closeAdminProfile();
});
$("#adminProfileSignOutButton")?.addEventListener("click", () => { closeAdminProfile(); $("#logoutButton")?.click(); });
$("#profileSignOutButton")?.addEventListener("click", () => { if (profileDropdown) profileDropdown.hidden = true; $("#logoutButton")?.click(); });
document.addEventListener("click", event => {
    if (profileDropdown && !event.target.closest(".profile-menu-wrap")) profileDropdown.hidden = true;
});

setSidebarOpen(true);
loadDashboardStats();

bindViewButtons();
