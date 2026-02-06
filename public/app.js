document.addEventListener("DOMContentLoaded", () => {

    // Registrierung
    async function registration(firstname, lastname, username, password, course) {
        const response = await fetch('/api/registration', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ firstname, lastname, username, password, course }),
        });

        return await response.json();
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
    const checkButton = document.getElementById("check");
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

    // Registrierungs-Button
    const registerBtn = document.getElementById('ButtonRegReg');
    if (registerBtn) {
        registerBtn.addEventListener('click', async () => {
            const firstname = document.getElementById("textRegBenutzerVorname").value;
            const lastname = document.getElementById("textRegBenutzerNachname").value;
            const username = document.getElementById('textRegBenutzerName').value;
            const password = document.getElementById('textRegBenutzerPasswort').value;
            const course = document.getElementById('textRegBenutzerKurs').value;

            const result = await registration(firstname, lastname, username, password, course);
            console.log(result);
            alert(result.message);
        });
    }

    // Login-Button
    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) {
        loginBtn.addEventListener('click', async () => {
            const username = document.getElementById('textRegBenutzerName').value;
            const password = document.getElementById('textRegBenutzerPasswort').value;

            const result = await login(username, password);
            console.log(result);
            alert(result.message);
        });
    }
});
