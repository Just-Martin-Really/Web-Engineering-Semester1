// 1. Mock user data (This will eventually come from your Java backend)
const loggedInUser = {
    username: "Fred_User",
    email: "fred.forum@student.at"
};

// 2. Select DOM Elements
const avatarBtn = document.querySelector('.foto-avatar'); // The avatar in your header
const userDropdown = document.getElementById('userDropdown');
const nameDisplay = document.querySelector('.user-name');
const emailDisplay = document.querySelector('.user-email');

// Post-related elements
const postTitleInput = document.querySelector('input[placeholder="Hier Titel eingeben..."]');
const postTextInput = document.querySelector('textarea');
const uploadBtn = document.querySelector('.button-upload'); // Add this class to your "Beitrag hochladen" button
const forumContainer = document.querySelector('.forum-posts-container'); // The area where posts will appear

// --- DROPDOWN LOGIC ---

// Function to fill user info in the dropdown
function populateUserInfo() {
    nameDisplay.innerText = loggedInUser.username;
    emailDisplay.innerText = loggedInUser.email;
}

// Toggle dropdown visibility
avatarBtn.addEventListener('click', (e) => {
    e.stopPropagation(); // Prevents the window click event from closing it immediately
    populateUserInfo();

    if (userDropdown.style.display === "none" || userDropdown.style.display === "") {
        userDropdown.style.display = "block";
    } else {
        userDropdown.style.display = "none";
    }
});

// Close dropdown when clicking anywhere else on the screen
window.addEventListener('click', () => {
    userDropdown.style.display = "none";
});

// Prevent dropdown from closing when clicking inside its own box
userDropdown.addEventListener('click', (e) => {
    e.stopPropagation();
});

// --- POSTING LOGIC ---

// Function to display posts from LocalStorage
function displayPosts() {
    const posts = JSON.parse(localStorage.getItem('forumPosts')) || [];
    // Clear the container first (except for the input area)
    // Assuming your posts list is a separate div
    const postsList = document.getElementById('postsList');
    postsList.innerHTML = '';

    posts.reverse().forEach(post => {
        postsList.innerHTML += `
            <div class="post-card" style="background: white; padding: 20px; border-radius: 10px; margin-bottom: 20px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                <span style="color: #7B88EB; font-weight: bold; font-size: 0.8rem;">${post.course}</span>
                <h3 style="margin: 5px 0;">${post.title}</h3>
                <p style="color: #555;">${post.content}</p>
                <small style="color: #aaa;">Posted by: ${post.author}</small>
            </div>
        `;
    });
}

// Function to handle new post upload
uploadBtn.addEventListener('click', () => {
    const title = postTitleInput.value;
    const content = postTextInput.value;
    // Find which radio button is checked
    const selectedCourse = document.querySelector('input[name="kurs"]:checked').value;

    if (title && content) {
        const posts = JSON.parse(localStorage.getItem('forumPosts')) || [];

        const newPost = {
            title: title,
            content: content,
            course: selectedCourse,
            author: loggedInUser.username,
            timestamp: new Date().toLocaleString()
        };

        posts.push(newPost);
        localStorage.setItem('forumPosts', JSON.stringify(posts));

        // Clear inputs
        postTitleInput.value = '';
        postTextInput.value = '';

        displayPosts(); // Refresh the list
    } else {
        alert("Please fill in both the title and the text!");
    }
});

// Initialize posts display on page load
displayPosts();