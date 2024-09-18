// auth.js

// Firebase references
const auth = window.firebaseAuth;
const db = window.firebaseDB;

// DOM elements for the Auth area
const authForm = document.getElementById('auth-form');
const userInfo = document.getElementById('user-info');
const emailInput = document.getElementById('auth-email');
const passwordInput = document.getElementById('auth-password');
const signInButton = document.getElementById('auth-signin');
const signUpButton = document.getElementById('auth-signup');
const signOutButton = document.getElementById('auth-signout');
const userEmailDisplay = document.getElementById('user-email');

// Handle Sign In
signInButton?.addEventListener('click', async () => {
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    if (!email || !password) {
        alert("Please enter both email and password.");
        return;
    }

    try {
        await auth.signInWithEmailAndPassword(email, password);
        console.log('User signed in successfully.');
    } catch (error) {
        console.error('Error signing in:', error);
        alert('Error signing in: ' + error.message);
    }
});

// Handle Sign Up
signUpButton?.addEventListener('click', async () => {
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();
    const username = prompt("Please enter a username:");

    if (!email || !password || !username) {
        alert("Please fill in all fields (email, password, and username).");
        return;
    }

    try {
        // Create user with email and password
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;

        // Save the user information in Firestore
        await db.collection('users').doc(user.uid).set({
            username: username,
            email: email,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        });

        console.log('User signed up and document created in Firestore.');
    } catch (error) {
        console.error('Error signing up:', error);
        alert('Error signing up: ' + error.message);
    }
});

// Handle Sign Out
signOutButton?.addEventListener('click', async () => {
    try {
        await auth.signOut();
        console.log('User signed out successfully.');
    } catch (error) {
        console.error('Error signing out:', error);
        alert('Error signing out: ' + error.message);
    }
});

// Display user info or auth form based on authentication state
auth.onAuthStateChanged(async (user) => {
    if (user) {
        // Fetch the username from Firestore
        try {
            const userDoc = await db.collection('users').doc(user.uid).get();
            const userData = userDoc.data();

            if (userData && userData.username) {
                userEmailDisplay.textContent = `Welcome, ${userData.username}`;
            } else {
                userEmailDisplay.textContent = `Welcome, ${user.email}`;
            }

            // Show the sign-out button and user info
            userInfo.style.display = 'block';
            authForm.style.display = 'none';
        } catch (error) {
            console.error('Error fetching user data:', error);
            alert('Error fetching user information: ' + error.message);
        }
    } else {
        // No user is signed in, show the auth form
        userInfo.style.display = 'none';
        authForm.style.display = 'block';
    }
});