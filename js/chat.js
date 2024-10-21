// js/chat.js

// Ensure the script runs after the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('chat.js: DOM fully loaded and parsed.');
    initializeChat();
});

// Access Firebase services via the global window object
const storage = window.storage;
console.log('chat.js: Accessing Firebase Storage:', storage);

// DOM Elements
const channelsList = document.getElementById('channels-list');
const createChannelBtn = document.getElementById('create-channel-btn');
const createChannelModal = document.getElementById('createChannelModal');
const closeModalSpans = document.querySelectorAll('.modal .close');
const createChannelForm = document.getElementById('createChannelForm');
const chatBox = document.getElementById('chat-box');
const chatForm = document.getElementById('chatForm');
const messageInput = document.getElementById('message');
const currentChannelName = document.getElementById('current-channel-name');

// Current Selected Channel
let currentChannelId = null;

// Initialize Chat Function
function initializeChat() {
    console.log('initializeChat: Initializing chat functionality.');

    // Verify that Firebase Auth is initialized
    if (!window.auth) {
        console.error('initializeChat: Firebase Auth is not initialized. window.auth is undefined.');
        displayChatError('Authentication is not initialized. Please refresh the page.');
        return;
    }

    // Listen to authentication state changes
    window.auth.onAuthStateChanged(user => {
        console.log('initializeChat: Auth state changed. User:', user);
        if (user) {
            fetchChannels(user.uid);
        } else {
            displayChatError('Please log in to view and participate in channels.');
            displayChatUI(false);
        }
    });
}

// Fetch Channels from Firestore
function fetchChannels(userId) {
    console.log(`fetchChannels: Fetching channels for user ID: ${userId}`);

    const channelsRef = window.db.collection('channels').orderBy('createdAt', 'asc');

    channelsRef.onSnapshot(snapshot => {
        console.log('fetchChannels: Received channel snapshot.');
        channelsList.innerHTML = ''; // Clear existing channels

        snapshot.forEach(doc => {
            const channel = doc.data();
            const channelId = doc.id;
            const channelName = channel.name;

            const li = document.createElement('li');
            li.textContent = channelName;
            li.dataset.channelId = channelId;
            li.addEventListener('click', () => selectChannel(channelId, channelName));

            // Highlight the active channel
            if (channelId === currentChannelId) {
                li.classList.add('active');
            }

            channelsList.appendChild(li);
        });

        // If no channel is selected, select the first one
        if (!currentChannelId && snapshot.size > 0) {
            const firstChannel = snapshot.docs[0];
            selectChannel(firstChannel.id, firstChannel.data().name);
        }
    }, error => {
        console.error('fetchChannels: Error fetching channels:', error);
        displayChatError('Error fetching channels. Please try again later.');
    });
}

// Select a Channel
function selectChannel(channelId, channelName) {
    console.log(`selectChannel: Channel selected. ID: ${channelId}, Name: ${channelName}`);
    currentChannelId = channelId;
    currentChannelName.textContent = channelName;

    // Highlight the active channel
    const allChannels = channelsList.querySelectorAll('li');
    allChannels.forEach(li => {
        if (li.dataset.channelId === channelId) {
            li.classList.add('active');
        } else {
            li.classList.remove('active');
        }
    });

    // Load Messages for the selected channel
    loadMessages(channelId);
}

// Load Messages for a Channel
function loadMessages(channelId) {
    console.log(`loadMessages: Loading messages for channel ID: ${channelId}`);
    chatBox.innerHTML = ''; // Clear existing messages

    const messagesRef = window.db.collection('channels').doc(channelId).collection('messages').orderBy('timestamp', 'asc');

    messagesRef.onSnapshot(snapshot => {
        console.log('loadMessages: Received message snapshot.');
        chatBox.innerHTML = ''; // Clear and re-render messages

        snapshot.forEach(doc => {
            const message = doc.data();
            renderMessage(message, doc.id);
        });

        // Scroll to the latest message
        chatBox.scrollTop = chatBox.scrollHeight;
    }, error => {
        console.error('loadMessages: Error fetching messages:', error);
        displayChatError('Error fetching messages. Please try again later.');
    });
}

