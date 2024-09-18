auth = window.firebaseAuth;
db = window.firebaseDB;


// DOM Elements
const tipForm = document.getElementById('tipForm');
const tipTextInput = document.getElementById('tipText');
const tipCategorySelect = document.getElementById('tipCategory');

const generalTipsList = document.getElementById('generalTipsList');
const transportationTipsList = document.getElementById('transportationTipsList');
const studyTipsList = document.getElementById('studyTipsList');

// Listen for the form submission
tipForm.addEventListener('submit', async function(e) {
    e.preventDefault(); // Prevent the form from refreshing the page

    // Get the values from the form
    const tipText = tipTextInput.value.trim();
    const tipCategory = tipCategorySelect.value;

    if (tipText === "") {
        alert("Please enter a tip.");
        return;
    }

    // Get current user information (if authenticated)
    const user = auth.currentUser;
    const username = user ? (user.displayName || user.email) : "Anonymous";
    const userId = user ? user.uid : null;

    // Save the tip to Firestore
    try {
        await db.collection('tips').add({
            text: tipText,
            category: tipCategory,
            username: username,
            userId: userId, // Add userId for security rules
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        // Clear the form fields
        tipTextInput.value = '';
        tipCategorySelect.value = 'general';
    } catch (error) {
        console.error("Error adding tip: ", error);
        alert("There was an error adding your tip. Please try again.");
    }
});

// Function to render a tip with user image and username
async function renderTip(doc) {
    const tip = doc.data();
    const tipElement = document.createElement('li');
    tipElement.classList.add('tip-item');

    // Default values for profile image and username
    let profileImage = 'images/default-avatar.png'; // Default avatar
    let username = tip.username || 'Anonymous'; // Default username if not available

    // Fetch user's profile image and username from Firestore if userId exists
    if (tip.userId) {
        try {
            const userDoc = await db.collection('users').doc(tip.userId).get();
            if (userDoc.exists) {
                const userData = userDoc.data();
                // Update profileImage and username if they exist in the Firestore document
                profileImage = userData.profileImage || profileImage;
                username = userData.username || username;
            }
        } catch (error) {
            console.error("Error fetching user data: ", error);
        }
    }

    // Create image element for profile picture
    const img = document.createElement('img');
    img.src = profileImage;
    img.alt = 'Profile Image';
    img.classList.add('tip-profile-image');

    // Create content element for the tip text with username
    const content = document.createElement('span');
    content.textContent = `${username}: ${tip.text}`;

    // Append the profile image and content to the tip element
    tipElement.appendChild(img);
    tipElement.appendChild(content);

    // Append to the corresponding category list
    if (tip.category === 'general') {
        generalTipsList.appendChild(tipElement);
    } else if (tip.category === 'transportation') {
        transportationTipsList.appendChild(tipElement);
    } else if (tip.category === 'study') {
        studyTipsList.appendChild(tipElement);
    }
}


// Listen for real-time updates and display tips
db.collection('tips').orderBy('createdAt', 'desc').onSnapshot(snapshot => {
    snapshot.docChanges().forEach(async change => {
        if (change.type === 'added') {
            await renderTip(change.doc);
        }
        // Handle 'modified' and 'removed' if needed
    });
});
