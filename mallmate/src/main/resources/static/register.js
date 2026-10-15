const registerForm = document.getElementById("registerForm");
const registerMessage = document.getElementById("registerMessage");
const registerButton = document.getElementById("registerButton");

function getCookie(name) {
    for (const cookie of document.cookie.split(";")) {
        const [key, ...value] = cookie.trim().split("=");
        if (key === name) return decodeURIComponent(value.join("="));
    }
    return null;
}

async function getCsrfToken() {
    const response = await fetch("/api/auth/csrf", {
        method: "GET",
        credentials: "same-origin",
        headers: { "Accept": "application/json" }
    });
    if (!response.ok) throw new Error("Unable to initialize secure registration.");
    const token = getCookie("XSRF-TOKEN");
    if (!token) throw new Error("Security token not found. Please refresh and try again.");
    return token;
}

registerForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    registerMessage.textContent = "";
    registerMessage.className = "form-message";
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    if (password !== confirmPassword) {
        registerMessage.textContent = "Passwords do not match.";
        registerMessage.classList.add("error-message");
        return;
    }

    registerButton.disabled = true;
    registerButton.textContent = "Creating account...";
    try {
        const csrfToken = await getCsrfToken();
        const payload = {
            name: document.getElementById("name").value.trim(),
            username: document.getElementById("username").value.trim(),
            email: document.getElementById("email").value.trim(),
            phone: document.getElementById("phone").value.trim(),
            password
        };
        const response = await fetch("/api/auth/register", {
            method: "POST",
            credentials: "same-origin",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json",
                "X-XSRF-TOKEN": csrfToken
            },
            body: JSON.stringify(payload)
        });
        const result = await response.text();
        if (!response.ok) throw new Error(result || `Registration failed (${response.status}).`);

        registerMessage.textContent = "Account created successfully! Redirecting to sign in...";
        registerMessage.classList.add("success-message");
        registerForm.reset();
        window.setTimeout(() => window.location.assign("index.html"), 1200);
    } catch (error) {
        let message = error.message || "Unable to create your account. Please try again.";
        try {
            const parsed = JSON.parse(message);
            if (parsed.message) message = parsed.message;
        } catch (_) {}
        registerMessage.textContent = message;
        registerMessage.classList.add("error-message");
    } finally {
        registerButton.disabled = false;
        registerButton.textContent = "Create Account";
    }
});
