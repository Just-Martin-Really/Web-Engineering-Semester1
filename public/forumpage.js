
document.addEventListener("DOMContentLoaded", () => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));

    if (!token) {
        window.location.href = "index.html";
        return;
    }
    // Display user context
    const userNameElement = document.querySelector(".user-name");
    const userUserNameElement = document.querySelector(".user-username");
    const userCourseElement = document.querySelector(".user-course");
    if (userNameElement && user) {
        userNameElement.textContent = `${user.firstname} ${user.lastname}`;
    }
    if (userUserNameElement && user) {
        userUserNameElement.textContent = user.username;
    }
    if (userCourseElement && user) {
        userCourseElement.textContent = user.course;
    }
    const titleInput = document.querySelector(".textForumTitel");
    const contentInput = document.querySelector(".textForumInhalt");
    const submitBtn = document.querySelector(".buttonForumNeu");
    const forumContainer = document.querySelector("#postsList");
    const filterRadios = document.querySelectorAll('input[name="kurs"]');
    const newPostKursRadios = document.querySelectorAll('input[name="newPostKurs"]');
    const searchInput = document.getElementById("forumSearch");
    const avatarBtn = document.querySelector(".foto-avatar");
    const userDropdown = document.getElementById("userDropdown");

    let allTopics = [];

    /**
     * Displays topics in the forum container.
     * @param {Array} topics - The topics to display.
     */
    function displayTopics(topics) {
        forumContainer.innerHTML = "";
        
        if (!topics || topics.length === 0) {
            forumContainer.innerHTML = "<p>Keine Beiträge gefunden.</p>";
            return;
        }

        topics.forEach(topic => {
            const topicArticle = document.createElement("article");
            topicArticle.className = "forum-post";
            topicArticle.style.borderBottom = "1px solid #ddd";
            topicArticle.style.padding = "15px 0";

            const topicHeader = document.createElement("div");
            topicHeader.className = "post-header";
            topicHeader.style.display = "flex";
            topicHeader.style.alignItems = "center";
            topicHeader.style.gap = "10px";
            
            const topicTitle = document.createElement("h3");
            topicTitle.textContent = topic.title;
            
            const topicKurs = document.createElement("span");
            topicKurs.className = "post-kurs";
            topicKurs.textContent = topic.kurs;
            topicKurs.style.padding = "2px 8px";
            topicKurs.style.borderRadius = "12px";
            topicKurs.style.backgroundColor = "#7979e8";
            topicKurs.style.color = "white";
            topicKurs.style.fontSize = "0.8em";

            topicHeader.appendChild(topicTitle);
            topicHeader.appendChild(topicKurs);

            const topicDate = document.createElement("small");
            topicDate.textContent = formatDate(topic.createdAt);
            topicDate.style.color = "#888";
            
            const topicContent = document.createElement("p");
            topicContent.textContent = topic.content;
            topicContent.style.marginTop = "10px";

            topicArticle.appendChild(topicHeader);
            topicArticle.appendChild(topicDate);
            topicArticle.appendChild(topicContent);
            forumContainer.appendChild(topicArticle);
        });
    }

    /**
     * Loads topics from the API and displays them in the forum container.
     * @param {string} kurs - Optional filter for Kurs
     */
    async function loadTopics(kurs = 'ALL') {
        try {
            let url = "/api/topics";
            if (kurs !== 'ALL') {
                url += `?kurs=${kurs}`;
            }
            const {data: topics} = await apiRequest(url);
            allTopics = topics;
            applySearchAndFilter();
        } catch (error) {
            console.error("Error loading topics:", error);
        }
    }

    /**
     * Applies search and filter to the topics and displays them.
     */
    function applySearchAndFilter() {
        const searchTerm = searchInput ? searchInput.value.toLowerCase() : "";
        
        const filteredTopics = allTopics.filter(topic => {
            const matchesSearch = topic.title.toLowerCase().includes(searchTerm) || 
                                 topic.content.toLowerCase().includes(searchTerm);
            return matchesSearch;
        });
        
        displayTopics(filteredTopics);
    }

    /**
     * Creates a new topic by sending the input data to the API.
     */
    async function createTopic() {
        const title = titleInput.value.trim();
        const content = contentInput.value.trim();
        
        let selectedKurs;
        newPostKursRadios.forEach(radio => {
            if (radio.checked) {
                selectedKurs = radio.value;
            }
        });

        if (!title || !content || !selectedKurs) {
            alert("Bitte Titel, Inhalt und Kurs auswählen.");
            return;
        }
        try {
            const result = await apiRequest("/api/topics", "POST", {title, content, kurs: selectedKurs}, token);
            if (result.status === 201) {
                titleInput.value = "";
                contentInput.value = "";
                
                // Refresh topics based on current filter
                let currentFilter = 'ALL';
                filterRadios.forEach(radio => {
                    if (radio.checked) {
                        currentFilter = radio.value;
                    }
                });
                await loadTopics(currentFilter);
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

    // Event listeners for filter radios
    filterRadios.forEach(radio => {
        radio.addEventListener("change", (e) => {
            loadTopics(e.target.value);
        });
    });

    // Event listener for search input
    if (searchInput) {
        searchInput.addEventListener("input", applySearchAndFilter);
    }

    // User dropdown logic
    if (avatarBtn && userDropdown) {
        avatarBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            const isVisible = userDropdown.style.display === "block";
            userDropdown.style.display = isVisible ? "none" : "block";
        });

        window.addEventListener("click", () => {
            userDropdown.style.display = "none";
        });

        userDropdown.addEventListener("click", (e) => {
            e.stopPropagation();
        });
    }

    // Logic for "Back to top" button
    const backToTopBtn = document.querySelector(".buttonOben");
    if (backToTopBtn) {
        backToTopBtn.addEventListener("click", () => {
            window.scrollTo({top: 0, behavior: 'smooth'});
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
})