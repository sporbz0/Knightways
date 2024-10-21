// js/theme.js

// Ensure Firebase is initialized and services are available
const auth = window.firebaseAuth;
const db = window.firebaseDB;

// Define all available themes in a central array
const allThemes = [
    'light-theme',
    'dark-theme',
    'blue-theme',
    'green-theme',
    'purple-theme',
    'solarized-theme',
    'minimalist-theme',
    'neon-theme',
    'monochrome-theme'
];

// Function to apply a theme by adding the corresponding class to <body>
function applyTheme(theme) {
    const body = document.body;

    // Remove all existing theme classes
    body.classList.remove(...allThemes);

    // Add the selected theme class if it's a valid theme
    if (allThemes.includes(theme)) {
        body.classList.add(theme);
    } else {
        // Default to 'light-theme' if invalid theme is provided or no theme
        body.classList.add('light-theme');
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
        if (userDoc.exists && userDoc.data().theme && allThemes.includes(userDoc.data().theme)) {
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
            // Ensure the theme is valid before saving
            if (allThemes.includes(theme)) {
                await db.collection('users').doc(user.uid).update({
                    theme: theme
                });
                console.log('Theme saved to Firestore.');
            } else {
                console.warn(`Attempted to save invalid theme: ${theme}`);
            }
        } catch (error) {
            console.error('Error saving theme to Firestore:', error);
        }
    } else {
        // If no user is logged in, save to localStorage if valid
        if (allThemes.includes(theme)) {
            localStorage.setItem('selectedTheme', theme);
            console.log('Theme saved to localStorage.');
        } else {
            console.warn(`Attempted to save invalid theme to localStorage: ${theme}`);
        }
    }
}

// Function to populate the theme selector dropdown dynamically (Optional)
function populateThemeSelector(themeSelector) {
    // Clear existing options
    themeSelector.innerHTML = '';

    // Create and append an option for each theme
    allThemes.forEach((theme) => {
        // Capitalize the first letter and replace hyphens with spaces for display
        const displayName = theme.replace('-', ' ').replace(/\b\w/g, char => char.toUpperCase());
        const option = document.createElement('option');
        option.value = theme;
        option.textContent = displayName;
        themeSelector.appendChild(option);
    });
}

// Event listener for DOMContentLoaded to apply the theme on page load
document.addEventListener('DOMContentLoaded', () => {
    // Listen to authentication state changes
    auth.onAuthStateChanged(async (user) => {
        // Load and apply the user's theme
        await loadUserTheme(db, user);

        // If the current page has a theme selector, set up its event listener
        const themeSelector = document.getElementById('theme-selector');
        if (themeSelector) {
            // Optionally populate the theme selector dynamically
            populateThemeSelector(themeSelector);

            // Determine the current theme
            let currentTheme = 'light-theme'; // default
            if (user) {
                const userDoc = await db.collection('users').doc(user.uid).get();
                if (userDoc.exists && userDoc.data().theme && allThemes.includes(userDoc.data().theme)) {
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