// Render a Single Message
function renderMessage(messageData, messageId) {
    console.log(`renderMessage: Rendering message ID: ${messageId}`);
    const messageElement = document.createElement('div');
    messageElement.classList.add('chat-message-container');

    // Determine if the message is from the current user
    const isUser = window.auth.currentUser && window.auth.currentUser.uid === messageData.userId;
    messageElement.classList.add(isUser ? 'user-message' : 'admin-message');

    // Create a container for the profile picture and message content
    const messageWrapper = document.createElement('div');
    messageWrapper.classList.add('message-wrapper');

    // Create a profile image element
    const img = document.createElement('img');
    img.src = messageData.profileImage || 'images/default-avatar.png';
    img.alt = "Profile Image";
    img.classList.add('chat-profile-image');

    // Create a container for the username and the chat bubble
    const contentWrapper = document.createElement('div');
    contentWrapper.classList.add('content-wrapper');

    // Create a username element
    const usernameElement = document.createElement('div');
    usernameElement.classList.add('chat-username');
    usernameElement.textContent = messageData.username || 'Anonymous'; // Display username or fallback to 'Anonymous'

    // Create message content container (chat bubble)
    const contentDiv = document.createElement('div');
    contentDiv.classList.add('message-content');

    // Create message text
    const textSpan = document.createElement('span');
    textSpan.classList.add('message-text');
    textSpan.textContent = messageData.message;

    // Create timestamp
    const timestampSpan = document.createElement('span');
    timestampSpan.classList.add('message-timestamp');
    const date = messageData.timestamp ? messageData.timestamp.toDate() : new Date();
    timestampSpan.textContent = formatTimestamp(date);

    // Append username and chat message to contentWrapper
    contentWrapper.appendChild(usernameElement);
    contentWrapper.appendChild(contentDiv);

    // Append text and timestamp to content (chat bubble)
    contentDiv.appendChild(textSpan);
    contentDiv.appendChild(timestampSpan);

    // Append profile image and contentWrapper to messageWrapper
    messageWrapper.appendChild(img);
    messageWrapper.appendChild(contentWrapper);

    if (isUser) {
        messageElement.addEventListener('click', () => toggleMessageMenu(messageId, messageElement, messageData.message));
    }

    // Append messageWrapper to messageElement
    messageElement.appendChild(messageWrapper);

    // Append message element to chat box
    chatBox.appendChild(messageElement);
}

