document.addEventListener("DOMContentLoaded", () => {

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
});
