document.addEventListener("DOMContentLoaded", () => {
    console.log('🚀 App.js loaded');


    // Registrierung
    async function registration(firstname, lastname, username, password, course) {
        const response = await fetch('/api/registration', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ firstname, lastname, username, password, course }),
        });

        return {
            status: response.status,
            data: await response.json()
        };
    }

    // Login
    async function login(username, password) {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        return await response.json();
    }

    // -------- API TEST --------
   /* const checkButton = document.getElementById("check");
    const result = document.getElementById("result");

    checkButton.addEventListener("click", async () => {
        const response = await fetch("/api/health");
        const data = await response.json();

        result.textContent = JSON.stringify(data, null, 2);
    });

    // -------- TOPICS --------
    async function loadTopics() {
        const response = await fetch("/api/topics");
        const topics = await response.json();

        const list = document.getElementById("topicList");
        list.innerHTML = "";

        topics.forEach(topic => {
            const li = document.createElement("li");
            li.textContent = `${topic.title} (${topic.anonymous ? "anonym" : "nicht anonym"})`;
            list.appendChild(li);
        });
    }

    const submitButton = document.getElementById("submit");

    submitButton.addEventListener("click", async () => {
        const title = document.getElementById("title").value;
        const content = document.getElementById("content").value;
        const anonymous = document.getElementById("anonymous").checked;

        await fetch("/api/topics", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({title, content, anonymous})
        });

        loadTopics();
    });

    // Initial laden
    loadTopics();

    */

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
            console.log('📨 Server response:', result);
            alert(result.data.message);

            if (result.status === 201) {
                firstnameField.value = '';
                lastnameField.value = '';
                usernameField.value = '';
                passwordField.value = '';
                courseField.value = '';
                window.location.href = "Forumpage.html";
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
            console.log('📨 Server response:', result);
            alert(result.message);
        });
    }
    else {
        console.log('❌ Login button NOT found!'); // ADD THIS
    }
});
