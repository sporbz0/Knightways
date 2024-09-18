// Check if Firebase is initialized and Firebase services are available
auth = window.firebaseAuth;
db = window.firebaseDB;
const storage = window.firebaseStorage;


// DOM Elements
const usernameForm = document.getElementById('usernameForm');
const newUsernameInput = document.getElementById('newUsername');

const passwordForm = document.getElementById('passwordForm');
const currentPasswordInput = document.getElementById('currentPassword');
const newPasswordInput = document.getElementById('newPassword');

const profileImageForm = document.getElementById('profileImageForm');
const profileImageInput = document.getElementById('profileImage');
const currentProfileImageDiv = document.getElementById('currentProfileImage');

const themeSelector = document.getElementById('theme-selector');

// Function to load current profile image
async function loadCurrentProfileImage(user) {
    if (!user) return;
    try {
        const storageRef = storage.ref();
        const imageRef = storageRef.child(`profileImages/${user.uid}/profile.jpg`);
        const url = await imageRef.getDownloadURL();
        currentProfileImageDiv.innerHTML = `<img src="${url}" alt="Profile Image">`;
    } catch (error) {
        // If image doesn't exist, display a placeholder
        currentProfileImageDiv.innerHTML = `<img src="images/default-avatar.png" alt="Default Avatar">`;
    }
}

// Listen for Auth State Changes
auth.onAuthStateChanged(user => {
    if (user) {
        loadCurrentProfileImage(user);
        loadThemePreference(user.uid);
    } else {
        currentProfileImageDiv.innerHTML = '';
        loadThemePreference(null);
    }
});

// Change Username Handler
usernameForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const newUsername = newUsernameInput.value.trim();

    if (newUsername === "") {
        alert("Username cannot be empty.");
        return;
    }

    try {
        const user = auth.currentUser;
        if (!user) {
            alert("No user is logged in.");
            return;
        }

        console.log("User UID:", user.uid); // Debugging

        // Optional: Check if username is already taken
        const usernameQuery = await db.collection('users').where('username', '==', newUsername).get();
        if (!usernameQuery.empty) {
            alert("Username is already taken. Please choose another one.");
            return;
        }

        // Update Firebase Auth displayName
        await user.updateProfile({
            displayName: newUsername
        });

        // Update Firestore user document
        await db.collection('users').doc(user.uid).update({
            username: newUsername
        });

        alert("Username updated successfully!");
        newUsernameInput.value = '';
    } catch (error) {
        console.error("Error updating username: ", error);
        if (error.code === 'permission-denied') {
            alert("Insufficient permissions to update the username.");
        } else {
            alert("An error occurred: " + error.message);
        }
    }
});


// Change Password Handler
passwordForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const currentPassword = currentPasswordInput.value.trim();
    const newPassword = newPasswordInput.value.trim();

    if (currentPassword === "" || newPassword === "") {
        alert("Please fill in all password fields.");
        return;
    }

    try {
        const user = auth.currentUser;
        if (!user) {
            alert("No user is logged in.");
            return;
        }

        // Reauthenticate the user
        const credential = firebase.auth.EmailAuthProvider.credential(user.email, currentPassword);
        await user.reauthenticateWithCredential(credential);

        // Update password
        await user.updatePassword(newPassword);

        alert("Password updated successfully!");
        passwordForm.reset();
    } catch (error) {
        console.error("Error updating password: ", error);
        alert(error.message);
    }
});

// Update Profile Image Handler
profileImageForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const file = profileImageInput.files[0];

    if (!file) {
        alert("Please select an image to upload.");
        return;
    }

    const user = auth.currentUser;
    if (!user) {
        alert("No user is logged in.");
        return;
    }

    // Optional: Validate file type and size
    const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!validTypes.includes(file.type)) {
        alert("Only JPEG, PNG, and GIF files are allowed.");
        return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
        alert("Image size should be less than 5MB.");
        return;
    }

    try {
        const storageRef = storage.ref();
        const imageRef = storageRef.child(`profileImages/${user.uid}/profile.jpg`);

        // Upload the image
        await imageRef.put(file);

        // Get the download URL
        const url = await imageRef.getDownloadURL();

        // Update Firestore user document
        await db.collection('users').doc(user.uid).update({
            profileImage: url
        });

        // Update Firebase Auth photoURL
        await user.updateProfile({
            photoURL: url
        });

        // Reload the current profile image
        loadCurrentProfileImage(user);

        alert("Profile image updated successfully!");
        profileImageForm.reset();
    } catch (error) {
        console.error("Error uploading profile image: ", error);
        alert(error.message);
    }
});

// Theme Selector Handler
themeSelector.addEventListener('change', async (e) => {
    const selectedTheme = e.target.value;
    const user = auth.currentUser;
    const userId = user ? user.uid : null;

    // Remove existing theme classes
    document.body.classList.remove('dark-theme', 'blue-theme'); // Add more theme classes here

    // Add the selected theme class if it's not light
    if (selectedTheme !== 'light') {
        document.body.classList.add(`${selectedTheme}-theme`);
    }

    // Persist the theme preference
    if (userId) {
        try {
            await db.collection('users').doc(userId).update({
                selectedTheme: selectedTheme
            });
        } catch (error) {
            console.error("Error saving theme preference: ", error);
        }
    } else {
        // Save to localStorage for unauthenticated users
        localStorage.setItem('selectedTheme', selectedTheme);
    }
});

// Load Theme Preference on Page Load
async function loadThemePreference(userId) {
    let selectedTheme = 'light'; // Default theme

    if (userId) {
        try {
            const userDoc = await db.collection('users').doc(userId).get();
            if (userDoc.exists) {
                selectedTheme = userDoc.data().selectedTheme || 'light';
            }
        } catch (error) {
            console.error("Error fetching theme preference: ", error);
        }
    } else {
        // For unauthenticated users, load theme from localStorage
        const storedTheme = localStorage.getItem('selectedTheme');
        if (storedTheme) {
            selectedTheme = storedTheme;
        }
    }

    // Set the theme selector value
    if (themeSelector) {
        themeSelector.value = selectedTheme;
    } else {
        console.error("Theme selector element is missing.");
    }
    

    // Remove existing theme classes
    document.body.classList.remove('dark-theme', 'blue-theme'); // Add more theme classes here

    // Add the selected theme class if it's not light
    if (selectedTheme !== 'light') {
        document.body.classList.add(`${selectedTheme}-theme`);
    }
}

// Initialize Theme on Page Load
document.addEventListener('DOMContentLoaded', () => {
    const user = auth.currentUser;
    if (user) {
        loadThemePreference(user.uid);
    } else {
        loadThemePreference(null);
    }
});