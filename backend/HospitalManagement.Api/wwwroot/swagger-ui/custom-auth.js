(() => {
  "use strict";

  // CareFlow HMS Login Endpoint
  const LOGIN_URL = "/api/v1/auth/login";

  // In-memory token storage (never localStorage for production security)
  window.__swaggerJwt = null;

  const $ = (selector, root = document) => root.querySelector(selector);

  function createModal() {
    if ($("#custom-auth-overlay")) return;

    const overlay = document.createElement("div");
    overlay.id = "custom-auth-overlay";
    overlay.className = "custom-auth-overlay";
    overlay.hidden = true;

    overlay.innerHTML = `
      <section
        class="custom-auth-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="custom-auth-title">

        <header class="custom-auth-header">
          <h2 id="custom-auth-title">
            Available authorizations
          </h2>
          <button type="button"
            class="custom-auth-close"
            aria-label="Close">&times;</button>
        </header>

        <div class="custom-auth-body">
          <section class="custom-auth-card">
            <h3>🔑 Option 1: Quick Staff Login</h3>
            <p class="custom-auth-muted">
              Enter hospital credentials to automatically fetch and authorize a JWT Bearer token.
            </p>

            <form id="staff-login-form">
              <div class="custom-auth-grid">
                <label>
                  Username or Work Email
                  <input id="staff-username"
                    name="username"
                    placeholder="e.g. admin or admin@careflow.com"
                    autocomplete="username"
                    required />
                </label>

                <label>
                  Password
                  <input id="staff-password"
                    name="password"
                    type="password"
                    placeholder="Enter password"
                    autocomplete="current-password"
                    required />
                </label>
              </div>

              <button class="custom-auth-primary"
                id="staff-login-submit" type="submit">
                Login &amp; Authorize Now
              </button>
            </form>

            <p id="staff-login-status"
              class="custom-auth-status"
              role="status" aria-live="polite"></p>

            <hr />

            <h3>🔒 Option 2: Direct Bearer Token Input</h3>
            <p class="custom-auth-muted">
              Paste an existing JWT Bearer token.
            </p>

            <form id="manual-token-form">
              <label>
                Bearer token
                <input id="manual-token"
                  name="token"
                  type="password"
                  placeholder="Paste JWT token (without Bearer prefix)"
                  autocomplete="off"
                  spellcheck="false"
                  required />
              </label>

              <div class="custom-auth-actions">
                <button type="submit"
                  class="custom-auth-success">
                  Authorize
                </button>
                <button type="button"
                  class="custom-auth-secondary custom-auth-close">
                  Close
                </button>
              </div>
            </form>

            <p id="manual-token-status"
              class="custom-auth-status"
              role="status" aria-live="polite"></p>

            <button type="button"
              id="custom-auth-logout"
              class="custom-auth-logout">
              Clear authorization
            </button>
          </section>
        </div>
      </section>`;

    document.body.appendChild(overlay);

    overlay.addEventListener("click", (event) => {
      if (event.target === overlay) closeModal();
    });

    overlay.querySelectorAll(".custom-auth-close").forEach((button) => {
      button.addEventListener("click", closeModal);
    });

    $("#staff-login-form").addEventListener("submit", loginStaff);
    $("#manual-token-form").addEventListener("submit", authorizeManualToken);
    $("#custom-auth-logout").addEventListener("click", clearAuthorization);

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeModal();
    });
  }

  function openModal() {
    createModal();
    $("#custom-auth-overlay").hidden = false;
    $("#staff-username").focus();
  }

  function closeModal() {
    const overlay = $("#custom-auth-overlay");
    if (overlay) overlay.hidden = true;
  }

  function setStatus(selector, message, isError = false) {
    const element = $(selector);
    if (!element) return;
    element.textContent = message;
    element.classList.toggle("is-error", isError);
  }

  function setBusy(button, busy, text) {
    button.disabled = busy;
    button.textContent = text;
  }

  function validateToken(token) {
    const value = token.trim();
    if (!value || /\s/.test(value) || /^Bearer\s/i.test(value)) {
      throw new Error(
        "Enter the token only, without the 'Bearer ' prefix."
      );
    }
    return value;
  }

  function updateButtonState(isAuthorized, label) {
    const button = $("#custom-auth-open");
    if (button) {
      if (isAuthorized) {
        button.textContent = label ? `✓ ${label}` : "✓ Authorized";
        button.classList.add("is-authorized");
      } else {
        button.textContent = "Authorize";
        button.classList.remove("is-authorized");
      }
    }
  }

  function applyToken(token, userLabel) {
    const cleanToken = validateToken(token);
    window.__swaggerJwt = cleanToken;

    // Synchronize with Swagger UI native state if available
    try {
      if (window.ui && typeof window.ui.preauthorizeApiKey === "function") {
        window.ui.preauthorizeApiKey("Bearer", cleanToken);
      }
    } catch (e) {
      console.warn("Could not synchronize with native Swagger UI auth state:", e);
    }

    updateButtonState(true, userLabel);
  }

  async function loginStaff(event) {
    event.preventDefault();

    const button = $("#staff-login-submit");
    const originalText = "Login & Authorize Now";

    setStatus("#staff-login-status", "");
    setBusy(button, true, "Signing in...");

    try {
      const username = $("#staff-username").value.trim();
      const password = $("#staff-password").value;

      const response = await fetch(LOGIN_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        credentials: "omit",
        cache: "no-store",
        body: JSON.stringify({
          usernameOrEmail: username,
          password: password,
        }),
      });

      if (!response.ok) {
        let errorMsg = `Login failed (HTTP ${response.status}).`;
        try {
          const errData = await response.json();
          if (errData && errData.message) errorMsg = errData.message;
        } catch (_) {}

        throw new Error(
          response.status === 401 || response.status === 403
            ? errorMsg || "Invalid credentials or unauthorized account."
            : errorMsg
        );
      }

      const data = await response.json();
      const token = data.token || data.accessToken;

      if (typeof token !== "string" || !token.trim()) {
        throw new Error("The login response did not contain a valid JWT token.");
      }

      const userDisplay = data.user && data.user.fullName ? data.user.fullName : (data.user?.username || "Staff");
      applyToken(token, userDisplay);

      $("#staff-password").value = "";
      setStatus("#staff-login-status", `Login successful! Authorized as ${userDisplay}.`);

      setTimeout(() => {
        closeModal();
      }, 400);
    } catch (error) {
      setStatus(
        "#staff-login-status",
        error instanceof TypeError
          ? "Unable to reach the login service. Check the server connection."
          : error.message,
        true
      );
    } finally {
      setBusy(button, false, originalText);
    }
  }

  function authorizeManualToken(event) {
    event.preventDefault();

    try {
      const token = $("#manual-token").value;
      applyToken(token, "Bearer");

      $("#manual-token").value = "";
      setStatus(
        "#manual-token-status",
        "Bearer token authorized for this Swagger UI session."
      );

      setTimeout(() => {
        closeModal();
      }, 400);
    } catch (error) {
      setStatus("#manual-token-status", error.message, true);
    }
  }

  function clearAuthorization() {
    window.__swaggerJwt = null;

    try {
      if (window.ui && typeof window.ui.preauthorizeApiKey === "function") {
        window.ui.preauthorizeApiKey("Bearer", "");
      }
    } catch (e) {}

    const manual = $("#manual-token");
    if (manual) manual.value = "";

    const password = $("#staff-password");
    if (password) password.value = "";

    updateButtonState(false);
    setStatus("#manual-token-status", "Authorization cleared.");
    setStatus("#staff-login-status", "");
  }

  function installButton() {
    const topbar = $(".swagger-ui .topbar-wrapper");
    if (!topbar) return;

    if ($("#custom-auth-open")) return;

    const button = document.createElement("button");
    button.id = "custom-auth-open";
    button.className = "custom-auth-open";
    button.type = "button";
    button.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
      </svg>
      <span>Authorize</span>
    `;

    button.addEventListener("click", openModal);
    topbar.appendChild(button);

    createModal();
  }

  function customizeBrand() {
    const link = $(".swagger-ui .topbar a.link");
    if (!link || link.dataset.customized) return;
    link.dataset.customized = "true";
    link.innerHTML = `
      <div style="display:inline-flex;align-items:center;gap:10px;">
        <div style="display:inline-flex;align-items:center;justify-content:center;width:34px;height:34px;background:#2563eb;color:#ffffff;border-radius:8px;font-weight:900;font-size:18px;box-shadow:0 2px 8px rgba(0,0,0,0.25);">
          +
        </div>
        <div style="display:flex;flex-direction:column;">
          <span style="font-size:19px;font-weight:800;color:#ffffff;letter-spacing:-0.4px;line-height:1.2;">CareFlow</span>
          <span style="font-size:11px;font-weight:700;color:#93c5fd;letter-spacing:0.5px;text-transform:uppercase;line-height:1;">HMS Developer Portal</span>
        </div>
      </div>
    `;
  }

  function closeNativeModals() {
    document.querySelectorAll(".dialog-ux, .modal-ux").forEach((modal) => {
      if (modal.id === "custom-auth-overlay" || modal.closest("#custom-auth-overlay")) {
        return;
      }
      const closeBtn = modal.querySelector(".close-modal, .btn-done, button[aria-label='Close']");
      if (closeBtn) {
        closeBtn.click();
      } else {
        modal.remove();
      }
    });
  }

  function patchOpsFilter() {
    try {
      if (!window.ui || typeof window.ui.getSystem !== "function") return;
      const sys = window.ui.getSystem();
      if (sys && sys.fn && sys.fn.opsFilter && !sys.fn.__opsFilterPatched) {
        sys.fn.__opsFilterPatched = true;
        sys.fn.opsFilter = function (taggedMap, phrase) {
          if (!phrase || phrase === true) return taggedMap;
          const p = String(phrase).toLowerCase().trim();
          return taggedMap.filter((val, tagKey) => {
            return String(tagKey).toLowerCase().indexOf(p) !== -1;
          });
        };
      }
    } catch (_) {}
  }

  function initialize() {
    customizeBrand();
    installButton();
    patchOpsFilter();

    // If native Swagger UI modal mounted, suppress it and show custom modal
    const nativeModal = document.querySelector(".dialog-ux:not(#custom-auth-overlay)");
    if (nativeModal) {
      closeNativeModals();
      openModal();
    }
  }

  // Intercept ANY click on Authorize buttons or operation padlock icons
  document.addEventListener(
    "click",
    (event) => {
      // Ignore clicks inside our custom modal
      if (event.target.closest("#custom-auth-overlay")) {
        return;
      }

      // Check if user clicked padlock on endpoint or Authorize button anywhere
      const authTrigger = event.target.closest(
        ".authorization__btn, .btn.authorize, #custom-auth-open, [aria-label*='authorize' i], [aria-label*='authorization' i]"
      );

      if (authTrigger) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();

        closeNativeModals();
        openModal();
      }
    },
    true // Capture phase: intercepts BEFORE Swagger UI handles it!
  );

  const observer = new MutationObserver(initialize);
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
  });

  initialize();
})();
