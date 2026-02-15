document.addEventListener("DOMContentLoaded", () => {
    console.log('🚀 App.js loaded');


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
    return await apiRequest('/api/registration', 'POST', { firstname, lastname, username, password, course });
}

/**
 * Handles user login by calling the API and managing the response.
 * 
 * @param {string} username 
 * @param {string} password 
 * @returns {Promise<{status: number, data: Object}>}
 */
async function login(username, password) {
    return await apiRequest('/api/login', 'POST', { username, password });
}

    // Registrierungs-Button
    const registerBtn = document.getElementById('buttonRegReg');
    console.log('🔍 Register button:', registerBtn);
    if (registerBtn) {
        console.log('✅ Register button found, adding listener');
        registerBtn.addEventListener('click', async (e) => {
            e.preventDefault();
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

            console.log('📝 Form data:', { firstname, lastname, username, password, course });

            const result = await registration(firstname, lastname, username, password, course);
            const { status, body, payload } = unwrapApiResponse(result);
            console.log('📨 Server response:', result);
            alert(body?.message ?? 'Unbekannte Serverantwort');

            if (status === 201 && payload) {
                // Save both access and refresh tokens from standardized API format
                saveAuthData(payload.accessToken, payload.user);
                // Also save refresh token for later use
                localStorage.setItem('refreshToken', payload.refreshToken);
                firstnameField.value = '';
                lastnameField.value = '';
                usernameField.value = '';
                passwordField.value = '';
                courseField.value = '';
                window.location.href = "forumpage.html";
            }
        });
    }
    else{
        console.log('❌ Register button NOT found!');
    }

    // Login-Button
    const loginBtn = document.getElementById('buttonLogin');
    console.log('🔍 Login button:', loginBtn);
    if (loginBtn) {
        loginBtn.addEventListener('click', async (e) => {
            console.log('🔥 LOGIN CLICKED!');
            e.preventDefault();
            const username = document.getElementById('textLoginBenutzerName').value;
            const password = document.getElementById('textLoginBenutzerPasswort').value;

            console.log('📝 Login data:', { username, password });

            const result = await login(username, password);
            const { status, body, payload } = unwrapApiResponse(result);
            console.log('📨 Server response:', result);
            alert(body?.message ?? 'Unbekannte Serverantwort');

            if (status === 200 && payload) {
                // Save both access and refresh tokens from standardized API format
                saveAuthData(payload.accessToken, payload.user);
                // Also save refresh token for later use
                localStorage.setItem('refreshToken', payload.refreshToken);
                window.location.href = "forumpage.html";
            }
        });
    }
    else {
        console.log('❌ Login button NOT found!');
    }
});
