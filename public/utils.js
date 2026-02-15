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
