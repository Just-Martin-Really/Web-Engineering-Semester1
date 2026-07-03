document.addEventListener("DOMContentLoaded", () => {
    /**
     * Handles user registration by calling the API and managing the response.
     *
     * @param {string} firstname
     * @param {string} lastname
     * @param {string} username
     * @param {string} password
     * @param {string} course
     * @returns {Promise<{status: number, data: Object}>}
     */
    async function registration(firstname, lastname, username, password, course) {
        return await apiRequest('/api/registration', 'POST', {firstname, lastname, username, password, course});
    }

    /**
     * Handles user login by calling the API and managing the response.
     *
     * @param {string} username
     * @param {string} password
     * @returns {Promise<{status: number, data: Object}>}
     */
    async function login(username, password) {
        return await apiRequest('/api/login', 'POST', {username, password});
    }

    // Registration form
    const registrationForm = document.getElementById('registrationForm');
    if (registrationForm) {
        registrationForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            if (!validateForm(registrationForm)) {
                showToast('Bitte fülle alle Felder korrekt aus.', 'warning');
                return;
            }

            const firstnameField = document.getElementById("textRegBenutzerVorname");
            const lastnameField = document.getElementById("textRegBenutzerNachname");
            const usernameField = document.getElementById('textRegBenutzerName');
            const passwordField = document.getElementById('textRegBenutzerPasswort');
            const courseField = document.getElementById('textRegBenutzerKurs');

            const firstname = firstnameField.value;
            const lastname = lastnameField.value;
            const username = usernameField.value;
            const password = passwordField.value;
            const course = courseField.value;

            const result = await registration(firstname, lastname, username, password, course);
            const {status, body, payload} = unwrapApiResponse(result);

            if (status === 201 && payload) {
                // Save both access and refresh tokens from standardized API format
                saveAuthData(payload.accessToken, payload.user);
                localStorage.setItem('refreshToken', payload.refreshToken);
                registrationForm.reset();
                registrationForm.classList.remove('was-validated');
                showToast('Registrierung erfolgreich. Weiterleitung…', 'success');
                window.location.href = "/forum";
            } else {
                showToast(buildUserAlertMessage(body), 'danger');
            }
        });
    }

    /**
     * Shared login handler (used for both click and form submit).
     */
    async function handleLoginSubmit(e) {
        if (e && typeof e.preventDefault === 'function') e.preventDefault();

        const loginForm = document.getElementById('loginForm');
        if (loginForm && !validateForm(loginForm)) {
            showToast('Bitte Benutzername und Passwort eingeben.', 'warning');
            return;
        }

        const username = document.getElementById('textLoginBenutzerName')?.value;
        const password = document.getElementById('textLoginBenutzerPasswort')?.value;

        const result = await login(username, password);
        const {status, body, payload} = unwrapApiResponse(result);

        if (status === 200 && payload) {
            // Save both access and refresh tokens from standardized API format
            saveAuthData(payload.accessToken, payload.user);
            localStorage.setItem('refreshToken', payload.refreshToken);
            showToast('Anmeldung erfolgreich. Weiterleitung…', 'success');
            window.location.href = "/forum";
        } else {
            showToast(buildUserAlertMessage(body), 'danger');
        }
    }

    // Login form submit so the user can press Enter
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLoginSubmit);
    }
});
