const loginForm = document.getElementById("loginForm");
const errorMessage = document.getElementById("errorMessage");
const loginButton = document.getElementById("loginButton");

function getCookie(name) {
    for (const cookie of document.cookie.split(";")) {
        const [key, ...value] = cookie.trim().split("=");
        if (key === name) return decodeURIComponent(value.join("="));
    }
    return null;
}

async function getCsrfToken() {
    const response = await fetch("/api/auth/csrf", { method: "GET", credentials: "same-origin" });
    if (!response.ok) throw new Error("Unable to initialize secure login.");
    const token = getCookie("XSRF-TOKEN");
    if (!token) throw new Error("CSRF token not found. Please refresh the page.");
    return token;
}

async function getCurrentUser() {
    const response = await fetch("/api/users/me", {
        method: "GET", credentials: "same-origin", headers: { "Accept": "application/json" }
    });
    if (!response.ok) throw new Error("Unable to retrieve your account details.");
    return await response.json();
}

function getRoleName(user) {
    const role = user.role;
    if (typeof role === "string") return role.replace(/^ROLE_/, "").toUpperCase();
    if (role && typeof role === "object") {
        const name = role.name || role.roleName;
        if (name) return String(name).replace(/^ROLE_/, "").toUpperCase();
    }
    if (Array.isArray(user.authorities)) {
        const authority = user.authorities.find(item => {
            const name = typeof item === "string" ? item : item.authority;
            return name && name.startsWith("ROLE_");
        });
        if (authority) {
            const name = typeof authority === "string" ? authority : authority.authority;
            return name.replace(/^ROLE_/, "").toUpperCase();
        }
    }
    return null;
}

function redirectToDashboard(role) {
    const dashboards = {
        ADMIN: "admin-dashboard.html",
        STAFF: "staff-dashboard.html",
        SHOP_OWNER: "shop-owner-dashboard.html",
        SECURITY: "security-dashboard.html",
        CUSTOMER: "customer-dashboard.html"
    };
    if (!dashboards[role]) throw new Error("Your account has no supported dashboard role.");
    window.location.assign(dashboards[role]);
}

loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    errorMessage.textContent = "";
    loginButton.disabled = true;
    loginButton.textContent = "Signing in...";
    try {
        const username = document.getElementById("username").value.trim();
        const password = document.getElementById("password").value;
        const csrfToken = await getCsrfToken();
        const formData = new URLSearchParams();
        formData.append("username", username);
        formData.append("password", password);
        const loginResponse = await fetch("/api/auth/login", {
            method: "POST", credentials: "same-origin",
            headers: { "Content-Type": "application/x-www-form-urlencoded", "X-XSRF-TOKEN": csrfToken },
            body: formData.toString()
        });
        if (!loginResponse.ok) {
            throw new Error(loginResponse.status === 401 ? "Invalid username or password." : "Login failed. Please try again.");
        }
        const user = await getCurrentUser();
        const role = getRoleName(user);
        if (!role) throw new Error("Your account role could not be identified.");
        redirectToDashboard(role);
    } catch (error) {
        errorMessage.textContent = error.message || "Something went wrong. Please try again.";
        loginButton.disabled = false;
        loginButton.textContent = "Sign In";
    }
});
