// js/auth.js

(function() {
    console.log('auth.js: Script started.');

    // Check if auth.js has already been initialized
    if (window.authInitialized) {
        console.warn('auth.js: Already initialized.');
        return;
    }
    window.authInitialized = true;

    // Verify that Firebase services are available
    if (!window.firebaseAuth || !window.firebaseDB || !window.firebaseStorage) {
        console.error('auth.js: Firebase services are not available. Ensure firebase-config.js is loaded correctly.');
        return;
    }

    // Attach Firebase services to the global window object
    window.auth = window.firebaseAuth;
    window.db = window.firebaseDB;
    window.storage = window.firebaseStorage;

    console.log('auth.js: Firebase services attached to window object.');
    console.log('auth.js: window.auth:', window.auth);
    console.log('auth.js: window.db:', window.db);
    console.log('auth.js: window.storage:', window.storage);

    // Check for the existence of required DOM elements
    const authForm = document.getElementById('auth-form');
    const userInfo = document.getElementById('user-info');
    const emailInput = document.getElementById('auth-email');
    const passwordInput = document.getElementById('auth-password');
    const signInButton = document.getElementById('auth-signin');
    const signUpButton = document.getElementById('auth-signup');
    const signOutButton = document.getElementById('auth-signout');
    const userEmailDisplay = document.getElementById('user-email');
    const authError = document.getElementById('auth-error');
    const authLoading = document.getElementById('auth-loading'); // For loading spinner

    // Array of required element IDs
    const requiredElements = [
        authForm, userInfo, emailInput, passwordInput,
        signInButton, signUpButton, signOutButton,
        userEmailDisplay, authError, authLoading
    ];

    // Check if any required element is missing
    const missingElements = [];
    requiredElements.forEach((elem, index) => {
        if (!elem) {
            missingElements.push([
                'authForm',
                'userInfo',
                'emailInput',
                'passwordInput',
                'signInButton',
                'signUpButton',
                'signOutButton',
                'userEmailDisplay',
                'authError',
                'authLoading'
            ][index]);
        }
    });

    if (missingElements.length > 0) {
        console.error(`auth.js: One or more required DOM elements are missing in the HTML: ${missingElements.join(', ')}`);
        return; // Exit the script to prevent further errors
    }

    console.log('auth.js: All required DOM elements are present.');

    // Function to show the loading spinner
    function showAuthLoading() {
        authLoading.style.display = 'block';
        console.log('auth.js: Showing loading spinner.');
    }

    // Function to hide the loading spinner
    function hideAuthLoading() {
        authLoading.style.display = 'none';
        console.log('auth.js: Hiding loading spinner.');
    }

    // Function to handle Sign In
    async function handleSignIn() {
        console.log('auth.js: handleSignIn called.');
        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();

        if (!email || !password) {
            displayAuthError("Please enter both email and password.");
            console.warn('auth.js: Email or password is empty.');
            return;
        }

        try {
            clearAuthError();
            showAuthLoading();
            await window.auth.signInWithEmailAndPassword(email, password);
            console.log('auth.js: User signed in successfully.');
        } catch (error) {
            console.error('auth.js: Error signing in:', error);
            displayAuthError('Error signing in: ' + error.message);
        } finally {
            hideAuthLoading();
        }
    }

    // Function to handle Sign Up
    async function handleSignUp() {
        console.log('auth.js: handleSignUp called.');
        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();
        const username = prompt("Please enter a username:");

        if (!email || !password || !username) {
            displayAuthError("Please fill in all fields (email, password, and username).");
            console.warn('auth.js: Missing email, password, or username.');
            return;
        }

        try {
            clearAuthError();
            showAuthLoading();
            // Create user with email and password
            const userCredential = await window.auth.createUserWithEmailAndPassword(email, password);
            const user = userCredential.user;

            // Save the user information in Firestore
            await window.db.collection('users').doc(user.uid).set({
                username: username,
                email: email,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                theme: 'light-theme' // Initialize with default theme
            });

            console.log('auth.js: User signed up and document created in Firestore.');
        } catch (error) {
            console.error('auth.js: Error signing up:', error);
            displayAuthError('Error signing up: ' + error.message);
        } finally {
            hideAuthLoading();
        }
    }

    // Function to handle Sign Out
    async function handleSignOut() {
        console.log('auth.js: handleSignOut called.');
        try {
            await window.auth.signOut();
            console.log('auth.js: User signed out successfully.');
        } catch (error) {
            console.error('auth.js: Error signing out:', error);
            displayAuthError('Error signing out: ' + error.message);
        }
    }

    // Function to display authentication errors
    function displayAuthError(message) {
        authError.textContent = message;
        authError.classList.add('visible');
        authError.style.display = 'block'; // Ensure it's visible
        console.log(`auth.js: Displaying auth error: ${message}`);
    }

    // Function to clear authentication errors
    function clearAuthError() {
        authError.textContent = '';
        authError.classList.remove('visible');
        authError.style.display = 'none'; // Hide the error message
        console.log('auth.js: Clearing auth error.');
    }

    // Function to display user info or auth form based on authentication state
    function updateUI(user) {
        if (user) {
            console.log('auth.js: User is signed in:', user.email);
            // Fetch the username from Firestore
            window.db.collection('users').doc(user.uid).get().then((doc) => {
                if (doc.exists) {
                    const userData = doc.data();
                    userEmailDisplay.textContent = `Welcome, ${userData.username || user.email}`;
                    console.log('auth.js: Fetched user data:', userData);
                } else {
                    userEmailDisplay.textContent = `Welcome, ${user.email}`;
                    console.warn('auth.js: No user data found in Firestore.');
                }

                // Show the user info and hide the auth form
                userInfo.style.display = 'flex'; // Using 'flex' based on CSS
                authForm.style.display = 'none';
                console.log('auth.js: Showing user info and hiding auth form.');
            }).catch((error) => {
                console.error('auth.js: Error fetching user data:', error);
                displayAuthError('Error fetching user information: ' + error.message);
            });
        } else {
            console.log('auth.js: No user is signed in.');
            // No user is signed in, show the auth form and hide user info
            userInfo.style.display = 'none';
            authForm.style.display = 'block';
            console.log('auth.js: Showing auth form and hiding user info.');
        }
    }

    // Attach Event Listeners
    signInButton.addEventListener('click', (e) => {
        e.preventDefault(); // Prevent form submission
        console.log('auth.js: Sign In button clicked.');
        handleSignIn();
    });

    signUpButton.addEventListener('click', (e) => {
        e.preventDefault(); // Prevent form submission
        console.log('auth.js: Sign Up button clicked.');
        handleSignUp();
    });

    signOutButton.addEventListener('click', (e) => {
        e.preventDefault(); // Prevent default button behavior
        console.log('auth.js: Sign Out button clicked.');
        handleSignOut();
    });

    // Listen to authentication state changes
    window.auth.onAuthStateChanged((user) => {
        console.log('auth.js: Auth state changed. User:', user);
        updateUI(user);
    });

})();
