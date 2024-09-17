// js/theme.js

// Check if Firebase is initialized and Firebase services are available
auth = window.firebaseAuth;
db = window.firebaseDB;


// Function to apply a theme by adding the corresponding class to <body>
function applyTheme(theme) {
    const body = document.body;

    // Remove existing theme classes
    body.classList.remove('dark-theme', 'blue-theme', 'green-theme');

    // Add the selected theme class if it's a valid theme
    const validThemes = ['dark-theme', 'blue-theme', 'green-theme'];
    if (validThemes.includes(theme)) {
        body.classList.add(theme);
    } else {
        // Default to light theme if invalid theme is provided or no theme
        body.classList.remove(...validThemes);
    }
}

// Function to detect system theme preference
function detectSystemTheme() {
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    return prefersDark ? 'dark-theme' : 'light-theme';
}

// Function to load the theme from Firestore and apply it
async function loadUserTheme(db, user) {
    if (!user) {
        // If no user is logged in, apply theme from localStorage or system preference
        const storedTheme = localStorage.getItem('selectedTheme') || detectSystemTheme();
        applyTheme(storedTheme);
        return;
    }

    try {
        const userDoc = await db.collection('users').doc(user.uid).get();
        if (userDoc.exists && userDoc.data().theme) {
            const userTheme = userDoc.data().theme;
            applyTheme(userTheme);
        } else {
            // If user document doesn't exist or no theme is set, apply default
            applyTheme('light-theme');
        }
    } catch (error) {
        console.error('Error fetching user theme:', error);
        // Fallback to localStorage or default theme
        const storedTheme = localStorage.getItem('selectedTheme') || detectSystemTheme();
        applyTheme(storedTheme);
    }
}

// Function to save the selected theme to Firestore or localStorage
async function saveUserTheme(db, user, theme) {
    if (user) {
        try {
            await db.collection('users').doc(user.uid).update({
                theme: theme
            });
            console.log('Theme saved to Firestore.');
        } catch (error) {
            console.error('Error saving theme to Firestore:', error);
        }
    } else {
        // If no user is logged in, save to localStorage
        localStorage.setItem('selectedTheme', theme);
        console.log('Theme saved to localStorage.');
    }
}

// Event listener for DOMContentLoaded to apply the theme on page load
document.addEventListener('DOMContentLoaded', () => {
    // Get Firebase services
    const auth = window.firebaseAuth;
    const db = window.firebaseDB;

    // Listen to authentication state changes
    auth.onAuthStateChanged(async (user) => {
        // Load and apply the user's theme
        await loadUserTheme(db, user);

        // If the current page has a theme selector, set up its event listener
        const themeSelector = document.getElementById('theme-selector');
        if (themeSelector) {
            // Set the selector's value to the current theme
            let currentTheme = 'light-theme'; // default
            if (user) {
                const userDoc = await db.collection('users').doc(user.uid).get();
                if (userDoc.exists && userDoc.data().theme) {
                    currentTheme = userDoc.data().theme;
                }
            } else {
                currentTheme = localStorage.getItem('selectedTheme') || detectSystemTheme();
            }
            themeSelector.value = currentTheme;

            // Listen for changes in the theme selector
            themeSelector.addEventListener('change', async (event) => {
                const selectedTheme = event.target.value;
                applyTheme(selectedTheme);
                await saveUserTheme(db, user, selectedTheme);
            });
        }

        // Handle Reset Theme Button if exists
        const resetThemeBtn = document.getElementById('reset-theme-btn');
        if (resetThemeBtn) {
            resetThemeBtn.addEventListener('click', async () => {
                const defaultTheme = 'light-theme';
                applyTheme(defaultTheme);
                await saveUserTheme(db, user, defaultTheme);

                // Update the theme selector's value if it exists
                if (themeSelector) {
                    themeSelector.value = defaultTheme;
                }
            });
        }
    });
});
