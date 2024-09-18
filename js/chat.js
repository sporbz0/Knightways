// js/chat.js

auth = window.firebaseAuth;
db = window.firebaseDB;
const storage = window.firebaseStorage;

// DOM Elements
const channelsList = document.getElementById('channels-list');
const createChannelBtn = document.getElementById('create-channel-btn');
const createChannelModal = document.getElementById('createChannelModal');
const closeModalSpan = document.querySelector('.modal .close');
const createChannelForm = document.getElementById('createChannelForm');
const chatBox = document.getElementById('chat-box');
const chatForm = document.getElementById('chatForm');
const messageInput = document.getElementById('message');
const currentChannelName = document.getElementById('current-channel-name');

// Current Selected Channel
let currentChannelId = null;

// Initialize Chat
function initializeChat() {
    auth.onAuthStateChanged(user => {
        if (user) {
            fetchChannels(user.uid);
        } else {
            // Redirect to login page or show a message
            channelsList.innerHTML = '<li>Please log in to view channels.</li>';
            chatBox.innerHTML = '<p>Please log in to participate in chats.</p>';
            currentChannelName.textContent = 'Not Logged In';
        }
    });
}

// Fetch Channels from Firestore
function fetchChannels(userId) {
    const channelsRef = db.collection('channels').orderBy('createdAt', 'asc');

    channelsRef.onSnapshot(snapshot => {
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
        console.error('Error fetching channels:', error);
    });
}

// Select a Channel
function selectChannel(channelId, channelName) {
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
    chatBox.innerHTML = ''; // Clear existing messages

    const messagesRef = db.collection('channels').doc(channelId).collection('messages').orderBy('timestamp', 'asc');

    messagesRef.onSnapshot(snapshot => {
        chatBox.innerHTML = ''; // Clear and re-render messages
        snapshot.forEach(doc => {
            const message = doc.data();
            renderMessage(message, doc.id);
        });
        // Scroll to the latest message
        chatBox.scrollTop = chatBox.scrollHeight;
    }, error => {
        console.error('Error fetching messages:', error);
    });
}

// Render a Single Message
function renderMessage(messageData, messageId) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('chat-message-container');

    // Determine if the message is from the current user
    const isUser = auth.currentUser && auth.currentUser.uid === messageData.userId;
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
    const messageWrapper = messageElement.querySelector('.message-wrapper'); // Target the message wrapper

    // Check if a menu already exists
    let existingMenu = document.querySelector('.message-menu');
    if (existingMenu) {
        // If the menu is open and the same message is clicked again, close the menu
        if (existingMenu.parentElement === messageWrapper) {
            existingMenu.remove();
            return;
        } else {
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
        editMessage(messageId, originalMessageText, messageElement);
        menu.remove(); // Close the menu after the action
    });

    // Add Delete option
    const deleteOption = document.createElement('div');
    deleteOption.textContent = 'Delete';
    deleteOption.classList.add('message-option');
    deleteOption.addEventListener('click', () => {
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

    // Add a click event listener to the document to close the menu when clicking outside
    document.addEventListener('click', (event) => {
        if (!menu.contains(event.target) && !messageWrapper.contains(event.target)) {
            menu.remove();
        }
    }, { once: true }); // Remove the listener after it's triggered once
}


// Function to delete a message by its ID
async function deleteMessage(messageId) {
    if (confirm("Are you sure you want to delete this message?")) {
        try {
            const user = auth.currentUser;
            if (!user) {
                alert("You must be logged in to delete a message.");
                return;
            }

            // Delete the message from Firestore
            await db.collection('channels').doc(currentChannelId).collection('messages').doc(messageId).delete();
            console.log("Message deleted successfully.");
        } catch (error) {
            console.error("Error deleting message: ", error);
            alert("Error deleting message: " + error.message);
        }
    }
}

// Function to edit a message
function editMessage(messageId, originalMessageText, messageElement) {
    const newMessage = prompt("Edit your message:", originalMessageText);
    if (newMessage && newMessage.trim() !== "") {
        db.collection('channels').doc(currentChannelId).collection('messages').doc(messageId).update({
            message: newMessage
        }).then(() => {
            // Update the displayed message
            const textSpan = messageElement.querySelector('.message-text');
            textSpan.textContent = newMessage;
            console.log("Message updated successfully.");
        }).catch((error) => {
            console.error("Error updating message: ", error);
            alert("Error updating message: " + error.message);
        });
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
    if (messageText === '' || !currentChannelId) return;

    const user = auth.currentUser;
    if (!user) {
        alert('You must be logged in to send messages.');
        return;
    }

    try {
        // Fetch user data from Firestore
        const userDoc = await db.collection('users').doc(user.uid).get();
        const userData = userDoc.data();

        // Add message to Firestore
        await db.collection('channels').doc(currentChannelId).collection('messages').add({
            userId: user.uid,
            username: userData.username || user.email,
            profileImage: userData.profileImage || 'images/default-avatar.png',
            message: messageText,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });

        // Clear input field
        messageInput.value = '';
    } catch (error) {
        console.error('Error sending message:', error);
        alert('There was an error sending your message. Please try again.');
    }
});

// Create Channel Modal Handling
createChannelBtn.addEventListener('click', () => {
    createChannelModal.style.display = 'block';
});

closeModalSpan.addEventListener('click', () => {
    createChannelModal.style.display = 'none';
});

window.addEventListener('click', (event) => {
    if (event.target === createChannelModal) {
        createChannelModal.style.display = 'none';
    }
});

// Create Channel
createChannelForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const channelNameInput = document.getElementById('channel-name');
    const channelName = channelNameInput.value.trim();
    if (channelName === '') return;

    const user = auth.currentUser;
    if (!user) {
        alert('You must be logged in to create channels.');
        return;
    }

    try {
        // Add new channel to Firestore
        await db.collection('channels').add({
            name: channelName,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            createdBy: user.uid
        });

        // Reset form and close modal
        createChannelForm.reset();
        createChannelModal.style.display = 'none';
    } catch (error) {
        console.error('Error creating channel:', error);
        alert('There was an error creating the channel. Please try again.');
    }
});

// Initialize Chat on Page Load
document.addEventListener('DOMContentLoaded', () => {
    initializeChat();
});