// Function to toggle the message options menu (Edit/Delete)
function toggleMessageMenu(messageId, messageElement, originalMessageText) {
    console.log(`toggleMessageMenu: Toggling menu for message ID: ${messageId}`);
    const messageWrapper = messageElement.querySelector('.message-wrapper'); // Target the message wrapper

    // Check if a menu already exists
    let existingMenu = document.querySelector('.message-menu');
    if (existingMenu) {
        // If the menu is open and the same message is clicked again, close the menu
        if (existingMenu.parentElement === messageWrapper) {
            console.log('toggleMessageMenu: Closing existing menu.');
            existingMenu.remove();
            return;
        } else {
            console.log('toggleMessageMenu: Removing other open menu.');
            existingMenu.remove(); // Close any other open menu
        }
    }

    // Create a small contextual menu
    const menu = document.createElement('div');
    menu.classList.add('message-menu');

    // Add Edit option
    const editOption = document.createElement('div');
    editOption.textContent = 'Edit';
    editOption.classList.add('message-option');
    editOption.addEventListener('click', () => {
        console.log(`toggleMessageMenu: Edit option clicked for message ID: ${messageId}`);
        editMessage(messageId, originalMessageText, messageElement);
        menu.remove(); // Close the menu after the action
    });

    // Add Delete option
    const deleteOption = document.createElement('div');
    deleteOption.textContent = 'Delete';
    deleteOption.classList.add('message-option');
    deleteOption.addEventListener('click', () => {
        console.log(`toggleMessageMenu: Delete option clicked for message ID: ${messageId}`);
        deleteMessage(messageId);
        menu.remove(); // Close the menu after the action
    });

    // Append options to the menu
    menu.appendChild(editOption);
    menu.appendChild(deleteOption);

    // Append the menu to the message wrapper
    messageWrapper.appendChild(menu);

    // Calculate and set the menu position (next to the message wrapper)
    const wrapperRect = messageWrapper.getBoundingClientRect();
    const menuWidth = 100; // Approximate width of the menu
    const menuPadding = 10; // Padding between message and menu

    // Default to positioning the menu to the right of the message wrapper
    let menuLeftPosition = wrapperRect.right + menuPadding;

    // Check if the menu would go off the right edge of the viewport
    if (menuLeftPosition + menuWidth > window.innerWidth) {
        // If it would, position it to the left of the message wrapper instead
        menuLeftPosition = wrapperRect.left - menuWidth - menuPadding;
    }

    // Set the menu position
    menu.style.top = `${wrapperRect.top + window.scrollY}px`; // Adjust Y position relative to scroll
    menu.style.left = `${menuLeftPosition}px`; // Position based on calculated value

    console.log(`toggleMessageMenu: Menu positioned at (${menu.style.left}, ${menu.style.top})`);

    // Add a click event listener to the document to close the menu when clicking outside
    document.addEventListener('click', (event) => {
        if (!menu.contains(event.target) && !messageWrapper.contains(event.target)) {
            console.log('toggleMessageMenu: Click outside menu detected. Closing menu.');
            menu.remove();
        }
    }, { once: true }); // Remove the listener after it's triggered once
}

// Function to delete a message by its ID
async function deleteMessage(messageId) {
    console.log(`deleteMessage: Attempting to delete message ID: ${messageId}`);
    if (confirm("Are you sure you want to delete this message?")) {
        try {
            const user = window.auth.currentUser;
            if (!user) {
                console.error('deleteMessage: No user is currently logged in.');
                alert("You must be logged in to delete a message.");
                return;
            }

            // Delete the message from Firestore
            await window.db.collection('channels').doc(currentChannelId).collection('messages').doc(messageId).delete();
            console.log(`deleteMessage: Message ID: ${messageId} deleted successfully.`);
        } catch (error) {
            console.error(`deleteMessage: Error deleting message ID: ${messageId}`, error);
            alert("Error deleting message: " + error.message);
        }
    } else {
        console.log('deleteMessage: Deletion cancelled by user.');
    }
}

// Function to edit a message
function editMessage(messageId, originalMessageText, messageElement) {
    console.log(`editMessage: Editing message ID: ${messageId}`);
    const newMessage = prompt("Edit your message:", originalMessageText);
    if (newMessage && newMessage.trim() !== "") {
        window.db.collection('channels').doc(currentChannelId).collection('messages').doc(messageId).update({
            message: newMessage
        }).then(() => {
            // Update the displayed message
            const textSpan = messageElement.querySelector('.message-text');
            if (textSpan) {
                textSpan.textContent = newMessage;
                console.log(`editMessage: Message ID: ${messageId} updated successfully.`);
            } else {
                console.warn(`editMessage: Unable to find message-text span for message ID: ${messageId}.`);
            }
        }).catch((error) => {
            console.error(`editMessage: Error updating message ID: ${messageId}`, error);
            alert("Error updating message: " + error.message);
        });
    } else {
        console.log(`editMessage: No new message provided for message ID: ${messageId}. Edit cancelled.`);
    }
}

// Format Timestamp
function formatTimestamp(date) {
    const hours = date.getHours() % 12 || 12;
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = date.getHours() >= 12 ? 'PM' : 'AM';
    return `${hours}:${minutes} ${ampm}`;
}

