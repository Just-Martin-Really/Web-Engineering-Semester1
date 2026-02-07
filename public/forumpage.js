document.addEventListener("DOMContentLoaded", () => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));

    if (!token) {
        window.location.href = "index.html";
        return;
    }

    // Display user context
    const userNameElement = document.querySelector(".user-name");
    const userEmailElement = document.querySelector(".user-email");
    if (userNameElement && user) {
        userNameElement.textContent = `${user.firstname} ${user.lastname}`;
    }
    if (userEmailElement && user) {
        userEmailElement.textContent = user.username;
    }

    const titleInput = document.querySelector(".textForumTitel");
    const contentInput = document.querySelector(".textForumInhalt");
    const submitBtn = document.querySelector(".buttonForumNeu");
    const forumContainer = document.querySelector(".forumBeiträge");

    /**
     * Loads all topics from the API and displays them in the forum container.
     */
    async function loadTopics() {
        try {
            const { data: topics } = await apiRequest("/api/topics");

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

                const topicTitle = document.createElement("h3");
                topicTitle.textContent = topic.title;

                const topicDate = document.createElement("small");
                topicDate.textContent = formatDate(topic.createdAt);

                const topicContent = document.createElement("p");
                topicContent.textContent = topic.content;

                topicArticle.appendChild(topicTitle);
                topicArticle.appendChild(topicDate);
                topicArticle.appendChild(topicContent);

                forumContainer.appendChild(topicArticle);
            });
        } catch (error) {
            console.error("Error loading topics:", error);
        }
    }

    /**
     * Creates a new topic by sending the input data to the API.
     */
    async function createTopic() {
        const title = titleInput.value.trim();
        const content = contentInput.value.trim();

        if (!title || !content) {
            alert("Bitte Titel und Inhalt eingeben.");
            return;
        }

        try {
            const result = await apiRequest("/api/topics", "POST", { title, content }, token);

            if (result.status === 201) {
                titleInput.value = "";
                contentInput.value = "";
                await loadTopics();
            } else {
                if (result.status === 401) {
                    alert("Sitzung abgelaufen. Bitte erneut anmelden.");
                    clearAuthData();
                    window.location.href = "index.html";
                } else {
                    alert("Fehler: " + (result.data.message || "Unbekannter Fehler"));
                }
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
            clearAuthData();
            window.location.href = "index.html";
        });
    }

    // Initial load
    loadTopics();
});
