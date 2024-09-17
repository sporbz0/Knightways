// js/chat.js

auth = window.firebaseAuth;
db = window.firebaseDB;


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
    messageElement.classList.add('chat-message');

    // Determine if the message is from the current user
    const isUser = auth.currentUser && auth.currentUser.uid === messageData.userId;
    messageElement.classList.add(isUser ? 'user-message' : 'admin-message');

    // Create profile image
    const img = document.createElement('img');
    img.src = messageData.profileImage || 'images/default-avatar.png';
    img.alt="Profile Image";
    img.classList.add('chat-profile-image');

    // Create message content container
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

    // Append text and timestamp to content
    contentDiv.appendChild(textSpan);
    contentDiv.appendChild(timestampSpan);

    // Append image and content to message element
    messageElement.appendChild(img);
    messageElement.appendChild(contentDiv);

    // Append message to chat box
    chatBox.appendChild(messageElement);
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