// Send Message
chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const messageText = messageInput.value.trim();
    console.log(`chatForm: Submit event triggered. Message text: "${messageText}"`);

    if (messageText === '' || !currentChannelId) {
        console.warn('chatForm: Message is empty or no channel selected. Aborting send.');
        return;
    }

    const user = window.auth.currentUser;
    if (!user) {
        console.error('chatForm: No user is currently logged in.');
        alert('You must be logged in to send messages.');
        return;
    }

    try {
        console.log('chatForm: Fetching user data from Firestore.');
        // Fetch user data from Firestore
        const userDoc = await window.db.collection('users').doc(user.uid).get();
        const userData = userDoc.data();

        if (!userData) {
            console.warn(`chatForm: No user data found for user ID: ${user.uid}. Using default values.`);
        }

        // Add message to Firestore
        await window.db.collection('channels').doc(currentChannelId).collection('messages').add({
            userId: user.uid,
            username: userData?.username || user.email,
            profileImage: userData?.profileImage || 'images/default-avatar.png',
            message: messageText,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });

        console.log('chatForm: Message sent successfully.');
        // Clear input field
        messageInput.value = '';
    } catch (error) {
        console.error('chatForm: Error sending message:', error);
        alert('There was an error sending your message. Please try again.');
    }
});

// Create Channel Modal Handling

// Open Create Channel Modal
createChannelBtn.addEventListener('click', () => {
    console.log('Create Channel button clicked. Opening modal.');
    createChannelModal.style.display = 'block';
});

// Close Create Channel Modal when clicking on any close span
closeModalSpans.forEach(span => {
    span.addEventListener('click', () => {
        console.log('Modal close button clicked. Closing modal.');
        createChannelModal.style.display = 'none';
    });
});

// Close Create Channel Modal when clicking outside the modal content
window.addEventListener('click', (event) => {
    if (event.target === createChannelModal) {
        console.log('Click outside modal detected. Closing Create Channel modal.');
        createChannelModal.style.display = 'none';
    }
});

// Create Channel
createChannelForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const channelNameInput = document.getElementById('channel-name');
    const channelName = channelNameInput.value.trim();
    console.log(`createChannelForm: Submit event triggered. Channel name: "${channelName}"`);

    if (channelName === '') {
        console.warn('createChannelForm: Channel name is empty. Aborting create.');
        alert('Channel name cannot be empty.');
        return;
    }

    const user = window.auth.currentUser;
    if (!user) {
        console.error('createChannelForm: No user is currently logged in.');
        alert('You must be logged in to create channels.');
        return;
    }

    try {
        console.log('createChannelForm: Creating new channel in Firestore.');
        // Add new channel to Firestore
        await window.db.collection('channels').add({
            name: channelName,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            createdBy: user.uid
        });

        console.log(`createChannelForm: Channel "${channelName}" created successfully.`);
        // Reset form and close modal
        createChannelForm.reset();
        createChannelModal.style.display = 'none';
    } catch (error) {
        console.error('createChannelForm: Error creating channel:', error);
        alert('There was an error creating the channel. Please try again.');
    }
});

// Utility Functions

/**
 * Displays an error message in the chat UI.
 * @param {string} message - The error message to display.
 */
function displayChatError(message) {
    console.error(`displayChatError: ${message}`);
    // You can customize this function to display errors in the UI as needed
    chatBox.innerHTML = `<p class="error">${message}</p>`;
}

/**
 * Displays or hides the chat UI based on the user's authentication status.
 * @param {boolean} isAuthenticated - Whether the user is authenticated.
 */
function displayChatUI(isAuthenticated) {
    if (isAuthenticated) {
        // Show chat UI elements
        channelsList.parentElement.style.display = 'block';
        chatBox.parentElement.style.display = 'block';
        currentChannelName.parentElement.style.display = 'block';
    } else {
        // Hide chat UI elements
        channelsList.parentElement.style.display = 'none';
        chatBox.parentElement.style.display = 'none';
        currentChannelName.parentElement.style.display = 'none';
    }
}
