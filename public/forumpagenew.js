
// 1. Mock user data
const loggedInUser = {
    username: "Fred_User",
    email: "fred.forum@student.at"
};

document.addEventListener('DOMContentLoaded', () => {
    // --- DOM ELEMENTS ---
    const avatarBtn = document.querySelector('.foto-avatar');
    const userDropdown = document.getElementById('userDropdown');
    const nameDisplay = document.querySelector('.user-name');
    const emailDisplay = document.querySelector('.user-email');
    const logoutBtn = document.querySelector('.buttonLogout');

    const postTitleInput = document.querySelector('.textForumTitel');
    const postTextInput = document.querySelector('.textForumInhalt');
    const uploadBtn = document.querySelector('.buttonForumNeu');
    const postsList = document.getElementById('postsList');
    const scrollUpBtn = document.querySelector('.buttonOben');

    // Define these for the filter to work
    const searchInput = document.getElementById('forumSearch');
    const sidebarRadios = document.querySelectorAll('input[name="kurs"]');

    // --- USER DROPDOWN LOGIC ---
    function populateUserInfo() {
        nameDisplay.innerText = loggedInUser.username;
        emailDisplay.innerText = loggedInUser.email;
    }

    avatarBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        populateUserInfo();
        const isVisible = userDropdown.style.display === "block";
        userDropdown.style.display = isVisible ? "none" : "block";
    });

    window.addEventListener('click', () => {
        userDropdown.style.display = "none";
    });

    userDropdown.addEventListener('click', (e) => { e.stopPropagation(); });

    logoutBtn.addEventListener('click', () => {
        console.log("User logged out");
    });

    // --- DISPLAY POSTS LOGIC ---
    function displayPosts() {
        const posts = JSON.parse(localStorage.getItem('forumPosts')) || [];
        postsList.innerHTML = '';

        [...posts].reverse().forEach(post => {
            // CRITICAL FIX: Added data-kurs attribute here so applyFilters can read it
            postsList.innerHTML += `
                <div class="post-card" data-kurs="${post.course}">
                    <h3>${post.title}</h3>
                    <div class="post-meta">
                        Gepostet von ${post.author} am ${post.timestamp} • ${post.course}
                    </div>
                    <p>${post.content}</p>
                </div>
            `;
        });

        // Re-apply filters after drawing posts to keep current view
        applyFilters();
    }

    // --- POSTING LOGIC (New Posts) ---
    uploadBtn.addEventListener('click', () => {
        const title = postTitleInput.value.trim();
        const content = postTextInput.value.trim();
        const selectedCourseInput = document.querySelector('input[name="newPostKurs"]:checked');

        if (title && content && selectedCourseInput) {
            const posts = JSON.parse(localStorage.getItem('forumPosts')) || [];

            const newPost = {
                title: title,
                content: content,
                course: selectedCourseInput.value,
                author: loggedInUser.username,
                timestamp: new Date().toLocaleString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' })
            };

            posts.push(newPost);
            localStorage.setItem('forumPosts', JSON.stringify(posts));

            postTitleInput.value = '';
            postTextInput.value = '';

            displayPosts();
        } else {
            alert("Please fill in all fields and select a course.");
        }
    });

    // --- UNIFIED FILTERING LOGIC ---
    function applyFilters() {
        const searchTerm = searchInput ? searchInput.value.toLowerCase() : "";
        const selectedRadio = document.querySelector('input[name="kurs"]:checked');
        const selectedFilter = selectedRadio ? selectedRadio.value : "ALL";

        const posts = document.querySelectorAll('.post-card');

        posts.forEach(post => {
            // Matches data-kurs from the HTML we generated in displayPosts
            const postKurs = post.getAttribute('data-kurs');
            const title = post.querySelector('h3').innerText.toLowerCase();
            const content = post.querySelector('p').innerText.toLowerCase();

            const matchesCourse = (selectedFilter === "ALL" || postKurs === selectedFilter);
            const matchesSearch = (title.includes(searchTerm) || content.includes(searchTerm));

            if (matchesCourse && matchesSearch) {
                post.style.display = 'flex';
            } else {
                post.style.display = 'none';
            }
        });
    }

    // Event listeners for filters
    if (sidebarRadios) {
        sidebarRadios.forEach(radio => {
            radio.addEventListener('change', applyFilters);
        });
    }

    if (searchInput) {
        searchInput.addEventListener('keyup', applyFilters);
    }
    // Scroll to top
    if (scrollUpBtn) {
        scrollUpBtn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // Initial load
    displayPosts();
});