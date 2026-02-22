document.addEventListener("DOMContentLoaded", () => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));

    if (!token) {
        window.location.href = "/";
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

    // Pagination state (chunk 3)
    const PAGE_LIMIT = 10;
    let currentPage = 1;
    let currentKursFilter = 'ALL';

    // Create a small load-more UI (inserted once above #postsList)
    let loadMoreBtn;
    let loadMoreMeta;
    let isLoadingTopics = false;

    function ensureLoadMoreControls() {
        if (loadMoreBtn && loadMoreMeta) return;

        const host = forumContainer?.parentElement;
        if (!host) return;

        const wrapper = document.createElement('div');
        wrapper.className = 'posts-controls';

        loadMoreMeta = document.createElement('div');
        loadMoreMeta.className = 'posts-controls-meta';

        loadMoreBtn = document.createElement('button');
        loadMoreBtn.type = 'button';
        loadMoreBtn.className = 'posts-load-more';
        loadMoreBtn.textContent = 'Mehr laden';

        loadMoreBtn.addEventListener('click', async () => {
            await loadTopics(currentKursFilter, { mode: 'append' });
        });

        wrapper.appendChild(loadMoreMeta);
        wrapper.appendChild(loadMoreBtn);

        // Bottom placement: after the posts list
        host.appendChild(wrapper);
    }

    function setLoadMoreState({ canLoadMore, page, totalPages } = {}) {
        ensureLoadMoreControls();
        if (!loadMoreBtn || !loadMoreMeta) return;

        loadMoreBtn.style.display = canLoadMore ? 'inline-flex' : 'none';
        if (typeof page === 'number' && typeof totalPages === 'number' && totalPages > 0) {
            loadMoreMeta.textContent = `Seite ${page} von ${totalPages}`;
        } else {
            loadMoreMeta.textContent = '';
        }
    }

    function setLoadMoreLoading(isLoading) {
        if (!loadMoreBtn) return;
        if (isLoading) {
            loadMoreBtn.disabled = true;
            loadMoreBtn.dataset.originalText = loadMoreBtn.dataset.originalText || loadMoreBtn.textContent;
            loadMoreBtn.textContent = 'Lade…';
        } else {
            loadMoreBtn.disabled = false;
            if (loadMoreBtn.dataset.originalText) {
                loadMoreBtn.textContent = loadMoreBtn.dataset.originalText;
            }
        }
    }

    async function deleteTopicById(topicId) {
        if (!topicId) return;

        const confirmed = window.confirm('Beitrag wirklich löschen?');
        if (!confirmed) return;

        try {
            const result = await apiRequest(`/api/topics/${topicId}`, 'DELETE', null, token);
            const { status, body } = unwrapApiResponse(result);

            if (status === 200) {
                allTopics = allTopics.filter(t => String(t._id) !== String(topicId));
                applySearchAndFilter();
            } else if (status === 401) {
                alert('Sitzung abgelaufen. Bitte erneut anmelden.');
                clearAuthData();
                window.location.href = '/';
            } else {
                alert(buildUserAlertMessage(body));
            }
        } catch (error) {
            console.error('Error deleting topic:', error);
            alert('Fehler beim Löschen des Beitrags.');
        }
    }

    /**
     * Best-effort username extraction (supports populated author object or legacy string).
     */
    function getAuthorUsername(author) {
        if (!author) return 'Unbekannt';
        if (typeof author === 'string') return author;
        if (typeof author === 'object' && author.username) return author.username;
        return 'Unbekannt';
    }

    function getCommentAuthorName(comment) {
        if (!comment) return 'Unbekannt';
        if (typeof comment.seedAuthorName === 'string' && comment.seedAuthorName.trim()) return comment.seedAuthorName.trim();
        return getAuthorUsername(comment.author);
    }

    /**
     * Render a single comment.
     */
    function renderCommentItem(comment, { highlight = false } = {}) {
        const item = document.createElement('div');
        item.className = highlight ? 'comment-item comment-item--highlight' : 'comment-item';

        const meta = document.createElement('div');
        meta.className = 'comment-meta';

        const author = document.createElement('span');
        author.className = 'comment-author';
        author.textContent = getCommentAuthorName(comment);

        const date = document.createElement('span');
        date.className = 'comment-date';
        date.textContent = comment?.createdAt ? formatDate(comment.createdAt) : '';

        meta.appendChild(author);
        meta.appendChild(date);

        const content = document.createElement('p');
        content.className = 'comment-content';
        content.textContent = comment?.content ?? '';

        item.appendChild(meta);
        item.appendChild(content);
        return item;
    }

    /**
     * Render comments list for a topic.
     */
    function renderCommentsList(comments = [], { expanded = false, highlightIndex = null } = {}) {
        const wrapper = document.createElement('div');
        wrapper.className = 'comments-list';

        if (!comments.length) {
            const empty = document.createElement('p');
            empty.className = 'comments-empty';
            empty.textContent = 'Noch keine Kommentare.';
            wrapper.appendChild(empty);
            return wrapper;
        }

        if (!expanded) {
            // Collapsed: show only newest comment (last)
            const newestIndex = comments.length - 1;
            wrapper.appendChild(renderCommentItem(comments[newestIndex], { highlight: highlightIndex === newestIndex }));
            return wrapper;
        }

        comments.forEach((c, idx) => {
            wrapper.appendChild(renderCommentItem(c, { highlight: highlightIndex === idx }));
        });

        return wrapper;
    }

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
            topicArticle.setAttribute('data-topic-id', String(topic._id));

            const topicHeader = document.createElement("div");
            topicHeader.className = "post-header";

            const topicTitle = document.createElement("h3");
            topicTitle.textContent = topic.title;

            const topicKurs = document.createElement("span");
            topicKurs.className = "post-kurs";
            topicKurs.textContent = topic.kurs;

            topicHeader.appendChild(topicTitle);
            topicHeader.appendChild(topicKurs);

            const metaRow = document.createElement('div');
            metaRow.className = 'post-meta';

            const topicAuthorUsername = topic.authorName || getAuthorUsername(topic.author);

            const topicAuthor = document.createElement('span');
            topicAuthor.className = 'post-author';
            topicAuthor.textContent = `@${topicAuthorUsername}`;

            const topicDate = document.createElement("span");
            topicDate.className = 'post-date';
            topicDate.textContent = formatDate(topic.createdAt);

            metaRow.appendChild(topicAuthor);
            metaRow.appendChild(topicDate);

            // Author-only actions (Delete)
            if (user && (user.username || '').toLowerCase() === String(topicAuthorUsername || '').toLowerCase()) {
                const actions = document.createElement('div');
                actions.className = 'post-actions';

                const delBtn = document.createElement('button');
                delBtn.type = 'button';
                delBtn.className = 'post-delete';
                delBtn.textContent = 'Löschen';
                delBtn.addEventListener('click', () => deleteTopicById(topic._id));

                actions.appendChild(delBtn);
                metaRow.appendChild(actions);
            }

            const topicContent = document.createElement("p");
            topicContent.className = 'post-content';
            topicContent.textContent = topic.content;

            // Comments
            const commentsSection = document.createElement('section');
            commentsSection.className = 'comments-section';

            const commentsHeader = document.createElement('div');
            commentsHeader.className = 'comments-header';

            const commentsTitle = document.createElement('h4');
            commentsTitle.textContent = 'Kommentare';

            const commentsCount = document.createElement('span');
            const comments = Array.isArray(topic.comments) ? topic.comments : [];
            commentsCount.className = 'comments-count';
            commentsCount.textContent = `(${comments.length})`;

            const toggleBtn = document.createElement('button');
            toggleBtn.type = 'button';
            toggleBtn.className = 'comments-toggle';

            let isExpanded = false;
            let showForm = false;

            const rebuildToggleText = () => {
                const hiddenCount = Math.max(0, comments.length - 1);
                if (isExpanded) {
                    toggleBtn.textContent = 'Kommentare ausblenden';
                    toggleBtn.style.display = comments.length ? 'inline-flex' : 'none';
                } else if (hiddenCount > 0) {
                    toggleBtn.textContent = `${hiddenCount} ältere Kommentare anzeigen`;
                    toggleBtn.style.display = 'inline-flex';
                } else {
                    // 0 or 1 comment -> nothing to expand
                    toggleBtn.textContent = '';
                    toggleBtn.style.display = 'none';
                }
            };

            commentsHeader.appendChild(commentsTitle);
            commentsHeader.appendChild(commentsCount);
            commentsHeader.appendChild(toggleBtn);

            let commentsList = renderCommentsList(comments, { expanded: isExpanded });

            const commentActionsRow = document.createElement('div');
            commentActionsRow.className = 'comment-actions';

            const commentRevealBtn = document.createElement('button');
            commentRevealBtn.type = 'button';
            commentRevealBtn.className = 'comment-reveal';
            commentRevealBtn.textContent = 'Kommentieren…';

            commentActionsRow.appendChild(commentRevealBtn);

            const commentForm = document.createElement('form');
            commentForm.className = 'comment-form comment-form--hidden';

            const commentInput = document.createElement('textarea');
            commentInput.className = 'comment-input';
            commentInput.placeholder = 'Kommentar schreiben…';
            commentInput.rows = 2;

            const commentBtn = document.createElement('button');
            commentBtn.type = 'submit';
            commentBtn.className = 'comment-submit';
            commentBtn.textContent = 'Senden';

            commentForm.appendChild(commentInput);
            commentForm.appendChild(commentBtn);

            function setExpanded(nextExpanded) {
                isExpanded = Boolean(nextExpanded);
                commentsList.replaceWith(renderCommentsList(comments, { expanded: isExpanded }));
                commentsList = commentsSection.querySelector('.comments-list');
                rebuildToggleText();
            }

            function setFormVisible(nextVisible) {
                showForm = Boolean(nextVisible);
                if (showForm) {
                    commentForm.classList.remove('comment-form--hidden');
                    commentInput.focus();
                } else {
                    commentForm.classList.add('comment-form--hidden');
                }
            }

            toggleBtn.addEventListener('click', () => {
                setExpanded(!isExpanded);
                if (!isExpanded) {
                    setFormVisible(false);
                }
            });

            commentRevealBtn.addEventListener('click', () => {
                if (!isExpanded) setExpanded(true);
                setFormVisible(true);
            });

            commentForm.addEventListener('submit', async (e) => {
                e.preventDefault();

                const content = commentInput.value.trim();
                if (!content.length) {
                    alert('Bitte Kommentar eingeben.');
                    return;
                }

                try {
                    const result = await apiRequest(`/api/topics/${topic._id}/comments`, 'POST', { content }, token);
                    const { status, body, payload } = unwrapApiResponse(result);

                    if (status === 201) {
                        commentInput.value = '';

                        const updatedTopic = payload;
                        const updatedComments = Array.isArray(updatedTopic?.comments) ? updatedTopic.comments : [];

                        // Update local reference so toggle text + rendering stays consistent
                        comments.length = 0;
                        updatedComments.forEach(c => comments.push(c));

                        commentsCount.textContent = `(${comments.length})`;

                        // Expand and show all comments after posting
                        isExpanded = true;

                        // Re-render with highlight on last comment and scroll it into view
                        const highlightIndex = comments.length - 1;
                        commentsList.replaceWith(renderCommentsList(comments, { expanded: true, highlightIndex }));
                        commentsList = commentsSection.querySelector('.comments-list');
                        rebuildToggleText();

                        const items = commentsList.querySelectorAll('.comment-item');
                        const lastItem = items && items[items.length - 1];
                        if (lastItem && typeof lastItem.scrollIntoView === 'function') {
                            lastItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }

                        setFormVisible(false);
                    } else if (status === 401) {
                        alert('Sitzung abgelaufen. Bitte erneut anmelden.');
                        clearAuthData();
                        window.location.href = '/';
                    } else {
                        alert(buildUserAlertMessage(body));
                    }
                } catch (error) {
                    console.error('Error creating comment:', error);
                    alert('Fehler beim Erstellen des Kommentars.');
                }
            });

            rebuildToggleText();

            commentsSection.appendChild(commentsHeader);
            commentsSection.appendChild(commentsList);
            commentsSection.appendChild(commentActionsRow);
            commentsSection.appendChild(commentForm);

            topicArticle.appendChild(topicHeader);
            topicArticle.appendChild(metaRow);
            topicArticle.appendChild(topicContent);
            topicArticle.appendChild(commentsSection);

            forumContainer.appendChild(topicArticle);
        });
    }

    /**
     * Loads topics from the API and displays them in the forum container.
     * @param {string} kurs - Optional filter for Kurs
     * @param {{ mode?: 'replace' | 'append' }} options - Loading options.
     */
    async function loadTopics(kurs = 'ALL', { mode = 'replace' } = {}) {
        if (isLoadingTopics) return;

        try {
            isLoadingTopics = true;
            ensureLoadMoreControls();
            setLoadMoreLoading(true);

            // If we're appending, remember where the list ended so we can scroll there.
            const scrollAnchorId = mode === 'append' && allTopics.length
                ? String(allTopics[allTopics.length - 1]?._id)
                : null;

            // When replacing (filter change / initial load) reset page
            if (mode === 'replace') {
                currentPage = 1;
                currentKursFilter = kurs;
            }

            let url = `/api/topics?page=${currentPage}&limit=${PAGE_LIMIT}`;
            if (kurs !== 'ALL') {
                url += `&kurs=${kurs}`;
            }

            const result = await apiRequest(url);
            const { body, payload } = unwrapApiResponse(result);

            if (!Array.isArray(payload)) {
                console.error('Unexpected topics payload shape:', body);
                allTopics = [];
                setLoadMoreState({ canLoadMore: false });
            } else {
                if (mode === 'append') {
                    // Avoid duplicates by _id
                    const existingIds = new Set(allTopics.map(t => String(t._id)));
                    const next = payload.filter(t => !existingIds.has(String(t._id)));
                    allTopics = allTopics.concat(next);
                } else {
                    allTopics = payload;
                }

                const pagination = body && typeof body === 'object' ? body.pagination : null;
                const hasNextPage = Boolean(pagination?.hasNextPage);
                setLoadMoreState({ canLoadMore: hasNextPage, page: pagination?.page, totalPages: pagination?.totalPages });

                // Only advance page after a successful fetch
                if (mode === 'append') {
                    currentPage = (pagination?.page || currentPage) + 1;
                } else {
                    currentPage = (pagination?.page || 1) + 1;
                }
            }

            applySearchAndFilter();

            // After re-rendering, scroll to the first newly loaded content (nice continuity)
            if (mode === 'append' && scrollAnchorId) {
                const cards = forumContainer.querySelectorAll('.forum-post');
                const firstNew = Array.from(cards).find(el => {
                    const idAttr = el.getAttribute('data-topic-id');
                    return idAttr && idAttr !== scrollAnchorId;
                });
                if (firstNew) {
                    firstNew.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }
        } catch (error) {
            console.error("Error loading topics:", error);
            setLoadMoreState({ canLoadMore: false });
        } finally {
            isLoadingTopics = false;
            setLoadMoreLoading(false);
        }
    }

    /**
     * Applies search and filter to the topics and displays them.
     */
    function applySearchAndFilter() {
        const searchTerm = searchInput ? searchInput.value.toLowerCase() : "";

        const filteredTopics = allTopics.filter(topic => (
            topic.title.toLowerCase().includes(searchTerm) ||
            topic.content.toLowerCase().includes(searchTerm)
        ));

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
            const { status, body } = unwrapApiResponse(result);

            if (status === 201) {
                titleInput.value = "";
                contentInput.value = "";

                // After creating a topic, reset pagination and reload the current filter.
                let currentFilter = 'ALL';
                filterRadios.forEach(radio => {
                    if (radio.checked) {
                        currentFilter = radio.value;
                    }
                });
                await loadTopics(currentFilter, { mode: 'replace' });
            } else {
                if (status === 401) {
                    alert("Sitzung abgelaufen. Bitte erneut anmelden.");
                    clearAuthData();
                    window.location.href = "/";
                } else {
                    alert(buildUserAlertMessage(body));
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
            loadTopics(e.target.value, { mode: 'replace' });
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
            alert('Abgemeldet');
            window.location.href = "/";
        });
    }


    // Initial load
    loadTopics('ALL', { mode: 'replace' });
})