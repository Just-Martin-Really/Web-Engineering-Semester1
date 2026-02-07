document.addEventListener("DOMContentLoaded", () => {
    const titleInput = document.querySelector(".textForumTitel");
    const contentInput = document.querySelector(".textForumInhalt");
    const submitBtn = document.querySelector(".buttonForumNeu");
    const forumContainer = document.querySelector(".forumBeiträge");

    // Function to load and display topics
    async function loadTopics() {
        try {
            const response = await fetch("/api/topics");
            const topics = await response.json();

            // Keep only the header "Forum Beiträge:"
            const header = forumContainer.querySelector("h4");
            forumContainer.innerHTML = "";
            if (header) {
                forumContainer.appendChild(header);
            } else {
                const newHeader = document.createElement("h4");
                newHeader.textContent = "Forum Beiträge:";
                forumContainer.appendChild(newHeader);
            }

            topics.forEach(topic => {
                const topicArticle = document.createElement("article");
                topicArticle.className = "forum-post";
                topicArticle.style.borderBottom = "1px solid #ddd";
                topicArticle.style.padding = "20px 0";
                topicArticle.style.marginBottom = "10px";

                const topicTitle = document.createElement("h3");
                topicTitle.textContent = topic.title;
                topicTitle.style.color = "#333";
                topicTitle.style.marginBottom = "5px";

                const topicDate = document.createElement("small");
                const date = new Date(topic.createdAt);
                topicDate.textContent = date.toLocaleDateString("de-DE") + " " + date.toLocaleTimeString("de-DE", {hour: '2-digit', minute:'2-digit'});
                topicDate.style.color = "#888";
                topicDate.style.display = "block";
                topicDate.style.marginBottom = "10px";

                const topicContent = document.createElement("p");
                topicContent.textContent = topic.content;
                topicContent.style.whiteSpace = "pre-wrap";
                topicContent.style.color = "#555";
                topicContent.style.lineHeight = "1.5";

                topicArticle.appendChild(topicTitle);
                topicArticle.appendChild(topicDate);
                topicArticle.appendChild(topicContent);

                forumContainer.appendChild(topicArticle);
            });
        } catch (error) {
            console.error("Error loading topics:", error);
        }
    }

    // Function to create a new topic
    async function createTopic() {
        const title = titleInput.value.trim();
        const content = contentInput.value.trim();

        if (!title || !content) {
            alert("Bitte Titel und Inhalt eingeben.");
            return;
        }

        try {
            const response = await fetch("/api/topics", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ title, content })
            });

            if (response.ok) {
                titleInput.value = "";
                contentInput.value = "";
                await loadTopics();
            } else {
                const errorData = await response.json();
                alert("Fehler: " + (errorData.error || "Unbekannter Fehler"));
            }
        } catch (error) {
            console.error("Error creating topic:", error);
            alert("Fehler beim Hochladen des Beitrags.");
        }
    }

    // Event listener for the submit button
    if (submitBtn) {
        submitBtn.addEventListener("click", createTopic);
    }

    // Logic for "Back to top" button
    const backToTopBtn = document.querySelector(".buttonOben");
    if (backToTopBtn) {
        backToTopBtn.addEventListener("click", () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // Logic for Logout button
    const logoutBtn = document.querySelector(".buttonLogout");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", () => {
            window.location.href = "index.html";
        });
    }

    // Initial load
    loadTopics();
});
