/**
 * Formats a date string to a localized German format.
 *
 * @param {string|Date} dateInput - The date to format.
 * @returns {string} The formatted date and time.
 */
function formatDate(dateInput) {
    const date = new Date(dateInput);
    return date.toLocaleDateString("de-DE") + " " + date.toLocaleTimeString("de-DE", { hour: '2-digit', minute: '2-digit' });
}

/**
 * Builds a short, human friendly relative time string in German
 * (e.g. "gerade eben", "vor 5 Min.", "vor 3 Std.", "vor 2 Tagen").
 * Falls back to the absolute date for anything older than a week.
 *
 * @param {string|Date} dateInput - The date to describe.
 * @returns {string} A relative time label.
 */
function timeAgo(dateInput) {
    const date = new Date(dateInput);
    if (Number.isNaN(date.getTime())) return '';

    const seconds = Math.round((Date.now() - date.getTime()) / 1000);
    if (seconds < 45) return 'gerade eben';

    const minutes = Math.round(seconds / 60);
    if (minutes < 60) return `vor ${minutes} Min.`;

    const hours = Math.round(minutes / 60);
    if (hours < 24) return `vor ${hours} Std.`;

    const days = Math.round(hours / 24);
    if (days === 1) return 'gestern';
    if (days < 7) return `vor ${days} Tagen`;

    return formatDate(date);
}

/**
 * Shows a Bootstrap toast notification. Creates the toast container lazily and
 * removes each toast from the DOM once it has been hidden. Falls back to a
 * simple alert if the Bootstrap JS bundle is unavailable.
 *
 * @param {string} message - The message to display.
 * @param {'success'|'danger'|'info'|'warning'} [type='info'] - Visual style.
 */
function showToast(message, type = 'info') {
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container position-fixed top-0 end-0 p-3';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast align-items-center text-bg-${type} border-0`;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    toast.setAttribute('aria-atomic', 'true');

    const flex = document.createElement('div');
    flex.className = 'd-flex';

    const body = document.createElement('div');
    body.className = 'toast-body';
    body.textContent = message;

    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'btn-close btn-close-white me-2 m-auto';
    closeBtn.setAttribute('data-bs-dismiss', 'toast');
    closeBtn.setAttribute('aria-label', 'Schließen');

    flex.appendChild(body);
    flex.appendChild(closeBtn);
    toast.appendChild(flex);
    container.appendChild(toast);

    if (window.bootstrap && typeof window.bootstrap.Toast === 'function') {
        const instance = new window.bootstrap.Toast(toast, { delay: 4000 });
        toast.addEventListener('hidden.bs.toast', () => toast.remove());
        instance.show();
    } else {
        // Fallback: keep the message visible briefly, then remove it.
        toast.classList.add('show');
        setTimeout(() => toast.remove(), 4000);
    }
}

/**
 * Applies Bootstrap validation feedback to a form and reports whether it is valid.
 * Adds the `was-validated` class so `:invalid` field styling becomes visible.
 *
 * @param {HTMLFormElement} form - The form to validate.
 * @returns {boolean} True if the form passes native constraint validation.
 */
function validateForm(form) {
    if (!form || typeof form.checkValidity !== 'function') return true;
    form.classList.add('was-validated');
    return form.checkValidity();
}

/**
 * Saves user data and token to localStorage.
 * 
 * @param {string} token - JWT token
 * @param {Object} user - User object
 */
function saveAuthData(token, user) {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
}

/**
 * Clears user data and token from localStorage.
 */
function clearAuthData() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
}

/**
 * A helper function for making API requests.
 * 
 * @param {string} url - The URL to fetch.
 * @param {string} method - The HTTP method (GET, POST, etc.).
 * @param {Object} [body=null] - The request body.
 * @param {string} [token=null] - The optional JWT token.
 * @returns {Promise<{status: number, data: Object}>} The response status and data.
 */
async function apiRequest(url, method = 'GET', body = null, token = null) {
    const headers = {
        'Content-Type': 'application/json'
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const options = {
        method,
        headers
    };

    if (body) {
        options.body = JSON.stringify(body);
    }

    try {
        const response = await fetch(url, options);
        const data = await response.json();
        return {
            status: response.status,
            data
        };
    } catch (error) {
        console.error(`API Request Error (${url}):`, error);
        throw error;
    }
}

/**
 * Unwraps standardized API responses coming from the backend `successResponse` helper.
 *
 * `apiRequest` returns: { status, data } where `data` is the raw JSON body.
 * Backend success responses are shaped as: { success, message, data: <payload>, ... }
 *
 * This helper keeps the frontend DRY by centralizing the response-shape knowledge.
 *
 * @param {{status: number, data: any}} apiResult
 * @returns {{status: number, body: any, payload: any}}
 */
function unwrapApiResponse(apiResult) {
    const body = apiResult?.data;
    const payload = body && typeof body === 'object' ? body.data : null;
    return {
        status: apiResult?.status,
        body,
        payload
    };
}

/**
 * Builds a user-friendly message from standardized backend responses.
 *
 * Backend error shape: { success:false, message, errorCode, details? }
 * For ValidationError, `details` is an array like: [{ field, message, value }].
 *
 * @param {any} body
 * @returns {string}
 */
function buildUserAlertMessage(body) {
    if (!body || typeof body !== 'object') return 'Unbekannte Serverantwort';

    const base = typeof body.message === 'string' && body.message.trim().length
        ? body.message.trim()
        : 'Fehler';

    const details = Array.isArray(body.details) ? body.details : [];
    if (!details.length) return base;

    const lines = details
        .map(d => {
            const field = d?.field ? String(d.field) : 'Feld';
            const msg = d?.message ? String(d.message) : 'Ungültiger Wert';
            return `• ${field}: ${msg}`;
        })
        .join('\n');

    return `${base}\n${lines}`;
}
